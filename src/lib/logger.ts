export type LogLevel = 'debug' | 'info' | 'warn' | 'error';

interface LogContext {
  traceId?: string;
  tenantId?: string;
  locationId?: string;
  bridgeKey?: string;
  [key: string]: any;
}

export const logger = {
  log(level: LogLevel, message: string, context: LogContext = {}) {
    // Mask bridge keys if they happen to be in the context
    if (context.bridgeKey) {
      context.bridgeKey = maskBridgeKey(context.bridgeKey);
    }

    const logEntry = {
      timestamp: new Date().toISOString(),
      level,
      message,
      ...context,
    };

    const output = JSON.stringify(logEntry);

    switch (level) {
      case 'debug':
        if (process.env.NODE_ENV !== 'production') {
          console.debug(output);
        }
        break;
      case 'info':
        console.info(output);
        break;
      case 'warn':
        console.warn(output);
        break;
      case 'error':
        console.error(output);
        break;
    }
  },

  debug(message: string, context?: LogContext) {
    this.log('debug', message, context);
  },

  info(message: string, context?: LogContext) {
    this.log('info', message, context);
  },

  warn(message: string, context?: LogContext) {
    this.log('warn', message, context);
  },

  error(message: string, error?: Error | unknown, context: LogContext = {}) {
    this.log('error', message, {
      ...context,
      error: error instanceof Error ? { name: error.name, message: error.message, stack: error.stack } : error,
    });
  },
};

function maskBridgeKey(key: string): string {
  if (!key || key.length < 8) return '***';
  // Keep prefix 'brk_' and last 4 chars
  if (key.startsWith('brk_')) {
    return `brk_***${key.slice(-4)}`;
  }
  return `***${key.slice(-4)}`;
}
