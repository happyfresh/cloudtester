import { LogManager } from './log-manager/log-manager';
import { config as dotenv } from 'dotenv';
import convict from 'convict';
import * as path from 'path';
import * as fs from 'fs';
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
  monitor: {
    refreshInterval: {
      doc: 'The time interval to refresh and query task status (ms).',
      format: 'int',
      default: 5000,
    },
  },
  terminate: {
    killInterval: {
      doc: 'The time interval to try to kill tasks (ms).',
      format: 'int',
      default: 30000,
    },
    refreshInterval: {
      doc: 'The time interval to refresh and query task status (ms).',
      format: 'int',
      default: 5000,
    },
    minimumTasks: {
      doc: 'The minimum amount of tasks to keep alive.',
      format: 'int',
      default: 1,
    },
  },
  api: {
    endpoint: {
      doc: 'The API to call',
      format: String,
      default: 'default',
    },
    requestInterval: {
      doc: 'The time interval to send requests to API',
      format: 'int',
      default: 1000,
    },
    circuitBreaker: {
      timeout: {
        doc:
          'The time in milliseconds that action should be allowed to execute before timing out.',
        format: 'int',
        default: 500,
      },
      errorThresholdPercentage: {
        doc:
          'The error percentage at which to open the circuit and start short-circuiting requests to fallback.',
        format: 'int',
        default: 50,
      },
      resetTimeout: {
        doc:
          'The error percentage at which to open the circuit and start short-circuiting requests to fallback.',
        format: 'int',
        default: 5000,
      },
    },
  },
};

export class ConfigManager {
  private static _instance: ConfigManager;

  private config = convict(configSchema);

  private constructor() {
    convict.addParser({ extension: ['yml', 'yaml'], parse: yaml.safeLoad });

    // load env variables from .env file
    const envFile = this.recursiveParentSearch('config', 'staging.env');
    if (envFile) {
      log.info('using environment file', envFile);
      dotenv({ path: envFile });
    } else {
      log.info('no environment file found');
    }

    const configFile = this.recursiveParentSearch('config', 'config.yaml');
    if (configFile) {
      log.info('using config file', configFile);
      this.config.loadFile(configFile);
    } else {
      log.info('no config file found, using defaults');
    }

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

  private recursiveParentSearch(
    folder: string,
    file: string,
    levels = 3
  ): string | undefined {
    let parentString = '';
    for (let i = 0; i < levels; i++) {
      const currDir = path.normalize(process.cwd() + parentString);
      const testPath = path.resolve(currDir, folder, file);
      if (fs.existsSync(testPath)) {
        return testPath;
      }
      parentString += '/..';
    }
  }
}
