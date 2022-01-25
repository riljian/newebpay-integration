import crypto from 'crypto'
import { applicationDefault, getApp, initializeApp } from 'firebase-admin/app'
import { GetServerSidePropsContext } from 'next'
import { newebpayEncryptionPair } from './config'

export const extractBody = (request: GetServerSidePropsContext['req']) =>
  new Promise((resolve) => {
    let body = ''
    request.on('data', (chunk) => {
      body += chunk
    })
    request.on('end', () => {
      resolve(body)
    })
  })
export const hashBySHA256 = (input: string) => {
  return crypto
    .createHash('sha256')
    .update(input, 'utf8')
    .digest('hex')
    .toUpperCase()
}
export const encryptByAES = (input: string) => {
  const { key, iv } = newebpayEncryptionPair
  const cipher = crypto.createCipheriv('aes-256-cbc', key, iv)
  const encrypted = cipher.update(input, 'utf8', 'hex')
  return encrypted + cipher.final('hex')
}
export const decryptByAES = (input: string) => {
  const { key, iv } = newebpayEncryptionPair
  const decipher = crypto.createDecipheriv('aes-256-cbc', key, iv)
  /* FIXME: should use this
  const decrypted = decipher.update(input, 'hex', 'utf8')
  return decrypted + decipher.final('utf8')
   */
  decipher.setAutoPadding(false)
  let decrypted = decipher.update(input, 'hex', 'utf8')
  decrypted += decipher.final('utf8')
  const lastCharCode = decrypted.charCodeAt(decrypted.length - 1)
  const padding = lastCharCode > 31 ? 0 : lastCharCode
  console.log(`input: ${input} with ${padding} padding(s)`)
  return decrypted.slice(0, decrypted.length - padding)
}
export const hashEncryptedTradeInfoBySHA256 = (value: string) => {
  const { key, iv } = newebpayEncryptionPair
  const input = `HashKey=${key}&${value}&HashIV=${iv}`
  return hashBySHA256(input)
}
export const getCheckValue = (
  amount: string,
  merchantId: string,
  orderId: string
) => {
  const { key, iv } = newebpayEncryptionPair
  const input = `IV=${iv}&Amt=${amount}&MerchantID=${merchantId}&MerchantOrderNo=${orderId}&Key=${key}`
  return hashBySHA256(input)
}
export const extractResultAndVerifyCheckCode = (data: any): any => {
  const { Status, Result } = data

  // TODO: this should not be here
  if (Status !== 'SUCCESS') {
    throw new Error(Status)
  }

  const { Amt, MerchantID, MerchantOrderNo, TradeNo, CheckCode } = Result
  const { key, iv } = newebpayEncryptionPair
  const input = `HashIV=${iv}&Amt=${Amt}&MerchantID=${MerchantID}&MerchantOrderNo=${MerchantOrderNo}&TradeNo=${TradeNo}&HashKey=${key}`
  const expected = hashBySHA256(input)

  if (expected !== CheckCode) {
    throw new Error('Invalid response payload')
  }

  return Result
}
export const decryptTradeInfo = (value: string) => {
  // FIXME: failed to decrypt when Status != 'SUCCESS'
  const tradeInfo = JSON.parse(decryptByAES(value))
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
  const body = await extractBody(request)
  const qs = require('qs')
  const { Status, TradeInfo } = qs.parse(body as string)

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
