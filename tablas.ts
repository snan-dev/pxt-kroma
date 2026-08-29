// Enumerados públicos y tablas de correspondencia (datos puros, sin lógica).
// Ver docs/ARQUITECTURA.md §4 y §6.4-6.5.
namespace kroma {
    export enum Puerto {
        //% block="1"
        Puerto1 = 1,
        //% block="2"
        Puerto2 = 2,
        //% block="3"
        Puerto3 = 3,
        //% block="4"
        Puerto4 = 4,
        //% block="5"
        Puerto5 = 5,
        //% block="6"
        Puerto6 = 6,
    }

    // Reutiliza los valores 4 y 6 de Puerto a propósito: es el mismo vocabulario
    // de puertos (GEN-3), restringido a los dos que tienen pin nativo del
    // micro:bit y sirven para medir tiempo con resolución de microsegundos
    // (ver docs/ARQUITECTURA.md §3.1). No es un vocabulario de puertos propio.
    export enum PuertoDigitalNativo {
        //% block="4"
        Puerto4 = 4,
        //% block="6"
        Puerto6 = 6,
    }

    export enum Motor {
        //% block="A"
        A = 1,
        //% block="B"
        B = 2,
    }

    // @tabla:puertos:inicio
    export const TABLA_PUERTOS = [
        { puerto: 1, analogico: { tipo: "nativo", pin: 0, bits: 10 }, digital: { tipo: "expansor", pin: 2 }, canalPWM: 2 },
        { puerto: 2, analogico: { tipo: "nativo", pin: 1, bits: 10 }, digital: { tipo: "expansor", pin: 1 }, canalPWM: 1 },
        { puerto: 3, analogico: { tipo: "nativo", pin: 2, bits: 10 }, digital: { tipo: "expansor", pin: 0 }, canalPWM: 0 },
        { puerto: 4, analogico: { tipo: "ads1015", canal: 2, bits: 12 }, digital: { tipo: "nativo", pin: 9 }, canalPWM: 3 },
        { puerto: 5, analogico: { tipo: "ads1015", canal: 1, bits: 12 }, digital: { tipo: "expansor", pin: 3 }, canalPWM: 4 },
        { puerto: 6, analogico: { tipo: "ads1015", canal: 0, bits: 12 }, digital: { tipo: "nativo", pin: 12 }, canalPWM: 5 },
    ]
    // @tabla:puertos:fin

    // @tabla:motores:inicio
    export const TABLA_MOTORES = [
        { rotulo: "A", pinVelocidad: 8, pinDireccion: 16 },
        { rotulo: "B", pinVelocidad: 15, pinDireccion: 14 },
    ]
    export const PIN_STANDBY_MOTORES = 13
    // @tabla:motores:fin

    export const DIRECCIONES_I2C = {
        PCA9685: 0x40, // Servos
        PCA9536: 0x41, // Salidas digitales
        ADS1015: 0x48, // Entradas analógicas
    }
}
