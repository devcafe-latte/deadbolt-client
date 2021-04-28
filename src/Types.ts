import { Membership } from './Users/User';
import { toQueryParams } from './util/helpers';

export interface DeadboltClientOptions {
  endpoint: string;
}

export interface BasicResponse {
  success: boolean;
  reason?: string;
}

export interface PasswordResetResponse {
  success: boolean;
  uuid?: string;
  reason?: string;
}

export interface DeadboltStatus {
  express: string,
  database: string,
  status: string,
}

export class DeadboltSearchCriteria {
  q?: string;
  email?: string;
  uuids?: string[];

  membership?: Membership[];
  page: number = 0;
  perPage: number = 25;
  orderBy: OrderBy | OrderBy[] = OrderBy.EMAIL_ASC;

  static searchUuids(uuids: string | string[]): DeadboltSearchCriteria {
    if (!Array.isArray(uuids)) uuids = [uuids];
    const s = new DeadboltSearchCriteria();
    s.uuids = uuids;

    return s;
  }

  toQueryParams(): string {
    const params = toQueryParams(this, ['membership']);

    if (this.membership) {
      for (let m of this.membership) {
        const value = encodeURIComponent(`"${m.app}":"${m.role}"`);
        params.push(`membership=${value}`);
      }
    }

    return `${params.join("&")}`;
  }
}

export type identifier = string | number;
export type twoFactorType = "totp" | "email" | "sms";

export enum OrderBy {
  EMAIL_ASC = 'email',
  EMAIL_DESC = '-email',
  FIRST_NAME_ASC = 'first-name',
  FIRST_NAME_DESC = '-first-name',
  LAST_NAME_ASC = 'last-name',
  LAST_NAME_DESC = '-last-name',
  CREATED_ASC = 'created',
  CREATED_DESC = '-created',
  LAST_ACTIVITY_ASC = 'last-activity',
  LAST_ACTIVITY_DESC = '-last-activity',
  USERNAME_ASC = 'username',
  USERNAME_DESC = '-username',
}