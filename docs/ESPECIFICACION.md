# ESPECIFICACIÓN — Primera versión

**Documento prescriptivo.** Define qué debe hacer la extensión, en términos de lo que observa el docente. No menciona módulos, chips ni pines: eso es asunto de `ARQUITECTURA.md`.

**Autoridad:** cuando este documento y el código discrepan, manda este documento. Una discrepancia se reporta al desarrollador; nunca se corrige el documento para que coincida con el código.

**Alcance de la formalidad:** los requisitos numerados cubren la **superficie pública de bloques** y las **tablas de correspondencia**. El interior de los drivers no se especifica formalmente: se rige por las convenciones de `SKILL.md`, porque son decisiones reversibles y contenidas.

---

## Cómo leer un requisito

Cada requisito tiene un identificador estable, un enunciado y un criterio de aceptación redactado de forma que se pueda aprobar o rechazar sin criterio propio.

Los identificadores son permanentes. Un requisito que se abandona se marca como retirado, no se borra ni se reutiliza su número.

---

## GEN — Modelo general de uso

### GEN-1 — El puerto es siempre un argumento explícito
Todo bloque que opere sobre un periférico recibe el puerto como argumento, identificado con el mismo número que está impreso en la placa.

**Aceptación:** ningún bloque de periférico funciona sin que el docente elija un puerto, y los valores ofrecidos coinciden exactamente con los números impresos.

### GEN-2 — Sin vocabulario técnico en la superficie
Ningún texto visible al docente contiene nombres de chips, nombres del esquemático, números de pin del micro:bit, direcciones I2C, ni las palabras "canal", "registro", "bus" o "expansor".

**Aceptación:** una búsqueda de esos términos sobre las cadenas visibles de la extensión no devuelve resultados.

### GEN-3 — Un solo vocabulario de puertos
Todos los bloques usan el mismo enumerado de puertos y la misma palabra para nombrarlo.

**Aceptación:** un docente que aprendió a elegir el puerto en un bloque encuentra el mismo control, con las mismas opciones y el mismo rótulo, en todos los demás.

### GEN-4 — Sin inicialización a cargo del docente
Un programa que contenga un único bloque de la extensión funciona sin ningún bloque previo de configuración.

**Aceptación:** para cada bloque público, un programa que lo contenga como única instrucción produce el efecto esperado en la primera ejecución.

### GEN-5 — Argumentos fuera de rango acotados
Un valor fuera del rango válido nunca produce comportamiento indefinido en el hardware.

**Aceptación:** para cada parámetro numérico, valores por debajo del mínimo y por encima del máximo producen el mismo resultado que el extremo correspondiente.

### GEN-6 — Identificadores de bloque permanentes
Un identificador de bloque publicado no cambia nunca.

**Aceptación:** ningún cambio elimina o renombra un identificador existente. Un bloque que se deja de recomendar se oculta, no se renombra.

---

## DIG — Salidas digitales

### DIG-1 — Escritura en cualquier puerto
El docente puede encender o apagar la línea digital de cualquiera de los seis puertos.

**Aceptación:** con un LED conectado, el bloque de escritura con valor encendido lo enciende y con valor apagado lo apaga, en los seis puertos sin excepción.

### DIG-2 — El estado persiste
Una vez escrito un valor, la línea lo mantiene hasta la siguiente escritura sobre ese mismo puerto.

**Aceptación:** tras escribir encendido en un puerto y esperar treinta segundos sin ejecutar nada más, el LED sigue encendido.

### DIG-3 — Independencia entre puertos
Escribir en un puerto no altera el estado de ningún otro.

**Aceptación:** con LEDs en los seis puertos y todos encendidos, apagar uno cualquiera deja los otros cinco encendidos. Repetir para los seis.

---

## ANA — Entradas analógicas

### ANA-1 — Lectura en cualquier puerto
El docente puede leer el valor analógico de cualquiera de los seis puertos.

**Aceptación:** con un potenciómetro conectado, el bloque devuelve un valor que cambia al girarlo, en los seis puertos.

### ANA-2 — Escala única *(bloqueado por D1)*
La escala del valor devuelto es la misma en los seis puertos, aunque internamente la resolución difiera.

**Aceptación:** con el mismo potenciómetro llevado a la misma posición física, los valores leídos en un puerto de la torre izquierda y en uno de la derecha no difieren en más de un margen declarado en `ARQUITECTURA.md`.

### ANA-3 — Monotonicidad
Al aumentar la tensión en la entrada, el valor leído aumenta.

**Aceptación:** un recorrido lento del potenciómetro de un extremo al otro produce una serie de valores sin saltos hacia atrás mayores al ruido declarado.

### ANA-4 — Extremos estables
En los extremos del recorrido el valor es estable y corresponde al mínimo y al máximo de la escala.

**Aceptación:** con el potenciómetro en cada extremo, veinte lecturas consecutivas se mantienen dentro del margen declarado del valor extremo, sin saturar antes de llegar al tope.

---

## SRV — Servos

### SRV-1 — Movimiento en cualquier puerto
El docente puede mover a una posición angular el servo conectado en cualquiera de los seis puertos.

**Aceptación:** el servo alcanza visiblemente posiciones distintas para ángulos distintos, en los seis puertos.

