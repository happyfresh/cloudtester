import axios, { AxiosResponse } from 'axios';
import opossum from 'opossum';
import moment from 'moment';
import { ConfigManager } from '../util/config-manager';
import { LogManager } from '../util/log-manager/log-manager';
import Table from 'cli-table3';

const log = LogManager.Instance;
const config = ConfigManager.getConfigObject();

export interface CircuitRequestResult {
  state: string;
  body: string;
  timeStamp: number;
  result?: AxiosResponse<any> | Error;
}

type RequestArray = Array<CircuitRequestResult>;

export class ApiCaller {
  private requestHistory: RequestArray = [];

  private requestHistoryLength = 5;

  private endPoint = config.get('api.endpoint');

  private circuit: opossum<[], AxiosResponse<any>>;

  constructor() {
    const circuitBreakerOptions: opossum.Options = {
      timeout: config.get('api.circuitBreaker.timeout'),
      errorThresholdPercentage: config.get(
        'api.circuitBreaker.errorThresholdPercentage'
      ),
      resetTimeout: config.get('api.circuitBreaker.resetTimeout'),
    };

    this.circuit = new opossum(
      () => axios.get(this.endPoint),
      circuitBreakerOptions
    );

    /* this.circuit.fallback(() => ({
      body: `${this.endPoint} unavailable right now.`,
    })); */

    this.circuit.on('success', (result: AxiosResponse<any>) => {
      const event = {
        state: 'SUCCESS',
        body: `Endpoint successfully called.`,
        timeStamp: moment.now(),
        result: result,
      };
      this.addRequestHistory(event);
      log.info(event.state, event.body);
    });

    this.circuit.on('timeout', (error) => {
      const event = {
        state: 'TIMEOUT',
        body: `Endpoint is taking too long to respond.`,
        timeStamp: moment.now(),
        result: error,
      };
      this.addRequestHistory(event);
      log.warn(event.state, event.body);
    });

    this.circuit.on('reject', (error) => {
      const event = {
        state: 'REJECTED',
        body: `The breaker for endpoint is open. Failing fast.`,
        timeStamp: moment.now(),
        result: error,
      };
      this.addRequestHistory(event);
      log.warn(event.state, event.body);
    });

    this.circuit.on('open', () => {
      const event = {
        state: 'OPEN',
        body: `The breaker for endpoint just opened.`,
        timeStamp: moment.now(),
      };
      this.addRequestHistory(event);
      log.warn(event.state, event.body);
    });

    this.circuit.on('halfOpen', () => {
      const event = {
        state: 'HALF_OPEN',
        body: `The breaker for endpoint is half open.`,
        timeStamp: moment.now(),
      };
      this.addRequestHistory(event);
      log.warn(event.state, event.body);
    });

    this.circuit.on('close', () => {
      const event = {
        state: 'CLOSE',
        body: `The breaker for endpoint has closed. Service OK.`,
        timeStamp: moment.now(),
      };
      this.addRequestHistory(event);
      log.info(event.state, event.body);
    });

    /*this.circuit.on('fallback', (data) => {
      const event: CircuitRequestResult = {
        state: 'FALLBACK',
        body: `Resorting to fallback mechanism.`,
        timeStamp: moment.now(),
      };
      this.addRequestHistory(event);
    });*/
  }

  public printRequestTail() {
    // instantiate
    const table = new Table({
      head: ['Circuit State', 'Circuit Desc.', 'Result', 'TimeStamp'],
      colWidths: [20, 50, 30, 20],
    });

    this.requestHistory.forEach((element) => {
      let result = 'N/A';
      if (element.result && 'status' in element.result) {
        result = `${element.result.status} ${
          element.result.statusText
        } ${JSON.stringify(element.result.data)}`;
      } else if (element.result && 'stack' in element.result) {
        result = `ERROR ${JSON.stringify(element.result)}`;
      }
      table.push([
        element.state,
        element.body,
        result,
        moment(element.timeStamp).format('HH:MM:ss'),
      ]);
    });

    log.logTail(table.toString(), 'API Caller');
  }

  private addRequestHistory(request: CircuitRequestResult) {
    if (this.requestHistory.length > this.requestHistoryLength) {
      this.requestHistory.pop();
    }

    this.requestHistory.unshift(request);
  }

  public async makeRequest() {
    try {
      await this.circuit.fire();
      log.verbose('Sending API Call');
    } catch (error) {
      log.error(error);
    }
  }
}
