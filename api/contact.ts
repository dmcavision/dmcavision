import { randomBytes } from 'node:crypto';
import { Resend } from 'resend';

export const MAX_BODY_BYTES = 16 * 1024;
const MIN_SUBMISSION_MS = 1_200;

export const CONTENT_TYPES = [
  'Images & Photography',
  'Video & Media',
  'Written Content',
  'Creative Assets',
  'Software & Digital Products',
  'Brand Content',
  'Other'
] as const;

const ALLOWED_ORIGINS = new Set([
  'https://dmcavision.com',
  'https://www.dmcavision.com',
  'http://localhost:4321',
  'http://127.0.0.1:4321'
]);

const ALLOWED_FIELDS = new Set([
  'fullName', 'organization', 'email', 'website', 'contentType',
  'infringingUrl', 'additionalInformation', 'confirmed',
  'companyWebsite', 'formStartedAt'
]);

export type ContactPayload = {
  fullName: string;
  organization: string;
  email: string;
  website: string;
  contentType: (typeof CONTENT_TYPES)[number];
  infringingUrl: string;
  additionalInformation: string;
  confirmed: true;
  companyWebsite: string;
  formStartedAt?: number;
};

type FieldErrors = Record<string, string>;

export type EmailMessage = {
  from: string;
  to: string | string[];
  replyTo?: string;
  subject: string;
  html: string;
  text: string;
};

export type HandlerOptions = {
  env?: Record<string, string | undefined>;
  now?: Date;
  random?: (size: number) => Uint8Array;
  sendEmail?: (message: EmailMessage) => Promise<void>;
};

const SAFE_FAILURE_MESSAGE = 'We could not submit your request at this time. Please try again or contact contact@dmcavision.com.';

const emailPattern = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

function json(body: Record<string, unknown>, status = 200, headers: HeadersInit = {}) {
  return Response.json(body, {
    status,
    headers: {
      'Cache-Control': 'no-store',
      'X-Content-Type-Options': 'nosniff',
      ...headers
    }
  });
}

function cleanString(value: unknown): string | null {
  return typeof value === 'string' ? value.trim() : null;
}

function isHttpUrl(value: string): boolean {
  try {
    const url = new URL(value);
    return (url.protocol === 'http:' || url.protocol === 'https:') && Boolean(url.hostname);
  } catch {
    return false;
  }
}

export function validateContactPayload(input: unknown):
  | { success: true; data: ContactPayload }
  | { success: false; fieldErrors: FieldErrors } {
  if (!input || typeof input !== 'object' || Array.isArray(input)) {
    return { success: false, fieldErrors: { form: 'The submitted form data is invalid.' } };
  }

  const record = input as Record<string, unknown>;
  const fieldErrors: FieldErrors = {};
  const unexpected = Object.keys(record).filter((key) => !ALLOWED_FIELDS.has(key));
  if (unexpected.length) fieldErrors.form = 'The submitted form contains unsupported fields.';

  const fullName = cleanString(record.fullName);
  const organization = cleanString(record.organization) ?? '';
  const email = cleanString(record.email);
  const website = cleanString(record.website) ?? '';
  const contentType = cleanString(record.contentType);
  const infringingUrl = cleanString(record.infringingUrl);
  const additionalInformation = cleanString(record.additionalInformation) ?? '';
  const companyWebsite = cleanString(record.companyWebsite) ?? '';

  if (!fullName || fullName.length < 2 || fullName.length > 120) {
    fieldErrors.fullName = 'Enter a full name between 2 and 120 characters.';
  }
  if (organization.length > 160) {
    fieldErrors.organization = 'Organization must be 160 characters or fewer.';
  }
  if (!email || email.length > 254 || !emailPattern.test(email)) {
    fieldErrors.email = 'Enter a valid email address.';
  }
  if (website && (website.length > 2_048 || !isHttpUrl(website))) {
    fieldErrors.website = 'Enter a valid website URL beginning with http:// or https://.';
  }
  if (!contentType || !CONTENT_TYPES.includes(contentType as ContactPayload['contentType'])) {
    fieldErrors.contentType = 'Select a valid content type.';
  }
  if (!infringingUrl || infringingUrl.length > 2_048 || !isHttpUrl(infringingUrl)) {
    fieldErrors.infringingUrl = 'Enter a valid infringing URL beginning with http:// or https://.';
  }
  if (additionalInformation.length > 5_000) {
    fieldErrors.additionalInformation = 'Additional information must be 5,000 characters or fewer.';
  }
  if (record.confirmed !== true) {
    fieldErrors.confirmed = 'Confirm that the submitted information is accurate.';
  }
  if (companyWebsite.length > 500) {
    fieldErrors.form = 'The submitted form data is invalid.';
  }

  const formStartedAt = typeof record.formStartedAt === 'number' && Number.isFinite(record.formStartedAt)
    ? record.formStartedAt
    : undefined;

  if (Object.keys(fieldErrors).length || !fullName || !email || !contentType || !infringingUrl) {
    return { success: false, fieldErrors };
  }

  return {
    success: true,
    data: {
      fullName,
      organization,
      email,
      website,
      contentType: contentType as ContactPayload['contentType'],
      infringingUrl,
      additionalInformation,
      confirmed: true,
      companyWebsite,
      formStartedAt
    }
  };
}

