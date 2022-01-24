import axios from 'axios'
import { getUnixTime } from 'date-fns'
import { getFirestore } from 'firebase-admin/firestore'
import { NextApiHandler } from 'next'
import qs from 'qs'
import {
  encryptByAES,
  extractResultAndVerifyCheckCode,
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
    const doc = db.doc(`newebpay-integration-orders/${oid}`)
    const { customizedData: createData } = (await doc.get()).data()!
    const { data } = await axios.post(
      process.env.CANCEL_AUTHORIZATION_ENDPOINT!,
      qs.stringify({
        MerchantID_: merchantId,
        PostData_: encryptByAES(
          qs.stringify({
            RespondType: 'JSON',
            Version: '1.0',
            Amt: createData.Amt,
            MerchantOrderNo: oid,
            IndexType: 1,
            TimeStamp: String(getUnixTime(new Date())),
          })
        ),
      })
    )
    try {
      const { Status, Message } = data
      const Result = extractResultAndVerifyCheckCode(data)
      await db
        .collection('newebpay-integration-records')
        .add({ Status, Message, Result })
      await doc.update({ status: OrderStatus.CancelledAuthorization })
      res.status(201).end()
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
