import { DomainError } from './domain-error';

export class Result<T> {
  private constructor(
    private readonly value: T | null,
    private readonly error: DomainError | null
  ) {}
  
  static ok<T>(value: T): Result<T> { 
    return new Result<T>(value, null); 
  }
  
  static fail<T>(error: DomainError | Error | string): Result<T> {
    const domainError = typeof error === 'string'
      ? new DomainError(error)
      : error instanceof DomainError
        ? error
        : new DomainError(error.message);
    return new Result<T>(null, domainError); 
  }
  
  isSuccess(): boolean { 
    return this.error === null; 
  }

  isFailure(): boolean {
    return this.error !== null;
  }
  
  getValue(): T { 
    if (!this.value && this.value !== false && this.value !== 0 && this.value !== '') { 
      if (this.error) {
        throw new Error(`Cannot get value from failed result: ${this.error.message}`);
      }
    }
    return this.value as T; 
  }
  
  getError(): DomainError { 
    if (!this.error) throw new Error("Cannot get error from successful result");
    return this.error; 
  }
}
