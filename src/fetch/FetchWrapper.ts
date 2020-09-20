import fetch, { RequestInit } from 'node-fetch';

import { Deferred } from '../util/Deferred';
import { ApiResponse } from './ApiResponse';

interface QueuedRequest {
  deferred: Deferred<ApiResponse>;
  method: string;
  url: string;
  body?: any;
}

export class FetchWrapper implements FetchWrapperInterface {
  private _headers: any = { ...defaultHeaders };

  private running = 0;
  private queue: QueuedRequest[] = [];

  constructor(private _endpoint: string, private maxConcurrent = 4) {
  }

  private async processQueue() {
    if (this.running >= this.maxConcurrent) return;
    this.running++;

    while (this.queue.length > 0) {
      const qi = this.queue.pop();
      if (!qi) break;

      if (this.queue.length > 5) {
        console.warn("[Fetch Warning] Getting long queues!", `Length: ${this.queue.length} Runners: ${this.running} Endpoint: ${this._endpoint}`);
      }

      if (this.queue.length > 10 && this.maxConcurrent < 50) {
        this.maxConcurrent++;
        console.warn(`[Fetch Warning] Scaling up Max Concurrent to: ${this.maxConcurrent} Endpoint: ${this._endpoint}`);
      }

      await this.doRequest(qi);
    }

    this.running--;
  }

  private async doRequest(qi: QueuedRequest) {
    const init: RequestInit = {
      method: qi.method,
      headers: this._headers,
    };
    if (qi.body) init.body = JSON.stringify(qi.body);

    await fetch(this._endpoint + qi.url, init)
      .then(async r => qi.deferred.resolve(await ApiResponse.new(r)))
      .catch(async e => qi.deferred.resolve(await ApiResponse.new(e)));

  }

  public async get(url: string): Promise<ApiResponse> {
    const d = new Deferred<ApiResponse>();
    this.queue.unshift({
      method: "GET",
      url: url,
      deferred: d
    });

    this.processQueue();

    return d.promise;
  }

  // private async _get(url: string): Promise<ApiResponse> {
  //   const init: RequestInit = {
  //     method: "GET",
  //     headers: this._headers,
  //   };

  //   return fetch(this._endpoint + url, init)
  //     .then(r => ApiResponse.new(r))
  //     .catch(e => ApiResponse.new(e));
  // }

  public async delete(url: string): Promise<ApiResponse> {
    const d = new Deferred<ApiResponse>();
    this.queue.unshift({
      method: "DELETE",
      url: url,
      deferred: d
    });

    this.processQueue();

    return d.promise;
  }

  public async post(url: string, body: any): Promise<ApiResponse> {
    const d = new Deferred<ApiResponse>();
    this.queue.unshift({
      method: "POST",
      url: url,
      deferred: d,
      body
    });

    this.processQueue();

    return d.promise;
  }

  public async put(url: string, body: any): Promise<ApiResponse> {
    const d = new Deferred<ApiResponse>();
    this.queue.unshift({
      method: "PUT",
      url: url,
      deferred: d,
      body
    });

    this.processQueue();

    return d.promise;
  }

  public async putForm(url: string, file: any): Promise<ApiResponse> {
    const headers = { ...this._headers }
    //delete headers['Content-Type'];

    const body: any = file;

    const init: RequestInit = {
      method: "PUT",
      headers,
      body
    };

    return fetch(this._endpoint + url, init)
      .then(r => ApiResponse.new(r))
      .catch(e => ApiResponse.new(e));
  }

  setHeader(name: string, value: string) {
    this._headers[name] = value;
  }

  removeHeader(name: string) {
    delete this._headers[name];
  }

  resetHeaders() {
    this._headers = { ...defaultHeaders };
  }
}

export interface FetchWrapperInterface {
  get(url: string): Promise<ApiResponse>;
  delete(url: string): Promise<ApiResponse>;
  post(url: string, body: any): Promise<ApiResponse>;
  put(url: string, body: any): Promise<ApiResponse>;
}

const defaultHeaders = {
  'Accept': 'application/json',
  'Content-Type': 'application/json'
};