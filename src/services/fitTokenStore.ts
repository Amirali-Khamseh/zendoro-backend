import fs from "fs";
import path from "path";

const LOCAL_DIR = path.resolve(process.cwd(), ".local");
const TOKEN_PATH = path.join(LOCAL_DIR, "fit_tokens.json");

function ensureLocalDir() {
  if (!fs.existsSync(LOCAL_DIR)) {
    fs.mkdirSync(LOCAL_DIR, { recursive: true });
  }
}

export function readTokens(): { access_token: string; refresh_token: string; expiry_date?: number } | null {
  try {
    if (!fs.existsSync(TOKEN_PATH)) return null;
    const raw = fs.readFileSync(TOKEN_PATH, "utf8");
    const parsed = JSON.parse(raw);
    if (!parsed || !parsed.access_token || !parsed.refresh_token) return null;
    return parsed;
  } catch (err) {
    console.error("Failed to read fit tokens file:", err);
    return null;
  }
}

export function writeTokens(tokens: { access_token: string; refresh_token: string; expiry_date?: number }) {
  try {
    ensureLocalDir();
    const safe = {
      ...tokens,
    };
    fs.writeFileSync(TOKEN_PATH, JSON.stringify(safe, null, 2), { encoding: "utf8" });
  } catch (err) {
    console.error("Failed to write fit tokens file:", err);
    throw err;
  }
}

export function masked(tokens: { access_token: string; refresh_token: string; expiry_date?: number } | null) {
  if (!tokens) return null;
  return {
    access_token: tokens.access_token ? `${tokens.access_token.slice(0, 6)}...${tokens.access_token.slice(-6)}` : null,
    refresh_token: tokens.refresh_token ? `${tokens.refresh_token.slice(0, 6)}...${tokens.refresh_token.slice(-6)}` : null,
    expiry_date: tokens.expiry_date,
  };
}

export const TOKEN_FILE_PATH = TOKEN_PATH;
