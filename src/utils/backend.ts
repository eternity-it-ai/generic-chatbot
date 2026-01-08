export function arrayBufferToBase64(buf: ArrayBuffer): string {
  // Works for reasonably sized CSVs. For very large files, switch to chunked conversion.
  const bytes = new Uint8Array(buf);
  let binary = "";
  for (let i = 0; i < bytes.length; i++)
    binary += String.fromCharCode(bytes[i]);
  return btoa(binary);
}
