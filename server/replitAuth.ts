import * as client from "openid-client";
import { Strategy, type VerifyFunction } from "openid-client/passport";

import passport from "passport";
import session from "express-session";
import type { Express, RequestHandler } from "express";
import memoize from "memoizee";
import connectPg from "connect-pg-simple";
import { storage } from "./storage";

// if (!process.env.REPLIT_DOMAINS) {
//   throw new Error("Environment variable REPLIT_DOMAINS not provided");
// }

const getOidcConfig = memoize(
  async () => {
    return await client.discovery(
      new URL(process.env.ISSUER_URL ?? "https://replit.com/oidc"),
      process.env.REPL_ID!
    );
  },
  { maxAge: 3600 * 1000 }
);

export function getSession() {
  const sessionTtl = 7 * 24 * 60 * 60 * 1000; // 1 week
  const pgStore = connectPg(session);
  const sessionStore = new pgStore({
    conString: process.env.DATABASE_URL,
    createTableIfMissing: false,
    ttl: sessionTtl,
    tableName: "sessions",
  });
  return session({
    secret: process.env.SESSION_SECRET!,
    store: sessionStore,
    resave: false,
    saveUninitialized: false,
    cookie: {
      httpOnly: true,
      secure: true,
      maxAge: sessionTtl,
    },
  });
}

function updateUserSession(
  user: any,
  tokens: client.TokenEndpointResponse & client.TokenEndpointResponseHelpers
) {
  user.claims = tokens.claims();
  user.access_token = tokens.access_token;
  user.refresh_token = tokens.refresh_token;
  user.expires_at = user.claims?.exp;
}

async function upsertUser(
  claims: any,
) {
  await storage.upsertUser({
    id: claims["sub"],
    email: claims["email"],
    firstName: claims["first_name"],
    lastName: claims["last_name"],
    profileImageUrl: claims["profile_image_url"],
  });
}

export async function setupAuth(app: Express) {
  app.set("trust proxy", 1);
  app.use(getSession());
  app.use(passport.initialize());
  app.use(passport.session());

  const config = await getOidcConfig();

  const verify: VerifyFunction = async (
    tokens: client.TokenEndpointResponse & client.TokenEndpointResponseHelpers,
    verified: passport.AuthenticateCallback
  ) => {
    const user = {};
    updateUserSession(user, tokens);
    await upsertUser(tokens.claims());
    verified(null, user);
  };

  // for (const domain of process.env
  //     .REPLIT_DOMAINS!.split(",")) {
  //     const strategy = new Strategy(
  //       {
  //         name: `replitauth:${domain}`,
  //         config,
  //         scope: "openid email profile offline_access",
  //         callbackURL: `https://${domain}/api/callback`,
  //       },
  //       verify,
  //     );
  //     passport.use(strategy);
  //   }

  passport.serializeUser((user: Express.User, cb) => cb(null, user));
  passport.deserializeUser((user: Express.User, cb) => cb(null, user));

  // app.get("/api/login", (req, res, next) => {
  //   passport.authenticate(`replitauth:${req.hostname}`, {
  //     prompt: "login consent",
  //     scope: ["openid", "email", "profile", "offline_access"],
  //   })(req, res, next);
  // });

  // app.get("/api/callback", (req, res, next) => {
  //   passport.authenticate(`replitauth:${req.hostname}`, {
  //     successReturnToOrRedirect: "/",
  //     failureRedirect: "/api/login",
  //   })(req, res, next);
  // });

  // app.get("/api/logout", (req, res) => {
  //   req.logout(() => {
  //     res.redirect(
  //       client.buildEndSessionUrl(config, {
  //         client_id: process.env.REPL_ID!,
  //         post_logout_redirect_uri: `${req.protocol}://${req.hostname}`,
  //       }).href
  //     );
  //   });
  // });
}

import { supabaseClient } from "./supabaseClient";

export const isAuthenticated: RequestHandler = async (req, res, next) => {
  if (!supabaseClient) {
    return res.status(500).json({ message: "Supabase not configured" });
  }

  try {
    // Get the authorization header
    const authHeader = req.headers.authorization;
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return res.status(401).json({ message: "No authorization token provided" });
    }

    const token = authHeader.substring(7); // Remove 'Bearer ' prefix
    
    // Verify the token with Supabase
    const { data: { user }, error } = await supabaseClient.auth.getUser(token);

    if (error || !user) {
      return res.status(401).json({ message: "Invalid or expired token" });
    }

    // Attach user to request
    req.user = {
      id: user.id,
      email: user.email || '',
      firstName: user.user_metadata?.firstName || user.user_metadata?.first_name || '',
      lastName: user.user_metadata?.lastName || user.user_metadata?.last_name || '',
      profileImageUrl: user.user_metadata?.avatar_url || '',
      user_metadata: user.user_metadata
    };
    
    return next();
  } catch (error) {
    console.error('Authentication error:', error);
    return res.status(401).json({ message: "Authentication failed" });
  }
};

// User type for authentication
export interface User {
  id: string
  email: string
  firstName?: string
  lastName?: string
  profileImageUrl?: string
  user_metadata?: any
}

export type RequestWithUser = Request & { user: User };
