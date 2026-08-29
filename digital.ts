// PCA9536 driver (digital output expander). Completed in Task 2.
// See docs/ARQUITECTURA.md §5 and §6.3.
namespace kroma {
    const REG_INPUT = 0x00
    const REG_OUTPUT = 0x01
    const REG_CONFIG = 0x03

    let initialized = false
    // Mirror of the output register (§6.3): which of the 4 expander pins
    // are driven high. Avoids a read-modify-write I2C round trip per write.
    let outputMirror = 0x00
    // Mirror of the configuration register: which of the 4 expander pins
    // are inputs (bit=1) vs outputs (bit=0). The PCA9536 has push-pull
    // outputs (confirmed against the NXP datasheet), so a pin left
    // configured as output would electrically fight an external device
    // (e.g. a pushbutton) instead of sensing it. Direction is switched per
    // pin on demand instead of fixed once at init. 0x0F matches the real
    // power-on default: all four pins as inputs.
    let configMirror = 0x0F

    function writeReg(reg: number, value: number): void {
        pins.i2cWriteNumber(I2C_ADDRESSES.PCA9536, (reg << 8) | value, NumberFormat.UInt16BE)
    }

    function readReg(reg: number): number {
        pins.i2cWriteNumber(I2C_ADDRESSES.PCA9536, reg, NumberFormat.UInt8BE, true)
        return pins.i2cReadNumber(I2C_ADDRESSES.PCA9536, NumberFormat.UInt8BE)
    }

    function ensureInitialized(): void {
        if (initialized) return
        writeReg(REG_CONFIG, configMirror)
        writeReg(REG_OUTPUT, outputMirror)
        initialized = true
    }

    function findPortEntry(port: Port) {
        for (let i = 0; i < PORT_TABLE.length; i++) {
            if (PORT_TABLE[i].port === port) return PORT_TABLE[i]
        }
        return PORT_TABLE[0] // unreachable: every Port value has a row
    }

    // tables.ts stores native pins as raw numbers so check-tablas.js can
    // parse them (§6.5); this converts to the DigitalPin enum pins.* expects.
    function nativePin(pin: number): DigitalPin {
        switch (pin) {
            case 9: return DigitalPin.P9
            case 12: return DigitalPin.P12
            default: return DigitalPin.P9 // unreachable given tables.ts
        }
    }

    export function setDigital(port: Port, value: boolean): void {
        ensureInitialized()
        let entry = findPortEntry(port)
        if (entry.digital.type === "native") {
            pins.digitalWritePin(nativePin(entry.digital.pin), value ? 1 : 0)
            return
        }

        let mask = 1 << entry.digital.pin
        if (configMirror & mask) {
            configMirror = configMirror & ~mask // switch this pin to output
            writeReg(REG_CONFIG, configMirror)
        }
        outputMirror = value ? (outputMirror | mask) : (outputMirror & ~mask)
        writeReg(REG_OUTPUT, outputMirror)
    }

    export function readDigital(port: Port): boolean {
        ensureInitialized()
        let entry = findPortEntry(port)
        if (entry.digital.type === "native") {
            return pins.digitalReadPin(nativePin(entry.digital.pin)) !== 0
        }

        let mask = 1 << entry.digital.pin
        if (!(configMirror & mask)) {
            configMirror = configMirror | mask // switch this pin to input
            writeReg(REG_CONFIG, configMirror)
        }
        return (readReg(REG_INPUT) & mask) !== 0
    }
}
