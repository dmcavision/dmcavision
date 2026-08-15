import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import test from 'node:test';
import {
  createContactFunction,
  CONTENT_TYPES,
  escapeHtml,
  generateInquiryReference,
  MAX_BODY_BYTES,
  type EmailMessage,
  type HandlerOptions
} from '../api/contact.ts';

const env = {
  RESEND_API_KEY: 'test-key',
  CONTACT_TO_EMAIL: 'contact@dmcavision.com',
  CONTACT_FROM_EMAIL: 'DMCA Vision <notifications@notify.dmcavision.com>'
};
const now = new Date('2026-08-16T10:00:00.000Z');

const validPayload = (overrides: Record<string, unknown> = {}) => ({
  fullName: 'Jordan Rivera',
  organization: 'Rivera Studio',
  email: 'jordan@example.com',
  website: 'https://example.com/original',
  contentType: 'Images & Photography',
  infringingUrl: 'https://reported.example/copy',
  additionalInformation: 'Original work published on our website.\nSecond line.',
  confirmed: true,
  companyWebsite: '',
  formStartedAt: now.getTime() - 5_000,
  ...overrides
});

function request(body: unknown, init: { method?: string; origin?: string; contentType?: string; raw?: boolean; contentLength?: number } = {}) {
  const rawBody = init.raw ? String(body) : JSON.stringify(body);
  const headers = new Headers({ 'Content-Type': init.contentType ?? 'application/json' });
  if (init.origin) headers.set('Origin', init.origin);
  if (init.contentLength) headers.set('Content-Length', String(init.contentLength));
  return new Request('https://dmcavision.com/api/contact', { method: init.method ?? 'POST', headers, body: init.method === 'GET' ? undefined : rawBody });
}

function options(sendEmail: (message: EmailMessage) => Promise<void> = async () => undefined) {
  return { env, now, random: () => new Uint8Array([0, 1, 2, 3, 4, 5]), sendEmail };
}

function invoke(requestValue: Request, handlerOptions: HandlerOptions = options()) {
  return createContactFunction(handlerOptions).fetch(requestValue);
}

async function responseJson(response: Response) {
  return await response.json() as { success: boolean; reference?: string; message?: string; fieldErrors?: Record<string, string> };
}

test('valid submission sends internal and confirmation emails and returns a server reference', async () => {
  const messages: EmailMessage[] = [];
  const response = await invoke(request(validPayload()), options(async (message) => { messages.push(message); }));
  const body = await responseJson(response);
  assert.equal(response.status, 200);
  assert.equal(body.success, true);
  assert.match(body.reference ?? '', /^DV-2026-[A-Z2-9]{6}$/);
  assert.equal(messages.length, 2);
  assert.equal(messages[0].to, env.CONTACT_TO_EMAIL);
  assert.equal(messages[0].replyTo, 'jordan@example.com');
  assert.equal(messages[1].to, 'jordan@example.com');
  assert.match(messages[1].text, /does not guarantee removal/i);
});

test('Other content type matches the frontend option and is accepted', async () => {
  const response = await invoke(request(validPayload({ contentType: 'Other' })));
  const body = await responseJson(response);
  assert.equal(response.status, 200);
  assert.equal(body.success, true);
});

test('all backend content types exactly match visible frontend option values', async () => {
  const source = await readFile(new URL('../src/components/Contact.astro', import.meta.url), 'utf8');
  for (const contentType of CONTENT_TYPES) assert.ok(source.includes(`<option>${contentType}</option>`));
});

for (const [name, overrides, field] of [
  ['missing name', { fullName: '' }, 'fullName'],
  ['invalid email', { email: 'not-an-email' }, 'email'],
  ['missing content type', { contentType: '' }, 'contentType'],
  ['invalid infringing URL', { infringingUrl: 'not a URL' }, 'infringingUrl'],
  ['javascript URL attempt', { infringingUrl: 'javascript:alert(1)' }, 'infringingUrl'],
  ['oversized additional information', { additionalInformation: 'x'.repeat(5_001) }, 'additionalInformation'],
  ['unchecked confirmation', { confirmed: false }, 'confirmed']
] as const) {
  test(name, async () => {
    const response = await invoke(request(validPayload(overrides)));
    const body = await responseJson(response);
    assert.equal(response.status, 400);
    assert.ok(body.fieldErrors?.[field]);
  });
}

test('filled honeypot returns a generic response without sending email or a reference', async () => {
  let sends = 0;
  const response = await invoke(request(validPayload({ companyWebsite: 'spam.example' })), options(async () => { sends += 1; }));
  const body = await responseJson(response);
  assert.equal(response.status, 200);
  assert.equal(body.success, true);
  assert.equal(body.reference, undefined);
  assert.equal(sends, 0);
});

test('honeypot is silent even when the remaining payload is incomplete', async () => {
  let sends = 0;
  const response = await invoke(request({ companyWebsite: 'spam.example' }), options(async () => { sends += 1; }));
  const body = await responseJson(response);
  assert.equal(response.status, 200);
  assert.equal(body.success, true);
  assert.equal(body.fieldErrors, undefined);
  assert.equal(sends, 0);
});

