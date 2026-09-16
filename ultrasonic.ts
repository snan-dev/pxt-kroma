// Distance sensor (ports 4 and 6). Completed in Task 6.
// See docs/ARQUITECTURA.md §5 and §3.1.
namespace kroma {
    // Standard round-trip conversion for this sensor type (~343 m/s sound
    // speed, doubled for the out-and-back path), per the task 6
    // implementation doc §3.1 — to confirm against the real margin measured
    // with the board (V5), not a figure specific to this kit's supplier.
    const US_PER_CM_ROUNDTRIP = 58
    // D6 (ARQUITECTURA.md §8, resolved 2026-09-02): declared max range for
    // ULT-3. Anything beyond this — including "no echo" — reports as -1.
    const MAX_RANGE_CM = 300
    const MAX_ECHO_US = MAX_RANGE_CM * US_PER_CM_ROUNDTRIP

    let initialized = false

    // No chip to configure — the native pin is driven directly. Kept for
    // consistency with the ensureInitialized() convention every driver
    // follows (§6.2), same reasoning as analogOutput.ts.
    function ensureInitialized(): void {
        if (initialized) return
        initialized = true
    }

    // tables.ts stores native pins as raw numbers so check-tablas.js can
    // parse them (§6.5); this converts to the DigitalPin enum pins.*
    // expects. Own copy, same per-driver duplication digital.ts and
    // analogOutput.ts already use for their own nativePin.
    function nativePin(pin: number): DigitalPin {
        switch (pin) {
            case 9: return DigitalPin.P9
            case 12: return DigitalPin.P12
            default: return DigitalPin.P9 // unreachable given tables.ts
        }
    }

    // Trigger and echo share a single line (HARDWARE.md §8.3, task doc
    // §3.1-3.2): a short low pulse, a 10µs high trigger pulse, then the
    // same pin switches to reading the echo's high time. Reconfiguring one
    // pin from output to input right after the trigger, instead of using a
    // second pin like most reference drivers for this sensor, is the point
    // the task doc flags to confirm with the physical board (V5) rather
    // than assume works the same.
    function measureEchoUs(pin: DigitalPin): number {
        pins.setPull(pin, PinPullMode.PullNone)
        pins.digitalWritePin(pin, 0)
        control.waitMicros(2)
        pins.digitalWritePin(pin, 1)
        control.waitMicros(10)
        pins.digitalWritePin(pin, 0)
        return pins.pulseIn(pin, PulseValue.High, MAX_ECHO_US)
    }

    // pins.pulseIn returns 0 on timeout (no echo within MAX_ECHO_US) — the
    // signal for ULT-3's declared -1. The timeout already bounds any real
    // reading to MAX_RANGE_CM, so no separate upper clamp is needed.
    export function readDistance(port: number): number {
        ensureInitialized()
        let entry = findNativeDigitalPortEntry(port)
        if (entry.digital.type !== "native") return -1 // unreachable given findNativeDigitalPortEntry
        let echoUs = measureEchoUs(nativePin(entry.digital.pin))
        if (echoUs === 0) return -1
        return Math.round(echoUs / US_PER_CM_ROUNDTRIP)
    }
}
