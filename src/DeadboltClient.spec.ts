import { DeadboltClient } from './DeadboltClient';
import { DeadboltStatus, identifier } from './Types';
import { NewUserData, DeadboltUser } from './Users/User';

describe("Mail Client", () => {
  let deadbolt: DeadboltClient;
  const testUserCreds: NewUserData = {
    email: 'test@example.com',
    username: 'testo',
    password: 'password',
  };
  let testUser: DeadboltUser;

  beforeEach(async (done) => {
    deadbolt = new DeadboltClient();
    testUser = await deadbolt.addUser(testUserCreds);
    done();
  });

  afterEach(async (done) => {
    await deadbolt.purge(testUser.uuid);
    done();
  });

  it("Get status", async (done) => {
    const status = await deadbolt.status();

    const expected: DeadboltStatus = {
      database: "ok",
      status: "ok",
      express: "ok",
    }

    expect(status).toEqual(expected);

    done();
  });

  it("login correctly", async (done) => {
    const result = await deadbolt.login({ identifier: 'testo', password: 'password' });
    expect(result.user.uuid).toBe(testUser.uuid);
    expect(result.needs2fa).toBe(false);
    expect(result.twoFactorData).toBe(null);
    expect(result.success).toBe(true);

    done();
  });

  it("login wrong password", async (done) => {
    const result = await deadbolt.login({ identifier: 'testo', password: 'notthepassword' });
    expect(result.user).toBeNull();
    expect(result.reason).not.toBe(null);
    expect(result.success).toBe(false);

    done();
  });

  it("CheckSession", async (done) => {
    const loginResult = await deadbolt.login({ identifier: 'testo', password: 'password' });
    const token = loginResult.user.session.token;

    const result = await deadbolt.checkSession(token);
    expect(result.success).toBe(true);
    expect(result.user.uuid).toBe(testUser.uuid);

    done();
  });

  /* 
  To test:

  verify2fa
  confirmEmail
  requestPasswordReset
  passwordReset
  changePassword
  verifyPassword
  
  getUser
  getUsers
  addUser
  updateUser
  udpateMemberships
  Purge
  
  Get Tokens
  forceConfirmEmail
  reset2fa
   */
});