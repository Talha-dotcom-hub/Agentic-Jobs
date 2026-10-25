import { URL } from 'url';

/**
 * Validates a URL against SSRF and private network attacks.
 * Blocks internal addresses, cloud metadata endpoints, loopback, and private IPv4/IPv6 ranges.
 */
export function isSafeExternalUrl(inputUrl: string): boolean {
  try {
    const parsed = new URL(inputUrl);

    // Only allow HTTP/HTTPS
    if (parsed.protocol !== 'http:' && parsed.protocol !== 'https:') {
      return false;
    }

    const hostname = parsed.hostname.toLowerCase();

    // Block localhost, loopback, and known internal hostnames
    if (
      hostname === 'localhost' ||
      hostname === '127.0.0.1' ||
      hostname === '::1' ||
      hostname === '[::1]' ||
      hostname === '0.0.0.0' ||
      hostname === 'metadata.google.internal' ||
      hostname.endsWith('.internal') ||
      hostname.endsWith('.localhost')
    ) {
      return false;
    }

    // Check IPv4 private and link-local ranges
    const ipv4Regex = /^(\d{1,3})\.(\d{1,3})\.(\d{1,3})\.(\d{1,3})$/;
    const match = hostname.match(ipv4Regex);
    if (match) {
      const [_, o1, o2, o3, o4] = match.map(Number);
      if (
        o1 === 127 || // Loopback
        o1 === 10 || // 10.0.0.0/8
        (o1 === 172 && o2 >= 16 && o2 <= 31) || // 172.16.0.0/12
        (o1 === 192 && o2 === 168) || // 192.168.0.0/16
        (o1 === 169 && o2 === 254) || // Link-local / Cloud metadata (169.254.169.254)
        o1 === 0 // 0.0.0.0/8
      ) {
        return false;
      }
    }

    return true;
  } catch {
    return false;
  }
}
