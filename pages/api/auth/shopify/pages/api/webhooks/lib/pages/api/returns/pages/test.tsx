import { useState } from 'react'

export default function TestPage() {
  const [features, setFeatures] = useState(JSON.stringify({
    order_value: 149.99,
    return_reason: "changed_mind",
    customer_lifetime_orders: 3,
    item_condition: "unworn",
    days_since_purchase: 7,
    return_count_last_90_days: 2
  }, null, 2))
  
  const [preset, setPreset] = useState('balanced')
  const [result, setResult] = useState<any>(null)
  const [loading, setLoading] = useState(false)

  const runTest = async () => {
    setLoading(true)
    setResult(null)
    
    try {
      const response = await fetch('/api/returns/score', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          features: JSON.parse(features),
          preset
        })
      })

      if (!response.ok) {
        throw new Error(`Server returned ${response.status}`)
      }

      const data = await response.json()
      setResult(data)
    } catch (error) {
      setResult({ 
        error: error.message || 'Failed to calculate score',
        details: error.stack || ''
      })
    } finally {
      setLoading(false)
    }
  }

  return (
    <div style={{ maxWidth: '800px', margin: '0 auto', padding: '20px' }}>
      <h1>RefundSafe Risk Score Tester</h1>
      
      <div style={{ marginBottom: '20px' }}>
        <label>Features JSON:</label>
        <textarea 
          value={features} 
          onChange={(e) => setFeatures(e.target.value)}
          rows={12}
          style={{ 
            width: '100%', 
            fontFamily: 'monospace', 
            padding: '10px',
            borderRadius: '4px',
            border: '1px solid #ddd'
          }}
        />
      </div>
      
      <div style={{ marginBottom: '20px' }}>
        <label>Risk Preset: </label>
        <select 
          value={preset} 
          onChange={(e) => setPreset(e.target.value)}
          disabled={loading}
          style={{ padding: '8px', borderRadius: '4px' }}
        >
          <option value="balanced">Balanced</option>
          <option value="strict">Strict</option>
          <option value="lenient">Lenient</option>
        </select>
      </div>
      
      <button 
        onClick={runTest} 
        disabled={loading}
        style={{ 
          padding: '10px 20px', 
          background: loading ? '#ccc' : '#2563EB', 
          color: 'white', 
          border: 'none', 
          borderRadius: '4px', 
          cursor: 'pointer',
          fontSize: '16px'
        }}
      >
        {loading ? 'Calculating...' : 'Calculate Risk Score'}
      </button>
      
      {result && (
        <div style={{ 
          marginTop: '30px', 
          padding: '20px', 
          background: '#f8fafc', 
          borderRadius: '8px',
          border: '1px solid #e2e8f0'
        }}>
          <h2 style={{ marginTop: 0 }}>Results:</h2>
          <pre style={{ 
            background: '#1e293b', 
            color: 'white', 
            padding: '15px', 
            borderRadius: '6px',
            overflowX: 'auto'
          }}>
            {JSON.stringify(result, null, 2)}
          </pre>
        </div>
      )}
      
      <div style={{ marginTop: '30px', fontSize: '14px', color: '#64748b' }}>
        <p>Sample features you can test:</p>
        <ul>
          <li><strong>High risk</strong>: order_value: 499.99, return_reason: "defective", item_condition: "damaged"</li>
          <li><strong>Low risk</strong>: order_value: 49.99, return_reason: "wrong_size", customer_lifetime_orders: 12</li>
        </ul>
      </div>
    </div>
  )
}
