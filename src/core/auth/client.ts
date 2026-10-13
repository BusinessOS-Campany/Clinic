import { createAuthClient } from "better-auth/react";
import { usernameClient } from "better-auth/client/plugins";

// The platform's runtime sets `NEXT_PUBLIC_BASE_PATH` to the mount point this
// app is served under (see `next.config.ts`), so the browser client calls the
// same auth routes Next exposes.
const basePath = `${process.env.NEXT_PUBLIC_BASE_PATH ?? ""}/api/auth`;

export const authClient = createAuthClient({
  basePath,
  plugins: [usernameClient()],
});

export const { signIn, signUp, signOut, useSession } = authClient;
export type { Session, User } from "better-auth/types";