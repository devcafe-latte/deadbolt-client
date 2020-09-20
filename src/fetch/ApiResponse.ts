import { Response } from 'node-fetch';

export class ApiResponse {
  protected _response: Response;

  protected _error: any;
  get error(): any { return this._error; }

  protected _body: any;
  get body() { return this._body; }

  protected _isJson: boolean;
  get isJson() { return this._isJson; }

  protected _status: number;
  get status() { return this._status; }

  constructor() { }

  static async error(e?: any): Promise<ApiResponse> {
    const r = new ApiResponse();
    r._error = e;
    r._status = 0;
    r._body = "Unknown Error";
    r._isJson = false;
    console.error("JsonResponse Error", e);

    if (!e) return r;

    if (typeof e.text === "function") {
      r._body = e.text();
      r.setBody(r._body);
    } else if (e.message) {
      r._body = e.message;
    }
    
    return r;
  }

  static async new (response: Response): Promise<ApiResponse> {
    const r = new ApiResponse();
    r._response = response;

    if (typeof response.text !== "function") {
      console.error("Not a valid Fetch response");
      return ApiResponse.error(response);
    }

    r._status = response.status;
    r._body = await response.text();

    //Try parse JSON
    r.setBody(r._body);

    return r;
  }

  private setBody(raw: string) {
    try {
      const data = JSON.parse(raw);
      this._body = data;
      this._isJson = true;
    } catch (err) {
      this._isJson = false;
    }
  }

}