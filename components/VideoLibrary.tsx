
import React from 'react';
import { DownloadedVideo } from '../types';
import { Download, Trash2, PlayCircle, Youtube, Twitter, Link as LinkIcon, FileVideo, ExternalLink } from 'lucide-react';

interface VideoLibraryProps {
  videos: DownloadedVideo[];
  onDelete: (id: string) => void;
}

const SourceIcon = ({ source }: { source: string }) => {
  switch (source) {
    case 'YouTube': return <Youtube className="w-3 h-3 text-red-400" />;
    case 'X (Twitter)': return <Twitter className="w-3 h-3 text-sky-400" />;
    case 'Direct Link': return <LinkIcon className="w-3 h-3 text-emerald-400" />;
    default: return <FileVideo className="w-3 h-3 text-slate-400" />;
  }
};

export const VideoLibrary: React.FC<VideoLibraryProps> = ({ videos, onDelete }) => {
  if (videos.length === 0) {
    return (
      <div className="text-center py-24 bg-slate-800/20 border border-slate-700/50 border-dashed rounded-2xl">
        <div className="w-20 h-20 bg-slate-800/50 rounded-full flex items-center justify-center mx-auto mb-4 shadow-inner">
            <Download className="w-10 h-10 text-slate-600" />
        </div>
        <h3 className="text-slate-300 font-medium text-lg">下载列表为空</h3>
        <p className="text-slate-500 text-sm mt-2 max-w-xs mx-auto">
          请在上方粘贴视频链接开始建立您的离线媒体库。
        </p>
      </div>
    );
  }

  return (
    <div className="grid grid-cols-1 gap-4">
      {videos.map((video) => {
        const isBlob = video.url.startsWith('blob:');
        
        return (
        <div key={video.id} className="flex flex-col sm:flex-row bg-slate-800/40 border border-slate-700 rounded-xl overflow-hidden hover:border-slate-600 transition-all group">
          
          {/* Thumbnail / Video Preview */}
          <div className="relative sm:w-48 lg:w-60 bg-black shrink-0 aspect-video sm:aspect-auto group-hover:brightness-110 transition-all">
            <video
              src={video.url}
              controls
              className="w-full h-full object-cover"
              poster={video.thumbnail}
              preload="metadata"
            />
            {!video.thumbnail && (
               <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
                  <PlayCircle className="w-10 h-10 text-white/50" />
               </div>
            )}
          </div>
          
          {/* Content */}
          <div className="flex-1 p-4 flex flex-col justify-between">
            <div>
              <div className="flex items-start justify-between gap-4">
                <h4 className="text-sm font-medium text-white line-clamp-2 leading-relaxed font-sans" title={video.title}>
                  {video.title}
                </h4>
                <button 
                  onClick={() => onDelete(video.id)}
                  className="text-slate-500 hover:text-red-400 transition-colors p-1"
                  title="移除记录"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>
              <div className="flex items-center gap-2 mt-2 text-xs font-mono text-slate-400">
                 <span className="px-1.5 py-0.5 bg-slate-700/50 rounded text-slate-300">{video.duration}</span>
                 <span>•</span>
                 <span>{video.size}</span>
              </div>
            </div>
            
            <div className="flex items-center justify-between mt-4 sm:mt-0 pt-3 sm:pt-0">
                <div className="flex items-center gap-2 text-xs text-slate-500 bg-slate-900/30 px-2 py-1 rounded-md border border-slate-800">
                    <SourceIcon source={video.source} />
                    <span>{video.source}</span>
                </div>
                
                {isBlob ? (
                  <a
                    href={video.url}
                    download={`uni-stream-${video.id}.mp4`}
                    className="flex items-center gap-2 px-4 py-2 bg-blue-600 hover:bg-blue-500 text-white text-xs font-medium rounded-lg transition-all shadow-lg shadow-blue-900/20"
                  >
                    <Download className="w-3 h-3" />
                    保存到本地
                  </a>
                ) : (
                  <a
                    href={video.url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex items-center gap-2 px-4 py-2 bg-slate-700 hover:bg-blue-600 text-white text-xs font-medium rounded-lg transition-all border border-slate-600 hover:border-blue-500"
                    title="外部链接 - 点击跳转下载"
                  >
                    <ExternalLink className="w-3 h-3" />
                    下载视频
                  </a>
                )}
            </div>
          </div>
        </div>
      )})} 
    </div>
  );
};
