
import React, { useState } from 'react';
import { DownloadRequest, DownloadStatus } from '../types';
import { ArrowDownToLine, Loader2, Link as LinkIcon, Youtube, Twitter, Instagram } from 'lucide-react';

interface DownloaderFormProps {
  onDownload: (request: DownloadRequest) => void;
  status: DownloadStatus;
  statusMessage: string;
  progress: number;
}

export const VideoGenerator: React.FC<DownloaderFormProps> = ({ onDownload, status, statusMessage, progress }) => {
  const [url, setUrl] = useState('');
  const [quality, setQuality] = useState<'1080p' | '720p' | 'best'>('best');
  const [format, setFormat] = useState<'mp4' | 'mp3'>('mp4');

  const isProcessing = status !== DownloadStatus.IDLE && status !== DownloadStatus.ERROR && status !== DownloadStatus.COMPLETED;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!url.trim()) return;
    onDownload({ url, quality, format });
  };

  const getIconForUrl = (inputUrl: string) => {
    if (inputUrl.includes('youtube') || inputUrl.includes('youtu.be')) return <Youtube className="w-5 h-5 text-red-500" />;
    if (inputUrl.includes('twitter') || inputUrl.includes('x.com')) return <Twitter className="w-5 h-5 text-white" />;
    if (inputUrl.includes('instagram')) return <Instagram className="w-5 h-5 text-pink-500" />;
    return <LinkIcon className="w-5 h-5 text-slate-400" />;
  };

  return (
    <div className="bg-slate-800/40 border border-slate-700 rounded-2xl p-6 shadow-xl">
      <div className="flex items-center gap-2 mb-6">
        <div className="p-1.5 bg-slate-700/50 rounded-md">
          <ArrowDownToLine className="w-5 h-5 text-blue-400" />
        </div>
        <h2 className="text-lg font-semibold text-white">新建下载任务</h2>
      </div>

      <form onSubmit={handleSubmit} className="space-y-6">
        <div className="space-y-2">
          <label htmlFor="url" className="block text-sm font-medium text-slate-300">
            视频链接
          </label>
          <div className="relative group">
            <div className="absolute left-4 top-1/2 -translate-y-1/2 transition-transform group-focus-within:scale-110">
               {getIconForUrl(url)}
            </div>
            <input
              id="url"
              type="url"
              value={url}
              onChange={(e) => setUrl(e.target.value)}
              placeholder="在此粘贴 X (Twitter) 或 MP4 链接..."
              className="w-full bg-slate-900/50 border border-slate-700 rounded-xl py-4 pl-12 pr-4 text-sm text-white placeholder:text-slate-500 focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all outline-none font-mono"
              disabled={isProcessing}
              autoComplete="off"
            />
          </div>
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div className="space-y-2">
            <label className="block text-sm font-medium text-slate-300">目标格式</label>
            <div className="flex bg-slate-900/50 p-1 rounded-lg border border-slate-700">
              <button
                type="button"
                onClick={() => setFormat('mp4')}
                className={`flex-1 py-2 text-xs font-medium rounded-md transition-all ${format === 'mp4' ? 'bg-slate-700 text-white shadow-sm' : 'text-slate-400 hover:text-slate-300'}`}
              >
                MP4
              </button>
              <button
                type="button"
                onClick={() => setFormat('mp3')}
                className={`flex-1 py-2 text-xs font-medium rounded-md transition-all ${format === 'mp3' ? 'bg-slate-700 text-white shadow-sm' : 'text-slate-400 hover:text-slate-300'}`}
              >
                MP3
              </button>
            </div>
          </div>

          <div className="space-y-2">
            <label className="block text-sm font-medium text-slate-300">画质选择</label>
            <select
              value={quality}
              onChange={(e) => setQuality(e.target.value as any)}
              disabled={isProcessing}
              className="w-full bg-slate-900/50 border border-slate-700 rounded-lg py-2.5 px-3 text-sm text-white outline-none focus:border-blue-500 appearance-none cursor-pointer"
            >
              <option value="best">最佳 (原画)</option>
              <option value="1080p">1080p</option>
              <option value="720p">720p</option>
            </select>
          </div>
        </div>

        {/* Progress Status Bar */}
        {isProcessing && (
          <div className="bg-slate-900/50 rounded-lg p-3 border border-slate-700/50 space-y-2">
            <div className="flex justify-between text-xs font-mono">
              <span className="text-blue-300 animate-pulse">{statusMessage}</span>
              <span className="text-slate-400">{progress}%</span>
            </div>
            <div className="h-1.5 bg-slate-700 rounded-full overflow-hidden">
              <div 
                className="h-full bg-blue-500 transition-all duration-300 ease-out relative"
                style={{ width: `${progress}%` }}
              >
                <div className="absolute inset-0 bg-white/20 w-full h-full animate-pulse-slow"></div>
              </div>
            </div>
          </div>
        )}

        <button
          type="submit"
          disabled={isProcessing || !url.trim()}
          className={`w-full flex items-center justify-center gap-2 py-4 rounded-xl text-white font-semibold transition-all shadow-lg ${
            isProcessing
              ? 'bg-slate-700 cursor-not-allowed opacity-80'
              : 'bg-blue-600 hover:bg-blue-500 shadow-blue-900/20 active:scale-[0.98]'
          }`}
        >
          {isProcessing ? (
            <Loader2 className="w-5 h-5 animate-spin" />
          ) : (
            <>
              <ArrowDownToLine className="w-5 h-5" />
              <span>{status === DownloadStatus.COMPLETED ? '下载完成' : '开始解析并下载'}</span>
            </>
          )}
        </button>
        
        
      </form>
    </div>
  );
};
