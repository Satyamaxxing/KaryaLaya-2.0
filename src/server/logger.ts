export type LogLevel = "debug" | "info" | "warn" | "error";

export interface LogContext {
  organizationId?: string;
  userId?: string;
  action?: string;
  entityType?: string;
  entityId?: string;
  [key: string]: unknown;
}

export interface StructuredLog {
  timestamp: string;
  level: LogLevel;
  message: string;
  context?: LogContext;
  error?: {
    name: string;
    message: string;
    stack?: string;
  };
}

class Logger {
  private formatLog(level: LogLevel, message: string, context?: LogContext, err?: unknown): StructuredLog {
    const log: StructuredLog = {
      timestamp: new Date().toISOString(),
      level,
      message,
      ...(context && { context }),
    };

    if (err instanceof Error) {
      log.error = {
        name: err.name,
        message: err.message,
        stack: process.env.NODE_ENV === "development" ? err.stack : undefined,
      };
    } else if (err) {
      log.error = {
        name: "UnknownError",
        message: String(err),
      };
    }

    return log;
  }

  private write(level: LogLevel, message: string, context?: LogContext, err?: unknown) {
    const formatted = this.formatLog(level, message, context, err);
    const jsonStr = JSON.stringify(formatted);

    switch (level) {
      case "error":
        console.error(jsonStr);
        break;
      case "warn":
        console.warn(jsonStr);
        break;
      case "debug":
        if (process.env.DEBUG === "true" || process.env.NODE_ENV === "development") {
          console.debug(jsonStr);
        }
        break;
      case "info":
      default:
        console.log(jsonStr);
        break;
    }
  }

  info(message: string, context?: LogContext) {
    this.write("info", message, context);
  }

  warn(message: string, context?: LogContext, err?: unknown) {
    this.write("warn", message, context, err);
  }

  error(message: string, err?: unknown, context?: LogContext) {
    this.write("error", message, context, err);
  }

  debug(message: string, context?: LogContext) {
    this.write("debug", message, context);
  }
}

export const logger = new Logger();

/**
 * Centrally maps low-level/internal errors to safe, friendly user-facing messages.
 */
export function formatUserFacingError(err: unknown): {
  message: string;
  status: number;
  code: string;
} {
  if (err instanceof Error) {
    const msg = err.message;

    // Optimistic locking conflict
    if (msg.includes("Someone else updated this") || msg.includes("Refresh to see the latest")) {
      return {
        message: "Someone else updated this. Refresh to see the latest.",
        status: 409,
        code: "CONFLICT",
      };
    }

    // Permission & Access Denied
    if (msg.startsWith("Access Denied") || msg.includes("Unauthorized") || msg.includes("permission")) {
      return {
        message: msg.startsWith("Access Denied") ? msg : "You do not have permission to perform this action.",
        status: 403,
        code: "FORBIDDEN",
      };
    }

    // Not found
    if (msg.includes("not found")) {
      return {
        message: msg,
        status: 404,
        code: "NOT_FOUND",
      };
    }

    // Bad input
    if (msg.includes("required") || msg.includes("invalid") || msg.includes("Invalid")) {
      return {
        message: msg,
        status: 400,
        code: "BAD_REQUEST",
      };
    }

    return {
      message: msg,
      status: 400,
      code: "CLIENT_ERROR",
    };
  }

  return {
    message: "An unexpected error occurred. Please try again later.",
    status: 500,
    code: "INTERNAL_SERVER_ERROR",
  };
}
