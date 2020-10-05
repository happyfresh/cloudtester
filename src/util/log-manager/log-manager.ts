/* eslint-disable no-console */
/* eslint-disable node/no-unsupported-features/node-builtins */
/* eslint-disable operator-linebreak */
import * as winston from 'winston';
import * as AWS from 'aws-sdk';
import moment from 'moment';
import ansi from 'ansi';
// import { Example } from './ink-component';
// import { WinstonTransportInk } from './winston-transport-ink'
// import { render } from 'ink';
// import React from 'react';

export type Logger = winston.Logger;

interface LoggerDict {
  [key: string]: Logger;
}

interface TailData {
  newLines: number | null;
  stringToRender: string | null;
  rendered: boolean;
  cleared: boolean;
}

const formatMeta = (meta: any) => {
  // You can format the splat yourself
  const splat = meta[Symbol.for('splat')];
  if (splat && splat[0].length > 0) {
    return splat.length === 1
      ? JSON.stringify(splat[0]).slice(1, -1)
      : JSON.stringify(splat);
  }
  return '';
};

const renderTail = (tail: string | null) => {
  if (tail) {
    return tail;
  }
  return '\r';
};

const formatMessage = (message: any) => {
  if (typeof message === 'string') {
    return message;
  }
  return JSON.stringify(message);
};

// singleton
export class LogManager {
  private static _instance: LogManager;

  private _loggers: winston.Container;

  private _usedLogger: Logger;

  private _awsUsedLogger: Logger;

  private _cursor = ansi(process.stdout);

  private _tail: TailData;

  private _tailMessages: Map<string, string> = new Map();

  private constructor() {
    this._loggers = new winston.Container();
    this._loggers.add('info', {
      level: 'info',
      format: winston.format.combine(
        winston.format.colorize(),
        winston.format.timestamp({
          format: () => {
            return moment().format('YYYY-MM-DD HH:mm:ss');
          },
        }),
        winston.format.printf(({ level, message, timestamp, ...meta }) => {
          let printed = `${timestamp} ${level}: ${formatMessage(
            message
          )} ${formatMeta(meta)}`;
          if (this._tail.stringToRender) {
            printed += `\n${renderTail(this._tail.stringToRender)}`;
          } else {
            printed += '\n';
          }
          return printed;
        })
      ),
      transports: [new winston.transports.Console({ eol: '\r' })],
      // transports: [new WinstonTransportInk()],
    });
    this._loggers.add('debug', {
      level: 'debug',
      format: winston.format.combine(
        winston.format.errors({ stack: false }),
        winston.format.colorize(),
        winston.format.timestamp({
          format: () => {
            return moment().format('YYYY-MM-DD HH:mm:ss');
          },
        }),
        winston.format.printf(
          ({ level, message, timestamp, stack, ...meta }) => {
            let printed = `${timestamp} ${level}: ${formatMessage(
              message
            )} ${formatMeta(meta)}`;
            if (stack) {
              printed += `- ${stack}`;
            }
            if (this._tail.stringToRender) {
              printed += `\n${renderTail(this._tail.stringToRender)}`;
            } else {
              printed += '\n';
            }
            return printed;
          }
        )
      ),
      transports: [new winston.transports.Console({ eol: '\r' })],
      // transports: [new WinstonTransportInk()],
    });
    this._loggers.add('outputDebug', {
      level: 'debug',
      format: winston.format.prettyPrint(),
      transports: [new winston.transports.Console({ eol: '\r' })],
      // transports: [new WinstonTransportInk()],
    });
    this._loggers.add('jsonFile', {
      level: 'debug',
      format: winston.format.json(),
      transports: [
        new winston.transports.File({
          filename: 'network.json',
        }),
      ],
    });

    if (process.env.NODE_ENV === 'development') {
      this._usedLogger = this._loggers.get('debug');
      // TODO fix
      this._awsUsedLogger = this._loggers.get('debug');
    } else {
      this._usedLogger = this._loggers.get('info');
      this._awsUsedLogger = this._loggers.get('info');
    }

    this._tail = {
      newLines: null,
      stringToRender: null,
      rendered: false,
      cleared: false,
    };

    const console = new winston.transports.Console();

    winston.add(console);

    this._cursor.hide();
    // this._loggers.get('debug').on('data', (info) => {});
    // render(React.createElement(Example));
  }

  public static get Instance() {
    // eslint-disable-next-line no-return-assign
    return this._instance || (this._instance = new this());
  }

  public get loggers(): winston.Container {
    return this._loggers;
  }

  public setLogger(loggerName: string) {
    this._usedLogger = this._loggers.get(loggerName);
  }

  public getLogger(): Logger {
    return this._usedLogger;
  }

  public info(message: string | any, ...meta: any | any[]) {
    this.resetTailCanvas();
    if (typeof meta === 'undefined') {
      this._usedLogger.info(message);
    } else if (typeof message === 'string' && typeof meta !== 'undefined') {
      this._usedLogger.info(message, meta);
    } else {
      this._usedLogger.info(message);
    }
    this.renderTailCanvas();
  }