### SRV-2 — La posición se mantiene
Tras recibir una orden, el servo mantiene la posición sin nuevas instrucciones.

**Aceptación:** tras ordenar una posición y esperar treinta segundos sin ejecutar nada más, el servo sigue en esa posición y resiste un empuje suave.

### SRV-3 — Servos simultáneos
Varios servos pueden estar en posiciones distintas al mismo tiempo.

**Aceptación:** tres servos en tres puertos distintos, ordenados a tres ángulos distintos, mantienen las tres posiciones simultáneamente.

---

## MOT — Motores

### MOT-1 — Movimiento con sentido y velocidad
El docente puede mover un motor en un sentido a una velocidad elegida.

**Aceptación:** para cada motor, el sentido de giro corresponde al elegido y velocidades mayores producen giro visiblemente más rápido.

### MOT-2 — Rótulos A y B
Los motores se identifican con las mismas letras impresas en la placa.

**Aceptación:** el bloque ofrece A y B, y el motor conectado al conector rotulado A responde al valor A.

### MOT-3 — Velocidad cero detiene
Ordenar velocidad cero detiene el motor.

**Aceptación:** tras ordenar velocidad cero, el motor se detiene por inercia sin recibir más energía.

### MOT-4 — Detención global
Existe un bloque que detiene ambos motores de una vez.

**Aceptación:** con ambos motores en movimiento, el bloque los detiene a los dos.

### MOT-5 — Sin promesa de freno
No existe bloque de freno ni de detención de un motor individual por reposo, porque el hardware no puede hacerlo.

**Aceptación:** la paleta no contiene ningún bloque cuyo nombre sugiera frenado activo.

### MOT-6 — Giro limpio a baja velocidad
El motor no emite chillido audible ni gira a tirones en el tramo bajo de velocidades.

**Aceptación:** con el motor sin carga a la velocidad mínima que lo hace girar, el giro es continuo y no se percibe un tono agudo constante.

---

## ULT — Sensor de distancia

### ULT-1 — Lectura de distancia
El docente puede leer la distancia medida por el sensor ultrasónico, en centímetros.

**Aceptación:** el valor devuelto se corresponde con distancias conocidas medidas con regla, dentro del margen declarado en `ARQUITECTURA.md`.

### ULT-2 — Puertos imposibles de equivocar
El bloque de distancia solo ofrece los puertos donde el sensor puede funcionar. Elegir otro debe ser imposible, no fallar en silencio.

**Aceptación:** el selector del bloque no contiene ninguna opción distinta de los puertos 4 y 6.

### ULT-3 — Comportamiento fuera de alcance
Cuando no hay eco, el bloque devuelve un valor definido y documentado, no un valor arbitrario.

**Aceptación:** apuntando al vacío, el bloque devuelve consistentemente el valor declarado en `ARQUITECTURA.md`.

---

## DOC — Documentación para el docente

### DOC-1 — Qué se conecta dónde
El README explica qué es cada puerto y qué tipo de periférico admite, incluida la restricción del sensor de distancia.

**Aceptación:** un docente que nunca vio la placa puede, leyendo solo el README, decidir en qué puerto conectar cada uno de los periféricos disponibles.

### DOC-2 — Límites prácticos
El README documenta los límites de corriente que el docente va a encontrar en el aula.

**Aceptación:** el README declara explícitamente que no se pueden mover varios servos con carga simultáneamente sin que actúe la protección.

---

## Ambigüedades bloqueantes

Una tarea **no arranca** si toca un requisito con una ambigüedad sin resolver. Si se decide avanzar igual, el supuesto adoptado se escribe acá como tal, para poder revisarlo después.

| ID | Ambigüedad | Bloquea | Estado |
|---|---|---|---|
| D1 | Escala de la lectura analógica: ¿se normalizan los 10 y los 12 bits a una escala única, o se expone la diferencia? | ANA-2 | Abierta |
| D2 | ¿Existe lectura digital además de escritura? | — | **Resuelta:** fuera del alcance de la primera versión |
| D3 | Ganancia por defecto del conversor analógico | ANA-3, ANA-4 | Abierta |
| D4 | Idioma de las cadenas fuente | GEN-2, GEN-3 | **Resuelta (revisada 2026-08-29):** código fuente en inglés, con capa de localización en `_locales/es-ES/` para el docente. Ver `ARQUITECTURA.md` §8 y la Tarea 8 de `PLAN-DE-TAREAS.md`. |
| D5 | Nombre definitivo del paquete y del repositorio | GEN-6 | **Resuelta:** paquete y repositorio `pxt-kroma`, nombre visible KROMA |
| D6 | Margen de tolerancia declarado para ANA-2, ANA-3, ANA-4, ULT-1 y ULT-3 | ANA-2, ANA-3, ANA-4, ULT-1, ULT-3 | Abierta |

---

## Fuera del alcance de la primera versión

Se listan para que quede constancia de que fueron consideradas y descartadas, no olvidadas.

- Lectura digital de entradas (D2)
- Control de la frecuencia de PWM de servos por parte del docente
- Selección de ganancia del conversor por parte del docente
- Lectura del estado de carga de la batería
- Periféricos distintos del servo, el motor DC y el sensor ultrasónico
