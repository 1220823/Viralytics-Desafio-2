/**
 * API configuration and utilities
 */

export const API_BASE_URL = 'http://localhost:8000';

export const API_ENDPOINTS = {
  root: '/',
  allData: '/allData',
  campaigns: '/campaigns',
  ads: '/ads',
  optimizeGA: '/optimize_marketing_allocation',
  optimizeTS: '/optimize_tabu_search',
  compare: '/compare_algorithms',
} as const;

/**
 * Helper to build full API URL
 */
export function apiUrl(endpoint: keyof typeof API_ENDPOINTS | string): string {
  const path = API_ENDPOINTS[endpoint as keyof typeof API_ENDPOINTS] ?? endpoint;
  return `${API_BASE_URL}${path}`;
}

/**
 * Standard fetch wrapper with JSON handling
 */
export async function apiFetch<T>(
  endpoint: keyof typeof API_ENDPOINTS | string,
  options?: RequestInit
): Promise<{ ok: true; data: T } | { ok: false; error: unknown; status: number }> {
  try {
    const response = await fetch(apiUrl(endpoint), {
      ...options,
      headers: {
        'Content-Type': 'application/json',
        ...options?.headers,
      },
    });

    const data = await response.json();

    if (!response.ok) {
      return { ok: false, error: data, status: response.status };
    }

    return { ok: true, data };
  } catch (error) {
    console.error(`API fetch failed for ${endpoint}:`, error);
    throw error;
  }
}
