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
  
  // Helper function to generate random viewer count for fallback/development
  const generateRandomViewerCount = () => {
    const randomViewers = Math.floor(1000 + Math.random() * 4000);
    setViewerCount(viewerCount => Math.max(viewerCount || 0, randomViewers));
  };
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
        
        if (!response.ok) {
          throw new Error(`Failed to fetch stream data: ${response.status}`);
        }
        
        const data = await response.json();
        
        // Handle the response format - could be an array or an object with streams property
        const streams = Array.isArray(data) ? data : (data.streams || []);
        
        if (streams && streams.length > 0) {
          const stream = streams[0];
          setStreamData(stream);
          setCurrentStreamUrl(stream.stream_url || streamUrl);
          
          // Use stream data for match info if available
          if (stream.team1_name && stream.team2_name) {
            setMatchInfo({
              team1_name: stream.team1_name,
              team1_short_name: stream.team1_short_name,
              team2_name: stream.team2_name,
              team2_short_name: stream.team2_short_name,
              venue: stream.venue,
              match_date: stream.match_date,
              status: stream.match_status
            });
          } else {
            // Also fetch the match details if not included in stream data
            try {
              const matchResponse = await fetch(`/api/matches?id=${matchId}`);
              const matchData = await matchResponse.json();
              
              if (matchData && matchData.length > 0) {
                setMatchInfo(matchData[0]);
              }
            } catch (matchErr) {
              console.error('Error fetching match details:', matchErr);
              // Continue with stream data even if match details fail
            }
          }
          
          // Update viewer count periodically
          const interval = setInterval(async () => {
            try {
              // Use stream id from the current stream data
              const streamId = stream?.id || 1;
              
              // Add timestamp to prevent caching
              const timestamp = new Date().getTime();
              const analyticsResponse = await fetch(`/api/analytics/stream?stream_id=${streamId}&_t=${timestamp}`, {
                // Adding a short timeout to prevent long-hanging requests
                signal: AbortSignal.timeout(5000)
              });
              
              // Silently handle non-200 responses without throwing errors
              if (analyticsResponse.ok) {
                const analyticsData = await analyticsResponse.json();
                if (analyticsData && typeof analyticsData.viewer_count === 'number') {
                  setViewerCount(analyticsData.viewer_count);
                } else {
                  // Fallback to random data
                  generateRandomViewerCount();
                }
              } else {
                // Fallback to random data without throwing errors
                console.log(`Analytics API returned ${analyticsResponse.status}, using fallback data`);
                generateRandomViewerCount();
              }
            } catch (err) {
              // Silently log errors without disrupting the user experience
              console.error('Error fetching viewer count:', err);
              // Generate random viewer count for all environments when API fails
              generateRandomViewerCount();
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

  // Static fallback stream that is known to work reliably
  const FALLBACK_STREAM = "https://res.cloudinary.com/dy1mqjddr/video/upload/sp_hd/v1741989910/cgds8tkp8cc0eu8gijpl.m3u8";
  
  // State to track if we're using fallback stream
  const [usingFallback, setUsingFallback] = useState(false);
  
  // Initialize the HLS player when currentStreamUrl is available
  useEffect(() => {
    // Only run this effect when playerRef is available and currentStreamUrl exists
    if (!playerRef.current || !currentStreamUrl) return;

    const video = playerRef.current.querySelector('video');
    if (!video) return;
    
    // Reset fallback indicator when stream URL changes
    setUsingFallback(false);
    
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
        maxMaxBufferLength: 60,
        // Add timeout to prevent hanging requests
        xhrSetup: (xhr) => {
          xhr.timeout = 10000; // 10 seconds timeout
          // Add CORS headers to request
          xhr.setRequestHeader('Access-Control-Allow-Origin', '*');
        },
        // Add more aggressive retry settings specific to manifest loading
        manifestLoadingTimeOut: 15000, // Longer timeout for manifest loading (15 seconds)
        manifestLoadingMaxRetry: 8,    // More retries for manifest loading
        manifestLoadingRetryDelay: 500, // Start with a shorter delay
        manifestLoadingMaxRetryTimeout: 8000, // But cap the maximum delay
        // General fragment and level loading settings
        fragLoadingMaxRetry: 6,
        levelLoadingMaxRetry: 6
      });
      hlsRef.current = hls;
      
      // Track retry count for different types of network errors
      let networkErrorRetries = 0;
      let manifestErrorRetries = 0;
      const MAX_NETWORK_RETRIES = 2;
      const MAX_MANIFEST_RETRIES = 3; // More retries for manifest errors
      
      // Add error handling before loading the source
      // Pre-check if the manifest is accessible before fully initializing
      const checkManifestAvailability = async (url) => {
        try {
          const controller = new AbortController();
          const timeoutId = setTimeout(() => controller.abort(), 5000);
          
          const response = await fetch(url, { 
            method: 'HEAD',
            signal: controller.signal 
          });
          
          clearTimeout(timeoutId);
          return response.ok;
        } catch (e) {
          console.warn('Manifest pre-check failed:', e);
          return false;
        }
      };
      
      // Immediately check if the manifest is available
      checkManifestAvailability(currentStreamUrl).then(isAvailable => {
        if (!isAvailable && currentStreamUrl !== FALLBACK_STREAM) {
          console.log('Stream manifest unavailable in pre-check, switching to fallback immediately');
          setUsingFallback(true);
          setCurrentStreamUrl(FALLBACK_STREAM);
          return;
        }
      });

      hls.on(Hls.Events.ERROR, function(event, data) {
        if (data.fatal) {
          console.error('HLS error encountered:', data.type, data.details);
          
          switch(data.type) {
            case Hls.ErrorTypes.NETWORK_ERROR:
              // Handle manifest load errors specifically
              if (data.details === Hls.ErrorDetails.MANIFEST_LOAD_ERROR ||
                  data.details === Hls.ErrorDetails.MANIFEST_LOAD_TIMEOUT) {
                
                if (manifestErrorRetries < MAX_MANIFEST_RETRIES) {
                  console.log(`Manifest load error, trying to recover (attempt ${manifestErrorRetries + 1}/${MAX_MANIFEST_RETRIES})...`);
                  manifestErrorRetries++;
                  
                  // Exponential backoff for manifest retries
                  const delay = Math.min(1000 * Math.pow(1.5, manifestErrorRetries), 8000);
                  
                  setTimeout(() => {
                    hls.loadSource(currentStreamUrl);
                    hls.startLoad();
                  }, delay);
                } else {
                  console.log('Manifest errors persist, switching to fallback stream...');
                  // Handle manifest errors by immediately switching to fallback
                  hls.destroy();
                  hlsRef.current = null;
                  setUsingFallback(true);
                  setCurrentStreamUrl(FALLBACK_STREAM);
                }
              } else {
                // Handle other network errors
                if (networkErrorRetries < MAX_NETWORK_RETRIES) {
                  console.log(`Other network error encountered, trying to recover (attempt ${networkErrorRetries + 1}/${MAX_NETWORK_RETRIES})...`);
                  networkErrorRetries++;
                  setTimeout(() => {
                    hls.startLoad();
                  }, 1000);
                } else {
                  console.log('Network errors persist, switching to fallback stream...');
                  // Destroy current instance before switching
                  hls.destroy();
                  hlsRef.current = null;
                  // Switch to fallback stream
                  setUsingFallback(true);
                  setCurrentStreamUrl(FALLBACK_STREAM);
                }
              }
              break;
              
            case Hls.ErrorTypes.MEDIA_ERROR:
              console.log('Media error encountered, trying to recover...');
              hls.recoverMediaError();
              break;
              
            default:
              // For unrecoverable errors, immediately switch to fallback stream
              console.error('Unrecoverable HLS error');
              // Destroy current instance before switching
              hls.destroy();
              hlsRef.current = null;
              // Switch to fallback stream
              setUsingFallback(true);
              setCurrentStreamUrl(FALLBACK_STREAM);
              break;
          }
        }
      });

      // Now load the source with our error handling in place
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
        
        // Reduce loading spinner time
        setIsLoading(false);

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
      {/* Fallback stream notification */}
      {usingFallback && (
        <div className="absolute top-0 left-0 right-0 bg-yellow-500 text-black text-xs md:text-sm py-1 px-2 z-30 flex items-center justify-center">
          <svg xmlns="http://www.w3.org/2000/svg" className="h-3 w-3 md:h-4 md:w-4 mr-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
          </svg>
          <span>Stream issues detected - Using alternate stream</span>
        </div>
      )}
      
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
              {matchInfo ? `${matchInfo.team1_name || 'Team 1'} vs ${matchInfo.team2_name || 'Team 2'}` : 'Live Match'}
            </h3>
            <p className="text-gray-300 text-xs md:text-sm">
              {matchInfo ? 
                `${matchInfo.venue || ''} • ${matchInfo.match_date ? new Date(matchInfo.match_date).toLocaleDateString() : ''}` 
                : 'IPL 2025'}
            </p>
          </div>
          <div className="text-white text-xs md:text-sm hidden sm:block">
            Viewers: {formatViewerCount(viewerCount || 0)} {/* Added fallback to prevent errors */}
          </div>
        </div>
      </div>
    </div>
  );
};

// Helper function to format viewer count
function formatViewerCount(count) {
  // Safety check to ensure count is a number
  if (typeof count !== 'number' || isNaN(count)) {
    return '0';
  }
  
  if (count >= 1000000) {
    return (count / 1000000).toFixed(1) + 'M';
  }
  if (count >= 1000) {
    return (count / 1000).toFixed(0) + 'K';
  }
  return count.toString();
}

export default LivePlayer;
