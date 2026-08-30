// Analog output driver (ports 4 and 6 only). Completed in Task 9.
// See docs/ARQUITECTURA.md §3.8, §3.9 and §4.1.
namespace kroma {
    let initialized = false

    // No chip to configure — the native pin is written directly. Kept for
    // consistency with the ensureInitialized() convention every driver
    // follows (§6.2), same reasoning as analog.ts's ADS1015 branch.
    function ensureInitialized(): void {
        if (initialized) return
        initialized = true
    }

    // tables.ts stores native pins as raw numbers so check-tablas.js can
    // parse them (§6.5); this converts to the AnalogPin enum
    // pins.analogWritePin expects. Own copy rather than reusing digital.ts's
    // nativePin (digital.ts's returns DigitalPin, not AnalogPin), same
    // per-driver duplication analog.ts already uses for its own nativePin.
    function nativePin(pin: number): AnalogPin {
        switch (pin) {
            case 9: return AnalogPin.P9
            case 12: return AnalogPin.P12
            default: return AnalogPin.P9 // unreachable given tables.ts
        }
    }

    function clamp(value: number): number {
        if (isNaN(value)) return 0
        if (value < 0) return 0
        if (value > 100) return 100
        return value
    }

    export function writeAnalogOutput(port: number, value: number): void {
        ensureInitialized()
        let level = clamp(value)
        let entry = findPortEntry(port)
        if (entry.digital.type !== "native") {
            // Reachable only from the JavaScript view of the editor: a
            // numeric TS enum doesn't stop `kroma.analogOutput(2, ...)` from
            // compiling, bypassing the Blockly selector that restricts
            // %port to 4/6 (board.ts, NativeDigitalPort, no shadow). Falls
            // back to the nearer of the two valid ports instead of doing
            // nothing silently — SAL-2 rules out silent failure, and
            // findPortEntry already uses the same "clamp, don't fail
            // silently" spirit for the full 1-6 range. Precedent for the
            // Task 6 (distance sensor) block, which shares NativeDigitalPort.
            entry = findPortEntry(entry.port <= 4 ? 4 : 6)
        }
        if (entry.digital.type === "native") {
            pins.analogWritePin(nativePin(entry.digital.pin), Math.round(level * 1023 / 100))
        }
    }
}
