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

export default class TaskKill extends Command {
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
    const { flags } = this.parse(TaskKill);

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

    /*
    log.logTail('hobo\nhobo', 'hobo');
    log.info('1');
    log.info({ interesting: 'thing' });
    await promiseTimeout(1000);
    log.logTail('hibo\nhobo', 'hobo');
    log.info('2');
    await promiseTimeout(1000);
    log.logTail('hibo\nhibo', 'hobo');
    log.info('3');
    await promiseTimeout(1000);
    log.logTail('ale\nale', 'ale');
    log.info('4');
    await promiseTimeout(1000);
    log.logTail('ala\nile', 'ale');
    log.info('5');
    console.log('aloha');
    await promiseTimeout(1000);
    log.logTail('ile\nile', 'ale');
    log.info('6');
    await promiseTimeout(1000);

    log.info('7'); */
  }
}
