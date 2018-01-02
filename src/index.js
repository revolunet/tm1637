// copied and adapted from https://github.com/thesadabc/raspberrypi-tm1637-4display and https://github.com/timwaizenegger/raspberrypi-examples/blob/master/actor-led-7segment-4numbers/tm1637.py

//
//      A
//     ---
//  F |   | B
//     -G-
//  E |   | C
//     ---
//      D

codigitToSegment = [
  // XGFEDCBA
  0b00111111, // 0 0x3f
  0b00000110, // 1 0x06
  0b01011011, // 2 0x5b
  0b01001111, // 3 0x4f
  0b01100110, // 4 0x66
  0b01101101, // 5 0x6d
  0b01111101, // 6 0x7d
  0b00000111, // 7 0x07
  0b01111111, // 8 0x7f
  0b01101111, // 9 0x6f
  0b01110111, // A 0x77
  0b01111100, // b 0x7c
  0b00111001, // C 0x39
  0b01011110, // d 0x5e
  0b01111001, // E 0x79
  0b01110001 // F 0x71
];

const ADDR_AUTO = 0x40; // 0b01000000
const STARTADDR = 0xc0; // 0b11000000
const BRIGHTNESS = 0.5;

class TM1637Display {
  constructor({ clk, dio, board, brightness = BRIGHTNESS }) {
    this.pinClk = clk;
    this.pinDIO = dio;
    this.board = board;
    this.trueValue = 1;
    this.q = [];

    // default to HIGH
    this.board.pinMode(this.pinClk, this.board.MODES.OUTPUT);
    this.board.pinMode(this.pinDIO, this.board.MODES.OUTPUT);
    this.high(this.pinClk);
    this.high(this.pinDIO);
    this.startLoop = this.startLoop.bind(this);
    this.startLoop();
  }

  startLoop() {
    let act = this.q.shift();
    if (act) {
      if (act[0] === "o") {
        this.board.pinMode(act[1], this.board.MODES.OUTPUT);
        //console.log("digitalWrite", act);
        this.board.digitalWrite(act[1], act[2]);
      } else if (act[0] === "i") {
        this.board.pinMode(act[1], this.board.MODES.INPUT);
        //console.log("digitalRead", act);
        this.board.digitalRead(act[1], act[2]);
      }
    }
    if (this.q.length) {
      setImmediate(this.startLoop);
    }
  }

  enqueue(data) {
    this.q.push(data);
    if (this.q.length === 1) {
      this.startLoop();
    }
  }

  high(pin) {
    this.enqueue(["o", pin, this.trueValue]);
  }

  low(pin) {
    this.enqueue(["o", pin, 1 - this.trueValue]);
  }

  read(pin) {
    return new Promise(resolve => this.enqueue(["i", pin, resolve]));
  }

  // clock high in, high out
  start() {
    // pinDIO  high -> low when clock is high
    this.low(this.pinDIO);
  }

  // clock high in, high out
  writeBit(value) {
    // A rising edge
    this.low(this.pinClk);
    // change the value when clock is low
    if (value) {
      this.high(this.pinDIO);
    } else {
      this.low(this.pinDIO);
    }

    this.high(this.pinClk);
  }

  readAck() {
    // Falling 8th
    this.low(this.pinClk);
    const readPro = this.read(this.pinDIO);

    // 9th rising edge
    this.high(this.pinClk);

    // Falling 9th
    this.low(this.pinClk);

    return readPro;
  }

  // clock high in, low out
  writeByte(byte) {
    // 0b00000000
    let b = byte;
    for (let i = 0; i < 8; i++) {
      this.writeBit(b & 0x01);
      b >>= 1;
    }
    return this.readAck();
  }

  // clock low in, high out
  stop() {
    // pinDIO  low -> high  when clock is high
    this.low(this.pinDIO);
    this.high(this.pinClk);
    this.high(this.pinDIO);
  }

  show(str) {
    let numsEncoded = ("" + str)
      .split("")
      .reduce((acc, num) => {
        if (num === ".") {
          // show point for previous number if needed
          acc[acc.length - 1] |= 0b10000000;
        } else {
          acc.push(codigitToSegment[num] || 0);
        }
        return acc;
      }, [])
      .filter((_, i) => i < 4);

    this.start(); // Data command set
    this.writeByte(ADDR_AUTO); // Normal mode, automatic address increase, write data to the display register
    this.stop();

    this.start(); // Address command setting
    this.writeByte(STARTADDR); // The start of the address starts from 0
    numsEncoded.forEach(this.writeByte.bind(this)); // data
    this.stop();

    this.start(); // Display control
    //this.writeByte(0b10001111); // Display control command set, on, brightness 111
    this.writeByte(0x88 + BRIGHTNESS); // brightness
    this.stop();
  }
}

module.exports = config => new TM1637Display(config);
