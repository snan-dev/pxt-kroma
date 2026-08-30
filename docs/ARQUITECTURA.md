# ARQUITECTURA

**Plan técnico.** Describe cómo se construye lo que `docs/ESPECIFICACION.md` pide: qué módulos existen, qué exporta cada uno, cómo fluyen las operaciones y qué tablas de correspondencia rigen.

## Cadena de autoridad

1. **`docs/ESPECIFICACION.md`** define qué debe hacer la extensión. Es prescriptivo y manda sobre todo lo demás.
2. **Este documento** define cómo se construye. Es **prescriptivo** para la superficie pública de bloques y para las tablas de correspondencia: el código debe ajustarse a lo que dice acá, no al revés. Para el interior de los drivers es **descriptivo**: registra lo que se implementó, y se actualiza al cerrar cada tarea.
3. **El código** deriva de ambos.

Una discrepancia entre este documento y el código se reporta al desarrollador. Nunca se corrige el documento para que coincida con el código, ni el código para que coincida con el documento, sin confirmación explícita.

La distinción del punto 2 es deliberada: los identificadores de bloque son permanentes y las tablas propagan cualquier error a toda la extensión, así que ahí conviene la rigidez. Cómo un driver organiza su estado interno es reversible y contenido en un archivo, así que ahí alcanza con las convenciones de `SKILL.md`.

> **Estado: en implementación.** Tarea 0, Tarea 1, Tarea 2, Tarea 3 y Tarea 8 cerradas con código; el resto de las tareas del plan sigue pendiente. Tarea 8 se ejecutó como pasada temprana sobre el poco código existente (tablas y esqueleto): pasa el código fuente a inglés y agrega la capa de locale en español; las tareas 2 a 7 nacen directamente en inglés. Cada tarea que se cierre debe actualizar la parte descriptiva de este documento.

---

## 1. Qué es esta extensión

**KROMA** — Kit de Robótica Maker. Extensión de MakeCode para la placa controladora y expansora de Plan Ceibal. Expone en bloques todas las capacidades de la placa: motores DC, servos, entradas analógicas, salidas digitales y sensores conectados por RJ45.

**Nombre visible en el editor:** KROMA *(provisional, sujeto a confirmación institucional)*
**Paquete y repositorio:** `pxt-kroma`
**Organización destino:** `ceibal-microbit`
**Documento de referencia del hardware:** `placa_microbit_documentacion_tecnica.md` (relevamiento del esquemático)

---

## 2. Principio de diseño rector

**El docente nombra el periférico y el puerto donde lo conectó. Nada más.**

Ningún bloque expone un pin del micro:bit, un canal de un chip, una dirección I2C ni un nombre del esquemático. Toda esa traducción vive dentro de la extensión.

Ejemplos de la forma que deben tener los bloques:

```
mover servo del puerto 3 a 90 grados
escribir en el puerto 2 el valor encendido
leer valor analógico del puerto 5
leer distancia en centímetros del puerto 4
mover motor A hacia adelante a velocidad 80
```

Corolario: el número de puerto es un **enumerado único compartido por todos los bloques**. Un docente que aprendió a usar un bloque ya sabe usar los demás.

### 2.1 Organización de la paleta en subcategorías

A medida que la extensión sume sensores y actuadores en versiones futuras, agrupar los bloques solo con subtítulos visibles en un único panel se vuelve difícil de recorrer. La paleta de KROMA se organiza en subcategorías colapsadas —el atributo `subcategory` de PXT, la misma burbuja "..." que usa la categoría Radio del target de micro:bit para "Más", generalizada a varios nombres propios en vez de uno solo—, no en `group` planos siempre visibles.

Subcategorías definidas hasta ahora, en este orden (nombre base en inglés por D4/Tarea 8; traducción en `_locales/es-ES/`):

1. **Input** → "Entrada" — lecturas genéricas sin periférico propio (entrada digital, entrada analógica).
2. **Output** → "Salida" — escritura/comando genérico (salida digital, salida analógica).
3. **Motors** → "Motores".
4. **Servos** → "Servos".
5. **Distance** → "Distancia".

