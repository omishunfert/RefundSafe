import type { NextApiRequest, NextApiResponse } from 'next'
import crypto from 'crypto'

const scopes = ['read_orders','read_customers','read_fulfillments','read_products']
const redirectUri = `${process.env.APP_URL}/api/auth/shopify/callback`

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  const rawShop = req.query.shop as string
  const shop = rawShop?.replace(/https?:\/\//, '')
  if (!shop || !shop.endsWith('.myshopify.com')) return res.status(400).send('Invalid shop')
  
  const state = crypto.randomBytes(16).toString('hex')
  const installUrl = 
    `https://${shop}/admin/oauth/authorize?client_id=${process.env.SHOPIFY_API_KEY}` +
    `&scope=${encodeURIComponent(scopes.join(','))}` +
    `&redirect_uri=${encodeURIComponent(redirectUri)}` +
    `&state=${state}`

  res.setHeader('Set-Cookie', `shopify_state=${state}; HttpOnly; Secure; SameSite=Lax; Path=/; Max-Age=600`)
  return res.redirect(installUrl)
}
