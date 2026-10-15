import React, { useState } from 'react';
import { BackendConfig } from '../types/bus';
import {
  X,
  Server,
  CheckCircle2,
  AlertCircle,
  Copy,
  Check,
  Code2,
  ExternalLink,
  ShieldCheck,
  Zap,
} from 'lucide-react';

interface BackendConnectorModalProps {
  isOpen: boolean;
  onClose: () => void;
  config: BackendConfig;
  onSaveConfig: (config: BackendConfig) => void;
}

export const BackendConnectorModal: React.FC<BackendConnectorModalProps> = ({
  isOpen,
  onClose,
  config,
  onSaveConfig,
}) => {
  const [mode, setMode] = useState<'simulated' | 'custom_api'>(config.mode);
  const [apiUrl, setApiUrl] = useState(config.apiUrl);
  const [apiKey, setApiKey] = useState(config.apiKey || '');
  const [refreshInterval, setRefreshInterval] = useState(config.refreshInterval || 15);
  const [testStatus, setTestStatus] = useState<'idle' | 'testing' | 'success' | 'error'>('idle');
  const [testMessage, setTestMessage] = useState('');
  const [copiedSnippet, setCopiedSnippet] = useState(false);

  if (!isOpen) return null;

  const handleTestConnection = async () => {
    if (!apiUrl.trim()) {
      setTestStatus('error');
      setTestMessage('Please specify an API URL to test.');
      return;
    }

    setTestStatus('testing');
    setTestMessage('Pinging backend endpoint...');

    try {
      const base = typeof window !== 'undefined' ? window.location.origin : 'http://localhost:3000';
      const url = new URL(apiUrl, base);
      url.searchParams.set('BusStopCode', '83139');

      const headers: Record<string, string> = { Accept: 'application/json' };
      if (apiKey) {
        headers['AccountKey'] = apiKey;
        headers['Authorization'] = `Bearer ${apiKey}`;
      }

      const res = await fetch(url.toString(), {
        method: 'GET',
        headers,
      });

      if (res.ok) {
        const data = await res.json();
        setTestStatus('success');
        setTestMessage(
          `Connected! Status 200 OK. Received ${
            data?.Services?.length ?? 'valid'
          } bus services from endpoint.`
        );
      } else {
        setTestStatus('error');
        setTestMessage(`Server responded with HTTP ${res.status}: ${res.statusText}`);
      }
    } catch (err: unknown) {
      setTestStatus('error');
      setTestMessage(
        `Failed to reach endpoint: ${err instanceof Error ? err.message : 'Network error / CORS blockage'}`
      );
    }
  };

  const handleSave = () => {
    onSaveConfig({
      mode,
      apiUrl: apiUrl.trim(),
      apiKey: apiKey.trim(),
      refreshInterval,
    });
    onClose();
  };

  const backendCodeSnippet = `// Example Express / Node.js Proxy for LTA DataMall v2
import express from 'express';
import cors from 'cors';
import fetch from 'node-fetch';

const app = express();
app.use(cors());

const LTA_API_KEY = process.env.LTA_DATAMALL_KEY; // Your LTA DataMall Key

app.get('/api/bus-arrival', async (req, res) => {
  const { BusStopCode } = req.query;
  try {
    const response = await fetch(
      \`http://datamall2.mytransport.sg/ltaodataservice/v3/BusArrival?BusStopCode=\${BusStopCode}\`,
      {
        headers: {
          'AccountKey': LTA_API_KEY,
          'accept': 'application/json',
        },
      }
    );
    const data = await response.json();
    res.json(data);
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch LTA bus arrival' });
  }
});

app.listen(5000, () => console.log('LTA Proxy listening on port 5000'));`;

  const copyToClipboard = () => {
    navigator.clipboard.writeText(backendCodeSnippet);
    setCopiedSnippet(true);
    setTimeout(() => setCopiedSnippet(false), 2000);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-in fade-in duration-200">
      <div className="bg-slate-900 border border-slate-700 w-full max-w-2xl max-h-[90vh] rounded-2xl shadow-2xl flex flex-col overflow-hidden">
        {/* Header */}
        <div className="p-5 border-b border-slate-800 flex items-center justify-between bg-slate-950/70">
          <div className="flex items-center gap-3">
            <div className="p-2.5 rounded-xl bg-emerald-500/10 border border-emerald-500/30 text-emerald-400">
              <Server className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-lg font-bold text-white">Backend Connection Setup</h2>
              <p className="text-xs text-slate-400">
                Configure your future backend API or use the high-fidelity LTA simulation engine
              </p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="p-2 rounded-xl text-slate-400 hover:text-white hover:bg-slate-800 transition"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto p-5 space-y-6">
          {/* Mode Switcher */}
          <div className="grid grid-cols-2 gap-3 p-1 bg-slate-950 rounded-xl border border-slate-800">
            <button
              onClick={() => setMode('simulated')}
              className={`p-3 rounded-lg text-left transition-all ${
                mode === 'simulated'
                  ? 'bg-slate-800 text-white shadow border border-slate-700'
                  : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              <div className="flex items-center gap-2 mb-1">
                <Zap className="w-4 h-4 text-emerald-400" />
                <span className="font-bold text-sm">Simulated LTA Engine</span>
              </div>
              <p className="text-xs text-slate-400">
                Active now. Real Singapore routes, dynamic GPS moving buses, and realistic crowd loads.
              </p>
            </button>

            <button
              onClick={() => setMode('custom_api')}
              className={`p-3 rounded-lg text-left transition-all ${
                mode === 'custom_api'
                  ? 'bg-slate-800 text-white shadow border border-slate-700'
                  : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              <div className="flex items-center gap-2 mb-1">
                <Server className="w-4 h-4 text-sky-400" />
                <span className="font-bold text-sm">Custom Backend API</span>
              </div>
              <p className="text-xs text-slate-400">
                Ready for when you deploy your own Express/FastAPI/Serverless backend proxy.
              </p>
            </button>
          </div>

          {/* Custom API Config Fields */}
          {mode === 'custom_api' && (
            <div className="space-y-4 bg-slate-800/40 border border-slate-700/60 rounded-xl p-4">
              <div>
                <div className="flex items-center justify-between mb-1.5">
                  <label className="text-xs font-semibold text-slate-300">
                    Backend API Base URL
                  </label>
                  <button
                    type="button"
                    onClick={() => setApiUrl('/api/busarrival')}
                    className="text-[11px] text-emerald-400 hover:text-emerald-300 font-mono underline"
                  >
                    Use Serverless Proxy (/api/busarrival)
                  </button>
                </div>
                <input
                  type="text"
                  value={apiUrl}
                  onChange={(e) => setApiUrl(e.target.value)}
                  placeholder="e.g. /api/busarrival or http://localhost:5000/api/bus-arrival"
                  className="w-full px-3.5 py-2 rounded-lg bg-slate-900 border border-slate-700 text-sm text-slate-100 placeholder-slate-500 font-mono focus:outline-none focus:border-emerald-500"
                />
                <p className="text-[11px] text-slate-400 mt-1">
                  The frontend will make calls to:{' '}
                  <span className="font-mono text-emerald-400">
                    {apiUrl || '/api/busarrival'}?BusStopCode=83139
                  </span>
                </p>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1.5">
                  Optional LTA AccountKey / Auth Header (sent as AccountKey header)
                </label>
                <input
                  type="password"
                  value={apiKey}
                  onChange={(e) => setApiKey(e.target.value)}
                  placeholder="Leave blank if handled by your server-side proxy"
                  className="w-full px-3.5 py-2 rounded-lg bg-slate-900 border border-slate-700 text-sm text-slate-100 placeholder-slate-500 font-mono focus:outline-none focus:border-emerald-500"
                />
              </div>

              {/* Ping Test Button */}
              <div className="pt-2 flex items-center justify-between">
                <button
                  type="button"
                  onClick={handleTestConnection}
                  disabled={testStatus === 'testing'}
                  className="px-3.5 py-2 rounded-lg bg-slate-700 hover:bg-slate-600 text-xs font-bold text-white transition disabled:opacity-50 flex items-center gap-1.5"
                >
                  <Server className="w-3.5 h-3.5" />
                  <span>{testStatus === 'testing' ? 'Testing...' : 'Test Connection'}</span>
                </button>

                {testStatus === 'success' && (
                  <span className="text-xs text-emerald-400 flex items-center gap-1 font-medium">
                    <CheckCircle2 className="w-4 h-4 shrink-0" />
                    <span>{testMessage}</span>
                  </span>
                )}

                {testStatus === 'error' && (
                  <span className="text-xs text-rose-400 flex items-center gap-1 font-medium">
                    <AlertCircle className="w-4 h-4 shrink-0" />
                    <span>{testMessage}</span>
                  </span>
                )}
              </div>
            </div>
          )}

          {/* Quick Copy Backend Implementation Code */}
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold uppercase tracking-wider text-slate-400 flex items-center gap-1.5">
                <Code2 className="w-4 h-4 text-emerald-400" />
                Backend Proxy Template (Node.js / Express)
              </span>
              <button
                onClick={copyToClipboard}
                className="flex items-center gap-1 text-xs text-slate-300 hover:text-white bg-slate-800 px-2.5 py-1 rounded-md border border-slate-700 transition"
              >
                {copiedSnippet ? (
                  <>
                    <Check className="w-3.5 h-3.5 text-emerald-400" />
                    <span className="text-emerald-400">Copied!</span>
                  </>
                ) : (
                  <>
                    <Copy className="w-3.5 h-3.5" />
                    <span>Copy Snippet</span>
                  </>
                )}
              </button>
            </div>

            <pre className="p-3.5 bg-slate-950 rounded-xl border border-slate-800 text-[11px] font-mono text-slate-300 overflow-x-auto leading-relaxed">
              {backendCodeSnippet}
            </pre>
          </div>
        </div>

        {/* Modal Footer */}
        <div className="p-4 border-t border-slate-800 bg-slate-950/80 flex items-center justify-end gap-3">
          <button
            onClick={onClose}
            className="px-4 py-2 rounded-xl text-xs font-semibold text-slate-400 hover:text-white transition"
          >
            Cancel
          </button>
          <button
            onClick={handleSave}
            className="px-5 py-2 rounded-xl bg-emerald-500 hover:bg-emerald-400 text-slate-950 text-xs font-bold shadow-lg shadow-emerald-500/20 transition active:scale-95"
          >
            Save Settings
          </button>
        </div>
      </div>
    </div>
  );
};
