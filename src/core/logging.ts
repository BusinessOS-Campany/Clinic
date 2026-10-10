/**
 * Non-blocking, minimal structured logger.
 * Levels: debug | info | warn | error.
 * Never logs sensitive/PII content — operations log identifiers, not payloads.
 */

export type LogLevel = "debug" | "info" | "warn" | "error";

const isProd = process.env.NODE_ENV === "production";

function emit(level: LogLevel, scope: string, message: string, meta?: unknown) {
  const line: Record<string, unknown> = {
    ts: new Date().toISOString(),
    level,
    scope,
    message,
  };
  if (meta !== undefined) line.meta = meta;

  // Asynchronous fire-and-forget write; never blocks the request path.
  void (async () => {
    if (level === "error") {
      console.error(JSON.stringify(line));
    } else if (level === "warn") {
      console.warn(JSON.stringify(line));
    } else if (!isProd) {
      console.log(JSON.stringify(line));
    }
  })();
}

export const log = {
  debug: (scope: string, message: string, meta?: unknown) =>
    emit("debug", scope, message, meta),
  info: (scope: string, message: string, meta?: unknown) =>
    emit("info", scope, message, meta),
  warn: (scope: string, message: string, meta?: unknown) =>
    emit("warn", scope, message, meta),
  error: (scope: string, message: string, meta?: unknown) =>
    emit("error", scope, message, meta),
};