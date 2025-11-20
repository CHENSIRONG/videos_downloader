
import { DownloadedVideo, DownloadRequest } from "../types";

const determineSource = (url: string): DownloadedVideo['source'] => {
  const lower = url.toLowerCase();
  if (lower.includes('youtube.com') || lower.includes('youtu.be')) return 'YouTube';
  if (lower.includes('twitter.com') || lower.includes('x.com')) return 'X (Twitter)';
  if (lower.includes('instagram.com')) return 'Instagram';
  if (lower.includes('tiktok.com')) return 'Unknown';
  return 'Direct Link';
};

// Improved Regex patterns
const PATTERNS = {
  // Matches x.com/user/status/12345... allowing for query params
  TWITTER: /(?:twitter\.com|x\.com)\/(?:#!\/)?(?:\w+)\/status(?:es)?\/(\d+)/,
  // Updated: Supports /watch?v=, /shorts/, and youtu.be/
  YOUTUBE: /(?:youtube\.com\/(?:watch\?v=|shorts\/)|youtu\.be\/)([a-zA-Z0-9_-]{11})/,
  INSTAGRAM: /instagram\.com\/(?:p|reel)\/([a-zA-Z0-9_-]+)/
};

const extractId = (url: string, source: string): string | null => {
  let match = null;
  if (source === 'X (Twitter)') match = url.match(PATTERNS.TWITTER);
  else if (source === 'YouTube') match = url.match(PATTERNS.YOUTUBE);
  else if (source === 'Instagram') match = url.match(PATTERNS.INSTAGRAM);
  
  return match ? match[1] : null;
};

/**
 * Attempts to fetch real video metadata from X/Twitter using fxtwitter API.
 */
const fetchRealXVideo = async (tweetId: string): Promise<{url: string, text?: string, thumb?: string} | null> => {
  try {
    const response = await fetch(`https://api.fxtwitter.com/status/${tweetId}`);
    if (!response.ok) return null;
    
    const data = await response.json();
    const tweet = data.tweet;

    if (tweet && tweet.media && tweet.media.videos && tweet.media.videos.length > 0) {
      const video = tweet.media.videos[tweet.media.videos.length - 1];
      return {
        url: video.url,
        text: tweet.text,
        thumb: tweet.media.photos?.[0]?.url
      };
    }
    return null;
  } catch (e) {
    console.warn("Real X parsing failed", e);
    return null;
  }
};

// Cobalt Instances - Prioritizing stable v10 instances
const COBALT_INSTANCES = [
  'https://api.server.social/api/json', // Often very stable for YouTube
  'https://co.wuk.sh/api/json',         // Popular, good support
  'https://cobalt.cascade.fun/api/json',
  'https://api.cobalt.tools/api/json'   // Official, strict rate limits
];

const fetchCobaltVideo = async (
  targetUrl: string, 
  request: DownloadRequest, 
  onProgress: (msg: string) => void
): Promise<any> => {
  
  // 1. Clean URL to ensure maximum compatibility
  let cleanUrl = targetUrl;
  try {
    const u = new URL(targetUrl);
    // For Shorts: Clean path and strip query params
    if (u.pathname.includes('/shorts/')) {
       // Extract ID specifically to rebuild clean URL
       const match = u.pathname.match(/\/shorts\/([a-zA-Z0-9_-]+)/);
       if (match && match[1]) {
           cleanUrl = `https://www.youtube.com/shorts/${match[1]}`;
       }
    } else if (u.searchParams.has('v')) {
       cleanUrl = `https://www.youtube.com/watch?v=${u.searchParams.get('v')}`;
    } else if (u.hostname === 'youtu.be') {
       cleanUrl = targetUrl; // usually fine
    }
  } catch (e) { /* ignore */ }

  // 2. Prepare v10 Request Body
  const body = {
    url: cleanUrl,
    videoQuality: request.quality === 'best' ? 'max' : request.quality.replace('p', ''),
    youtubeVideoCodec: 'h264', // Critical for compatibility
    filenameStyle: 'basic',
    alwaysProxy: true, // Needed to bypass YouTube IP blocking on streams
    isAudioOnly: request.format === 'mp3'
  };

  let lastError: any;

  // 3. Multi-instance Retry Loop
  for (const instance of COBALT_INSTANCES) {
    try {
      const domain = new URL(instance).hostname;
      onProgress(`正在请求解析服务器: ${domain}...`);
      
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 20000); // Increased to 20s for YouTube

      const response = await fetch(instance, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Accept': 'application/json'
        },
        body: JSON.stringify(body),
        signal: controller.signal
      });
      
      clearTimeout(timeoutId);

      if (!response.ok) throw new Error(`HTTP ${response.status}`);

      const data = await response.json();
      
      // Handle "Picker" response (common for Shorts/TikTok)
      if (data.status === 'picker' && data.picker) {
         // Try to find a video item
         const best = data.picker.find((p: any) => p.type === 'video');
         if (best) {
             return { ...data, url: best.url, status: 'stream' };
         }
      }

      // Handle Success
      if ((data.status === 'stream' || data.status === 'redirect') && data.url) {
        return data;
      }
      
      if (data.status === 'error') {
          // If rate limited, try next immediately
          throw new Error(data.text || 'Server returned error status');
      }

      throw new Error("Invalid response format");
      
    } catch (err: any) {
      console.warn(`Instance ${instance} failed:`, err.message);
      lastError = err;
      continue; // Try next
    }
  }

  throw lastError || new Error("所有解析节点均繁忙");
};