Los bloques de un periférico específico (Motores, Servos, Distancia) van en su propia subcategoría aunque conceptualmente lean o escriban algo — el criterio es el periférico cuando hay uno identificable, y la dirección (lectura/escritura) solo para las capacidades genéricas de E/S sin periférico propio.

El orden de las subcategorías se fija con `//% groups='[...]'` a nivel de namespace (string con JSON adentro, no un array de JS). Por ahora no hace falta `group` adentro de cada subcategoría — todas tienen uno o dos bloques —, pero el patrón admite agregarlo después sin romper nada, como hace `4tronix/BitBot` (github.com/4tronix/BitBot/blob/master/bitbot.ts) con sus subcategorías más cargadas. Verificar la sintaxis exacta contra ese archivo antes de implementar.

### 2.2 Puertos enchufables con un bloque (agregado 2026-08-29)

El enumerado completo de seis puertos —el que comparten los bloques de entrada/salida digital, entrada analógica y, cuando se implemente, servos— no debe quedar limitado a elegir del desplegable: tiene que aceptar que se le enchufe otro bloque (una variable, una cuenta, el contador de un `for`), igual que el selector de pin de los bloques nativos de Pines de MakeCode. Sin esto, un docente no puede recorrer los seis puertos con un bucle, un ejercicio de introducción razonable con esta placa. Detectado por Santi al usar la extensión, no anticipado en la planificación original.

Mecanismo verificado contra el código fuente real de `pxt-microbit` (`libs/core/pins.ts`) y la documentación oficial de PXT (`pxt/docs/defining-blocks.md`), no asumido: el parámetro del bloque público no se tipa como el enum — se tipa `number`, y se declara con `//% port.shadow=<blockId de una función auxiliar oculta>`. Esa función auxiliar (`blockHidden=1`, su propio `blockId`, con el desplegable como field editor) es lo que aparece por defecto en el socket; al ser un bloque real y no un campo incrustado, Blockly permite reemplazarlo por cualquier otro bloque que devuelva `number`. Mismo patrón que usa `_digitalPinShadow` en `pins.ts` para el selector de pin nativo.

**Alcance: solo el enumerado completo de 6 puertos.** Los enumerados restringidos (puertos 4 y 6 únicamente, usados por el sensor de distancia y por la salida analógica) **no** se tocan — siguen siendo un desplegable puro, sin `shadow`. Volverlos enchufables reabriría exactamente lo que ULT-2 y SAL-2 impiden a propósito ("elegir otro puerto debe ser imposible, no fallar en silencio"): un valor plugueado no respeta el desplegable, así que un bloque de distancia o de salida analógica podría terminar recibiendo un puerto sin pin nativo. Decisión tomada con Santi el 2026-08-29 después de evaluar la alternativa de acotar en tiempo de ejecución también en los bloques restringidos, y descartarla por chocar directamente con esos dos criterios de aceptación ya cerrados.

**Consecuencia para GEN-5.** El puerto pasa a ser, en la práctica, un argumento numérico más — GEN-5 ("valores fuera de rango... producen el mismo resultado que el extremo correspondiente") ya lo cubre sin necesidad de tocar `ESPECIFICACION.md`. Un valor plugueado fuera de 1–6 se acota al extremo más cercano (mismo criterio que ya usa SAL-1 para 0–100), no produce comportamiento indefinido. Centralizar el acotamiento en un solo lugar (por ejemplo, la función que busca la entrada del puerto en `PORT_TABLE`) en vez de repetirlo en cada bloque — mismo espíritu que §6.4.

**Bloques a los que aplica:** `digitalOutput`, `digitalInput`, `analogInput` (retoque retroactivo sobre Tareas 2 y 3) y, de acá en más, cualquier bloque nuevo que use el enumerado completo de puertos — la Tarea 4 (Servos) nace directamente con este mecanismo, no hace falta retocarla después.

---

## 3. Restricciones de hardware que la arquitectura debe respetar

Estas no son preferencias: son límites físicos. Cualquier diseño que las ignore produce bloques que no funcionan.

### 3.1 El sensor ultrasónico solo funciona en los puertos 4 y 6

Medir distancia exige cronometrar un pulso con resolución de microsegundos. Eso solo es posible con un pin nativo del micro:bit.

