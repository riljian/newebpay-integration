import axios from 'axios'
import { getUnixTime } from 'date-fns'
import { applicationDefault, getApp, initializeApp } from 'firebase-admin/app'
import { getFirestore } from 'firebase-admin/firestore'
import { NextApiHandler } from 'next'
import qs from 'qs'
import {
  encryptTradeInfoByAES,
  extractTradeInfoResponse,
  getCheckValue,
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
  const merchantId = process.env.MERCHANT_ID as string
  const {
    method,
    query: { oid },
  } = req
  if (method === 'POST') {
    const doc = await db.doc(`newebpay-integration-orders/${oid}`).get()
    const tradeInfoRaw = qs.stringify({
      ...(doc.data() as any).customizedData,
      MerchantID: merchantId,
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
      MerchantID: merchantId,
      TradeInfo: encryptedTradeInfo,
      TradeSha: hashEncryptedTradeInfoBySHA256(encryptedTradeInfo),
      Version: '2.0',
      EncryptType: 0,
    })
    return
  } else if (method === 'GET') {
    try {
      const { customizedData: createData, status } = (
        await db.doc(`newebpay-integration-orders/${oid}`).get()
      ).data()!
      const { data } = await axios.post(
        process.env.TRADE_INFO_ENDPOINT!,
        qs.stringify({
          MerchantID: merchantId,
          Version: '1.3',
          RespondType: 'JSON',
          TimeStamp: String(getUnixTime(new Date())),
          MerchantOrderNo: oid,
          Amt: createData.Amt,
          CheckValue: getCheckValue(createData.Amt, merchantId, oid as string),
        })
      )
      const records: any[] = []
      const recordDocs = await db
        .collection('newebpay-integration-records')
        .where('Result.MerchantOrderNo', '==', oid)
        .get()
      recordDocs.forEach((doc) => {
        records.push(doc.data())
      })
      res.status(200).json({
        status,
        createData,
        records,
        detail: extractTradeInfoResponse(data),
      })
      return
    } catch (e) {
      res.status(500).end()
      return
    }
  }
  res.status(400).end()
}

export default handler
