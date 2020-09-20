import { DeadboltError } from './Error';
import { FetchWrapper } from './fetch/FetchWrapper';
import { DeadboltClientOptions, DeadboltSearchCriteria, DeadboltStatus, identifier, twoFactorType } from './Types';
import { SessionResponse } from './Users/Session';
import { Credentials, DeadboltUser, Membership, NewUserData } from './Users/User';
import { getErrorCode } from './util/helpers';
import { Page, PageResult } from './util/Page';
import { Serializer } from './util/Serializer';

export class DeadboltClient {
  private _options: DeadboltClientOptions = {
    endpoint: 'http://localhost:3000/',
  };
  private _fetch: FetchWrapper;

  constructor(options?: DeadboltClientOptions) {
    if (options) {
      Object.assign(this._options, options);
    }

    this._fetch = new FetchWrapper(this._options.endpoint);
  }

  async status(): Promise<DeadboltStatus> {
    const result = await this._fetch.get("");

    return result.body;
  }

  async login(creds: Credentials): Promise<SessionResponse> {
    //Talk to User middleware
    const data = await this._fetch.post("session", { username: creds.identifier, password: creds.password, app: creds.app });

    if (data.status === 422) {
      return SessionResponse.failed(data.body.reason);
    } else if (data.status !== 200) {
      console.error("Something went wrong.", data);
      throw DeadboltError.new("login-error");
    }

    return SessionResponse.deserialize(data.body);
  }

  async checkSession(token: string): Promise<SessionResponse> {
    const data = await this._fetch.get(`user-by-session/${token}`);

    if (data.status === 404) {
      return SessionResponse.failed(data.body.reason);
    } else if (data.status === 200) {
      return SessionResponse.deserialize({ user: data.body, success: true });
    } else {
      console.error("Something went wrong.", data.error);
      throw DeadboltError.new("check-session-error");
    }
  }


  async verify2Fa(identifier: identifier, token: string, userToken: string): Promise<DeadboltUser> {
    const body = {
      type: "totp",
      identifier,
      data: {
        token: token,
        userToken,
      },
    };

    const postResponse = await this._fetch.post('verify-2fa', body);
    if (postResponse.status !== 200) {
      // const reason: string = postResponse.body && postResponse.body.reason ? postResponse.body.reason : "Unknown Error";
      // const code = reason.toLowerCase().replace(/\s/g, '-');
      throw DeadboltError.new("2fa-verifiy-failed");
    }

    //verified!
    const user = DeadboltUser.deserialize(postResponse.body.user);
    return user;
  }

  async confirmEmail(token: string) {
    const result = await this._fetch.post('confirm-email', { token });
    if (result.status !== 200) throw DeadboltError.new("confirm-email-error");

    const success = result.body.result === 'ok';

    return success;
  }

  async requestPasswordReset(identifier: identifier): Promise<{ success: boolean, token: string, uuid: string }> {

    const result = await this._fetch.post('reset-password-token', { identifier });

    if (result.status === 200) {
      return {
        success: true,
        token: result.body.token,
        uuid: result.body.uuid
      };
    }

    const err = getErrorCode(result);
    console.log("Unknown error, requesting password Reset", result);
    throw DeadboltError.new(err);
  }

  async passwordReset(token: string, password: string): Promise<string> {

    const result = await this._fetch.post('reset-password', { token, password });

    if (result.status === 200) {
      const user = await this.getUser(result.body.uuid);
      return 'ok';
    }

    const error = getErrorCode(result);
    console.error(error);

    return error;
  }

  async changePassword(uuid: string, password: string) {
    const result = await this._fetch.put('password', { uuid, password });

    if (result.status === 200) {
      return;
    }

    console.log("Unknown error, ChangePassword", result);
    throw result.error;
  }

  async verifyPassword(identifier: string, password: string): Promise<boolean> {
    const result = await this._fetch.post('verify-password', { identifier, password });

    if (result.status === 200) {
      return result.body.verified;
    }

    if (result.status === 404) {
      console.error("User not found");
      return false;
    }

    console.error("Unknown error, verifyPassword", result);
    throw result.error;
  }

  async getUser(identifier: identifier) {
    const data = await this._fetch.get(`user/${identifier}`);
    if (data.status !== 200) {
      console.error(data);
      throw DeadboltError.new("error-getting-user");
    }

    return DeadboltUser.deserialize(data.body);
  }

  async getUsers(search: DeadboltSearchCriteria): Promise<Page<DeadboltUser>> {
    const fetchResult = await this._fetch.get(`users?${search.toQueryParams()}`);
    const data: PageResult = fetchResult.body;
    const result = new Page<DeadboltUser>(data, DeadboltUser);

    return result;
  }

  async addUser(user: NewUserData): Promise<DeadboltUser> {

    const result = await this._fetch.post('user', user);
    if (result.status !== 200) {
      const reason: string = result.body.reason || 'unknown';
      if (reason.toLowerCase() === "email already exists") {
        console.log("User already exists");
        throw DeadboltError.new("email-already-exists");
      } else {
        console.error(result);
        throw DeadboltError.new('add-user-failed');
      }
    }

    return DeadboltUser.deserialize(result.body.user);
  }

  async updateUser(userData: Partial<DeadboltUser>) {
    if (!userData.uuid) throw DeadboltError.new("missing-uuid");

    const u = await this.getUser(userData.uuid);

    //Update user
    const result = await this._fetch.put('user', { uuid: userData.uuid, user: Serializer.serialize(userData) });
    if (result.status !== 200) {
      console.error(result);
      throw DeadboltError.new('update-user-failed');
    }

    let updatedUser: DeadboltUser;
    //Update memberships
    if (userData.memberships) updatedUser = await this.updateMemberships(userData.uuid, userData.memberships);

    //Kill sessions
    if (!userData.active) await this._fetch.delete(`session/all/${userData.uuid}`);

    if (!updatedUser) updatedUser = await this.getUser(userData.uuid);

    return updatedUser;
  }

  private async updateMemberships(identifier: identifier, memberships: Membership[]): Promise<DeadboltUser> {
    const result = await this._fetch.put('memberships', { identifier, memberships: Serializer.serialize(memberships) });
    if (result.status !== 200) {
      console.error(result);
      throw DeadboltError.new('update-user-failed');
    }

    return DeadboltUser.deserialize(result.body);
  }

  async purge(uuid: string) {
    const result = await this._fetch.delete(`user/${uuid}`);
    if (result.status !== 200) {
      console.error(result);
      throw DeadboltError.new('purge-user-failed');
    }
  }

  async getTokens(type: twoFactorType, page: number = 0) {
    const result = await this._fetch.get(`2fa-tokens?page=${page}&type=${type}`);
    return result.body;
  }

  async forceConfirmEmail(email: string) {
    let u = await this.getUser(email);

    if (!u) throw DeadboltError.new("user-not-found");

    return await this.confirmEmail(u.emailConfirmToken);
  }

  async reset2fa(uuid: string, type: twoFactorType = 'totp') {
    const result = await this._fetch.post('setup-2fa', { type, identifier: uuid });
    if (result.status !== 200) throw DeadboltError.new('2fa-reset-error');

    await this._fetch.delete(`session/all/${uuid}`);
  }

}