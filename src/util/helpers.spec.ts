import { getErrorCode } from './helpers';

it("Get Error Code", () => {
  const inputs = [
    { in: null, out: 'unknown-error' },
    { in: "some error!", out: 'some-error' },
    { in: { body: { reason: "Something went wrong!" } }, out: 'something-went-wrong' },
    { in: { error: { error: { error: 'foo bar' } } }, out: 'foo-bar' },
  ];

  for (let i of inputs) {
    expect(getErrorCode(i.in)).toBe(i.out);
  }

});