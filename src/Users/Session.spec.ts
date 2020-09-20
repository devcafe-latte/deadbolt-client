import moment from 'moment';

import { Session } from './Session';

describe("Session", () => {
  const dateString = '2020-01-01 12:00:00';
  const format = 'YYYY-MM-DD HH:mm:ss';

  it("Deserialize Session", () => {

    let data = {
      id: 1,
      userId: 10,
      created: moment(dateString, format).unix(),
      expires: moment(dateString, format).add(1, 'hour').unix(),
      token: '123456-789012-345678-901234-567890'
    };

    const session = Session.deserialize(data);
    expect(session.constructor.name).toBe("Session");
    expect(session.id).toBe(data.id);
    expect(session.userId).toBe(data.userId);
    expect(session.created.unix()).toBe(moment(dateString, format).unix());
    expect(session.expires.unix()).toBe(moment(dateString, format).add(1, 'hour').unix());
    expect(session.token).toBe(data.token);
  });

  // it("Deserialize SessionResponse", () => {
  //   const dateString = '2020-01-01 12:00:00';
  //   const format = 'YYYY-MM-DD HH:mm:ss';

  //   let data = {
  //     id: 1,
  //     userId: 10,
  //     created: moment(dateString, format).unix(),
  //     expires: moment(dateString, format).add(1, 'hour').unix(),
  //     token: '123456-789012-345678-901234-567890'
  //   };

  //   const session = Session.deserialize(data);
  //   expect(session.constructor.name).toBe("Session");
  //   expect(session.id).toBe(data.id);
  //   expect(session.userId).toBe(data.userId);
  //   expect(session.created.unix()).toBe(moment(dateString, format).unix());
  //   expect(session.expires.unix()).toBe(moment(dateString, format).add(1, 'hour').unix());
  //   expect(session.token).toBe(data.token);
  // });
});