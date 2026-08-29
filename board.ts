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
