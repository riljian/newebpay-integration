export enum OrderStatus {
  Pending,
  Authorized,
  FailedAuthorization,
  CancelledAuthorization,
}
export enum OrderPaymentType {
  Credit = 'CREDIT',
  Vacc = 'VACC',
}

export default class Order {
  id!: string
  status: OrderStatus = OrderStatus.Pending
  paymentType?: OrderPaymentType
}
