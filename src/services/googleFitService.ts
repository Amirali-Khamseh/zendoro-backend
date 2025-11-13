import { readTokens, writeTokens } from "./fitTokenStore";
import { google } from "googleapis";

const CLIENT_ID = process.env.GOOGLE_CLIENT_ID;
const CLIENT_SECRET = process.env.GOOGLE_CLIENT_SECRET;
const REDIRECT_URI = process.env.GOOGLE_REDIRECT_URI;

if (!CLIENT_ID || !CLIENT_SECRET) {
  console.warn("Google Fit client credentials are not configured (GOOGLE_CLIENT_ID/SECRET)");
}

const oauth2Client = new google.auth.OAuth2(CLIENT_ID, CLIENT_SECRET, REDIRECT_URI);

export async function exchangeCodeForTokens(code: string) {
  if (!CLIENT_ID || !CLIENT_SECRET || !REDIRECT_URI) throw new Error("Missing Google OAuth env vars");
  const { tokens } = await oauth2Client.getToken(code);
  return tokens;
}

export async function getAuthenticatedClient() {
  const stored = readTokens();
  if (!stored) throw new Error("No stored tokens. Please POST tokens or perform OAuth flow.");

  oauth2Client.setCredentials({
    access_token: stored.access_token,
    refresh_token: stored.refresh_token,
    expiry_date: stored.expiry_date,
  } as any);

  oauth2Client.on("tokens", (tokens: any) => {
    try {
      const merged = {
        access_token: tokens.access_token || stored.access_token,
        refresh_token: tokens.refresh_token || stored.refresh_token,
        expiry_date: tokens.expiry_date || stored.expiry_date,
      } as any;
      writeTokens(merged);
    } catch (e) {
      console.error("Failed to persist refreshed tokens", e);
    }
  });

  return oauth2Client;
}


// Fetch aggregated steps from Google Fit for a time range (milliseconds since epoch).

export async function fetchSteps(startMs: number, endMs: number): Promise<{ steps: number }[]> {
  if (!startMs || !endMs || startMs >= endMs) throw new Error("Invalid time range");
  const auth = await getAuthenticatedClient();
  const fitness = google.fitness({ version: "v1", auth });

  const body = {
    aggregateBy: [
      {
        dataTypeName: "com.google.step_count.delta",
      },
    ],
    bucketByTime: { durationMillis: endMs - startMs },
    startTimeMillis: String(startMs),
    endTimeMillis: String(endMs),
  } as any;

  const resp = await fitness.users.dataset.aggregate({ userId: "me", requestBody: body });
  const json = resp.data as any;
  const buckets = json.bucket || [];
  const results: { steps: number }[] = buckets.map((b: any) => {
    const points = b.dataset?.[0]?.point || [];
    let sum = 0;
    for (const p of points) {
      if (Array.isArray(p.value)) {
        for (const v of p.value) {
          sum += Number(v.intVal || v.fpVal || 0);
        }
      }
    }
    return { steps: sum };
  });

  return results;
}

