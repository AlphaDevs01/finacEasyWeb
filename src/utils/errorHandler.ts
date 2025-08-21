import { AxiosError } from 'axios';

export interface AppError {
  message: string;
  code?: string;
  status?: number;
  details?: any;
}

export class ErrorHandler {
  static handle(error: unknown): AppError {
    console.error('Error occurred:', error);

    // Axios errors
    if (error instanceof AxiosError) {
      return this.handleAxiosError(error);
    }

    // Network errors
    if (error instanceof TypeError && error.message.includes('fetch')) {
      return {
        message: 'Erro de conexão. Verifique sua internet e tente novamente.',
        code: 'NETWORK_ERROR'
      };
    }

    // Generic errors
    if (error instanceof Error) {
      return {
        message: error.message || 'Ocorreu um erro inesperado',
        code: 'GENERIC_ERROR'
      };
    }

    // Unknown errors
    return {
      message: 'Ocorreu um erro inesperado',
      code: 'UNKNOWN_ERROR',
      details: error
    };
  }

  private static handleAxiosError(error: AxiosError): AppError {
    const status = error.response?.status;
    const data = error.response?.data as any;

    switch (status) {
      case 400:
        return {
          message: data?.error || 'Dados inválidos enviados',
          code: 'BAD_REQUEST',
          status
        };

      case 401:
        return {
          message: 'Sessão expirada. Faça login novamente.',
          code: 'UNAUTHORIZED',
          status
        };

      case 403:
        return {
          message: 'Você não tem permissão para realizar esta ação',
          code: 'FORBIDDEN',
          status
        };

      case 404:
        return {
          message: 'Recurso não encontrado',
          code: 'NOT_FOUND',
          status
        };

      case 422:
        return {
          message: data?.error || 'Dados de entrada inválidos',
          code: 'VALIDATION_ERROR',
          status,
          details: data?.details
        };

      case 429:
        return {
          message: 'Muitas tentativas. Tente novamente em alguns minutos.',
          code: 'RATE_LIMIT',
          status
        };

      case 500:
        return {
          message: 'Erro interno do servidor. Tente novamente mais tarde.',
          code: 'INTERNAL_SERVER_ERROR',
          status
        };

      case 503:
        return {
          message: 'Serviço temporariamente indisponível',
          code: 'SERVICE_UNAVAILABLE',
          status
        };

      default:
        return {
          message: data?.error || error.message || 'Erro de comunicação com o servidor',
          code: 'HTTP_ERROR',
          status
        };
    }
  }

  static isRetryable(error: AppError): boolean {
    const retryableCodes = ['NETWORK_ERROR', 'INTERNAL_SERVER_ERROR', 'SERVICE_UNAVAILABLE'];
    const retryableStatuses = [500, 502, 503, 504];
    
    return retryableCodes.includes(error.code || '') || 
           retryableStatuses.includes(error.status || 0);
  }

  static getRetryDelay(attempt: number): number {
    // Exponential backoff: 1s, 2s, 4s, 8s, 16s
    return Math.min(1000 * Math.pow(2, attempt), 16000);
  }
}

export const withRetry = async <T>(
  fn: () => Promise<T>,
  maxAttempts: number = 3
): Promise<T> => {
  let lastError: AppError;

  for (let attempt = 0; attempt < maxAttempts; attempt++) {
    try {
      return await fn();
    } catch (error) {
      lastError = ErrorHandler.handle(error);
      
      if (attempt === maxAttempts - 1 || !ErrorHandler.isRetryable(lastError)) {
        throw lastError;
      }

      const delay = ErrorHandler.getRetryDelay(attempt);
      await new Promise(resolve => setTimeout(resolve, delay));
    }
  }

  throw lastError!;
};