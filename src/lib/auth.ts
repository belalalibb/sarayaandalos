// Auth helpers using Web Crypto (PBKDF2) - Cloudflare Workers compatible

const ITERATIONS = 100_000

function bufToHex(buf: ArrayBuffer): string {
  return Array.from(new Uint8Array(buf)).map(b => b.toString(16).padStart(2, '0')).join('')
}

function hexToBuf(hex: string): Uint8Array {
  const arr = new Uint8Array(hex.length / 2)
  for (let i = 0; i < arr.length; i++) arr[i] = parseInt(hex.slice(i * 2, i * 2 + 2), 16)
  return arr
}

export async function hashPassword(password: string): Promise<string> {
  const salt = crypto.getRandomValues(new Uint8Array(16))
  const key = await crypto.subtle.importKey('raw', new TextEncoder().encode(password), 'PBKDF2', false, ['deriveBits'])
  const bits = await crypto.subtle.deriveBits(
    { name: 'PBKDF2', salt, iterations: ITERATIONS, hash: 'SHA-256' }, key, 256
  )
  return `pbkdf2$${ITERATIONS}$${bufToHex(salt.buffer as ArrayBuffer)}$${bufToHex(bits)}`
}

export async function verifyPassword(password: string, stored: string): Promise<boolean> {
  try {
    const [scheme, iterStr, saltHex, hashHex] = stored.split('$')
    if (scheme !== 'pbkdf2') return false
    const salt = hexToBuf(saltHex)
    const key = await crypto.subtle.importKey('raw', new TextEncoder().encode(password), 'PBKDF2', false, ['deriveBits'])
    const bits = await crypto.subtle.deriveBits(
      { name: 'PBKDF2', salt: salt as unknown as ArrayBuffer, iterations: parseInt(iterStr), hash: 'SHA-256' }, key, 256
    )
    const computed = bufToHex(bits)
    if (computed.length !== hashHex.length) return false
    let diff = 0
    for (let i = 0; i < computed.length; i++) diff |= computed.charCodeAt(i) ^ hashHex.charCodeAt(i)
    return diff === 0
  } catch {
    return false
  }
}

export function generateSessionId(): string {
  const bytes = crypto.getRandomValues(new Uint8Array(32))
  return bufToHex(bytes.buffer as ArrayBuffer)
}

export function generateRequestId(): string {
  const bytes = crypto.getRandomValues(new Uint8Array(4))
  return 'RQ-' + Date.now().toString(36).toUpperCase() + '-' + bufToHex(bytes.buffer as ArrayBuffer).slice(0, 6).toUpperCase()
}

// Role permissions
export const PERMISSIONS: Record<string, string[]> = {
  super_admin: ['*'],
  content_manager: ['products', 'categories', 'services', 'projects', 'home', 'media'],
  sales: ['leads'],
  editor: ['products', 'categories', 'services', 'projects', 'home']
}

export function hasPermission(role: string, resource: string): boolean {
  const perms = PERMISSIONS[role] || []
  return perms.includes('*') || perms.includes(resource)
}
