import { getFirestore } from 'firebase-admin/firestore'
import { NextApiHandler } from 'next'
import { initializeDefaultApp } from '../../../../interal/helpers'

initializeDefaultApp()
const db = getFirestore()

const handler: NextApiHandler = async (req, res) => {
  const {
    method,
    query: { email },
  } = req
  if (method === 'GET') {
    const doc = await db.doc(`newebpay-integration-users/${email}`).get()
    if (!doc.exists) {
      res.status(404).end()
      return
    }
    res.status(200).json(doc.data())
    return
  }
  res.status(405).end()
}

export default handler
