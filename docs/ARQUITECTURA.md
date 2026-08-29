# ARQUITECTURA

**Plan técnico.** Describe cómo se construye lo que `docs/ESPECIFICACION.md` pide: qué módulos existen, qué exporta cada uno, cómo fluyen las operaciones y qué tablas de correspondencia rigen.

## Cadena de autoridad

1. **`docs/ESPECIFICACION.md`** define qué debe hacer la extensión. Es prescriptivo y manda sobre todo lo demás.
2. **Este documento** define cómo se construye. Es **prescriptivo** para la superficie pública de bloques y para las tablas de correspondencia: el código debe ajustarse a lo que dice acá, no al revés. Para el interior de los drivers es **descriptivo**: registra lo que se implementó, y se actualiza al cerrar cada tarea.
3. **El código** deriva de ambos.

Una discrepancia entre este documento y el código se reporta al desarrollador. Nunca se corrige el documento para que coincida con el código, ni el código para que coincida con el documento, sin confirmación explícita.

La distinción del punto 2 es deliberada: los identificadores de bloque son permanentes y las tablas propagan cualquier error a toda la extensión, así que ahí conviene la rigidez. Cómo un driver organiza su estado interno es reversible y contenido en un archivo, así que ahí alcanza con las convenciones de `SKILL.md`.

> **Estado: en implementación.** Tarea 0, Tarea 1, Tarea 2 y Tarea 8 cerradas con código; el resto de las tareas del plan sigue pendiente. Tarea 8 se ejecutó como pasada temprana sobre el poco código existente (tablas y esqueleto): pasa el código fuente a inglés y agrega la capa de locale en español; las tareas 2 a 7 nacen directamente en inglés. Cada tarea que se cierre debe actualizar la parte descriptiva de este documento.

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

### 3.7 Límites de corriente

- Riel de 5 V: corta a 3 A. Un servo pequeño forzado demanda ~0,7 A. Cuatro servos bajo carga simultánea ya rozan el corte.
- Motores: ~1,2 A continuos por canal.

No son controlables por software, pero deben estar documentados en el README para el docente.

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
analog.ts                   # ADS1015 + pines nativos, I2C y directo
digital.ts                  # PCA9536 + pines nativos
ultrasonic.ts               # Sensor de distancia (puertos 4 y 6)
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

### 6.6 Todo el contenido de cada archivo vive dentro de `namespace kroma`

Un archivo del paquete que declare `export` a nivel de archivo, sin envolverlo en un `namespace`, pasa a tratarse como módulo de TypeScript: sus símbolos no exportados quedan privados de ese archivo, invisibles para el resto del paquete. `tables.ts` necesita `export` en sus tablas y enumerados para que `board.ts` y los drivers los usen sin calificar, así que todo su contenido —enumerados incluidos— va dentro de `namespace kroma { ... }`, igual que `board.ts`. Un archivo nuevo que agregue tablas o enumerados públicos debe seguir el mismo patrón.

---

## 7. Flujos principales

*(A completar durante la implementación. Cada tarea documenta acá su flujo.)*

- **Leer valor analógico de un puerto:** pendiente
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

### Márgenes de tolerancia declarados

Los criterios de aceptación de ANA-2, ANA-3, ANA-4, ULT-1 y ULT-3 hacen referencia a márgenes declarados en este documento. Se fijan al resolver D6 y se registran acá.

*(Pendiente.)*
