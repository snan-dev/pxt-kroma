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

*(Vacío.)*

---

## Riesgos de uso a resolver fuera del código

| Riesgo | Estado |
|---|---|
| Los conectores RJ45 son idénticos a los de red. Un estudiante podría conectar la placa a un switch escolar, o al revés. Definir una advertencia explícita en el material docente y evaluar si es viable alguna diferenciación visual en la placa. | Abierto |

---

## Ideas para versiones futuras

Se anotan para no perderlas. Ninguna está comprometida.

*(Vacío.)*
