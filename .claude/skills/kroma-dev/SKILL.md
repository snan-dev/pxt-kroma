---
name: kroma-dev
description: "Skill de desarrollo para KROMA (Kit de Robótica Maker), la extensión de MakeCode del paquete pxt-kroma para la placa controladora y expansora de Plan Ceibal (motores DC, servos, entradas analógicas, salidas digitales y periféricos por RJ45). Usar esta skill cuando se pidan planificar funcionalidades, diseñar arquitectura, generar documentos de implementación para Claude Code, revisar o depurar código de la extensión, escribir documentación del proyecto, o tomar decisiones sobre el diseño de los bloques. También se activa cuando se mencionen puertos RJ45, PCA9536, PCA9685, ADS1015, TB6612, bloques de MakeCode, pxt, o cualquier cosa relacionada con esta placa. Consultar incluso para preguntas generales de desarrollo pxt cuando se esté trabajando en el contexto de este proyecto, porque contiene restricciones de hardware específicas que invalidan soluciones que en abstracto serían correctas."
---

# Skill de desarrollo — KROMA

## Cadena de autoridad

Esta skill cubre convenciones, restricciones y criterios: **cómo** se construye el proyecto y **por qué**. No define qué debe hacer la extensión ni sustituye a los documentos del repositorio.

1. **`docs/ESPECIFICACION.md`** — qué debe hacer, en términos de lo que observa el docente. Prescriptivo, manda sobre todo lo demás. Requisitos numerados con criterios de aceptación verificables.
2. **`docs/ARQUITECTURA.md`** — cómo se construye. Prescriptivo para la superficie pública de bloques y las tablas de correspondencia; descriptivo para el interior de los drivers.
3. **`docs/PLAN-DE-TAREAS.md`** — descomposición en documentos de implementación, con trazabilidad a los requisitos.
4. **Esta skill** — lo estable, lo que no cambia funcionalidad a funcionalidad.

Ninguna tarea existe sin un requisito que la justifique, y ningún requisito queda sin tarea. Una discrepancia entre documento y código se reporta al desarrollador; nunca se corrige en silencio en ninguna de las dos direcciones.

**Alcance de la formalidad.** Los requisitos numerados cubren la superficie pública de bloques y las tablas de correspondencia, porque los identificadores son permanentes y las tablas propagan cualquier error a toda la extensión. El interior de los drivers no se especifica formalmente: son decisiones reversibles y contenidas en un archivo, y ahí alcanza con las convenciones de esta skill. No agregar burocracia donde no rinde.

**Ambigüedades bloqueantes.** Una tarea no arranca si toca un requisito con una ambigüedad abierta en la tabla de `ESPECIFICACION.md`. Si se decide avanzar igual, el supuesto adoptado se escribe como tal en esa misma tabla, para poder revisarlo después.

---

## Qué es el proyecto

KROMA (Kit de Robótica Maker) es la extensión de MakeCode para una placa sobre la que se encastra el micro:bit. La placa aporta batería 18650 con carga, driver de dos motores DC, driver de seis servos, entradas analógicas de 12 bits, salidas digitales expandidas, y seis puertos de periférico por cable RJ45 más dos de motor.

Desarrollada para Plan Ceibal. Los usuarios finales son **docentes y estudiantes de educación primaria y media**, muchos sin formación en electrónica ni programación.

### Arquitectura del hardware, en una línea

Tres chips comparten el bus I2C del micro:bit (servos, entradas analógicas, salidas digitales) y un cuarto —el driver de motores— va cableado a pines directos.

---

## Principio de diseño rector

**El docente nombra el periférico y el puerto donde lo conectó. Nada más.**

Ningún bloque expone un pin del micro:bit, un canal de un chip, una dirección I2C ni un nombre del esquemático (J3A, PD2_ext, AIN1). Toda esa traducción vive dentro de la extensión.

Si al diseñar un bloque aparece la tentación de agregar un parámetro técnico "por flexibilidad", la respuesta por defecto es no. La flexibilidad se paga con confusión en el aula.

---

## Restricciones de hardware que invalidan soluciones

Estas son físicas, no negociables. Ver el detalle en `docs/ARQUITECTURA.md` sección 3.

