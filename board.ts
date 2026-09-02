// KROMA — Kit de Robótica Maker.
// Public blocks. Hardware logic lives in the driver modules
// (motors.ts, servos.ts, analog.ts, digital.ts, ultrasonic.ts).
// The first blocks are added starting with Task 2.
//% color="#E3892B" icon="\uf085" block="KROMA"
//% groups='["Input","Output","Motors","Servos","Distance"]'
namespace kroma {
    /**
     * Turns a port's digital line on or off.
     * @param port the port to write to
     * @param value on or off
     */
    //% blockId="kromaDigitalOutput"
    //% block="write digital port %port to %value"
    //% port.shadow="kromaPortShadow"
    //% value.shadow="toggleOnOff"
    //% subcategory="Output"
    //% weight=100
    export function digitalOutput(port: number, value: boolean): void {
        setDigital(port, value)
    }

    /**
     * Sets the analog output level of port 4 or 6, on a 0-100 scale.
     * @param port the port to write to
     * @param value a level from 0 (off) to 100 (maximum)
     */
    //% blockId="kromaAnalogOutput"
    //% block="write analog port %port to %value"
    //% value.min=0 value.max=100 value.defl=50
    //% subcategory="Output"
    //% weight=90
    export function analogOutput(port: NativeDigitalPort, value: number): void {
        writeAnalogOutput(port, value)
    }

    /**
     * Reads the state of a port's digital line.
     * @param port the port to read from
     * @return true if the line is on, false if it's off
     */
    //% blockId="kromaDigitalInput"
    //% block="read digital port %port"
    //% port.shadow="kromaPortShadow"
    //% subcategory="Input"
    //% weight=90
    export function digitalInput(port: number): boolean {
        return readDigital(port)
    }

    /**
     * Reads a port's analog input, on a 0-100 scale.
     * @param port the port to read from
     * @return a value from 0 (minimum) to 100 (maximum)
     */
    //% blockId="kromaAnalogInput"
    //% block="read analog port %port"
    //% port.shadow="kromaPortShadow"
    //% subcategory="Input"
    //% weight=100
    export function analogInput(port: number): number {
        return readAnalog(port)
    }

    /**
     * Runs code once when a port's digital line changes to the chosen state.
     * @param port the port to watch
     * @param state the state that triggers the handler
     */
    //% blockId="kromaOnDigitalPortEvent"
    //% block="on port %port event %state"
    //% port.shadow="kromaPortShadow"
    //% state.shadow="toggleOnOff"
    //% subcategory="Input"
    //% weight=80
    export function onDigitalPortEvent(port: number, state: boolean, handler: () => void): void {
        let p = clampPort(port)
        watchDigital(p, state)
        control.onEvent(digitalSource(p), state ? 1 : 0, handler)
    }

    /**
     * Runs code once when a port's analog reading crosses the chosen threshold.
     * @param port the port to watch
     * @param op the comparison to trigger on
     * @param threshold a value from 0 (minimum) to 100 (maximum)
     */
    //% blockId="kromaOnAnalogCompareEvent"
    //% block="on port %port reading %op %threshold"
    //% port.shadow="kromaPortShadow"
    //% threshold.min=0 threshold.max=100
    //% subcategory="Input"
    //% weight=70
    export function onAnalogCompareEvent(port: number, op: KromaCompareOp, threshold: number, handler: () => void): void {
        let p = clampPort(port)
        let t = Math.round(threshold)
        if (t < 0) t = 0
        if (t > 100) t = 100
        watchAnalog(p, op, t)
        control.onEvent(analogSource(p, op), t, handler)
    }

    /**
     * Moves a motor in a direction at a speed. Speed 0 stops the motor,
     * which keeps spinning briefly on its own before coming to a stop.
     * @param motor the motor to move
     * @param direction which way to turn
     * @param speed how fast, from 0 (stopped) to 100 (maximum)
     */
    //% blockId="kromaSetMotorSpeed"
    //% block="move motor %motor %direction at speed %speed"
    //% speed.min=0 speed.max=100 speed.defl=50
    //% motor.defl=Motor.A
    //% subcategory="Motors"
    //% weight=100
    export function setMotorSpeed(motor: Motor, direction: MotorDirection, speed: number): void {
        driveMotor(motor, direction, speed)
    }

    /**
     * Stops both motors at once. They keep spinning briefly on their own
     * until they come to a stop.
     */
    //% blockId="kromaStopAllMotors"
    //% block="stop all motors"
    //% subcategory="Motors"
    //% weight=90
    export function stopAllMotors(): void {
        stopMotors()
    }

    /**
     * Moves the servo connected to a port to an angle.
     * @param port the port the servo is connected to
     * @param angle the angle to move to, in degrees
     */
    //% blockId="kromaSetServoAngle"
    //% block="set servo port %port to %angle degrees"
    //% port.shadow="kromaPortShadow"
    //% angle.shadow="protractorPicker"
    //% angle.defl=90
    //% subcategory="Servos"
    //% weight=100
    export function setServoAngle(port: number, angle: number): void {
        moveServo(port, angle)
    }

    // Default shadow block plugged into the port parameter of any block
    // using the full 6-port enumeration (ARQUITECTURA.md §2.2). Being a
    // real block (not an inlined field) is what lets a docente unplug the
    // dropdown and plug in a variable, an expression, or a loop counter
    // instead. Hidden from the picker: it only ever appears pre-plugged.
    //% blockId="kromaPortShadow"
    //% block="$port"
    //% blockHidden=1
    export function _portShadow(port: Port): number {
        return port
    }
}
