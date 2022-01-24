import { getUnixTime } from 'date-fns'
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
    const encryptedTradeInfo = encryptByAES(tradeInfoRaw)
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
    const ordersRef = await db.collection('newebpay-integration-orders').get()
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
