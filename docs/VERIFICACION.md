# VERIFICACIÓN

Protocolo reproducible de verificación con la placa física.

**Por qué existe.** Casi todo el código de KROMA toca hardware, así que la mayoría de los requisitos no se pueden verificar automáticamente. Este documento es el reemplazo de la suite de tests: el guion de lo que hay que hacer con la placa en la mano para poder afirmar que un requisito se cumple.

**Cómo se construye.** Cada tarea aporta su porción al cerrar. Los procedimientos se redactan a partir de los criterios de aceptación de `ESPECIFICACION.md`, sin reinterpretarlos.

**Cómo se usa.** Al terminar una tarea, para verificarla. Y de forma completa antes de cada publicación, porque un cambio en un módulo puede romper otro sin que nada lo avise.

---

## Convenciones

Cada procedimiento indica **qué conectar**, **qué ejecutar** y **qué se debe observar**. El resultado se registra como cumple o no cumple: si hace falta interpretar, el criterio está mal redactado y se corrige en la especificación, no acá.

Los procedimientos citan el identificador del requisito que verifican.

---

## V0 — Orientación de las torres de conectores

**Previa a todo lo demás. No requiere que exista código de la extensión.**

Resuelve la anotación 10.5 de `HARDWARE.md`: dentro de cada torre de tres conectores no se pudo probar de forma concluyente cuál corresponde a cada unidad del esquemático, porque el archivo de huella del componente no viene en el paquete del proveedor.

Las tablas de `ARQUITECTURA.md` sección 4 se apoyan en esta correspondencia. Si está invertida, todos los bloques que dependan de un puerto van a operar sobre el puerto equivocado.

**Qué conectar:** una fuente de tensión conocida y estable (un potenciómetro alimentado desde la propia placa sirve) en la línea analógica del puerto 4.

**Qué ejecutar:** un programa que lea los tres canales del conversor analógico y los muestre por el puerto serie.

**Qué observar:** al mover el potenciómetro debe responder **el canal 2**, y solo ese.

**Repetir en el puerto 6:** debe responder el canal 0.

**Repetir en el puerto 1**, esta vez leyendo los pines nativos: debe responder P0.

**Si el resultado no coincide:** no seguir. Las tablas están invertidas y hay que corregirlas antes de escribir cualquier bloque. Registrar el resultado real acá y actualizar la sección 4 de `ARQUITECTURA.md`.

**Resultado:** Cumple. Puerto 4 → AIN2, puerto 6 → AIN0, puerto 1 → P0, coincidiendo con la correspondencia de la sección 4 de `ARQUITECTURA.md`. Verificado puenteando la línea analógica (contacto 6) directo a 3,3 V (contacto 8) y a GND (contacto 5) en cada puerto, con programa de prueba descartable (no versionado en el repositorio).

**Adicional — línea digital del expansor (hallazgo 1 de `PENDIENTES.md`):** `revisor-placa` reportó, al cerrar la Tarea 1, que los pines del PCA9536 para los puertos 1 y 3 podían estar cruzados entre sí respecto de lo que decía `ARQUITECTURA.md` §4.1.

**Qué conectar:** un LED con resistencia en serie entre el contacto 4 (línea digital) y el contacto 5 (GND) de los puertos 1, 2, 3 y 5.

**Qué ejecutar:** programa descartable que enciende, uno por vez, cada uno de los cuatro pines de salida del PCA9536 (P0 a P3) y anuncia por el puerto serie cuál está activo.

**Qué observar:** qué puerto enciende su LED en cada pin anunciado.

**Resultado:** Cumple la hipótesis del cruce. Puerto 1 → pin 2, puerto 2 → pin 1, puerto 3 → pin 0, puerto 5 → pin 3. `TABLA_PUERTOS` y `ARQUITECTURA.md` §4.1 corregidos en consecuencia.

---

## V1 — Salidas digitales

**Verifica:** DIG-1, DIG-2, DIG-3, la porción de GEN-4, y la porción de GEN-5 sobre el acotamiento de puerto de §2.2.

**Qué conectar:** LED con resistencia en serie (o multímetro) entre el contacto 4 (línea digital) y el contacto 5 (GND) de cada uno de los seis puertos.

