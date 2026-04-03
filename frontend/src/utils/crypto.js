import { fetchPublicKey } from '../services/api'

/**
 * Client-Side E2EE Utility (Layer 1 Privacy Bridge)
 * 1. Generates a random AES-256-GCM key.
 * 2. Encrypts the evidence payload.
 * 3. Hashes the original payload for integrity.
 * 4. Encrypts the AES key with the Backend's RSA Public Key (RSA-OAEP).
 * 5. Returns a Pydantic-compliant SubmitReportRequest object.
 */

export async function encryptReport(formData) {
  try {
    // 1. Get Backend Public Key
    const { public_key: publicKeyPem } = await fetchPublicKey()
    
    // 2. Prepare Payload (Evidence)
    let rawPayload;
    if (formData.evidenceType === 'url') {
      rawPayload = new TextEncoder().encode(formData.url)
    } else if (formData.evidenceType === 'text') {
      rawPayload = new TextEncoder().encode(formData.textContent)
    } else if (formData.file) {
      // Stripping EXIF metadata for images using Canvas API
      const cleanBlob = await stripImageMetadata(formData.file)
      rawPayload = new Uint8Array(await cleanBlob.arrayBuffer())
    } else {
      throw new Error('No evidence content found in form data.')
    }

    // 3. Compute SHA-256 Hash of original payload
    const hashBuffer = await crypto.subtle.digest('SHA-256', rawPayload)
    const originalHash = Array.from(new Uint8Array(hashBuffer))
      .map(b => b.toString(16).padStart(2, '0'))
      .join('')

    // 4. Generate random AES-256-GCM key
    const aesKey = await crypto.subtle.generateKey(
      { name: 'AES-GCM', length: 256 },
      true,
      ['encrypt']
    )

    // 5. Encrypt Payload
    const iv = crypto.getRandomValues(new Uint8Array(12))
    const encryptedBuffer = await crypto.subtle.encrypt(
      { name: 'AES-GCM', iv },
      aesKey,
      rawPayload
    )

    // The result contains the tag appended to the ciphertext
    const fullEncryptedArray = new Uint8Array(encryptedBuffer)
    const tagLength = 16
    const ciphertext = fullEncryptedArray.slice(0, -tagLength)
    const tag = fullEncryptedArray.slice(-tagLength)

    // 6. Encrypt AES Key with RSA Public Key
    const exportedAesKey = await crypto.subtle.exportKey('raw', aesKey)
    const importedPublicKey = await importRsaPublicKey(publicKeyPem)
    
    const encryptedAesKeyBuffer = await crypto.subtle.encrypt(
      { name: 'RSA-OAEP' },
      importedPublicKey,
      exportedAesKey
    )

    // 7. Base64 Encode Everything for Transmission
    return {
      encrypted_payload: b64Encode(ciphertext),
      encrypted_aes_key: b64Encode(new Uint8Array(encryptedAesKeyBuffer)),
      original_hash: originalHash,
      evidence_type: formData.evidenceType,
      description: formData.description,
      aes_iv: b64Encode(iv),
      aes_tag: b64Encode(tag)
    }
  } catch (err) {
    console.error('Encryption failed:', err)
    throw new Error(`Privacy encryption failed: ${err.message}`)
  }
}

/**
 * Helper to convert PEM string to a CryptoKey object
 */
async function importRsaPublicKey(pem) {
  const pemHeader = "-----BEGIN PUBLIC KEY-----";
  const pemFooter = "-----END PUBLIC KEY-----";
  const pemContents = pem
    .replace(pemHeader, "")
    .replace(pemFooter, "")
    .replace(/\s/g, "");
  
  const binaryDerString = window.atob(pemContents);
  const binaryDer = str2ab(binaryDerString);

  return await crypto.subtle.importKey(
    "spki",
    binaryDer,
    { name: "RSA-OAEP", hash: "SHA-256" },
    true,
    ["encrypt"]
  );
}

/**
 * Strips metadata from an image by re-rendering it through a canvas.
 * This is the only 100% reliable way to strip all EXIF, GPS, and device info
 * in a web browser without external libraries.
 */
async function stripImageMetadata(file) {
  if (!file.type.startsWith('image/')) {
    // If it's not an image (e.g., video), we keep the original for now
    // In a real prod environment, video stripping would use ffmpeg.wasm
    return file;
  }

  return new Promise((resolve) => {
    const reader = new FileReader();
    reader.onload = (e) => {
      const img = new Image();
      img.onload = () => {
        const canvas = document.createElement('canvas');
        canvas.width = img.width;
        canvas.height = img.height;
        const ctx = canvas.getContext('2d');
        ctx.drawImage(img, 0, 0);
        
        // Export to a clean blob (canvas.toBlob() is metadata-free)
        canvas.toBlob((blob) => {
          resolve(blob || file);
        }, file.type);
      };
      img.src = e.target.result;
    };
    reader.readAsDataURL(file);
  });
}

function b64Encode(buffer) {
  return btoa(String.fromCharCode(...new Uint8Array(buffer)));
}

function str2ab(str) {
  const buf = new ArrayBuffer(str.length);
  const bufView = new Uint8Array(buf);
  for (let i = 0, strLen = str.length; i < strLen; i++) {
    bufView[i] = str.charCodeAt(i);
  }
  return buf;
}
