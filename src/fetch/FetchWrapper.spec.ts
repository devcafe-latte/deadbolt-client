import { FetchWrapper } from './FetchWrapper';

let api: FetchWrapper;
let endpoint: string;

describe('Fetch Wrapper Tests', () => {

  beforeEach(async (done) => {
    endpoint = 'http://localhost:3000/'; //todo make setting
    api = new FetchWrapper(endpoint);
    done();
  });

  it('gets an existing route', async () => {
    const result = await api.get('');
    expect(result).toBeDefined();
    expect(result.status).toBe(200);
    expect(result.isJson).toBe(true);
  });

  it('Gets many at the same time.', async () => {
    api = new FetchWrapper(endpoint, 1);

    const results = await Promise.all([
      api.get(''),
      api.get(''),
      api.get('/not-a-thing'),
      api.get(''),
      api.get(''),
      api.get('/not-a-thing'),
      api.get(''),
    ]);
    
    expect(results[0]).toBeDefined();
    expect(results[0].status).toBe(200);
    expect(results[0].isJson).toBe(true);
    expect(results[1]).toBeDefined();
    expect(results[1].status).toBe(200);
    expect(results[1].isJson).toBe(true);

    expect(results[2]).toBeDefined();
    expect(results[2].status).toBe(404);
    expect(results[2].isJson).toBe(true);

    expect(results[3]).toBeDefined();
    expect(results[3].status).toBe(200);
    expect(results[3].isJson).toBe(true);
    expect(results[4]).toBeDefined();
    expect(results[4].status).toBe(200);
    expect(results[4].isJson).toBe(true);

    expect(results[5]).toBeDefined();
    expect(results[5].status).toBe(404);
    expect(results[5].isJson).toBe(true);

    expect(results[6]).toBeDefined();
    expect(results[6].status).toBe(200);
    expect(results[6].isJson).toBe(true);
  });

  it('gets a non-existing route', async () => {
    const result = await api.get('not-a-route');
    expect(result).toBeDefined();
    expect(result.status).toBe(404);
  });

  it('has a wrong endpoint', async () => {
    const wrongApi = new FetchWrapper('http://localhost:9999/');

    const result = await wrongApi.get('');
    expect(result).toBeDefined();
    expect(result.status).toBe(0);
    expect(result.body).toContain("ECONNREFUSED");
  });
});