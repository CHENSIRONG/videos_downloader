
import React, { useState } from 'react';
import { Header } from './components/Header';
import { VideoGenerator } from './components/VideoGenerator'; // This is now the DownloaderForm
import { VideoLibrary } from './components/VideoLibrary';
import { DownloadedVideo, DownloadRequest, DownloadStatus } from './types';
import { processDownload } from './services/geminiService'; // Renamed logic inside

export default function App() {
  const [videos, setVideos] = useState<DownloadedVideo[]>([]);
  const [status, setStatus] = useState<DownloadStatus>(DownloadStatus.IDLE);
  const [statusMessage, setStatusMessage] = useState<string>('');
  const [progress, setProgress] = useState<number>(0);

  const handleDownload = async (request: DownloadRequest) => {
    try {
      setStatus(DownloadStatus.RESOLVING);
      setStatusMessage("初始化连接...");
      setProgress(5);

      const newVideo = await processDownload(request, (msg, prog) => {
         setStatusMessage(msg);
         setProgress(prog);
         // Map progress to crude status enums for UI states if needed
         if (prog > 20) setStatus(DownloadStatus.FETCHING_INFO);
         if (prog > 40) setStatus(DownloadStatus.DOWNLOADING);
         if (prog > 90) setStatus(DownloadStatus.PROCESSING);
      });
      
      setVideos(prev => [newVideo, ...prev]);
      setStatus(DownloadStatus.COMPLETED);
      setStatusMessage("下载完成！");
      setProgress(100);
      
      // Reset status after a delay
      setTimeout(() => {
        setStatus(DownloadStatus.IDLE);
        setStatusMessage('');
        setProgress(0);
      }, 3000);

    } catch (error: any) {
      console.error("Download Error:", error);
      setStatus(DownloadStatus.ERROR);
      setStatusMessage("下载失败，链接可能无效或受保护。");
      setProgress(0);
    }
  };

  const handleDelete = (id: string) => {
    setVideos(prev => prev.filter(v => v.id !== id));
  };

  return (
    <div className="min-h-screen bg-[#0f172a] pb-20">
      <Header />
      
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
          
          {/* Left Panel: Downloader Form */}
          <div className="lg:col-span-4 xl:col-span-4 space-y-6">
            <div className="sticky top-24">
                <VideoGenerator 
                    onDownload={handleDownload} 
                    status={status}
                    statusMessage={statusMessage}
                    progress={progress}
                />
                
                <div className="mt-6 p-4 bg-slate-800/40 border border-slate-700 rounded-xl">
                  <h3 className="text-sm font-semibold text-slate-300 mb-2">支持平台</h3>
                  <div className="flex flex-wrap gap-2">
                     <span className="px-2 py-1 bg-slate-700 rounded text-xs text-slate-400">X / Twitter</span>
                     <span className="px-2 py-1 bg-slate-700 rounded text-xs text-slate-400">MP4 直链</span>
                  </div>
                  <p className="text-xs text-slate-500 mt-3 leading-relaxed">
                    注意：受 DRM 保护的流媒体（如 Netflix）无法下载。本工具仅供个人离线保存学习使用。
                  </p>
                </div>
            </div>
          </div>

          {/* Right Panel: Library */}
          <div className="lg:col-span-8 xl:col-span-8">
            <div className="flex items-center justify-between mb-6">
                <h2 className="text-2xl font-bold text-white tracking-tight">下载列表</h2>
                <span className="px-3 py-1 rounded-full bg-slate-800 border border-slate-700 text-xs text-slate-400 font-mono">
                    {videos.length} 个任务
                </span>
            </div>
            <VideoLibrary videos={videos} onDelete={handleDelete} />
          </div>
          
        </div>
      </main>
    </div>
  );
}
