/** Variables públicas inyectadas en build (next.config / Docker ARG). */
export const NETWORK_NAME =
  process.env.NEXT_PUBLIC_NETWORK_NAME?.trim() || `Cadena ${process.env.NEXT_PUBLIC_CHAIN_ID || '1337'}`;

export const CONTRACT_DISPLAY_NAME =
  process.env.NEXT_PUBLIC_CONTRACT_DISPLAY_NAME?.trim() || 'SecurityManager';
