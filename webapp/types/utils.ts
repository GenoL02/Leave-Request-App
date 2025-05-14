export type Dict<T = any> = { [key: string]: T };

export interface SelectOption<T = string> {
  key: T;
  text: string;
  descr?: string;
}
