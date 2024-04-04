import 'dotenv';
import slackbolt from '@slack/bolt';
const { App } = slackbolt;
import { createReadStream } from 'fs';

import rpigpio from 'rpi-gpio';
const { promise: gpio } = rpigpio;

import { runCodeInner } from "../src/runCodeInner.js";
import { makeIncluded } from "../src/makeIncluded.js";
import { SerialPort, SerialPortMock } from 'serialport';

import { createNodeSerialBuffer } from "../src/haxidraw/createNodeSerialBuffer.js";
import { runMachineHelper } from "../src/runMachineHelper.js";
import { createHaxidraw } from "../src/haxidraw/createHaxidraw.js";

let running = false;

const app = new App({
  token: process.env.SLACK_BOT_TOKEN,
  signingSecret: process.env.SLACK_SIGNING_SECRET,
  appToken: process.env.SLACK_APP_TOKEN,
  socketMode: true,
  port: process.env.PORT
});

const config = {
  MOCK_SERIAL: true,
  BAUD: 9600,
  BOARD_PIN: 7,
}

let port;
const path = process.env.SERIAL_PATH;
if (config.MOCK_SERIAL) {
  SerialPortMock.binding.createPort(path);
  port = new SerialPortMock({ path, baudRate: config.BAUD, autoOpen: false });
}
else {
  port = new SerialPort({ path, baudRate: config.BAUD, autoOpen: false })
}

const comsBuffer = await createNodeSerialBuffer(port);
const haxidraw = await createHaxidraw(comsBuffer);

const resetTurtles = await runSync(`
    drawLines([
      [
        [0, 0], [100, 100]
      ]
    ])
  `)

const rpi = {
  pin: config.BOARD_PIN,
  setup() {
    return gpio.setup(this.pin, gpio.DIR_OUT);
  },
  write(val) {
    return gpio.write(this.pin, val);
  }
}

const webCam = {
  baseUrl: process.env.MOTION_URL,
  filePath: process.env.MOTION_FILEPATH,
  command(str) {
    return fetch(this.baseUrl + str);
  },
  start() {
    return this.command('/detection/connection');
  },
  startEvent() {
    return this.command('/action/eventstart');
  },
  async endEvent() {
    const datetime = new Date().toISOString()
    await this.command('/config/set?movie_filename=' + datetime)
    await this.command('/config/set?snapshot_filename=' + datetime)
    await this.command('/action/eventend');
    await this.command('/action/snapshot');
    return datetime;
  }
};

async function runSync(code) {
  const { globalScope, turtles, log, docDimensions } = makeIncluded();
  await runCodeInner(code, globalScope, "../dist");
  return turtles;
}

async function fetchSlackFile(fileUrl) {
  const response = await fetch(fileUrl, {
    headers: { 'Authorization': `Bearer ${process.env.SLACK_BOT_TOKEN}` }
  });
  const body = await response.text();
  return body;
}

const sendSlackFile = (channelId, fileName, comment = '') => (
  app.client.files.upload({
    channels: channelId,
    initial_comment: comment,
    file: createReadStream(fileName)
  })
)

const runMachine = (turtles) => runMachineHelper(haxidraw, turtles);

async function resetMachine() {
  await runMachine(resetTurtles);
  await clearBoard();
}

const sleep = (ms) => (
  new Promise((resolve) => {
    setTimeout(resolve, ms);
  })
);

async function clearBoard() {
  await rpi.write(true);
  await sleep(200);
  await rpi.write(false);
}

async function onMessage(message) {
  if (!length(message.files)) return;

  const fileUrl = message.files[0].url_private;
  const code = await fetchSlackFile(fileUrl);

  const turtles = await runSync(code);

  await webCam.startEvent();
  await runMachine(turtles);
  let filename = await webCam.endEvent();

  filename = webCam.filePath + '/' + filename;
  sendSlackFile(message.channel, filename + '.mp4');
  sendSlackFile(message.channel, filename + '.jpg');
}

(async () => {
  await app.start();
  await webCam.start();
  await rpi.setup();

  await resetMachine();

  console.log('Server running');
})();

app.message(async ({ message, say }) => {
  try {
    if (running) {
      throw new Error("The blot is currently drawing, please try again later.")
    }
    running = true;
    await onMessage(message);
    running = false;
  }
  catch (error) {
    say(error.message);
  }
  finally {
    resetMachine();
  }
})

