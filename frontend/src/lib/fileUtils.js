// File and folder handling utilities

export async function hashFiles(files) {
  const encoder = new TextEncoder();
  let combinedContent = '';
  
  // Sort files by name for consistent hashing
  const sortedFiles = Array.from(files).sort((a, b) => a.name.localeCompare(b.name));
  
  for (const file of sortedFiles) {
    const content = await file.arrayBuffer();
    const hash = await crypto.subtle.digest('SHA-256', content);
    const hashHex = Array.from(new Uint8Array(hash))
      .map(b => b.toString(16).padStart(2, '0'))
      .join('');
    combinedContent += `${file.name}:${hashHex}`;
  }
  
  const finalHash = await crypto.subtle.digest('SHA-256', encoder.encode(combinedContent));
  return '0x' + Array.from(new Uint8Array(finalHash))
    .map(b => b.toString(16).padStart(2, '0'))
    .join('');
}

export function formatFileSize(bytes) {
  if (bytes === 0) return '0 Bytes';
  const k = 1024;
  const sizes = ['Bytes', 'KB', 'MB', 'GB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
}

export function getFileIcon(fileName) {
  const ext = fileName.split('.').pop()?.toLowerCase();
  const iconMap = {
    'pdf': '📄',
    'doc': '📝', 'docx': '📝',
    'xls': '📊', 'xlsx': '📊',
    'ppt': '📊', 'pptx': '📊',
    'jpg': '🖼️', 'jpeg': '🖼️', 'png': '🖼️', 'gif': '🖼️',
    'mp4': '🎥', 'avi': '🎥', 'mov': '🎥',
    'mp3': '🎵', 'wav': '🎵',
    'zip': '📦', 'rar': '📦',
    'js': '💻', 'ts': '💻', 'py': '💻', 'java': '💻',
    'html': '🌐', 'css': '🎨',
  };
  return iconMap[ext] || '📄';
}