**Qué ejecutar:** programa que recorre los seis puertos con `digitalOutput`, alternando encendido y apagado, usando una variable numérica (no el desplegable) para ejercitar también el mecanismo de puertos enchufables de §2.2.

**Qué observar:** el LED (o la tensión) de cada puerto responde al cambio de valor.

**Resultado (2026-08-29): NO cumple para los puertos 3 y 5.** Primera vez que se prueba V1 sobre los seis puertos físicos (Santi). Puertos 1, 2, 4 y 6 responden correctamente. Puertos 3 y 5 quedan fijos en ~3,3 V entre los contactos 4 y 5, sin responder a `digitalOutput`. Corresponden a los pines 0 y 3 del PCA9536 — los dos bits extremos del nibble de 4 bits que usan `configMirror`/`outputMirror` — mientras que los puertos que sí funcionan (pines 2 y 1) son los del medio.

**Diagnóstico realizado (no concluyente todavía):** se aisló el problema con un build descartable (`test.ts` temporal, no comiteado) que ejercita solo los puertos 3 y 5 y loguea por serie, en cada iteración de un loop largo:
- El resultado de `findPortEntry(3)` / `findPortEntry(5)` (el lookup centralizado de §2.2): resuelve `digital.pin=0` para el puerto 3 y `digital.pin=3` para el puerto 5 — **coincide exactamente con la tabla, descarta el lookup como causa**.
- `configMirror`/`outputMirror` (el estado que el software cree haber escrito) en cada paso: siguen la secuencia esperada bit a bit — `configMirror` pasa 15→14 al apagar la entrada del pin 0, luego 14→6 al apagar también la del pin 3 (14 - 8 = 6); `outputMirror` alterna 0→1→0 para el puerto 3 y 0→8→0 para el puerto 5 — **coincide exactamente con la máscara `1 << pin` esperada para ambos bits extremos, descarta un bug de máscara/índice en el software de `digital.ts`**.
- Lectura de los registros reales del PCA9536 por I2C (función temporal `_debugPca9536`, no existe en el driver real): siempre devuelve 0 tanto para el registro de configuración como el de salida, sin importar qué se haya escrito. Este dato **no es confiable todavía**: ejercita un camino de lectura (leer CONFIG y OUTPUT) que el driver nunca usó antes de este diagnóstico — solo se leía INPUT, y nunca sobre hardware real — así que no se puede distinguir con lo que hay si es un hallazgo real o un artefacto de la propia instrumentación de depuración.

**Conclusión parcial:** las dos sospechas originales (bug de máscara en `digital.ts`, bug en el lookup nuevo de puertos enchufables) quedan **descartadas por datos reales de la placa**, no por lectura de código. La causa real sigue sin confirmar. Candidatos que quedan abiertos: un problema físico específico de los pines 0 y 3 del PCA9536 en esta placa (cableado, soldadura — coincide con que sean los pines extremos del encapsulado), o un problema real en la escritura I2C que la lectura de registros disponible todavía no permite aislar de forma confiable.

**Repetición con multímetro (2026-08-29, mismo día, Santi):** se volvió a correr el mismo build de diagnóstico (puertos 3 y 5 aislados), esta vez midiendo con multímetro directo sobre el contacto del RJ45 en lugar de confiar en la lectura I2C de registros. **Cumple.** Iteración tras iteración, ambos puertos responden: 3,3 V cuando el log anuncia `true`, 0 V cuando anuncia `false`. Confirma lo que ya indicaban `configMirror`/`outputMirror`: la escritura sí llega al chip y mueve el pin correctamente para los dos bits extremos.

**Conclusión:** no había bug de software. La medición original (`3V constante, sin responder`) no se pudo reproducir con el mismo código sin cambios — apunta a un error en el montaje o la medición de esa primera prueba manual, no a un defecto en `digital.ts` ni en el lookup de puertos enchufables de §2.2. Se retiró la instrumentación temporal (`_debugPca9536` en `digital.ts`) y se restauró `test.ts` a un programa normal que recorre los seis puertos con una variable, para dejar una prueba de humo mínima que sí ejercita el mecanismo de puertos enchufables.

