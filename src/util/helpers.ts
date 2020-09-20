export function getErrorCode(obj: any, depth = 0): string {
  if (!obj || depth > 5) return 'unknown-error';

  if (typeof obj === "string") {
    const code = obj.replace(/([^\w -]|[_])/g, '').replace(/\s/g, '-').toLowerCase();
    return code;
  }

  const value = obj.reason || obj.message || obj.error || obj.body;

  if (!value) return 'unknown-error';
  
  return getErrorCode(value);
}

export function toQueryParams(obj: any, ignore?: string[]): string[] {
  const params = [];
  for (let p of Object.getOwnPropertyNames(obj)) {
    if (ignore && ignore.indexOf(p) > -1) continue;

    const result = toQueryParam(p, obj[p]);
    if (result !== null) params.push(result);
  }

  return params;
}

function toQueryParam(name: string, value: any): string {

  if (Array.isArray(value)) {
    const params = [];
    for (let v of value) {
      const p = toQueryParam(name, v);
      if (p !== null) params.push(p);
    }
    if (params.length === 0) return null;
    return params.join("&");
  } else if (typeof value === "object" || value === null || value === undefined) {
    return null;
  } else {
    return `${name}=${encodeURIComponent(value)}`;
  }

}