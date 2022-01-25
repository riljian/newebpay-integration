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
      Result: {
        MerchantOrderNo,
        PaymentType,
        Card6No,
        Card4No,
        Exp,
        TokenValue,
      },
    } = tradeInfo

    const doc = db.doc(`newebpay-integration-orders/${MerchantOrderNo}`)
    if (Status === 'SUCCESS') {
      await doc.update({
        status: OrderStatus.Authorized,
        paymentType: PaymentType,
      })
      if (TokenValue) {
        const {
          customizedData: { TokenTerm },
        } = (await doc.get()).data() as any
        await db.doc(`newebpay-integration-users/${TokenTerm}`).set({
          token: TokenValue,
          cardNo: `${Card6No}******${Card4No}`,
          exp: Exp,
        })
      }
    } else {
      await doc.update({ status: OrderStatus.FailedAuthorization })
      console.error('Failed authorization', Status)
    }

    res.status(200).end()
    return
  }
  res.status(405).end()
}

export default handler
