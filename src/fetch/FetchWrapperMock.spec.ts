import { MockResponse, MockApiResponse, FetchWrapperMock } from './FetchWrapperMock';
import { ApiResponse } from './ApiResponse';


describe('Fetch Wrapper Mock Tests', () => {

  const responses: MockResponse[] = [
    {
      response: MockApiResponse.newSuccess({ result: "ok", id: 'user coo', user: { name: "Coo Covle", email: "coo@example.com" } }),
      method: "POST", url: "/user", body: { name: 'Coo' }
    },
    {
      response: MockApiResponse.newSuccess({ result: "ok", id: 'user rita', user: { name: "Rita Repulsa", email: "rita@example.com" } }),
      method: "POST", url: "/user", body: { name: 'Rita' }
    },
    {
      response: MockApiResponse.newSuccess({ result: "ok", id: 'default POST user', user: { name: "Default User", email: "default@example.com" } }),
      method: "POST", url: "/user"
    },
    {
      response: MockApiResponse.newSuccess({ result: "ok", id: 'default POST', numbers: [1, 2, 3] }),
      method: "POST"
    },
    { response: MockApiResponse.newSuccess({ result: "ok", id: 'default' }) },
    {
      response: MockApiResponse.newSuccess({ result: "ok", id: 'default GET', numbers: [10, 11, 12] }),
      method: "GET"
    },
  ];

  it("Tries getting responses", async (done) => {
    const w = new FetchWrapperMock();
    w.responses = responses;

    let result: ApiResponse;

    result = await w.put('/things', {});
    expect(result.body.id).toBe("default");

    result = await w.put('/things', null);
    expect(result.body.id).toBe("default");

    result = await w.get('/things');
    expect(result.body.id).toBe("default GET");

    result = await w.post('/things', { foo: 'bar' });
    expect(result.body.id).toBe("default POST");

    result = await w.post('/user', { foo: "bar" });
    expect(result.body.id).toBe("default POST user");

    result = await w.post('/user', { name: "bar" });
    expect(result.body.id).toBe("default POST user");

    result = await w.post('/user', { name: "Coo" });
    expect(result.body.id).toBe("user coo");

    result = await w.post('/user', { name: "Rita" });
    expect(result.body.id).toBe("user rita");

    done();
  });

});