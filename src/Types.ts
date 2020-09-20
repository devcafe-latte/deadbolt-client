import { Membership } from './Users/User';
import { toQueryParams } from './util/helpers';
export interface DeadboltClientOptions {
  endpoint: string;
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
  orderBy: string | string[] = 'email';

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
        const value = encodeURIComponent(`${m.app}:${m.role}`);
        params.push(`membership=${value}`);
      }
    }

    return `${params.join("&")}`;
  }
}

export type identifier = string | number;
export type twoFactorType = "totp" | "email" | "sms";