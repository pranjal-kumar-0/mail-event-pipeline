export const parseDate = (dateString?: string): number => {
  if (!dateString) return 0;
  const raw = dateString.toLowerCase().trim();
  if (raw.match(/^\d{4}$/)) return -1;
  if (raw.includes("tba") || raw.includes("soon") || raw.includes("weekly")) return -1;
  const parsed = Date.parse(dateString);
  if (!isNaN(parsed) && parsed > 0) return parsed;
  const cleaned = raw.replace(/(st|nd|rd|th)/g, "");
  if (cleaned.includes("-") || cleaned.includes("–") || cleaned.includes(" to ")) {
    const segments = cleaned.split(/[-–]| to /).map((s) => s.trim());
    if (segments.length >= 2) {
      const p1 = segments[0];
      const p2 = segments[1];
      const p2HasMonth = /[a-z]/i.test(p2);
      let finalEndString = p2;
      if (!p2HasMonth) {
        const monthMatch = p1.match(/[a-z]+/i);
        if (monthMatch) finalEndString = `${p2} ${monthMatch[0]}`;
      }
      const currentYear = new Date().getFullYear();
      const parsedEnd = Date.parse(`${finalEndString} ${currentYear}`);
      if (!isNaN(parsedEnd) && parsedEnd > 0) return parsedEnd;
    }
  }
  const currentYear = new Date().getFullYear();
  const parsedClean = Date.parse(`${cleaned} ${currentYear}`);
  if (!isNaN(parsedClean) && parsedClean > 0) return parsedClean;
  return -1;
};
