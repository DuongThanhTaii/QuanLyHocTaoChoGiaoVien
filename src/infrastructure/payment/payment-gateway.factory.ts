import { IPaymentGateway } from '../../domains/payment/ports/payment-gateway';

export class PaymentGatewayFactory {
  private gateways: Map<string, IPaymentGateway> = new Map();
  
  register(gateway: IPaymentGateway): void {
    this.gateways.set(gateway.name, gateway);
  }
  
  get(name: string): IPaymentGateway {
    const gateway = this.gateways.get(name);
    if (!gateway) throw new Error(`Gateway ${name} not found`);
    return gateway;
  }
}
