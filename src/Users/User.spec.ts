import { DeadboltUser } from './User';
import moment from 'moment';

describe("User class", () => {
  it("addRoles", () => {
    const u = new DeadboltUser();

    u.addRoles('admin', 'main-app');
    u.addRoles('admin', 'main-app'); //Should be ignored as it already exists.
    u.addRoles('admin', 'other-app');
    u.addRoles(['support', 'user'], 'main-app');

    expect(u.memberships.length).toBe(4);

    expect(u.memberships[0].app).toBe('main-app');
    expect(u.memberships[0].role).toBe('admin');

    expect(u.memberships[1].app).toBe('other-app');
    expect(u.memberships[1].role).toBe('admin');
    expect(u.memberships[2].app).toBe('main-app');
    expect(u.memberships[2].role).toBe('support');
    expect(u.memberships[3].app).toBe('main-app');
    expect(u.memberships[3].role).toBe('user');
  });

  it("hasRoles", () => {
    const u = new DeadboltUser();
    u.addRoles(['admin', 'support', 'user'], 'main-app');

    expect(u.memberships.length).toBe(3);
    expect(u.hasRole('foo', 'bar')).toBe(false);
    expect(u.hasRole('admin', 'main-app')).toBe(true);
    expect(u.hasRole('admin', 'other-app')).toBe(false);
    expect(u.hasRole('foo', 'main-app')).toBe(false);
  });

  it("hasApp", () => {
    const u = new DeadboltUser();
    u.addRoles(['admin', 'support', 'user'], 'main-app');
    u.addRoles(['user', 'doggo'], 'other-app');

    expect(u.memberships.length).toBe(5);
    expect(u.hasApp('main-app')).toBe(true);
    expect(u.hasApp('other-app')).toBe(true);
    expect(u.hasApp('foo')).toBe(false);
    expect(u.hasApp('user')).toBe(false);
  });

  it("deserialize user", () => {
    const dateString = '2020-01-01 12:00:00';
    const format = 'YYYY-MM-DD HH:mm:ss';

    const data = {
      firstName: 'foo',
      lastName: 'bar',
      email: 'foo@example.com',
      username: 'bluppie',
      session: {
        id: 1,
        userId: 10,
        created: moment(dateString, format).unix(),
        expires: moment(dateString, format).add(1, 'hour').unix(),
        token: '123456-789012-345678-901234-567890'
      }
    };

    const user = DeadboltUser.deserialize(data);
    expect(user.constructor.name).toBe("DeadboltUser");
    expect(user.firstName).toBe(data.firstName);
    expect(user.lastName).toBe(data.lastName);
    expect(user.email).toBe(data.email);
    expect(user.username).toBe(data.username);

    expect(user.session.id).toBe(1);
  });
});