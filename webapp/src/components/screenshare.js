"use client";
import { useEffect, useRef, useState } from "react";

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000";
const WS_BASE_URL = API_BASE_URL.replace(/^http/, 'ws');

export default function ScreenViewer({ nmec, sessionId, courseId, examId }) {
  const videoRef = useRef(null);
  const peerConnection = useRef(null);
  const webSocket = useRef(null);
  const [status, setStatus] = useState("disconnected");
  const [error, setError] = useState(null);
  const [videoInfo, setVideoInfo] = useState({});
  const [showPlayButton, setShowPlayButton] = useState(false);
  const [isRequestingShare, setIsRequestingShare] = useState(false);
  
  // Added function to explicitly request screen share
  const requestScreenShare = () => {
    if (status === "requesting" || !webSocket.current) return;
    
    setStatus("requesting");
    setIsRequestingShare(true);
    
    try {
      webSocket.current.send(
        JSON.stringify({
          type: "request_screen_share",
          userNmec: nmec,
          sessionId: sessionId,
          courseId: courseId,
          examId: examId,
        })
      );
      console.log("Screen share request sent to student");
    } catch (err) {
      console.error("Failed to send screen share request:", err);
      setStatus("error");
      setError("Failed to request screen share");
      setIsRequestingShare(false);
    }
  };

  // Clean up connections before creating new ones
  const cleanupConnections = () => {
    if (peerConnection.current) {
      peerConnection.current.close();
      peerConnection.current = null;
    }

    if (webSocket.current && webSocket.current.readyState === WebSocket.OPEN) {
      webSocket.current.close();
      webSocket.current = null;
    }
    
    if (videoRef.current && videoRef.current.srcObject) {
      const tracks = videoRef.current.srcObject.getTracks();
      tracks.forEach(track => track.stop());
      videoRef.current.srcObject = null;
    }
  };

  // FIXED: Moved initialization function outside of useEffect
  const initializeConnection = () => {
    // Clean up existing connections first
    cleanupConnections();
    
    try {
      console.log(`Setting up WebSocket for student ${nmec}, session ${sessionId}`);
      
      const configuration = {
        iceServers: [
          { urls: "stun:stun.l.google.com:19302" },
          { urls: "stun:stun1.l.google.com:19302" },
          { urls: "stun:stun2.l.google.com:19302" },
        ].filter(server => server.urls),
      };

      const connectionId = `monitor_${sessionId}`;
      console.log(`Connecting to WebSocket: ${WS_BASE_URL}/screenshare/ws/${connectionId}`);
      
      const ws = new WebSocket(`${WS_BASE_URL}/screenshare/ws/${connectionId}`);
      webSocket.current = ws;

      ws.onopen = () => {
        console.log("WebSocket connected, ready to request screen share");
        setStatus("connected");
        
        // Don't automatically request - wait for user action
        // Uncomment next line if you want auto-request behavior
        // requestScreenShare();
      };

      ws.onmessage = async (event) => {
        try {
          const message = JSON.parse(event.data);
          console.log("Received message:", message.type);

          if (message.type === "offer") {
            handleOffer(message, configuration);
          } else if (message.type === "ice-candidate" && peerConnection.current) {
            handleIceCandidate(message);
          } else if (message.type === "status") {
            console.log("Status update:", message.message);
            // If this was a response to our request
            if (isRequestingShare && message.message.includes("sent to student")) {
              setStatus("waiting");
              setIsRequestingShare(false);
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
        
        // Only change status if we're not in an error state already
        if (status !== "error") {
          setStatus("disconnected");
        }

        // If abnormal closure, set error
        if (event.code !== 1000 && event.code !== 1001) {
          setError(`Connection closed: ${event.reason || "Unknown reason"}`);
        }
      };
    } catch (err) {
      console.error("Failed to initialize screen sharing:", err);
      setStatus("error");
      setError(err.message || "Connection initialization error");
    }
  };
  
  // Handler for offer message
  const handleOffer = async (message, configuration) => {
    try {
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
            setStatus("streaming");
            
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
          }
        };

        // Handle ICE candidates
        peerConnection.current.onicecandidate = (event) => {
          if (event.candidate && webSocket.current) {
            console.log("Generated ICE candidate");
            webSocket.current.send(
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
          console.log("Connection state:", peerConnection.current.connectionState);
          
          if (peerConnection.current.connectionState === "failed") {
            setStatus("failed");
            setError("Connection failed. Try requesting again.");
          } else if (peerConnection.current.connectionState === "disconnected") {
            setStatus("disconnected");
          } else if (peerConnection.current.connectionState === "connected") {
            setStatus("streaming");
          }
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
      webSocket.current.send(
        JSON.stringify({
          type: "answer",
          userNmec: nmec,
          sdp: answer.sdp,
          sessionUserId: sessionId, 
        })
      );
    } catch (err) {
      console.error("Error handling offer:", err);
      setStatus("error");
      setError("Failed to process offer: " + err.message);
    }
  };
  
  // Handler for ICE candidate message
  const handleIceCandidate = async (message) => {
    try {
      console.log("Adding ICE candidate from student");
      await peerConnection.current.addIceCandidate(
        new RTCIceCandidate(message.candidate)
      );
    } catch (err) {
      console.error("Error adding ICE candidate:", err);
    }
  };

  // FIXED: Added missing function for force play button
  const handleForcePlay = () => {
    if (videoRef.current && videoRef.current.srcObject) {
      try {
        videoRef.current.play()
          .then(() => {
            console.log("Video playback started manually");
            setShowPlayButton(false);
          })
          .catch(e => {
            console.error("Failed to play video manually:", e);
          });
      } catch (e) {
        console.error("Error playing video:", e);
      }
    }
  };

  useEffect(() => {
    // Simply call the function that's now defined in component scope
    initializeConnection();
    
    // Clean up on component unmount
    return () => {
      console.log("Cleaning up connections on unmount");
      cleanupConnections();
    };
    
  }, [nmec, sessionId, courseId, examId]); // eslint-disable-line react-hooks/exhaustive-deps

  return (
    <div className="relative">
      <div className="bg-black rounded-lg overflow-hidden w-full h-[700px]">
        {/* Status UI states */}
        {status === "disconnected" && (
          <div className="flex flex-col items-center justify-center h-full text-white">
            <p className="mb-4">Not connected to student screen</p>
            <button 
              onClick={initializeConnection}
              className="px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600"
            >
              Reconnect
            </button>
          </div>
        )}
        
        {status === "connected" && (
          <div className="flex flex-col items-center justify-center h-full text-white">
            <p className="mb-4">Ready to request student screen</p>
            <button 
              onClick={requestScreenShare}
              className="px-4 py-2 bg-green-500 text-white rounded hover:bg-green-600"
            >
              Request Screen Share
            </button>
          </div>
        )}
        
        {status === "requesting" && (
          <div className="flex items-center justify-center h-full text-white">
            <p>Sending request to student...</p>
          </div>
        )}
        
        {status === "waiting" && (
          <div className="flex items-center justify-center h-full text-white">
            <p>Waiting for student to share screen...</p>
          </div>
        )}
        
        {(status === "failed" || status === "error") && (
          <div className="flex flex-col items-center justify-center h-full text-white">
            <p className="mb-4">
              Error: {error || "Connection failed"}
            </p>
            <div className="flex space-x-4">
              <button
                className="px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600"
                onClick={() => window.location.reload()}
              >
                Reload Page
              </button>
              <button
                className="px-4 py-2 bg-green-500 text-white rounded hover:bg-green-600"
                onClick={requestScreenShare}
              >
                Try Again
              </button>
            </div>
          </div>
        )}
        
        <video
          ref={videoRef}
          autoPlay
          playsInline
          className={`w-full h-full object-contain ${
            status !== "streaming" ? "hidden" : ""
          }`}
        ></video>
        
        {/* Play button for browsers with autoplay restrictions */}
        {showPlayButton && status === "streaming" && (
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
        {status === "streaming" ? "Live" : status}
      </div>
    </div>
  );
}