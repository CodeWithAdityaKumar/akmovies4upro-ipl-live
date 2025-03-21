"use client";

import { useState, useEffect, useRef } from "react";
import Hls from "hls.js";

const LivePlayer = ({ matchId, streamUrl = "https://res.cloudinary.com/dy1mqjddr/video/upload/sp_hd/v1741989910/cgds8tkp8cc0eu8gijpl.m3u8" }) => {
  const [isPlaying, setIsPlaying] = useState(false);
  const [volume, setVolume] = useState(50);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [showControls, setShowControls] = useState(true);
  const [showMatchInfo, setShowMatchInfo] = useState(true);
  const [qualities, setQualities] = useState([]);
  const [currentQuality, setCurrentQuality] = useState(null);
  const [showQualityOptions, setShowQualityOptions] = useState(false);
  const [isQualityMenuHovered, setIsQualityMenuHovered] = useState(false);
  const [currentStreamUrl, setCurrentStreamUrl] = useState(streamUrl);
  const [streamData, setStreamData] = useState(null);
  const [matchInfo, setMatchInfo] = useState(null);
  const [viewerCount, setViewerCount] = useState(0);
  const [isLoading, setIsLoading] = useState(true);
  const playerRef = useRef(null);
  const controlsTimeoutRef = useRef(null);
  const hlsRef = useRef(null);

  // Initialize HLS.js player
  // Fetch match and stream data from Supabase
  useEffect(() => {
    const fetchStreamData = async () => {
      try {
        if (!matchId) return;
        
        // First try to get stream data from the API
        const response = await fetch(`/api/streams?match_id=${matchId}&status=live`);
        const data = await response.json();
        
        if (data && data.length > 0) {
          setStreamData(data[0]);
          setCurrentStreamUrl(data[0].stream_url);
          
          // Also fetch the match details
          const matchResponse = await fetch(`/api/matches?id=${matchId}`);
          const matchData = await matchResponse.json();
          
          if (matchData && matchData.length > 0) {
            setMatchInfo(matchData[0]);
          }
          
          // Update viewer count periodically
          const interval = setInterval(async () => {
            try {
              const analyticsResponse = await fetch(`/api/analytics/stream?stream_id=${data[0].id}`);
              const analyticsData = await analyticsResponse.json();
              if (analyticsData && analyticsData.viewer_count) {
                setViewerCount(analyticsData.viewer_count);
              }
            } catch (err) {
              console.error('Error fetching viewer count:', err);
            }
          }, 30000); // Update every 30 seconds
          
          return () => clearInterval(interval);
        } else {
          // Fallback to provided streamUrl if API data not available
          setCurrentStreamUrl(streamUrl);
        }
      } catch (error) {
        console.error('Error fetching stream data:', error);
        // Fallback to provided streamUrl if API request fails
        setCurrentStreamUrl(streamUrl);
      } finally {
        setIsLoading(false);
      }
    };
    
    fetchStreamData();
  }, [matchId, streamUrl]);

  // Initialize the HLS player when currentStreamUrl is available
  useEffect(() => {
    // Only run this effect when playerRef is available and currentStreamUrl exists
    if (!playerRef.current || !currentStreamUrl) return;

    const video = playerRef.current.querySelector('video');
    if (!video) return;
    
    // Record a stream view (anonymous)
    const recordView = async () => {
      try {
        if (streamData && streamData.id) {
          await fetch('/api/analytics/view', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ stream_id: streamData.id })
          });
        }
      } catch (error) {
        console.error('Error recording view:', error);
      }
    };
    
    // Record view on stream start
    const handlePlaying = () => {
      recordView();
    };
    
    video.addEventListener('playing', handlePlaying, { once: true });

    // Clean up any existing hls instance
    if (hlsRef.current) {
      hlsRef.current.destroy();
    }

    // Check if the browser supports HLS natively
    if (Hls.isSupported()) {
      const hls = new Hls({
        capLevelToPlayerSize: true,
        maxBufferLength: 30,
        maxMaxBufferLength: 60
      });
      hlsRef.current = hls;

      hls.loadSource(currentStreamUrl);
      hls.attachMedia(video);
        
      hls.on(Hls.Events.MANIFEST_PARSED, function (event, data) {
        // Get available quality levels
        const availableLevels = hls.levels.map((level, index) => ({
          id: index,
          height: level.height,
          bitrate: level.bitrate,
          name: level.height ? `${level.height}p` : `Level ${index}`
        }));

        // Add 'Auto' as the first option
        availableLevels.unshift({ id: -1, name: "Auto" });
        
        setQualities(availableLevels);
          
        // Set initial quality to Auto
        setCurrentQuality(availableLevels[0]);

        // Try to play video but handle autoplay restrictions gracefully
        video.play().catch(e => {
          console.warn('Auto play failed, waiting for user interaction:', e);
          // We'll let the user start the playback manually
          setIsPlaying(false);
        });
      });

      hls.on(Hls.Events.ERROR, function (event, data) {
        if (data.fatal) {
          switch(data.type) {
            case Hls.ErrorTypes.NETWORK_ERROR:
              console.error('Network error encountered, trying to recover...');
              hls.startLoad();
              break;
            case Hls.ErrorTypes.MEDIA_ERROR:
              console.error('Media error encountered, trying to recover...');
              hls.recoverMediaError();
              break;
            default:
              console.error('Unrecoverable error encountered, destroying HLS instance:', data);
              hls.destroy();
              break;
          }
        }
      });

      return () => {
        if (hls) {
          hls.destroy();
          hlsRef.current = null;
        }
      };
    } else if (video.canPlayType('application/vnd.apple.mpegurl')) {
      // For browsers that support HLS natively (Safari, iOS, etc)
      video.src = currentStreamUrl;
      video.addEventListener('loadedmetadata', () => {
        video.play().catch(e => {
          console.warn('Auto play failed in native HLS, waiting for user interaction:', e);
          setIsPlaying(false);
        });
      });

      // Native HLS doesn't provide quality selection, so we'll just show a placeholder
      setQualities([{ id: -1, name: "Auto" }]);
      setCurrentQuality({ id: -1, name: "Auto" });
    }
  }, [currentStreamUrl]);

  // Auto-hide controls
  useEffect(() => {
    // Auto-hide controls after a few seconds of inactivity
    const handleMouseMove = () => {
      setShowControls(true);
      setShowMatchInfo(true);
      
      if (controlsTimeoutRef.current) {
        clearTimeout(controlsTimeoutRef.current);
      }
      
      controlsTimeoutRef.current = setTimeout(() => {
        if (isPlaying && !isQualityMenuHovered) {
          setShowControls(false);
          setShowMatchInfo(false);
          if (!isQualityMenuHovered) {
            setShowQualityOptions(false);
          }
        }
      }, 3000);
    };

    const playerElement = playerRef.current;
    if (playerElement) {
      playerElement.addEventListener("mousemove", handleMouseMove);
    }

    return () => {
      if (playerElement) {
        playerElement.removeEventListener("mousemove", handleMouseMove);
      }
      if (controlsTimeoutRef.current) {
        clearTimeout(controlsTimeoutRef.current);
      }
    };
  }, [isPlaying]);

  const handlePlayPause = () => {
    const video = playerRef.current.querySelector("video");
    if (video) {
      if (isPlaying) {
        video.pause();
      } else {
        video.play().catch(e => console.error('Play failed:', e));
      }
      setIsPlaying(!isPlaying);
    }
  };

  const handleQualityChange = (quality) => {
    if (Hls.isSupported() && hlsRef.current) {
      // Set quality level (-1 is auto)
      hlsRef.current.currentLevel = quality.id;
      setCurrentQuality(quality);
      setShowQualityOptions(false);
    }
  };

  const handleVolumeChange = (e) => {
    const newVolume = parseInt(e.target.value);
    setVolume(newVolume);
    
    const video = playerRef.current.querySelector("video");
    if (video) {
      video.volume = newVolume / 100;
    }
  };

  const toggleFullscreen = () => {
    if (playerRef.current) {
      if (!document.fullscreenElement) {
        playerRef.current.requestFullscreen().catch(err => {
          console.error(`Error attempting to enable fullscreen: ${err.message}`);
        });
        // Add fullscreen-specific styling
        const videoElement = playerRef.current.querySelector('video');
        if (videoElement) {
          videoElement.classList.add('object-contain', 'w-screen', 'h-screen');
        }
      } else {
        document.exitFullscreen();
        // Remove fullscreen-specific styling
        const videoElement = playerRef.current.querySelector('video');
        if (videoElement) {
          videoElement.classList.remove('w-screen', 'h-screen');
        }
      }
    }
  };

  useEffect(() => {
    const handleFullscreenChange = () => {
      setIsFullscreen(!!document.fullscreenElement);
    };

    document.addEventListener("fullscreenchange", handleFullscreenChange);
    
    return () => {
      document.removeEventListener("fullscreenchange", handleFullscreenChange);
    };
  }, []);

  return (
    <div className="w-full aspect-video bg-black rounded-lg overflow-hidden relative" ref={playerRef}>
      {/* Video Player */}
      <video 
        className="w-full h-full object-contain"
        poster="/images/match-poster.jpg"
        preload="metadata"
        controlsList="nodownload"
        playsInline
        muted
      />
      
      {/* Play button overlay when paused */}
      {!isPlaying && (
        <div 
          className="absolute inset-0 flex items-center justify-center cursor-pointer"
          onClick={handlePlayPause}
        >
          <div className="bg-blue-900 bg-opacity-70 rounded-full p-5">
            <svg xmlns="http://www.w3.org/2000/svg" className="h-12 w-12 text-white" viewBox="0 0 20 20" fill="currentColor">
              <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM9.555 7.168A1 1 0 008 8v4a1 1 0 001.555.832l3-2a1 1 0 000-1.664l-3-2z" clipRule="evenodd" />
            </svg>
          </div>
        </div>
      )}
      
      {/* Video Controls */}
      <div 
        className={`absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black to-transparent p-2 md:p-4 transition-opacity duration-300 ${showControls ? 'opacity-100' : 'opacity-0'}`}
      >
        <div className="flex flex-wrap items-center justify-between gap-2 sm:gap-0">
          <button 
            className="text-white focus:outline-none"
            onClick={handlePlayPause}
          >
            {isPlaying ? (
              <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" viewBox="0 0 20 20" fill="currentColor">
                <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zM7 8a1 1 0 012 0v4a1 1 0 11-2 0V8zm5-1a1 1 0 00-1 1v4a1 1 0 102 0V8a1 1 0 00-1-1z" clipRule="evenodd" />
              </svg>
            ) : (
              <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" viewBox="0 0 20 20" fill="currentColor">
                <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM9.555 7.168A1 1 0 008 8v4a1 1 0 001.555.832l3-2a1 1 0 000-1.664l-3-2z" clipRule="evenodd" />
              </svg>
            )}
          </button>
          
          <div className="flex items-center mx-4 flex-1">
            <div className="text-white mr-2">
              <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                {volume === 0 ? (
                  <path fillRule="evenodd" d="M9.383 3.076A1 1 0 0110 4v12a1 1 0 01-1.707.707L4.586 13H2a1 1 0 01-1-1V8a1 1 0 011-1h2.586l3.707-3.707a1 1 0 011.09-.217zM12.293 7.293a1 1 0 011.414 0L15 8.586l1.293-1.293a1 1 0 111.414 1.414L16.414 10l1.293 1.293a1 1 0 01-1.414 1.414L15 11.414l-1.293 1.293a1 1 0 01-1.414-1.414L13.586 10l-1.293-1.293a1 1 0 010-1.414z" clipRule="evenodd" />
                ) : volume < 50 ? (
                  <path fillRule="evenodd" d="M10 3.75a.75.75 0 01.75.75v10.5a.75.75 0 01-1.5 0V4.5a.75.75 0 01.75-.75zM14.25 5a.75.75 0 01.75.75v8.5a.75.75 0 01-1.5 0v-8.5a.75.75 0 01.75-.75z" />
                ) : (
                  <path fillRule="evenodd" d="M9.383 3.076A1 1 0 0110 4v12a1 1 0 01-1.707.707L4.586 13H2a1 1 0 01-1-1V8a1 1 0 011-1h2.586l3.707-3.707a1 1 0 011.09-.217zM14.657 2.929a1 1 0 011.414 0A9.972 9.972 0 0119 10a9.972 9.972 0 01-2.929 7.071 1 1 0 01-1.414-1.414A7.971 7.971 0 0017 10c0-2.21-.894-4.208-2.343-5.657a1 1 0 010-1.414zm-2.829 2.828a1 1 0 011.415 0A5.983 5.983 0 0115 10a5.984 5.984 0 01-1.757 4.243 1 1 0 01-1.415-1.415A3.984 3.984 0 0013 10a3.983 3.983 0 00-1.172-2.828 1 1 0 010-1.415z" clipRule="evenodd" />
                )}
              </svg>
            </div>
            <input 
              type="range" 
              min="0" 
              max="100" 
              value={volume} 
              onChange={handleVolumeChange}
              className="w-24 h-1 bg-gray-500 rounded-lg appearance-none focus:outline-none"
            />
          </div>
          
          <div className="text-white text-sm font-medium relative mr-4">
            <button 
              className="flex items-center bg-blue-900 bg-opacity-70 px-2 py-1 rounded text-xs font-medium hover:bg-blue-800"
              onClick={() => setShowQualityOptions(!showQualityOptions)}
            >
              <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 mr-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 3v4M3 5h4M6 17v4m-2-2h4m5-16l2.286 6.857L21 12l-5.714 2.143L13 21l-2.286-6.857L5 12l5.714-2.143L13 3z" />
              </svg>
              {currentQuality ? currentQuality.name : "Quality"}
            </button>
            
            {showQualityOptions && (
              <div 
                className="absolute bottom-full left-0 mb-1 bg-gray-900 rounded shadow-lg z-10 p-1 w-32"
                onMouseEnter={() => setIsQualityMenuHovered(true)}
                onMouseLeave={() => setIsQualityMenuHovered(false)}
              >
                {qualities.map((quality) => (
                  <button
                    key={quality.id}
                    className={`w-full text-left px-3 py-2 text-xs rounded ${currentQuality && currentQuality.id === quality.id ? 'bg-blue-600' : 'hover:bg-gray-700'}`}
                    onClick={() => handleQualityChange(quality)}
                  >
                    {quality.name}
                  </button>
                ))}
              </div>
            )}
          </div>

          <div className="text-white text-sm font-medium">LIVE</div>
          
          <button 
            className="text-white ml-4 focus:outline-none"
            onClick={toggleFullscreen}
          >
            {isFullscreen ? (
              <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                <path fillRule="evenodd" d="M5 4a1 1 0 00-1 1v4a1 1 0 01-2 0V5a3 3 0 013-3h4a1 1 0 010 2H5zm10 8a1 1 0 011 1v4a1 1 0 01-1 1h-4a1 1 0 010-2h4a1 1 0 001-1v-4a1 1 0 011-1z" clipRule="evenodd" />
              </svg>
            ) : (
              <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                <path fillRule="evenodd" d="M3 4a1 1 0 011-1h4a1 1 0 010 2H6.414l2.293 2.293a1 1 0 01-1.414 1.414L5 6.414V8a1 1 0 01-2 0V4zm9 1a1 1 0 010-2h4a1 1 0 011 1v4a1 1 0 01-2 0V6.414l-2.293 2.293a1 1 0 11-1.414-1.414L13.586 5H12zm-9 7a1 1 0 012 0v1.586l2.293-2.293a1 1 0 011.414 1.414L6.414 15H8a1 1 0 010 2H4a1 1 0 01-1-1v-4zm13-1a1 1 0 011 1v4a1 1 0 01-1 1h-4a1 1 0 010-2h1.586l-2.293-2.293a1 1 0 011.414-1.414L15 13.586V12a1 1 0 011-1z" clipRule="evenodd" />
              </svg>
            )}
          </button>
        </div>
      </div>
      
      {/* Match info overlay */}
      <div className={`absolute top-0 left-0 right-0 bg-gradient-to-b from-black to-transparent p-4 transition-opacity duration-300 ${showMatchInfo ? 'opacity-100' : 'opacity-0'}`}>
        <div className="flex justify-between items-center">
          <div>
            <span className="text-red-600 font-bold text-sm">LIVE</span>
            <h3 className="text-white font-bold text-sm md:text-base lg:text-lg">
              {matchInfo ? `${matchInfo.team1.name} vs ${matchInfo.team2.name}` : 'Live Match'}
            </h3>
            <p className="text-gray-300 text-xs md:text-sm">
              {matchInfo ? 
                `Match ${matchInfo.id.slice(0, 8)} • ${new Date(matchInfo.match_date).toLocaleDateString()}` 
                : 'IPL 2025'}
            </p>
          </div>
          <div className="text-white text-xs md:text-sm hidden sm:block">
            Viewers: {formatViewerCount(viewerCount || 0)}
          </div>
        </div>
      </div>
    </div>
  );
};

// Helper function to format viewer count
function formatViewerCount(count) {
  if (count >= 1000000) {
    return (count / 1000000).toFixed(1) + 'M';
  }
  if (count >= 1000) {
    return (count / 1000).toFixed(0) + 'K';
  }
  return count.toString();
}

export default LivePlayer;
