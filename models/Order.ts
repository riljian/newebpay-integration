export enum OrderStatus {
  Pending,
  Authorized,
  FailedAuthorization,
}

export default class Order {
  status: OrderStatus = OrderStatus.Pending
}
