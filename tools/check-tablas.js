// Verificación de invariantes de las tablas de correspondencia en tables.ts.
// Sin dependencias externas: solo fs y path de Node.
// Ver docs/ARQUITECTURA.md §6.5.

"use strict";

const fs = require("fs");
const path = require("path");

const RUTA_TABLAS = path.join(__dirname, "..", "tables.ts");

function leerFuente() {
    return fs.readFileSync(RUTA_TABLAS, "utf8");
}

// Extrae el texto entre "// @table:<nombre>:start" y "// @table:<nombre>:end",
// exigiendo que cada marcador aparezca exactamente una vez.
function extraerFragmento(fuente, nombreTabla) {
    const marcadorInicio = `// @table:${nombreTabla}:start`;
    const marcadorFin = `// @table:${nombreTabla}:end`;

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
        datosPuertos = evaluarDeclaraciones(extraerFragmento(fuente, "ports"));
        datosMotores = evaluarDeclaraciones(extraerFragmento(fuente, "motors"));
    } catch (err) {
        console.error(`Error al extraer las tablas de ${RUTA_TABLAS}: ${err.message}`);
        process.exit(1);
    }

    const TABLA_PUERTOS = datosPuertos.PORT_TABLE;
    const TABLA_MOTORES = datosMotores.MOTOR_TABLE;
    const PIN_STANDBY_MOTORES = datosMotores.MOTOR_STANDBY_PIN;

    if (!Array.isArray(TABLA_PUERTOS)) {
        console.error('La tabla "ports" no exportó un arreglo PORT_TABLE.');
        process.exit(1);
    }
    if (!Array.isArray(TABLA_MOTORES)) {
        console.error('La tabla "motors" no exportó un arreglo MOTOR_TABLE.');
        process.exit(1);
    }
    if (typeof PIN_STANDBY_MOTORES !== "number") {
        console.error('La tabla "motors" no exportó un número MOTOR_STANDBY_PIN.');
        process.exit(1);
    }

    const resultados = [];

    // 1. Puerto duplicado.
    resultados.push(verificar(
        "Puerto duplicado",
        TABLA_PUERTOS.map((fila, i) => ({ valor: fila.port, etiqueta: `fila ${i + 1} (puerto ${fila.port})` }))
    ));

    // 2. Canal de PWM repetido.
    resultados.push(verificar(
        "Canal de PWM repetido",
        TABLA_PUERTOS.map(fila => ({ valor: fila.pwmChannel, etiqueta: `puerto ${fila.port} (canal PWM)` }))
    ));

    // 3. Pin del expansor repetido.
    resultados.push(verificar(
        "Pin del expansor repetido",
        TABLA_PUERTOS
            .filter(fila => fila.digital.type === "expander")
            .map(fila => ({ valor: fila.digital.pin, etiqueta: `puerto ${fila.port} (digital, expansor)` }))
    ));

    // 4. Canal del conversor repetido.
    resultados.push(verificar(
        "Canal del conversor repetido",
        TABLA_PUERTOS
            .filter(fila => fila.analog.type === "ads1015")
            .map(fila => ({ valor: fila.analog.channel, etiqueta: `puerto ${fila.port} (analógico, ADS1015)` }))
    ));

    // 5. Pin del micro:bit asignado a dos funciones.
    const pinesMicrobit = [];
    TABLA_PUERTOS.forEach(fila => {
        if (fila.analog.type === "native") {
            pinesMicrobit.push({ valor: fila.analog.pin, etiqueta: `puerto ${fila.port} (analógico)` });
        }
        if (fila.digital.type === "native") {
            pinesMicrobit.push({ valor: fila.digital.pin, etiqueta: `puerto ${fila.port} (digital)` });
        }
    });
    TABLA_MOTORES.forEach(motor => {
        pinesMicrobit.push({ valor: motor.speedPin, etiqueta: `motor ${motor.label} (velocidad)` });
        pinesMicrobit.push({ valor: motor.directionPin, etiqueta: `motor ${motor.label} (dirección)` });
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