1. **El sensor ultrasónico solo funciona en los puertos 4 y 6.** Cronometrar un pulso con resolución de microsegundos exige un pin nativo del micro:bit. En los puertos 1, 2, 3 y 5 la línea digital viene del expansor por I2C, con latencia del orden de 1 ms. Lo mismo vale para cualquier periférico futuro que lea señales rápidas.
2. **No existe freno activo de motor.** Los inversores lógicos eliminaron dos de los cuatro estados del puente H. No debe existir un bloque "frenar".
3. **El reposo de motores es global**, no por motor.
4. **Los rótulos A y B de motor están cruzados** respecto de la numeración del esquemático.
5. **La frecuencia de PWM de servos es única** para los seis canales.
6. **El PWM de motores es nativo del micro:bit** y arranca en 20 ms: hay que bajar el período al inicializar o los motores chillan y se mueven a tirones.
7. **Los canales del expansor digital y los del driver de servos están cruzados** respecto del número de puerto. Nunca escribir esos números a mano.

---

## Convenciones de código

### Generales

- **TypeScript estático de pxt.** No es TypeScript completo: sin `any` dinámico, sin closures que capturen y muten libremente, sin genéricos complejos, sin `async`/`await`. Ante la duda, escribir código simple y verificar que compila en MakeCode.
- **Español directo para todo lo visible**, escrito así en el código fuente: el atributo `block`, los nombres de parámetro visibles, los rótulos de enumerados y los grupos de la paleta. Sin capa de localización. Inglés y sin acentos para lo no visible: `blockId`, nombres de variables y de funciones internas.
- **Referencias por nombre de función, nunca por número de línea.** Los números de línea se desactualizan.
- **Separación estricta entre bloques y drivers.** `placa.ts` solo tiene anotaciones, validación y delegación. La lógica de hardware vive en los módulos de driver. Un bloque no habla I2C.
- **Ningún literal de mapeo fuera de `tablas.ts`.** Ni un canal, ni un pin del expansor, ni una dirección I2C.
- **Sin cambios especulativos.** Si al revisar un documento aparece una discrepancia con el código, se reporta y se confirma con el desarrollador. Nunca se "arregla" el código para que coincida con el documento.

### Inicialización

MakeCode no permite exigir que el usuario arrastre un bloque de inicialización: se lo va a olvidar. Cada driver mantiene una bandera interna y se inicializa solo en su primer uso, de forma idempotente. Toda función pública empieza llamando a `asegurarInicializado()`.

### Anotaciones de bloque

Cada bloque público lleva `blockId`, `block`, `group` y `weight`. Los enumerados llevan `block` en cada miembro. El `blockId` **nunca cambia** una vez publicado: cambiarlo rompe los proyectos ya guardados de los docentes.

### Validación de argumentos

Un valor fuera de rango no debe producir comportamiento indefinido en el hardware. Los ángulos de servo, las velocidades de motor y los números de puerto se acotan dentro del bloque antes de llegar al driver.

---

## Qué se testea automáticamente y qué no

Casi todo el código toca hardware, así que la suite de tests no puede cubrirlo. La división es:

**Automático** — `tools/check-tablas.js`, un script Node sin dependencias que corre en CI y verifica invariantes de las tablas de correspondencia:
- los seis puertos están presentes y sin repetir
- cada canal de PWM se usa exactamente una vez
- cada pin del expansor se usa exactamente una vez
- cada canal del conversor se usa exactamente una vez
- ningún pin del micro:bit aparece asignado a dos funciones

Estas son justamente las verificaciones que atrapan los errores de los cruces, que es donde más fácil se equivoca uno.

**Humano, con la placa física** — todo lo demás. Vive en `docs/VERIFICACION.md` como protocolo reproducible: qué conectar, qué bloque correr, qué se debe observar. Cada documento de implementación termina con su porción de esa verificación.

---

## Errores conocidos y trampas

- **Bus I2C compartido con el código del usuario.** Un `para siempre` del docente puede llamar a un bloque mientras otro está en curso. Cada transacción debe completarse dentro de una misma llamada, sin `pause` en el medio. El planificador de MakeCode es cooperativo y solo cede el control en pausas y bucles.
- **El código de prueba del proveedor tiene un error conocido**: el bucle digital enciende dos pines y nunca los apaga. No copiar ese patrón.
- **El conversor analógico no tolera tensiones por encima de su alimentación**, independientemente de la ganancia configurada. Una ganancia de ±4,096 V no significa que acepte 4 V en la entrada.
- **La ganancia del conversor es un compromiso**: el rango más chico que contenga la tensión esperada da la mejor resolución, pero satura si se pasa.
- **Escribir un pin del expansor exige leer-modificar-escribir** el byte de salida. El driver mantiene un espejo en memoria en vez de leer el chip cada vez.
- **Cambiar el período de PWM en el micro:bit puede afectar a otros pines**, porque comparten canales internos. En esta placa no debería haber conflicto, pero verificarlo con motores y servos funcionando a la vez.
- **Un `blockId` cambiado rompe proyectos guardados.** Tratarlos como identificadores permanentes.

