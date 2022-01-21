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
import { useEffect, useState } from 'react'
import { formPost } from '../../helpers'
import Order, { OrderPaymentType, OrderStatus } from '../../models/Order'

interface Column<T> {
  label: string
  key: keyof T
  formatter?: (value: any, context: T, others: any) => any
}
const columns: Column<Order>[] = [
  {
    label: '訂單編號',
    key: 'id',
  },
  {
    label: '狀態',
    key: 'status',
    formatter: (value: OrderStatus) => {
      switch (value) {
        case OrderStatus.Pending:
          return '未授權'
        case OrderStatus.Authorized:
          return '未請款'
        case OrderStatus.FailedAuthorization:
          return '授權失敗'
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
    label: '動作',
    key: 'status',
    formatter: (value: OrderStatus, context, others) => {
      const { mpgGateway } = others
      if (value === OrderStatus.Pending) {
        return (
          <Stack>
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
          </Stack>
        )
      }
      return null
    },
  },
]

const Orders: NextPage<{ mpgGateway: string }> = ({ mpgGateway }) => {
  const [{ orders }, setState] = useState<{ orders: Order[] }>(() => ({
    orders: [],
  }))
  const pack = { mpgGateway }

  useEffect(() => {
    axios
      .get('/api/v1/orders')
      .then(({ data }) => {
        setState((s) => ({ ...s, orders: data }))
      })
      .catch((error) => {
        console.error(error)
      })
  }, [])

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
                  {formatter ? formatter(order[key], order, pack) : order[key]}
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