| Puerto | Origen de la línea digital | ¿Sirve para ultrasónico? |
|---|---|---|
| 1, 2, 3, 5 | Expansor PCA9536, vía I2C | **No** — cada operación tarda del orden de 1 ms |
| 4 | micro:bit P9, directo | Sí |
| 6 | micro:bit P12, directo | Sí |

La misma restricción aplica a **cualquier periférico futuro que necesite leer señales rápidas** (encoders, sensores de pulso, protocolos de un hilo tipo DHT).

**Consecuencia para los bloques:** el bloque de distancia no debe ofrecer los seis puertos. Debe usar un enumerado restringido a los puertos 4 y 6, para que el error sea imposible en vez de silencioso.

### 3.2 No existe freno activo de motor

El uso de inversores lógicos para ahorrar pines elimina dos de los cuatro estados del puente H. Solo quedan adelante y atrás. Detener un motor significa llevar la velocidad a cero y dejarlo girar por inercia.

**No debe existir un bloque "frenar".** Induciría a error sobre lo que el hardware puede hacer.

### 3.3 El reposo de motores es global

La señal de standby es compartida por ambos motores. Puede haber un bloque "detener todos los motores"; no puede haber uno por motor.

### 3.4 Los rótulos de motor están cruzados respecto del esquemático

| Rótulo impreso en la placa | Motor del esquemático | Velocidad | Dirección |
|---|---|---|---|
| **A** | Motor 2 | P8 | P16 |
| **B** | Motor 1 | P15 | P14 |

Los bloques usan **A y B**, que es lo que el docente ve. Nunca "motor 1" y "motor 2".

### 3.5 La frecuencia de PWM de servos es única

El PCA9685 tiene un solo divisor interno: los seis canales comparten frecuencia. Se fija en ~50 Hz al inicializar y no se expone al usuario.

### 3.6 El PWM de motores es nativo del micro:bit

La velocidad de los motores no pasa por el PCA9685: sale de P8 y P15. El período por defecto del micro:bit es de 20 ms (50 Hz), demasiado lento para un motor: produce chillido audible y giro a tirones a baja velocidad. **Hay que bajarlo al inicializar.**

### 3.8 La salida analógica solo es posible en los puertos 4 y 6 *(agregado 2026-08-29)*

La única línea PWM que llega a los seis puertos es el canal del PCA9685 (tabla 4.1), y ese chip tiene una sola frecuencia para los seis canales (§3.5), fijada para servos y no expuesta al usuario. Usarla para una salida analógica de propósito general —atenuar un LED, por ejemplo— produciría el parpadeo visible de 50 Hz, y cambiar esa frecuencia afectaría a los servos conectados en cualquier otro puerto.

La alternativa es generar el PWM sobre el pin nativo del micro:bit, con `pins.analogWritePin`, sin pasar por el PCA9685. Eso solo es posible en los puertos con pin directo: **4 y 6**, la misma restricción de §3.1 y por el mismo motivo de fondo (son los únicos puertos con una línea que no pasa por un chip compartido).

**Consecuencia para los bloques:** igual que el sensor de distancia, el bloque de salida analógica usa un enumerado restringido a los puertos 4 y 6.

### 3.7 Límites de corriente

- Riel de 5 V: corta a 3 A. Un servo pequeño forzado demanda ~0,7 A. Cuatro servos bajo carga simultánea ya rozan el corte.
- Motores: ~1,2 A continuos por canal.

No son controlables por software, pero deben estar documentados en el README para el docente.

### 3.9 El período de PWM nativo del micro:bit no es independiente por pin *(agregado 2026-08-29)*

El manejador de PWM analógico del runtime que usa MakeCode no trata cada pin como un recurso aislado: cambiar el período en un pin puede cambiar la frecuencia efectiva de otros pines que también estén generando PWM nativo, y usar una función de servo en un pin distinto puede hacer que las frecuencias activas vuelvan a 50 Hz. Reportado en `microsoft/pxt-microbit#4950`; no hay confirmación de si difiere entre micro:bit V1 y V2.