**Pendiente para dar DIG-1/2/3 por cerrado del todo:** este resultado confirma puerto por puerto (1, 2, 4 y 6 en la prueba original; 3 y 5 acá) pero no repite exactamente el programa original de seis puertos en una sola corrida con multímetro. Dado que los cuatro puertos ya estaban confirmados y estos dos ahora también, individualmente, se da por cumplido — pero si se quiere paridad exacta con el procedimiento, alcanza con repetir la prueba con `test.ts` tal como quedó (recorre los seis con una variable) y confirmar los seis de una sola vez.

**Estado: cumple.** Ver hallazgo 8 de `PENDIENTES.md`, cerrado.

---

## V1 bis — Entradas digitales

**Verifica:** DIG-4.

**Qué conectar:** línea digital (contacto 4) de cada uno de los seis puertos, puenteada manualmente a 3,3 V (contacto 8) y a GND (contacto 5), alternando.

**Qué ejecutar:** programa que lee el estado de un puerto con el bloque de lectura digital y lo muestra por el puerto serie, repetido en corridas separadas cambiando el puerto leído en el código cada vez, hasta cubrir los seis.

**Qué observar:** el valor leído por serie refleja el estado real de la línea (3,3 V → encendido, GND → apagado) en cada puerto.

**Resultado (2026-08-29, Santi): Cumple.** Probados los seis puertos en corridas separadas, cada una puenteando a 3,3 V y a GND, la lectura por serial refleja el estado real en todos los casos.

**Estado: cumple.**

---

## V2 — Entradas analógicas

**Verifica:** ANA-1 a ANA-4.

**Qué conectar:** un potenciómetro alimentado desde 3,3 V/GND de la propia placa (contactos 8 y 5 del RJ45) con el cursor a la línea analógica (contacto 6), en cada uno de los seis puertos.

**Qué ejecutar:** lectura continua de `analogInput` por el puerto serie mientras se gira el potenciómetro de extremo a extremo.

**Qué observar:** el valor recorre 0 a 100 en los seis puertos, sin diferir más de 3 puntos entre puertos de distinta torre con el potenciómetro en la misma posición (ANA-2).

**Resultado (2026-08-29, Santi): NO cumplía ANA-2 antes de la recalibración.** Puertos 1, 2 y 3 (ADC nativo) recorrían 0 a 100 correctamente. Puertos 4, 5 y 6 (ADS1015) topeaban en **81**, no en 100, con el mismo potenciómetro a fondo — diferencia de ~19 puntos entre torres, muy por encima del margen de ANA-2.

**Causa (no era hardware ni bug de lógica):** consecuencia matemática directa de D3 (GAIN_ONE, ±4,096 V) combinada con la fórmula original de D1, que dividía por el fondo de escala *configurado* del ADS1015 (2047 cuentas = 4,096 V) en vez del techo eléctrico *real* de la señal (3,3 V, ya fijado en D3). Con 2 mV/cuenta, 3,3 V son 1650 cuentas, no 2047 — `round(1650*100/2047) = 81`, exactamente el valor medido.

**Corrección (2026-08-29):** `analog.ts` recalibrado para dividir por 1650 (la cuenta real a 3,3 V) en vez de 2047. Detalle y fundamento completo en `ARQUITECTURA.md` §8 (D1).

**Resultado tras la recalibración (2026-08-29, Santi):** repetida la prueba con la placa — las tres torres llegan a 100 con el potenciómetro a fondo, sin la diferencia de ~19 puntos de antes. **Cumple ANA-2.**

**Resultado ANA-3/ANA-4 (2026-08-29, Santi): Cumple.** Verificado en la misma prueba que ANA-2, en los seis puertos: al girar el potenciómetro lentamente no se observaron saltos hacia atrás (ANA-3), y en cada extremo del recorrido el valor se mantuvo estable en 0 o 100 sin saturar antes de llegar al tope (ANA-4).

**Estado: cumple (ANA-1 a ANA-4).** Ver hallazgo 9 de `PENDIENTES.md`, cerrado.

---

## V3 — Servos

**Verifica:** SRV-1, SRV-2, SRV-3.

Sin código de proveedor para el PCA9685 (§8 de `ARQUITECTURA.md`), esta verificación pesa más de lo habitual: no hubo una segunda fuente contra la cual detectar un error de traducción del datasheet antes de llegar acá.

