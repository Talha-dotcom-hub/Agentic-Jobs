import { isIP } from 'node:net';
import { URL } from 'node:url';

function ipv4ToNumber(address: string): number {
  return address.split('.').reduce((result, part) => ((result << 8) | Number(part)) >>> 0, 0);
}

function isBlockedIpv4(address: string): boolean {
  const value = ipv4ToNumber(address);
  const blockedSubnets: Array<[string, number]> = [['0.0.0.0',8],['10.0.0.0',8],['100.64.0.0',10],['127.0.0.0',8],['169.254.0.0',16],['172.16.0.0',12],['192.0.0.0',24],['192.0.2.0',24],['192.88.99.0',24],['192.168.0.0',16],['198.18.0.0',15],['198.51.100.0',24],['203.0.113.0',24],['224.0.0.0',4],['240.0.0.0',4]];
  return blockedSubnets.some(([network,prefix]) => { const mask=(0xffffffff << (32-prefix)) >>> 0; return (value & mask)===(ipv4ToNumber(network)&mask); });
}

function isPublicIpv6(address: string): boolean {
  const normalized=address.toLowerCase();
  if (!/^[23]/.test(normalized)) return false;
  if (normalized.startsWith('2001:db8:') || normalized==='2001:db8::' || normalized.startsWith('2001:0:') || normalized.startsWith('2002:')) return false;
  return true;
}

/** Rejects non-HTTP schemes, credentials, local/reserved hostnames, and non-public IP literals.
 * DNS is not resolved here. Current callers use known provider hosts; arbitrary URL-fetch features
 * must resolve/pin addresses and revalidate every redirect destination. */
export function isSafeExternalUrl(inputUrl: string): boolean {
  try {
    const parsed=new URL(inputUrl);
    if ((parsed.protocol!=='http:' && parsed.protocol!=='https:') || parsed.username || parsed.password) return false;
    const hostname=parsed.hostname.toLowerCase().replace(/\.$/,'');
    if (!hostname || hostname==='localhost' || hostname.endsWith('.localhost') || hostname.endsWith('.local') || hostname.endsWith('.lan') || hostname.endsWith('.home') || hostname.endsWith('.internal') || hostname.endsWith('.test') || hostname.endsWith('.example') || hostname.endsWith('.invalid') || hostname==='metadata.google.internal') return false;
    const address=hostname.startsWith('[')&&hostname.endsWith(']')?hostname.slice(1,-1):hostname;
    const ipVersion=isIP(address);
    if (ipVersion===4) return !isBlockedIpv4(address);
    if (ipVersion===6) return isPublicIpv6(address);
    if (!hostname.includes('.')) return false;
    return true;
  } catch { return false; }
}