---

## Al proponer alternativas

Presentar siempre las decisiones de arquitectura como opciones con sus compromisos:

```
**Opción A: [nombre]**
- Enfoque: [descripción]
- A favor: [lista]
- En contra: [lista]
- Complejidad: [baja/media/alta]
- Archivos afectados: [lista]

**Opción B: [nombre]**
- ...

**Recomendación:** [cuál y por qué]
```

Nunca comprometerse con un enfoque de implementación sin aprobación del desarrollador. Presentar, explicar los compromisos, esperar la decisión.

---

## Flujo de trabajo con agentes

El repositorio tiene dos subagentes en `.claude/agents/`:

- **revisor-kroma** — revisión técnica contra las convenciones y las trampas conocidas. Solo lectura. Invocar después de cada implementación.
- **revisor-didactico-kroma** — revisión de la superficie visible: nombres de bloques, redacción en español, agrupación, y si el conjunto es explicable a un docente sin formación técnica. Solo lectura. Invocar cuando se agreguen o modifiquen bloques públicos.

Todo documento de implementación termina con: (1) `node tools/check-tablas.js` en verde, (2) `docs/ARQUITECTURA.md` actualizado, (3) revisor invocado, (4) la porción correspondiente de `docs/VERIFICACION.md` ejecutada con la placa.

Las discrepancias entre código y documentación se reportan, nunca se corrigen en silencio.

---

## Formato de los documentos de implementación

```markdown
# [Nombre de la tarea] — Documento de implementación

## Requisitos que satisface
- **GEN-4** — [enunciado del requisito, copiado de la especificación]
- **DIG-1** — ...

## Ambigüedades
Confirmar que ninguna ambigüedad abierta de `ESPECIFICACION.md` toca estos
requisitos. Si alguna quedó sin resolver y se avanza igual, declarar acá el
supuesto adoptado.

## Contexto
Qué logra este cambio y por qué.

## Archivos a modificar
- `archivo.ts` — qué cambia

## Pasos de implementación

### Paso 1: [descripción]
**En `archivo.ts`**, en la función `nombreFuncion()`:
- Agregar/modificar/quitar [comportamiento específico]

## Funciones nuevas
[Código completo, listo para pegar. Sin pseudocódigo.]

## Verificación automática
- [ ] `node tools/check-tablas.js` en verde
- [ ] La extensión compila en MakeCode

## Verificación con la placa
Un ítem por criterio de aceptación de los requisitos declarados arriba,
copiado textual de la especificación.
- [ ] **DIG-1** — [criterio de aceptación]

## Cierre
- [ ] Todos los criterios de aceptación de los requisitos declarados, cumplidos
- [ ] `docs/ARQUITECTURA.md` actualizado
- [ ] Ambigüedades resueltas registradas con su fundamento
- [ ] revisor-kroma invocado
- [ ] revisor-didactico-kroma invocado (si se tocaron bloques públicos)
```

### Principios

- **Todo documento arranca declarando qué requisitos satisface.** Un documento sin requisitos es trabajo sin justificación: no se escribe.
- **Los criterios de verificación se copian textuales de la especificación**, no se reescriben. Si un criterio resulta imposible de verificar, el problema está en la especificación y se corrige allá, no acá.
- Listo para Claude Code: todo bloque de código completo y pegable.
- Referencias por nombre de función, nunca por línea.
- Archivo exacto para cada cambio.
- Dependencias explícitas entre pasos.
- La verificación se divide siempre en lo que comprueba el agente y lo que comprueba el humano con la placa.
- Cambios de documentación separados de cambios de código.

---

## Documentación del proyecto

- Verificar contra el código real antes de escribir. Las discrepancias entre documentación y código ya pasaron en otros proyectos.
- `docs/ARQUITECTURA.md` se actualiza al final de toda tarea que cambie exportaciones, flujos o tablas.
- El README está escrito para el docente, no para el desarrollador: qué es cada puerto, qué se puede conectar dónde, y los límites de corriente.
- Nunca documentar funcionalidades que no existen en el código.
