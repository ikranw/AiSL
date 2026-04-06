import { TranslateResponse } from '../types/translate';

function getApiBaseUrl(): string {
  const configuredBaseUrl = import.meta.env.VITE_API_URL?.trim();
  if (configuredBaseUrl) {
    return configuredBaseUrl.replace(/\/$/, '');
  }

  // Default to same-origin so production can proxy `/api/*` through the frontend
  // service without exposing the backend directly to the browser.
  return '';
}

const API_BASE_URL = getApiBaseUrl();

export async function translateEnglishToASL(text: string): Promise<TranslateResponse> {
  let response: Response;

  try {
    response = await fetch(`${API_BASE_URL}/api/translate`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ text }),
    });
  } catch {
    throw new Error('Could not reach the backend. Make sure Flask is running on port 8000.');
  }

  const responseText = await response.text();
  let data: unknown = null;

  if (responseText) {
    try {
      data = JSON.parse(responseText);
    } catch {
      if (!response.ok) {
        throw new Error('The backend returned a non-JSON error. Check the Vite proxy and Flask logs.');
      }

      throw new Error('The backend returned an unexpected response.');
    }
  }

  if (!response.ok) {
    const errorMessage =
      data && typeof data === 'object' && 'error' in data && typeof data.error === 'string'
        ? data.error
        : 'Translation failed.';

    throw new Error(errorMessage);
  }

  return data as TranslateResponse;
}
