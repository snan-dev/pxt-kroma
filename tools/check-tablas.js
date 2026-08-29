// Verificación de invariantes de las tablas de correspondencia en tablas.ts.
// Sin dependencias externas: solo fs y path de Node.
// Ver docs/ARQUITECTURA.md §6.5.

"use strict";

const fs = require("fs");
const path = require("path");

const RUTA_TABLAS = path.join(__dirname, "..", "tablas.ts");

function leerFuente() {
    return fs.readFileSync(RUTA_TABLAS, "utf8");
}

// Extrae el texto entre "// @tabla:<nombre>:inicio" y "// @tabla:<nombre>:fin",
// exigiendo que cada marcador aparezca exactamente una vez.
function extraerFragmento(fuente, nombreTabla) {
    const marcadorInicio = `// @tabla:${nombreTabla}:inicio`;
    const marcadorFin = `// @tabla:${nombreTabla}:fin`;

    const vecesInicio = fuente.split(marcadorInicio).length - 1;
    const vecesFin = fuente.split(marcadorFin).length - 1;

    if (vecesInicio !== 1) {
        throw new Error(`marcador "${marcadorInicio}" debe aparecer exactamente una vez (aparece ${vecesInicio}).`);
    }
    if (vecesFin !== 1) {
        throw new Error(`marcador "${marcadorFin}" debe aparecer exactamente una vez (aparece ${vecesFin}).`);
    }

    const indiceInicio = fuente.indexOf(marcadorInicio) + marcadorInicio.length;
    const indiceFin = fuente.indexOf(marcadorFin);

    if (indiceFin < indiceInicio) {
        throw new Error(`marcador "${marcadorFin}" aparece antes que "${marcadorInicio}".`);
    }

    return fuente.slice(indiceInicio, indiceFin);
}

// Dentro de un fragmento puede haber una o más declaraciones
// "export const NOMBRE = <literal>". Devuelve { NOMBRE: valor, ... }.
function evaluarDeclaraciones(fragmento) {
    const regexDeclaracion = /export\s+const\s+(\w+)\s*=\s*/g;
    const coincidencias = [];
    let m;
    while ((m = regexDeclaracion.exec(fragmento)) !== null) {
        coincidencias.push({
            nombre: m[1],
            indiceDeclaracion: m.index,
            indiceValor: regexDeclaracion.lastIndex,
        });
    }

    if (coincidencias.length === 0) {
        throw new Error('no se encontró ninguna declaración "export const" en el fragmento.');
    }

    const resultado = {};
    for (let i = 0; i < coincidencias.length; i++) {
        const actual = coincidencias[i];
        const siguiente = coincidencias[i + 1];
        const finValor = siguiente ? siguiente.indiceDeclaracion : fragmento.length;
        let textoValor = fragmento.slice(actual.indiceValor, finValor).trim();
        if (textoValor.endsWith(";")) {
            textoValor = textoValor.slice(0, -1).trim();
        }
        resultado[actual.nombre] = new Function("return (" + textoValor + ")")();
    }
    return resultado;
}

// Busca la primera colisión de valor entre los items ({ valor, etiqueta }).
function buscarColision(items) {
    const vistos = new Map();
    for (const item of items) {
        if (vistos.has(item.valor)) {
            return [vistos.get(item.valor), item];
        }
        vistos.set(item.valor, item);
    }
    return null;
}

function verificar(nombre, items) {
    const colision = buscarColision(items);
    if (colision) {
        const [a, b] = colision;
        return {
            ok: false,
            mensaje: `${nombre}: valor ${JSON.stringify(a.valor)} usado dos veces: ${a.etiqueta} y ${b.etiqueta}`,
        };
    }
    return { ok: true, mensaje: `${nombre}: sin colisiones (${items.length} valores)` };
}

