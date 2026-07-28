/**
 * Cross-origin safe clipboard utility
 * navigator.clipboard.writeText() only works on HTTPS / secure contexts.
 * This utility falls back to document.execCommand('copy') for HTTP environments (UAT/Local).
 */
export const copyToClipboard = async (text) => {
  const str = String(text ?? '');
  if (!str) return;

  if (navigator.clipboard && window.isSecureContext) {
    try {
      await copyToClipboard(str);
      return;
    } catch (err) {
      console.warn('navigator.clipboard.writeText failed, attempting execCommand fallback:', err);
    }
  }

  // Fallback for HTTP (UAT, IP-based access) using execCommand
  const textArea = document.createElement('textarea');
  textArea.value = str;
  textArea.style.position = 'fixed';
  textArea.style.left = '-9999px';
  textArea.style.top = '-9999px';
  textArea.style.opacity = '0';
  document.body.appendChild(textArea);
  textArea.focus();
  textArea.select();

  try {
    document.execCommand('copy');
  } catch (err) {
    console.error('execCommand copy failed:', err);
  } finally {
    document.body.removeChild(textArea);
  }
};
