// Test program. Not compiled into the package (see testFiles in pxt.json).
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
    basic.pause(200)
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
