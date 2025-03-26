"use client";
import { useEffect, useRef, useState } from "react";

// API URL configuration - replace with your actual API URL
const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000";
const WS_BASE_URL = API_BASE_URL.replace(/^http/, 'ws');

export default function ScreenViewer({ nmec, sessionId, courseId, examId }) {
  const videoRef = useRef(null);
  const peerConnection = useRef(null);
  const webSocket = useRef(null);
  const [status, setStatus] = useState("disconnected");
  const [error, setError] = useState(null);
  const [videoInfo, setVideoInfo] = useState({});
  
  // For forcing video play after autoplay restrictions
  const [showPlayButton, setShowPlayButton] = useState(false);

  useEffect(() => {
    // Function to initialize WebRTC
    const initializeScreenSharing = async () => {
      try {
        console.log(`Starting screen sharing for student ${nmec}, session ${sessionId}`);
        
        // Setup WebRTC configuration with STUN/TURN servers
        const configuration = {
          iceServers: [
            { urls: "stun:stun.l.google.com:19302" },
            { urls: "stun:stun1.l.google.com:19302" },
            { urls: "stun:stun2.l.google.com:19302" },
            // Optional TURN server configuration
            {
              urls: process.env.NEXT_PUBLIC_TURN_SERVER_URL,
              ...(process.env.NEXT_PUBLIC_TURN_USERNAME && {
                username: process.env.NEXT_PUBLIC_TURN_USERNAME,
                credential: process.env.NEXT_PUBLIC_TURN_CREDENTIAL,
              }),
            },
          ].filter(server => server.urls),
        };

        // Create WebSocket connection for signaling to the API (not webapp)
        // IMPORTANT: Here we use the connection ID format: monitor_[session_id]
        // In production, you might want to use: monitor_[session_id]_[nmec]
        // TO DO: Change the connection ID format as needed
        const connectionId = `monitor_${sessionId}`;
        console.log(`Connecting to WebSocket: ${WS_BASE_URL}/screenshare/ws/${connectionId}`);
        
        const ws = new WebSocket(`${WS_BASE_URL}/screenshare/ws/${connectionId}`);
        webSocket.current = ws;

        // WebSocket event handlers
        ws.onopen = () => {
          console.log("WebSocket connected, requesting screen share");
          setStatus("connecting");

          // Request screen share from student
          ws.send(
            JSON.stringify({
              type: "request_screen_share",
              userNmec: nmec,
              sessionId: sessionId,
              courseId: courseId,
              examId: examId,
            })
          );
        };

        ws.onmessage = async (event) => {
          try {
            const message = JSON.parse(event.data);
            console.log("Received message:", message.type);

            if (message.type === "offer") {
              // Create peer connection if it doesn't exist
              if (!peerConnection.current) {
                console.log("Creating new RTCPeerConnection");
                peerConnection.current = new RTCPeerConnection(configuration);

                // Set up media stream handler
                peerConnection.current.ontrack = (event) => {
                  console.log("Received remote track", event);
                  if (videoRef.current && event.streams && event.streams[0]) {
                    console.log(`Stream has ${event.streams[0].getTracks().length} tracks`);
                    
                    // Assign stream to video element
                    videoRef.current.srcObject = event.streams[0];
                    setStatus("connected");
                    
                    // Try to play video, handle autoplay restrictions
                    try {
                      videoRef.current.play()
                        .then(() => console.log("Video playback started automatically"))
                        .catch(e => {
                          console.warn("Autoplay prevented:", e);
                          setShowPlayButton(true);
                        });
                    } catch (e) {
                      console.error("Error playing video:", e);
                      setShowPlayButton(true);
                    }
                    
                    // Update video info
                    updateVideoInfo();
                  }
                };

                // Handle ICE candidates
                peerConnection.current.onicecandidate = (event) => {
                  if (event.candidate) {
                    console.log("Generated ICE candidate");
                    ws.send(
                      JSON.stringify({
                        type: "ice-candidate",
                        userNmec: nmec,
                        candidate: event.candidate,
                        source: "monitor",
                      })
                    );
                  }
                };

                // Connection state monitoring
                peerConnection.current.onconnectionstatechange = () => {
                  console.log(
                    "Connection state changed:",
                    peerConnection.current.connectionState
                  );
                  updateVideoInfo();

                  if (
                    peerConnection.current.connectionState === "failed" ||
                    peerConnection.current.connectionState === "disconnected"
                  ) {
                    setStatus("reconnecting");
                  } else if (
                    peerConnection.current.connectionState === "connected"
                  ) {
                    setStatus("connected");
                  }
                };
                
                peerConnection.current.oniceconnectionstatechange = () => {
                  console.log(
                    "ICE connection state:",
                    peerConnection.current.iceConnectionState
                  );
                  updateVideoInfo();
                };
              }

              // Set the remote description (student's offer)
              await peerConnection.current.setRemoteDescription(
                new RTCSessionDescription({
                  type: message.type,
                  sdp: message.sdp,
                })
              );

              console.log("Remote description set, creating answer");

              // Create and send answer
              const answer = await peerConnection.current.createAnswer();
              await peerConnection.current.setLocalDescription(answer);

              console.log("Sending answer to student");
              ws.send(
                JSON.stringify({
                  type: "answer",
                  userNmec: nmec,
                  sdp: answer.sdp,
                  sessionUserId: sessionId, // Important for the API to store the answer correctly
                })
              );
            } else if (
              message.type === "ice-candidate" &&
              peerConnection.current
            ) {
              // Add received ICE candidate
              try {
                console.log("Adding ICE candidate from student");
                await peerConnection.current.addIceCandidate(
                  new RTCIceCandidate(message.candidate)
                );
              } catch (err) {
                console.error("Error adding received ICE candidate", err);
              }
            }
          } catch (err) {
            console.error("Error handling WebSocket message", err);
            setError("Failed to process server message");
          }
        };

        ws.onerror = (event) => {
          console.error("WebSocket error:", event);
          setStatus("error");
          setError("WebSocket connection error");
        };

        ws.onclose = (event) => {
          console.log("WebSocket closed:", event.code, event.reason);
          setStatus("disconnected");

          // If abnormal closure, set error
          if (event.code !== 1000) {
            setError(`Connection closed: ${event.reason || "Unknown reason"}`);
          }
        };

        // Cleanup function
        return () => {
          console.log("Cleaning up WebRTC connections");
          if (peerConnection.current) {
            peerConnection.current.close();
            peerConnection.current = null;
          }

          if (ws && ws.readyState === WebSocket.OPEN) {
            ws.close();
          }
        };
      } catch (err) {
        console.error("Failed to initialize screen sharing:", err);
        setStatus("error");
        setError(err.message || "Unknown error initializing screen sharing");
      }
    };
    
    // Function to update video element info (helpful for debugging)
    const updateVideoInfo = () => {
      if (!videoRef.current) return;
      
      const video = videoRef.current;
      const info = {
        readyState: video.readyState,
        videoWidth: video.videoWidth,
        videoHeight: video.videoHeight,
        paused: video.paused,
        networkState: video.networkState,
      };
      
      if (video.srcObject) {
        const tracks = video.srcObject.getTracks();
        info.tracks = tracks.map(t => ({ 
          kind: t.kind, 
          readyState: t.readyState,
          muted: t.muted,
          id: t.id
        }));
      }
      
      if (peerConnection.current) {
        info.peerConnectionState = peerConnection.current.connectionState;
        info.iceConnectionState = peerConnection.current.iceConnectionState;
      }
      
      setVideoInfo(info);
      console.log("Video info:", info);
    };

    // Start screen sharing
    initializeScreenSharing();
    
    // Periodically update video info
    const infoInterval = setInterval(updateVideoInfo, 5000);
    return () => clearInterval(infoInterval);
    
  }, [nmec, sessionId, courseId, examId]);

  // Force play video (for browsers with autoplay restrictions)
  const handleForcePlay = () => {
    if (videoRef.current && videoRef.current.srcObject) {
      videoRef.current.play()
        .then(() => {
          console.log("Video playback forced successfully");
          setShowPlayButton(false);
        })
        .catch(e => {
          console.error("Force play failed:", e);
          setError("Could not play video: " + e.message);
        });
    }
  };

  return (
    <div className="relative">
      <div className="bg-black rounded-lg overflow-hidden w-full h-[700px]">
        {status === "disconnected" && (
          <div className="flex items-center justify-center h-full text-white">
            <p>Waiting to connect to student screen...</p>
          </div>
        )}
        {status === "connecting" && (
          <div className="flex items-center justify-center h-full text-white">
            <p>Connecting to student screen...</p>
          </div>
        )}
        {status === "reconnecting" && (
          <div className="flex items-center justify-center h-full text-white">
            <p>Connection interrupted, attempting to reconnect...</p>
          </div>
        )}
        {status === "error" && (
          <div className="flex items-center justify-center h-full text-white">
            <p>
              Error connecting to student screen: {error || "Unknown error"}
            </p>
            <button
              className="mt-4 px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600"
              onClick={() => window.location.reload()}
            >
              Retry
            </button>
          </div>
        )}
        <video
          ref={videoRef}
          autoPlay
          playsInline
          className={`w-full h-full object-contain ${
            status !== "connected" ? "hidden" : ""
          }`}
        ></video>
        
        {/* Play button for browsers with autoplay restrictions */}
        {showPlayButton && status === "connected" && (
          <div className="absolute inset-0 flex items-center justify-center bg-black bg-opacity-50">
            <button
              onClick={handleForcePlay}
              className="px-6 py-3 bg-blue-600 text-white rounded-full text-lg hover:bg-blue-700 flex items-center"
            >
              <svg className="w-6 h-6 mr-2" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM9.555 7.168A1 1 0 008 8v4a1 1 0 001.555.832l3-2a1 1 0 000-1.664l-3-2z" clipRule="evenodd" />
              </svg>
              Play Video
            </button>
          </div>
        )}
      </div>
      
      {/* Status indicator */}
      <div className="absolute bottom-4 right-4 bg-gray-800 text-white px-3 py-1 rounded-full text-sm">
        {status === "connected" ? "Live" : status}
      </div>
      
      {/* Optional: Debug information (can be removed in production) */}
      {process.env.NODE_ENV === 'development' && (
        <div className="mt-4 p-2 bg-gray-100 rounded text-xs font-mono overflow-x-auto">
          <details>
            <summary className="cursor-pointer">Debug Info</summary>
            <pre>{JSON.stringify(videoInfo, null, 2)}</pre>
          </details>
        </div>
      )}
    </div>
  );
}