import { Identifier } from 'typescript';
import { DeadboltError } from './Error';
import { FetchWrapper } from './fetch/FetchWrapper';
import { DeadboltClientOptions, DeadboltSearchCriteria, DeadboltStatus, identifier, twoFactorType, BasicResponse } from './Types';
import { SessionResponse, TwoFactorSetupResponse, TwoFactorData } from './Users/Session';
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

  async setupTwoFactor(identifier: identifier, type: twoFactorType = 'totp'): Promise<TwoFactorSetupResponse> {
    const result = await this._fetch.post('setup-2fa', { type, identifier });
    if (result.status !== 200) throw DeadboltError.new('2fa-reset-error');

    const data = TwoFactorSetupResponse.deserialize(result.body.data);
    data.type = type;

    return data;
  }

  async requestTwoFactor(identifier: identifier, type: twoFactorType = 'totp'): Promise<TwoFactorData> {
    const result = await this._fetch.post('request-2fa', { type, identifier });
    if (result.status !== 200) throw DeadboltError.new('2fa-request-error');

    const data = TwoFactorData.deserialize(result.body.data);
    data.type = type;

    return data;
  }

  async verifyTwoFactor(identifier: identifier, token: string, userToken: string, type: twoFactorType): Promise<SessionResponse> {
    const body = {
      type,
      identifier,
      data: {
        token: token,
        userToken,
      },
    };

    const postResponse = await this._fetch.post('verify-2fa', body);
    if (postResponse.status === 422) {
      return SessionResponse.failed(postResponse.body.reason);
    } else if (postResponse.status !== 200) {
      console.error(postResponse.error, postResponse.body);
      throw DeadboltError.new("2fa-verifiy-failed");
    }

    //verified!
    return SessionResponse.deserialize(postResponse.body);
  }

  async confirmEmail(token: string) {
    const result = await this._fetch.post('confirm-email', { token });
    if (result.status !== 200) throw DeadboltError.new("confirm-email-error");

    const success = result.body.result === 'ok';

    return success;
  }

  async requestPasswordReset(email: string): Promise<{ success: boolean, token: string, uuid: string }> {

    const result = await this._fetch.post('reset-password-token', { email });

    if (result.status === 200) {
      return {
        success: true,
        token: result.body.token,
        uuid: result.body.uuid
      };
    }

    console.log("WTF", result.status);

    const err = getErrorCode(result);
    if (err === "email-address-not-found") return { success: false, token: null, uuid: null };

    console.log("Unknown error, requesting password Reset", result);
    throw DeadboltError.new(err);
  }

  async passwordReset(token: string, password: string): Promise<BasicResponse> {
    const result = await this._fetch.post('reset-password', { token, password });

    if (result.status === 200) {
      const user = await this.getUser(result.body.uuid);
      return { success: true };
    }

    const error = getErrorCode(result);
    console.error(error);

    return { success: false, reason: error };
  }

  async verifyAndChangePassword(uuid: string, oldPassword: string, newPassword: string): Promise<BasicResponse> {
    if (!await this.verifyPassword(uuid, oldPassword)) return { success: false, reason: 'password-incorrect' };

    return this.changePassword(uuid, newPassword);
  }

  async changePassword(uuid: string, password: string): Promise<BasicResponse> {
    const result = await this._fetch.put('password', { uuid, password });

    if (result.status === 200) {
      return { success: true };
    }

    console.log("Unknown error, ChangePassword", result);
    const error = getErrorCode(result);
    return { success: false, reason: error };
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

  async getUser(identifier: identifier): Promise<DeadboltUser> {
    const data = await this._fetch.get(`user/${identifier}`);
    if (data.status === 404) return null;

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

  async updateMemberships(identifier: identifier, memberships: Membership[]): Promise<DeadboltUser> {
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

  async getTokens(type: twoFactorType, page: number = 0): Promise<Page<TwoFactorData>> {
    const result = await this._fetch.get(`2fa-tokens?page=${page}&type=${type}`);
    return new Page<TwoFactorData>(result.body.data, TwoFactorData);
  }

  async forceConfirmEmail(email: string) {
    let u = await this.getUser(email);

    if (!u) throw DeadboltError.new("user-not-found");

    return await this.confirmEmail(u.emailConfirmToken);
  }

  async logoutAllSessions(identifier: Identifier) {
    await this._fetch.delete(`session/all/${identifier}`);
  }

}