**Consecuencia para KROMA:** los servos (PCA9685, vía I2C) no se ven afectados — nunca tocan el PWM nativo del micro:bit. Pero motores (§3.6, P8/P15) y salida analógica (§3.8, P9/P12) sí comparten este recurso: los dos ajustan el período de un pin nativo, y uno podría pisarle la configuración al otro. Verificar empíricamente al cerrar cada una — ver `PLAN-DE-TAREAS.md`.

---

## 4. Tablas de correspondencia

**Estas tablas son el corazón de la extensión y la principal fuente potencial de errores.** Viven en un único módulo de datos y nunca se duplican ni se escriben literales en otro archivo.

### 4.1 Puertos de periférico

| Puerto | Analógica: origen | Digital: origen | Canal PWM del PCA9685 |
|---|---|---|---|
| 1 | micro:bit P0 (10 bits) | Expansor, pin 2 | 2 |
| 2 | micro:bit P1 (10 bits) | Expansor, pin 1 | 1 |
| 3 | micro:bit P2 (10 bits) | Expansor, pin 0 | 0 |
| 4 | ADS1015, canal 2 (12 bits) | micro:bit P9 | 3 |
| 5 | ADS1015, canal 1 (12 bits) | Expansor, pin 3 | 4 |
| 6 | ADS1015, canal 0 (12 bits) | micro:bit P12 | 5 |

Notar los dos cruces: los canales del expansor y los del PCA9685 **no siguen el orden de los puertos**. El cruce del expansor (puertos 1 y 3 con el pin invertido respecto de la lectura directa de `HARDWARE.md` §5.2) se verificó físicamente con la placa — ver el hallazgo 1 en `docs/PENDIENTES.md` y V0 en `docs/VERIFICACION.md`.

### 4.2 Motores

| Rótulo | Pin de velocidad | Pin de dirección |
|---|---|---|
| A | P8 | P16 |
| B | P15 | P14 |

Standby compartido: P13.

### 4.3 Direcciones I2C

| Chip | Dirección | Función |
|---|---|---|
| PCA9685 | 0x40 | Servos |
| PCA9536 | 0x41 | Salidas digitales |
| ADS1015 | 0x48 | Entradas analógicas |

---

## 5. Estructura de archivos

```
pxt.json                    # Manifiesto del paquete
README.md                   # Documentación para el docente
tables.ts                   # Enumerados públicos y tablas de correspondencia (datos puros)
board.ts                    # Namespace público: todos los bloques visibles
motors.ts                   # Driver TB6612, pines directos
servos.ts                   # Driver PCA9685, I2C
analog.ts                   # ADS1015 + pines nativos, I2C y directo (entradas)
digital.ts                  # PCA9536 + pines nativos
ultrasonic.ts               # Sensor de distancia (puertos 4 y 6)
analogOutput.ts             # Salida analógica sobre pin nativo (puertos 4 y 6), Tarea 9
test.ts                     # Programa de prueba (no se compila en el paquete)
_locales/es-ES/
  pxt-kroma-strings.json        # Traducción al español de las cadenas de bloques
  pxt-kroma-jsdoc-strings.json  # Traducción al español de jsdoc/tooltips
tools/
  check-tablas.js           # Verificación de invariantes de las tablas (Node, cero dependencias)
docs/
  ESPECIFICACION.md         # Qué debe hacer la extensión (prescriptivo, manda)
  ARQUITECTURA.md           # Este documento
  PLAN-DE-TAREAS.md         # Descomposición con trazabilidad a requisitos
  VERIFICACION.md           # Protocolo de verificación con la placa física
  PENDIENTES.md             # Backlog
.claude/agents/
  revisor-placa.md
  revisor-didactico.md
CLAUDE.md
```

---

## 6. Convenciones de módulo

### 6.1 Separación entre bloques y drivers

`board.ts` contiene **únicamente** los bloques públicos: anotaciones, validación de argumentos y delegación. La lógica de hardware vive en los módulos de driver. Un bloque no habla I2C directamente.

Razón: permite revisar la superficie pública —que es lo que ve el docente— sin leer el código de hardware.

### 6.2 Inicialización perezosa e idempotente

En MakeCode no se puede exigir que el usuario arrastre un bloque de inicialización: se va a olvidar. Cada driver mantiene una bandera interna y se inicializa solo en su primer uso.

