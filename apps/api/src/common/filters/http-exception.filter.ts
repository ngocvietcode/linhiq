// ═══════════════════════════════════════════
// Global HTTP Exception Filter
// Strips stack traces in production
// ═══════════════════════════════════════════

import {
  ExceptionFilter,
  Catch,
  ArgumentsHost,
  HttpException,
  HttpStatus,
  Logger,
} from '@nestjs/common';
import type { Response } from 'express';

@Catch()
export class GlobalExceptionFilter implements ExceptionFilter {
  private readonly logger = new Logger(GlobalExceptionFilter.name);

  catch(exception: unknown, host: ArgumentsHost) {
    const ctx = host.switchToHttp();
    const response = ctx.getResponse<Response>();

    let status = HttpStatus.INTERNAL_SERVER_ERROR;
    let message = 'Internal server error';

    if (exception instanceof HttpException) {
      status = exception.getStatus();
      const exResponse = exception.getResponse();
      message =
        typeof exResponse === 'string'
          ? exResponse
          : (exResponse as any).message || message;
    }

    // Always log the full error with stack trace on the server
    this.logger.error(
      `[${status}] ${message}`,
      exception instanceof Error ? exception.stack : undefined,
    );

    // Only expose stack traces in development
    const isDev = process.env.NODE_ENV !== 'production';

    response.status(status).json({
      statusCode: status,
      message,
      ...(isDev && exception instanceof Error && { stack: exception.stack }),
      timestamp: new Date().toISOString(),
    });
  }
}
