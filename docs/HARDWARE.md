# Placa controladora y expansora para micro:bit
## Documentación técnica — relevamiento a partir de los archivos del proveedor

**Estado:** borrador de trabajo interno
**Fuente:** paquete `pcbfiles_v2` (esquemáticos KiCad, gerbers, BOM y archivos de posicionamiento) + código de prueba MakeCode provisto por el proveedor
**Versión del esquemático relevado:** placa principal v3 (KiCad 8.0.9, fecha de generación 05/05/2026)

---

## 1. Resumen

La placa es un módulo sobre el que se encastra el micro:bit y que cumple tres funciones simultáneas:

1. **Alimentación autónoma** con batería 18650, cargador integrado y tres rieles de tensión regulados y protegidos.
2. **Controlador de motores**, con dos canales de motor DC y seis canales de servo.
3. **Expansor de entradas y salidas**, que agrega pines analógicos y digitales sin consumir pines del micro:bit.

Todos los periféricos se conectan mediante **cables de red RJ45 estándar**. Hay ocho conectores en total: seis para periféricos y dos exclusivos para motores DC.

El diseño está claramente orientado al aula: conectores que solo entran de una manera, protecciones distribuidas, indicadores luminosos y alimentación con corte automático.

---

## 2. Alimentación y batería

### 2.1 Fuentes de energía

La placa admite dos fuentes: entrada **USB-C** y **batería 18650** (portapilas montado en la placa).

La selección es automática por hardware. La tensión del USB actúa sobre la compuerta de un MOSFET de canal P en serie con el positivo de la batería y lo corta. Con el USB conectado, la batería queda desconectada del consumo y solo se carga; al desconectar el USB, la batería toma el relevo sin interrupción.

Después del punto de unión hay un segundo MOSFET de canal P que funciona como **llave general**, comandado por el pulsador de la placa. El botón no corta la corriente con su propio contacto: cambia la tensión de compuerta del transistor.

Un MOSFET de canal N en el retorno de la batería provee **protección contra polaridad invertida** de la celda.

### 2.2 Rieles de tensión

| Riel | Cómo se genera | Corriente de diseño | Límite del fusible electrónico |
|---|---|---|---|
| 12 V | Convertidor elevador desde la batería | 1,8 A | 3 A |
| 5 V | Convertidor elevador desde la batería | 2,3 A | 3 A |
| 3,3 V | Regulador lineal desde el riel de 5 V | — | 2 A |

Como la batería entrega entre 3,0 y 4,2 V, los rieles de 12 V y 5 V se obtienen **elevando** tensión, no bajándola. Los 3,3 V sí se obtienen bajando desde los 5 V, mediante un regulador lineal.

Los 12 V alimentan los motores, los 5 V los sensores que lo requieran, y los 3,3 V la lógica de los chips y los periféricos.

El micro:bit recibe sus 3,3 V desde la placa a través de un diodo Schottky.

### 2.3 Protecciones

Cada uno de los tres rieles pasa por un **fusible electrónico** (eFuse): mide la corriente, corta al superar el límite y se rearma solo, sin destruirse. Es lo que permite que un cortocircuito accidental en un cable RJ45 no dañe la placa.

### 2.4 Carga y monitoreo

- Chip cargador de litio dedicado, con ciclo completo (corriente constante, luego tensión constante, luego corte). La corriente de carga la fija una resistencia de la placa.
- **LED amarillo:** carga en curso.
- **LED verde:** carga completa.
- **LED rojo:** batería baja. Lo maneja un supervisor de tensión independiente con divisor resistivo; el umbral queda en torno a los **3,4 V** de batería.
- **LED blanco:** placa encendida.

---

## 3. Arquitectura de control

El micro:bit maneja la placa por dos caminos distintos.

**Por bus I2C (2 pines):** tres chips comparten las líneas SCL y SDA. Agregar chips a este bus no consume pines adicionales.

**Por pines directos (5 pines):** el driver de motores, que necesita entrega de potencia y respuesta inmediata sin depender de un bus compartido.

| Función | Chip | Cómo se controla |
|---|---|---|
| Servos (6 canales) | PCA9685 | I2C |
| Entradas analógicas (3) | ADS1015, 12 bits | I2C |
| Salidas digitales (4) | PCA9536 | I2C |
| Motores DC (2) | TB6612FNG | pines directos |

### 3.1 Direcciones I2C

| Chip | Dirección |
|---|---|
| PCA9685 (servos) | 0x40 — los seis pines de dirección están a masa |
| PCA9536 (salidas digitales) | 0x41 — dirección fija |
| ADS1015 (entradas analógicas) | 0x48 — pin ADDR a masa |

