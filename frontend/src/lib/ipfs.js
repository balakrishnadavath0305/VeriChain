// IPFS upload — proxied through your secure backend (Pinata JWT stays server-side)
const BACKEND_URL = import.meta.env.VITE_BACKEND_URL || 'http://localhost:4000';

export async function uploadFile(file) {
  const formData = new FormData();
  formData.append('file', file);

  const response = await fetch(`${BACKEND_URL}/api/upload`, {
    method: 'POST',
    body: formData,
  });

  if (!response.ok) {
    const err = await response.json().catch(() => ({ error: 'Upload failed' }));
    throw new Error(err.error || `Upload failed (${response.status})`);
  }

  const data = await response.json();
  return data.cid; // e.g. "bafkreihdwdcef..."
}
