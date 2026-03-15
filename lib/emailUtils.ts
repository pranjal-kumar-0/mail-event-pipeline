function decodeBase64(data: string) {
    return Buffer.from(data, "base64").toString("utf-8")
}

export function cleanBody(text: string) {
  return text
    .replace(/\[image:.*?\]/g, "")
    .replace(/Designed with Beefree/g, "")
    .replace(/Email tracked with Mailsuite/g, "")
    .replace(/\n{2,}/g, "\n")
    .trim()
}

export function extractBody(payload: any): string {

    if (!payload) return ""

    if (payload.body?.data) {
        return decodeBase64(payload.body.data)
    }

    if (payload.parts) {
        for (const part of payload.parts) {

            if (part.mimeType === "text/plain" && part.body?.data) {
                return decodeBase64(part.body.data)
            }

            if (part.mimeType === "text/html" && part.body?.data) {
                return decodeBase64(part.body.data)
            }

            const nested = extractBody(part)
            if (nested) return nested
        }
    }

    return ""
}

export function extractLinks(text: string) {
    const regex = /(https?:\/\/[^\s<>]+)/g
    const matches = text.match(regex)
    return matches || []
}
