// ADS1015 driver (analog inputs) and native pins. Completed in Task 3.
// See docs/ARQUITECTURA.md §5 and §4.1.
namespace kroma {
    const REG_CONFIG = 0x01
    const REG_CONVERSION = 0x00

    let initialized = false

    // No PCA9536-style persistent state (§6.3): the ADS1015 config register
    // is rewritten on every reading regardless, so there's nothing to set up
    // once at startup. Kept as a flag for the ensureInitialized() convention
    // every driver follows, in case a real init step turns out to be needed.
    function ensureInitialized(): void {
        if (initialized) return
        initialized = true
    }

    // tables.ts stores native analog pins as raw numbers so check-tablas.js
    // can parse them (§6.5); this converts to the AnalogPin enum
    // pins.analogReadPin expects.
    function nativePin(pin: number): AnalogPin {
        switch (pin) {
            case 0: return AnalogPin.P0
            case 1: return AnalogPin.P1
            case 2: return AnalogPin.P2
            default: return AnalogPin.P0 // unreachable given tables.ts
        }
    }

    // Config register value for each ADS1015 channel: MUX single-ended
    // (100/101/110 for AIN0/AIN1/AIN2), PGA=001 (GAIN_ONE, ±4.096V, D3),
    // MODE=1 (single-shot), DR=100 (1600SPS), COMP_QUE=11 (comparator
    // disabled — ALERT/RDY isn't wired on this board), OS=1 (start a
    // conversion). Derived from the register layout in the ADS1015
    // datasheet, not yet confirmed against the physical board (V2 of
    // VERIFICACION.md).
    function configFor(channel: number): number {
        switch (channel) {
            case 0: return 0xC383 // AIN0 — port 6
            case 1: return 0xD383 // AIN1 — port 5
            case 2: return 0xE383 // AIN2 — port 4
            default: return 0xC383 // unreachable given tables.ts
        }
    }

    function clamp(value: number): number {
        if (value < 0) return 0
        if (value > 100) return 100
        return value
    }

    function readAds1015(channel: number): number {
        let config = pins.createBuffer(3)
        config.setNumber(NumberFormat.UInt8BE, 0, REG_CONFIG)
        config.setNumber(NumberFormat.UInt16BE, 1, configFor(channel))
        pins.i2cWriteBuffer(I2C_ADDRESSES.ADS1015, config)

        // ~0.6ms theoretical conversion time at 1600SPS; fixed wait with
        // margin instead of polling the OS bit (§3.2 of the task doc).
        control.waitMicros(1000)

        pins.i2cWriteNumber(I2C_ADDRESSES.ADS1015, REG_CONVERSION, NumberFormat.UInt8BE, true)
        let raw = pins.i2cReadNumber(I2C_ADDRESSES.ADS1015, NumberFormat.UInt16BE) >> 4
        // The 12-bit result is two's complement; sign-extend it before use,
        // or a small negative code near 0V (offset/noise) reads back as a
        // large positive value instead.
        if (raw > 2047) raw -= 4096
        return clamp(Math.round(raw * 100 / 2047))
    }

    export function readAnalog(port: number): number {
        ensureInitialized()
        let entry = findPortEntry(port)
        if (entry.analog.type === "native") {
            let raw = pins.analogReadPin(nativePin(entry.analog.pin))
            return clamp(Math.round(raw * 100 / 1023))
        }

        return readAds1015(entry.analog.channel)
    }
}
