import type { NextApiRequest, NextApiResponse } from 'next'
import crypto from 'crypto'
import { upsertMerchant } from '../../../lib/merchants'

function safeTimingEqual(a: Buffer, b: Buffer) {
  if (a.length !== b.length) return false
  return crypto.timingSafeEqual(a, b)
}

function verifyOauthHmac(query: any) {
  const { hmac, signature, ...rest } = query
  if (!hmac) return false
  const message = Object.keys(rest)
    .sort()
    .map(k => `${k}=${Array.isArray(rest[k]) ? rest[k].join(',') : rest[k]}`)
    .join('&')
  const digestHex = crypto.createHmac('sha256', process.env.SHOPIFY_API_SECRET!).update(message).digest('hex')
  return safeTimingEqual(Buffer.from(hmac as string, 'hex'), Buffer.from(digestHex, 'hex'))
}

async function exchangeToken(shop: string, code: string) {
  const res = await fetch(`https://${shop}/admin/oauth/access_token`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      client_id: process.env.SHOPIFY_API_KEY,
      client_secret: process.env.SHOPIFY_API_SECRET,
      code
    })
  })
  if (!res.ok) throw new Error(`Token exchange failed: ${res.status}`)
  const json: any = await res.json()
  return json.access_token as string
}

async function registerWebhooks(shop: string, token: string) {
  const topics = [
    'shopify_payments/disputes/create',
    'shopify_payments/disputes/update',
    'orders/fulfilled',
    'app/uninstalled'
  ]
  for (const topic of topics) {
    await fetch(`https://${shop}/admin/api/2024-07/webhooks.json`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'X-Shopify-Access-Token': token
      },
      body: JSON.stringify({
        webhook: {
          topic,
          address: `${process.env.APP_URL}/api/webhooks/shopify`,
          format: 'json'
        }
      })
    }).catch(() => {}) // ignore duplicates
  }
}

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  const { shop, code, state } = req.query as { shop?: string; code?: string; state?: string }
  const savedState = req.cookies['shopify_state']
  if (!shop || !code || !state || state !== savedState) return res.status(400).send('Bad state')
  if (!verifyOauthHmac(req.query)) return res.status(400).send('Bad HMAC')

  const accessToken = await exchangeToken(shop, code)
  await upsertMerchant(shop, accessToken)
  await registerWebhooks(shop, accessToken)

  return res.redirect(`/onboard?shop=${encodeURIComponent(shop)}`)
}
