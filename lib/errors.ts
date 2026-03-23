/**
 * Centralised error handling utilities.
 * Wrap every API call with `handleApiError` to get user-friendly messages.
 */

import axios, { type AxiosError } from "axios";

export interface ApiError {
  message: string;
  status?: number;
  code?: string;
}

interface ErrorResponseBody {
  error?: string;
  message?: string;
  details?: string;
}

/**
 * Extract a human-readable message from any thrown value.
 */
export function parseError(err: unknown): ApiError {
  if (axios.isAxiosError(err)) {
    const axiosErr = err as AxiosError<ErrorResponseBody>;
    const status = axiosErr.response?.status;
    const body = axiosErr.response?.data;
    const message =
      body?.error ??
      body?.message ??
      body?.details ??
      axiosErr.message ??
      "Error de conexión";

    // Map common HTTP status codes to friendly Spanish messages
    const statusMessages: Record<number, string> = {
      400: message !== axiosErr.message ? message : "Solicitud inválida",
      401: "Tu sesión ha expirado. Por favor inicia sesión nuevamente.",
      403: "No tienes permiso para realizar esta acción.",
      404: "El recurso solicitado no fue encontrado.",
      409: "Ya existe un conflicto con esta operación.",
      413: "El archivo es demasiado grande.",
      422: message !== axiosErr.message ? message : "Los datos enviados no son válidos.",
      429: "Demasiadas solicitudes. Por favor espera un momento.",
      500: "Error interno del servidor. Intenta de nuevo más tarde.",
      502: "El servidor no está disponible. Intenta de nuevo más tarde.",
      503: "El servicio no está disponible temporalmente.",
    };

    return {
      message: status ? (statusMessages[status] ?? message) : message,
      status,
      code: axiosErr.code,
    };
  }

  if (err instanceof Error) {
    return { message: err.message };
  }

  return { message: "Ha ocurrido un error inesperado." };
}

/**
 * Returns just the message string from any error.
 * Useful for displaying in toast notifications or form errors.
 */
export function getErrorMessage(err: unknown): string {
  return parseError(err).message;
}

/**
 * Type guard – check if an error is a 404 Not Found.
 */
export function isNotFound(err: unknown): boolean {
  return axios.isAxiosError(err) && err.response?.status === 404;
}

/**
 * Type guard – check if an error is an auth error (401/403).
 */
export function isAuthError(err: unknown): boolean {
  return (
    axios.isAxiosError(err) &&
    (err.response?.status === 401 || err.response?.status === 403)
  );
}

/**
 * Type guard – check if an error is a validation error (400/422).
 */
export function isValidationError(err: unknown): boolean {
  return (
    axios.isAxiosError(err) &&
    (err.response?.status === 400 || err.response?.status === 422)
  );
}

/**
 * Type guard – check if an error is a network/connection error.
 */
export function isNetworkError(err: unknown): boolean {
  return axios.isAxiosError(err) && !err.response;
}
