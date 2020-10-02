/* eslint-disable operator-linebreak */
import * as AWS from 'aws-sdk';
import { ConfigManager } from '../util/config-manager';
import { LogManager } from '../util/log-manager';
import * as moment from 'moment';

const log = LogManager.Instance;
const config = ConfigManager.getConfigObject();

export interface Task {
  arn: string;
  lastsynced?: number;
  startedAt?: number;
}

export interface TaskDict {
  [key: string]: Task;
}

export class TaskMonitor {
  private tasks: TaskDict;

  private serviceName: string;

  private clusterName: string;

  private ecs: AWS.ECS;

  constructor() {
    this.ecs = new AWS.ECS({
      apiVersion: 'latest',
      region: 'ap-southeast-1',
    });

    this.serviceName = config.get('service');
    this.clusterName = config.get('cluster');
    log.debug('Service Name : ', this.serviceName);
    log.debug('Cluster Name : ', this.clusterName);

    this.tasks = {};
  }

  public printTaskList() {
    log.jsonDebug(this.tasks);
  }

  public async refreshTaskList() {
    const taskList = await this.getTaskList();

    const taskData = await this.getTaskInfo(taskList);

    taskData.forEach((value) => {
      const arn = value?.taskArn;
      const splitted = arn?.split('/');
      const id =
        splitted && splitted.length > 0
          ? splitted[splitted.length - 1]
          : undefined;

      if (id && arn) {
        this.tasks[id] = {
          arn: arn,
          lastsynced: moment.now(),
          startedAt: moment(value.startedAt).valueOf(),
        };
      }
    });
  }

  public async getTaskList(): Promise<Array<string>> {
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

  public async getTaskInfo(taskArns: Array<string>): Promise<AWS.ECS.Tasks> {
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
