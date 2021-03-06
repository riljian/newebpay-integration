import { getUnixTime } from 'date-fns'
import admin from 'firebase-admin'
import { getFirestore } from 'firebase-admin/firestore'
import { NextApiHandler } from 'next'
import qs from 'qs'
import {
  encryptByAES,
  hashEncryptedTradeInfoBySHA256,
  initializeDefaultApp,
} from '../../../../interal/helpers'
import { OrderStatus } from '../../../../models/Order'

initializeDefaultApp()
const db = getFirestore()

const handler: NextApiHandler = async (req, res) => {
  if (req.method === 'POST') {
    const data = req.body
    const doc = await db.collection('newebpay-integration-orders').add({
      status: OrderStatus.Pending,
      customizedData: data,
      createdAt: admin.firestore.FieldValue.serverTimestamp(),
    })
    const { Version } = data
    const tradeInfoRaw = qs.stringify({
      MerchantID: process.env.MERCHANT_ID,
      RespondType: 'JSON',
      TimeStamp: String(getUnixTime(new Date())),
      MerchantOrderNo: doc.id,
      NotifyURL: process.env.NOTIFY_URL,
      LoginType: 0,
      ...data,
    })
    const encryptedTradeInfo = encryptByAES(tradeInfoRaw)
    res.status(200).json({
      tradeInfoRaw,
      Version,
      MerchantID: process.env.MERCHANT_ID,
      TradeInfo: encryptedTradeInfo,
      TradeSha: hashEncryptedTradeInfoBySHA256(encryptedTradeInfo),
    })
  } else if (req.method === 'GET') {
    const orders: any[] = []
    const ordersRef = await db
      .collection('newebpay-integration-orders')
      .where('createdAt', '!=', null)
      .orderBy('createdAt', 'desc')
      .get()
    ordersRef.forEach((doc) => {
      orders.push({
        id: doc.id,
        ...doc.data(),
      })
    })
    res.status(200).json(orders)
  }
  res.status(405).end()
}

export default handler
