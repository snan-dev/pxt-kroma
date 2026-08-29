# Plan de tareas

División del desarrollo en documentos de implementación. Cada tarea deriva de `docs/ESPECIFICACION.md` y no existe ninguna tarea que no satisfaga al menos un requisito.

**Regla de orden:** las tareas 0 y 1 son bloqueantes para todo lo demás. De la 2 en adelante, cada una es independiente y puede reordenarse según lo que convenga probar primero con la placa.

**Regla de arranque:** una tarea no comienza si toca un requisito con una ambigüedad abierta en la tabla de `ESPECIFICACION.md`. Resolver la ambigüedad es parte del trabajo previo, no del documento de implementación.

---

## Trazabilidad

Toda la especificación está cubierta y ninguna tarea es huérfana.

| Requisito | Tarea |
|---|---|
| GEN-1, GEN-3 | 1 |
| GEN-2 | 7 (revisión global), 8 (verificado también en inglés) |
| GEN-4, GEN-5 | 2 (patrón), verificado en 3 a 6 |
| GEN-6 | 0, verificado en 8 |
| DIG-1, DIG-2, DIG-3, DIG-4 | 2 |
| ANA-1, ANA-2, ANA-3, ANA-4 | 3 |
| SRV-1, SRV-2, SRV-3 | 4 |
| MOT-1, MOT-2, MOT-3, MOT-4, MOT-5, MOT-6 | 5 |
| ULT-1, ULT-2, ULT-3 | 6 |
| DOC-1, DOC-2 | 7 |
| SAL-1, SAL-2, SAL-3 | 9 |

---

## Tarea 0 — Esqueleto del paquete

**Satisface:** GEN-6
**Bloqueada por:** nada — D4 y D5 resueltas

Repositorio `pxt-kroma` ya creado localmente. Resta: completar el manifiesto, crear los archivos vacíos con su namespace, el README inicial y el programa de prueba mínimo. No produce bloques.

**Criterio de aceptación:** la extensión se importa en MakeCode desde su repositorio sin errores, y el paquete se resuelve correctamente como dependencia (sus archivos aparecen listados en el editor, sin errores de compilación).

La aparición de la categoría KROMA en la paleta, con su nombre e ícono, **no es parte de este criterio**: se verificó empíricamente que MakeCode no renderiza ninguna categoría —ni siquiera con las anotaciones de color e ícono puestas— para un namespace que no exporta ningún bloque; el paquete completo se mostró como "undefined" en el explorador de archivos. Es una restricción de la plataforma, no un defecto del código de la Tarea 0. Esa verificación queda diferida a la Tarea 2, que es la que agrega el primer bloque real.

**Cierre adicional:** el criterio de permanencia de identificadores (GEN-6) queda registrado como convención en `CLAUDE.md` antes de que exista el primer bloque.

---

## Tarea 1 — Tablas de correspondencia y su verificación

**Satisface:** GEN-1, GEN-3
**Bloqueante para:** toda tarea que toque un puerto

Enumerados públicos y tablas de la sección 4 de `ARQUITECTURA.md`, más el script de invariantes.

**Criterios de aceptación:**
- El enumerado de puertos ofrece exactamente seis opciones, rotuladas con los números impresos en la placa.
- El enumerado restringido de puertos con pin nativo ofrece exactamente dos opciones: 4 y 6.
- El enumerado de motores ofrece exactamente dos opciones: A y B.
- El script de invariantes falla si se introduce a mano cualquiera de estos errores, verificado uno por uno: un puerto duplicado, un canal de PWM repetido, un pin del expansor repetido, un canal del conversor repetido, un pin del micro:bit asignado a dos funciones.

Este último criterio importa: un verificador que nunca se probó contra un error real no es un verificador.

---

## Tarea 2 — Salidas y entradas digitales

**Satisface:** DIG-1, DIG-2, DIG-3, DIG-4; establece el patrón para GEN-4 y GEN-5

La más simple de las que tocan hardware. Valida todo el andamiaje: tablas, inicialización perezosa, separación entre bloque y driver, manejo del bus. DIG-4 (lectura) se agrega por decisión de Santi del 2026-08-29 al reabrir D2: es simétrica a la escritura, mismo origen por puerto, mismo driver.