```
let initialized = false
function ensureInitialized(): void {
    if (initialized) return
    // configuración del chip
    initialized = true
}
```

Toda función pública de un driver empieza llamando a `ensureInitialized()`.

### 6.3 Espejo en memoria del registro de salida

El expansor PCA9536 guarda los cuatro pines en un solo byte, de modo que cambiar uno exige leer-modificar-escribir. En vez de leer el chip en cada operación, el driver mantiene una copia en memoria del último valor escrito.

Ahorra una transacción I2C por operación y elimina una dependencia de lectura. La copia se inicializa a cero durante `ensureInitialized()`, que es el estado real tras configurar el chip.

El PCA9536 (usado por `digital.ts`, Tarea 2) además mantiene un segundo espejo, de dirección por pin (`configMirror`), porque sus pines individuales pueden ser entrada o salida y sus salidas son push-pull. Ver el fundamento completo en la sección 8, "Dirección de pines del PCA9536 en `digital.ts`".

### 6.4 Nada de literales de mapeo fuera de `tables.ts`

Ningún módulo escribe un número de canal, un número de pin del expansor ni una dirección I2C. Todo se obtiene de `tables.ts`. Los cruces documentados en la sección 4 son demasiado fáciles de equivocar como para repetirlos.

### 6.5 Formato de las tablas para que `tools/check-tablas.js` las pueda leer

`tools/check-tablas.js` verifica las tablas de correspondencia sin depender de compilar TypeScript ni de mantener una segunda copia de los datos (lo que prohibiría la sección 6.4). Lo logra leyendo `tables.ts` como texto plano, así que cada tabla verificada por ese script debe respetar esta forma:

- El literal de la tabla va delimitado por comentarios marcadores: `// @table:<nombre>:start` y `// @table:<nombre>:end`, cada uno apareciendo exactamente una vez.
- Entre esos marcadores el literal debe ser JavaScript puro además de TypeScript válido: sin `as const`, sin anotaciones de tipo dentro del literal, sin referencias simbólicas a un enum (siempre el valor numérico crudo, nunca `Port.Port1`).

El script extrae el fragmento entre marcadores y lo evalúa con `new Function`. Cualquier tabla nueva que agregue una tarea futura y que `check-tablas.js` deba verificar tiene que seguir esta misma convención; los datos que no participan de ningún invariante (como `I2C_ADDRESSES`) pueden ir fuera de los marcadores, con tipado normal de TypeScript.

**Anotar el tipo de una tabla con campos de unión discriminada (agregado 2026-08-29).** `PORT_TABLE` mezcla filas con forma distinta según el origen (`analog.type`: `"native"` con `pin`, o `"ads1015"` con `channel`); sin un tipo literal explícito, TypeScript infiere `type: string` y no puede angostar la unión en `analog.ts`/`digital.ts` (`entry.analog.type === "native"` no habilita el acceso a `.pin`). El tipo (`PortEntry` y sus miembros `PortAnalog`/`PortDigital`) se declara **antes** del marcador `// @table:ports:start`, fuera del literal, y la anotación se aplica en la propia declaración —`export const PORT_TABLE: PortEntry[] = [...]`— nunca dentro de los objetos del arreglo (eso seguiría prohibido: nada de `as const` ni anotaciones por campo). El contenido del arreglo no cambia una letra. Como la anotación queda entre el nombre y el `=`, `evaluarDeclaraciones()` en `check-tablas.js` la tolera con un grupo opcional en su regex (`(?::[^=]+)?`); solo cambia dónde el script encuentra el signo `=`, el valor que extrae y evalúa después de él sigue siendo JavaScript puro sin tocar. El mismo patrón aplica a cualquier tabla futura cuyas filas no compartan forma.

### 6.6 Todo el contenido de cada archivo vive dentro de `namespace kroma`

Un archivo del paquete que declare `export` a nivel de archivo, sin envolverlo en un `namespace`, pasa a tratarse como módulo de TypeScript: sus símbolos no exportados quedan privados de ese archivo, invisibles para el resto del paquete. `tables.ts` necesita `export` en sus tablas y enumerados para que `board.ts` y los drivers los usen sin calificar, así que todo su contenido —enumerados incluidos— va dentro de `namespace kroma { ... }`, igual que `board.ts`. Un archivo nuevo que agregue tablas o enumerados públicos debe seguir el mismo patrón.

