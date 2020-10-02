import { LogManager } from './log-manager';
import * as AWS from 'aws-sdk';
import { CredentialsOptions } from 'aws-sdk/lib/credentials';

const log = LogManager.Instance;

export enum ConfigSource {
  CREDENTIAL_FILE = 0,
  CUSTOM = 1,
}

export class CredentialManager {
  private configSource!: ConfigSource;

  constructor(credentials?: CredentialsOptions) {
    if (credentials === undefined) {
      this.setCredentialFileConfig();
    } else {
      this.setCustomConfig(credentials);
    }
  }

  public setCredentialFileConfig() {
    process.env.AWS_SDK_LOAD_CONFIG = 'true';
    AWS.config.update({});
    this.configSource = ConfigSource.CREDENTIAL_FILE;
  }

  public setCustomConfig(credentials: CredentialsOptions) {
    process.env.AWS_SDK_LOAD_CONFIG = 'false';
    AWS.config.update(credentials);
    this.configSource = ConfigSource.CUSTOM;
  }

  private getCredentials(): Promise<void | Error> {
    return new Promise<void | Error>((resolve, reject) => {
      AWS.config.getCredentials((err) => {
        if (err) {
          log.error(err.stack);
          reject(err);
        } else {
          resolve();
        }
      });
    });
  }

  public async login() {
    try {
      log.verbose('getting aws credentials');
      await this.getCredentials();
    } catch (error) {
      log.error(error);
    }

    const accessKeyId = AWS.config.credentials?.accessKeyId;
    if (accessKeyId) {
      log.debug(`Access key: ${accessKeyId}`);
    }
  }
}
