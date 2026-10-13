import createNextIntlPlugin from "next-intl/plugin";
import type { NextConfig } from "next";

const withNextIntl = createNextIntlPlugin("./src/i18n/request.ts");

/**
 * Where this system is mounted.
 *
 * Standalone it is `/clinic`. When the platform runs an organization's own
 * copy, the process is started with `SYSTEM_BASE_PATH=/{org}/clinic` so the
 * customer's URL, this app's links and its asset URLs are all the same thing.
 *
 * This has to be read here rather than hardcoded: Next bakes `basePath` into
 * the build, so a literal path would serve every clone at a path its own proxy
 * does not forward to, and every page and `/_next/static` request would 404.
 *
 * The platform's `systemContract` refuses to install a system whose build
 * config does not read `SYSTEM_BASE_PATH`.
 */
const basePath = process.env.SYSTEM_BASE_PATH ?? "/clinic";

const nextConfig: NextConfig = {
  basePath,
  reactStrictMode: true,
  poweredByHeader: false,
  typedRoutes: true,
};

export default withNextIntl(nextConfig);