---

## 7. Flujos principales

*(A completar durante la implementación. Cada tarea documenta acá su flujo.)*

Desde §2.2, todo bloque que use el enumerado completo de 6 puertos recibe el parámetro de puerto como `number` (no `Port`), enchufable con `%port.shadow="kromaPortShadow"`. Antes de llegar al driver, `tables.ts` (`findPortEntry`) redondea el valor y lo acota a 1–6 (GEN-5) y ahí mismo busca la fila de `PORT_TABLE` — un solo lugar, compartido por `digital.ts` y `analog.ts`, en vez de que cada driver mantenga su propia copia de la búsqueda.

- **Leer valor analógico de un puerto:** `board.ts` (`analogInput`) delega en `analog.ts` (`readAnalog`). Este busca el origen del puerto en `PORT_TABLE`. Si es nativo (puertos 1, 2, 3), lee con `pins.analogReadPin` (10 bits, 0–1023) y remapea a 0–100 (D1). Si es del ADS1015 (puertos 4, 5, 6), escribe el registro de configuración del canal correspondiente (MUX del canal, PGA=GAIN_ONE por D3, MODE=single-shot), espera un tiempo fijo con margen sobre el tiempo de conversión teórico, lee el registro de conversión (12 bits, con signo, rango físico 0–2047), y remapea a 0–100 dividiendo por 1650 —la cuenta real que corresponde al techo de 3,3 V con esta ganancia, no el fondo de escala de 2047 (ver la recalibración de D1 más abajo)— con el mismo clamp defensivo que la rama nativa.
- **Escribir en la línea digital de un puerto:** `board.ts` (`digitalOutput`) valida el puerto y delega en `digital.ts` (`setDigital`). Este busca el origen del puerto en `PORT_TABLE` (`tables.ts`). Si es nativo (puertos 4 y 6), escribe directo con `pins.digitalWritePin`. Si es del expansor (puertos 1, 2, 3, 5), primero asegura que el bit de dirección de ese pin en el PCA9536 esté en modo salida (espejo `configMirror`, cambiándolo solo si hace falta) y después escribe el registro de salida completo (espejo `outputMirror`, §6.3).
- **Leer la línea digital de un puerto:** `board.ts` (`digitalInput`) delega en `digital.ts` (`readDigital`). Mismo origen por puerto que la escritura. Si es nativo, lee directo con `pins.digitalReadPin`. Si es del expansor, primero asegura que el bit de dirección de ese pin esté en modo entrada (mismo espejo `configMirror` que usa la escritura, cambiándolo solo si hace falta) y después lee el registro de entrada real del chip (0x00) — no el espejo de salida, que no aplica a la lectura.
- **Mover un servo:** pendiente
- **Mover un motor:** pendiente
- **Leer distancia:** pendiente

---

## 8. Decisiones de implementación

Las ambigüedades que **bloquean tareas** viven en la tabla de `docs/ESPECIFICACION.md`, no acá. Esta sección registra las decisiones técnicas ya tomadas, con su fundamento, a medida que se cierran.

Cada tarea que resuelve una ambigüedad deja acá el fundamento y cambia su estado a resuelta en la especificación.

### Decisiones tomadas

**D4 — Idioma de las cadenas fuente: inglés directo, con locale en español (revisada 2026-08-29).** Decisión original: español directo en el código fuente, sin `_locales/`. Se revierte por decisión consciente de Santi. El inglés pasa a ser el idioma base del código fuente — incluido lo que ve el docente (el atributo `block`, nombres de parámetro visibles, rótulos de enumerados, grupos de paleta, jsdoc) — y se agrega `_locales/es-ES/` con la traducción al español, siguiendo el mecanismo estándar de localización de PXT/MakeCode (`es-ES` es el código exacto que usa el target `microbit` para español, verificado contra `pxtarget.json` y contra la extensión de referencia `pxt-neopixel` al implementar la Tarea 8; no `es`). El contenido de esa traducción es, en esta primera pasada, el mismo texto en español que hoy existe en el código, para no perder lo que ya pasó por `revisor-didactico-kroma`.

