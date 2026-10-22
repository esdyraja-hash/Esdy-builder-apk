import React, { useState } from 'react';
import JSZip from 'jszip';
import { 
  Archive, 
  Upload, 
  Download, 
  FileCode, 
  Layers, 
  Cpu, 
  CheckCircle2, 
  AlertCircle 
} from 'lucide-react';

export const UnpackerTab: React.FC = () => {
  const [selectedFiles, setSelectedFiles] = useState<File[]>([]);
  const [isUnpacking, setIsUnpacking] = useState(false);
  const [progressPercent, setProgressPercent] = useState(0);
  const [statusMessage, setStatusMessage] = useState('');
  const [extractedZipBlob, setExtractedZipBlob] = useState<Blob | null>(null);
  const [summaryList, setSummaryList] = useState<{
    name: string;
    files: number;
    bytes: number;
    dexCount: number;
    abis: string[];
  }[]>([]);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files) {
      setSelectedFiles(Array.from(e.target.files));
      setExtractedZipBlob(null);
      setSummaryList([]);
      setStatusMessage('');
    }
  };

  const handleUnpack = async () => {
    if (!selectedFiles.length) return;
    setIsUnpacking(true);
    setProgressPercent(5);
    setStatusMessage('Reading package archives…');
    setSummaryList([]);

    const outZip = new JSZip();
    const rows: {
      name: string;
      files: number;
      bytes: number;
      dexCount: number;
      abis: string[];
    }[] = [];

    try {
      for (let i = 0; i < selectedFiles.length; i++) {
        const file = selectedFiles[i];
        const baseName = file.name.replace(/\.[^.]+$/, '');
        setStatusMessage(`Extracting ${file.name} (${i + 1}/${selectedFiles.length})…`);
        
        const zip = await JSZip.loadAsync(file);
        const folder = outZip.folder(baseName);
        
        let fileCount = 0;
        let totalBytes = 0;
        let dexCount = 0;
        const abisSet = new Set<string>();

        const entries = Object.values(zip.files).filter(e => !e.dir);
        for (const entry of entries) {
          const path = entry.name.split('/').filter(x => x && x !== '.' && x !== '..').join('/');
          if (!path) continue;

          const data = await entry.async('uint8array');
          folder?.file(path, data, { binary: true });

          fileCount++;
          totalBytes += data.length;
          if (/\.dex$/i.test(path)) dexCount++;

          const abiMatch = path.match(/^lib\/([^/]+)\//);
          if (abiMatch) abisSet.add(abiMatch[1]);
        }

        rows.push({
          name: file.name,
          files: fileCount,
          bytes: totalBytes,
          dexCount,
          abis: Array.from(abisSet),
        });

        setProgressPercent(Math.round(((i + 1) / selectedFiles.length) * 75));
      }

      setStatusMessage('Creating consolidated ZIP package…');
      setProgressPercent(85);

      const generatedBlob = await outZip.generateAsync({
        type: 'blob',
        compression: 'DEFLATE',
      }, (metadata) => {
        setProgressPercent(85 + Math.round(metadata.percent * 0.15));
      });

      setExtractedZipBlob(generatedBlob);
      setSummaryList(rows);
      setProgressPercent(100);
      setStatusMessage(`Successfully unpacked ${selectedFiles.length} Android package(s)!`);
    } catch (err: any) {
      setStatusMessage(`Unpacking error: ${err.message || 'Corrupted archive format'}`);
    } finally {
      setIsUnpacking(false);
    }
  };

  const handleDownloadUnpacked = () => {
    if (!extractedZipBlob) return;
    const url = URL.createObjectURL(extractedZipBlob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `esdy-unpacked-archive-${Date.now()}.zip`;
    a.click();
    URL.revokeObjectURL(url);
  };

  return (
    <div className="space-y-6">
      
      {/* Overview Banner */}
      <div className="bg-slate-900 text-white p-6 rounded-2xl border border-slate-800 shadow-sm">
        <div className="flex items-center gap-2 text-xs font-semibold text-cyan-400 mb-2">
          <Archive className="w-4 h-4" />
          <span>Reverse Engineering &amp; Package Inspection</span>
        </div>
        <h2 className="text-xl sm:text-2xl font-bold tracking-tight text-white mb-2">
          APK &amp; AAB Unpacker &amp; Analyzer
        </h2>
        <p className="text-sm text-slate-300 leading-relaxed">
          Inspect, decompose, and extract base APKs, App Bundles (.aab), and split APKs (.apks, .xapk). Inspect DEX bytecode count, native CPU ABIs, assets, and export all extracted modules into a single organized ZIP archive.
        </p>
      </div>

      <div className="bg-white dark:bg-slate-900 p-6 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm">
        
        {/* Upload Box */}
        <label className="block border-2 border-dashed border-slate-300 dark:border-slate-700 hover:border-cyan-500 rounded-2xl p-8 text-center cursor-pointer transition-colors bg-slate-50/50 dark:bg-slate-950/40">
          <input
            type="file"
            multiple
            accept=".apk,.aab,.apks,.xapk,.zip"
            onChange={handleFileChange}
            className="hidden"
          />
          <div className="w-12 h-12 rounded-2xl bg-cyan-50 dark:bg-cyan-950 flex items-center justify-center text-cyan-600 dark:text-cyan-400 mx-auto mb-3">
            <Upload className="w-6 h-6" />
          </div>
          <div className="font-bold text-sm text-slate-900 dark:text-white mb-1">
            {selectedFiles.length > 0
              ? `${selectedFiles.length} file(s) selected: ${selectedFiles.map(f => f.name).join(', ')}`
              : 'Choose APK or AAB Files to Unpack'}
          </div>
          <p className="text-xs text-slate-500 dark:text-slate-400">
            Supports .apk, .aab, .apks, .xapk, or .zip. Select multiple split APKs at once.
          </p>
        </label>

        {/* Action Button */}
        <div className="mt-4 flex items-center justify-between">
          <div className="text-xs text-slate-500 dark:text-slate-400 font-mono">
            {statusMessage}
          </div>

          <button
            type="button"
            disabled={!selectedFiles.length || isUnpacking}
            onClick={handleUnpack}
            className="flex items-center gap-2 px-5 py-2.5 text-xs font-bold text-white bg-slate-900 dark:bg-cyan-500 dark:text-slate-950 rounded-xl hover:opacity-90 transition-opacity disabled:opacity-40"
          >
            <span>{isUnpacking ? 'Unpacking Packages…' : 'Decompose & Extract'}</span>
          </button>
        </div>

        {/* Progress bar */}
        {isUnpacking && (
          <div className="mt-4">
            <div className="w-full h-2 bg-slate-100 dark:bg-slate-800 rounded-full overflow-hidden">
              <div
                className="h-full bg-cyan-500 transition-all duration-200"
                style={{ width: `${progressPercent}%` }}
              />
            </div>
          </div>
        )}

        {/* Results Card */}
        {summaryList.length > 0 && (
          <div className="mt-6 pt-6 border-t border-slate-100 dark:border-slate-800">
            <div className="flex items-center justify-between mb-4">
              <h3 className="font-bold text-sm text-slate-900 dark:text-white">
                Decomposition Analysis &amp; Artifact Details
              </h3>
              {extractedZipBlob && (
                <button
                  type="button"
                  onClick={handleDownloadUnpacked}
                  className="flex items-center gap-2 px-4 py-2 text-xs font-bold text-white bg-emerald-600 hover:bg-emerald-500 rounded-xl transition-colors"
                >
                  <Download className="w-3.5 h-3.5" />
                  <span>Download Extracted ZIP ({(extractedZipBlob.size / 1024 / 1024).toFixed(1)} MB)</span>
                </button>
              )}
            </div>

            <div className="space-y-3">
              {summaryList.map((item, index) => (
                <div
                  key={index}
                  className="p-4 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-950 flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs"
                >
                  <div>
                    <div className="font-bold text-slate-900 dark:text-white font-mono">
                      {item.name}
                    </div>
                    <div className="text-slate-500 dark:text-slate-400 mt-1">
                      {item.files} files · {(item.bytes / 1024 / 1024).toFixed(2)} MB uncompressed · {item.dexCount} DEX file(s)
                    </div>
                  </div>

                  <div className="flex items-center gap-1.5 flex-wrap">
                    {item.abis.length > 0 ? (
                      item.abis.map((abi) => (
                        <span
                          key={abi}
                          className="px-2 py-0.5 rounded font-mono text-[10px] bg-slate-200 dark:bg-slate-800 text-slate-700 dark:text-slate-300"
                        >
                          {abi}
                        </span>
                      ))
                    ) : (
                      <span className="text-[11px] text-slate-400 italic">No native .so libs (Pure Java/Kotlin)</span>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

      </div>

    </div>
  );
};
