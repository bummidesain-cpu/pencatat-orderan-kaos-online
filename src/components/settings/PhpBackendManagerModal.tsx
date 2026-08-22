import React, { useState } from 'react';
import {
  AlertCircle,
  Check,
  CheckCircle2,
  Code,
  Copy,
  Database,
  Download,
  ExternalLink,
  FileCode,
  FolderArchive,
  HardDrive,
  HelpCircle,
  Layers,
  Link,
  Play,
  RefreshCw,
  Server,
  Sparkles,
  Terminal,
  X,
  Zap,
} from 'lucide-react';
import {
  PHP_BACKEND_FILES,
  PhpFileItem,
  downloadSingleFile,
  generateBackendZip,
} from '../../lib/phpBackendData';
import {
  getBackendMode,
  getPhpBackendUrl,
  setBackendMode,
  setPhpBackendUrl,
  testPhpBackendConnection,
} from '../../lib/storage';

interface PhpBackendManagerModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const PhpBackendManagerModal: React.FC<PhpBackendManagerModalProps> = ({
  isOpen,
  onClose,
}) => {
  const [activeTab, setActiveTab] = useState<'files' | 'guide' | 'connect' | 'apiDocs'>('files');
  const [selectedFile, setSelectedFile] = useState<PhpFileItem>(PHP_BACKEND_FILES[0]);
  const [copiedCode, setCopiedCode] = useState(false);
  const [isZipping, setIsZipping] = useState(false);
  const [zipSuccess, setZipSuccess] = useState(false);

  // Connection Test States
  const [backendUrlInput, setBackendUrlInput] = useState<string>(() => getPhpBackendUrl());
  const [backendModeState, setBackendModeState] = useState<'local' | 'php_mysql'>(() => getBackendMode());
  const [isTestingConn, setIsTestingConn] = useState(false);
  const [testResult, setTestResult] = useState<{
    success: boolean;
    message: string;
    data?: any;
  } | null>(null);

  if (!isOpen) return null;

  const handleCopyFileContent = () => {
    navigator.clipboard.writeText(selectedFile.content);
    setCopiedCode(true);
    setTimeout(() => setCopiedCode(false), 2000);
  };

  const handleDownloadAllZip = async () => {
    try {
      setIsZipping(true);
      const zipBlob = await generateBackendZip();
      const url = URL.createObjectURL(zipBlob);
      const link = document.createElement('a');
      link.href = url;
      link.download = 'backend_php_mysql_order_management.zip';
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(url);
      setZipSuccess(true);
      setTimeout(() => setZipSuccess(false), 4000);
    } catch (err) {
      console.error('Failed to create backend zip', err);
    } finally {
      setIsZipping(false);
    }
  };

  const handleTestConnection = async () => {
    setIsTestingConn(true);
    setTestResult(null);
    setPhpBackendUrl(backendUrlInput);

    const res = await testPhpBackendConnection(backendUrlInput);
    setIsTestingConn(false);
    setTestResult(res);

    if (res.success) {
      setBackendMode('php_mysql');
      setBackendModeState('php_mysql');
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-slate-950/70 backdrop-blur-xs animate-fadeIn">
      <div className="flex flex-col w-full max-w-5xl h-[92vh] max-h-[850px] rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-2xl overflow-hidden">
        {/* Header Modal */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-150 dark:border-slate-800 bg-slate-50/80 dark:bg-slate-900/80 shrink-0">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-gradient-to-tr from-indigo-600 to-violet-600 text-white shadow-md">
              <Server className="h-5 w-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="text-base font-black text-slate-900 dark:text-white">
                  Backend REST API PHP & Database MySQL
                </h3>
                <span className="px-2 py-0.5 rounded-full text-[10px] font-black uppercase tracking-wider bg-emerald-100 text-emerald-800 dark:bg-emerald-950/80 dark:text-emerald-300 border border-emerald-300 dark:border-emerald-800">
                  Ready-to-Deploy
                </span>
              </div>
              <p className="text-xs text-slate-500 dark:text-slate-400">
                Source code backend PHP Native (PDO) & MySQL Schema untuk XAMPP, Laragon, cPanel, atau VPS.
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={handleDownloadAllZip}
              disabled={isZipping}
              className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-700 active:scale-95 text-white text-xs font-black shadow-md transition cursor-pointer"
            >
              <FolderArchive className="h-4 w-4" />
              <span>{isZipping ? 'Mengompres ZIP...' : 'Download ZIP Backend'}</span>
            </button>
            <button
              type="button"
              onClick={onClose}
              className="p-2 rounded-xl text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 hover:bg-slate-200/60 dark:hover:bg-slate-800 transition cursor-pointer"
            >
              <X className="h-5 w-5" />
            </button>
          </div>
        </div>

        {/* Tab Navigation */}
        <div className="flex items-center gap-2 px-6 pt-3 border-b border-slate-100 dark:border-slate-800 bg-white dark:bg-slate-900 shrink-0 overflow-x-auto">
          <button
            type="button"
            onClick={() => setActiveTab('files')}
            className={`flex items-center gap-2 px-4 py-2.5 text-xs font-extrabold border-b-2 transition whitespace-nowrap cursor-pointer ${
              activeTab === 'files'
                ? 'border-indigo-600 text-indigo-600 dark:border-indigo-400 dark:text-indigo-400'
                : 'border-transparent text-slate-500 hover:text-slate-800 dark:text-slate-400 dark:hover:text-white'
            }`}
          >
            <Code className="h-4 w-4" />
            <span>File Source Code PHP & SQL ({PHP_BACKEND_FILES.length})</span>
          </button>

          <button
            type="button"
            onClick={() => setActiveTab('guide')}
            className={`flex items-center gap-2 px-4 py-2.5 text-xs font-extrabold border-b-2 transition whitespace-nowrap cursor-pointer ${
              activeTab === 'guide'
                ? 'border-indigo-600 text-indigo-600 dark:border-indigo-400 dark:text-indigo-400'
                : 'border-transparent text-slate-500 hover:text-slate-800 dark:text-slate-400 dark:hover:text-white'
            }`}
          >
            <Terminal className="h-4 w-4" />
            <span>Panduan Setup (XAMPP / cPanel / VPS)</span>
          </button>

          <button
            type="button"
            onClick={() => setActiveTab('connect')}
            className={`flex items-center gap-2 px-4 py-2.5 text-xs font-extrabold border-b-2 transition whitespace-nowrap cursor-pointer ${
              activeTab === 'connect'
                ? 'border-indigo-600 text-indigo-600 dark:border-indigo-400 dark:text-indigo-400'
                : 'border-transparent text-slate-500 hover:text-slate-800 dark:text-slate-400 dark:hover:text-white'
            }`}
          >
            <Link className="h-4 w-4" />
            <span>Uji Koneksi Server & URL API</span>
          </button>

          <button
            type="button"
            onClick={() => setActiveTab('apiDocs')}
            className={`flex items-center gap-2 px-4 py-2.5 text-xs font-extrabold border-b-2 transition whitespace-nowrap cursor-pointer ${
              activeTab === 'apiDocs'
                ? 'border-indigo-600 text-indigo-600 dark:border-indigo-400 dark:text-indigo-400'
                : 'border-transparent text-slate-500 hover:text-slate-800 dark:text-slate-400 dark:hover:text-white'
            }`}
          >
            <Layers className="h-4 w-4" />
            <span>Daftar Endpoint REST API</span>
          </button>
        </div>

        {/* Tab Contents */}
        <div className="flex-1 overflow-hidden p-6 bg-slate-50/50 dark:bg-slate-950/40">
          {/* TAB 1: FILE BROWSER & CODE VIEWER */}
          {activeTab === 'files' && (
            <div className="grid grid-cols-1 md:grid-cols-12 gap-4 h-full">
              {/* File List Column */}
              <div className="md:col-span-4 bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 p-3.5 flex flex-col h-full overflow-hidden shadow-xs">
                <div className="flex items-center justify-between pb-2 border-b border-slate-100 dark:border-slate-800 mb-2">
                  <span className="text-[11px] font-black uppercase tracking-wider text-slate-500 dark:text-slate-400">
                    Pilih File Backend
                  </span>
                  <span className="text-[10px] font-mono px-2 py-0.5 rounded-md bg-indigo-50 text-indigo-700 dark:bg-indigo-950/60 dark:text-indigo-300 font-bold">
                    PHP 7.4 - 8.3+
                  </span>
                </div>

                <div className="flex-1 overflow-y-auto space-y-1.5 pr-1">
                  {PHP_BACKEND_FILES.map((f) => {
                    const isSelected = selectedFile.filename === f.filename;
                    const isSql = f.filename.endsWith('.sql');
                    const isConfig = f.path.includes('config/');
                    return (
                      <button
                        key={f.filename}
                        type="button"
                        onClick={() => setSelectedFile(f)}
                        className={`w-full text-left p-2.5 rounded-xl text-xs transition cursor-pointer flex items-start gap-2.5 ${
                          isSelected
                            ? 'bg-indigo-600 text-white font-bold shadow-xs'
                            : 'hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-700 dark:text-slate-300'
                        }`}
                      >
                        <div
                          className={`p-1.5 rounded-lg shrink-0 ${
                            isSelected
                              ? 'bg-white/20 text-white'
                              : isSql
                              ? 'bg-amber-100 text-amber-800 dark:bg-amber-950 dark:text-amber-300'
                              : isConfig
                              ? 'bg-blue-100 text-blue-800 dark:bg-blue-950 dark:text-blue-300'
                              : 'bg-indigo-100 text-indigo-800 dark:bg-indigo-950 dark:text-indigo-300'
                          }`}
                        >
                          {isSql ? (
                            <Database className="h-3.5 w-3.5" />
                          ) : (
                            <FileCode className="h-3.5 w-3.5" />
                          )}
                        </div>
                        <div className="overflow-hidden flex-1">
                          <span className="font-mono text-xs font-black truncate block">
                            {f.filename}
                          </span>
                          <span
                            className={`text-[10px] line-clamp-1 mt-0.5 ${
                              isSelected ? 'text-indigo-100' : 'text-slate-400'
                            }`}
                          >
                            {f.description}
                          </span>
                        </div>
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Code Preview Column */}
              <div className="md:col-span-8 bg-slate-900 rounded-2xl border border-slate-800 p-4 flex flex-col h-full overflow-hidden shadow-xl text-slate-100">
                {/* Code Header */}
                <div className="flex items-center justify-between pb-3 border-b border-slate-800 shrink-0">
                  <div className="flex items-center gap-2">
                    <div className="flex items-center gap-1.5">
                      <span className="h-3 w-3 rounded-full bg-rose-500/80 inline-block" />
                      <span className="h-3 w-3 rounded-full bg-amber-500/80 inline-block" />
                      <span className="h-3 w-3 rounded-full bg-emerald-500/80 inline-block" />
                    </div>
                    <span className="font-mono text-xs font-black text-slate-200 ml-2">
                      {selectedFile.path}
                    </span>
                  </div>

                  <div className="flex items-center gap-2">
                    <button
                      type="button"
                      onClick={handleCopyFileContent}
                      className="inline-flex items-center gap-1 px-3 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-xs font-bold text-slate-200 transition cursor-pointer"
                    >
                      {copiedCode ? (
                        <>
                          <Check className="h-3.5 w-3.5 text-emerald-400" />
                          <span className="text-emerald-400">Tersalin!</span>
                        </>
                      ) : (
                        <>
                          <Copy className="h-3.5 w-3.5 text-slate-400" />
                          <span>Salin Code</span>
                        </>
                      )}
                    </button>

                    <button
                      type="button"
                      onClick={() => downloadSingleFile(selectedFile)}
                      className="inline-flex items-center gap-1 px-3 py-1.5 rounded-lg bg-indigo-600 hover:bg-indigo-500 text-xs font-bold text-white transition cursor-pointer"
                    >
                      <Download className="h-3.5 w-3.5" />
                      <span>Unduh File</span>
                    </button>
                  </div>
                </div>

                <div className="py-2 text-[11px] text-slate-400 border-b border-slate-800/80 shrink-0">
                  {selectedFile.description}
                </div>

                {/* Code Content */}
                <div className="flex-1 overflow-auto mt-2 font-mono text-xs text-slate-300 leading-relaxed bg-slate-950/60 p-4 rounded-xl border border-slate-800/60 select-all">
                  <pre className="whitespace-pre">{selectedFile.content}</pre>
                </div>
              </div>
            </div>
          )}

          {/* TAB 2: PANDUAN INSTALASI & SETUP */}
          {activeTab === 'guide' && (
            <div className="h-full overflow-y-auto space-y-6 pr-2">
              {/* Box 1: XAMPP */}
              <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 p-6 shadow-xs space-y-4">
                <div className="flex items-center gap-3">
                  <span className="flex h-8 w-8 items-center justify-center rounded-xl bg-orange-100 dark:bg-orange-950 text-orange-600 dark:text-orange-400 font-black text-sm">
                    1
                  </span>
                  <div>
                    <h4 className="text-sm font-black text-slate-900 dark:text-white">
                      Panduan Menjalankan di XAMPP / Laragon (Komputer / Laptop Lokal)
                    </h4>
                    <p className="text-xs text-slate-500">
                      Sangat cocok untuk pemakaian kasir offline di ruko/workshop konveksi tanpa perlu sewa hosting.
                    </p>
                  </div>
                </div>

                <div className="space-y-3 text-xs text-slate-700 dark:text-slate-300">
                  <ol className="list-decimal list-inside space-y-2.5 pl-2 leading-relaxed">
                    <li>
                      <strong>Jalankan XAMPP Control Panel:</strong> Start service{' '}
                      <code className="bg-slate-100 dark:bg-slate-800 px-1.5 py-0.5 rounded font-mono font-bold">Apache</code>{' '}
                      dan{' '}
                      <code className="bg-slate-100 dark:bg-slate-800 px-1.5 py-0.5 rounded font-mono font-bold">MySQL</code>.
                    </li>
                    <li>
                      <strong>Buat Database:</strong> Buka web browser ke{' '}
                      <code className="bg-slate-100 dark:bg-slate-800 px-1.5 py-0.5 rounded font-mono text-indigo-600 dark:text-indigo-400">
                        http://localhost/phpmyadmin/
                      </code>
                      , buat database baru bernama{' '}
                      <strong className="text-indigo-600 dark:text-indigo-400">db_order_management</strong>.
                    </li>
                    <li>
                      <strong>Import database.sql:</strong> Klik tab <em>Import</em> di phpMyAdmin, pilih file{' '}
                      <code className="font-mono bg-slate-100 dark:bg-slate-800 px-1.5 py-0.5 rounded">database.sql</code>{' '}
                      lalu klik tombol <em>Go / Kirim</em>.
                    </li>
                    <li>
                      <strong>Salin Folder Backend:</strong> Download file ZIP dari tombol di atas, ekstrak isinya ke folder:{' '}
                      <code className="font-mono bg-slate-100 dark:bg-slate-800 px-1.5 py-0.5 rounded block mt-1">
                        C:\xampp\htdocs\order-api\
                      </code>
                    </li>
                    <li>
                      <strong>Uji Coba:</strong> Buka{' '}
                      <code className="font-mono bg-slate-100 dark:bg-slate-800 px-1.5 py-0.5 rounded text-emerald-600 dark:text-emerald-400">
                        http://localhost/order-api/api/settings.php
                      </code>{' '}
                      di browser. Jika keluar respon JSON, backend berhasil berjalan!
                    </li>
                  </ol>
                </div>
              </div>

              {/* Box 2: cPanel / VPS */}
              <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 p-6 shadow-xs space-y-4">
                <div className="flex items-center gap-3">
                  <span className="flex h-8 w-8 items-center justify-center rounded-xl bg-indigo-100 dark:bg-indigo-950 text-indigo-600 dark:text-indigo-400 font-black text-sm">
                    2
                  </span>
                  <div>
                    <h4 className="text-sm font-black text-slate-900 dark:text-white">
                      Panduan Deploy ke cPanel Hosting / Shared Hosting Online
                    </h4>
                    <p className="text-xs text-slate-500">
                      Untuk akses online multi-cabang atau multi-perangkat via internet 24 jam.
                    </p>
                  </div>
                </div>

                <div className="space-y-3 text-xs text-slate-700 dark:text-slate-300">
                  <ol className="list-decimal list-inside space-y-2.5 pl-2 leading-relaxed">
                    <li>
                      Masuk ke akun <strong>cPanel</strong> Anda, buka menu <strong>MySQL Database Wizard</strong>.
                    </li>
                    <li>
                      Buat database baru (misal: <code className="font-mono">u123_ordermanagement</code>), buat user MySQL & password, lalu centang <em>ALL PRIVILEGES</em>.
                    </li>
                    <li>
                      Buka menu <strong>phpMyAdmin</strong> di cPanel, pilih database yang baru dibuat, lalu <strong>Import</strong> file <code className="font-mono">database.sql</code>.
                    </li>
                    <li>
                      Buka <strong>File Manager</strong> cPanel, masuk ke folder <code className="font-mono">public_html/api/</code> (atau subdomain seperti <code className="font-mono">api.domainanda.com</code>).
                    </li>
                    <li>
                      Upload dan ekstrak seluruh file PHP backend ke folder tersebut.
                    </li>
                    <li>
                      Buka file <code className="font-mono">config/database.php</code> via editor cPanel, ubah konstanta <code className="font-mono">DB_NAME</code>, <code className="font-mono">DB_USER</code>, dan <code className="font-mono">DB_PASS</code> sesuai kredensial hosting Anda.
                    </li>
                  </ol>
                </div>
              </div>
            </div>
          )}

          {/* TAB 3: UJI KONEKSI LIVE */}
          {activeTab === 'connect' && (
            <div className="h-full overflow-y-auto space-y-5">
              <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 p-6 shadow-xs space-y-4">
                <div className="flex items-center justify-between">
                  <div>
                    <h4 className="text-sm font-black text-slate-900 dark:text-white flex items-center gap-2">
                      <Zap className="h-4 w-4 text-amber-500" />
                      Konfigurasi Target Endpoint REST API
                    </h4>
                    <p className="text-xs text-slate-500 mt-0.5">
                      Tentukan URL server PHP MySQL yang sedang aktif untuk pengujian koneksi data langsung.
                    </p>
                  </div>
                  <span
                    className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold ${
                      backendModeState === 'php_mysql'
                        ? 'bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300'
                        : 'bg-slate-100 text-slate-700 dark:bg-slate-800 dark:text-slate-300'
                    }`}
                  >
                    <span
                      className={`h-2 w-2 rounded-full ${
                        backendModeState === 'php_mysql' ? 'bg-emerald-500 animate-pulse' : 'bg-slate-400'
                      }`}
                    />
                    Mode: {backendModeState === 'php_mysql' ? 'PHP MySQL Server' : 'Local Storage Mode'}
                  </span>
                </div>

                <div className="space-y-2 pt-2">
                  <label className="text-xs font-bold text-slate-700 dark:text-slate-300">
                    URL Base Backend API (PHP):
                  </label>
                  <div className="flex flex-col sm:flex-row gap-2">
                    <input
                      type="url"
                      placeholder="http://localhost/order-api atau https://api.domainanda.com"
                      value={backendUrlInput}
                      onChange={(e) => setBackendUrlInput(e.target.value)}
                      className="flex-1 px-3.5 py-2.5 rounded-xl border border-slate-300 dark:border-slate-700 dark:bg-slate-800 font-mono text-xs text-slate-900 dark:text-white focus:ring-2 focus:ring-indigo-500"
                    />
                    <button
                      type="button"
                      onClick={handleTestConnection}
                      disabled={isTestingConn}
                      className="inline-flex items-center justify-center gap-1.5 px-5 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-extrabold shadow-md transition cursor-pointer shrink-0"
                    >
                      <RefreshCw className={`h-3.5 w-3.5 ${isTestingConn ? 'animate-spin' : ''}`} />
                      <span>{isTestingConn ? 'Menguji Koneksi...' : 'Test Ping Server'}</span>
                    </button>
                  </div>
                  <p className="text-[11px] text-slate-400">
                    Contoh Lokal XAMPP:{' '}
                    <code className="font-mono text-indigo-500">http://localhost/order-api</code> • Contoh Online:{' '}
                    <code className="font-mono text-indigo-500">https://api.namabisnis.com</code>
                  </p>
                </div>

                {testResult && (
                  <div
                    className={`p-4 rounded-xl text-xs font-bold flex items-start gap-3 border ${
                      testResult.success
                        ? 'bg-emerald-50 text-emerald-900 border-emerald-300 dark:bg-emerald-950/60 dark:text-emerald-200 dark:border-emerald-800'
                        : 'bg-rose-50 text-rose-900 border-rose-300 dark:bg-rose-950/60 dark:text-rose-200 dark:border-rose-800'
                    }`}
                  >
                    {testResult.success ? (
                      <CheckCircle2 className="h-5 w-5 text-emerald-600 shrink-0 mt-0.5" />
                    ) : (
                      <AlertCircle className="h-5 w-5 text-rose-600 shrink-0 mt-0.5" />
                    )}
                    <div className="space-y-1">
                      <p className="font-black">{testResult.message}</p>
                      {testResult.data && (
                        <pre className="text-[10px] font-mono bg-black/10 dark:bg-black/40 p-2 rounded-lg overflow-x-auto select-all">
                          {JSON.stringify(testResult.data, null, 2)}
                        </pre>
                      )}
                    </div>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* TAB 4: REST API ENDPOINTS TABLE */}
          {activeTab === 'apiDocs' && (
            <div className="h-full overflow-y-auto bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 p-5 shadow-xs">
              <div className="mb-4">
                <h4 className="text-sm font-black text-slate-900 dark:text-white">
                  Spesifikasi REST API Backend
                </h4>
                <p className="text-xs text-slate-500">
                  Format pertukaran data standar menggunakan JSON (application/json) dengan UTF-8 encoding.
                </p>
              </div>

              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs border-collapse">
                  <thead>
                    <tr className="border-b border-slate-200 dark:border-slate-800 text-[11px] font-black uppercase tracking-wider text-slate-500">
                      <th className="py-2.5 px-3">Metode</th>
                      <th className="py-2.5 px-3">Endpoint PHP</th>
                      <th className="py-2.5 px-3">Fungsi & Operasi</th>
                      <th className="py-2.5 px-3">Contoh Parameter</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 dark:divide-slate-800 text-slate-700 dark:text-slate-300">
                    <tr>
                      <td className="py-2.5 px-3 font-bold text-emerald-600">POST</td>
                      <td className="py-2.5 px-3 font-mono font-bold text-indigo-600 dark:text-indigo-400">/api/auth.php?action=login</td>
                      <td className="py-2.5 px-3">Login user (Owner/Admin/Produksi)</td>
                      <td className="py-2.5 px-3 font-mono text-[11px]">{"{ identifier, password }"}</td>
                    </tr>
                    <tr>
                      <td className="py-2.5 px-3 font-bold text-blue-600">GET</td>
                      <td className="py-2.5 px-3 font-mono font-bold text-indigo-600 dark:text-indigo-400">/api/orders.php</td>
                      <td className="py-2.5 px-3">Ambil semua orderan + filter status</td>
                      <td className="py-2.5 px-3 font-mono text-[11px]">?status=Produksi&search=Budi</td>
                    </tr>
                    <tr>
                      <td className="py-2.5 px-3 font-bold text-emerald-600">POST</td>
                      <td className="py-2.5 px-3 font-mono font-bold text-indigo-600 dark:text-indigo-400">/api/orders.php</td>
                      <td className="py-2.5 px-3">Simpan transaksi order baru / update</td>
                      <td className="py-2.5 px-3 font-mono text-[11px]">{"{ orderNumber, items: [], payments: [] }"}</td>
                    </tr>
                    <tr>
                      <td className="py-2.5 px-3 font-bold text-rose-600">DELETE</td>
                      <td className="py-2.5 px-3 font-mono font-bold text-indigo-600 dark:text-indigo-400">/api/orders.php?id=ord-xxx</td>
                      <td className="py-2.5 px-3">Hapus 1 data order beserta items & DP</td>
                      <td className="py-2.5 px-3 font-mono text-[11px]">?id=ord-101</td>
                    </tr>
                    <tr>
                      <td className="py-2.5 px-3 font-bold text-blue-600">GET</td>
                      <td className="py-2.5 px-3 font-mono font-bold text-indigo-600 dark:text-indigo-400">/api/customers.php</td>
                      <td className="py-2.5 px-3">Daftar pelanggan & kontak WhatsApp</td>
                      <td className="py-2.5 px-3 font-mono text-[11px]">?search=Bandung</td>
                    </tr>
                    <tr>
                      <td className="py-2.5 px-3 font-bold text-emerald-600">POST</td>
                      <td className="py-2.5 px-3 font-mono font-bold text-indigo-600 dark:text-indigo-400">/api/customers.php</td>
                      <td className="py-2.5 px-3">Tambah / perbarui data pelanggan</td>
                      <td className="py-2.5 px-3 font-mono text-[11px]">{"{ name, phone, address, organization }"}</td>
                    </tr>
                    <tr>
                      <td className="py-2.5 px-3 font-bold text-blue-600">GET</td>
                      <td className="py-2.5 px-3 font-mono font-bold text-indigo-600 dark:text-indigo-400">/api/expenses.php</td>
                      <td className="py-2.5 px-3">Daftar buku pengeluaran / belanja bahan</td>
                      <td className="py-2.5 px-3 font-mono text-[11px]">?category=bahan_baku</td>
                    </tr>
                    <tr>
                      <td className="py-2.5 px-3 font-bold text-blue-600">GET</td>
                      <td className="py-2.5 px-3 font-mono font-bold text-indigo-600 dark:text-indigo-400">/api/stats.php</td>
                      <td className="py-2.5 px-3">Ringkasan omset, profit, progress target</td>
                      <td className="py-2.5 px-3 font-mono text-[11px]">-</td>
                    </tr>
                    <tr>
                      <td className="py-2.5 px-3 font-bold text-blue-600">GET</td>
                      <td className="py-2.5 px-3 font-mono font-bold text-indigo-600 dark:text-indigo-400">/api/settings.php</td>
                      <td className="py-2.5 px-3">Pengaturan profil toko & rekening bank</td>
                      <td className="py-2.5 px-3 font-mono text-[11px]">-</td>
                    </tr>
                  </tbody>
                </table>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
