import { Moment } from 'moment';

import moment from 'moment';
import { randomBytes } from 'crypto';
import { DeadboltUser } from './User';
import { Serializer, ObjectMapping } from '../util/Serializer';
import { twoFactorType } from '../Types';

export class Session {
  id: number = null;
  userId: number = null;
  created: Moment = null;
  expires: Moment = null;
  token: string = null;

  constructor() { }

  static async new(u: DeadboltUser, expires: Moment): Promise<Session> {
    const s = new Session();
    s.userId = u.id;
    s.created = moment();
    s.expires = expires;
    s.token = randomBytes(16).toString('hex');
    u.session = s;

    return s;
  }

  static deserialize(data: any): Session {
    const m: ObjectMapping = {
      created: 'moment',
      expires: 'moment',
    }

    return Serializer.deserialize<Session>(Session, data, m);
  }

}

export class TwoFactorSetupResponse {
  type: twoFactorType = null;
  message?: string = null;
  confirmed?: boolean = null;
  expires?: Moment = null;
  userToken?: string = null;
  secret?: string = null;
  otpAuthUrl?: string = null;

  static deserialize(data: any): TwoFactorSetupResponse {
    const m: ObjectMapping = {
      confirmed: 'moment',
    }

    return Serializer.deserialize<TwoFactorSetupResponse>(TwoFactorSetupResponse, data, m);
  }
}

export class SessionResponse {
  success: boolean = null;
  user?: DeadboltUser = null;
  twoFactorData?: TwoFactorData = null;
  reason?: string = null;

  get needs2fa(): boolean {
    return Boolean(this.twoFactorData);
  }

  static failed(reason: string): SessionResponse {
    const s = new SessionResponse();
    s.reason = reason;
    s.success = false;
    return s;
  }

  static deserialize(data: any): SessionResponse {
    const m: ObjectMapping = {
      user: (d) => DeadboltUser.deserialize(d),
      twoFactorData: (d) => TwoFactorData.deserialize(d),
    }

    return Serializer.deserialize<SessionResponse>(SessionResponse, data, m);
  }
}

export class TwoFactorData {
  type: twoFactorType = null;
  expires?: Moment = null;
  used?: boolean = null;
  token?: string = null; //The token to send to email/sms
  userToken: string = null; //The tokent to give the front-end client
  attempt?: number = null;

  secret?: string = null;
  confirmed?: boolean = null;
  otpAuthUrl?: string = null;


  static deserialize(data: any): TwoFactorData {
    const m: ObjectMapping = {
      expires: 'moment',
    }

    return Serializer.deserialize<TwoFactorData>(TwoFactorData, data, m);
  }
}