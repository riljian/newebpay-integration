import { Box } from '@mui/material'
import { GetServerSideProps, NextPage } from 'next'

const OrderResult: NextPage<{ title: string }> = ({ title, ...restProps }) => (
  <Box component="pre">{JSON.stringify(restProps, null, 2)}</Box>
)

export const getServerSideProps: GetServerSideProps = async (ctx) => {
  const { extractStatusAndTradeInfo } = await import('../../interal/helpers')
  const { status, tradeInfo } = await extractStatusAndTradeInfo(ctx.req)
  return {
    props: {
      status,
      tradeInfo,
      title: 'Order result',
    },
  }
}

export default OrderResult