function main() {
    let fuente;
    try {
        fuente = leerFuente();
    } catch (err) {
        console.error(`No se pudo leer ${RUTA_TABLAS}: ${err.message}`);
        process.exit(1);
    }

    let datosPuertos, datosMotores;
    try {
        datosPuertos = evaluarDeclaraciones(extraerFragmento(fuente, "puertos"));
        datosMotores = evaluarDeclaraciones(extraerFragmento(fuente, "motores"));
    } catch (err) {
        console.error(`Error al extraer las tablas de ${RUTA_TABLAS}: ${err.message}`);
        process.exit(1);
    }

    const TABLA_PUERTOS = datosPuertos.TABLA_PUERTOS;
    const TABLA_MOTORES = datosMotores.TABLA_MOTORES;
    const PIN_STANDBY_MOTORES = datosMotores.PIN_STANDBY_MOTORES;

    if (!Array.isArray(TABLA_PUERTOS)) {
        console.error('La tabla "puertos" no exportó un arreglo TABLA_PUERTOS.');
        process.exit(1);
    }
    if (!Array.isArray(TABLA_MOTORES)) {
        console.error('La tabla "motores" no exportó un arreglo TABLA_MOTORES.');
        process.exit(1);
    }
    if (typeof PIN_STANDBY_MOTORES !== "number") {
        console.error('La tabla "motores" no exportó un número PIN_STANDBY_MOTORES.');
        process.exit(1);
    }

    const resultados = [];

    // 1. Puerto duplicado.
    resultados.push(verificar(
        "Puerto duplicado",
        TABLA_PUERTOS.map((fila, i) => ({ valor: fila.puerto, etiqueta: `fila ${i + 1} (puerto ${fila.puerto})` }))
    ));

    // 2. Canal de PWM repetido.
    resultados.push(verificar(
        "Canal de PWM repetido",
        TABLA_PUERTOS.map(fila => ({ valor: fila.canalPWM, etiqueta: `puerto ${fila.puerto} (canal PWM)` }))
    ));

    // 3. Pin del expansor repetido.
    resultados.push(verificar(
        "Pin del expansor repetido",
        TABLA_PUERTOS
            .filter(fila => fila.digital.tipo === "expansor")
            .map(fila => ({ valor: fila.digital.pin, etiqueta: `puerto ${fila.puerto} (digital, expansor)` }))
    ));

    // 4. Canal del conversor repetido.
    resultados.push(verificar(
        "Canal del conversor repetido",
        TABLA_PUERTOS
            .filter(fila => fila.analogico.tipo === "ads1015")
            .map(fila => ({ valor: fila.analogico.canal, etiqueta: `puerto ${fila.puerto} (analógico, ADS1015)` }))
    ));

    // 5. Pin del micro:bit asignado a dos funciones.
    const pinesMicrobit = [];
    TABLA_PUERTOS.forEach(fila => {
        if (fila.analogico.tipo === "nativo") {
            pinesMicrobit.push({ valor: fila.analogico.pin, etiqueta: `puerto ${fila.puerto} (analógico)` });
        }
        if (fila.digital.tipo === "nativo") {
            pinesMicrobit.push({ valor: fila.digital.pin, etiqueta: `puerto ${fila.puerto} (digital)` });
        }
    });
    TABLA_MOTORES.forEach(motor => {
        pinesMicrobit.push({ valor: motor.pinVelocidad, etiqueta: `motor ${motor.rotulo} (velocidad)` });
        pinesMicrobit.push({ valor: motor.pinDireccion, etiqueta: `motor ${motor.rotulo} (dirección)` });
    });
    pinesMicrobit.push({ valor: PIN_STANDBY_MOTORES, etiqueta: "standby de motores" });

    resultados.push(verificar("Pin de micro:bit asignado a dos funciones", pinesMicrobit));

    let huboError = false;
    for (const r of resultados) {
        console.log(`${r.ok ? "✓" : "✗"} ${r.mensaje}`);
        if (!r.ok) huboError = true;
    }

    process.exit(huboError ? 1 : 0);
}

main();
