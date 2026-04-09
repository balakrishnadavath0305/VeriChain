// IPFS upload via Pinata free tier
// Requires VITE_PINATA_JWT in frontend/.env

export async function uploadFile(file) {
  const jwt = import.meta.env.VITE_PINATA_JWT;

  // Mock fallback for development (no JWT set)
  if (!jwt || jwt === 'mock_token_for_development') {
    console.log('🔧 Mock IPFS upload (no Pinata JWT set)');
    const mockCid = 'bafybeig' + Math.random().toString(36).substring(2, 15);
    return mockCid;
  }

  const formData = new FormData();
  formData.append('file', file);
  formData.append(
    'pinataMetadata',
    JSON.stringify({ name: file.name || 'verichain-upload' })
  );
  formData.append(
    'pinataOptions',
    JSON.stringify({ cidVersion: 1 })
  );

  const response = await fetch(
    'https://api.pinata.cloud/pinning/pinFileToIPFS',
    {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${jwt}`,
      },
      body: formData,
    }
  );

  if (!response.ok) {
    const err = await response.text();
    throw new Error(`Pinata upload failed: ${response.status} — ${err}`);
  }

  const data = await response.json();
  return data.IpfsHash; // e.g. "bafkreihdwdcef..."
}
