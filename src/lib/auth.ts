// Auth helpers using Web Crypto (PBKDF2) - Cloudflare Workers compatible

const ITERATIONS = 100_000

function toHex(buf: ArrayBuffer): string {
  return [...new Uint8Array(buf)].map((b) => b.toString(16).padStart(2, '0')).join('')
}

function fromHex(hex: string): Uint8Array {
  const arr = new Uint8Array(hex.length / 2)
  for (let i = 0; i < arr.length; i++) arr[i] = parseInt(hex.substr(i * 2, 2), 16)
  return arr
}

async function pbkdf2(password: string, salt: Uint8Array): Promise<string> {
  const key = await crypto.subtle.importKey('raw', new TextEncoder().encode(password), 'PBKDF2', false, ['deriveBits'])
  const bits = await crypto.subtle.deriveBits(
    { name: 'PBKDF2', hash: 'SHA-256', salt: salt as BufferSource, iterations: ITERATIONS },
    key, 256
  )
  return toHex(bits)
}

export async function hashPassword(password: string): Promise<string> {
  const salt = crypto.getRandomValues(new Uint8Array(16))
  const hash = await pbkdf2(password, salt)
  return `pbkdf2$${ITERATIONS}$${toHex(salt.buffer)}$${hash}`
}

export async function verifyPassword(password: string, stored: string): Promise<boolean> {
  try {
    const [scheme, , saltHex, expected] = stored.split('$')
    if (scheme !== 'pbkdf2') return false
    const actual = await pbkdf2(password, fromHex(saltHex))
    if (actual.length !== expected.length) return false
    // constant-time compare
    let diff = 0
    for (let i = 0; i < actual.length; i++) diff |= actual.charCodeAt(i) ^ expected.charCodeAt(i)
    return diff === 0
  } catch {
    return false
  }
}

export function generateToken(): string {
  const bytes = crypto.getRandomValues(new Uint8Array(32))
  return [...bytes].map((b) => b.toString(16).padStart(2, '0')).join('')
}

// Role → allowed resources
const ROLE_PERMISSIONS: Record<string, string[]> = {
  super_admin: ['products', 'categories', 'services', 'projects', 'home', 'leads', 'settings', 'users', 'audit'],
  content_manager: ['products', 'categories', 'services', 'projects', 'home', 'settings'],
  sales: ['leads'],
  editor: ['products', 'categories']
}

export function hasPermission(role: string, resource: string): boolean {
  return (ROLE_PERMISSIONS[role] || []).includes(resource)
}

export function getRolePermissions(role: string): string[] {
  return ROLE_PERMISSIONS[role] || []
}
