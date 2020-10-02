import { flags } from '@oclif/command';
import Command from '../base';
import { CredentialManager } from '../util';
import { LogManager } from '../util/log-manager/log-manager';
import { ConfigManager } from '../util/config-manager';
import { TaskMonitor } from '../core/task-monitor';

const log = LogManager.Instance;
const config = ConfigManager.getConfigObject();

function promiseTimeout(delayms: number) {
  return new Promise(function (resolve) {
    setTimeout(resolve, delayms);
  });
}

export default class Begin extends Command {
  static description = 'describe the command here';

  static examples = [
    `$ cloudtester begin
hello world from ./src/hello.ts!
`,
  ];

  static flags = {
    ...Command.flags,
    help: flags.help({ char: 'h' }),
  };

  static args = [];

  async run() {
    const { flags } = this.parse(Begin);

    // load aws credentials
    /* const envCreds = {
      accessKeyId: process.env.AWS_ACCESS_KEY_ID as string,
      secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY as string,
    }; */
    const credential = new CredentialManager();
    await credential.login();

    /* const taskMonitor = new TaskMonitor();
    setInterval(async () => {
      await taskMonitor.refreshTaskList();
      taskMonitor.printTaskList();
    }, 5000); */

    /* setInterval(() => {
      const frame = frames[(i = ++i % frames.length)];

      logUpdate(`♥♥${frame} unicorns ${frame}♥♥`);
    }, 80); */
    /* log.logTail('hello');
    for (let i = 0; i < 100; i++) {
      log.info('with tail ', i);
      // eslint-disable-next-line no-await-in-loop
      await promiseTimeout(200);
    }
    log.clearTail();
    for (let i = 0; i < 100; i++) {
      log.info('without tail ', i);
      // eslint-disable-next-line no-await-in-loop
      await promiseTimeout(200);
    } */
  }
}
