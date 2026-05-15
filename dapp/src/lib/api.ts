export const API_URL = process.env.NEXT_PUBLIC_API_URL || '/api';

/** Query `?account=` para lecturas RBAC acotadas a la wallet conectada. */
export function rbacAccountQuery(account: string | null | undefined): string {
  if (!account?.trim()) return '';
  return `?account=${encodeURIComponent(account.trim())}`;
}

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

export async function apiPost(path: string) {
  const res = await fetch(`${API_URL}${path}`, {
    method: 'POST',
    cache: 'no-store',
    headers: { Accept: 'application/json' },
  });
  if (!res.ok) {
    throw new Error(`API ${res.status}: ${await res.text()}`);
  }
  return res.json();
}
