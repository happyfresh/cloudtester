import * as AWS from 'aws-sdk';
import { ConfigManager } from '../util/config-manager';
import { LogManager } from '../util/log-manager/log-manager';
import moment from 'moment';
import Table from 'cli-table3';
import { Task, TaskDict } from './task-monitor';
import { kill } from 'process';

const log = LogManager.Instance;
const config = ConfigManager.getConfigObject();

export enum TaskAge {
  OLDEST,
  NEWEST,
}

enum TaskKillStatus {
  REQUESTED = 'Requested',
  COMPLETED = 'Completed',
}

interface TaskKillQuery {
  arn: string;
  killStatus: TaskKillStatus;
  killRequestedAt: number;
  killCompletedAt?: number;
  lastsynced: number;
}

interface TaskKillStatusDict {
  [key: string]: TaskKillQuery;
}

export interface TaskKillCriteria {
  age: TaskAge;
}

export class TaskKiller {
  private killedTasks: TaskKillStatusDict = {};

  private serviceName: string;

  private clusterName: string;

  private ecs: AWS.ECS;

  private removeFromListThreshold = 20;

  private minimumTasks: number = config.get('terminate.minimumTasks');

  constructor() {
    this.ecs = new AWS.ECS({
      apiVersion: 'latest',
    });

    this.serviceName = config.get('service');
    this.clusterName = config.get('cluster');
    log.debug('Task Killer Service Name : ', this.serviceName);
    log.debug('Task Killer Cluster Name : ', this.clusterName);
  }

  private async getTaskInfo(taskArns: Array<string>): Promise<AWS.ECS.Tasks> {
    const params = {
      tasks: taskArns,
      cluster: this.clusterName,
    };

    try {
      const data = await this.ecs.describeTasks(params).promise();
      if (data.tasks) {
        return data.tasks;
      }
      return [];
    } catch (error) {
      log.error(error);
      throw error;
    }
  }

  public printKilledTaskTail() {
    const table = new Table({
      head: [
        'Task Id',
        'Kill Status',
        'Kill Requested At',
        'Kill Completed At',
        'Last Sync',
      ],
      colWidths: [20, 20, 20, 20, 20],
    });

    const taskArns = Object.keys(this.killedTasks);

    taskArns.forEach((element) => {
      const splitted = element.split('/');
      const id =
        splitted && splitted.length > 0
          ? splitted[splitted.length - 1]
          : undefined;

      let stoppedAt = 'N/A';
      if (this.killedTasks[element].killCompletedAt) {
        stoppedAt = moment(this.killedTasks[element].killCompletedAt).format(
          'HH:MM:ss'
        );
      }
      table.push([
        id,
        this.killedTasks[element].killStatus,
        moment(this.killedTasks[element].killRequestedAt).format('HH:MM:ss'),
        stoppedAt,
        moment(this.killedTasks[element].lastsynced).format('HH:MM:ss'),
      ]);
    });

    log.logTail(table.toString(), 'Task Kill');
  }

  public async refreshKillTaskStatus() {
    let killedTasksArray = Object.keys(this.killedTasks);
    if (killedTasksArray.length > 0) {
      killedTasksArray.forEach((value) => {
        const task = this.killedTasks[value];
        if (task.killStatus === TaskKillStatus.COMPLETED) {
          const completedAt = task.killCompletedAt as number;
          const duration = moment.now() - completedAt;
          if (duration > this.removeFromListThreshold) {
            delete this.killedTasks[value];
          }
        }
      });
    }

    killedTasksArray = Object.keys(this.killedTasks);

    if (killedTasksArray.length > 0) {
      const taskData = await this.getTaskInfo(killedTasksArray);

      taskData.forEach((value) => {
        const arn = value?.taskArn;

        if (arn) {
          let stoppedValue = undefined;
          if (value.stoppedAt) {
            stoppedValue = moment(value.stoppedAt).valueOf();
          }
          this.killedTasks[arn].lastsynced = moment.now();
          // if stopped, marked as complete
          if (value?.lastStatus === 'STOPPED') {
            this.killedTasks[arn].killStatus = TaskKillStatus.COMPLETED;
            this.killedTasks[arn].killCompletedAt = stoppedValue;
          }
        }
      });
    }
  }

  public async killTask(
    tasks: TaskDict,
    criteria: TaskKillCriteria,
    minimumRunning = this.minimumTasks
  ): Promise<Array<string> | undefined> {
    this.refreshKillTaskStatus();

    const sortedTask = Object.values(tasks);

    // do not kill task if there is still a task PENDING
    const foundNotReady = sortedTask.find(
      (element) => element.status !== 'RUNNING'
    );
    if (foundNotReady) {
      log.verbose(
        `Found a task not in the running state : ${foundNotReady.arn}`
      );
      log.info(`Cancelled killing task`);
      return undefined;
    }

    // do not kill task if ecs agent is in the middle of killing another batch of tasks
    const killedTasksArray = Object.values(this.killedTasks);
    const foundStillRequesting = killedTasksArray.find(
      (element) => element.killStatus === TaskKillStatus.REQUESTED
    );
    if (foundStillRequesting) {
      log.verbose(
        `Found a task still being stopped by ecs agent : ${foundStillRequesting.arn}`
      );
      log.info(`Cancelled killing task`);
      return undefined;
    }

    sortedTask.sort((a, b) => {
      return a.startedAt - b.startedAt;
    });

    if (criteria.age === TaskAge.NEWEST) {
      sortedTask.reverse();
    }

    const killAmount = sortedTask.length - minimumRunning;
    const killList = [];

    for (let i = 0; i < killAmount; i++) {
      const taskArn = sortedTask[i].arn;
      const params: AWS.ECS.StopTaskRequest = {
        task: taskArn /* required */,
        cluster: this.clusterName,
        reason: 'Stopped manually by coramil task-killer program.',
      };
      try {
        await this.ecs.stopTask(params).promise();
        this.killedTasks[taskArn] = {
          arn: taskArn,
          killStatus: TaskKillStatus.REQUESTED,
          killRequestedAt: moment.now(),
          lastsynced: moment.now(),
        };
        killList.push(taskArn);
      } catch (error) {
        log.error(error);
        throw error;
      }
    }

    return killList;
  }
}
