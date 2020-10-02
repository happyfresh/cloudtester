import { LogManager } from './log-manager';
import { config as dotenv } from 'dotenv';
import * as convict from 'convict';
import * as path from 'path';
import * as yaml from 'js-yaml';

const log = LogManager.Instance;

const configSchema = {
  env: {
    doc: 'The application environment.',
    format: ['production', 'development', 'test'],
    default: 'development',
    env: 'NODE_ENV',
  },
  service: {
    doc: 'The service to be executed.',
    format: String,
    default: 'default',
  },
  cluster: {
    doc: 'The cluster to be executed.',
    format: String,
    default: 'default',
  },
  terminate: {
    minimumTasks: {
      doc: 'The minimum amount of tasks to keep alive.',
      format: 'int',
      default: 1,
    },
  },
};

export class ConfigManager {
  private static _instance: ConfigManager;

  private config = convict(configSchema);

  private constructor() {
    convict.addParser({ extension: ['yml', 'yaml'], parse: yaml.safeLoad });

    // load env variables from .env file
    const envFile = path.resolve(process.cwd(), 'config', 'staging.env');
    log.debug(envFile);
    dotenv({ path: envFile });

    const configFile = path.resolve(process.cwd(), 'config', 'config.yaml');
    log.debug(configFile);
    this.config.loadFile(configFile);

    // Perform validation
    this.config.validate({ allowed: 'strict' });
  }

  private static get Instance() {
    // eslint-disable-next-line no-return-assign
    return this._instance || (this._instance = new this());
  }

  public static getConfigObject() {
    return ConfigManager.Instance.config;
  }
}
