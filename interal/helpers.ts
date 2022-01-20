import { GetServerSidePropsContext } from 'next'

export const extractStatusAndTradeInfo = async (
  request: GetServerSidePropsContext['req']
): Promise<{ status: string; tradeInfo: any }> => {
  const data = await new Promise((resolve) => {
    let body = ''
    request.on('data', (chunk) => {
      body += chunk
    })
    request.on('end', () => {
      resolve(body)
    })
  })

  const qs = require('qs')
  const crypto = require('crypto')
  const { Status, TradeInfo } = qs.parse(data as string)
  const decipher = crypto.createDecipheriv(
    'aes-256-cbc',
    process.env.HASH_KEY,
    process.env.HASH_IV
  )

  // FIXME: failed to decrypt when Status != 'SUCCESS'
  let decrypted = decipher.update(TradeInfo, 'hex', 'utf8')
  decrypted += decipher.final('utf8')

  return { status: Status, tradeInfo: JSON.parse(decrypted) }
}
