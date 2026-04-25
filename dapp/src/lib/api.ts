export const API_URL = process.env.NEXT_PUBLIC_API_URL || '/api';

export async function apiGet(path: string) {
  const res = await fetch(`${API_URL}${path}`, {
    method: 'GET',
    cache: 'no-store',
    headers: { Accept: 'application/json' },
  });
  if (!res.ok) {
    throw new Error(`API ${res.status}: ${await res.text()}`);
  }
  return res.json();
}
