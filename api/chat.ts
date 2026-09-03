export default async function handler(req: any, res: any) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' })
  }

  const message = typeof req.body?.message === 'string' ? req.body.message.trim() : ''
  if (!message) {
    return res.status(400).json({ error: 'Message is required' })
  }

  const apiKey = process.env.AI_GATEWAY_API_KEY
  if (!apiKey) {
    return res.status(503).json({
      text: 'AI core is not connected. Add AI_GATEWAY_API_KEY to the deployed Vercel project and redeploy.',
      code: 'MISSING_AI_GATEWAY_API_KEY',
    })
  }

  try {
    const gatewayResponse = await fetch('https://ai-gateway.vercel.sh/v1/chat/completions', {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${apiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: 'openai/gpt-5.6-sol',
        messages: [
          {
            role: 'system',
            content:
              'You are JARVIS, a concise, capable personal AI assistant. Address the user as sir when natural. Be helpful and honest about your capabilities. Never claim to have performed an action unless a real tool actually performed it.',
          },
          { role: 'user', content: message },
        ],
        temperature: 0.7,
      }),
    })

    const data = await gatewayResponse.json().catch(() => null)

    if (!gatewayResponse.ok) {
      const gatewayError =
        data?.error?.message || data?.error || data?.message || `Gateway returned HTTP ${gatewayResponse.status}`
      console.error('JARVIS Gateway error:', gatewayResponse.status, gatewayError)

      return res.status(502).json({
        text: 'JARVIS AI core could not reach the model service.',
        code: 'AI_GATEWAY_REQUEST_FAILED',
        detail: String(gatewayError).slice(0, 300),
      })
    }

    const text = data?.choices?.[0]?.message?.content
    if (typeof text !== 'string' || !text.trim()) {
      console.error('JARVIS Gateway returned no text:', data)
      return res.status(502).json({
        text: 'JARVIS received an empty response from the model service.',
        code: 'EMPTY_MODEL_RESPONSE',
      })
    }

    return res.status(200).json({ text: text.trim() })
  } catch (error) {
    console.error('JARVIS AI error:', error)
    const detail = error instanceof Error ? error.message : 'Unknown AI service error'

    return res.status(502).json({
      text: 'JARVIS AI core could not reach the model service.',
      code: 'AI_GATEWAY_REQUEST_FAILED',
      detail: detail.slice(0, 300),
    })
  }
}
