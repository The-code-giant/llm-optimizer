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
    res
      .status(401)
      .json({ message: "Missing or invalid Authorization header" });
    return;
  }

  const token = authHeader.split(" ")[1];

  try {
    // Verify Clerk token
    const payload = await verifyToken(token, {
      secretKey: process.env.CLERK_SECRET_KEY,
    });

    if (!payload || !payload.sub) {
      res.status(401).json({ message: "Invalid token payload" });
      return;
    }

    // Get user details from Clerk
    const user = await clerkClient.users.getUser(payload.sub);

    if (!user) {
      res.status(401).json({ message: "User not found" });
      return;
    }

    // Attach user info to request
    (req as AuthenticatedRequest).user = {
      userId: user.id,
      email: user.emailAddresses[0]?.emailAddress || "",
    };

    next();
  } catch (err) {
    console.error("Auth error:", err);
    res.status(401).json({ message: "Invalid or expired token" });
  }
}
