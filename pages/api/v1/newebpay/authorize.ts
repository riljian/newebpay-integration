import { getFirestore } from 'firebase-admin/firestore'
import { NextApiHandler } from 'next'
import {
  decryptTradeInfo,
  hashEncryptedTradeInfoBySHA256,
  initializeDefaultApp,
} from '../../../../interal/helpers'
import { OrderStatus } from '../../../../models/Order'

initializeDefaultApp()
const db = getFirestore()

const handler: NextApiHandler = async (req, res) => {
  const { method, body } = req

  if (method === 'POST') {
    const { TradeInfo, TradeSha } = body

    if (hashEncryptedTradeInfoBySHA256(TradeInfo) !== TradeSha) {
      res.status(400).json({
        message: 'Invalid TradeSha',
      })
      console.error('Invalid TradeSha', TradeInfo, TradeSha)
      return
    }

    let tradeInfo = null
    try {
      tradeInfo = decryptTradeInfo(TradeInfo)
    } catch (e) {
      res.status(400).json({
        message: 'Invalid TradeInfo',
      })
      console.error('Invalid TradeInfo', TradeInfo)
      return
    }

    await db.collection('newebpay-integration-records').add(tradeInfo)
    const {
      Status,
      Result: { MerchantOrderNo, PaymentType },
    } = tradeInfo

    if (Status === 'SUCCESS') {
      await db.doc(`newebpay-integration-orders/${MerchantOrderNo}`).update({
        status: OrderStatus.Authorized,
        paymentType: PaymentType,
      })
    } else {
      await db.doc(`newebpay-integration-orders/${MerchantOrderNo}`).update({
        status: OrderStatus.FailedAuthorization,
      })
      console.error('Failed authorization', Status)
    }

    res.status(201).end()
    return
  }
  res.status(405).end()
}

export default handler
