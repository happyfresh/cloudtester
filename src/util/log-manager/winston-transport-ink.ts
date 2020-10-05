/* eslint-disable no-else-return */
/* eslint-disable no-console */
import React, { useState, useEffect } from 'react'
import * as os from 'os';
import { LEVEL, MESSAGE } from 'triple-beam';
import TransportStream, { TransportStreamOptions } from 'winston-transport';
import { useStderr, useStdout } from 'ink'

interface InkTransportOptions extends TransportStreamOptions {
  consoleWarnLevels?: string[],
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

  private stdout;

  private writeOut;

  private stderr;

  private writeErr;

  /**
   * Constructor function for the Console transport object responsible for
   * persisting log messages and metadata to a terminal or TTY.
   * @param {!Object} [options={}] - Options for this instance.
   */
  constructor(options: InkTransportOptions = {}) {
    super(options);
    // Expose the name of this Transport on the prototype
    this.name = options.name || 'console';
    this.stderrLevels = this._stringArrayToSet(options?.stderrLevels);
    this.consoleWarnLevels = this._stringArrayToSet(options?.consoleWarnLevels);
    this.eol = (options.eol as string) || os.EOL;

    this.setMaxListeners(30);

    const useOut = useStdout();
    const useErr = useStderr();
    this.stdout = useOut.stdout;
    this.writeOut = useOut.write;

    this.stderr = useErr.stderr;
    this.writeErr = useErr.write;
  }

  public reactComponent = () => {
    const { stdout, write } = useStdout();

    React.useEffect(() => {
      const timer = setInterval(() => {
        write('Hello from Ink to stdout\n');
      }, 1000);

      return () => {
        clearInterval(timer);
      };
    }, []);
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
    if (this.stderrLevels[info[LEVEL]]) {
      if (process.stderr) {
        // Node.js maps `process.stderr` to `console._stderr`.
        this.writeErr(`${info[MESSAGE]}${this.eol}`);
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
        this.writeErr(`${info[MESSAGE]}${this.eol}`);
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
      this.writeOut(`${info[MESSAGE]}${this.eol}`);
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