**Criterios de aceptación:** los de DIG-1, DIG-2, DIG-3 y DIG-4 tal como están redactados en la especificación, más:
- Un programa cuya única instrucción sea el bloque de escritura, o cuya única instrucción sea el bloque de lectura, produce el efecto/resultado esperado en la primera ejecución, sin ningún bloque previo (GEN-4).
- Ninguno de los dos bloques expone nombre de chip, pin ni canal (GEN-2 en su porción).
- La categoría KROMA aparece en la paleta con su nombre e ícono, ahora que existe al menos un bloque exportado — verificación diferida desde la Tarea 0.

**Es la tarea de referencia.** Los patrones que se fijen acá se repiten en las siguientes, y el revisor los va a usar como base de comparación.

**Retoque retroactivo (2026-08-29):** los bloques `digitalOutput`/`digitalInput` pasaron de `group="Digital"` a `subcategory="Output"`/`subcategory="Input"` al adoptarse la organización de paleta en subcategorías de `ARQUITECTURA.md` §2.1. Sin impacto en `blockId` (GEN-6) ni en criterios de aceptación.

---

## Tarea 3 — Entradas analógicas

**Satisface:** ANA-1, ANA-2, ANA-3, ANA-4
**Bloqueada por:** nada — D1, D3 y D6 (porción ANA) resueltas

Driver del conversor por I2C para los puertos 4 a 6, y lectura de pin nativo para los puertos 1 a 3.

**Criterios de aceptación:** los de ANA-1 a ANA-4 tal como están redactados, con los márgenes de tolerancia ya declarados en `ARQUITECTURA.md` como parte de la resolución de D6.

**Cierre adicional:** las decisiones D1 y D3 quedan registradas con su fundamento en `ARQUITECTURA.md`, sección 8, y su estado pasa a resuelto en `ESPECIFICACION.md`.

**Retoque retroactivo (2026-08-29):** `analogInput` pasó de `group="Analog"` a `subcategory="Input"` al adoptarse la organización de paleta en subcategorías de `ARQUITECTURA.md` §2.1. Sin impacto en `blockId` (GEN-6) ni en criterios de aceptación.

---

## Tarea 4 — Servos

**Satisface:** SRV-1, SRV-2, SRV-3

Driver del PCA9685, frecuencia fija al inicializar, conversión de ángulo a ancho de pulso.

**Criterios de aceptación:** los de SRV-1 a SRV-3 tal como están redactados.

---

## Tarea 5 — Motores

**Satisface:** MOT-1, MOT-2, MOT-3, MOT-4, MOT-5, MOT-6

Driver del TB6612 por pines directos, con bajada del período de PWM al inicializar.

**Criterios de aceptación:** los de MOT-1 a MOT-6 tal como están redactados, más una verificación de interacción con la tarea 4:
- Con dos servos manteniendo posición y ambos motores girando a velocidad media, ni los servos vibran ni los motores cambian de comportamiento. Descarta el conflicto de canales internos de PWM.

MOT-6 es el criterio que más fácil se pasa por alto y el que primero va a notar un docente.

**Verificación de interacción con la Tarea 9 (agregada 2026-08-29):** con la salida analógica activa en el puerto 4 o 6 (si la Tarea 9 ya está cerrada) y un motor girando a baja velocidad, ninguno de los dos pierde el período que configuró — ver `ARQUITECTURA.md` §3.9. Si Tarea 9 se cierra después, la verificación corre al cerrar esa.

---

## Tarea 6 — Sensor ultrasónico

**Satisface:** ULT-1, ULT-2, ULT-3
**Bloqueada por:** D6

Disparo y medición de eco sobre la misma línea.

**Criterios de aceptación:** los de ULT-1 a ULT-3 tal como están redactados.

ULT-2 se verifica mirando el selector del bloque en el editor, no probando que falle en otro puerto: el requisito es que la opción no exista.

---

## Tarea 7 — Documentación y revisión de superficie

**Satisface:** DOC-1, DOC-2, GEN-2 completo

