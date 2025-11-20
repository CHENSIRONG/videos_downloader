
import React from 'react';
import { DownloadCloud, Globe, ShieldCheck } from 'lucide-react';

export const Header: React.FC = () => {
  return (
    <header className="border-b border-slate-800 bg-slate-900/50 backdrop-blur-md sticky top-0 z-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
        <div className="flex items-center gap-3 text-blue-400">
          <div className="bg-blue-600 p-2 rounded-lg shadow-lg shadow-blue-900/20">
            <DownloadCloud className="w-6 h-6 text-white" />
          </div>
          <div>
            <h1 className="text-xl font-bold tracking-tight text-white">视频下载器</h1>
            <p className="text-xs text-slate-400 font-medium">全能视频下载助手</p>
          </div>
        </div>
        
        
      </div>
    </header>
  );
};
