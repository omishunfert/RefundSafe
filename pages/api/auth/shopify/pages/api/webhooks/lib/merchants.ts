import { createClient } from '@supabase/supabase-js'

const supabase = createClient(process.env.SUPABASE_URL!, process.env.SUPABASE_SERVICE_ROLE_KEY!)

// Encrypt access token before storing
function encryptToken(token: string) {
  // In production, use: crypto.createCipheriv('aes-256-cbc', ...)
  // For development, we'll use simple base64 encoding
  return Buffer.from(token).toString('base64')
}

export async function upsertMerchant(shopDomain: string, accessToken: string) {
  try {
    const encryptedToken = encryptToken(accessToken)
    const { data, error } = await supabase
      .from('merchants')
      .upsert({ 
        shop_domain: shopDomain,
        access_token: encryptedToken,
        installed_at: new Date().toISOString()
      })
      .select()

    if (error) throw error
    return data
  } catch (error) {
    console.error('Failed to upsert merchant:', error)
    return null
  }
}

export async function markMerchantUninstalled(shopDomain: string) {
  try {
    const { data, error } = await supabase
      .from('merchants')
      .update({ uninstalled_at: new Date().toISOString() })
      .eq('shop_domain', shopDomain)
      .select()

    if (error) throw error
    return data
  } catch (error) {
    console.error('Failed to mark merchant uninstalled:', error)
    return null
  }
}