README para el docente, protocolo de verificación consolidado, y revisión de toda la superficie pública de una sola pasada con `revisor-didactico`.

**Criterios de aceptación:** los de DOC-1 y DOC-2 tal como están redactados, más:
- Una búsqueda de vocabulario técnico sobre todas las cadenas visibles no devuelve resultados (GEN-2).
- Todo requisito de la especificación tiene su tarea marcada como cerrada, y toda tarea cerrada cita los requisitos que satisfizo.

---

## Tarea 8 — Traducción a inglés y capa de localización en español

**Satisface:** D4 (revisada 2026-08-29), GEN-2 y GEN-3 (verificados también sobre el inglés), GEN-6 (verificación de que no se rompe)
**Bloqueada por:** nada de forma estricta. Se puede ejecutar de forma incremental, archivo por archivo, a medida que cada tarea (2 a 7) se va cerrando, o como pasada final una vez cerrada la Tarea 7. Si se hace incremental, cada tarea que toque bloques nuevos nace directamente en inglés con su entrada en el locale, en vez de traducirse después.

Contexto: D4 se revierte por decisión consciente de Santi, tomada el 2026-08-29. El código fuente pasa a ser en inglés (incluida la superficie visible al docente); el español para el docente se preserva vía `_locales/es-ES/` (`es-ES` es el código de locale que usa el target `microbit`, no `es`; verificado contra `pxtarget.json` y contra `pxt-neopixel` como paquete de referencia ya localizado). Ver `ARQUITECTURA.md` §8.

**Alcance:**

1. **Código interno → inglés.** Todo identificador no visible (variables, funciones) y todo comentario de código pasa a inglés. Ejemplo tomado de `ARQUITECTURA.md` §6.2: `inicializado` → `initialized`, `asegurarInicializado()` → `ensureInitialized()`. Evaluar también traducir los nombres de archivo (`motores.ts` → `motors.ts`, `servos.ts` → `servos.ts`, `analogico.ts` → `analog.ts`, `digital.ts` → `digital.ts`, `ultrasonido.ts` → `ultrasonic.ts`, `tablas.ts` → `tables.ts`, `placa.ts` → `board.ts`). Renombrar archivos no rompe `blockId` ni proyectos guardados de docentes — solo hay que actualizar los imports/referencias internas.

2. **Superficie pública de bloques → inglés como idioma base.**
   - El atributo `block="..."` de cada bloque pasa de español a inglés.
   - Nombres de parámetro visibles, rótulos de los enumerados (puertos, motores A/B, etc.) y nombres de los grupos de la paleta → inglés.
   - jsdoc / tooltips visibles en el editor → inglés.
   - **No se toca:** el `blockId` (el atributo interno que MakeCode persiste, distinto del string visible `block=`). Ya está en inglés por la D4 original y GEN-6 exige que sea permanente — esta tarea no lo modifica bajo ninguna circunstancia.
   - El nombre visible del paquete/categoría ("KROMA") es nombre propio y no se traduce.

3. **Archivo de traducción (`_locales/es-ES/`).**
   - Crear `_locales/es-ES/pxt-kroma-strings.json` (cadenas de bloques) y `_locales/es-ES/pxt-kroma-jsdoc-strings.json` (tooltips/jsdoc), siguiendo el mecanismo estándar de localización de PXT/MakeCode para paquetes de terceros.
   - Antes de generarlos, confirmar contra la documentación oficial de PXT (o un paquete de referencia ya localizado) el nombre exacto de archivo y la forma del JSON para la versión de pxt-core/target que usa este proyecto — no asumir la convención sin verificarla, puede variar entre versiones.
   - Contenido de la traducción en esta primera pasada: el mismo texto en español que hoy existe en el código fuente (el que ya pasó por `revisor-didactico`), como valor de cada clave en inglés. No es una retraducción desde cero.
   - Efecto esperado: un docente con el editor de MakeCode/Ceibal configurado en español ve los bloques igual que hoy; con el editor en inglés, ve inglés.

