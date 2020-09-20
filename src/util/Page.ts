import { Serializer } from './Serializer';

export class Page<T> {
  items: T[] = [];
  currentPage: number = 0;
  lastPage: number = 0;
  private totalItems: number = 0;
  private perPage: number = 25;

  constructor(result: PageResult, type?: any) {
    Object.assign(this, result);

    if (type && typeof type['deserialize'] === "function") {
      this.items = this.items.map(i => type.deserialize(i));
    }

    if (this.totalItems !== undefined && this.perPage !== undefined) this.setLastPage(this.totalItems);
  }

  private setLastPage(total: number) {
    if (this.perPage === 0) {
      this.lastPage = 0;
      return;
    }
    this.lastPage = total ? Math.ceil(total / this.perPage) - 1 : 0;
  }

  static empty<T>(): Page<T> {
    const p = new Page<T>({
      totalItems: 0,
      perPage: 25,
      items: [],
      currentPage: 0
    });

    return p;
  }

  serialize() {
    return {
      currentPage: this.currentPage,
      lastPage: this.lastPage,
      items: Serializer.serialize(this.items),
    }
  }
}

export interface PageResult {
  items: any[],
  currentPage: number;
  totalItems?: number;
  lastPage?: number;
  perPage?: number;
}