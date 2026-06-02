/**
 * Simple structured logger.
 * - Development: pretty-printed with emojis
 * - Production: JSON format for cloud logging (CloudWatch, Datadog, etc.)
 */

const isProd = process.env.NODE_ENV === "production";

interface LogEntry {
  level: string;
  message: string;
  timestamp: string;
  data?: unknown;
}

const formatJson = (entry: LogEntry): string => {
  return JSON.stringify(entry);
};

const logger = {
  info: (message: string, data?: unknown): void => {
    if (isProd) {
      console.log(formatJson({ level: "info", message, timestamp: new Date().toISOString(), data }));
    } else {
      console.log(message, data !== undefined ? data : "");
    }
  },

  warn: (message: string, data?: unknown): void => {
    if (isProd) {
      console.warn(formatJson({ level: "warn", message, timestamp: new Date().toISOString(), data }));
    } else {
      console.warn(`⚠️  ${message}`, data !== undefined ? data : "");
    }
  },

  error: (message: string, data?: unknown): void => {
    if (isProd) {
      console.error(
        formatJson({
          level: "error",
          message,
          timestamp: new Date().toISOString(),
          data: data instanceof Error ? { message: data.message, stack: data.stack } : data,
        }),
      );
    } else {
      console.error(`❌ ${message}`, data !== undefined ? data : "");
    }
  },

  debug: (message: string, data?: unknown): void => {
    if (!isProd) {
      console.debug(`🐛 ${message}`, data !== undefined ? data : "");
    }
  },
};

export default logger;
