import { DeadboltClient } from './DeadboltClient';
import { DeadboltSearchCriteria, DeadboltStatus } from './Types';
import { DeadboltUser, NewUserData } from './Users/User';

describe("Client, no2fa", () => {
  let deadbolt: DeadboltClient;
  const testUserCreds: NewUserData = {
    email: 'test@example.com',
    username: 'testo',
    password: 'password',
  };
  let testUser: DeadboltUser;

  beforeEach(async (done) => {
    deadbolt = new DeadboltClient();
    await deadbolt.purge(testUserCreds.email).catch(() => {});
    testUser = await deadbolt.addUser(testUserCreds);
    done();
  });
  
  afterEach(async (done) => {
    //await deadbolt.purge(testUser.uuid).catch(() => {});
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

  it("CheckSession OK", async (done) => {
    const loginResult = await deadbolt.login({ identifier: 'testo', password: 'password' });
    const token = loginResult.user.session.token;

    const result = await deadbolt.checkSession(token);
    expect(result.success).toBe(true);
    expect(result.user.uuid).toBe(testUser.uuid);

    done();
  });

  it("CheckSession Fail", async (done) => {
    const token = '123456789';

    const result = await deadbolt.checkSession(token);
    expect(result.success).toBe(false);
    expect(result.user).toBeNull();

    done();
  });

  it("Confirm Email Success", async (done) => {
    const result = await deadbolt.confirmEmail(testUser.emailConfirmToken);
    expect(result).toBe(true);

    done();
  });

  it("Confirm Email Failed", async (done) => {
    const result = await deadbolt.confirmEmail('ma anaconna doehn');
    expect(result).toBe(false);

    done();
  });

  it("Request Password Reset, OK", async (done) => {
    const result = await deadbolt.requestPasswordReset(testUser.email);
    expect(result.success).toBe(true);
    expect(result.token).not.toBeNull();
    expect(result.uuid).toBe(testUser.uuid);

    const resetResult = await deadbolt.passwordReset(result.token, 'newpassword');
    expect(resetResult.success).toBeTrue();

    const resetResult2 = await deadbolt.passwordReset(result.token, 'newpassword');
    expect(resetResult2.success).toBeFalse();
    expect(resetResult2.reason).not.toBeNull;

    done();
  });

  it("Request Password Reset, wrong email", async (done) => {
    const result = await deadbolt.requestPasswordReset("foo-123456@example.com");
    expect(result.success).toBe(false);
    expect(result.token).toBeNull();
    expect(result.uuid).toBeNull();

    done();
  });

  it("Change Password", async (done) => {
    const result = await deadbolt.changePassword(testUser.uuid, 'newPassword');
    expect(result.success).toBe(true);

    done();
  });

  it("verify Password", async (done) => {
    const right = await deadbolt.verifyPassword(testUser.uuid, 'password');
    expect(right).toBe(true);

    const wrong = await deadbolt.verifyPassword(testUser.uuid, 'nopert');
    expect(wrong).toBe(false);

    done();
  });

  it("verify and Password", async (done) => {
    const right = await deadbolt.verifyAndChangePassword(testUser.uuid, 'password', 'newpassword');
    expect(right.success).toBe(true);

    const wrong = await deadbolt.verifyAndChangePassword(testUser.uuid, 'foo', 'qwertyuiop');
    expect(wrong.success).toBe(false);

    done();
  });


  it("get single user", async (done) => {
    const user = await deadbolt.getUser(testUser.uuid);
    expect(user.uuid).toBe(testUser.uuid);

    const wrong = await deadbolt.getUser('1231232');
    expect(wrong).toBeNull();

    done();
  });

  it("get users", async (done) => {
    const s = new DeadboltSearchCriteria();
    s.email = 'test@';

    const page = await deadbolt.getUsers(s);
    expect(page.items.length).toBeGreaterThan(0);
    expect(page.currentPage).toBe(0);

    const u = page.items.find(u => u.uuid === testUser.uuid);
    expect(u).not.toBeNull();

    done();
  });

  it("Search users with memberships", async (done) => {
    await deadbolt.updateMemberships(testUser.uuid, [{ app: 'some:app', role: 'some:role' }]);

    const s = new DeadboltSearchCriteria();
    s.membership = [{ app: 'some:app', role: 'some:role' }];

    const page = await deadbolt.getUsers(s);
    expect(page.items.length).toBeGreaterThan(0);
    expect(page.currentPage).toBe(0);

    const u = page.items.find(u => u.uuid === testUser.uuid);
    expect(u).not.toBeNull();

    done();
  });

  it("update Users", async (done) => {

    const update = await deadbolt.updateUser({ firstName: 'derek', uuid: testUser.uuid });
    expect(update.firstName).toBe('derek');

    done();
  });

  it("update memberships", async (done) => {
    testUser.addRoles(['admin', 'fryer', 'nun', 'chair'], 'test-app');

    const update = await deadbolt.updateMemberships(testUser.uuid, testUser.memberships);

    expect(update.memberships.length).toBe(4);

    done();
  });

  it("Force Confirm Email", async (done) => {

    const confirmed = await deadbolt.forceConfirmEmail(testUser.email);
    expect(confirmed).toBe(true);

    try {
      await deadbolt.forceConfirmEmail('example33424242@example.com');
      expect(true).toBe(false, "Email doesn't exist.");
    } catch (err) {
      expect(String(err)).toContain('user-not-found');
    }


    done();
  });

});

describe("Client 2fa", () => {
  let deadbolt: DeadboltClient;
  const testUserCreds: NewUserData = {
    email: 'test@example.com',
    username: 'testo',
    password: 'password',
    twoFactor: 'email',
  };
  let testUser: DeadboltUser;

  beforeEach(async (done) => {
    deadbolt = new DeadboltClient();
    await deadbolt.purge(testUserCreds.email);
    testUser = await deadbolt.addUser(testUserCreds);
    done();
  });

  it("login and verify 2fa", async (done) => {
    const result = await deadbolt.login({ identifier: 'testo', password: 'password' });
    expect(result.needs2fa).toBe(true);
    expect(result.twoFactorData.type).toBe('email');
    expect(result.success).toBe(true);
    expect(result.user.session).toBeNull();

    const verification = await deadbolt.verifyTwoFactor(result.user.uuid, result.twoFactorData.token, result.twoFactorData.userToken, 'email');

    expect(verification.success).toBe(true);
    expect(verification.needs2fa).toBe(false);
    expect(verification.user.session).not.toBeNull();

    done();
  });

  it("login and fail 2fa check", async (done) => {
    const result = await deadbolt.login({ identifier: 'testo', password: 'password' });
    expect(result.needs2fa).toBe(true);
    expect(result.twoFactorData.type).toBe('email');
    expect(result.success).toBe(true);
    expect(result.user.session).toBeNull();

    const verification = await deadbolt.verifyTwoFactor(result.user.uuid, 'yo-momma', result.twoFactorData.userToken, 'email');

    expect(verification.success).toBe(false);
    expect(verification.reason).toContain('verification-failed');

    done();
  });

  it("Setup 2fa totp", async (done) => {
    const data = await deadbolt.setupTwoFactor(testUser.uuid, 'totp');

    expect(data.type).toBe('totp');
    expect(data.message).toBeNull();
    expect(data.confirmed).not.toBeNull();
    expect(data.otpAuthUrl).not.toBeNull();
    expect(data.secret).not.toBeNull();
    expect(data.userToken).not.toBeNull();

    done();
  });

  it("Setup 2fa sms", async (done) => {
    const data = await deadbolt.setupTwoFactor(testUser.uuid, 'sms');

    expect(data.type).toBe('sms');
    expect(data.message).not.toBeNull();
    expect(data.confirmed).toBeNull();
    expect(data.otpAuthUrl).toBeNull();
    expect(data.secret).toBeNull();
    expect(data.userToken).toBeNull();

    done();
  });

  it("request 2fa sms", async (done) => {
    const data = await deadbolt.requestTwoFactor(testUser.uuid, 'sms');

    expect(data.type).toBe('sms');
    expect(data.userToken).not.toBeNull();
    expect(data.token).not.toBeNull();
    expect(data.expires).not.toBeNull();

    done();
  });

  it("Get Tokens", async (done) => {
    await deadbolt.requestTwoFactor(testUser.uuid, 'email');
    await deadbolt.requestTwoFactor(testUser.uuid, 'email');
    await deadbolt.requestTwoFactor(testUser.uuid, 'email');

    const page = await deadbolt.getTokens('email');
    console.log(page.items[0]);
    expect(page.items.length).toBeGreaterThanOrEqual(3);

    done();
  });
});