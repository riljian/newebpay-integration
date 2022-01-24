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
export enum OrderCloseType {
  Fund = 1,
  Refund = 2,
}

export default class Order {
  id!: string
  status: OrderStatus = OrderStatus.Pending
  paymentType?: OrderPaymentType
}