4. **README y documentación para el docente — decisión pendiente, no incluida en el alcance de D4.** D4 revisada habla de "cadenas fuente" (bloques, jsdoc, comentarios), no de prosa como el README. Antes de tocarlo, confirmar con Santi si el README se traduce, se duplica en dos idiomas, o se deja solo en español porque el público de Plan Ceibal es hispanohablante. No traducir el README como efecto colateral de esta tarea sin esa confirmación.

**Criterios de aceptación:**
- GEN-2 (sin vocabulario técnico en la superficie) se cumple también sobre las cadenas en inglés, no solo sobre el locale en español.
- `tools/check-tablas.js` sigue funcionando: si se traducen los comentarios-marcador `// @tabla:<nombre>:inicio` / `:fin` de `tablas.ts` (sección 6.5 de `ARQUITECTURA.md`), el script se actualiza en el mismo cambio para buscar el texto nuevo. (Hecho: los marcadores pasaron a `// @table:<nombre>:start` / `:end` en `tables.ts`, y `check-tablas.js` se actualizó para buscarlos junto con los nuevos nombres de campo en inglés.)

Quedan fuera de los criterios de aceptación, por depender de placa/editor y no ser verificables leyendo código: que el locale se vea igual en el editor de MakeCode configurado en español, y que un proyecto de docente guardado antes de esta tarea siga abriendo sin error. Ver hallazgo 3 de `PENDIENTES.md`.

**Cierre adicional:** actualizar `ARQUITECTURA.md` §5 (estructura de archivos) agregando `_locales/` y los nombres de archivo si se renombraron, y §7 (flujos principales) si corresponde.

---

## Tarea 9 — Salida analógica

**Satisface:** SAL-1, SAL-2, SAL-3
**Agregada:** 2026-08-29, a partir de una pregunta de Santi durante la planificación de Tarea 2, sobre si la salida analógica podía apoyarse en el chip de los servos (PCA9685).

No se apoya en el PCA9685: ese chip tiene una sola frecuencia compartida por los seis canales (§3.5), fijada para servos, así que cualquier puerto que dependiera de él tendría el parpadeo de 50 Hz en vez de una atenuación prolija — y no se puede variar por puerto sin afectar a los servos de los demás. La única línea capaz de dar una frecuencia propia, independiente de los servos, es el pin nativo del micro:bit — y eso solo existe en los puertos 4 y 6 (los mismos que el sensor ultrasónico, por el mismo motivo: son los únicos con pin directo). Ver `ARQUITECTURA.md` §3.8.

Driver nuevo (`analogOutput.ts`) usando `pins.analogWritePin` sobre P9/P12, sin tocar el PCA9685 en absoluto.

**Confirmado (2026-08-29), ya no es solo un punto a verificar:** el período de PWM nativo del micro:bit no es independiente por pin — ver `ARQUITECTURA.md` §3.9 y `microsoft/pxt-microbit#4950`. No afecta a los servos (van por PCA9685/I2C), pero sí puede interactuar con los motores de la Tarea 5, que también ajustan el período de un pin nativo.

**Criterios de aceptación:** los de SAL-1, SAL-2 y SAL-3 tal como están redactados, más:
- El bloque no expone la palabra "PWM" ni ninguna otra del vocabulario prohibido por GEN-2.
- Valores fuera de 0–100 se acotan al extremo correspondiente (GEN-5).
- Con un motor girando a baja velocidad (Tarea 5, si ya está cerrada) y la salida analógica activa, ninguno de los dos pierde el período que configuró. Si Tarea 5 se cierra después, la verificación corre al cerrar esa.

---

## Verificación previa a la tarea 1

**Procedimiento V0 de `VERIFICACION.md`**: confirmar la orientación de las torres de conectores con la placa en la mano, sin escribir código de la extensión.

Son dos minutos y validan las tablas de la tarea 1, sobre las que se apoya todo lo demás. Si esta verificación falla, las tablas están invertidas y las cinco tareas siguientes producirían bloques que no funcionan.

---

## Consultas pendientes al proveedor

Se llevan en `PENDIENTES.md`, con su estado. Son independientes del desarrollo, pero conviene enviarlas ya porque las respuestas pueden llegar tarde.
