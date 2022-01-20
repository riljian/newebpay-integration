import { Box } from '@mui/material'
import { GetServerSideProps, NextPage } from 'next'

const OrderResult: NextPage<{ title: string }> = ({ title, ...restProps }) => {
  return (
    <Box
      component="pre"
      sx={{ whiteSpace: 'normal', overflowWrap: 'break-word' }}
    >
      {JSON.stringify(restProps, null, 2)}
    </Box>
  )
}

export const getServerSideProps: GetServerSideProps = async (ctx) => {
  const qs = require('qs')
  const crypto = require('crypto')
  const data = await new Promise((resolve) => {
    const { req } = ctx
    let body = ''
    req.on('data', (chunk) => {
      body += chunk
    })
    req.on('end', () => {
      resolve(body)
    })
  })
  const { Status, TradeInfo } = qs.parse(data as string)
  const decipher = crypto.createDecipheriv(
    'aes-256-cbc',
    process.env.HASH_KEY,
    process.env.HASH_IV
  )
  // FIXME: failed to decrypt when Status != 'SUCCESS'
  let decrypted = decipher.update(TradeInfo, 'hex', 'utf8')
  decrypted += decipher.final('utf8')
  return {
    props: {
      title: 'Order result',
      status: Status,
      tradeInfo: JSON.parse(decrypted),
    },
  }
}

export default OrderResult
