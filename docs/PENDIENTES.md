# PENDIENTES

Backlog del proyecto. Tres cosas viven acá: las consultas abiertas al proveedor, los hallazgos postergados, y las ideas que aparecieron y se decidió no atender ahora.

Lo que está **fuera del alcance de la primera versión por decisión de diseño** no va acá: vive en la sección correspondiente de `ESPECIFICACION.md`, para que quede claro que fue una decisión y no un olvido.

---

## Consultas al proveedor

Surgen del relevamiento del esquemático (`HARDWARE.md`, sección 10). Son independientes del desarrollo, pero las respuestas pueden tardar.

| # | Consulta | Impacto | Estado |
|---|---|---|---|
| 1 | Pines CC1 y CC2 del conector USB-C sin conectar. Sin las resistencias de 5,1 kΩ a masa, un cargador USB-C a USB-C no entrega tensión. | Alto — la placa solo cargaría con cable USB-A a USB-C | Sin enviar |
| 2 | El bucle digital del código de prueba enciende dos pines y nunca los apaga. | Bajo — no afecta el hardware | Sin enviar |
| 3 | ¿La pérdida del freno activo de motor fue una decisión consciente al usar inversores para ahorrar pines? | Medio — condiciona qué se puede prometer en los bloques y en el material docente | Sin enviar |
| 4 | Falta el código de prueba de motores y servos. | Bajo — se puede escribir desde cero | Sin enviar |
| 5 | Nota ambigua sobre P2 en el esquemático que menciona la matriz de LEDs "in v1". ¿Se refiere a la micro:bit V1 o a una versión anterior de la placa? | Medio — P2 se usa como línea analógica del puerto 1 | Sin enviar |
| 6 | ¿La placa fue validada con micro:bit V1 y V2, o solo con una de las dos? | Medio | Sin enviar |

---

## Hallazgos postergados

Cosas detectadas durante la implementación que no bloquean pero conviene atender.

