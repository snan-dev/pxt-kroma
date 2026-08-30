// Test program. Not compiled into the package (see testFiles in pxt.json).

// Task 10 — event blocks (DIG-5, ANA-5). See docs/ARQUITECTURA.md §2.3.
kroma.onDigitalPortEvent(1, true, function () {
    basic.showIcon(IconNames.Yes)
})

// One operator per tower: port 2 (native ADC) and ports 4/6 (ADS1015).
kroma.onAnalogCompareEvent(2, kroma.KromaCompareOp.LessThan, 30, function () {
    serial.writeLine("port 2 < 30")
})
kroma.onAnalogCompareEvent(4, kroma.KromaCompareOp.GreaterThan, 70, function () {
    serial.writeLine("port 4 > 70")
})
kroma.onAnalogCompareEvent(6, kroma.KromaCompareOp.Equal, 50, function () {
    serial.writeLine("port 6 = 50")
})

// Same event block plugged inside a for: registers one event per iteration
// (ARQUITECTURA.md §2.3), not an error.
for (let loopPort = 1; loopPort <= 6; loopPort++) {
    kroma.onDigitalPortEvent(loopPort, true, function () {
        serial.writeLine("port " + loopPort + " went true")
    })
}

// Task 9 — analog output (SAL-1/2/3). Sweep 0-100-0 on ports 4 and 6, with
// a short pause between steps, to check intermediate levels are visibly
// different and the extremes are stable (0 off, 100 max).
for (let sweepPort = 4; sweepPort <= 6; sweepPort += 2) {
    serial.writeLine("=== analog output port " + sweepPort + " ===")
    for (let level = 0; level <= 100; level += 10) {
        kroma.analogOutput(sweepPort, level)
        basic.pause(200)
    }
    for (let level = 100; level >= 0; level -= 10) {
        kroma.analogOutput(sweepPort, level)
        basic.pause(200)
    }
}

// Recorre los seis puertos: blink en la línea digital, dos lecturas
// digitales, y una lectura continua de 5 segundos en la línea analógica.
for (let port = 1; port <= 6; port++) {
    serial.writeLine("=== port " + port + " ===")

    serial.writeLine("blink digital")
    for (let i = 0; i < 3; i++) {
        kroma.digitalOutput(port, true)
        basic.pause(300)
        kroma.digitalOutput(port, false)
        basic.pause(300)
    }

    let read1 = kroma.digitalInput(port)
    basic.pause(2000)
    let read2 = kroma.digitalInput(port)
    serial.writeLine("digital read 1: " + read1)
    serial.writeLine("digital read 2: " + read2)

    serial.writeLine("analog (5s):")
    let start = input.runningTime()
    while (input.runningTime() - start < 5000) {
        serial.writeLine("  " + kroma.analogInput(port))
        basic.pause(200)
    }
}
