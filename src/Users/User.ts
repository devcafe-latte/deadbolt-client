import { Moment } from 'moment';
import { Serializer, ObjectMapping } from '../util/Serializer';
import { Session } from './Session';
import { twoFactorType, identifier } from '../Types';
import { isArray } from 'lodash';

export interface Membership {
  id?: number;
  userId?: number;
  created?: Moment;
  app: string;
  role: string;
}

export interface NewUserData {
  username: string;
  email: string;
  password: string;
  firstName?: string;
  lastName?: string;
  twoFactor?: twoFactorType;
}

export interface Credentials {
  identifier: identifier,
  password: string,
  app?: string,
}

export class DeadboltUser {
  id?: number = null;
  uuid?: string = null;
  username: string = null;
  firstName?: string = null;
  lastName?: string = null;
  email?: string = null;
  emailConfirmed?: Moment = null;
  emailConfirmToken?: string = null;
  emailConfirmTokenExpires?: Moment = null;
  session?: Session = null;
  created?: Moment = null;
  lastActivity?: Moment = null;
  active: Boolean = null;
  memberships: Membership[] = [];
  twoFactor: twoFactorType = null;

  constructor() { }

  addRoles(roles: string[] | string, app: string) {
    if (!isArray(roles)) roles = [roles];

    for (let role of roles) {
      if (this.hasRole(role, app)) continue;
      this.memberships.push({ app, role });
    }
  }

  hasRole(role: string, app?: string): boolean {
    if (app) {
      return Boolean(this.memberships.find(m => m.role === role && m.app === app));
    }

    return Boolean(this.memberships.find(m => m.role === role));
  }

  hasApp(app: string): boolean {
    return Boolean(this.memberships.find(m => m.app === app));
  }

  static deserialize(data: any): DeadboltUser {
    const m: ObjectMapping = {
      created: 'moment',
      lastActivity: 'moment',
      emailConfirmTokenExpires: 'moment',
      session: (d) => Session.deserialize(d),
    }

    return Serializer.deserialize<DeadboltUser>(DeadboltUser, data, m);
  }
}