**Qué conectar:** un servo SG90 en cada uno de los seis puertos.

**Qué ejecutar:** el programa de prueba de `test.ts` (Tarea 4) — `setServoAngle` a un ángulo distinto en cada uno de los seis puertos, dejado sin más instrucciones después.

**Qué observar:**
- **SRV-1:** el servo alcanza posiciones visiblemente distintas para ángulos distintos, en los seis puertos.
- **SRV-2:** tras ordenar una posición y esperar treinta segundos sin ejecutar nada más, el servo sigue en esa posición y resiste un empuje suave.
- **SRV-3:** con los seis servos conectados a la vez (o al menos tres), las posiciones ordenadas se mantienen todas simultáneamente.
- **Chequeo adicional, no pedido por la especificación pero relevante para el rango de pulso elegido (500–2400 µs, datasheet del SG90):** observar los extremos (0° y 180°) en cada uno de los seis SG90 del kit. Si alguno gruñe, vibra o se traba, angostar el rango de pulso (por ejemplo a 600–2400 µs) en `servos.ts` antes de cerrar y dejar el valor final y su motivo acá y en `ARQUITECTURA.md` §8 — los clones de SG90 tienen variación de calibración conocida entre unidades, puede no ser uniforme entre los seis.

**Resultado:** Pendiente de verificación física con la placa.

**Verificación cruzada con motores:** ver T4 en V4 (Tarea 5, ya con código) — con motores a velocidad media, los servos no deben vibrar ni perder posición.

**Reverificación de SAL-3 con servos reales en movimiento:** Tarea 9, ya cerrada con código pero con V6 pendiente en la placa.

---

## V4 — Motores

**Verifica:** MOT-1 a MOT-6, más la interacción con servos (Tarea 5) y con la salida analógica (Tarea 9, si ya cerrada).

**Qué conectar:** un motor DC en el conector rotulado A y otro en el B. Para T4, además, dos servos SG90 en dos puertos de periférico y un LED con resistencia entre los contactos 4 y 5 de otro puerto (4 o 6).

**Qué ejecutar:** el programa de prueba de `test.ts` (Tarea 5), disparado a mano con la placa en la mano: T1 con el botón A, T2 con el botón B, T3 con los botones A+B, T4 sacudiendo la placa.

**Qué observar:**

- **MOT-1 (T1):** cada motor gira, el sentido cambia al cambiar el enumerado, y una velocidad más alta gira visiblemente más rápido. Y los dos motores giran para el mismo lado con el mismo valor de dirección. Si no coinciden: invertir el cable de ese motor en el RJ45 y repetir. Si el síntoma se mueve con el cable, es cableado del aula y no se toca nada. Si el síntoma se queda con el motor, es un cruce de la placa y se corrige el `forwardLevel` de esa fila en `MOTOR_TABLE`, dejando constancia acá y en `ARQUITECTURA.md` §4.2 y §8.
- **MOT-2 (T1):** el motor enchufado al conector impreso **A** responde al valor A.
- **MOT-3 (T3):** con velocidad 0 el motor se detiene sin frenar en seco, girando un poco por inercia. Y el otro motor sigue andando.
- **MOT-4 (T3):** `stopAllMotors` detiene los dos. Y el paso siguiente de T3 es el que importa: dar velocidad solo a A no debe mover B. Si B arranca, la implementación no respetó el orden de D-MOT-d.
- **MOT-5:** la paleta de la subcategoría Motores contiene exactamente dos bloques y ninguno sugiere freno. Verificable en el editor, sin placa.
- **MOT-6 (T2), el criterio central:** con el motor sin carga a la velocidad mínima que lo hace girar, el giro es continuo y no se percibe un tono agudo constante. Escuchar con la sala en silencio y, si hay alguien más, que escuche también alguien joven: la banda que hay que descartar llega más arriba para un chico de primaria que para un adulto. Anotar tres cosas: a qué valor de velocidad arranca cada motor, si el giro es parejo en ese valor, y si se oye algo.
- **Escalera de D-MOT-a:** si a 40 µs el motor arranca a un valor mucho más alto que a 250 µs, o el torque cae, o quedan pocos escalones útiles de velocidad, bajar un escalón (40 → 50 → 100 → 250 µs) y repetir T2 completo. Registrar acá el valor final, el motivo y los valores de arranque medidos en cada escalón probado. Si hay que llegar al escalón 3 o 4, MOT-6 queda en riesgo: abrir hallazgo en `PENDIENTES.md` antes de cerrar.
- **Micro:bit V1 y V2 (consulta 6 de `PENDIENTES.md`):** correr T2 completo en las dos versiones si hay ambas. El PWM de la V1 es de generación distinta y un período de 40 µs puede comportarse peor ahí. Anotar cuál se probó, aunque sea una sola.
- **Cruzada con servos y salida analógica (T4, cierra el pendiente de V3 y de V6, §3.9, hallazgo 4 de `PENDIENTES.md`):** con motores a velocidad media, los servos no vibran ni se mueven de su posición; el LED de salida analógica no cambia de brillo ni parpadea distinto respecto de como estaba antes de arrancar los motores; y los motores no cambian de comportamiento al ordenar un servo nuevo. Esto es lo que descarta el conflicto de canales internos de PWM que `PLAN-DE-TAREAS.md` pide verificar en esta tarea.
- **Cuántas salidas de PWM nativo hay a la vez.** Los motores ocupan dos (P8, P15) y la salida analógica una tercera (P9 o P12). Algunas versiones del runtime del micro:bit sostienen un número acotado de salidas analógicas simultáneas, y con T4 estamos justo en el borde. Si en T4 alguna de las tres deja de responder mientras las otras andan, es esto y no un bug de lógica: anotarlo como hallazgo, con la versión de micro:bit y de runtime. Los servos no entran en la cuenta — van por el PCA9685, no por PWM nativo.

