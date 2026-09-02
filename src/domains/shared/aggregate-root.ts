import { Entity } from './entity';
import { DomainEvent } from './domain-event';

export abstract class AggregateRoot extends Entity {
  private _domainEvents?: DomainEvent[];

  get domainEvents(): DomainEvent[] {
    return this._domainEvents || [];
  }

  protected addDomainEvent(domainEvent: DomainEvent): void {
    if (!this._domainEvents) {
      this._domainEvents = [];
    }
    this._domainEvents.push(domainEvent);
  }

  public clearEvents(): void {
    if (this._domainEvents) {
      this._domainEvents.splice(0, this._domainEvents.length);
    }
  }
}
