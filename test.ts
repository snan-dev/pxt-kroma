// Test program. Not compiled into the package (see testFiles in pxt.json).
for (let port = 1; port <= 6; port++) {
    kroma.digitalOutput(port, true)
    basic.pause(200)
    kroma.digitalOutput(port, false)
}
let pressed = kroma.digitalInput(kroma.Port.Port2)
basic.showNumber(pressed ? 1 : 0)
let level = kroma.analogInput(kroma.Port.Port1)
basic.showNumber(level)
let level2 = kroma.analogInput(kroma.Port.Port5)
basic.showNumber(level2)
