import { Request, Response, NextFunction } from "express";
import { verifyToken } from "@clerk/backend";
import { clerkClient } from "../lib/clerk-client";

// Extend Express Request type to include user
interface AuthenticatedRequest extends Request {
  user?: { userId: string; email: string };
}

export async function authenticateJWT(
  req: Request,
  res: Response,
  next: NextFunction
) {
  const authHeader = req.headers["authorization"];
  if (!authHeader || !authHeader.startsWith("Bearer ")) {
    // Include WWW-Authenticate header to help clients detect auth failure reasons
    res.setHeader(
      'WWW-Authenticate',
      'Bearer realm="api", error="invalid_request", error_description="Missing or invalid Authorization header"'
    );
    res.setHeader('Cache-Control', 'no-store');
    res.status(401).json({ message: "Missing or invalid Authorization header" });
    return;
  }

  const token = authHeader.split(" ")[1];

  try {
    // Verify Clerk token
    const payload = await verifyToken(token, {
      secretKey: process.env.CLERK_SECRET_KEY,
    });

    if (!payload || !payload.sub) {
  res.setHeader('WWW-Authenticate', 'Bearer error="invalid_token", error_description="Invalid token payload"');
  res.setHeader('Cache-Control', 'no-store');
  res.status(401).json({ message: "Invalid token payload" });
      return;
    }

    // Get user details from Clerk
    const user = await clerkClient.users.getUser(payload.sub);

    if (!user) {
  res.setHeader('WWW-Authenticate', 'Bearer error="invalid_token", error_description="User not found"');
  res.setHeader('Cache-Control', 'no-store');
  res.status(401).json({ message: "User not found" });
      return;
    }

    // Attach user info to request
    (req as AuthenticatedRequest).user = {
      userId: user.id,
      email: user.emailAddresses[0]?.emailAddress || "",
    };

    next();
  } catch (err: any) {
    console.error("Auth error:", err);
    const reason = err?.reason || err?.message || "invalid_token";
    // Send an RFC-6750 compatible WWW-Authenticate header so clients can detect 'token-expired'
    const desc = String(err?.message || reason).replace(/\"/g, '');
    res.setHeader('WWW-Authenticate', `Bearer error="${reason}", error_description="${desc}"`);
    res.setHeader('Cache-Control', 'no-store');
    res.status(401).json({ message: "Invalid or expired token", reason });
  }
}
