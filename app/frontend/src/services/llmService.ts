import { TranslateResponse } from '../types/translate';

const API_BASE_URL = import.meta.env.VITE_API_URL ?? 'http://localhost:8000';

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