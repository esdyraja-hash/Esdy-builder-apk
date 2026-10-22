import JSZip from 'jszip';
import { HtmlStyleOptions } from '../types';

const MIME_MAP: Record<string, string> = {
  png: 'image/png',
  jpg: 'image/jpeg',
  jpeg: 'image/jpeg',
  gif: 'image/gif',
  webp: 'image/webp',
  svg: 'image/svg+xml',
  ico: 'image/x-icon',
  woff: 'font/woff',
  woff2: 'font/woff2',
  ttf: 'font/ttf',
  otf: 'font/otf',
  css: 'text/css',
  js: 'text/javascript',
  json: 'application/json',
  mp3: 'audio/mpeg',
  mp4: 'video/mp4',
};

const FONT_IMPORTS: Record<string, string> = {
  jakarta: '<link rel="preconnect" href="https://fonts.googleapis.com"><link rel="preconnect" href="https://fonts.gstatic.com" crossorigin><link href="https://fonts.googleapis.com/css2?family=Plus+Jakarta+Sans:wght@400;500;600;700;800&display=swap" rel="stylesheet"><style>body, button, input, select, textarea { font-family: "Plus Jakarta Sans", system-ui, sans-serif !important; }</style>',
  inter: '<link rel="preconnect" href="https://fonts.googleapis.com"><link rel="preconnect" href="https://fonts.gstatic.com" crossorigin><link href="https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700;800&display=swap" rel="stylesheet"><style>body, button, input, select, textarea { font-family: "Inter", system-ui, sans-serif !important; }</style>',
  poppins: '<link rel="preconnect" href="https://fonts.googleapis.com"><link rel="preconnect" href="https://fonts.gstatic.com" crossorigin><link href="https://fonts.googleapis.com/css2?family=Poppins:wght@400;500;600;700;800&display=swap" rel="stylesheet"><style>body, button, input, select, textarea { font-family: "Poppins", system-ui, sans-serif !important; }</style>',
  roboto: '<link rel="preconnect" href="https://fonts.googleapis.com"><link rel="preconnect" href="https://fonts.gstatic.com" crossorigin><link href="https://fonts.googleapis.com/css2?family=Roboto:wght@400;500;700&display=swap" rel="stylesheet"><style>body, button, input, select, textarea { font-family: "Roboto", system-ui, sans-serif !important; }</style>',
  system: '<style>body, button, input, select, textarea { font-family: system-ui, -apple-system, sans-serif !important; }</style>',
};

