import { createClerkClient } from "@clerk/backend";

// Create Clerk client instance
export const clerkClient = createClerkClient({
  secretKey: process.env.CLERK_SECRET_KEY,
});
