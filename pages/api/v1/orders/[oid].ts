import { getUnixTime } from 'date-fns'
import { applicationDefault, getApp, initializeApp } from 'firebase-admin/app'
import { getFirestore } from 'firebase-admin/firestore'
import { NextApiHandler } from 'next'
import qs from 'qs'
import {
  encryptTradeInfoByAES,
  hashEncryptedTradeInfoBySHA256,
} from '../../../../interal/helpers'

try {
  getApp()
} catch (e) {
  initializeApp({
    credential: applicationDefault(),
  })
}
const db = getFirestore()

const handler: NextApiHandler = async (req, res) => {
  if (req.method === 'POST') {
    const doc = await db
      .doc(`newebpay-integration-orders/${req.query.oid}`)
      .get()
    const tradeInfoRaw = qs.stringify({
      ...(doc.data() as any).customizedData,
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
  }
  res.status(400).end()
}

export default handler
