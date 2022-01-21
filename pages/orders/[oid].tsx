import { Box } from '@mui/material'
import axios from 'axios'
import { GetServerSideProps, NextPage } from 'next'
import { useRouter } from 'next/router'
import { useEffect, useState } from 'react'

const OrderResult: NextPage = () => {
  const {
    query: { oid },
  } = useRouter()
  const [{ order }, setState] = useState(() => ({ order: null }))

  useEffect(() => {
    axios
      .get(`/api/v1/orders/${oid}`)
      .then(({ data }) => {
        setState((s) => ({ ...s, order: data }))
      })
      .catch((error) => {
        console.error(error)
      })
  }, [oid])

  if (order === null) {
    return null
  }

  return (
    <Box
      component="pre"
      sx={{ whiteSpace: 'normal', overflowWrap: 'break-word' }}
    >
      {JSON.stringify(order, null, 2)}
    </Box>
  )
}

export const getServerSideProps: GetServerSideProps = async () => {
  return {
    props: {
      title: 'Order detail',
    },
  }
}

export default OrderResult
