"use client";
import { useEffect, useRef, useState } from "react";

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000";
const WS_BASE_URL = API_BASE_URL.replace(/^http/, "ws");

export default function ScreenViewer({ nmec, sessionId, courseId, examId }) {
  const videoRef = useRef(null);
  const peerConnection = useRef(null);
  const webSocket = useRef(null);
  const [status, setStatus] = useState("disconnected");
  const [error, setError] = useState(null);
  const [videoInfo, setVideoInfo] = useState({});
  const [showPlayButton, setShowPlayButton] = useState(false);
  const [isRequestingShare, setIsRequestingShare] = useState(false);
  const [studentStatus, setStudentStatus] = useState("unknown");

  // Request screen sharing from student
  const requestScreenShare = async () => {
    if (webSocket.current && webSocket.current.readyState === WebSocket.OPEN) {
      console.log(`Requesting screen share for student ${nmec} in session ${sessionId}`);
      
      // Send the request via WebSocket
      webSocket.current.send(
        JSON.stringify({
          type: "request_screen_share",
          userNmec: nmec,
          sessionId: sessionId
        })
      );
      
      setIsRequestingShare(true);
      setStatus("requesting");
    } else {
      console.error("WebSocket not connected. Cannot request screen share.");
      setError("WebSocket not connected. Cannot request screen share.");
    }
  };

  // Stop screen sharing
  const stopScreenShare = () => {
    if (!webSocket.current) {
      console.error("Cannot send stop request: WebSocket not connected");
      return;
    }

    try {
      console.log("Sending stop request to server", { nmec, sessionId });

      webSocket.current.send(
        JSON.stringify({
          type: "stop_screen_share",
          userNmec: nmec,
          sessionId: sessionId,
        })
      );

      console.log("Stop screen share request sent to student");

      // Show waiting status to user temporarily
      setStatus("waiting");
      setError(null);
    } catch (err) {
      console.error("Failed to send stop screen share request:", err);
      setError(`Failed to stop screen share: ${err.message}`);
    }
  };

  // Also make sure the useEffect cleanup properly stops sharing:
  useEffect(() => {
    initializeConnection();

    // Clean up on component unmount
    return () => {
      // Send stop request when navigating away if currently streaming
      if (
        (status === "streaming" || status === "waiting") &&
        webSocket.current
      ) {
        console.log("Component unmounting, sending stop request");
        stopScreenShare();

        // Give it a moment to send before cleaning up
        setTimeout(cleanupConnections, 200);
      } else {
        console.log("Cleaning up connections on unmount");
        cleanupConnections();
      }
    };
  }, [nmec, sessionId, courseId, examId]);

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
      tracks.forEach((track) => track.stop());
      videoRef.current.srcObject = null;
    }
  };

  // Initialize WebSocket connection
  const initializeConnection = () => {
    // Clean up existing connections first
    cleanupConnections();
  
    try {
      console.log(
        `Setting up WebSocket for student ${nmec}, session ${sessionId}`
      );
  
      const configuration = {
        iceServers: [
          { urls: "stun:stun.l.google.com:19302" },
          { urls: "stun:stun1.l.google.com:19302" },
          { urls: "stun:stun2.l.google.com:19302" },
        ].filter((server) => server.urls),
      };
  
      // Updated connection ID to use sessionId instead of nmec
      const connectionId = `monitor_${sessionId}`;
      console.log(
        `Connecting to WebSocket: ${WS_BASE_URL}/screenshare/ws/${connectionId}`
      );
  
      const ws = new WebSocket(`${WS_BASE_URL}/screenshare/ws/${connectionId}`);
      webSocket.current = ws;
  
      ws.onopen = () => {
        console.log("WebSocket connected, ready to request screen share");
        setStatus("connected");
        
        // Check if student is connected - instead of using a separate message type,
        // let's use a ping method that's likely already implemented
        pingStudentConnection();
      };
  
      // Check if student is connected using existing message types
      const pingStudentConnection = () => {
        try {
          if (ws.readyState === WebSocket.OPEN) {
            // Instead of check_student_connection, send a ping to check connection
            ws.send(
              JSON.stringify({
                type: "check_connection",
                userNmec: nmec,
                sessionId: sessionId
              })
            );
            
            // Set a timeout to check again later
            setTimeout(pingStudentConnection, 30000); // Check every 30 seconds
          }
        } catch (err) {
          console.error("Failed to check student connection:", err);
        }
      };
      
      ws.onmessage = async (event) => {
        try {
          const message = JSON.parse(event.data);
          console.log("Received message:", message.type);
  
          if (message.type === "offer") {
            handleOffer(message, configuration);
          } else if (
            message.type === "ice-candidate" &&
            peerConnection.current
          ) {
            handleIceCandidate(message);
          } else if (message.type === "status") {
            console.log("Status update:", message.message);
  
            // Check if this is about student connection
            if (message.message.includes("not connected")) {
              setStudentStatus("disconnected");
              setError(`Student ${nmec} is not connected`);
            } else if (message.message.includes("sent to student")) {
              setStudentStatus("connected");
  
              // If this was a response to our request
              if (isRequestingShare) {
                setStatus("waiting");
                setIsRequestingShare(false);
              }
            } else if (message.message.includes("Student is connected")) {
              // Handle specific connection status message
              setStudentStatus("connected");
              setError(null);
            }
  
            // If this was a response to stop request
            if (message.message.includes("Stop request sent")) {
              console.log("Server confirmed stop request was sent");
            }
          } else if (message.type === "connection_status") {
            // Handle dedicated connection status message
            console.log("Connection status:", message);
            setStudentStatus(message.connected ? "connected" : "disconnected");
            
            if (!message.connected) {
              setError(`Student ${nmec} is not connected`);
            } else {
              setError(null);
            }
          } else if (message.type === "screen_share_stopped") {
            console.log("Student stopped sharing screen", message);
  
            // Clean up resources on stop
            if (peerConnection.current) {
              peerConnection.current.close();
              peerConnection.current = null;
            }
  
            if (videoRef.current && videoRef.current.srcObject) {
              const tracks = videoRef.current.srcObject.getTracks();
              tracks.forEach((track) => track.stop());
              videoRef.current.srcObject = null;
            }
  
            setStatus("connected");
            setError(null);
          } else if (message.type === "error") {
            console.error("Error message from server:", message.message);
            setError(message.message || "Unknown error from server");
            if (status === "requesting") {
              setStatus("connected");
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
            console.log(
              `Stream has ${event.streams[0].getTracks().length} tracks`
            );

            // Assign stream to video element
            videoRef.current.srcObject = event.streams[0];
            setStatus("streaming");

            // Try to play video, handle autoplay restrictions
            try {
              videoRef.current
                .play()
                .then(() => console.log("Video playback started automatically"))
                .catch((e) => {
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
          console.log(
            "Connection state:",
            peerConnection.current.connectionState
          );

          if (peerConnection.current.connectionState === "failed") {
            setStatus("failed");
            setError("Connection failed. Try requesting again.");
          } else if (
            peerConnection.current.connectionState === "disconnected"
          ) {
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

  // Force play when autoplay is blocked
  const handleForcePlay = () => {
    if (videoRef.current && videoRef.current.srcObject) {
      try {
        videoRef.current
          .play()
          .then(() => {
            console.log("Video playback started manually");
            setShowPlayButton(false);
          })
          .catch((e) => {
            console.error("Failed to play video manually:", e);
          });
      } catch (e) {
        console.error("Error playing video:", e);
      }
    }
  };

  // Initialize on component mount
  useEffect(() => {
    initializeConnection();

    // Clean up on component unmount
    return () => {
      // Send stop request when navigating away if currently streaming
      if (status === "streaming" && webSocket.current) {
        stopScreenShare();
      }

      console.log("Cleaning up connections on unmount");
      cleanupConnections();
    };
  }, [nmec, sessionId, courseId, examId]); // eslint-disable-line react-hooks/exhaustive-deps

  return (
    <div className="relative">
      <div className="bg-black rounded-lg overflow-hidden w-full h-[700px]">
        {/* Status UI states */}
        {status === "connected" && (
          <div className="flex flex-col items-center justify-center h-full text-white">
            <p className="mb-4">
              {studentStatus === "disconnected"
                ? `Student ${nmec} is not connected`
                : "Ready to request student screen"}
            </p>
            <button
              onClick={requestScreenShare}
              className="px-4 py-2 bg-green-500 text-white rounded hover:bg-green-600"
              disabled={studentStatus === "disconnected"}
            >
              Request Screen Share
            </button>
            {studentStatus === "disconnected" && (
              <p className="mt-4 text-sm text-yellow-300">
                The student must open the exam page to enable screen sharing
              </p>
            )}
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
            <p className="mb-4">Error: {error || "Connection failed"}</p>
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

        {/* Stop sharing button when streaming */}
        {status === "streaming" && (
          <div className="absolute top-4 right-4">
            <button
              onClick={stopScreenShare}
              className="px-4 py-2 bg-red-500 text-white rounded hover:bg-red-600 flex items-center"
            >
              <svg
                className="w-4 h-4 mr-2"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
                xmlns="http://www.w3.org/2000/svg"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M6 18L18 6M6 6l12 12"
                />
              </svg>
              Stop Sharing
            </button>
          </div>
        )}

        {/* Play button for browsers with autoplay restrictions */}
        {showPlayButton && status === "streaming" && (
          <div className="absolute inset-0 flex items-center justify-center bg-black bg-opacity-50">
            <button
              onClick={handleForcePlay}
              className="px-6 py-3 bg-blue-600 text-white rounded-full text-lg hover:bg-blue-700 flex items-center"
            >
              <svg
                className="w-6 h-6 mr-2"
                fill="currentColor"
                viewBox="0 0 20 20"
              >
                <path
                  fillRule="evenodd"
                  d="M10 18a8 8 0 100-16 8 8 0 000 16zM9.555 7.168A1 1 0 008 8v4a1 1 0 001.555.832l3-2a1 1 0 000-1.664l-3-2z"
                  clipRule="evenodd"
                />
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
