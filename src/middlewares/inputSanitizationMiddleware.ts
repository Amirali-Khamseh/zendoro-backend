import { Request, Response, NextFunction } from "express";

const DANGEROUS_PATTERNS = [
  /<[^>]*>/,                        // any HTML tag
  /javascript\s*:/i,                // javascript: protocol
  /vbscript\s*:/i,                  // vbscript: protocol
  /data\s*:\s*text\/html/i,         // data URI HTML injection
  /on\w+\s*=/i,                     // inline event handlers
  /expression\s*\(/i,               // CSS expression()
  /eval\s*\(/i,                     // eval()
  /<\s*script/i,                    // <script (with possible whitespace)
  /<\s*\/\s*script/i,               // </script>
  /<\s*iframe/i,                    // <iframe
  /<\s*object/i,                    // <object
  /<\s*embed/i,                     // <embed
  /<\s*link/i,                      // <link
  /<\s*meta/i,                      // <meta
  /&#x?[0-9a-f]+;/i,                // HTML/hex entity encoding
  /%3c/i,                           // URL-encoded <
  /%3e/i,                           // URL-encoded >
];

function isDangerous(value: string): boolean {
  return DANGEROUS_PATTERNS.some((pattern) => pattern.test(value));
}

function scanObject(obj: unknown, path = ""): string | null {
  if (typeof obj === "string") {
    if (isDangerous(obj)) return path || "input";
    return null;
  }
  if (Array.isArray(obj)) {
    for (let i = 0; i < obj.length; i++) {
      const found = scanObject(obj[i], `${path}[${i}]`);
      if (found) return found;
    }
    return null;
  }
  if (obj !== null && typeof obj === "object") {
    for (const key of Object.keys(obj as Record<string, unknown>)) {
      const found = scanObject((obj as Record<string, unknown>)[key], path ? `${path}.${key}` : key);
      if (found) return found;
    }
    return null;
  }
  return null;
}

export function sanitizeInput(req: Request, res: Response, next: NextFunction) {
  const problematicField = scanObject(req.body);
  if (problematicField) {
    return res.status(400).json({
      error: "Invalid input",
      message: `Field "${problematicField}" contains disallowed content. HTML tags and scripts are not permitted.`,
    });
  }
  next();
}
