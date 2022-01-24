import crypto from 'crypto'
import { applicationDefault, getApp, initializeApp } from 'firebase-admin/app'
import { GetServerSidePropsContext } from 'next'
import { newebpayEncryptionPair } from './config'

export const encryptTradeInfoByAES = (tradeInfoRaw: string) => {
  const { key, iv } = newebpayEncryptionPair
  const cipher = crypto.createCipheriv('aes-256-cbc', key, iv)
  const encrypted = cipher.update(tradeInfoRaw, 'utf8', 'hex')
  return encrypted + cipher.final('hex')
}
export const hashEncryptedTradeInfoBySHA256 = (value: string) => {
  const { key, iv } = newebpayEncryptionPair
  const input = `HashKey=${key}&${value}&HashIV=${iv}`
  return crypto
    .createHash('sha256')
    .update(input, 'utf8')
    .digest('hex')
    .toUpperCase()
}
export const getCheckValue = (
  amount: string,
  merchantId: string,
  orderId: string
) => {
  const { key, iv } = newebpayEncryptionPair
  const input = `IV=${iv}&Amt=${amount}&MerchantID=${merchantId}&MerchantOrderNo=${orderId}&Key=${key}`
  return crypto
    .createHash('sha256')
    .update(input, 'utf8')
    .digest('hex')
    .toUpperCase()
}
export const extractTradeInfoResponse = (data: any): any => {
  const { Status, Result } = data

  if (Status !== 'SUCCESS') {
    throw new Error(Status)
  }

  const { Amt, MerchantID, MerchantOrderNo, TradeNo, CheckCode } = Result
  const { key, iv } = newebpayEncryptionPair
  const input = `HashIV=${iv}&Amt=${Amt}&MerchantID=${MerchantID}&MerchantOrderNo=${MerchantOrderNo}&TradeNo=${TradeNo}&HashKey=${key}`
  const expected = crypto
    .createHash('sha256')
    .update(input, 'utf8')
    .digest('hex')
    .toUpperCase()

  if (expected !== CheckCode) {
    throw new Error('Invalid response payload')
  }

  return Result
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
export const initializeDefaultApp = () => {
  try {
    getApp()
  } catch (e) {
    initializeApp({
      credential: applicationDefault(),
    })
  }
}
