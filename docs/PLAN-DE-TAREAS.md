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
| GEN-2 | 7 (revisión global) |
| GEN-4, GEN-5 | 2 (patrón), verificado en 3 a 6 |
| GEN-6 | 0 |
| DIG-1, DIG-2, DIG-3 | 2 |
| ANA-1, ANA-2, ANA-3, ANA-4 | 3 |
| SRV-1, SRV-2, SRV-3 | 4 |
| MOT-1, MOT-2, MOT-3, MOT-4, MOT-5, MOT-6 | 5 |
| ULT-1, ULT-2, ULT-3 | 6 |
| DOC-1, DOC-2 | 7 |

---

## Tarea 0 — Esqueleto del paquete

**Satisface:** GEN-6
**Bloqueada por:** nada — D4 y D5 resueltas

Repositorio `pxt-kroma` ya creado localmente. Resta: completar el manifiesto, crear los archivos vacíos con su namespace, el README inicial y el programa de prueba mínimo. No produce bloques.

**Criterio de aceptación:** la extensión se importa en MakeCode desde su repositorio sin errores, y aparece en la paleta con su nombre e ícono, aunque no contenga bloques todavía.

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

## Tarea 2 — Salidas digitales

**Satisface:** DIG-1, DIG-2, DIG-3; establece el patrón para GEN-4 y GEN-5

La más simple de las que tocan hardware. Valida todo el andamiaje: tablas, inicialización perezosa, separación entre bloque y driver, manejo del bus.

**Criterios de aceptación:** los de DIG-1, DIG-2 y DIG-3 tal como están redactados en la especificación, más:
- Un programa cuya única instrucción sea el bloque de escritura produce el efecto en la primera ejecución, sin ningún bloque previo (GEN-4).
- El bloque no expone ningún nombre de chip, pin ni canal (GEN-2 en su porción).

**Es la tarea de referencia.** Los patrones que se fijen acá se repiten en las siguientes, y el revisor los va a usar como base de comparación.

---

## Tarea 3 — Entradas analógicas

**Satisface:** ANA-1, ANA-2, ANA-3, ANA-4
**Bloqueada por:** D1, D3, D6

Driver del conversor por I2C para los puertos 4 a 6, y lectura de pin nativo para los puertos 1 a 3.

**Criterios de aceptación:** los de ANA-1 a ANA-4 tal como están redactados, con los márgenes de tolerancia ya declarados en `ARQUITECTURA.md` como parte de la resolución de D6.

**Cierre adicional:** las decisiones D1 y D3 quedan registradas con su fundamento en `ARQUITECTURA.md`, sección 8, y su estado pasa a resuelto en `ESPECIFICACION.md`.

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

README para el docente, protocolo de verificación consolidado, y revisión de toda la superficie pública de una sola pasada con `revisor-didactico-kroma`.

**Criterios de aceptación:** los de DOC-1 y DOC-2 tal como están redactados, más:
- Una búsqueda de vocabulario técnico sobre todas las cadenas visibles no devuelve resultados (GEN-2).
- Todo requisito de la especificación tiene su tarea marcada como cerrada, y toda tarea cerrada cita los requisitos que satisfizo.

---

## Verificación previa a la tarea 1

**Procedimiento V0 de `VERIFICACION.md`**: confirmar la orientación de las torres de conectores con la placa en la mano, sin escribir código de la extensión.

Son dos minutos y validan las tablas de la tarea 1, sobre las que se apoya todo lo demás. Si esta verificación falla, las tablas están invertidas y las cinco tareas siguientes producirían bloques que no funcionan.

---

## Consultas pendientes al proveedor

Se llevan en `PENDIENTES.md`, con su estado. Son independientes del desarrollo, pero conviene enviarlas ya porque las respuestas pueden llegar tarde.
