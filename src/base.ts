/* eslint-disable indent */
import Command, { flags } from '@oclif/command';
import { LogManager } from './util/log-manager';
import * as path from 'path';

const log = LogManager.Instance;

export default abstract class BaseCommand extends Command {
  static strict = false;

  static flags = {
    logLevel: flags.string({
      char: 'l',
      description: 'set the log level',
      required: false,
      options: ['info', 'debug'],
    }),
  };

  // static args = [];

  async init() {
    // do some initialization
    const { flags } = this.parse(BaseCommand);

    // setup logging
    if (flags.logLevel) {
      LogManager.Instance.setLogger(flags.logLevel);
      LogManager.Instance.setAwsLogger(flags.logLevel);
    }
  }

  async catch(error: any) {
    // add any custom logic to handle errors from the command
    // or simply return the parent class error handling
    return super.catch(error);
  }
}
