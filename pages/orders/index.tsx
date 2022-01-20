import axios from 'axios'
import { GetStaticProps, NextPage } from 'next'
import { useEffect, useState } from 'react'

const Orders: NextPage = () => {
  const [{ orders }, setState] = useState(() => ({ orders: [] }))

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

  return <pre>{JSON.stringify(orders, null, 2)}</pre>
}

export const getStaticProps: GetStaticProps = async (_) => {
  return {
    props: {
      title: 'Orders',
    },
  }
}

export default Orders
