// TEMPORARY diagnostic build for the V1 field finding: ports 3 and 5 stay
// at ~3V regardless of true/false through digitalOutput, ports 1/2/4/6
// work. Isolates ports 3 and 5, logs the PORT_TABLE entry findPortEntry
// resolves for each (suspect: the new number-based port lookup) and the
// PCA9536's real registers before/after each write (suspect: the
// mask/index math in digital.ts), over serial, so the cause comes from
// data instead of a guess. See docs/VERIFICACION.md V1.
// Restore the real test.ts once this is done.

// Short lines with a pause after each: long concatenated lines were coming
// through the mbed USB-serial with dropped characters when written back to
// back without letting the UART flush. Repeating the lookup every
// iteration (not just once at boot) gives it more chances at a clean
// sample, since the window right after flashing/reconnecting is the
// noisiest one for this board's USB-serial bridge.
function say(line: string): void {
    serial.writeLine(line)
    basic.pause(300)
}

function logPort(port: number): void {
    let entry = kroma.findPortEntry(port)
    say("lookup port=" + port)
    say("  entry.port=" + entry.port)
    say("  digital.type=" + entry.digital.type)
    say("  digital.pin=" + entry.digital.pin)
}

function logState(label: string): void {
    let state = kroma._debugPca9536()
    say(label + " configMirror=" + state[0])
    say(label + " outputMirror=" + state[1])
    say(label + " chipConfig=" + state[2])
    say(label + " chipOutput=" + state[3])
}

basic.pause(2000)

let iteration = 0
while (true) {
    iteration += 1
    say("=== iteration " + iteration + " ===")
    logPort(3)
    logPort(5)
    logState("start")

    say("--- port 3 = true ---")
    kroma.digitalOutput(3, true)
    logState("after")
    basic.pause(3000)

    say("--- port 3 = false ---")
    kroma.digitalOutput(3, false)
    logState("after")
    basic.pause(3000)

    say("--- port 5 = true ---")
    kroma.digitalOutput(5, true)
    logState("after")
    basic.pause(3000)

    say("--- port 5 = false ---")
    kroma.digitalOutput(5, false)
    logState("after")
    basic.pause(3000)
}
