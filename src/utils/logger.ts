/**
 * Logging module for the vibe-templates-mcp server
 * @module utils/logger
 */

import winston from 'winston';

/**
 * Log levels available in the application
 */
type LogLevel = 'debug' | 'info' | 'warn' | 'error';

/**
 * Get log level from environment or default to 'info'
 */
function getLogLevel(): LogLevel {
  const level = process.env.LOG_LEVEL as LogLevel;
  if (['debug', 'info', 'warn', 'error'].includes(level)) {
    return level;
  }
  return 'info';
}

/**
 * Custom format for log messages
 */
const customFormat = winston.format.combine(
  winston.format.timestamp({ format: 'YYYY-MM-DD HH:mm:ss' }),
  winston.format.errors({ stack: true }),
  winston.format.printf(({ timestamp, level, message, ...meta }) => {
    const metaString = Object.keys(meta).length ? ` ${JSON.stringify(meta)}` : '';
    return `[${timestamp}] ${level.toUpperCase()}: ${message}${metaString}`;
  })
);

/**
 * JSON format for structured logging
 */
const jsonFormat = winston.format.combine(
  winston.format.timestamp(),
  winston.format.errors({ stack: true }),
  winston.format.json()
);

/**
 * Create the logger instance
 */
function createLogger(): winston.Logger {
  const isProduction = process.env.NODE_ENV === 'production';

  return winston.createLogger({
    level: getLogLevel(),
    format: isProduction ? jsonFormat : customFormat,
    transports: [
      new winston.transports.Console({
        // In MCP mode, we write to stderr to not interfere with stdio transport
        stderrLevels: ['debug', 'info', 'warn', 'error'],
      }),
    ],
  });
}

/**
 * Application logger instance
 */
export const logger = createLogger();

/**
 * Create a child logger with additional context
 */
export function createChildLogger(context: Record<string, unknown>): winston.Logger {
  return logger.child(context);
}
