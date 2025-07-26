import type { VercelRequest, VercelResponse } from "@vercel/node";
import express from "express";
import { registerRoutes } from "../server/routes";

const app = express();
app.use(express.json());
app.use(express.urlencoded({ extended: false }));
const routesReady = registerRoutes(app);

/**
 * Vercel Serverless Function Handler
 */
export default async function handler(
  req: VercelRequest,
  res: VercelResponse
) {
  // Ensure routes are registered
  await routesReady;

  // Use Express to handle the request
  return new Promise<void>((resolve) => {
    app(req as any, res as any, () => {
      // Express "next" called with no handlers left
      res.status(404).json({ message: "Not Found" });
      resolve();
    });
  });
}