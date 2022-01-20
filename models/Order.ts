export enum OrderStatus {
  Pending,
}

export default class Order {
  status: OrderStatus = OrderStatus.Pending
}
