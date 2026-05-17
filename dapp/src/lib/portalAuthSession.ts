const STORAGE_KEY = 'rbac_portal_auth';

export interface PortalAuthSession {
  wallet: string;
  verifiedAt: string;
  displayName?: string;
}

export function readPortalAuthSession(): PortalAuthSession | null {
  if (typeof window === 'undefined') return null;
  try {
    const raw = sessionStorage.getItem(STORAGE_KEY);
    if (!raw) return null;
    const parsed = JSON.parse(raw) as PortalAuthSession;
    if (!parsed?.wallet) return null;
    return parsed;
  } catch {
    return null;
  }
}

export function writePortalAuthSession(session: PortalAuthSession) {
  sessionStorage.setItem(STORAGE_KEY, JSON.stringify(session));
}

export function clearPortalAuthSession() {
  sessionStorage.removeItem(STORAGE_KEY);
}

export function isPortalSessionValidForWallet(account: string | null): boolean {
  if (!account) return false;
  const session = readPortalAuthSession();
  if (!session) return false;
  return session.wallet.toLowerCase() === account.toLowerCase();
}
