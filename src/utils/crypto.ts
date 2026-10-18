// ─── Web Crypto PBKDF2 Password Hashing Utility ─────────────────────────────
// Prototype security utility using PBKDF2 with SHA-256 and cryptographic salt.
// Production multi-user deployments require a dedicated backend.

export async function generateSalt(length = 16): Promise<string> {
  const bytes = new Uint8Array(length);
  window.crypto.getRandomValues(bytes);
  return Array.from(bytes).map((b) => b.toString(16).padStart(2, '0')).join('');
}

export async function hashPassword(password: string, existingSalt?: string): Promise<{ hash: string; salt: string }> {
  const saltHex = existingSalt || (await generateSalt(16));
  const saltBytes = new Uint8Array(saltHex.match(/.{1,2}/g)?.map((byte) => parseInt(byte, 16)) || []);

  const enc = new TextEncoder();
  const keyMaterial = await window.crypto.subtle.importKey(
    'raw',
    enc.encode(password),
    'PBKDF2',
    false,
    ['deriveBits']
  );

  const derivedBits = await window.crypto.subtle.deriveBits(
    {
      name: 'PBKDF2',
      salt: saltBytes,
      iterations: 100000,
      hash: 'SHA-256',
    },
    keyMaterial,
    256
  );

  const hashArray = Array.from(new Uint8Array(derivedBits));
  const hashHex = hashArray.map((b) => b.toString(16).padStart(2, '0')).join('');

  return { hash: hashHex, salt: saltHex };
}

export async function verifyPassword(password: string, hash: string, salt: string): Promise<boolean> {
  try {
    const { hash: computedHash } = await hashPassword(password, salt);
    return computedHash === hash;
  } catch {
    return false;
  }
}
