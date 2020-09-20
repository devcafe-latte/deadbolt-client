import moment from 'moment';

import { Serializer, ObjectMapping } from './Serializer';
import { Moment } from 'moment';

describe('Deserialize', () => {

  const exampleJson = {
    uuid: 'ee13624b-cf22-4597-adb9-bfa4b16baa71',
    name: null,
    email: 'coo@covle.com',
    created: 1584422435,
    session:
    {
      created: 1584422436,
      expires: 1585027236,
      token: '590c3a95dbf475b04ece7510fd0c72cd'
    },
    memberships:
      [{ id: 1, created: 1565516907, app: 'test-main', role: 'admin' }]
  };

  it('Basics', () => {
    const user = Serializer.deserialize<User>(User, { uuid: "123", name: 'coo' });
    expect(user.name).toBe('coo');
    expect(user.uuid).toBe("123");
  });

  it('Mapping', () => {
    const timestamp = moment().unix();
    const mapping = {
      created: "Moment",
      name: (v: string) => v.toUpperCase(),
      nope: (v) => false
    };

    const user = Serializer.deserialize<User>(User, { uuid: "123", name: 'coo', created: timestamp }, mapping);
    expect(user.name).toBe('COO', "Should be uppercase");
    expect(user.uuid).toBe("123");
    expect(user.created.constructor.name).toBe("Moment");
    expect(user.created.unix()).toBe(timestamp);
  });

  it("Session", () => {
    const mapping: ObjectMapping = {
      created: 'moment',
      expires: 'moment'
    };
    let s = Serializer.deserialize<Session>(Session, exampleJson.session, mapping);
    expect(s.created.constructor.name).toBe("Moment");
    expect(s.expires.constructor.name).toBe("Moment");
  });

  it("User", () => {
    const mapping: ObjectMapping = {
      created: 'moment',
      session: (data) => Session.deserialize(data),
    };
    let u = Serializer.deserialize<User>(User, exampleJson, mapping);
    expect(u.created.constructor.name).toBe("Moment");
    expect(u.session.constructor.name).toBe("Session");
  });
});

describe('Serialize', () => {

  it("takes a simple value", () => {
    expect(Serializer.serialize(1)).toBe(1);
    expect(Serializer.serialize("foo")).toBe("foo");
    expect(Serializer.serialize(false)).toBe(false);
  });

  it("takes a simple array", () => {
    const array = [1, "foo", false]
    const result = Serializer.serialize(array);
    expect(result).toEqual(array);
  });

  it("takes a simple Object", () => {
    const obj = { num: 1, str: "foo", bool: false };
    const result = Serializer.serialize(obj);
    expect(result).toEqual(obj);
  });

  it("takes a complex Object", () => {
    const input = {
      d: moment().startOf('week'),
      str: 'foo',
      o: { serialize: () => { return { r: 'serialized' } } }
    };

    const expected = {
      d: moment().startOf('week').unix(),
      str: 'foo',
      o: { r: 'serialized' }
    };

    const result = Serializer.serialize(input);
    expect(result).toEqual(expected);
  });

  it("takes an array with a complex Object", () => {
    const input = {
      d: moment().startOf('week'),
      str: 'foo',
      o: { serialize: () => { return { r: 'serialized' } } }
    };

    const expected = {
      d: moment().startOf('week').unix(),
      str: 'foo',
      o: { r: 'serialized' }
    };

    const result = Serializer.serialize([input]);
    expect(result).toEqual([expected]);
  });
});

class User {
  uuid: string = null;
  name: string = null;
  email: string = null;
  session: Session = null;
  memberships: any[] = null;
  created: Moment = null;
}

class Session {
  created: Moment = null;
  expires: Moment = null;
  token: string = null;

  static deserialize(data: any): Session {
    const m: ObjectMapping = {
      created: 'moment',
      expires: 'moment',
    };
    return Serializer.deserialize(Session, data, m);
  }
}
