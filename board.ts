// KROMA — Kit de Robótica Maker.
// Public blocks. Hardware logic lives in the driver modules
// (motors.ts, servos.ts, analog.ts, digital.ts, ultrasonic.ts).
// The first blocks are added starting with Task 2.
//% color="#E3892B" icon="\uf544" block="KROMA"
namespace kroma {
    /**
     * Turns a port's digital line on or off.
     * @param port the port to write to
     * @param value on or off
     */
    //% blockId="kromaDigitalOutput"
    //% block="write digital port %port to %value"
    //% value.shadow="toggleOnOff"
    //% group="Digital"
    //% weight=100
    export function digitalOutput(port: Port, value: boolean): void {
        setDigital(port, value)
    }

    /**
     * Reads the state of a port's digital line.
     * @param port the port to read from
     * @return true if the line is on, false if it's off
     */
    //% blockId="kromaDigitalInput"
    //% block="read digital port %port"
    //% group="Digital"
    //% weight=90
    export function digitalInput(port: Port): boolean {
        return readDigital(port)
    }
}
