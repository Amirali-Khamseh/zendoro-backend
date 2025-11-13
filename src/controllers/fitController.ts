import { Request, Response, Router } from "express";
import { writeTokens, masked, readTokens } from "../services/fitTokenStore";
import { exchangeCodeForTokens, fetchSteps, getAuthenticatedClient } from "../services/googleFitService";

// POST /fit/tokens

export const storeTokens = async (req: Request, res: Response) => {
  try {
    const { access_token, refresh_token, expiry_date, code } = req.body || {};

    if (code) {
      const exchanged = await exchangeCodeForTokens(String(code));
      const anyEx = exchanged as any;
      const expiry = (anyEx.expiry_date as number | undefined) || (anyEx.expires_in ? Date.now() + Number(anyEx.expires_in) * 1000 : undefined);
      const payload = {
        access_token: String(anyEx.access_token),
        refresh_token: anyEx.refresh_token || refresh_token,
        expiry_date: expiry,
      } as any;
      writeTokens(payload);
      return res.status(200).json({ message: "Tokens stored (from code)", tokens: masked(payload) });
    }

    if (!access_token || !refresh_token) {
      return res.status(400).json({ error: "Provide access_token and refresh_token, or an authorization code" });
    }

    const stored = { access_token: String(access_token), refresh_token: String(refresh_token), expiry_date };
    writeTokens(stored);
    return res.status(200).json({ message: "Tokens stored", tokens: masked(stored) });
  } catch (err: any) {
    console.error("/fit/tokens error:", err?.message || err);
    return res.status(500).json({ error: String(err?.message || err) });
  }
};


 //GET /steps

export const getSteps = async (req: Request, res: Response) => {
  try {
    const start = Number(req.query.start);
    const end = Number(req.query.end);
    if (!start || !end || isNaN(start) || isNaN(end) || start >= end) {
      return res.status(400).json({ error: "Query params start and end (ms epoch) required and start < end" });
    }

    await getAuthenticatedClient();
    const data = await fetchSteps(start, end);
    return res.status(200).json({ buckets: data });
  } catch (err: any) {
    console.error("/fit/steps error:", err?.message || err);
    if (err?.message?.includes("No stored tokens")) {
      return res.status(401).json({ error: "Google Fit not connected. Please authenticate first." });
    }
    if (err?.message?.includes("Invalid time range")) {
      return res.status(400).json({ error: "Invalid time range provided" });
    }
    
    return res.status(500).json({ error: String(err?.message || err) });
  }
};

// POST /fit/daily
// Quick fetch for today's steps (local timezone). Optional body { daysAgo?: number }

export const quickDaily = async (req: Request, res: Response) => {
  try {
    const daysAgo = Number(req.body?.daysAgo || 0);
    const now = new Date();
    now.setHours(0, 0, 0, 0);
    now.setDate(now.getDate() - daysAgo);
    const start = now.getTime();
    const end = start + 24 * 60 * 60 * 1000 - 1;

    await getAuthenticatedClient();
    const data = await fetchSteps(start, end);
    const total = data.reduce((s, b) => s + (b.steps || 0), 0);
    return res.status(200).json({ date: new Date(start).toISOString(), totalSteps: total, buckets: data });
  } catch (err: any) {
    console.error("/fit/daily error:", err?.message || err);
    
    // Handle specific error cases
    if (err?.message?.includes("No stored tokens")) {
      return res.status(401).json({ error: "Google Fit not connected. Please authenticate first." });
    }
    
    return res.status(500).json({ error: String(err?.message || err) });
  }
};

// Router is now handled in fitRoutes.ts
