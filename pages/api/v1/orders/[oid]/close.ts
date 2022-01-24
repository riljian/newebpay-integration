import axios from 'axios'
import { getUnixTime } from 'date-fns'
import { getFirestore } from 'firebase-admin/firestore'
import { NextApiHandler } from 'next'
import qs from 'qs'
import {
  encryptByAES,
  initializeDefaultApp,
} from '../../../../../interal/helpers'

initializeDefaultApp()
const db = getFirestore()

const handler: NextApiHandler = async (req, res) => {
  const merchantId = process.env.MERCHANT_ID as string
  const {
    method,
    body,
    query: { oid },
  } = req

  if (method === 'POST') {
    const { closeType, amount } = body
    const { data } = await axios.post(
      process.env.CLOSE_TRANSACTION_ENDPOINT!,
      qs.stringify({
        MerchantID_: merchantId,
        PostData_: encryptByAES(
          qs.stringify({
            RespondType: 'JSON',
            Version: '1.1',
            Amt: amount,
            MerchantOrderNo: oid,
            TimeStamp: String(getUnixTime(new Date())),
            IndexType: 1,
            CloseType: closeType,
          })
        ),
      })
    )
    await db.collection('newebpay-integration-records').add(data)
    if (data.Status === 'SUCCESS') {
      res.status(201).end()
    } else {
      res.status(500).json({
        error: {
          message: data.Message,
          detail: data,
        },
      })
    }
    return
  }

  res.status(405).end()
}

export default handler