Consecuencia práctica: los `blockId` no cambian — ya estaban en inglés y sin acentos por ser identificadores no visibles y estables (GEN-6); esta revisión no los toca. Lo que antes era español directo en el atributo `block` y afines pasa a inglés, y el español que el docente sigue viendo en el editor (cuando este está configurado en español) sale ahora del archivo de locale, no del código fuente. El detalle de alcance, generación del archivo de traducción y verificación queda en la Tarea 8 de `PLAN-DE-TAREAS.md`.

**D5 — Nombre.** Paquete y repositorio `pxt-kroma`. Nombre visible en el editor: KROMA.

**Dirección de pines del PCA9536 en `digital.ts` (Tarea 2).** El documento de implementación de la Tarea 2 asumía, siguiendo el código de prueba del proveedor, que el registro de configuración del PCA9536 se fija una sola vez en el arranque con los 4 pines como salida y no se vuelve a tocar. Al implementar se encontró una discrepancia: el datasheet de NXP confirma que las salidas del PCA9536 son push-pull (no quasi-bidireccionales), así que un pin dejado permanentemente como salida competiría eléctricamente con un dispositivo externo (por ejemplo, un pulsador) en vez de sensarlo — esto rompería el criterio de aceptación de DIG-4 en los puertos 1, 2, 3 y 5 (los que pasan por el expansor). Se reportó a Santi con dos alternativas y se confirmó la opción de agregar un segundo espejo en memoria, `configMirror`, que cambia el bit de dirección de un pin puntual a entrada antes de leerlo (`readDigital`) y a salida antes de escribirlo (`setDigital`), dejando los otros tres pines intactos — el patrón estándar para expansores I2C bidireccionales. El valor inicial de `configMirror` (0x0F, los 4 pines como entrada) coincide con el estado real de encendido del chip.

**D2 — Lectura digital: sí entra en el alcance de la v1 (revisada 2026-08-29).** Decisión original: fuera de alcance. Se revierte por decisión de Santi al planificar la Tarea 2. Fundamento: el origen por puerto ya está resuelto para la escritura desde la Tarea 1 (columna "Digital: origen" de la tabla 4.1) y es exactamente el mismo para la lectura — no hay tabla nueva que agregar ni cruce nuevo que investigar, así que el costo de sumarla es bajo y evita que un docente se encuentre con un hueco donde esperaría simetría (puede escribir un LED pero no leer un pulsador). El bloque de lectura usa el mismo driver de `digital.ts`: rama de pin nativo para los puertos 4 y 6, y lectura del registro de entrada del PCA9536 (registro 0x00, a diferencia del de salida que usa el espejo en memoria de §6.3) para 1, 2, 3 y 5.

**Escala de la salida analógica (SAL-1).** 0 a 100, no 0 a 1023 como en los bloques nativos de Pines de MakeCode. Se prioriza que sea legible como "porcentaje de intensidad" para un docente sin formación técnica, por sobre la coherencia con el rango que usa `pins.analogWritePin` puertas adentro — GEN-2/principio de diseño del §2 pesan más acá que la familiaridad con otras extensiones de MakeCode. La conversión de 0–100 al rango nativo del micro:bit es responsabilidad del driver, no se expone.

**D1 — Escala de la lectura analógica: 0 a 100 (resuelta 2026-08-29).** Los puertos 1 a 3 leen del ADC nativo del micro:bit (10 bits, 0–1023) y los puertos 4 a 6 del ADS1015 por I2C (12 bits); ANA-2 exige que el valor devuelto use la misma escala en los seis puertos, así que la única decisión pendiente era a qué escala normalizar. Se elige 0 a 100, por el mismo fundamento que ya se usó para la escala de salida de SAL-1 (párrafo anterior): legible como "porcentaje" para un docente sin formación técnica, y consistente con esa escala en la dirección opuesta (lectura y escritura analógica comparten el mismo lenguaje numérico). El remapeo de cada rango nativo a 0–100 es responsabilidad de `analog.ts`, no se expone.

