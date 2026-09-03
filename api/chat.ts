import { generateText } from 'ai'

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
      text: 'AI core is not connected. Please add AI_GATEWAY_API_KEY to this Vercel project and redeploy.',
      code: 'MISSING_AI_GATEWAY_API_KEY',
    })
  }

  try {
    const result = await generateText({
      model: 'openai/gpt-5.5-fast',
      system:
        'You are JARVIS, a concise, capable personal AI assistant. Address the user as sir when natural. Be helpful and honest about your capabilities. Never claim to have performed an action unless a real tool actually performed it.',
      prompt: message,
    })

    return res.status(200).json({ text: result.text })
  } catch (error) {
    console.error('JARVIS AI error:', error)
    const message = error instanceof Error ? error.message : 'Unknown AI service error'

    return res.status(502).json({
      text: 'JARVIS AI core could not reach the model service.',
      code: 'AI_GATEWAY_REQUEST_FAILED',
      detail: message.slice(0, 300),
    })
  }
}
