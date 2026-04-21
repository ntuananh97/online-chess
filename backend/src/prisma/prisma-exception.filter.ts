import {
  ArgumentsHost,
  Catch,
  ExceptionFilter,
  HttpStatus,
  Logger,
} from '@nestjs/common';
import { PrismaClientKnownRequestError } from '@prisma/client/runtime/client';
import { Response } from 'express';

@Catch(PrismaClientKnownRequestError)
export class PrismaExceptionFilter implements ExceptionFilter {
  private readonly logger = new Logger(PrismaExceptionFilter.name);

  catch(exception: PrismaClientKnownRequestError, host: ArgumentsHost): void {
    const ctx = host.switchToHttp();
    const response = ctx.getResponse<Response>();

    let status = HttpStatus.INTERNAL_SERVER_ERROR;
    let message = 'Internal server error';

    switch (exception.code) {
      case 'P2002':
        status = HttpStatus.CONFLICT;
        message = 'Resource already exists';
        break;
      case 'P2025':
        status = HttpStatus.NOT_FOUND;
        message = 'Resource not found';
        break;
      default:
        this.logger.error(
          `Unhandled Prisma error [${exception.code}]: ${exception.message}`,
        );
    }

    response.status(status).json({ statusCode: status, message });
  }
}