**Recalibración de la rama ADS1015 (encontrada en verificación con la placa, 2026-08-29).** El remapeo original dividía por 2047 — el fondo de escala *configurado* del ADS1015 (±4,096 V con GAIN_ONE, D3). Pero la señal real nunca supera 3,3 V (techo eléctrico ya fijado en D3), así que un potenciómetro a fondo nunca generaba un código de 2047: con 2 mV/cuenta, 3,3 V son 1650 cuentas, y `round(1650*100/2047) = 81`. Confirmado con la placa: los puertos 1–3 (ADC nativo, calibrado 0–3,3 V = 0–1023 de fábrica) llegaban a 100 con el potenciómetro a fondo, los puertos 4–6 se quedaban en 81 — una diferencia de casi 20 puntos, muy por encima del margen de 3 puntos de ANA-2. Se corrige dividiendo por 1650 (la cuenta que corresponde a 3,3 V exactos con esta ganancia) en vez de 2047, para que "100" signifique el mismo techo físico en los seis puertos, igual que ya lo hace la rama nativa. Los márgenes de ANA-2/3/4 de más abajo seguían siendo provisorios antes de esta corrección y lo siguen siendo después — no se ajustaron con la recalibración, queda para cuando se confirmen con la placa.

**D3 — Ganancia por defecto del ADS1015: GAIN_ONE, ±4,096 V (resuelta 2026-08-29).** `HARDWARE.md` §9 ("Implicancias para la extensión") ya da el criterio: fijar la ganancia en el rango más chico que contenga la tensión de trabajo esperada, para no perder resolución. La línea analógica (contacto 6 del RJ45) es la misma señal física en los seis puertos (`HARDWARE.md` §5.1); en los puertos 1 a 3 esa línea entra directo a un pin del micro:bit, que no tolera más de 3,3 V sin riesgo de daño — eso fija el techo de la señal en 3,3 V para los seis puertos, independientemente del periférico conectado. Confirmado también de forma empírica en V0 de `VERIFICACION.md`, que puenteó la línea analógica directo a 3,3 V para la prueba de orientación de las torres. De los pasos de ganancia estándar del ADS1015, GAIN_ONE (±4,096 V, ~2 mV por cuenta) es el más chico que sigue conteniendo 3,3 V con margen; GAIN_TWOTHIRDS (±6,144 V, ~3 mV por cuenta, el valor por defecto de varias librerías de terceros) da más margen del necesario a costa de resolución, sin que la señal lo requiera.

### Márgenes de tolerancia declarados

Los criterios de aceptación de ANA-2, ANA-3, ANA-4, ULT-1 y ULT-3 hacen referencia a márgenes declarados en este documento. Se fijan al resolver D6 y se registran acá.

**ANA-2, ANA-3, ANA-4 (resuelto 2026-08-29, D6 parcial — ver `ESPECIFICACION.md`).** Sobre la escala 0–100 de D1:

- **ANA-2 (consistencia entre torres):** dos puertos con el mismo potenciómetro en la misma posición física no difieren en más de **3** puntos de escala (3% del rango).
- **ANA-3 (monotonicidad):** un barrido lento no produce saltos hacia atrás mayores a **1** punto de escala entre lecturas consecutivas.
- **ANA-4 (extremos estables):** en cada extremo del recorrido, veinte lecturas consecutivas se mantienen dentro de **1** punto de escala del valor extremo (0 o 100), sin saturar antes de llegar al tope.

Son valores de partida razonables para un ADC de 10/12 bits con el ruido típico de una lectura por I2C corta, pero no surgen de una medición sobre la placa real ni de una cifra de `HARDWARE.md`: quedan **provisorios**, sujetos a ajuste en V2 (`VERIFICACION.md`) al cerrar la Tarea 3.

**ULT-1, ULT-3:** sin resolver. D6 sigue abierta para estos dos criterios — se fija al planificar la Tarea 6, con el driver del sensor de distancia a la vista.

**Puertos enchufables con bloque (2026-08-29).** Fundamento completo en §2.2. El enumerado completo de 6 puertos acepta que se le enchufe otro bloque (patrón `shadow` de PXT, verificado contra `pxt-microbit/libs/core/pins.ts`); los enumerados restringidos a 4/6 (distancia, salida analógica) no, para no romper ULT-2/SAL-2.
