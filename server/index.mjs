import express from 'express'
import dotenv from 'dotenv'
import Anthropic from '@anthropic-ai/sdk'

dotenv.config()

const app = express()
app.use(express.json())

const anthropicApiKey = process.env.ANTHROPIC_API_KEY

let anthropicClient
if (anthropicApiKey) {
  anthropicClient = new Anthropic({
    apiKey: anthropicApiKey,
  })
}

app.post('/api/footballgpt', async (req, res) => {
  const { question } = req.body || {}
  if (!question || typeof question !== 'string') {
    return res.status(400).json({ error: 'Missing question' })
  }

  if (!anthropicClient) {
    return res.status(200).json({
      answer:
        'FootballGPT (mock backend): Wire ANTHROPIC_API_KEY on the server to get live, expert analysis here. For now, treat this as a stub response.',
    })
  }

  try {
    const completion = await anthropicClient.messages.create({
      model: 'claude-sonnet-4-20250514',
      max_tokens: 300,
      temperature: 0.5,
      system:
        'You are FootballGPT, an elite football analyst. You are knowledgeable, passionate, and concise. Always answer as if speaking on a premium global football broadcast. Focus on tactics, context, and history, but keep answers tight and readable.',
      messages: [
        {
          role: 'user',
          content: `User question: ${question}`,
        },
      ],
    })

    const text =
      completion?.content?.[0]?.type === 'text'
        ? completion.content[0].text
        : 'FootballGPT: I could not generate a detailed answer just now.'

    res.json({ answer: text })
  } catch {
    res.status(500).json({ error: 'FootballGPT upstream error' })
  }
})

app.post('/api/scout-report', async (req, res) => {
  const { player } = req.body || {}
  if (!player || typeof player.name !== 'string') {
    return res.status(400).json({ error: 'Missing player payload' })
  }

  if (!anthropicClient) {
    return res.status(200).json({
      report:
        'Scout Report (mock backend): connect ANTHROPIC_API_KEY to generate a rich, three-sentence AI scouting report for this player.',
    })
  }

  try {
    const completion = await anthropicClient.messages.create({
      model: 'claude-sonnet-4-20250514',
      max_tokens: 260,
      temperature: 0.6,
      system:
        'You are FootballGPT, an elite football scout. For any player, return exactly three sentences: 1) profile & key physical/technical traits, 2) tactical fit and strengths, 3) weaknesses and projection. No bullet points, no headings.',
      messages: [
        {
          role: 'user',
          content: `Create a 3-sentence scouting report for ${player.name}. Context:\n${JSON.stringify(
            player,
          )}`,
        },
      ],
    })

    const text =
      completion?.content?.[0]?.type === 'text'
        ? completion.content[0].text
        : 'Solid modern profile with strong tools, but the AI backend could not provide more detail just now.'

    res.json({ report: text })
  } catch {
    res.status(500).json({ error: 'Scout report upstream error' })
  }
})

const port = process.env.PORT || 5174

app.listen(port)