export function generateInquiryReference(
  date = new Date(),
  random: (size: number) => Uint8Array = randomBytes
): string {
  const alphabet = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
  const bytes = random(6);
  let suffix = '';
  for (const byte of bytes) suffix += alphabet[byte % alphabet.length];
  return `DV-${date.getUTCFullYear()}-${suffix}`;
}

export function escapeHtml(value: string): string {
  return value.replace(/[&<>'"]/g, (character) => ({
    '&': '&amp;', '<': '&lt;', '>': '&gt;', "'": '&#39;', '"': '&quot;'
  })[character] ?? character);
}

function display(value: string): string {
  return value || 'Not provided';
}

function buildInternalEmail(data: ContactPayload, reference: string, submittedAt: Date, from: string, to: string): EmailMessage {
  const rows = [
    ['Inquiry Reference', reference],
    ['Submitted', submittedAt.toISOString()],
    ['Full Name', data.fullName],
    ['Business / Organization', display(data.organization)],
    ['Email', data.email],
    ['Type of Content', data.contentType]
  ];
  const htmlRows = rows.map(([label, value]) => `<tr><td style="padding:8px 12px;color:#667085;border-bottom:1px solid #e7ecef">${escapeHtml(label)}</td><td style="padding:8px 12px;color:#0e1825;border-bottom:1px solid #e7ecef;font-weight:600">${escapeHtml(value)}</td></tr>`).join('');
  const safeDetails = escapeHtml(display(data.additionalInformation)).replace(/\r?\n/g, '<br>');

  return {
    from,
    to,
    replyTo: data.email,
    subject: `[DMCA Vision] New Infringement Review — ${reference}`,
    html: `<!doctype html><html><body style="margin:0;background:#f6f9fb;font-family:Arial,sans-serif;color:#0e1825"><div style="max-width:680px;margin:0 auto;padding:32px 18px"><div style="background:#07111f;color:#fff;padding:24px;border-radius:12px 12px 0 0"><div style="color:#20e39a;font-size:12px;letter-spacing:2px;font-weight:700">DMCA VISION</div><h1 style="font-size:22px;margin:10px 0 0">New infringement review request</h1></div><div style="background:#fff;border:1px solid #dce5ea;border-top:0;padding:24px;border-radius:0 0 12px 12px"><table role="presentation" style="width:100%;border-collapse:collapse;font-size:14px">${htmlRows}</table><h2 style="font-size:15px;margin:28px 0 8px;color:#087d54">Claimed work / rights holder context</h2><p style="font-size:14px;margin:0 0 8px"><strong>Website:</strong> ${escapeHtml(display(data.website))}</p><p style="font-size:14px;line-height:1.6;margin:0">${safeDetails}</p><h2 style="font-size:15px;margin:28px 0 8px;color:#087d54">Reported infringing URL</h2><p style="font-size:14px;word-break:break-all;margin:0">${escapeHtml(data.infringingUrl)}</p></div></div></body></html>`,
    text: `DMCA Vision — New Infringement Review\n\nInquiry Reference: ${reference}\nSubmitted: ${submittedAt.toISOString()}\nFull Name: ${data.fullName}\nBusiness / Organization: ${display(data.organization)}\nEmail: ${data.email}\nType of Content: ${data.contentType}\n\nCLAIMED WORK / RIGHTS HOLDER CONTEXT\nWebsite: ${display(data.website)}\nAdditional Information:\n${display(data.additionalInformation)}\n\nREPORTED INFRINGING URL\n${data.infringingUrl}`
  };
}

function buildConfirmationEmail(data: ContactPayload, reference: string, from: string, replyTo: string): EmailMessage {
  return {
    from,
    to: data.email,
    replyTo,
    subject: `DMCA Vision — Review Request Received — ${reference}`,
    html: `<!doctype html><html><body style="margin:0;background:#f6f9fb;font-family:Arial,sans-serif;color:#0e1825"><div style="max-width:620px;margin:0 auto;padding:32px 18px"><div style="background:#07111f;padding:24px;border-radius:12px 12px 0 0"><div style="color:#20e39a;font-size:12px;letter-spacing:2px;font-weight:700">DMCA VISION</div><h1 style="color:#fff;font-size:23px;margin:12px 0 0">Review request received</h1></div><div style="background:#fff;border:1px solid #dce5ea;border-top:0;padding:28px;border-radius:0 0 12px 12px"><p style="font-size:15px;line-height:1.7;margin-top:0">Thank you, ${escapeHtml(data.fullName)}. DMCA Vision has received your infringement review request.</p><div style="background:#eefaf5;border-left:3px solid #16c784;padding:14px 16px;margin:22px 0"><span style="color:#667085;font-size:12px">REFERENCE</span><div style="font-size:18px;font-weight:700;margin-top:3px">${reference}</div></div><p style="font-size:14px;line-height:1.7">Please retain this reference for future correspondence. The submitted information will be reviewed. Submission does not guarantee removal or enforcement action and does not create an attorney-client relationship.</p><p style="font-size:13px;line-height:1.7;margin:26px 0 0;color:#667085"><strong style="color:#0e1825">DMCA Vision LLC</strong><br><a href="https://dmcavision.com" style="color:#087d54">dmcavision.com</a><br><a href="mailto:contact@dmcavision.com" style="color:#087d54">contact@dmcavision.com</a></p></div></div></body></html>`,
    text: `DMCA Vision — Review Request Received\n\nThank you, ${data.fullName}. DMCA Vision has received your infringement review request.\n\nReference: ${reference}\n\nPlease retain this reference for future correspondence. The submitted information will be reviewed. Submission does not guarantee removal or enforcement action and does not create an attorney-client relationship.\n\nDMCA Vision LLC\ndmcavision.com\ncontact@dmcavision.com`
  };
}