---

## 4. Mapa de pines del micro:bit

| Pin | Uso en la placa |
|---|---|
| P0 | Línea analógica del puerto J5B |
| P1 | Línea analógica del puerto J5A |
| P2 | Línea analógica del puerto J5C |
| P3, P4, P6, P7, P10 | Sin usar — reservados para la matriz de LEDs |
| P5, P11 | Sin usar — reservados para los botones A y B |
| P8 | Velocidad (PWM) del motor 2 |
| P9 | Línea digital del puerto J3B |
| P12 | Línea digital del puerto J3C |
| P13 | Reposo (standby) de los motores — **compartido por ambos** |
| P14 | Dirección del motor 1 |
| P15 | Velocidad (PWM) del motor 1 |
| P16 | Dirección del motor 2 |
| P19 | SCL — reloj del bus I2C |
| P20 | SDA — datos del bus I2C |

**Conclusión operativa:** con la placa colocada **no queda ningún pin del micro:bit disponible** para otro uso. Todo lo que se conecte debe entrar por los puertos RJ45.

Esto tiene un impacto directo sobre las actividades introductorias que usan P0, P1 y P2 con pinzas cocodrilo: esos pines ya están tomados.

---

## 5. Conectores RJ45 para periféricos

### 5.1 Asignación de los ocho hilos

La asignación es idéntica en los seis puertos de periférico:

| Contacto | Señal |
|---|---|
| 1 | SCL — reloj del I2C |
| 2 | PWM para servo |
| 3 | 5 V |
| 4 | Línea digital |
| 5 | GND |
| 6 | Línea analógica |
| 7 | SDA — datos del I2C |
| 8 | 3,3 V |

Cada periférico dispone entonces de: dos tensiones de alimentación, tierra, el bus I2C completo, un canal de PWM, una línea digital y una línea analógica.

### 5.2 Los seis puertos no son equivalentes

El significado de cada hilo es siempre el mismo, pero **el origen de la línea analógica y de la línea digital cambia según el puerto**:

| Puerto impreso | Etiqueta esquemático | Origen analógico | Etiqueta analógica | Origen digital | Etiqueta digital | Canal PWM |
|---|---|---|---|---|---|---|
| **1** | J5B | micro:bit P0 | PIN_AD_0 | PCA9536 · pin P0 | PD0_ext | PWM1 |
| **2** | J5A | micro:bit P1 | PIN_AD_1 | PCA9536 · pin P1 | PD1_ext | PWM2 |
| **3** | J5C | micro:bit P2 | PIN_AD_2 | PCA9536 · pin P2 | PD2_ext | PWM3 |
| **4** | J3B | ADS1015 · canal AIN2 | PA2_ext | micro:bit P9 | PIN_D_9 | PWM4 |
| **5** | J3A | ADS1015 · canal AIN1 | PA1_ext | PCA9536 · pin P3 | PD3_ext | PWM5 |
| **6** | J3C | ADS1015 · canal AIN0 | PA0_ext | micro:bit P12 | PIN_D_12 | PWM6 |

Resumen del reparto:

- **Puertos 1 a 3** (torre izquierda, J5): lo analógico va directo a los pines del micro:bit (10 bits, se lee con los bloques analógicos habituales) y lo digital sale del expansor PCA9536. Los tres tienen la misma arquitectura.
- **Puertos 4 a 6** (torre derecha, J3): lo analógico pasa por el conversor ADS1015 (12 bits, se lee por I2C). Lo digital es heterogéneo: el puerto 5 usa el expansor, mientras que los puertos 4 y 6 usan pines directos del micro:bit.

El canal AIN3 del ADS1015 quedó sin conectar.

### 5.3 Rótulos impresos en la placa

La serigrafía, reconstruida a partir de la capa `F_Silkscreen` de los gerbers, incluye:

- **Puertos de periférico numerados del 1 al 6**, cada uno con una línea guía hacia su conector.
- **Puertos de motor rotulados A y B.**
- Textos "BATERÍA 18650", "CARGANDO" y "CARGADO", más el símbolo de encendido.

**Disposición física:** los puertos 1, 2 y 3 están en la torre izquierda, numerados de arriba hacia abajo. Los puertos 4, 5 y 6 están en la torre derecha, numerados de abajo hacia arriba. La numeración recorre el borde inferior de la placa de forma continua.

