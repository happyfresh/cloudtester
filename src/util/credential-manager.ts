import { LogManager } from './log-manager/log-manager';
import * as AWS from 'aws-sdk';
import { CredentialsOptions } from 'aws-sdk/lib/credentials';
import { ensureFile } from 'fs-extra'
import path from 'path'
import os from 'os'

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
    process.env.AWS_SDK_LOAD_CONFIG = 'false';
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
    const defaultCredentialFile = path.resolve(os.homedir(), '.aws', 'credentials')
    const defaultAWSConfigFile = path.resolve(os.homedir(), '.aws', 'config')
    try {
      await ensureFile(defaultCredentialFile)
      log.debug('ensured file exists :', defaultCredentialFile)
      await ensureFile(defaultAWSConfigFile)
      log.debug('ensured file exists :', defaultAWSConfigFile)
    } catch (err) {
      console.error(err)
    }

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
