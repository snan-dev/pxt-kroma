// Background polling fiber for reactive event blocks (DIG-5, ANA-5).
// See docs/ARQUITECTURA.md §2.3. Reuses digital.ts/analog.ts for the actual
// port reads (§6.4) — no hardware access lives here.
namespace kroma {
    const POLL_INTERVAL_MS = 40
    // Number of consecutive polls a condition must hold before it counts as
    // confirmed — covers both mechanical pushbutton bounce and an analog
    // reading that hovers near a threshold. Provisional, to adjust with the
    // board (ARQUITECTURA.md §8 style note in the Task 10 doc).
    const STABLE_COUNT = 2
    // Same margin already declared for ANA-2 (ARQUITECTURA.md §8) — not a
    // new value invented here.
    const ANALOG_EQUAL_TOLERANCE = 3

    interface DigitalWatch {
        port: number
        state: boolean       // the transition that triggers the handler
        lastSatisfied: boolean
        candidate: boolean
        stableCount: number
    }

    interface AnalogWatch {
        port: number
        op: KromaCompareOp
        threshold: number    // 0-100, already rounded and clamped
        lastSatisfied: boolean
        candidate: boolean
        stableCount: number
    }

    interface DigitalSourceEntry { port: number; source: number }
    interface AnalogSourceEntry { port: number; op: KromaCompareOp; source: number }

    let digitalWatches: DigitalWatch[] = []
    let analogWatches: AnalogWatch[] = []
    let digitalSources: DigitalSourceEntry[] = []
    let analogSources: AnalogSourceEntry[] = []
    let initialized = false

    // One control.onEvent source per condition family, allocated on first
    // use with control.allocateEventSource() — confirmed collision-free
    // against the rest of this target (pxt-microbit 9.0.12) by construction,
    // instead of a hand-picked fixed base that could clash with a DAL id.
    // Digital keys by port alone: the true/false state that distinguishes
    // the two watches on the same port travels as the event value (1/0),
    // not as a separate source. Analog keys by port and operator, because
    // the event value there is the threshold itself, and two different
    // operators can legitimately share the same threshold.
    function digitalEventSource(port: number): number {
        for (let i = 0; i < digitalSources.length; i++) {
            if (digitalSources[i].port === port) return digitalSources[i].source
        }
        let source = control.allocateEventSource()
        digitalSources.push({ port: port, source: source })
        return source
    }

    function analogEventSource(port: number, op: KromaCompareOp): number {
        for (let i = 0; i < analogSources.length; i++) {
            if (analogSources[i].port === port && analogSources[i].op === op) return analogSources[i].source
        }
        let source = control.allocateEventSource()
        analogSources.push({ port: port, op: op, source: source })
        return source
    }

    // --- Registration, called from board.ts when a docente's event block
    // is declared (once per handler, at program start) ---

    export function watchDigital(port: number, state: boolean): void {
        ensureInitialized()
        for (let i = 0; i < digitalWatches.length; i++) {
            if (digitalWatches[i].port === port && digitalWatches[i].state === state) return
        }
        digitalWatches.push({ port: port, state: state, lastSatisfied: false, candidate: false, stableCount: 0 })
    }

    export function watchAnalog(port: number, op: KromaCompareOp, threshold: number): void {
        ensureInitialized()
        for (let i = 0; i < analogWatches.length; i++) {
            let w = analogWatches[i]
            if (w.port === port && w.op === op && w.threshold === threshold) return
        }
        analogWatches.push({ port: port, op: op, threshold: threshold, lastSatisfied: false, candidate: false, stableCount: 0 })
    }

    export function digitalSource(port: number): number {
        return digitalEventSource(port)
    }

    export function analogSource(port: number, op: KromaCompareOp): number {
        return analogEventSource(port, op)
    }

    // Reusable comparison: ANA-5 today, ULT-4 (Task 6) later. "Equal" is not
    // an exact match — on a noisy reading that would almost never fire — it
    // uses the same ANA-2 margin as a practical equality window.
    export function checkCompare(value: number, op: KromaCompareOp, threshold: number, tolerance: number): boolean {
        switch (op) {
            case KromaCompareOp.Equal: return Math.abs(value - threshold) <= tolerance
            case KromaCompareOp.LessThan: return value < threshold
            case KromaCompareOp.GreaterThan: return value > threshold
        }
        return false
    }

    // --- Polling loop ---

    function ensureInitialized(): void {
        if (initialized) return
        initialized = true
        control.inBackground(() => {
            while (true) {
                pollOnce()
                basic.pause(POLL_INTERVAL_MS)
            }
        })
    }

    // Returns true only on the confirmed rising edge into `satisfied`, after
    // STABLE_COUNT consecutive polls agree on the same candidate value.
    // Updates lastSatisfied silently (no event) on the falling edge too, so
    // the next rising edge into the same condition can be detected again.
    function updateStable(w: { lastSatisfied: boolean; candidate: boolean; stableCount: number }, satisfied: boolean): boolean {
        if (satisfied !== w.candidate) {
            w.candidate = satisfied
            w.stableCount = 1
            return false
        }
        w.stableCount++
        if (w.stableCount < STABLE_COUNT) return false
        if (w.candidate === w.lastSatisfied) return false
        w.lastSatisfied = w.candidate
        return w.lastSatisfied
    }

    function pollOnce(): void {
        // One reading per port actually observed, not one per watch, so two
        // watches sharing a port don't double the I2C traffic. Plain arrays
        // instead of a dictionary keyed by port — pxt's TypeScript subset
        // avoids index-signature objects.
        let digitalPorts: number[] = []
        for (let i = 0; i < digitalWatches.length; i++) {
            if (digitalPorts.indexOf(digitalWatches[i].port) < 0) digitalPorts.push(digitalWatches[i].port)
        }
        let digitalReadings: boolean[] = []
        for (let i = 0; i < digitalPorts.length; i++) digitalReadings.push(readDigital(digitalPorts[i]))

        for (let i = 0; i < digitalWatches.length; i++) {
            let w = digitalWatches[i]
            let reading = digitalReadings[digitalPorts.indexOf(w.port)]
            let satisfied = reading === w.state
            if (updateStable(w, satisfied)) {
                control.raiseEvent(digitalEventSource(w.port), w.state ? 1 : 0)
            }
        }

        let analogPorts: number[] = []
        for (let i = 0; i < analogWatches.length; i++) {
            if (analogPorts.indexOf(analogWatches[i].port) < 0) analogPorts.push(analogWatches[i].port)
        }
        let analogReadings: number[] = []
        for (let i = 0; i < analogPorts.length; i++) analogReadings.push(readAnalog(analogPorts[i]))

        for (let i = 0; i < analogWatches.length; i++) {
            let w = analogWatches[i]
            let reading = analogReadings[analogPorts.indexOf(w.port)]
            let satisfied = checkCompare(reading, w.op, w.threshold, ANALOG_EQUAL_TOLERANCE)
            if (updateStable(w, satisfied)) {
                control.raiseEvent(analogEventSource(w.port, w.op), w.threshold)
            }
        }
    }
}
