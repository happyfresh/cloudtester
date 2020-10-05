import { flags } from '@oclif/command';
import Command from '../base';
import { CredentialManager } from '../util';
import { LogManager } from '../util/log-manager/log-manager';
import { ConfigManager } from '../util/config-manager';
import { TaskMonitor } from '../core/task-monitor';
import { TaskKiller, TaskAge } from '../core/task-killer';
import { ApiCaller } from '../core/api-caller';

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

    const monitorRefreshInterval = config.get('monitor.refreshInterval');
    const killRefreshInterval = config.get('terminate.refreshInterval');
    const killInterval = config.get('terminate.killInterval');
    const requestInterval = config.get('api.requestInterval');

    // load aws credentials
    const credential = new CredentialManager();
    await credential.login();

    const apiCaller = new ApiCaller();
    const taskMonitor = new TaskMonitor();
    const taskKiller = new TaskKiller();
    apiCaller.printRequestTail();
    taskMonitor.printTaskTail();
    taskKiller.printKilledTaskTail();

    setInterval(async () => {
      await taskMonitor.refreshTaskList();
      taskMonitor.printTaskTail();
    }, monitorRefreshInterval);

    setInterval(async () => {
      const killedTasks = await taskKiller.killTask(
        taskMonitor.getTasks(),
        { age: TaskAge.OLDEST },
        1
      );
      log.info('killed tasks :', killedTasks);
      await taskKiller.refreshKillTaskStatus();
      taskKiller.printKilledTaskTail();
    }, killInterval);

    setInterval(async () => {
      await taskKiller.refreshKillTaskStatus();
      taskKiller.printKilledTaskTail();
    }, killRefreshInterval);

    setInterval(async () => {
      await apiCaller.makeRequest();
      apiCaller.printRequestTail();
    }, requestInterval);

    /*log.logTail('hobo\nhobo', 'hobo');
    await promiseTimeout(1000);
    log.logTail('hibo\nhobo', 'hobo');
    await promiseTimeout(1000);
    log.logTail('hibo\nhibo', 'hobo');
    await promiseTimeout(1000);
    log.logTail('ale\nale', 'ale');
    await promiseTimeout(1000);
    log.logTail('ala\nile', 'ale');
    await promiseTimeout(1000);
    log.logTail('ile\nile', 'ale');
    await promiseTimeout(1000);*/
  }
}
