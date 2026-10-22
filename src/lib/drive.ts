import { createCipheriv, createDecipheriv, createHash, randomBytes } from "crypto";

const AUTH_URL = "https://accounts.google.com/o/oauth2/v2/auth";
const TOKEN_URL = "https://oauth2.googleapis.com/token";
const USERINFO_URL = "https://www.googleapis.com/oauth2/v3/userinfo";
const DRIVE_API = "https://www.googleapis.com/drive/v3";

const FOLDER_NAME = "BSP LMS Submissions";

/**
 * Only files this app creates or that the Scout hands to it — Google calls this
 * scope non-sensitive, so no verification review is needed, and the app can
 * never browse the rest of the Scout's Drive. The bytes go straight from the
 * browser to Google; they never pass through this server.
 */
const SCOPES = [
  "https://www.googleapis.com/auth/drive.file",
  "https://www.googleapis.com/auth/userinfo.email",
  "openid",
].join(" ");

export function driveConfigured() {
  return Boolean(process.env.GOOGLE_CLIENT_ID && process.env.GOOGLE_CLIENT_SECRET);
}

export function driveRedirectUri() {
  if (process.env.GOOGLE_REDIRECT_URI) return process.env.GOOGLE_REDIRECT_URI;
  const base = process.env.APP_URL ?? `http://localhost:${process.env.PORT ?? 3000}`;
  return `${base.replace(/\/+$/, "")}/api/google/callback`;
}

export function driveAuthorizeUrl(state: string) {
  const params = new URLSearchParams({
    client_id: process.env.GOOGLE_CLIENT_ID ?? "",
    redirect_uri: driveRedirectUri(),
    response_type: "code",
    scope: SCOPES,
    access_type: "offline",
    prompt: "consent",
    include_granted_scopes: "true",
    state,
  });
  return `${AUTH_URL}?${params.toString()}`;
}

function secretKey() {
  const secret = process.env.DRIVE_TOKEN_SECRET || process.env.GOOGLE_CLIENT_SECRET || "bsp-lms-development-key";
  return createHash("sha256").update(secret).digest();
}

export function encryptToken(value: string) {
  const iv = randomBytes(12);
  const cipher = createCipheriv("aes-256-gcm", secretKey(), iv);
  const encrypted = Buffer.concat([cipher.update(value, "utf8"), cipher.final()]);
  return [iv.toString("base64"), cipher.getAuthTag().toString("base64"), encrypted.toString("base64")].join(".");
}

export function decryptToken(payload: string) {
  const [iv, tag, data] = payload.split(".");
  if (!iv || !tag || !data) return null;
  try {
    const decipher = createDecipheriv("aes-256-gcm", secretKey(), Buffer.from(iv, "base64"));
    decipher.setAuthTag(Buffer.from(tag, "base64"));
    return Buffer.concat([decipher.update(Buffer.from(data, "base64")), decipher.final()]).toString("utf8");
  } catch {
    return null;
  }
}

export async function exchangeCode(code: string) {
  const response = await fetch(TOKEN_URL, {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body: new URLSearchParams({
      code,
      client_id: process.env.GOOGLE_CLIENT_ID ?? "",
      client_secret: process.env.GOOGLE_CLIENT_SECRET ?? "",
      redirect_uri: driveRedirectUri(),
      grant_type: "authorization_code",
    }),
  });
  if (!response.ok) throw new Error(`Google refused the sign-in (${response.status}).`);
  return (await response.json()) as { access_token: string; refresh_token?: string };
}

export async function refreshAccessToken(refreshToken: string) {
  const response = await fetch(TOKEN_URL, {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body: new URLSearchParams({
      refresh_token: refreshToken,
      client_id: process.env.GOOGLE_CLIENT_ID ?? "",
      client_secret: process.env.GOOGLE_CLIENT_SECRET ?? "",
      grant_type: "refresh_token",
    }),
  });
  if (!response.ok) return null;
  const data = (await response.json()) as { access_token?: string };
  return data.access_token ?? null;
}

export async function fetchGoogleEmail(accessToken: string) {
  const response = await fetch(USERINFO_URL, { headers: { Authorization: `Bearer ${accessToken}` } });
  if (!response.ok) return null;
  return ((await response.json()) as { email?: string }).email ?? null;
}

export async function ensureFolder(accessToken: string, existingId: string | null) {
  if (existingId) return existingId;

  const query = encodeURIComponent(
    `mimeType='application/vnd.google-apps.folder' and name='${FOLDER_NAME}' and trashed=false`,
  );
  const found = await fetch(`${DRIVE_API}/files?q=${query}&fields=files(id)&spaces=drive`, {
    headers: { Authorization: `Bearer ${accessToken}` },
  });
  if (found.ok) {
    const data = (await found.json()) as { files?: { id: string }[] };
    if (data.files?.length) return data.files[0].id;
  }

  const created = await fetch(`${DRIVE_API}/files?fields=id`, {
    method: "POST",
    headers: { Authorization: `Bearer ${accessToken}`, "Content-Type": "application/json" },
    body: JSON.stringify({ name: FOLDER_NAME, mimeType: "application/vnd.google-apps.folder" }),
  });
  if (!created.ok) return null;
  return ((await created.json()) as { id?: string }).id ?? null;
}

export async function fileMetadata(accessToken: string, fileId: string) {
  const response = await fetch(`${DRIVE_API}/files/${fileId}?fields=id,name,webViewLink,mimeType,size`, {
    headers: { Authorization: `Bearer ${accessToken}` },
  });
  if (!response.ok) return null;
  return (await response.json()) as { id: string; name: string; webViewLink: string; mimeType: string };
}

/**
 * Makes the file readable by the reviewers. Prefers the real Google accounts of
 * the Scout Leaders and Council Admins; if none of them has connected Drive yet,
 * falls back to an unlisted "anyone with the link" share so review still works.
 */
export async function shareFileWithReviewers(accessToken: string, fileId: string, emails: string[]) {
  let shared = 0;
  for (const emailAddress of emails) {
    const response = await fetch(`${DRIVE_API}/files/${fileId}/permissions?sendNotificationEmail=false`, {
      method: "POST",
      headers: { Authorization: `Bearer ${accessToken}`, "Content-Type": "application/json" },
      body: JSON.stringify({ type: "user", role: "reader", emailAddress }),
    });
    if (response.ok) shared += 1;
  }
  if (shared > 0) return "council" as const;

  const link = await fetch(`${DRIVE_API}/files/${fileId}/permissions`, {
    method: "POST",
    headers: { Authorization: `Bearer ${accessToken}`, "Content-Type": "application/json" },
    body: JSON.stringify({ type: "anyone", role: "reader" }),
  });
  return link.ok ? ("link" as const) : ("private" as const);
}
