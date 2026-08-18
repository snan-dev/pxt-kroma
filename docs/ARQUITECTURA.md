# ARQUITECTURA

**Plan técnico.** Describe cómo se construye lo que `docs/ESPECIFICACION.md` pide: qué módulos existen, qué exporta cada uno, cómo fluyen las operaciones y qué tablas de correspondencia rigen.

## Cadena de autoridad

1. **`docs/ESPECIFICACION.md`** define qué debe hacer la extensión. Es prescriptivo y manda sobre todo lo demás.
2. **Este documento** define cómo se construye. Es **prescriptivo** para la superficie pública de bloques y para las tablas de correspondencia: el código debe ajustarse a lo que dice acá, no al revés. Para el interior de los drivers es **descriptivo**: registra lo que se implementó, y se actualiza al cerrar cada tarea.
3. **El código** deriva de ambos.

Una discrepancia entre este documento y el código se reporta al desarrollador. Nunca se corrige el documento para que coincida con el código, ni el código para que coincida con el documento, sin confirmación explícita.

La distinción del punto 2 es deliberada: los identificadores de bloque son permanentes y las tablas propagan cualquier error a toda la extensión, así que ahí conviene la rigidez. Cómo un driver organiza su estado interno es reversible y contenido en un archivo, así que ahí alcanza con las convenciones de `SKILL.md`.

> **Estado: versión inicial (pre-implementación).** Describe la arquitectura acordada, no código existente. Cada tarea del plan debe actualizar la parte descriptiva al cerrar.

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
| 1 | micro:bit P0 (10 bits) | Expansor, pin 0 | 2 |
| 2 | micro:bit P1 (10 bits) | Expansor, pin 1 | 1 |
| 3 | micro:bit P2 (10 bits) | Expansor, pin 2 | 0 |
| 4 | ADS1015, canal 2 (12 bits) | micro:bit P9 | 3 |
| 5 | ADS1015, canal 1 (12 bits) | Expansor, pin 3 | 4 |
| 6 | ADS1015, canal 0 (12 bits) | micro:bit P12 | 5 |

Notar los dos cruces: los canales del expansor y los del PCA9685 **no siguen el orden de los puertos**.

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
tablas.ts                   # Enumerados públicos y tablas de correspondencia (datos puros)
placa.ts                    # Namespace público: todos los bloques visibles
motores.ts                  # Driver TB6612, pines directos
servos.ts                   # Driver PCA9685, I2C
analogico.ts                # ADS1015 + pines nativos, I2C y directo
digital.ts                  # PCA9536 + pines nativos
ultrasonido.ts              # Sensor de distancia (puertos 4 y 6)
test.ts                     # Programa de prueba (no se compila en el paquete)
tools/
  check-tablas.js           # Verificación de invariantes de las tablas (Node, cero dependencias)
docs/
  ESPECIFICACION.md         # Qué debe hacer la extensión (prescriptivo, manda)
  ARQUITECTURA.md           # Este documento
  PLAN-DE-TAREAS.md         # Descomposición con trazabilidad a requisitos
  VERIFICACION.md           # Protocolo de verificación con la placa física
  PENDIENTES.md             # Backlog
.claude/agents/
  revisor-kroma.md
  revisor-didactico-kroma.md
CLAUDE.md
```

---

## 6. Convenciones de módulo

### 6.1 Separación entre bloques y drivers

`placa.ts` contiene **únicamente** los bloques públicos: anotaciones, validación de argumentos y delegación. La lógica de hardware vive en los módulos de driver. Un bloque no habla I2C directamente.

Razón: permite revisar la superficie pública —que es lo que ve el docente— sin leer el código de hardware.

### 6.2 Inicialización perezosa e idempotente

En MakeCode no se puede exigir que el usuario arrastre un bloque de inicialización: se va a olvidar. Cada driver mantiene una bandera interna y se inicializa solo en su primer uso.

```
let inicializado = false
function asegurarInicializado(): void {
    if (inicializado) return
    // configuración del chip
    inicializado = true
}
```

Toda función pública de un driver empieza llamando a `asegurarInicializado()`.

### 6.3 Espejo en memoria del registro de salida

El expansor PCA9536 guarda los cuatro pines en un solo byte, de modo que cambiar uno exige leer-modificar-escribir. En vez de leer el chip en cada operación, el driver mantiene una copia en memoria del último valor escrito.

Ahorra una transacción I2C por operación y elimina una dependencia de lectura. La copia se inicializa a cero durante `asegurarInicializado()`, que es el estado real tras configurar el chip.

### 6.4 Nada de literales de mapeo fuera de `tablas.ts`

Ningún módulo escribe un número de canal, un número de pin del expansor ni una dirección I2C. Todo se obtiene de `tablas.ts`. Los cruces documentados en la sección 4 son demasiado fáciles de equivocar como para repetirlos.

---

## 7. Flujos principales

*(A completar durante la implementación. Cada tarea documenta acá su flujo.)*

- **Leer valor analógico de un puerto:** pendiente
- **Escribir en la línea digital de un puerto:** pendiente
- **Mover un servo:** pendiente
- **Mover un motor:** pendiente
- **Leer distancia:** pendiente

---

## 8. Decisiones de implementación

Las ambigüedades que **bloquean tareas** viven en la tabla de `docs/ESPECIFICACION.md`, no acá. Esta sección registra las decisiones técnicas ya tomadas, con su fundamento, a medida que se cierran.

Cada tarea que resuelve una ambigüedad deja acá el fundamento y cambia su estado a resuelta en la especificación.

### Decisiones tomadas

**D4 — Idioma de las cadenas fuente: español directo.** Todo texto visible al docente se escribe en español en el código fuente, sin `_locales/`. El público es exclusivamente hispanohablante y una capa de traducción agregaría un archivo que mantener sin beneficio real. Si en el futuro hiciera falta otro idioma, se agrega un locale sobre las cadenas existentes sin tocar el código.

Consecuencia práctica: los `blockId` siguen siendo identificadores en inglés y sin acentos, porque no son visibles y deben ser estables. Lo que va en español es el atributo `block`, los nombres de parámetro visibles, los rótulos de los enumerados y los grupos de la paleta.

**D5 — Nombre.** Paquete y repositorio `pxt-kroma`. Nombre visible en el editor: KROMA.

### Márgenes de tolerancia declarados

Los criterios de aceptación de ANA-2, ANA-3, ANA-4, ULT-1 y ULT-3 hacen referencia a márgenes declarados en este documento. Se fijan al resolver D6 y se registran acá.

*(Pendiente.)*
