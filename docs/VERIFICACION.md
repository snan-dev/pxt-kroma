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

**Siguiente paso sugerido, no ejecutado:** medir con multímetro directamente sobre los pines 0 y 3 del PCA9536 (no sobre el contacto del RJ45) mientras corre el loop de prueba, para separar "el chip no mueve su propio pin" de "el chip mueve el pin pero algo entre el chip y el RJ45 no lo lleva" — evita depender de la lectura I2C todavía no validada.

**Estado: abierto.** No se tocó `digital.ts` ni `tables.ts` a ciegas — ninguno de los dos mostró evidencia de estar mal. Ver hallazgo 8 de `PENDIENTES.md`.

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
| 2026-08-28 | Tarea 1 | V0 (adicional, línea digital) | Cumple | Cruce del expansor confirmado: puerto 1→pin 2, puerto 2→pin 1, puerto 3→pin 0, puerto 5→pin 3. |
