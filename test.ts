// Test program. Not compiled into the package (see testFiles in pxt.json).
// Completed starting with Task 2, once blocks exist.
kroma.digitalOutput(kroma.Port.Port1, true)
kroma.digitalOutput(kroma.Port.Port4, false)
let pressed = kroma.digitalInput(kroma.Port.Port2)
basic.showNumber(pressed ? 1 : 0)
