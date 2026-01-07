/**
 * Formats a date into a standard string format (e.g., "01 Jan 2026 12:00:00").
 * Returns a placeholder '—' if the date is null.
 * 
 * @param date - The date to format
 * @returns Formatted date string
 */
export function formatDateTime(date: Date | null): string {
  if (!date) return '—';
  return date.toLocaleTimeString('en-GB', {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit',
    hour12: false,
  }).replace(',', '');
}

/**
 * Formats file size in bytes to human-readable string (e.g., "1.5 MB").
 * 
 * @param bytes - Size in bytes
 * @returns Formatted size string
 */
export function formatFileSize(bytes: number): string {
  if (bytes === 0) return "0 Bytes"
  const k = 1024
  const sizes = ["Bytes", "KB", "MB", "GB"]
  const i = Math.floor(Math.log(bytes) / Math.log(k))
  return Math.round((bytes / Math.pow(k, i)) * 100) / 100 + " " + sizes[i]
}
