import type { NextApiRequest, NextApiResponse } from 'next'
import crypto from 'crypto'

export const config = { api: { bodyParser: false } }

function verifyWebhook(buf: Buffer, hmacHeader?: string) {
  if (!hmacHeader) return false
  const digest = crypto
    .createHmac('sha256', process.env.SHOPIFY_API_SECRET!)
    .update(buf)
    .digest('base64')
  const a = Buffer.from(hmacHeader, 'base64')
  const b = Buffer.from(digest, 'base64')
  if (a.length !== b.length) return false
  return crypto.timingSafeEqual(a, b)
}

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  let chunks: Uint8Array[] = []
  await new Promise<void>((resolve) => {
    req.on('data', (c) => chunks.push(typeof c === 'string' ? Buffer.from(c) : c))
    req.on('end', () => resolve())
  })
  const buf = Buffer.concat(chunks)
  const ok = verifyWebhook(buf, req.headers['x-shopify-hmac-sha256'] as string | undefined)
  if (!ok) return res.status(401).send('Invalid webhook')

  const topic = req.headers['x-shopify-topic'] as string
  const shop = req.headers['x-shopify-shop-domain'] as string
  const body = JSON.parse(buf.toString('utf8'))

  // Handle different webhook topics
  if (topic === 'shopify_payments/disputes/create') {
    console.log('New dispute:', body)
    // TODO: Store dispute in database
  } else if (topic === 'orders/fulfilled') {
    console.log('Order fulfilled:', body.order_id)
    // TODO: Update order status
  } else if (topic === 'app/uninstalled') {
    console.log('App uninstalled by:', shop)
    // TODO: Deactivate merchant
  }

  res.status(200).send('ok')
}