export class HtmlProcessor {
  /**
   * Reads an HTML file or ZIP archive and inlines local assets for mobile standalone runtime
   */
  static async processProjectFile(file: File): Promise<{
    html: string;
    detectedTitle: string;
    detectedIconDataUrl?: string;
    detectedPermissions: {
      internet: boolean;
      camera: boolean;
      location: boolean;
      microphone: boolean;
      notifications: boolean;
    };
    rawFiles?: { name: string; data: Uint8Array }[];
  }> {
    const isZip = /\.zip$/i.test(file.name);

    if (!isZip) {
      const text = await file.text();
      const detected = this.inspectHtml(text);
      return {
        html: text,
        detectedTitle: detected.title || file.name.replace(/\.[^.]+$/, ''),
        detectedIconDataUrl: detected.iconUrl,
        detectedPermissions: detected.permissions,
      };
    }

    // Zip extraction and bundling
    const zip = await JSZip.loadAsync(file);
    const fileNames = Object.keys(zip.files).filter(
      (n) => !zip.files[n].dir && !/^__MACOSX\//.test(n)
    );

    // Locate index.html
    const indexName = fileNames
      .filter((n) => /(^|\/)index\.html?$/i.test(n))
      .sort((a, b) => a.split('/').length - b.split('/').length)[0];

    if (!indexName) {
      throw new Error('No index.html found inside the ZIP project archive.');
    }

    const baseDir = indexName.includes('/')
      ? indexName.slice(0, indexName.lastIndexOf('/') + 1)
      : '';

    let indexHtml = await zip.file(indexName)!.async('string');

    // Extract all raw files for Gradle assets/ folder
    const rawFiles: { name: string; data: Uint8Array }[] = [];
    for (const name of fileNames) {
      const entry = zip.file(name);
      if (entry) {
        const data = await entry.async('uint8array');
        const relativeName = baseDir && name.startsWith(baseDir) ? name.slice(baseDir.length) : name;
        rawFiles.push({ name: relativeName, data });
      }
    }

    // Helper to resolve relative paths
    const resolvePath = (ref: string): string | null => {
      if (!ref || /^(https?:|data:|blob:|#|\/\/|mailto:|tel:|javascript:)/i.test(ref)) {
        return null;
      }
      const clean = ref.split('#')[0].split('?')[0];
      const full = baseDir ? (clean.startsWith('/') ? clean.slice(1) : baseDir + clean) : clean;
      
      const parts: string[] = [];
      full.split('/').forEach((p) => {
        if (p === '..') parts.pop();
        else if (p !== '.' && p !== '') parts.push(p);
      });
      const resolved = parts.join('/');

      return zip.file(resolved) ? resolved : null;
    };

    // Helper for data URIs
    const getDataUri = async (path: string): Promise<string> => {
      const ext = path.split('.').pop()?.toLowerCase() || '';
      const b64 = await zip.file(path)!.async('base64');
      const mime = MIME_MAP[ext] || 'application/octet-stream';
      return `data:${mime};base64,${b64}`;
    };

    // Inline CSS links
    indexHtml = await this.asyncReplace(
      indexHtml,
      /<link\b[^>]*rel=["']?stylesheet["']?[^>]*>/gi,
      async (tag) => {
        const hrefMatch = tag.match(/href=["']([^"']+)["']/i);
        const resolved = hrefMatch ? resolvePath(hrefMatch[1]) : null;
        if (!resolved) return tag;
        const cssContent = await zip.file(resolved)!.async('string');
        return `<style>\n${cssContent}\n</style>`;
      }
    );

    // Inline JS scripts
    indexHtml = await this.asyncReplace(
      indexHtml,
      /<script\b([^>]*?)\bsrc=["']([^"']+)["']([^>]*)>\s*<\/script>/gi,
      async (tag, pre, src, post) => {
        const resolved = resolvePath(src);
        if (!resolved) return tag;
        const jsContent = (await zip.file(resolved)!.async('string')).replace(/<\/script/gi, '<\\/script');
        return `<script${pre}${post}>\n${jsContent}\n</script>`;
      }
    );

    // Inline Images
    indexHtml = await this.asyncReplace(
      indexHtml,
      /(<(?:img|source)\b[^>]*?\bsrc=["'])([^"']+)(["'])/gi,
      async (match, p1, src, p2) => {
        const resolved = resolvePath(src);
        if (!resolved) return match;
        const uri = await getDataUri(resolved);
        return `${p1}${uri}${p2}`;
      }
    );

    // Look for icon inside zip
    let detectedIconDataUrl: string | undefined;
    const iconCandidates = fileNames.filter((n) =>
      /(icon|logo|favicon|apple-touch-icon)[^/]*\.(png|jpe?g|webp|svg)$/i.test(n)
    );
    if (iconCandidates.length > 0) {
      detectedIconDataUrl = await getDataUri(iconCandidates[0]);
    }

    const detected = this.inspectHtml(indexHtml);

    return {
      html: indexHtml,
      detectedTitle: detected.title || file.name.replace(/\.[^.]+$/, ''),
      detectedIconDataUrl: detectedIconDataUrl || detected.iconUrl,
      detectedPermissions: detected.permissions,
      rawFiles,
    };
  }

  /**
   * Scans HTML text for title, icon links, and web APIs that require Android permissions
   */
  static inspectHtml(html: string): {
    title: string;
    iconUrl?: string;
    permissions: {
      internet: boolean;
      camera: boolean;
      location: boolean;
      microphone: boolean;
      notifications: boolean;
    };
  } {
    const titleMatch =
      html.match(/<meta[^>]+name=["']application-name["'][^>]+content=["']([^"']+)["']/i) ||
      html.match(/<meta[^>]+name=["']apple-mobile-web-app-title["'][^>]+content=["']([^"']+)["']/i) ||
      html.match(/<title[^>]*>([^<]+)<\/title>/i);

    const title = titleMatch ? titleMatch[1].trim() : '';

    const iconMatch =
      html.match(/<link[^>]+rel=["'][^"']*icon[^"']*["'][^>]*href=["'](data:image\/[^"']+)["']/i) ||
      html.match(/<link[^>]+href=["'](data:image\/[^"']+)["'][^>]*rel=["'][^"']*icon/i);

    const iconUrl = iconMatch ? iconMatch[1] : undefined;

    const permissions = {
      internet: /https?:|fetch\(|XMLHttpRequest|WebSocket|@import\s+["']https?:/i.test(html),
      camera: /getUserMedia.*video|<input[^>]+capture|ImageCapture/i.test(html),
      location: /geolocation|getCurrentPosition|watchPosition/i.test(html),
      microphone: /getUserMedia.*audio|MediaRecorder|SpeechRecognition/i.test(html),
      notifications: /Notification\.requestPermission|showNotification/i.test(html),
    };

    return { title, iconUrl, permissions };
  }

  /**
   * Audits HTML structure for standard mobile webview compliance
   */
  static auditHtml(html: string): { status: 'passed' | 'warning' | 'error'; message: string }[] {
    const results: { status: 'passed' | 'warning' | 'error'; message: string }[] = [];

    if (!/<!doctype\s+html/i.test(html)) {
      results.push({ status: 'warning', message: 'Missing <!DOCTYPE html> declaration.' });
    } else {
      results.push({ status: 'passed', message: 'Standard <!DOCTYPE html> declaration present.' });
    }

    if (!/<meta[^>]+viewport/i.test(html)) {
      results.push({ status: 'warning', message: 'No viewport meta tag found; auto-injecting responsive viewport.' });
    } else {
      results.push({ status: 'passed', message: 'Responsive mobile viewport meta tag configured.' });
    }

    if (!/<meta[^>]+charset/i.test(html)) {
      results.push({ status: 'warning', message: 'No charset meta tag found; UTF-8 recommended.' });
    }

    if (!/<title>/i.test(html)) {
      results.push({ status: 'warning', message: 'Missing <title> tag in <head>.' });
    }

    if (/src=["']http:\/\//i.test(html)) {
      results.push({ status: 'warning', message: 'Contains insecure http:// assets (may be blocked by Android WebView cleartext policy).' });
    }

    return results;
  }

  /**
   * Injects viewport meta tag, mobile styling, and ESDY bridge into HTML based on style options
   */
  static prepareHtmlForMobile(
    html: string,
    isPremium: boolean,
    styles?: HtmlStyleOptions
  ): string {
    let result = html;

    const opts: HtmlStyleOptions = styles || {
      themeColor: '#07111f',
      backgroundColor: '#07111f',
      disableTextSelection: true,
      disablePinchZoom: true,
      enablePullToRefresh: true,
      enableSafeAreaInsets: true,
      enableNativeDialogs: true,
      enableNativeBridge: true,
      enableConsentFlow: false,
      privacyPolicyUrl: '',
      customHeadInject: '',
      customBodyInject: '',
      fontFamily: 'jakarta',
      orientation: 'sensorPortrait',
      fullscreen: false,
      keepScreenOn: false,
      hardwareAcceleration: true,
      allowCleartextHttp: false,
      cacheStrategy: 'default',
      backButtonAction: 'history',
      customUserAgent: '',
      splashDurationSec: 2,
      bundleRemoteAssets: true,
    };

    // 1. Viewport meta
    const viewportContent = opts.disablePinchZoom
      ? 'width=device-width, initial-scale=1, maximum-scale=1, user-scalable=no, viewport-fit=cover'
      : 'width=device-width, initial-scale=1, viewport-fit=cover';

    if (!/<meta[^>]+name=["']viewport["']/i.test(result)) {
      result = this.injectIntoHead(result, `<meta name="viewport" content="${viewportContent}">`);
    }

    // 2. Theme color meta & navigation bar
    result = this.injectIntoHead(result, `<meta name="theme-color" content="${opts.themeColor}">`);
    if (opts.navigationBarColor) {
      result = this.injectIntoHead(result, `<meta name="navigation-bar-color" content="${opts.navigationBarColor}">`);
    }
    if (opts.statusBarIcons) {
      result = this.injectIntoHead(result, `<meta name="apple-mobile-web-app-status-bar-style" content="${opts.statusBarIcons === 'dark' ? 'black-translucent' : 'default'}">`);
    }
    if (opts.darkModeSupport && opts.darkModeSupport !== 'auto') {
      result = this.injectIntoHead(result, `<meta name="color-scheme" content="${opts.darkModeSupport === 'force_dark' ? 'dark' : 'light'}">`);
    }

    // 3. Font injection
    if (opts.fontFamily && FONT_IMPORTS[opts.fontFamily]) {
      result = this.injectIntoHead(result, FONT_IMPORTS[opts.fontFamily]);
    }

    // 4. Mobile layout & interaction CSS
    const userSelectCss = opts.disableTextSelection
      ? 'user-select: none; -webkit-user-select: none; -webkit-touch-callout: none;'
      : '';
    const safeAreaCss = opts.enableSafeAreaInsets
      ? 'padding-top: env(safe-area-inset-top, 0px); padding-bottom: env(safe-area-inset-bottom, 0px);'
      : '';
    const zoomCss = opts.zoomLevel && opts.zoomLevel !== 'responsive'
      ? `zoom: ${opts.zoomLevel};`
      : '';

    const mobileStyle = `
<style id="esdy-mobile-runtime-styles">
  html, body {
    margin: 0;
    padding: 0;
    background-color: ${opts.backgroundColor};
    -webkit-tap-highlight-color: transparent;
    ${userSelectCss}
    ${safeAreaCss}
    ${zoomCss}
  }
</style>`;
    result = this.injectIntoHead(result, mobileStyle);

    // Vibration on Tap (Haptic feedback)
    if (opts.vibrateOnTap) {
      const hapticScript = `
<script id="esdy-haptic-tap">
document.addEventListener('touchstart', function(e) {
  if (e.target && (e.target.tagName === 'BUTTON' || e.target.tagName === 'A' || e.target.getAttribute('role') === 'button')) {
    if (navigator.vibrate) navigator.vibrate(12);
  }
}, { passive: true });
</script>`;
      result = this.injectIntoHead(result, hapticScript);
    }

    // Modern Loading Indicator
    if (opts.loadingIndicator && opts.loadingIndicator !== 'none') {
      const loaderHtml = opts.loadingIndicator === 'progress_bar'
        ? `<div id="esdy-page-loader" style="position:fixed;top:0;left:0;right:0;height:3px;z-index:2147483647;background:linear-gradient(90deg, #06b6d4, #10b981);animation:esdyProgress 1.5s infinite;transform-origin:left;"></div>
<style>@keyframes esdyProgress{0%{transform:scaleX(0)}50%{transform:scaleX(0.7)}100%{transform:scaleX(1);opacity:0}}</style>
<script>window.addEventListener('load',function(){var l=document.getElementById('esdy-page-loader');if(l){l.style.transition='opacity 0.3s';l.style.opacity='0';setTimeout(function(){l.remove();},350);}});</script>`
        : `<div id="esdy-page-loader" style="position:fixed;inset:0;background:${opts.backgroundColor};z-index:2147483646;display:flex;align-items:center;justify-content:center;transition:opacity 0.4s ease;"><div style="width:36px;height:36px;border:3px solid rgba(6,182,212,0.2);border-top-color:#06b6d4;border-radius:50%;animation:esdySpin 0.8s linear infinite;"></div></div>
<style>@keyframes esdySpin{to{transform:rotate(360deg)}}</style>
<script>window.addEventListener('load',function(){var l=document.getElementById('esdy-page-loader');if(l){l.style.opacity='0';setTimeout(function(){l.remove();},400);}});</script>`;
      result = /<\/body>/i.test(result)
        ? result.replace(/<\/body>/i, () => loaderHtml + '\n</body>')
        : result + '\n' + loaderHtml;
    }

    // 5. Native / iOS-style Dialogs Polyfill
    if (opts.enableNativeDialogs) {
      const dialogPolyfill = `
<script id="esdy-native-dialogs">
(function() {
  function makeDialog(msg, btns, isPrompt) {
    return new Promise(function(resolve) {
      var overlay = document.createElement("div");
      overlay.style.cssText = "position:fixed;inset:0;background:rgba(0,0,0,0.5);z-index:2147483647;display:flex;align-items:center;justify-content:center;font-family:system-ui,sans-serif;padding:20px;box-sizing:border-box;";
      var box = document.createElement("div");
      box.style.cssText = "background:#ffffff;color:#0f172a;width:100%;max-width:300px;border-radius:18px;text-align:center;overflow:hidden;box-shadow:0 20px 40px rgba(0,0,0,0.3);";
      var text = document.createElement("div");
      text.style.cssText = "padding:20px 18px 14px;font-size:15px;line-height:1.45;font-weight:600;";
      text.textContent = msg;
      box.appendChild(text);
      var inp;
      if (isPrompt) {
        inp = document.createElement("input");
        inp.style.cssText = "margin:0 16px 14px;width:calc(100% - 32px);padding:8px 10px;font-size:14px;border:1px solid #cbd5e1;border-radius:10px;box-sizing:border-box;outline:none;";
        box.appendChild(inp);
      }
      var btnRow = document.createElement("div");
      btnRow.style.cssText = "display:flex;border-top:1px solid #e2e8f0;";
      btns.forEach(function(b, idx) {
        var btn = document.createElement("button");
        btn.textContent = b.label;
        btn.style.cssText = "flex:1;padding:12px;border:none;background:transparent;font-size:16px;cursor:pointer;color:" + (b.primary ? "#0284c7" : "#64748b") + ";" + (idx > 0 ? "border-left:1px solid #e2e8f0;font-weight:700;" : "font-weight:500;");
        btn.onclick = function() {
          overlay.remove();
          resolve(isPrompt ? (inp ? inp.value : "") : b.val);
        };
        btnRow.appendChild(btn);
      });
      box.appendChild(btnRow);
      overlay.appendChild(box);
      document.body.appendChild(overlay);
      if (inp) inp.focus();
    });
  }
  window.__esdyDlg = {
    alert: function(m) { return makeDialog(String(m), [{ label: "OK", val: true, primary: true }], false); },
    confirm: function(m) { return makeDialog(String(m), [{ label: "Cancel", val: false }, { label: "OK", val: true, primary: true }], false); },
    prompt: function(m) { return makeDialog(String(m), [{ label: "Cancel", val: null }, { label: "OK", val: true, primary: true }], true); }
  };
  window.alert = function(m) { window.__esdyDlg.alert(m); };
})();
</script>`;
      result = this.injectIntoHead(result, dialogPolyfill);
    }

    // 6. JavaScript Bridge polyfill (window.Esdy)
    if (opts.enableNativeBridge) {
      const bridgeScript = `
<script id="esdy-native-bridge">
(function() {
  var B = window.AndroidAPI || window.AndroidBridge || {};
  function call(n, a) {
    try {
      if (typeof B[n] === "function") return B[n].apply(B, a || []);
    } catch(e) {}
    return undefined;
  }
  window.Esdy = {
    toast: function(m) {
      if (call("showToast", [String(m)]) === undefined) {
        var t = document.createElement("div");
        t.style.cssText = "position:fixed;bottom:60px;left:50%;transform:translateX(-50%);background:rgba(15,23,42,0.92);color:#fff;padding:8px 16px;border-radius:20px;font-size:12px;font-weight:600;z-index:999999;box-shadow:0 4px 12px rgba(0,0,0,0.25);";
        t.textContent = m;
        document.body.appendChild(t);
        setTimeout(function() { t.remove(); }, 2500);
      }
    },
    vibrate: function(ms) {
      if (call("vibrate", [ms || 200]) === undefined && navigator.vibrate) {
        navigator.vibrate(ms || 200);
      }
    },
    notify: function(title, body, delaySec) {
      if (call("scheduleNotification", [String(title), String(body || ""), Math.round((delaySec || 0) * 1000)]) !== undefined) return;
      if (window.Notification && Notification.permission === "granted") {
        setTimeout(function() { new Notification(title, { body: body }); }, (delaySec || 0) * 1000);
      }
    },
    share: function(text) {
      if (navigator.share) navigator.share({ text: text });
      else call("share", [String(text)]);
    }
  };
})();
</script>`;
      result = this.injectIntoHead(result, bridgeScript);
    }

    // 7. Privacy / Consent flow banner
    if (opts.enableConsentFlow) {
      const consentScript = `
<script id="esdy-consent-flow">
(function() {
  if (localStorage.getItem("esdy_consent_agreed")) return;
  function showBanner() {
    var banner = document.createElement("div");
    banner.style.cssText = "position:fixed;bottom:0;left:0;right:0;background:#0f172a;color:#f8fafc;padding:16px;z-index:2147483646;border-top:1px solid #334155;font-family:system-ui,sans-serif;box-shadow:0 -4px 16px rgba(0,0,0,0.3);";
    banner.innerHTML = '<div style="font-size:13px;font-weight:700;margin-bottom:4px">Privacy &amp; Data Notice</div><div style="font-size:12px;color:#94a3b8;margin-bottom:12px">This app stores local data on your device for performance and offline usage.${opts.privacyPolicyUrl ? ' <a href="' + opts.privacyPolicyUrl + '" target="_blank" style="color:#38bdf8;text-decoration:none">Privacy Policy</a>' : ''}</div><div style="display:flex;gap:8px"><button id="ecDecline" style="flex:1;padding:8px;border-radius:10px;border:1px solid #334155;background:#1e293b;color:#cbd5e1;font-weight:600;font-size:12px">Decline</button><button id="ecAccept" style="flex:1;padding:8px;border-radius:10px;border:none;background:#0284c7;color:#fff;font-weight:700;font-size:12px">Accept</button></div>';
    document.body.appendChild(banner);
    banner.querySelector("#ecAccept").onclick = function() {
      localStorage.setItem("esdy_consent_agreed", "yes");
      banner.remove();
    };
    banner.querySelector("#ecDecline").onclick = function() {
      banner.remove();
    };
  }
  if (document.body) showBanner();
  else document.addEventListener("DOMContentLoaded", showBanner);
})();
</script>`;
      result = this.injectIntoHead(result, consentScript);
    }

    // 8. Custom Head Inject
    if (opts.customHeadInject && opts.customHeadInject.trim()) {
      result = this.injectIntoHead(result, opts.customHeadInject);
    }

    // 9. Custom Body Inject
    if (opts.customBodyInject && opts.customBodyInject.trim()) {
      result = /<\/body>/i.test(result)
        ? result.replace(/<\/body>/i, () => opts.customBodyInject + '\n</body>')
        : result + '\n' + opts.customBodyInject;
    }

    // 10. Splash Screen Overlay
    if (opts.splashDataUrl) {
      const splashHtml = `
<div id="esdy-app-splash" style="position:fixed;inset:0;z-index:2147483646;background:${opts.backgroundColor || '#07111f'};display:flex;align-items:center;justify-content:center;transition:opacity 0.4s ease;">
  <img src="${opts.splashDataUrl}" style="max-width:70%;max-height:70%;object-fit:contain;" alt="Splash">
</div>
<script>
setTimeout(function(){
  var s = document.getElementById("esdy-app-splash");
  if(s){ s.style.opacity = '0'; setTimeout(function(){ s.remove(); }, 450); }
}, ${Math.max(1, opts.splashDurationSec || 2) * 1000});
</script>`;
      result = /<\/body>/i.test(result)
        ? result.replace(/<\/body>/i, () => splashHtml + '\n</body>')
        : result + '\n' + splashHtml;
    }

    // 11. Keep Screen Awake
    if (opts.keepScreenOn) {
      const wakeLockScript = `<script>if(navigator.wakeLock){navigator.wakeLock.request('screen').catch(function(){});}</script>`;
      result = this.injectIntoHead(result, wakeLockScript);
    }

    // 10. Watermark badge if not premium
    if (!isPremium && !result.includes('data-esdy-watermark')) {
      const badge =
        '<div data-esdy-watermark style="position:fixed;right:8px;bottom:8px;z-index:2147483647;background:rgba(15,23,42,0.88);backdrop-filter:blur(8px);color:#f8fafc;font:600 11px/1 system-ui,sans-serif;padding:6px 12px;border-radius:9999px;border:1px solid rgba(255,255,255,0.15);pointer-events:none;box-shadow:0 4px 12px rgba(0,0,0,0.25);">Built with ESDY Builder</div>';
      
      result = /<\/body>/i.test(result)
        ? result.replace(/<\/body>/i, () => badge + '</body>')
        : result + badge;
    }

    return result;
  }

  private static injectIntoHead(html: string, injection: string): string {
    if (/<head[^>]*>/i.test(html)) {
      return html.replace(/<head[^>]*>/i, (m) => m + '\n' + injection);
    }
    if (/<html[^>]*>/i.test(html)) {
      return html.replace(/<html[^>]*>/i, (m) => m + '\n<head>' + injection + '</head>');
    }
    return injection + '\n' + html;
  }

  private static async asyncReplace(
    str: string,
    re: RegExp,
    replacer: (...args: any[]) => Promise<string>
  ): Promise<string> {
    const matches: any[][] = [];
    str.replace(re, (...args) => {
      matches.push(args);
      return args[0];
    });
    const replacements = await Promise.all(matches.map((args) => replacer(...args)));
    let i = 0;
    return str.replace(re, () => replacements[i++]);
  }
}

/**
 * Built-in Starter Templates for users who want to build right away
 */
export const STARTER_TEMPLATES = [
  {
    id: 'starter_interactive',
    name: 'Interactive App (Native Bridge)',
    desc: 'Demonstrates vibration, native toasts, local notifications, and modal dialogs',
    html: `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1">
  <title>Native Interaction App</title>
  <style>
    body {
      font-family: system-ui, -apple-system, sans-serif;
      margin: 0;
      padding: 24px;
      background: #0f172a;
      color: #f8fafc;
    }
    h1 { font-size: 22px; margin-top: 0; color: #38bdf8; }
    p { font-size: 14px; color: #94a3b8; line-height: 1.5; }
    .card {
      background: #1e293b;
      border-radius: 16px;
      padding: 16px;
      margin-bottom: 16px;
      border: 1px solid #334155;
    }
    button {
      display: block;
      width: 100%;
      padding: 12px;
      margin-top: 10px;
      border-radius: 12px;
      border: none;
      background: #0284c7;
      color: white;
      font-weight: 700;
      font-size: 14px;
      cursor: pointer;
    }
    button:active { transform: scale(0.98); }
    .status { font-family: monospace; font-size: 12px; color: #38bdf8; margin-top: 12px; }
  </style>
</head>
<body>
  <h1>📱 Native Android Controls</h1>
  <p>This web app is packaged into a native APK/AAB and interacts with hardware via <code>window.Esdy</code>.</p>

  <div class="card">
    <strong>Device Haptics &amp; Toast</strong>
    <p>Trigger physical device vibration and Android Toast notification.</p>
    <button onclick="Esdy.vibrate(200); document.getElementById('msg').textContent='Vibrated 200ms';">Vibrate Phone (200ms)</button>
    <button onclick="Esdy.toast('Hello from ESDY Android WebView!');">Show Native Toast</button>
  </div>

  <div class="card">
    <strong>Share &amp; Alerts</strong>
    <button onclick="if(navigator.share){navigator.share({title:'ESDY App',text:'Check out my Android App!'});}">Open Native Share Sheet</button>
  </div>

  <div class="status" id="msg">Ready.</div>
</body>
</html>`,
  },
  {
    id: 'starter_dashboard',
    name: 'Modern Mobile Dashboard',
    desc: 'Dark theme card dashboard with battery status, live time, and offline support',
    html: `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1">
  <title>Mobile Dashboard</title>
  <style>
    body {
      font-family: system-ui, -apple-system, sans-serif;
      margin: 0;
      padding: 20px;
      background: #020617;
      color: #f8fafc;
    }
    .header { margin-bottom: 24px; }
    h1 { font-size: 24px; margin: 0; }
    .subtitle { color: #64748b; font-size: 13px; margin-top: 4px; }
    .grid { display: grid; grid-template-columns: 1fr 1fr; gap: 12px; }
    .metric {
      background: #0f172a;
      border: 1px solid #1e293b;
      border-radius: 16px;
      padding: 16px;
    }
    .metric .val { font-size: 24px; font-weight: 800; color: #38bdf8; margin-top: 6px; }
    .metric .lbl { font-size: 11px; color: #64748b; text-transform: uppercase; font-weight: 700; }
    .list { margin-top: 20px; }
    .item {
      background: #0f172a;
      border: 1px solid #1e293b;
      border-radius: 12px;
      padding: 12px 16px;
      display: flex;
      justify-content: space-between;
      margin-bottom: 8px;
      font-size: 13px;
    }
  </style>
</head>
<body>
  <div class="header">
    <h1>App Overview</h1>
    <div class="subtitle">Real-time local device metrics</div>
  </div>

  <div class="grid">
    <div class="metric">
      <div class="lbl">Status</div>
      <div class="val" style="color:#4ade80;">Active</div>
    </div>
    <div class="metric">
      <div class="lbl">Storage</div>
      <div class="val">100%</div>
    </div>
  </div>

  <div class="list">
    <div class="item"><span>Android Target</span><b>API 35</b></div>
    <div class="item"><span>Architecture</span><b>16 KB Aligned</b></div>
    <div class="item"><span>Package Mode</span><b>AAB + APK</b></div>
  </div>
</body>
</html>`,
  },
];
