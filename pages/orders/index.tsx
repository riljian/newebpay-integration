import {
  Button,
  Stack,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
} from '@mui/material'
import axios from 'axios'
import { GetServerSideProps, NextPage } from 'next'
import { useCallback, useEffect, useState } from 'react'
import CloseOrder from '../../components/CloseOrder'
import Link from '../../components/Link'
import Loading from '../../components/Loading'
import { ORDERS_MANAGE_PATH } from '../../configs/path'
import { formPost } from '../../helpers'
import Order, { OrderPaymentType, OrderStatus } from '../../models/Order'

interface Column<T> {
  label: string
  key?: keyof T
  formatter?: (value: any, context: T, others: any) => any
}
const columns: Column<Order>[] = [
  {
    label: '訂單編號',
    key: 'id',
    formatter: (value) => (
      <Link href={`${ORDERS_MANAGE_PATH}/${value}`}>{value}</Link>
    ),
  },
  {
    label: '狀態',
    key: 'status',
    formatter: (value: OrderStatus) => {
      switch (value) {
        case OrderStatus.Pending:
          return '未授權'
        case OrderStatus.Authorized:
          return '已付款'
        case OrderStatus.FailedAuthorization:
          return '授權失敗'
        case OrderStatus.CancelledAuthorization:
          return '取消授權'
      }
      return '例外狀態'
    },
  },
  {
    label: '支付方式',
    key: 'paymentType',
    formatter: (value: OrderPaymentType) => {
      switch (value) {
        case OrderPaymentType.Credit:
          return '信用卡'
        case OrderPaymentType.Vacc:
          return '轉帳'
        case undefined:
          return '-'
      }
      return '例外支付方式'
    },
  },
  {
    label: '金額',
    formatter: (value: Order) => value.customizedData.Amt,
  },
  {
    label: '動作',
    key: 'status',
    formatter: (value: OrderStatus, context, others) => {
      const { mpgGateway, reloadOrders } = others
      return (
        <Stack>
          {value === OrderStatus.Pending && (
            <Button
              variant="contained"
              onClick={() => {
                axios
                  .post(`/api/v1/orders/${context.id}`)
                  .then(({ data }) => {
                    const { tradeInfoRaw, ...payload } = data
                    formPost(mpgGateway, payload)
                  })
                  .catch((error) => {
                    console.error(error)
                  })
              }}
            >
              重新支付流程
            </Button>
          )}
          {value === OrderStatus.Authorized &&
            context.paymentType === 'CREDIT' && (
              <>
                <Button
                  variant="contained"
                  color="secondary"
                  onClick={() => {
                    axios
                      .post(`/api/v1/orders/${context.id}/unauthorize`)
                      .then(reloadOrders)
                      .catch((error) => {
                        console.error(error)
                      })
                  }}
                >
                  取消授權
                </Button>
                <CloseOrder orderId={context.id} onSuccess={reloadOrders} />
              </>
            )}
        </Stack>
      )
    },
  },
]

const Orders: NextPage<{ mpgGateway: string }> = ({ mpgGateway }) => {
  const [{ orders }, setState] = useState<{ orders: Order[] }>(() => ({
    orders: [],
  }))
  const reloadOrders = useCallback(() => {
    axios
      .get('/api/v1/orders')
      .then(({ data }) => {
        setState((s) => ({ ...s, orders: data }))
      })
      .catch((error) => {
        console.error(error)
      })
  }, [])
  const pack = { mpgGateway, reloadOrders }

  useEffect(() => {
    reloadOrders()
  }, [reloadOrders])

  if (orders.length === 0) {
    return <Loading />
  }

  return (
    <TableContainer>
      <Table>
        <TableHead>
          <TableRow>
            {columns.map(({ label }) => (
              <TableCell key={label}>{label}</TableCell>
            ))}
          </TableRow>
        </TableHead>
        <TableBody>
          {orders.map((order) => (
            <TableRow key={order.id}>
              {columns.map(({ key, label, formatter }) => (
                <TableCell key={label}>
                  {formatter
                    ? formatter(key ? order[key] : order, order, pack)
                    : order[key!]}
                </TableCell>
              ))}
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </TableContainer>
  )
}

export const getServerSideProps: GetServerSideProps = async (_) => {
  return {
    props: {
      title: 'Orders',
      mpgGateway: process.env.MPG_GATEWAY,
    },
  }
}

export default Orders
