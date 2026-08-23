export interface ISystemConfigRepository {
  get(key: string): Promise<string | null>;
  set(key: string, value: string): Promise<void>;
}
