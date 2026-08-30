// Public enums, correspondence tables, and the shared port lookup helper.
// See docs/ARQUITECTURA.md §4, §6.4-6.5 and §2.2.
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

    // Shared by the analog compare event today (ANA-5) and the distance
    // compare event when Task 6 implements it (ULT-4) — not declared twice.
    // GEN-6: each member name is as permanent as a blockId once a docente
    // saves a project with the block configured.
    export enum KromaCompareOp {
        //% block="="
        Equal,
        //% block="<"
        LessThan,
        //% block=">"
        GreaterThan
    }

    // Shape of a PORT_TABLE row. Declared outside the @table markers so the
    // literal below stays plain JS for tools/check-tablas.js (§6.5) — the
    // annotation lives on the PORT_TABLE declaration, not inside the array.
    // Literal "type" tags let TypeScript discriminate the union: without
    // them every row would widen to `type: string` and narrowing on
    // `entry.analog.type === "native"` (analog.ts, digital.ts) wouldn't
    // narrow away the sibling variant's fields.
    export type PortAnalog =
        | { type: "native"; pin: number; bits: number }
        | { type: "ads1015"; channel: number; bits: number }

    export type PortDigital =
        | { type: "native"; pin: number }
        | { type: "expander"; pin: number }

    export type PortEntry = {
        port: number
        analog: PortAnalog
        digital: PortDigital
        pwmChannel: number
    }

    // @table:ports:start
    export const PORT_TABLE: PortEntry[] = [
        { port: 1, analog: { type: "native", pin: 0, bits: 10 }, digital: { type: "expander", pin: 2 }, pwmChannel: 2 },
        { port: 2, analog: { type: "native", pin: 1, bits: 10 }, digital: { type: "expander", pin: 1 }, pwmChannel: 1 },
        { port: 3, analog: { type: "native", pin: 2, bits: 10 }, digital: { type: "expander", pin: 0 }, pwmChannel: 0 },
        { port: 4, analog: { type: "ads1015", channel: 2, bits: 12 }, digital: { type: "native", pin: 9 }, pwmChannel: 3 },
        { port: 5, analog: { type: "ads1015", channel: 1, bits: 12 }, digital: { type: "expander", pin: 3 }, pwmChannel: 4 },
        { port: 6, analog: { type: "ads1015", channel: 0, bits: 12 }, digital: { type: "native", pin: 12 }, pwmChannel: 5 },
    ]
    // @table:ports:end

    // Shared by every driver that resolves a port to its PORT_TABLE row
    // (digital.ts, analog.ts), instead of each keeping its own copy (§6.4).
    // With the port parameter now enchufable (§2.2), the value can be
    // anything a plugged-in block returns, not just 1-6 from the dropdown;
    // rounding and clamping to the nearest valid port here (GEN-5) is the
    // one place that needs to know 1-6 is the whole range.
    export function findPortEntry(port: number): PortEntry {
        let rounded = Math.round(port)
        if (rounded < 1) rounded = 1
        if (rounded > 6) rounded = 6
        for (let i = 0; i < PORT_TABLE.length; i++) {
            if (PORT_TABLE[i].port === rounded) return PORT_TABLE[i]
        }
        return PORT_TABLE[0] // unreachable: rounded is always 1-6, and every value has a row
    }

    // Thin wrapper around findPortEntry's own rounding/clamping (GEN-5), for
    // call sites that need the resolved port number itself rather than a
    // PORT_TABLE row — events.ts stores it in a long-lived watch record, so
    // it needs the value normalized once at registration time. Delegates to
    // findPortEntry instead of repeating the round/clamp math, keeping it
    // the one place that knows 1-6 is the whole range (§6.4).
    export function clampPort(port: number): number {
        return findPortEntry(port).port
    }

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