  public jsonDebug(message: string | any, ...meta: any | any[]) {
    this.resetTailCanvas();
    if (typeof meta === 'undefined') {
      this._loggers.get('outputDebug').info(message);
    } else if (typeof message === 'string' && typeof meta !== 'undefined') {
      this._loggers.get('outputDebug').info(message, meta);
    } else {
      this._loggers.get('outputDebug').info(message);
    }
    if (this._tail.stringToRender !== null) {
      this._cursor.write(`\n${this._tail.stringToRender} `);
      this._tail.rendered = true;
    }
  }

  /* public info(...args: any[]) {
    const argus = args as [object];
    // eslint-disable-next-line no-useless-call
    return this._usedLogger.info.apply(this._usedLogger, [...argus]);
  } */
  public awsDebug(message: string | any, ...meta: any | any[]) {
    /* this.resetTailCanvas();
    if (typeof meta === 'undefined') {
      this._awsUsedLogger.debug(message);
    } else if (typeof message === 'string' && typeof meta !== 'undefined') {
      this._awsUsedLogger.debug(message, meta);
    } else {
      this._awsUsedLogger.debug(message);
    }
    this.renderTailCanvas(); */
  }

  public debug(message: string | any, ...meta: any | any[]) {
    this.resetTailCanvas();
    if (typeof meta === 'undefined') {
      this._usedLogger.debug(message);
    } else if (typeof message === 'string' && typeof meta !== 'undefined') {
      this._usedLogger.debug(message, meta);
    } else {
      this._usedLogger.debug(message);
    }
    this.renderTailCanvas();
  }

  public warn(message: string | any, ...meta: any | any[]) {
    this.resetTailCanvas();
    if (typeof meta === 'undefined') {
      this._usedLogger.warn(message);
    } else if (typeof message === 'string' && typeof meta !== 'undefined') {
      this._usedLogger.warn(message, meta);
    } else {
      this._usedLogger.warn(message);
    }
    this.renderTailCanvas();
  }

  public verbose(message: string | any, ...meta: any | any[]) {
    this.resetTailCanvas();
    if (typeof meta === 'undefined') {
      this._usedLogger.verbose(message);
    } else if (typeof message === 'string' && typeof meta !== 'undefined') {
      this._usedLogger.verbose(message, meta);
    } else {
      this._usedLogger.verbose(message);
    }
    this.renderTailCanvas();
  }

  public error(message: string | any, ...meta: any | any[]) {
    this.resetTailCanvas();
    if (typeof meta === 'undefined') {
      this._usedLogger.error(message);
    } else if (typeof message === 'string' && typeof meta !== 'undefined') {
      this._usedLogger.error(message, meta);
    } else {
      this._usedLogger.error(message);
    }
    this.renderTailCanvas();
  }

  public setAwsLogger(loggerName: string) {
    this._awsUsedLogger = this._loggers.get(loggerName);
  }

  public getAwsLogger(): Logger {
    return this._awsUsedLogger;
  }

  public clearAllTailMessages() {
    this._tailMessages.clear();
  }

  public removeTailMessage(key: string) {
    this._tailMessages.delete(key);
  }

  public logTail(message: string, key = 'default') {
    this._tailMessages.set(key, message);

    let printMessage = '';
    this._tailMessages.forEach((value) => {
      printMessage += value + '\n';
    });
    printMessage = printMessage.slice(0, printMessage.length);
    this._tail.stringToRender = printMessage;
    const newLinesCount = printMessage.split('\n').length;

    this.resetTailCanvas();
    if (this._tail.stringToRender !== null) {
      this._cursor.horizontalAbsolute().write(`${this._tail.stringToRender} `);
      this._tail.rendered = true;
    }
    this._tail.newLines = newLinesCount;
  }

  public clearTail() {
    this._tail.stringToRender = null;
    this._tail.newLines = null;
    this._tail.rendered = false;
    this._tail.cleared = true;
  }

  private renderTailCanvas() {
    if (this._tail.stringToRender !== null) {
      this._tail.rendered = true;
    }
  }

  private resetTailCanvas() {
    if (this._tail.newLines && this._tail.rendered) {
      this._cursor.horizontalAbsolute().eraseLine();
      if (this._tail.newLines > 1) {
        for (let i = 0; i < this._tail.newLines - 1; i++) {
          this._cursor.previousLine().horizontalAbsolute().eraseLine();
        }
      }
    }
    if (this._tail.cleared) {
      this._cursor.horizontalAbsolute().eraseLine();
      this._tail.cleared = false;
    }
  }
}

const awsLogger = LogManager.Instance;

class AWSWinstonAdapter {
  public static log(...args: [object]) {
    // eslint-disable-next-line no-useless-call
    return awsLogger.awsDebug.apply(awsLogger, [...args]);
  }
}

AWS.config.logger = AWSWinstonAdapter;
