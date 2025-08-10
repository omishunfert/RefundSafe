import type { NextApiRequest, NextApiResponse } from 'next'
import presets from '../../../lib/riskPresets.json'
import { scoreReturn } from '../../../lib/score'

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' })
  }

  const { features, preset = 'balanced' } = req.body

  if (!features) {
    return res.status(400).json({ error: 'Missing features in request body' })
  }

  try {
    // Get the preset configuration
    const presetConfig = (presets as any)[preset] || (presets as any).balanced
    
    // Calculate the score
    const result = scoreReturn(features, presetConfig)
    
    return res.status(200).json(result)
  } catch (error) {
    console.error('Error scoring return:', error)
    return res.status(500).json({ error: 'Internal server error' })
  }
}
