export class DownloadHelper {
  /**
   * Safely downloads a blob file in any browser, iframe, or Android WebView environment
   */
  static download(blob: Blob, fileName: string, mimeType?: string): string {
    // Determine proper Android / package MIME type
    let finalMime = mimeType || blob.type;
    if (fileName.endsWith('.apk')) {
      finalMime = 'application/vnd.android.package-archive';
    } else if (fileName.endsWith('.aab')) {
      finalMime = 'application/octet-stream';
    } else if (fileName.endsWith('.zip')) {
      finalMime = 'application/zip';
    } else if (fileName.endsWith('.keystore') || fileName.endsWith('.jks')) {
      finalMime = 'application/x-java-keystore';
    }

    const typedBlob = new Blob([blob], { type: finalMime });

    // 1. If running inside ESDY native Android app wrapper with AndroidBridge
    const win = window as any;
    if (win.AndroidBridge && typeof win.AndroidBridge.saveFile === 'function') {
      try {
        const reader = new FileReader();
        reader.onload = () => {
          const base64 = String(reader.result).split(',')[1];
          win.AndroidBridge.saveFile(fileName, finalMime, base64);
        };
        reader.readAsDataURL(typedBlob);
        return '';
      } catch (e) {
        console.warn('AndroidBridge saveFile failed, falling back to browser download:', e);
      }
    }

    // 2. Standard Browser / WebView download with safe URL lifecycle
    const url = URL.createObjectURL(typedBlob);
    const link = document.createElement('a');
    link.style.display = 'none';
    link.href = url;
    link.download = fileName;
    link.setAttribute('download', fileName);
    link.setAttribute('target', '_blank');
    link.setAttribute('rel', 'noopener noreferrer');

    document.body.appendChild(link);

    // Trigger download
    try {
      link.click();
    } catch (e) {
      // Fallback for sandboxed iframes
      window.open(url, '_blank');
    }

    // CRITICAL: DO NOT revoke URL immediately!
    // Immediate revocation cancels the download in Chrome, Safari, and Android WebViews.
    // Retain object URL for 90 seconds.
    setTimeout(() => {
      try {
        link.remove();
        URL.revokeObjectURL(url);
      } catch {
        // ignore
      }
    }, 90000);

    return url;
  }
}
