// Public enums and correspondence tables (pure data, no logic).
// See docs/ARQUITECTURA.md §4 and §6.4-6.5.
namespace kroma {
    export enum Port {
        //% block="1"
        Port1 = 1,
        //% block="2"
        Port2 = 2,
        //% block="3"
        Port3 = 3,
        //% block="4"
        Port4 = 4,
        //% block="5"
        Port5 = 5,
        //% block="6"
        Port6 = 6,
    }

    // Reuses values 4 and 6 from Port on purpose: it's the same port
    // vocabulary (GEN-3), restricted to the two that have a native micro:bit
    // pin and can measure time with microsecond resolution
    // (see docs/ARQUITECTURA.md §3.1). It is not a vocabulary of its own.
    export enum NativeDigitalPort {
        //% block="4"
        Port4 = 4,
        //% block="6"
        Port6 = 6,
    }

    export enum Motor {
        //% block="A"
        A = 1,
        //% block="B"
        B = 2,
    }

    // @table:ports:start
    export const PORT_TABLE = [
        { port: 1, analog: { type: "native", pin: 0, bits: 10 }, digital: { type: "expander", pin: 2 }, pwmChannel: 2 },
        { port: 2, analog: { type: "native", pin: 1, bits: 10 }, digital: { type: "expander", pin: 1 }, pwmChannel: 1 },
        { port: 3, analog: { type: "native", pin: 2, bits: 10 }, digital: { type: "expander", pin: 0 }, pwmChannel: 0 },
        { port: 4, analog: { type: "ads1015", channel: 2, bits: 12 }, digital: { type: "native", pin: 9 }, pwmChannel: 3 },
        { port: 5, analog: { type: "ads1015", channel: 1, bits: 12 }, digital: { type: "expander", pin: 3 }, pwmChannel: 4 },
        { port: 6, analog: { type: "ads1015", channel: 0, bits: 12 }, digital: { type: "native", pin: 12 }, pwmChannel: 5 },
    ]
    // @table:ports:end

    // @table:motors:start
    export const MOTOR_TABLE = [
        { label: "A", speedPin: 8, directionPin: 16 },
        { label: "B", speedPin: 15, directionPin: 14 },
    ]
    export const MOTOR_STANDBY_PIN = 13
    // @table:motors:end

    export const I2C_ADDRESSES = {
        PCA9685: 0x40, // Servos
        PCA9536: 0x41, // Digital outputs
        ADS1015: 0x48, // Analog inputs
    }
}
