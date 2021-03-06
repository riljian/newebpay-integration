import axios from 'axios'
import { getUnixTime } from 'date-fns'
import { getFirestore } from 'firebase-admin/firestore'
import { NextApiHandler } from 'next'
import qs from 'qs'
import {
  encryptByAES,
  extractResultAndVerifyCheckCode,
  getCheckValue,
  hashEncryptedTradeInfoBySHA256,
  initializeDefaultApp,
} from '../../../../../interal/helpers'
import { OrderStatus } from '../../../../../models/Order'

initializeDefaultApp()
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
    const encryptedTradeInfo = encryptByAES(tradeInfoRaw)
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
      const records: any[] = []
      const recordDocs = await db
        .collection('newebpay-integration-records')
        .where('Result.MerchantOrderNo', '==', oid)
        .get()
      recordDocs.forEach((doc) => {
        records.push(doc.data())
      })
      const responsePayload = {
        status,
        createData,
        records,
        detail: null,
      }
      if (status !== OrderStatus.FailedAuthorization) {
        const { data } = await axios.post(
          process.env.TRADE_INFO_ENDPOINT!,
          qs.stringify({
            MerchantID: merchantId,
            Version: '1.3',
            RespondType: 'JSON',
            TimeStamp: String(getUnixTime(new Date())),
            MerchantOrderNo: oid,
            Amt: createData.Amt,
            CheckValue: getCheckValue(
              createData.Amt,
              merchantId,
              oid as string
            ),
          })
        )
        responsePayload.detail = extractResultAndVerifyCheckCode(data)
      }
      res.status(200).json(responsePayload)
      return
    } catch (e) {
      res.status(500).end()
      console.error(e)
      return
    }
  }
  res.status(405).end()
}

export default handler