**Base de la correspondencia:** la asignación de la tabla anterior surge de cruzar la posición física de cada conector (archivo de posicionamiento) con la numeración impresa y con el orden de los canales de PWM. Los canales PWM1 a PWM6 quedan en correspondencia exacta con los puertos 1 a 6, y las líneas analógicas y digitales de los puertos 1 a 3 siguen el mismo orden. Ver la anotación 10.5 sobre el nivel de certeza y cómo verificarlo.

### 5.4 Correspondencia cruzada del expansor digital

Los pines del PCA9536 **no** coinciden en orden con sus etiquetas de placa:

| Pin del chip | Etiqueta en la placa |
|---|---|
| P0 | PD2_ext |
| P1 | PD1_ext |
| P2 | PD0_ext |
| P3 | PD3_ext |

### 5.5 Correspondencia cruzada de los canales de servo

Los canales del PCA9685 tampoco coinciden en orden con las etiquetas PWM de la placa:

| Canal del chip | Etiqueta en la placa | Puerto |
|---|---|---|
| LED0 | PWM3 | J5C |
| LED1 | PWM2 | J5A |
| LED2 | PWM1 | J5B |
| LED3 | PWM4 | J3B |
| LED4 | PWM5 | J3A |
| LED5 | PWM6 | J3C |

Los canales LED6 a LED15 quedaron sin conectar.

### 5.6 Puertos de motor

Los conectores **J2** y **J4** usan el mismo formato RJ45 pero llevan únicamente potencia de motor:

| Rótulo impreso | Conector | Motor del esquemático | Contacto 8 | Contacto 7 | Contacto 1 |
|---|---|---|---|---|---|
| **A** (izquierda) | J2 | Motor **2** | MOTOR2_1 | MOTOR2_2 | GND |
| **B** (derecha) | J4 | Motor **1** | MOTOR1_1 | MOTOR1_2 | GND |

Los contactos 2 a 6 quedan sin conectar. **No llevan alimentación lógica ni I2C.**

**Atención — los rótulos están cruzados respecto del esquemático.** El conector impreso como **A** corresponde al motor 2 (velocidad en P8, dirección en P16), y el impreso como **B** corresponde al motor 1 (velocidad en P15, dirección en P14). La extensión no debe asumir que A es el motor 1.

---

## 6. Control de motores DC

### 6.1 Señales

El driver TB6612FNG recibe, por cada canal, una señal de velocidad (PWM) y dos señales de dirección que deben ser siempre opuestas entre sí.

**La señal de velocidad proviene directamente de los pines del micro:bit** (P15 para el motor 1, P8 para el motor 2), no del PCA9685. El driver de servos no interviene en el control de motores: sus seis canales activos van exclusivamente a los puertos RJ45.

La separación es deliberada. Un servo requiere una señal estable que se mantenga sola, y eso lo resuelve mejor un chip dedicado. Un motor requiere cambios de velocidad inmediatos, sin que la orden deba atravesar un bus compartido con otros tres dispositivos.

Para ahorrar pines, la placa usa **un solo pin de dirección por motor** y genera la señal opuesta con un inversor lógico dedicado. Dos inversores en la placa ahorran dos pines del micro:bit.

### 6.2 Consecuencia de diseño

Un puente H de este tipo admite cuatro estados de dirección: adelante, atrás, freno activo y rueda libre. Como el inversor impide que las dos entradas estén en el mismo estado, **dos de esos cuatro estados dejan de ser accesibles**.

Consecuencias concretas:

- **No es posible frenar activamente un motor.** Para detenerlo hay que llevar la velocidad a cero, y el motor queda libre girando por inercia.
- La entrada de reposo (standby) apaga ambas salidas, pero es **compartida por los dos motores**: no se puede poner uno en reposo y dejar el otro andando.

### 6.3 Características eléctricas

- Alimentación de los motores: riel de 12 V.
- Corriente por canal: aproximadamente **1,2 A continuos**, con picos de hasta **3,2 A**.
- Rango de tensión de entrada anotado en el esquemático: 4 a 13,5 V.

### 6.4 Indicadores

Cada salida de motor tiene **dos LEDs verdes montados en oposición**. Según el sentido de giro se enciende uno u otro. Es un indicador visual directo del estado del motor, útil para depuración en el aula.

---

## 7. Control de servos

El PCA9685 genera hasta dieciséis canales de PWM de forma autónoma; la placa usa seis. Una vez configurado, el chip mantiene la señal sin consumir tiempo de procesador del micro:bit, lo que permite seis servos en posiciones distintas simultáneamente.

**Limitaciones a tener presentes:**

