// PCA9685 driver (servos). Completed in Task 4.
// See docs/ARQUITECTURA.md §5 and §3.5.
namespace kroma {
    const MODE1 = 0x00
    const PRESCALE = 0xFE
    const LED0_ON_L = 0x06

    const MODE1_SLEEP = 0x10 // oscillator off — required by the datasheet before writing PRESCALE
    const MODE1_AUTO_INCREMENT = 0x20 // SLEEP=0, AI=1 — lets one transaction write a channel's 4 registers

    // 50Hz shared by all six channels (§3.5), fixed here and never exposed.
    // prescale = round(25MHz internal oscillator / (4096 * 50Hz)) - 1, the
    // formula from the NXP datasheet: round(122.07) - 1 = 121.
    const PRESCALE_50HZ = 121

    // Target servo confirmed with Santi: Tower Pro SG90, positional 0-180°.
    // Its datasheet specifies 500-2400us for the full travel. Not a block
    // parameter — no technical parameter exposed "for flexibility" (§2).
    const SERVO_MIN_PULSE_US = 500
    const SERVO_MAX_PULSE_US = 2400
    const SERVO_FREQUENCY_HZ = 50

    let initialized = false

    function writeReg(reg: number, value: number): void {
        pins.i2cWriteNumber(I2C_ADDRESSES.PCA9685, (reg << 8) | value, NumberFormat.UInt16BE)
    }

    // MODE2 isn't touched: the NXP datasheet's power-on default (0x04) already
    // has OUTDRV=1 (totem-pole outputs), which is what this board needs.
    function ensureInitialized(): void {
        if (initialized) return
        writeReg(MODE1, MODE1_SLEEP)
        writeReg(PRESCALE, PRESCALE_50HZ)
        writeReg(MODE1, MODE1_AUTO_INCREMENT)
        control.waitMicros(500) // oscillator stabilization time after leaving SLEEP
        initialized = true
    }

    function clampAngle(angle: number): number {
        if (isNaN(angle)) return 0
        return Math.max(0, Math.min(180, angle))
    }

    function angleToTicks(angle: number): number {
        let pulseUs = SERVO_MIN_PULSE_US + (angle / 180) * (SERVO_MAX_PULSE_US - SERVO_MIN_PULSE_US)
        return Math.round(pulseUs * 4096 * SERVO_FREQUENCY_HZ / 1000000)
    }

    export function moveServo(port: number, angle: number): void {
        ensureInitialized()
        let ticks = angleToTicks(clampAngle(angle))
        let entry = findPortEntry(port)
        let base = LED0_ON_L + 4 * entry.pwmChannel

        // ON_L/ON_H/OFF_L/OFF_H in a single I2C transaction, enabled by AI
        // (set in ensureInitialized()) instead of four separate register
        // writes. ON stays at 0 on every channel: the pulse starts at the
        // beginning of the cycle, no need to stagger channels.
        let buf = pins.createBuffer(5)
        buf.setNumber(NumberFormat.UInt8BE, 0, base)
        buf.setNumber(NumberFormat.UInt8BE, 1, 0) // ON_L
        buf.setNumber(NumberFormat.UInt8BE, 2, 0) // ON_H
        buf.setNumber(NumberFormat.UInt8BE, 3, ticks & 0xFF) // OFF_L
        buf.setNumber(NumberFormat.UInt8BE, 4, (ticks >> 8) & 0xFF) // OFF_H
        pins.i2cWriteBuffer(I2C_ADDRESSES.PCA9685, buf)
    }
}
