import { google } from "googleapis";
import { db } from "./firebase";
import { extractEventsBatch } from "./llm";
import { cleanBody, extractBody, extractLinks } from "./emailUtils";
import { collection, doc, getDoc, setDoc, addDoc } from "firebase/firestore";

export async function processNewEmails() {
  const auth = new google.auth.OAuth2(
    process.env.GMAIL_CLIENT_ID,
    process.env.GMAIL_CLIENT_SECRET
  );

  auth.setCredentials({
    refresh_token: process.env.GMAIL_REFRESH_TOKEN,
  });

  const gmail = google.gmail({ version: "v1", auth });

  const list = await gmail.users.messages.list({
    userId: "me",
    q: "from:asstdir.cac@vitap.ac.in",
    maxResults: 10,
  });

  const metaRef = doc(db, "system", "gmail");
  const metaSnap = await getDoc(metaRef);
  const lastMessageId = metaSnap.data()?.lastMessageId;

  const newMessages = [];

  for (const msg of list.data.messages || []) {
    if (msg.id === lastMessageId) break;
    newMessages.push(msg);
  }

  if (newMessages.length === 0) {
    console.log("No new emails");
    return;
  }

  const emails: { sender: string; subject: string; body: string; links: string[] }[] = [];

  for (const msg of newMessages) {
    const full = await gmail.users.messages.get({
      userId: "me",
      id: msg.id!,
    });

    const headers = full.data.payload?.headers || [];

    const subject = headers.find((h) => h.name === "Subject")?.value || "";

    const sender = headers.find((h) => h.name === "From")?.value || "";

    const body = cleanBody(extractBody(full.data.payload));

    const links = extractLinks(body);

    emails.push({
      sender,
      subject,
      body,
      links,
    });
  }

  const events = await extractEventsBatch(emails);

  const validEvents = (events || []).filter((e: any) => e.is_event_related !== false && e.event_name);

  for (const event of validEvents) {
    delete event.is_event_related;
    await addDoc(collection(db, "events"), event);
  }

  await setDoc(doc(db, "system", "gmail"), {
    lastMessageId: newMessages[0].id,
  });

  console.log("Processed", validEvents.length, "valid events out of", events.length, "total objects");
}