/**
 * Error handling utilities for API responses
 */

interface FastAPIValidationError {
  loc: (string | number)[];
  msg: string;
  type: string;
}

interface APIErrorResponse {
  detail: string | FastAPIValidationError[] | unknown;
}

/**
 * Extracts a user-friendly error message from FastAPI error responses
 * Handles both simple string errors and FastAPI validation error arrays
 */
export function extractErrorMessage(errorData: APIErrorResponse): string {
  if (!errorData.detail) {
    return 'Unknown error';
  }

  // Simple string error
  if (typeof errorData.detail === 'string') {
    return errorData.detail;
  }

  // FastAPI validation errors come as an array
  if (Array.isArray(errorData.detail)) {
    return errorData.detail.map((err: FastAPIValidationError) => {
      const field = err.loc ? err.loc.join(' -> ') : 'Unknown field';
      return `${field}: ${err.msg}`;
    }).join('\n');
  }

  // Fallback for other object types
  return JSON.stringify(errorData.detail);
}

/**
 * Handles API errors by extracting the message and showing an alert
 */
export function handleAPIError(errorData: APIErrorResponse, context: string): void {
  const errorMessage = extractErrorMessage(errorData);
  alert(`${context}:\n\n${errorMessage}`);
}
