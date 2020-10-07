/* eslint-disable operator-linebreak */
import * as AWS from 'aws-sdk';
import { ConfigManager } from '../util/config-manager';
import { LogManager } from '../util/log-manager/log-manager';
import moment from 'moment';
import Table from 'cli-table3';

const log = LogManager.Instance;
const config = ConfigManager.getConfigObject();

export interface Task {
  arn: string;
  status: string;
  lastsynced: number;
  startedAt: number;
  stoppedAt?: number;
}

export interface TaskDict {
  [key: string]: Task;
}

export class TaskMonitor {
  private tasks: TaskDict;

  private serviceName: string;

  private clusterName: string;

  private ecs: AWS.ECS;

  private removeFromListThreshold = 20;

  constructor() {
    this.ecs = new AWS.ECS({
      apiVersion: 'latest',
    });

    this.serviceName = config.get('service');
    this.clusterName = config.get('cluster');
    log.debug('Task Monitor Service Name : ', this.serviceName);
    log.debug('Task Monitor Cluster Name : ', this.clusterName);

    this.tasks = {};
  }

  public printTaskJsonLog() {
    log.jsonDebug(this.tasks);
  }

  public printTaskTail() {
    // instantiate
    const table = new Table({
      head: ['Task Id', 'Status', 'Started At', 'Stopped At', 'Last Sync'],
      colWidths: [20, 20, 20, 20, 20],
    });

    const taskIds = Object.keys(this.tasks);

    taskIds.forEach((element) => {
      let stoppedAt = 'N/A';
      if (this.tasks[element].stoppedAt) {
        stoppedAt = moment(this.tasks[element].stoppedAt)
          .startOf('second')
          .fromNow();
      }
      table.push([
        element,
        this.tasks[element].status,
        moment(this.tasks[element].startedAt).startOf('second').fromNow(),
        stoppedAt,
        moment(this.tasks[element].lastsynced).format('HH:MM:ss'),
      ]);
    });

    log.logTail(table.toString(), 'Task Monitor');
  }

  public async refreshTaskList() {
    const taskList = await this.getTaskList();

    const taskData = await this.getTaskInfo(taskList);

    // clear and reset tasks list
    this.tasks = {};

    taskData.forEach((value) => {
      const arn = value?.taskArn;
      const splitted = arn?.split('/');
      const id =
        splitted && splitted.length > 0
          ? splitted[splitted.length - 1]
          : undefined;

      if (id && arn) {
        let stoppedValue = undefined;
        if (value.stoppedAt) {
          stoppedValue = moment(value.stoppedAt).valueOf();
        }
        this.tasks[id] = {
          arn: arn,
          status: value?.lastStatus || 'UNFETCHED',
          lastsynced: moment.now(),
          startedAt: moment(value.startedAt).valueOf(),
          stoppedAt: stoppedValue,
        };
      }
    });
  }

  public getTasks() {
    return this.tasks;
  }

  private async getTaskList(): Promise<Array<string>> {
    // check number of task running for service

    const params: AWS.ECS.ListTasksRequest = {
      family: this.serviceName,
      cluster: this.clusterName,
    };

    try {
      const data = await this.ecs.listTasks(params).promise();
      if (data.taskArns) {
        return data.taskArns;
      }
      return [];
    } catch (error) {
      log.error(error);
      throw error;
    }
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
}
