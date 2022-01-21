import { applicationDefault, getApp, initializeApp } from 'firebase-admin/app'
import { getFirestore } from 'firebase-admin/firestore'
import { NextApiHandler } from 'next'
import {
  decryptTradeInfo,
  hashEncryptedTradeInfoBySHA256,
} from '../../../../interal/helpers'
import { OrderStatus } from '../../../../models/Order'

try {
  getApp()
} catch (e) {
  initializeApp({
    credential: applicationDefault(),
  })
}
const db = getFirestore()

const handler: NextApiHandler = async (req, res) => {
  const { TradeInfo, TradeSha } = req.body

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

  await db.collection('newebpay-integration/records').add(tradeInfo)
  const {
    Status,
    Result: { MerchantOrderNo },
  } = tradeInfo

  if (Status === 'SUCCESS') {
    await db.doc(`/newebpay-integration/orders/${MerchantOrderNo}`).update({
      status: OrderStatus.Authorized,
    })
  } else {
    await db.doc(`/newebpay-integration/orders/${MerchantOrderNo}`).update({
      status: OrderStatus.FailedAuthorization,
    })
  }

  res.status(200).end()
  console.error('Failed authorization', Status)
}

export default handler
