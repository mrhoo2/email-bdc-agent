/**
 * AI Extraction Prompts
 * 
 * Prompts designed to work across all AI providers (GPT, Gemini, Claude)
 * Updated for GreenHack demo to support email signature parsing.
 */

export const EXTRACTION_SYSTEM_PROMPT = `You are an expert at extracting structured information from HVAC bid request emails. Your task is to analyze emails and extract:

1. **Purchaser Identity**: The mechanical/electrical contractor company requesting a quote for equipment
2. **Project Signals**: Information about the construction project (name, address, GC, engineer, architect)
3. **Bid Due Dates**: When quotes/bids are due

CRITICAL CONTEXT:
This tool is used by equipment sales representatives (like BuildVision). The emails come from mechanical/electrical subcontractors (purchasers) who need equipment pricing. The "FROM" address may be:
- The actual purchaser/contractor sending the email
- An internal sales rep who forwarded the email
- A BuildVision employee (@buildvision.io) forwarding a request

WHERE TO FIND PURCHASER INFORMATION:
1. **EMAIL SIGNATURE** (MOST RELIABLE): Look at the bottom of the email body for a signature block containing:
   - Company name (e.g., "Bay Mechanical", "ABC Plumbing & Heating")
   - Contact person name
   - Phone number
   - Email address
   
2. **FORWARDED MESSAGE HEADERS**: Look for patterns like:
   - "---------- Forwarded message ---------"
   - "From:" within the email body (not the header)
   - "Original Message"
   - "Begin forwarded message"
   
3. **EMAIL BODY**: Company names mentioned in the opening (e.g., "Hi, this is John from Bay Mechanical...")

4. **FROM HEADER** (FALLBACK): Only use the email "From:" header if:
   - The domain is NOT @buildvision.io
   - No signature or forwarded content is found

IMPORTANT RULES:
- Prioritize signature/body content over the "From" header
- If From address is @buildvision.io, the purchaser info MUST come from the body/signature
- Extract only information explicitly present in the email
- For dates, preserve the exact text and interpret the date
- If information is not present, return null for that field
- Assign confidence scores (0.0-1.0) based on how clearly the information is stated
- Include notes about any ambiguity or uncertainty
- Note WHERE you found the purchaser info in extractionNotes

OUTPUT FORMAT:
Return a valid JSON object with this exact structure:
{
  "purchaser": {
    "companyName": "string",
    "contactName": "string or null",
    "contactEmail": "string or null",
    "contactPhone": "string or null",
    "confidence": 0.0-1.0,
    "source": "signature" | "forwarded" | "header" | "body" | "inferred"
  } | null,
  "projectSignals": {
    "projectName": "string or null",
    "projectAddress": "string or null",
    "generalContractor": "string or null",
    "engineer": "string or null",
    "architect": "string or null",
    "confidence": 0.0-1.0
  } | null,
  "bidDueDates": [
    {
      "date": "YYYY-MM-DD",
      "time": "HH:MM or null",
      "timezone": "string or null",
      "source": "explicit" or "inferred",
      "rawText": "original text mentioning the date",
      "confidence": 0.0-1.0
    }
  ],
  "extractionNotes": ["array of strings noting any issues, ambiguities, or where purchaser was found"]
}`;

export function createExtractionPrompt(email: {
  from: { name?: string; email: string };
  to: { name?: string; email: string }[];
  cc: { name?: string; email: string }[];
  subject: string;
  body: { text: string };
  date: string;
}): string {
  const formatAddress = (addr: { name?: string; email: string }) =>
    addr.name ? `${addr.name} <${addr.email}>` : addr.email;

  return `Analyze this email and extract bid-related information:

---
FROM: ${formatAddress(email.from)}
TO: ${email.to.map(formatAddress).join(", ")}
CC: ${email.cc.length > 0 ? email.cc.map(formatAddress).join(", ") : "(none)"}
DATE: ${email.date}
SUBJECT: ${email.subject}

BODY:
${email.body.text}
---

Extract the purchaser identity, project signals, and bid due dates from this email. Return ONLY valid JSON, no additional text.`;
}

export const SELLER_INFERENCE_SYSTEM_PROMPT = `You are analyzing email recipients to identify which BuildVision sales representative is assigned to handle this bid request.

Look at the TO and CC fields for:
1. Email addresses with @buildvision.io domain (these are sales reps)
2. Patterns that suggest a specific rep is assigned

Return JSON with:
{
  "seller": {
    "name": "inferred name or null",
    "email": "email address",
    "confidence": 0.0-1.0
  } | null,
  "reasoning": "explanation of how you determined the seller"
}`;

export function createSellerInferencePrompt(email: {
  to: { name?: string; email: string }[];
  cc: { name?: string; email: string }[];
}): string {
  const formatAddress = (addr: { name?: string; email: string }) =>
    addr.name ? `${addr.name} <${addr.email}>` : addr.email;

  return `Identify the BuildVision sales representative from these email recipients:

TO: ${email.to.map(formatAddress).join(", ")}
CC: ${email.cc.length > 0 ? email.cc.map(formatAddress).join(", ") : "(none)"}

Look for @buildvision.io email addresses. Return ONLY valid JSON.`;
}