**Resultado:** Pendiente de verificación física con la placa.

---

## V5 — Sensor de distancia

*(Se completa al cerrar la tarea 6. Verifica ULT-1 a ULT-3.)*

---

## V6 — Salida analógica

**Verifica:** SAL-1, SAL-2, SAL-3.

**Qué conectar:** un LED con resistencia en serie entre el contacto 4 (línea digital, la misma que lleva la salida analógica en los puertos 4 y 6) y el contacto 5 (GND).

**Qué ejecutar:** el barrido de `test.ts` (Tarea 9) — `analogOutput` de 0 a 100 y de vuelta a 0, en pasos de 10 con pausa corta, en el puerto 4 y después en el puerto 6.

**Qué observar:**
- **SAL-1:** los niveles intermedios producen brillos perceptiblemente distintos entre sí; 0 apaga el LED por completo; 100 da la intensidad máxima. En ambos puertos.
- **SAL-2:** el selector del bloque (`NativeDigitalPort`) no ofrece ninguna opción distinta de 4 y 6 — verificable leyendo el bloque en el editor, sin necesidad de la placa.
- **SAL-3:** con un servo en movimiento en otro puerto mientras la salida analógica está fija en un valor intermedio en el puerto 4 o 6, el servo no pierde suavidad de movimiento y el brillo del LED no parpadea de forma distinta a como lo hace sin el servo activo.

**Resultado:** Pendiente de verificación física con la placa.

**Verificación cruzada con motores (§3.9, hallazgo 4 de `PENDIENTES.md`):** ver T4 en V4 (Tarea 5, ya con código) — con la salida analógica activa y los motores a velocidad media, ninguno de los dos debe perder el período que configuró. No bloquea el cierre de SAL-1/2/3 por sí sola (`PLAN-DE-TAREAS.md`, Tarea 9).

---

## Registro de ejecuciones

| Fecha | Versión | Procedimientos ejecutados | Resultado | Observaciones |
|---|---|---|---|---|
| 2026-08-18 | — (sin código de extensión aún) | V0 | Cumple | Puerto 4→AIN2, puerto 6→AIN0, puerto 1→P0. Pinout de contactos 5/8 (GND/3,3V) confirmado idéntico en los seis puertos. |
| 2026-08-28 | Tarea 1 | V0 (adicional, línea digital) | Cumple | Cruce del expansor confirmado: puerto 1→pin 2, puerto 2→pin 1, puerto 3→pin 0, puerto 5→pin 3. |
