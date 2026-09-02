// Test program. Not compiled into the package (see testFiles in pxt.json).

// Task 4 — servos (SRV-1, SRV-3). Six distinct angles held at once: at a
// glance every port reaches a visibly different position (SRV-1), and all
// six stay put simultaneously (SRV-3). Reused later for the Task 5 (MOT-6)
// and Task 9 (SAL-3) cross-checks with servos actually moving.
let servoAngles = [20, 50, 80, 110, 140, 170]
for (let servoPort = 1; servoPort <= 6; servoPort++) {
    kroma.setServoAngle(servoPort, servoAngles[servoPort - 1])
}

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

// Task 5 — motors (MOT-1 to MOT-6). Button-triggered, unlike the sequential
// routines above, so each one can be run on its own with the board in hand
// instead of sitting through every earlier routine first. What to connect
// and what to observe for each routine: docs/VERIFICACION.md V4.
// T1: button A. T2: button B. T3: buttons A+B. T4: shake gesture.

// T1 — direction and speed (MOT-1, MOT-2). Each motor forward then backward
// at a fixed speed, stopped in between, shown on the matrix so it's clear
// which motor and direction is running.
function motorT1(): void {
    let cases = [
        { motor: kroma.Motor.A, direction: kroma.MotorDirection.Forward, arrow: ArrowNames.East },
        { motor: kroma.Motor.A, direction: kroma.MotorDirection.Backward, arrow: ArrowNames.West },
        { motor: kroma.Motor.B, direction: kroma.MotorDirection.Forward, arrow: ArrowNames.East },
        { motor: kroma.Motor.B, direction: kroma.MotorDirection.Backward, arrow: ArrowNames.West },
    ]
    for (let c of cases) {
        serial.writeLine("T1 motor " + c.motor + " direction " + c.direction)
        basic.showArrow(c.arrow)
        kroma.setMotorSpeed(c.motor, c.direction, 60)
        basic.pause(2000)
        kroma.stopAllMotors()
        basic.pause(500)
    }
    basic.clearScreen()
}

// T2 — slow ramp (MOT-6). 0 to 100 in steps of 5 and back down, value shown
// on the matrix to note at which number each motor starts turning.
function motorT2(): void {
    for (let motor of [kroma.Motor.A, kroma.Motor.B]) {
        serial.writeLine("T2 motor " + motor + " ramp up")
        for (let speed = 0; speed <= 100; speed += 5) {
            kroma.setMotorSpeed(motor, kroma.MotorDirection.Forward, speed)
            basic.showNumber(speed)
            serial.writeLine("  speed " + speed)
            basic.pause(400)
        }
        serial.writeLine("T2 motor " + motor + " ramp down")
        for (let speed = 100; speed >= 0; speed -= 5) {
            kroma.setMotorSpeed(motor, kroma.MotorDirection.Forward, speed)
            basic.showNumber(speed)
            serial.writeLine("  speed " + speed)
            basic.pause(400)
        }
        kroma.stopAllMotors()
        basic.pause(500)
    }
    basic.clearScreen()
}

// T3 — zero speed and global stop (MOT-3, MOT-4). Both motors forward; A
// alone drops to zero while B keeps going; then stopAllMotors; then A moves
// again alone — B must stay off, the direct test of D-MOT-d.
function motorT3(): void {
    serial.writeLine("T3 both motors forward at 70")
    kroma.setMotorSpeed(kroma.Motor.A, kroma.MotorDirection.Forward, 70)
    kroma.setMotorSpeed(kroma.Motor.B, kroma.MotorDirection.Forward, 70)
    basic.pause(2000)

    serial.writeLine("T3 motor A to zero, B should keep going")
    kroma.setMotorSpeed(kroma.Motor.A, kroma.MotorDirection.Forward, 0)
    basic.pause(2000)

    serial.writeLine("T3 stopAllMotors")
    kroma.stopAllMotors()
    basic.pause(1000)

    serial.writeLine("T3 motor A only — B must not move")
    kroma.setMotorSpeed(kroma.Motor.A, kroma.MotorDirection.Forward, 70)
    basic.pause(2000)
    kroma.stopAllMotors()
}

// T4 — cross-check with servos and analog output (extra criterion of Task 5,
// V3, V6, ARQUITECTURA.md §3.9). Two servos at fixed angles and a LED on
// analog output at 50 on port 4, then both motors at 50 — left running so
// interference (or its absence) can be observed over time.
function motorT4(): void {
    serial.writeLine("T4 servos + analog output + motors")
    kroma.setServoAngle(1, 45)
    kroma.setServoAngle(2, 135)
    kroma.analogOutput(kroma.NativeDigitalPort.Port4, 50)
    kroma.setMotorSpeed(kroma.Motor.A, kroma.MotorDirection.Forward, 50)
    kroma.setMotorSpeed(kroma.Motor.B, kroma.MotorDirection.Forward, 50)
}

input.onButtonPressed(Button.A, motorT1)
input.onButtonPressed(Button.B, motorT2)
input.onButtonPressed(Button.AB, motorT3)
input.onGesture(Gesture.Shake, motorT4)

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
