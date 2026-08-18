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

---

## V1 — Salidas digitales

*(Se completa al cerrar la tarea 2. Verifica DIG-1, DIG-2, DIG-3 y la porción de GEN-4.)*

---

## V2 — Entradas analógicas

*(Se completa al cerrar la tarea 3. Verifica ANA-1 a ANA-4.)*

---

## V3 — Servos

*(Se completa al cerrar la tarea 4. Verifica SRV-1 a SRV-3.)*

---

## V4 — Motores

*(Se completa al cerrar la tarea 5. Verifica MOT-1 a MOT-6, más la interacción con servos.)*

---

## V5 — Sensor de distancia

*(Se completa al cerrar la tarea 6. Verifica ULT-1 a ULT-3.)*

---

## Registro de ejecuciones

| Fecha | Versión | Procedimientos ejecutados | Resultado | Observaciones |
|---|---|---|---|---|
| 2026-08-18 | — (sin código de extensión aún) | V0 | Cumple | Puerto 4→AIN2, puerto 6→AIN0, puerto 1→P0. Pinout de contactos 5/8 (GND/3,3V) confirmado idéntico en los seis puertos. |
