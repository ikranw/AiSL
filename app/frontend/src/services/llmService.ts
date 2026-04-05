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
  const response = await fetch(`${API_BASE_URL}/api/translate`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({ text }),
  });

  const data = await response.json();

  if (!response.ok) {
    throw new Error(data.error || 'Translation failed.');
  }

  return data as TranslateResponse;
}
