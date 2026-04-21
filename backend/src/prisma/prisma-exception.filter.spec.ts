import { ArgumentsHost } from '@nestjs/common';
import { PrismaClientKnownRequestError } from '@prisma/client/runtime/client';
import { PrismaExceptionFilter } from './prisma-exception.filter';

function makeHost(mockResponse: object): ArgumentsHost {
  return {
    switchToHttp: () => ({
      getResponse: () => mockResponse,
    }),
  } as unknown as ArgumentsHost;
}

describe('PrismaExceptionFilter', () => {
  let filter: PrismaExceptionFilter;
  let mockResponse: { status: jest.Mock; json: jest.Mock };

  beforeEach(() => {
    filter = new PrismaExceptionFilter();
    mockResponse = {
      status: jest.fn().mockReturnThis(),
      json: jest.fn(),
    };
  });

  it('maps P2002 (unique constraint) to HTTP 409', () => {
    const error = new PrismaClientKnownRequestError('Unique constraint failed', {
      code: 'P2002',
      clientVersion: '7.x',
    });
    filter.catch(error, makeHost(mockResponse));
    expect(mockResponse.status).toHaveBeenCalledWith(409);
    expect(mockResponse.json).toHaveBeenCalledWith(
      expect.objectContaining({ statusCode: 409 }),
    );
  });

  it('maps P2025 (record not found) to HTTP 404', () => {
    const error = new PrismaClientKnownRequestError('Record not found', {
      code: 'P2025',
      clientVersion: '7.x',
    });
    filter.catch(error, makeHost(mockResponse));
    expect(mockResponse.status).toHaveBeenCalledWith(404);
    expect(mockResponse.json).toHaveBeenCalledWith(
      expect.objectContaining({ statusCode: 404 }),
    );
  });

  it('falls back to HTTP 500 for unknown Prisma error codes', () => {
    const error = new PrismaClientKnownRequestError('Unknown error', {
      code: 'P9999',
      clientVersion: '7.x',
    });
    filter.catch(error, makeHost(mockResponse));
    expect(mockResponse.status).toHaveBeenCalledWith(500);
  });
});
