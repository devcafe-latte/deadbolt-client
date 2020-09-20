export class DeadboltError {
  message?: string;
  code: string;

  static new(code = 'unknown-error', message?: string): DeadboltError {
    const e = new DeadboltError();
    e.code = code;
    e.message = message;

    return e;
  }

  public toString() {
    if (this.message) return `[${this.code}] ${this.message}`.trim();
    return this.code;
  }

}