function isLikelySpam(data: ContactPayload, now: Date): boolean {
  if (data.companyWebsite) return true;
  if (data.formStartedAt === undefined) return false;
  const elapsed = now.getTime() - data.formStartedAt;
  return elapsed >= 0 && elapsed < MIN_SUBMISSION_MS;
}

export async function handleContactRequest(request: Request, options: HandlerOptions = {}): Promise<Response> {
  if (request.method !== 'POST') {
    return json({ success: false, message: 'Method not allowed.' }, 405, { Allow: 'POST' });
  }

  const origin = request.headers.get('origin');
  if (origin && !ALLOWED_ORIGINS.has(origin)) {
    return json({ success: false, message: 'Request origin is not allowed.' }, 403);
  }

  const contentType = request.headers.get('content-type')?.split(';', 1)[0].trim().toLowerCase();
  if (contentType !== 'application/json') {
    return json({ success: false, message: 'Unsupported request format.' }, 415);
  }

  const declaredLength = Number(request.headers.get('content-length') ?? 0);
  if (Number.isFinite(declaredLength) && declaredLength > MAX_BODY_BYTES) {
    return json({ success: false, message: 'The submitted request is too large.' }, 413);
  }

  let bodyForSize: string;
  try {
    bodyForSize = await request.clone().text();
  } catch {
    return json({ success: false, message: 'The submitted form data is invalid.' }, 400);
  }
  if (new TextEncoder().encode(bodyForSize).byteLength > MAX_BODY_BYTES) {
    return json({ success: false, message: 'The submitted request is too large.' }, 413);
  }

  let payload: unknown;
  try {
    payload = await request.json();
  } catch {
    return json({ success: false, message: 'The submitted form data is invalid.' }, 400);
  }

  if (payload && typeof payload === 'object' && !Array.isArray(payload)) {
    const honeypot = (payload as Record<string, unknown>).companyWebsite;
    if (typeof honeypot === 'string' && honeypot.trim()) {
      return json({ success: true, message: 'Request received.' });
    }
  }

  const validation = validateContactPayload(payload);
  if (!validation.success) {
    return json({ success: false, message: 'Please correct the highlighted fields.', fieldErrors: validation.fieldErrors }, 400);
  }

  const now = options.now ?? new Date();
  if (isLikelySpam(validation.data, now)) {
    return json({ success: true, message: 'Request received.' });
  }

  const env = options.env ?? process.env;
  const apiKey = env.RESEND_API_KEY?.trim();
  const toEmail = env.CONTACT_TO_EMAIL?.trim();
  const fromEmail = env.CONTACT_FROM_EMAIL?.trim();
  if (!apiKey || !toEmail || !fromEmail) {
    console.error('[contact] Email service configuration is incomplete.');
    return json({ success: false, message: SAFE_FAILURE_MESSAGE }, 500);
  }

  const reference = generateInquiryReference(now, options.random ?? randomBytes);
  const sender = options.sendEmail ?? (async (message: EmailMessage) => {
    const resend = new Resend(apiKey);
    const { error } = await resend.emails.send(message);
    if (error) throw new Error('Email delivery failed.');
  });

  try {
    await sender(buildInternalEmail(validation.data, reference, now, fromEmail, toEmail));
  } catch {
    console.error(`[contact] Internal notification delivery failed for ${reference}.`);
    return json({ success: false, message: SAFE_FAILURE_MESSAGE }, 500);
  }

  try {
    await sender(buildConfirmationEmail(validation.data, reference, fromEmail, toEmail));
  } catch {
    console.error(`[contact] Submitter confirmation delivery failed for ${reference}.`);
  }

  return json({ success: true, message: 'Request received.', reference });
}

export function createContactFunction(options: HandlerOptions = {}) {
  return {
    async fetch(request: Request): Promise<Response> {
      try {
        return await handleContactRequest(request, options);
      } catch {
        console.error('[contact] Unexpected request processing failure.');
        return json({ success: false, message: SAFE_FAILURE_MESSAGE }, 500);
      }
    }
  };
}

export default createContactFunction();
