import * as crypto from 'crypto'
import { getUnixTime } from 'date-fns'
import { applicationDefault, getApp, initializeApp } from 'firebase-admin/app'
import { getFirestore } from 'firebase-admin/firestore'
import { NextApiHandler } from 'next'
import qs from 'qs'
import { newebpayEncryptionPair } from '../../../../interal/config'
import { hashEncryptedTradeInfoBySHA256 } from '../../../../interal/helpers'
import { OrderStatus } from '../../../../models/Order'

try {
  getApp()
} catch (e) {
  initializeApp({
    credential: applicationDefault(),
  })
}
const db = getFirestore()

const encryptTradeInfoByAES = (tradeInfoRaw: string) => {
  const { key, iv } = newebpayEncryptionPair
  const cipher = crypto.createCipheriv('aes-256-cbc', key, iv)
  const encrypted = cipher.update(tradeInfoRaw, 'utf8', 'hex')
  return encrypted + cipher.final('hex')
}

const handler: NextApiHandler = async (req, res) => {
  if (req.method === 'POST') {
    const data = req.body
    const doc = await db.collection('newebpay-integration/orders').add({
      status: OrderStatus.Pending,
      customizedData: data,
    })
    const tradeInfoRaw = qs.stringify({
      ...data,
      MerchantID: process.env.MERCHANT_ID,
      RespondType: 'JSON',
      TimeStamp: String(getUnixTime(new Date())),
      Version: '2.0',
      MerchantOrderNo: doc.id,
      NotifyURL: process.env.NOTIFY_URL,
      LoginType: 0,
    })
    const encryptedTradeInfo = encryptTradeInfoByAES(tradeInfoRaw)
    res.status(200).json({
      tradeInfoRaw,
      MerchantID: process.env.MERCHANT_ID,
      TradeInfo: encryptedTradeInfo,
      TradeSha: hashEncryptedTradeInfoBySHA256(encryptedTradeInfo),
      Version: '2.0',
      EncryptType: 0,
    })
  } else if (req.method === 'GET') {
    const orders: any[] = []
    const ordersRef = await db.collection('orders').get()
    ordersRef.forEach((doc) => {
      orders.push(doc.data())
    })
    res.status(200).json(orders)
  }
  res.status(400).end()
}

export default handler
