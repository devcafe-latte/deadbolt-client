import { Response } from 'node-fetch';
import { ApiResponse } from './ApiResponse';

let response: Response;
let errorResponse: Response;

describe('Api Response Tests', () => {

  beforeEach(async () => {
    response = new Response('{ "result": "ok" }', { status: 200 });
    errorResponse = new Response('{ "result": "failed" }', { status: 500 });
  });

  it('gets a new response', async () => {
    const jr = await ApiResponse.new(response);
    expect(jr.body.result).toBe("ok");
    expect(jr.isJson).toBe(true);
    expect(jr.status).toBe(200);    
  });

  it('gets an error response', async () => {
    const jr = await ApiResponse.new(errorResponse);
    expect(jr.body.result).toBe("failed");
    expect(jr.isJson).toBe(true);
    expect(jr.status).toBe(500);    
  });

  it('gets no body', async () => {
    const r = new Response("", { status: 200 });
    const jr = await ApiResponse.new(r);
    expect(jr.body).toBe("");
    expect(jr.isJson).toBe(false);
    expect(jr.status).toBe(200);    
  });

  it('gets invalid body', async () => {
    const r = new Response("something", { status: 404 });
    const jr = await ApiResponse.new(r);
    expect(jr.body).toBe("something");
    expect(jr.isJson).toBe(false);
    expect(jr.status).toBe(404);    
  });

  it('gets random object', async () => {
    const r: any = { foo: "bar" }
    const jr = await ApiResponse.new(r);
    expect(jr.body).toBe("Unknown Error");
    expect(jr.isJson).toBe(false);
    expect(jr.status).toBe(0);
    expect(jr.error).toBe(r);
  });
});