- **La frecuencia es única para todos los canales.** El chip tiene un solo divisor interno. Fijada en unos 50 Hz para servos, ese valor rige para los seis puertos. No es posible usar un puerto para servo y otro para regulación de brillo, que requeriría una frecuencia mucho mayor.
- **La salida del chip es de 3,3 V** y no atraviesa adaptación de niveles hacia el servo. La mayoría de los servos aceptan lógica de 3,3 V, pero conviene verificarlo con los modelos que se vayan a usar.
- **El chip no alimenta el servo:** solo entrega la señal. La potencia sale del riel de 5 V.

**Límite práctico de corriente:** el riel de 5 V corta a los 3 A. Un servo pequeño forzado o frenado puede demandar cerca de 0,7 A. Con cuatro servos trabajando bajo carga simultáneamente ya se roza el corte del fusible. Seis puertos de servo no significan seis servos moviéndose a la vez bajo carga.

---

## 8. Plaquitas periféricas incluidas en el paquete

### 8.1 Motor DC

Adaptador puramente pasivo: conector RJ45 a bornera a tornillo, sin ningún componente activo. Se conecta a J2 o J4.

### 8.2 Servomotor

Toma del cable el hilo de PWM (contacto 2), los 5 V (contacto 3) y la tierra (contacto 5), y los lleva a un conector de tres pines para el servo. Incluye protección contra polaridad invertida y contra sobretensión sobre el riel de 5 V, más un LED verde de encendido.

### 8.3 Sensor ultrasónico (5 V)

De los ocho hilos usa cuatro: 5 V para alimentar el sensor, 3,3 V y tierra como referencia, y **una sola línea digital que hace de disparo y de eco a la vez**. Los pines TRIG y ECHO del sensor están unidos en la plaquita.

Un adaptador de niveles bidireccional traduce entre los 5 V del sensor y los 3,3 V de la placa en ambos sentidos. Incluye las mismas protecciones de polaridad y sobretensión que la plaquita de servo, sobre ambos rieles.

### 8.4 Por qué cada periférico trae protecciones

Los conectores de periférico y los de motor son **físicamente intercambiables**. Si se conecta un periférico a un puerto de motor, el contacto 8 —que normalmente trae 3,3 V— trae la salida de potencia del motor.

Las protecciones de sobretensión y polaridad de cada plaquita están puestas precisamente para que ese error no destruya el periférico. Es una decisión de diseño coherente con el uso en aula.

---

## 9. Implicancias para la extensión de MakeCode

Puntos que el diseño de la extensión va a tener que resolver:

1. **Traducción de nombres.** El expansor digital, el driver de servos y los rótulos de motor tienen numeración cruzada respecto de las etiquetas del esquemático. La extensión debe absorber esas tablas para que el docente elija el número impreso en la placa —"puerto 4", "motor A"— y nada más. Ningún nombre interno del esquemático debería llegar a la interfaz.

2. **Los puertos no son simétricos.** Leer una entrada analógica de la torre J3 (por I2C, 12 bits) y de la torre J5 (pin directo, 10 bits) requiere caminos de código distintos, con rangos de valores distintos. Hay que decidir si la extensión unifica la escala de salida o si expone la diferencia.

3. **No hay freno de motor.** Los bloques disponibles deben limitarse a lo que el hardware permite. Un bloque de "frenar" induciría a error.

4. **El reposo es global.** Tiene sentido un bloque de "detener todo"; no lo tiene uno por motor.

5. **Frecuencia de PWM única** para los seis canales de servo.

6. **Ganancia del conversor analógico.** Conviene fijarla por defecto en el rango más chico que contenga la tensión de trabajo esperada, para no perder resolución innecesariamente.

7. **Período de PWM de los motores.** La velocidad de los motores usa PWM nativo del micro:bit (P8 y P15), no el PCA9685. El período por defecto del micro:bit es de 20 ms, es decir 50 Hz: un valor pensado para servos y demasiado lento para un motor. A esa frecuencia el motor emite un chillido audible y, a baja velocidad, gira a tirones en lugar de parejo.

   La extensión debe **bajar el período al inicializar**, a algo del orden de unos pocos cientos de microsegundos. El driver TB6612FNG lo tolera holgadamente.

   *Cuidado asociado:* en el micro:bit los pines comparten canales internos de PWM, de modo que cambiar el período de P8 y P15 puede afectar a otro pin analógico. Como los seis puertos de periférico usan el chip de servos y no pines analógicos del micro:bit, en esta placa no debería haber conflicto, pero conviene verificarlo con motores y servos funcionando simultáneamente.

---

## 10. Anotaciones y puntos a consultar con el proveedor

