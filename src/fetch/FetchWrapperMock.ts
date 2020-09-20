import { ApiResponse } from './ApiResponse';
import { FetchWrapperInterface } from './FetchWrapper';
import _ from 'lodash';

export class FetchWrapperMock implements FetchWrapperInterface {
  private _responses: MockResponse[] = [];
  get responses(): MockResponse[] { return this._responses; }
  set responses(value: MockResponse[]) {
    this._responses = value;

    for (let r of this._responses) {
      this.processMockResponse(r);
    }
  }

  constructor(responses?: MockResponse[]) { 
    if (responses) this.responses = responses;
  }

  async get(url: string): Promise<MockApiResponse> {
    return this.getResponse("GET", url);
  }
  async delete(url: string): Promise<ApiResponse> {
    return this.getResponse("DELETE", url);
  }
  async post(url: string, body: any): Promise<ApiResponse> {
    return this.getResponse("POST", url, body);
  }
  async put(url: string, body: any): Promise<ApiResponse> {
    return this.getResponse("PUT", url, body);
  }

  private processMockResponse(r: MockResponse) {
    //Set the score.
    if (typeof r.body === "object") {
      r.score = 4;
      r.hash = [ r.method, r.url, JSON.stringify(r.body) ].join('|');
    } else if (r.url) {
      r.score = 3;
      r.hash = [ r.method, r.url ].join('|');
    } else if (r.method) {
      r.score = 2;
      r.hash = r.method;
    } else {
      r.score = 1;
      r.hash = "";
    }
  }

  private getResponse(method: string, url: string, body: any = null): MockApiResponse {
    const hashes = [
      [method, url].join("|"),
      method,
      ""
    ];
    if (typeof body === "object") hashes.unshift([method, url, JSON.stringify(body)].join("|"));

    for (let h of hashes) {
      const r = this.responses.find(r => r.hash === h);
      if (r) return r.response;
    }

    throw "No fitting Mock response found.";
  }
}

export interface MockResponse {
  method?: string;
  url?: string;
  body?: any;
  response: MockApiResponse;

  score?: number;
  hash?: string;
}

export class MockApiResponse extends ApiResponse {
  static newSuccess(body: any, status: number = 200): MockApiResponse {
    const r = new MockApiResponse();
    r._body = body;
    r._status = status;
    r._isJson = true;

    return r;
  }

  static newError(error: any, body: any = null, status: number = 500, isJson = true): MockApiResponse {
    const r = new MockApiResponse();
    r._error = error;
    r._body = body;
    r._status = status;
    r._isJson = isJson;

    return r;
  }
}

export const MailerMockResponses: MockResponse[] = [
  {
    response: MockApiResponse.newSuccess({ result: "ok", mock: true }),
  },
  {
    method: "GET", url: "emails?page=0&perPage=10",
    response: MockApiResponse.newSuccess({ result: "ok", mock: true, perPage: 25, lastPage: 0, currentPage: 0, emails: [] }),
  },
];