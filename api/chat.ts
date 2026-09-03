import { generateText } from 'ai'

export default async function handler(req: any, res: any) {
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' })

  const message = typeof req.body?.message === 'string' ? req.body.message.trim() : ''
  if (!message) return res.status(400).json({ error: 'Message is required' })
  if (!process.env.AI_GATEWAY_API_KEY) return res.status(503).json({ text: 'My AI core is not configured yet. Add AI_GATEWAY_API_KEY in Vercel to activate me.' })

  try {
    const result = await generateText({
      model: 'openai/gpt-5.5-fast',
      system: 'You are JARVIS, a concise, capable personal AI assistant. Address the user as sir when natural. Be helpful and honest about your capabilities. Never claim to have performed an action unless a real tool actually performed it.',
      prompt: message,
    })
    return res.status(200).json({ text: result.text })
  } catch (error) {
    console.error('JARVIS AI error', error)
    return res.status(500).json({ text: 'I encountered an AI service error. Please try again.' })
  }
}
