import createMiddleware from "next-intl/middleware";
import { routing } from "./i18n/routing";

export default createMiddleware(routing);

export const config = {
  // The explicit "/" is not redundant. Behind the platform's basePath the
  // matcher is evaluated against the stripped path, and the bare root request
  // (`/demo/clinic` -> `/`) skipped the pattern below entirely, so next-intl
  // never rewrote it to a locale and the mount root 404'd. Every other route
  // (`/login`, `/patients`) matched and worked, which is why this was invisible
  // until the demo was opened at its mount.
  matcher: ["/", "/((?!api|_next|_vercel|.*\\..*).*)"],
};