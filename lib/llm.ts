import { GoogleGenerativeAI } from "@google/generative-ai"

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY!)

const model = genAI.getGenerativeModel({
  model: "gemini-2.5-flash"
})

export async function extractEventsBatch(emails: any[]) {

  const prompt = `
Extract structured event data from these emails.

Return ONLY a JSON array.

Fields:
is_event_related (boolean: true if it is an event/workshop/cultural activity/hackathon. false if it is a random announcement, holiday notice, list of selected students, etc)
club_name (The name of the club, chapter, or department organizing the event. If not mentioned, return null)
event_name
description
date (Strictly YYYY-MM-DD format based on the start date of the event. If the year is missing, assume 2026. If no specific date is mentioned, return null)
time
venue
registration_link
prize_pool
ods_provided

Rules:
- If the email is NOT an event, workshop, technical or any cultural stuff (is_event_related = false), leave all other fields null
- Prefer Google Forms links as registration links
- Ignore instagram / unsubscribe / design links
- If OD or ODs mentioned set ods_provided = "Yes"
- If not present return null

Emails:
${JSON.stringify(emails, null, 2)}
`

  const result = await model.generateContent(prompt)

  let text = result.response.text()

  if (text.startsWith("```json")) {
    text = text.substring(7, text.length - 3).trim()
  } else if (text.startsWith("```")) {
    text = text.substring(3, text.length - 3).trim()
  }

  try {
    return JSON.parse(text)
  } catch {
    return { error: "Invalid JSON", raw: text }
  }
}