test('implausibly fast submission receives the same generic spam response', async () => {
  let sends = 0;
  const response = await invoke(request(validPayload({ formStartedAt: now.getTime() - 100 })), options(async () => { sends += 1; }));
  assert.equal(response.status, 200);
  assert.equal(sends, 0);
});

test('internal email failure returns a safe error and does not claim success', async () => {
  const response = await invoke(request(validPayload()), options(async () => { throw new Error('provider detail'); }));
  const body = await responseJson(response);
  assert.equal(response.status, 500);
  assert.equal(body.success, false);
  assert.doesNotMatch(body.message ?? '', /provider|resend|api/i);
});

test('confirmation email failure preserves successful inquiry response', async () => {
  let sends = 0;
  const response = await invoke(request(validPayload()), options(async () => {
    sends += 1;
    if (sends === 2) throw new Error('confirmation failed');
  }));
  const body = await responseJson(response);
  assert.equal(response.status, 200);
  assert.equal(body.success, true);
  assert.ok(body.reference);
  assert.equal(sends, 2);
});

test('non-POST request returns JSON 405 with Allow header', async () => {
  const response = await invoke(request('', { method: 'GET' }));
  const body = await responseJson(response);
  assert.equal(response.status, 405);
  assert.equal(body.success, false);
  assert.equal(body.message, 'Method not allowed.');
  assert.equal(response.headers.get('allow'), 'POST');
  assert.match(response.headers.get('content-type') ?? '', /application\/json/);
});

test('malformed JSON returns 400', async () => {
  const response = await invoke(request('{bad json', { raw: true }));
  assert.equal(response.status, 400);
});

test('unexpected content type returns 415', async () => {
  const response = await invoke(request('fullName=test', { raw: true, contentType: 'application/x-www-form-urlencoded' }));
  assert.equal(response.status, 415);
});

test('declared or actual oversized body returns 413', async () => {
  const declared = await invoke(request(validPayload(), { contentLength: MAX_BODY_BYTES + 1 }));
  const actual = await invoke(request({ data: 'x'.repeat(MAX_BODY_BYTES) }));
  assert.equal(declared.status, 413);
  assert.equal(actual.status, 413);
});

test('origin allowlist permits production, local, and absent origins but rejects others', async () => {
  const production = await invoke(request(validPayload(), { origin: 'https://dmcavision.com' }));
  const www = await invoke(request(validPayload(), { origin: 'https://www.dmcavision.com' }));
  const local = await invoke(request(validPayload(), { origin: 'http://localhost:4321' }));
  const absent = await invoke(request(validPayload()));
  const rejected = await invoke(request(validPayload(), { origin: 'https://malicious.example' }));
  assert.equal(production.status, 200);
  assert.equal(www.status, 200);
  assert.equal(local.status, 200);
  assert.equal(absent.status, 200);
  assert.equal(rejected.status, 403);
});

test('unexpected exception is contained by the Web Standard fetch boundary', async () => {
  const response = await invoke(request(validPayload()), {
    ...options(),
    random: () => { throw new Error('unexpected internal detail D:\\server\\path'); }
  });
  const body = await responseJson(response);
  assert.equal(response.status, 500);
  assert.deepEqual(body, {
    success: false,
    message: 'We could not submit your request at this time. Please try again or contact contact@dmcavision.com.'
  });
  assert.doesNotMatch(JSON.stringify(body), /unexpected|server|stack|resend|api[_ -]?key/i);
});

test('missing server configuration fails safely', async () => {
  const response = await invoke(request(validPayload()), { env: {}, now, sendEmail: async () => undefined });
  const body = await responseJson(response);
  assert.equal(response.status, 500);
  assert.doesNotMatch(body.message ?? '', /RESEND_API_KEY|CONTACT_TO_EMAIL|CONTACT_FROM_EMAIL/);
});

test('unexpected payload fields are rejected', async () => {
  const response = await invoke(request(validPayload({ admin: true })));
  const body = await responseJson(response);
  assert.equal(response.status, 400);
  assert.ok(body.fieldErrors?.form);
});

test('email HTML escaping and reference randomness helpers are safe', () => {
  assert.equal(escapeHtml('<script>"x" & y</script>'), '&lt;script&gt;&quot;x&quot; &amp; y&lt;/script&gt;');
  assert.equal(generateInquiryReference(now, () => new Uint8Array([0, 1, 2, 3, 4, 5])), 'DV-2026-ABCDEF');
});

test('frontend contains duplicate-submit and network-error guards and never renders response objects', async () => {
  const source = await readFile(new URL('../src/components/Contact.astro', import.meta.url), 'utf8');
  assert.match(source, /if \(submitting\) return/);
  assert.match(source, /catch \{/);
  assert.match(source, /submitButton\.disabled = active/);
  assert.match(source, /Please try again or contact contact@dmcavision\.com/);
  assert.match(source, /typeof result\?\.message === 'string'/);
  assert.doesNotMatch(source, /textContent\s*=\s*result(?:\.|\s|;)/);
  assert.doesNotMatch(source, /\[object Object\]/);
});