| # | Hallazgo | Impacto | Estado |
|---|---|---|---|
| 1 | Los pines del expansor digital (PCA9536) para los puertos 1 y 3 en `TABLA_PUERTOS` (`tablas.ts` / `ARQUITECTURA.md` §4.1) estaban cruzados entre sí. Detectado por `revisor-placa` al cerrar la Tarea 1, comparando `HARDWARE.md` §5.2 con §5.4 (mismo método usado para derivar `canalPWM`). | Alto — afectaba a los bloques de DIG-1/DIG-2/DIG-3 (Tarea 2) para los puertos 1 y 3 | **Resuelto** — verificado físicamente con la placa (programa de prueba sobre el PCA9536, descartable): puerto 1 → pin 2, puerto 2 → pin 1, puerto 3 → pin 0, puerto 5 → pin 3. Corregido en `tablas.ts` y `ARQUITECTURA.md` §4.1. |
| 2 | Nombres de agente inconsistentes entre documentos: `ARQUITECTURA.md` §5 lista `revisor-placa.md` y `revisor-didactico.md`, pero `PLAN-DE-TAREAS.md` (Tareas 7 y 8) citaba `revisor-didactico-kroma`. | Bajo — no afecta bloques ni tablas, solo referencias cruzadas en documentación | **Resuelto** — confirmado el nombre real: `revisor-didactico.md`. Corregidas las menciones en `PLAN-DE-TAREAS.md`. |
| 3 | Dos criterios de aceptación de la Tarea 8 (locale visible igual que antes en el editor con idioma español; un proyecto de docente guardado antes del cambio sigue abriendo sin error) eran de placa/editor y no se podían verificar leyendo código. | Bajo | **Resuelto por decisión de Santi** — se sacaron del alcance de los criterios de aceptación de la Tarea 8, que queda cerrada sin ellos. Quedan como verificación manual pendiente, no como criterio de cierre. |
| 4 | El manejador de PWM nativo del micro:bit no es independiente por pin — motores y salida analógica lo comparten, reportado en `microsoft/pxt-microbit#4950`, sin confirmar si difiere entre V1 y V2. | Medio — condiciona el diseño de Tarea 5 y Tarea 9 | Verificar con la placa real al cerrar esas tareas; relacionado con la consulta 6 (¿la placa fue validada con V1, V2, o ambas?) |
| 5 | `pxt.json` no declaraba el campo `dependencies`. Un paquete de MakeCode debe declarar al menos `"core": "*"`; sin eso PXT no puede armar el árbol de dependencias (`Missing dependencies in config of: this` al instalar, y `config` null al resolverlo desde otro proyecto). Detectado el 2026-08-29 al intentar levantar el editor localmente. | Alto — el paquete no se resolvía como dependencia, que es exactamente lo que el criterio de aceptación de la Tarea 0 decía verificar | **Resuelto** — agregado `"dependencies": { "core": "*" }`. Ver hallazgo 6 sobre por qué no se había detectado antes. |
| 6 | `test.ts` estaba listado en `files` además de en `testFiles`. `files` son los archivos que se compilan dentro del paquete que recibe el docente; `testFiles` solo se compilan cuando el paquete es el proyecto de nivel superior. Estando en ambas listas, el programa de prueba se empaquetaba dentro de la extensión, contradiciendo `ARQUITECTURA.md` §5, que lo describe como "no se compila en el paquete". | Medio — el docente recibía código de prueba dentro de la extensión | **Resuelto** — `test.ts` sacado de `files`, se mantiene solo en `testFiles`. |
| 7 | El driver `analog.ts` no hacía extensión de signo del resultado de 12 bits en complemento a dos del ADS1015 al combinar los dos bytes leídos por I2C. Un offset o ruido negativo cerca de 0 V podía reportarse cerca del extremo superior de la escala en vez de 0, violando ANA-3 y ANA-4. Detectado por `revisor-placa` al cerrar la Tarea 3 — el documento de implementación tenía la misma fórmula incompleta. | Alto — afectaba directamente ANA-3 y ANA-4 en los puertos 4, 5 y 6 | **Resuelto** — corregido en `analog.ts` con extensión de signo correcta antes de remapear a 0–100. |
| 8 | Puertos 3 y 5 parecían no responder a `digitalOutput` en una prueba manual de Santi (quedaban fijos en ~3,3 V). Primera vez que se probaba DIG-1/2/3 físicamente sobre los seis puertos (2026-08-29). Un diagnóstico con serial descartó las dos sospechas de software (lookup `findPortEntry` y máscara de bits en `digital.ts`) con datos reales de placa, y al repetir la misma prueba con multímetro directo sobre el RJ45 (en vez de confiar en la lectura I2C de depuración), ambos puertos respondieron bien, iteración tras iteración. Detalle completo en `VERIFICACION.md` V1. | Alto mientras estuvo abierto — bloqueaba el cierre físico de DIG-1/2/3 (Tarea 2) | **Resuelto (2026-08-29) — no era un bug de software.** No se pudo reproducir con el mismo código: apunta a un error de montaje o medición en la prueba manual original, no a un defecto en `digital.ts` ni en el lookup de puertos enchufables de §2.2. Instrumentación temporal de depuración retirada. |
| 9 | Verificando ANA-1 a ANA-4 con placa (potenciómetro en 3,3V/GND, monitor serie), los puertos 1–3 recorrían 0 a 100 pero los puertos 4–6 topeaban en 81, violando ANA-2 (~19 puntos de diferencia entre torres). No era hardware ni bug de lógica: consecuencia matemática de dividir por el fondo de escala *configurado* del ADS1015 (2047 cuentas = 4,096 V, D3) en vez del techo eléctrico *real* de la señal (3,3 V) — con 2 mV/cuenta, 3,3 V son 1650 cuentas, y `round(1650*100/2047)=81`, exactamente el valor medido. Detectado por Santi el 2026-08-29 verificando V2. | Alto — violaba ANA-2 directamente en los puertos 4, 5 y 6 | **Resuelto** — `analog.ts` recalibrado para dividir por 1650 (la cuenta real a 3,3 V) en vez de 2047, igualando el significado de "100" al mismo techo físico en los seis puertos. Fundamento completo en `ARQUITECTURA.md` §8 (D1). Pendiente remedir con la placa (`VERIFICACION.md` V2). |

---

## Riesgos de uso a resolver fuera del código

| Riesgo | Estado |
|---|---|
| Los conectores RJ45 son idénticos a los de red. Un estudiante podría conectar la placa a un switch escolar, o al revés. Definir una advertencia explícita en el material docente y evaluar si es viable alguna diferenciación visual en la placa. | Abierto |

---

## Ideas para versiones futuras

Se anotan para no perderlas. Ninguna está comprometida.

*(Vacío.)*
