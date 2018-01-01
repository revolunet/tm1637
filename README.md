# tm1637.js

Control a 4 digit led segments TM1637 driver using javascript and johnny-five.

Largely inspired from https://github.com/thesadabc/raspberrypi-tm1637-4display and https://github.com/timwaizenegger/raspberrypi-examples/blob/master/actor-led-7segment-4numbers/tm1637.py

`npm i tm1637`

## Usage

```js
const five = require('johnny-five')
const Raspi = require('raspi-io')
const tm1637 = require('tm1637')

const board = new five.Board({
    io: new Raspi()
});

board.on("ready", () => {
    const display = tm1637({
      clk: "GPIO21",
      dio: "GPIO20",
      board: board
    })

    display.show("1234")

    board.repl.inject({
        tm1637
    });
});


```

## Related

 - https://github.com/thesadabc/raspberrypi-tm1637-4display
 - https://github.com/timwaizenegger/raspberrypi-examples/blob/master/actor-led-7segment-4numbers/tm1637.py
 -