export const processDownload = async (
  request: DownloadRequest,
  onProgress: (status: string, progress: number) => void
): Promise<DownloadedVideo> => {
  
  const source = determineSource(request.url);
  const isDirectLink = source === 'Direct Link' && request.url.match(/\.(mp4|webm|mov)$/i);
  const contentId = extractId(request.url, source);

  // --- CASE 1: DIRECT LINK (Real Download) ---
  if (isDirectLink) {
    try {
      onProgress("正在检查文件有效性...", 10);
      const response = await fetch(request.url);
      if (!response.ok) throw new Error("Failed to fetch file");
      
      const reader = response.body?.getReader();
      const contentLength = + (response.headers.get('Content-Length') || '0');
      let receivedLength = 0;
      const chunks = [];

      if (reader) {
        while(true) {
          const {done, value} = await reader.read();
          if (done) break;
          chunks.push(value);
          receivedLength += value.length;
          if (contentLength > 0) {
            const percent = 20 + Math.round((receivedLength / contentLength) * 70);
            onProgress(`正在下载... ${(receivedLength/(1024*1024)).toFixed(1)}MB`, percent);
          } else {
             onProgress(`正在接收数据流... 已下载 ${(receivedLength/(1024*1024)).toFixed(1)}MB`, 50);
          }
        }
      }

      const blob = new Blob(chunks);
      const objectUrl = URL.createObjectURL(blob);
      onProgress("正在合成文件...", 100);
      
      return {
        id: crypto.randomUUID(),
        url: objectUrl,
        originalUrl: request.url,
        title: request.url.split('/').pop() || '未命名视频',
        source: 'Direct Link',
        size: `${(blob.size / (1024 * 1024)).toFixed(2)} MB`,
        duration: '未知',
        createdAt: Date.now()
      };

    } catch (e) {
      console.warn("Direct download failed, passing through as link.");
    }
  }

  // --- CASE 2: X (TWITTER) REAL PARSING ---
  if (source === 'X (Twitter)' && contentId) {
    onProgress("正在连接 X (Twitter) 服务器...", 20);
    await new Promise(r => setTimeout(r, 300));
    
    const realData = await fetchRealXVideo(contentId);
    
    if (realData) {
       onProgress("解析完成！", 100);

       return {
         id: crypto.randomUUID(),
         url: realData.url,
         originalUrl: request.url,
         title: realData.text ? realData.text.substring(0, 50) + (realData.text.length > 50 ? '...' : '') : `X 视频 ${contentId}`,
         source: 'X (Twitter)',
         size: "流媒体",
         duration: "未知",
         thumbnail: realData.thumb,
         createdAt: Date.now()
       };
    }
  }

  // --- CASE 3: YOUTUBE & GENERAL (via COBALT) ---
  if (source === 'YouTube' || source === 'Instagram' || source === 'Unknown') {
    onProgress("正在初始化解析引擎...", 10);
    
    try {
      const result = await fetchCobaltVideo(
        request.url, 
        request, 
        (msg) => onProgress(msg, 40)
      );
      
      onProgress("解析成功！准备下载...", 90);
      
      return {
        id: crypto.randomUUID(),
        url: result.url,
        originalUrl: request.url,
        title: result.filename || `视频 ${contentId || Date.now()}`,
        source: source,
        size: '流媒体',
        duration: '未知',
        thumbnail: source === 'YouTube' && contentId 
          ? `https://img.youtube.com/vi/${contentId}/mqdefault.jpg` 
          : undefined,
        createdAt: Date.now()
      };

    } catch (error: any) {
      console.error("Cobalt parse error:", error);
      throw new Error("无法解析该视频。请检查链接是否正确，或尝试重新下载。");
    }
  }

  throw new Error("不支持的链接格式");
};
