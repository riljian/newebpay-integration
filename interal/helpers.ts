import crypto from 'crypto'
import { GetServerSidePropsContext } from 'next'
import { newebpayEncryptionPair } from './config'

export const hashEncryptedTradeInfoBySHA256 = (value: string) => {
  const { key, iv } = newebpayEncryptionPair
  const input = `HashKey=${key}&${value}&HashIV=${iv}`
  return crypto
    .createHash('sha256')
    .update(input, 'utf8')
    .digest('hex')
    .toUpperCase()
}
export const decryptTradeInfo = (value: string) => {
  const crypto = require('crypto')
  const decipher = crypto.createDecipheriv(
    'aes-256-cbc',
    process.env.HASH_KEY,
    process.env.HASH_IV
  )

  // FIXME: failed to decrypt when Status != 'SUCCESS'
  let decrypted = decipher.update(value, 'hex', 'utf8')
  decrypted += decipher.final('utf8')

  const tradeInfo = JSON.parse(decrypted)
  const {
    Result: { MerchantID },
  } = tradeInfo
  if (MerchantID !== process.env.MERCHANT_ID) {
    throw new Error()
  }
  return tradeInfo
}
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
  const { Status, TradeInfo } = qs.parse(data as string)

  return { status: Status, tradeInfo: decryptTradeInfo(TradeInfo) }
}
