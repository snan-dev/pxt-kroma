// TB6612 driver (direct pins). Completed in Task 5.
// See docs/ARQUITECTURA.md §5 and §3.4.
namespace kroma {
    // D-MOT-a: native PWM period for the two motor speed pins. The
    // micro:bit's 20ms (50Hz) default causes audible whine and jerky
    // rotation at low duty (MOT-6). HARDWARE.md §9.7 suggests a few hundred
    // microseconds — enough to keep current from collapsing between cycles
    // (period << the motor's electrical L/R time constant) — but that's an
    // electrical criterion; MOT-6 is acoustic and more demanding, since a
    // few hundred microseconds (a few kHz) still falls in the most
    // sensitive part of human hearing. 40us (25kHz) clears the audible
    // range even for a young ear, without the torque loss of going lower.
    // If V4 finds the motor needs a lower frequency, step down this ladder
    // (50us/20kHz, 100us/10kHz, 250us/4kHz — each step trades audible
    // margin for torque) and record the final value and why in
    // ARQUITECTURA.md §8.
    const MOTOR_PWM_PERIOD_US = 40

    let initialized = false
    let standbyActive = false          // mirrors the level of the standby pin (§6.3)
    let lastDirection: number[] = []   // mirrors the last direction written per motor, indexed by motor id - 1

    // tables.ts stores native pins as raw numbers so check-tablas.js can
    // parse them (§6.5); these convert to the enums pins.* expects. Own
    // copies rather than sharing with other drivers, same per-driver
    // duplication analogOutput.ts already uses for its own nativePin.
    function speedPin(pin: number): AnalogPin {
        switch (pin) {
            case 8: return AnalogPin.P8
            case 15: return AnalogPin.P15
            default: return AnalogPin.P8 // unreachable given tables.ts
        }
    }

    function directionPin(pin: number): DigitalPin {
        switch (pin) {
            case 16: return DigitalPin.P16
            case 14: return DigitalPin.P14
            default: return DigitalPin.P16 // unreachable given tables.ts
        }
    }

    // MOTOR_STANDBY_PIN (tables.ts) is the only literal for this pin (§6.4);
    // this is its conversion to DigitalPin, same pattern as the two above.
    function standbyPin(): DigitalPin {
        switch (MOTOR_STANDBY_PIN) {
            case 13: return DigitalPin.P13
            default: return DigitalPin.P13 // unreachable given tables.ts
        }
    }

    function clampSpeed(speed: number): number {
        if (isNaN(speed)) return 0
        if (speed < 0) return 0
        if (speed > 100) return 100
        return speed
    }

    // No third state possible in the hardware (§4.3): anything that isn't
    // Backward is treated as Forward, same fallback spirit as findMotorEntry.
    function normalizeDirection(direction: number): number {
        return direction === MotorDirection.Backward ? MotorDirection.Backward : MotorDirection.Forward
    }

    function ensureInitialized(): void {
        if (initialized) return

        pins.digitalWritePin(standbyPin(), 1) // standby high: the TB6612 outputs nothing with standby low
        standbyActive = true

        for (let i = 0; i < MOTOR_TABLE.length; i++) {
            let entry = MOTOR_TABLE[i]
            pins.digitalWritePin(directionPin(entry.directionPin), entry.forwardLevel)
            lastDirection[entry.motor - 1] = MotorDirection.Forward

            // Put the pin into analog mode (even at 0) before touching its
            // period: setting the period on a pin that hasn't done an
            // analog write yet has no effect on this runtime.
            pins.analogWritePin(speedPin(entry.speedPin), 0)
            pins.analogSetPeriod(speedPin(entry.speedPin), MOTOR_PWM_PERIOD_US)
        }

        initialized = true
    }

    export function driveMotor(motor: number, direction: number, speed: number): void {
        ensureInitialized()
        let entry = findMotorEntry(motor)
        let index = entry.motor - 1
        let dir = normalizeDirection(direction)
        let level = clampSpeed(speed)

        // Global standby (§3.3): raising it here is safe only because
        // stopAllMotors always zeroes both speeds first (D-MOT-d) — a motor
        // left at a nonzero duty from before a stop can't come back to life
        // as a side effect of the other motor's next move.
        if (!standbyActive) {
            pins.digitalWritePin(standbyPin(), 1)
            standbyActive = true
        }

        // Zero the duty before flipping direction, only when it actually
        // changes (the mirror avoids doing this on every call inside a
        // loop). The H-bridge reversing while delivering current is the
        // worst moment for the ~1.2A continuous rail limit (§3.7); a zero
        // duty an instant before removes it at no cost.
        if (dir !== lastDirection[index]) {
            pins.analogWritePin(speedPin(entry.speedPin), 0)
            let dirLevel = dir === MotorDirection.Forward ? entry.forwardLevel : 1 - entry.forwardLevel
            pins.digitalWritePin(directionPin(entry.directionPin), dirLevel)
            lastDirection[index] = dir
        }

        pins.analogWritePin(speedPin(entry.speedPin), Math.round(level * 1023 / 100))
    }

    export function stopMotors(): void {
        ensureInitialized()
        // Order matters (D-MOT-d): both speeds to zero first, standby down
        // second. Dropping standby first would leave the old duty on both
        // PWM pins, so the next move on either motor would raise the shared
        // standby and start the other motor with its stale speed too.
        for (let i = 0; i < MOTOR_TABLE.length; i++) {
            pins.analogWritePin(speedPin(MOTOR_TABLE[i].speedPin), 0)
        }
        pins.digitalWritePin(standbyPin(), 0)
        standbyActive = false
        // lastDirection is untouched: it's still the last direction asked
        // for, so the next driveMotor() in the same direction doesn't
        // re-zero the duty for no reason.
    }
}
