/* eslint-disable no-else-return */
/* eslint-disable no-console */
import React, { useState, useEffect, useCallback } from 'react';
import * as os from 'os';
import { LEVEL, MESSAGE } from 'triple-beam';
import TransportStream, { TransportStreamOptions } from 'winston-transport';
import { Box, Newline, Text, useStderr, useStdout } from 'ink';
import EventEmitter from 'events';

const eventEmitter = new EventEmitter();

const Emitter = {
  on: (event: string, fn: any) => eventEmitter.on(event, fn),
  once: (event: string, fn: any) => eventEmitter.once(event, fn),
  off: (event: string, fn: any) => eventEmitter.off(event, fn),
  emit: (event: string, payload: any) => eventEmitter.emit(event, payload),
  removeListener: (event: string, fn: any) =>
    eventEmitter.removeListener(event, fn),
};

Object.freeze(Emitter);

interface InkTransportOptions extends TransportStreamOptions {
  consoleWarnLevels?: string[];
  stderrLevels?: string[];
  debugStdout?: boolean;
  eol?: string;
  name?: string;
}

export class WinstonTransportInk extends TransportStream {
  private name: string;

  private stderrLevels: any;

  private consoleWarnLevels: any;

  private eol: string;

  /**
   * Constructor function for the Console transport object responsible for
   * persisting log messages and metadata to a terminal or TTY.
   * @param {!Object} [options={}] - Options for this instance.
   */
  constructor(options: InkTransportOptions = {}) {
    super(options);
    // Expose the name of this Transport on the prototype
    this.name = options.name || 'ink';
    this.stderrLevels = this._stringArrayToSet(options?.stderrLevels);
    this.consoleWarnLevels = this._stringArrayToSet(options?.consoleWarnLevels);
    this.eol = (options.eol as string) || os.EOL;

    this.setMaxListeners(30);
  }

  logTail(message: string) {
    Emitter.emit('writeTail', message);
  }

  /**
   * Core logging method exposed to Winston.
   * @param {Object} info - TODO: add param description.
   * @param {Function} callback - TODO: add param description.
   * @returns {undefined}
   */
  log(info: any, callback: Function) {
    setImmediate(() => this.emit('logged', info));

    // Remark: what if there is no raw...?
    const infoLevel = info[LEVEL];
    if (this.stderrLevels[info[LEVEL]]) {
      if (process.stderr) {
        // Node.js maps `process.stderr` to `console._stderr`.
        const message = `${info[MESSAGE]}${this.eol}`;
        setImmediate(() => Emitter.emit('writeErr', message));
      } else {
        // console.error adds a newline
        console.error(info[MESSAGE]);
      }

      if (callback) {
        callback(); // eslint-disable-line callback-return
      }
      return;
    } else if (this.consoleWarnLevels[info[LEVEL]]) {
      if (process.stderr) {
        // Node.js maps `process.stderr` to `console._stderr`.
        // in Node.js console.warn is an alias for console.error
        const message = `${info[MESSAGE]}${this.eol}`;
        setImmediate(() => Emitter.emit('writeErr', message));
      } else {
        // console.warn adds a newline
        console.warn(info[MESSAGE]);
      }

      if (callback) {
        callback(); // eslint-disable-line callback-return
      }
      return;
    }

    if (process.stdout) {
      // Node.js maps `process.stdout` to `console._stdout`.
      const message = `${info[MESSAGE]}${this.eol}`;
      setImmediate(() => Emitter.emit('writeOut', message));
    } else {
      // console.log adds a newline.
      console.log(info[MESSAGE]);
    }

    if (callback) {
      callback(); // eslint-disable-line callback-return
    }
  }

  /**
   * Returns a Set-like object with strArray's elements as keys (each with the
   * value true).
   * @param {Array} strArray - Array of Set-elements as strings.
   * @param {?string} [errMsg] - Custom error message thrown on invalid input.
   * @returns {Object} - TODO: add return description.
   * @private
   */
  _stringArrayToSet(strArray: Array<string> | undefined): object {
    if (!strArray) return {};

    return strArray.reduce((set: any, el: string) => {
      set[el] = true;

      return set;
    }, {});
  }
}

export const winstonInkReactComponent = () => {
  const [outString, setOutString] = useState('');
  const [errString, setErrString] = useState('');
  const [tailString, setTailString] = useState('');
  const { write: writeOut } = useStdout();
  const { write: writeErr } = useStderr();

  const handleWriteOut = (message: string) => {
    // writeOut(message);
    setOutString(message);
    writeOut(message);
  };

  const handleWriteErr = (message: string) => {
    // writeErr(message);
    setErrString(message);
    writeErr(message);
  };

  const handleWriteTail = (message: string) => {
    setTailString(message);
  };

  useEffect(() => {
    // add listeners
    Emitter.on('writeOut', handleWriteOut);
    Emitter.on('writeErr', handleWriteErr);
    Emitter.on('writeTail', handleWriteTail);
    return () => {
      // remove listeners
      Emitter.removeListener('writeOut', handleWriteOut);
      Emitter.removeListener('writeError', handleWriteErr);
      Emitter.removeListener('writeTail', handleWriteTail);
    };
  }, []);

  return (
    <Box flexDirection="column" paddingX={2} paddingY={1}>
      <Text bold underline>
        Status Visualization:
      </Text>

      <Box marginTop={1}>
        <Text>
          <Text>
            Last Log : {outString}
            {errString}
          </Text>
          <Newline />
          <Text>
            Tail :
            <Newline />
            {tailString}
          </Text>
        </Text>
      </Box>
    </Box>
  );
};
