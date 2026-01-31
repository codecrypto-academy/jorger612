export function formatAddress(addr) {
  if (!addr || typeof addr !== 'string') return '';
  if (addr.length < 12) return addr;
  return `${addr.slice(0, 6)}...${addr.slice(-4)}`;
}

export function formatTimestamp(unixSeconds) {
  if (!unixSeconds) return '';
  const d = new Date(Number(unixSeconds) * 1000);
  const time = d.toLocaleTimeString('es-ES', { hour: '2-digit', minute: '2-digit' });
  const date = d.toLocaleDateString('es-ES', { day: 'numeric', month: 'short' });
  return `${time} · ${date}`;
}

export function shortenAddress(addr) {
  return formatAddress(addr);
}