### 10.1 Pines CC del conector USB-C sin conectar

En el conector USB-C, los pines **CC1 y CC2 están sin conectar**. Sin las resistencias de 5,1 kΩ a masa, un cargador USB-C a USB-C no detecta que hay un consumidor del otro lado y **no entrega tensión**.

**Impacto:** la placa solo cargaría con cable USB-A a USB-C (donde la resistencia va en el cable) o con la salida USB de una computadora. Con un cargador moderno de celular, no.

**A consultar:** ¿fue una omisión o una decisión? Es la observación de mayor impacto práctico de todo el relevamiento.

### 10.2 Error en el código de prueba provisto

El bucle de prueba de los pines digitales apaga los pines 2 y 1, y enciende los pines 0 y 3, pero **nunca vuelve a apagar estos últimos**. A partir de la segunda vuelta, los pines 0 y 3 quedan encendidos de forma permanente y solo alternan los pines 1 y 2.

Faltan dos líneas apagándolos. No compromete el hardware, pero produce un comportamiento engañoso al testear.

### 10.3 Pérdida del freno de motor

El uso de inversores para ahorrar pines elimina dos de los cuatro estados de dirección del puente H, incluido el freno activo.

**A consultar:** ¿fue una decisión consciente asumiendo el compromiso, o una consecuencia no advertida? Condiciona qué se puede prometer en la extensión y en el material didáctico.

### 10.4 Falta el código de prueba de motores y servos

El código provisto cubre únicamente el expansor digital y el conversor analógico. No hay nada para el driver de motores ni para el de servos.

**A solicitar:** código de prueba de ambos bloques.

### 10.5 Correspondencia entre serigrafía y etiquetas del esquemático — resuelta, pendiente de verificación física

La correspondencia se reconstruyó a partir de la capa de serigrafía de los gerbers y del archivo de posicionamiento; está volcada en la sección 5.2. **No requiere consulta al proveedor.**

Queda una incertidumbre acotada: dentro de cada torre de tres conectores no es posible probar de forma concluyente cuál corresponde a la unidad A, B o C del esquemático, porque el archivo de huella del componente no viene en el paquete.

**Por qué la asignación adoptada es la más probable:** los canales PWM1 a PWM6 quedan en correspondencia exacta con los puertos impresos 1 a 6, y las líneas analógicas y digitales de los puertos 1 a 3 siguen el mismo orden secuencial. Una asignación distinta rompería esa regularidad.

**Verificación sugerida (dos minutos con la placa):** conectar una señal conocida al puerto 4 y leer los tres canales del conversor ADS1015 para ver cuál responde. Con eso queda confirmada la orientación de toda la torre derecha, que es la que más importa porque sus líneas digitales no son homogéneas. Repetir en el puerto 1 para la torre izquierda.

### 10.6 Orden físico de contactos del RJ45

Conviene confirmar la orientación de la numeración de contactos (1 a 8) respecto del conector físico, para poder documentar el cableado y eventualmente fabricar cables o adaptadores.

### 10.7 Nota ambigua sobre P2 en el esquemático

Sobre el pin P2 del conector de borde hay una anotación superpuesta que menciona la matriz de LEDs "in v1". No queda claro si se refiere a la micro:bit V1 o a una versión anterior de la placa.

**A consultar:** aclaración del alcance de esa nota, dado que P2 se usa como línea analógica del puerto J5C.

### 10.8 Compatibilidad con micro:bit V1 y V2

El relevamiento no permite determinar si la placa fue validada con ambas versiones del micro:bit. Dado que hay diferencias en corriente disponible y en comportamiento de algunos pines, conviene confirmarlo.

### 10.9 Riesgo de confusión con conectores de red

Los conectores RJ45 son idénticos a los de red. Un estudiante podría conectar la placa a un switch escolar o viceversa.

**A definir internamente:** advertencia explícita en el material docente y, si es viable, alguna diferenciación visual o mecánica en la placa.

---

## 11. Archivos analizados

```
pcbfiles_v2/pcbfiles/
├── placa_principal/
│   ├── pcb_microbit.pdf              (esquemático, 4 hojas)
│   ├── bom_placa_central_v3.csv      (lista de componentes)
│   ├── component_location.pdf
│   ├── pcb_microbit-top-pos.csv
│   └── gerber_pcb_microbit-v3.zip
├── motordc/
├── servomotor/
└── ultrasonido/
```

Más el código de prueba MakeCode: `main.ts`, `pines_digitales_ext.ts`, `pines_analogicos_ext.ts`.
