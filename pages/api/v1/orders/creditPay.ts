import axios from 'axios'
import { getUnixTime } from 'date-fns'
import { getFirestore } from 'firebase-admin/firestore'
import { NextApiHandler } from 'next'
import qs from 'qs'
import { newebpayEncryptionPair } from '../../../../interal/config'
import {
  encryptByAES,
  hashBySHA256,
  initializeDefaultApp,
} from '../../../../interal/helpers'
import { OrderStatus } from '../../../../models/Order'

initializeDefaultApp()
const db = getFirestore()

const verifyCreditPayResponse = (response: any) => {
  const { Status, Result } = response

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
}

const handler: NextApiHandler = async (req, res) => {
  const merchantId = process.env.MERCHANT_ID as string
  const { method, body: data } = req
  if (method === 'POST') {
    const orderDoc = await db.collection('newebpay-integration-orders').add({
      status: OrderStatus.Pending,
      customizedData: data,
    })
    const { PayerEmail } = data
    const userDoc = await db
      .doc(`newebpay-integration-users/${PayerEmail}`)
      .get()
    if (!userDoc.exists) {
      res.status(404).json({
        error: {
          message: 'User not found',
        },
      })
      return
    }
    const { token } = userDoc.data()!
    const raw = {
      TimeStamp: String(getUnixTime(new Date())),
      Version: '1.6',
      MerchantOrderNo: orderDoc.id,
      TokenValue: token,
      TokenTerm: PayerEmail,
      TokenSwitch: 'on',
      ...data,
    }
    const postData = {
      MerchantID_: merchantId,
      Pos_: 'JSON',
      PostData_: encryptByAES(qs.stringify(raw)),
    }
    const { data: responseData } = await axios.post(
      process.env.CREDIT_PAY_ENDPOINT!,
      qs.stringify(postData)
    )
    try {
      verifyCreditPayResponse(responseData)
    } catch (e) {
      res.status(500).json({
        error: {
          message: 'Failed to pay',
          detail: {
            request: {
              raw,
              ...postData,
            },
            response: responseData,
          },
        },
      })
      return
    }
    await orderDoc.update({
      status: OrderStatus.Authorized,
      paymentType: responseData.Result.PaymentMethod,
    })
    await db.collection('newebpay-integration-records').add(responseData)
    res.status(200).json({
      request: {
        raw,
        ...postData,
      },
      response: responseData,
    })
    return
  }
  res.status(405).end()
}

export default handler
