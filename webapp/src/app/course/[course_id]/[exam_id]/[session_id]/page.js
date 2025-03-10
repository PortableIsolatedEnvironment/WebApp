'use client';

import { useState, useEffect, useCallback } from "react";
import { Button } from "@/components/ui/button";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import BackButton from "@/components/back-button";
import { sessionService } from "@/api/services/sessionService";
import { userService } from "@/api/services/userService";
import { notFound, useParams, useRouter } from "next/navigation";
import { toast, Toaster } from "sonner";
import { Plus } from "lucide-react";

export default function SessionClientPage() {
  const [session, setSession] = useState(null);
  const [sessionUsers, setSessionUsers] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(false);
  const [broadcastMessage, setBroadcastMessage] = useState("");
  const [extensionMinutes, setExtensionMinutes] = useState({});
  const params = useParams();
  const router = useRouter();
  const { course_id, exam_id, session_id } = params;

  const pollingInterval = 5000; // 5 seconds

  const formatDateTime = (dateTimeStr) => {
    if (!dateTimeStr || dateTimeStr === "null") return "N/A";
    
    try {
      const date = new Date(dateTimeStr);
      // Check if date is valid
      if (isNaN(date.getTime())) return "N/A";
      return date.toLocaleTimeString();
    } catch (error) {
      console.error("Error formatting date:", error);
      return "N/A";
    }
  };

  const fetchSessionUsers = useCallback(async () => {
    try {
      const sessionUsersData = await sessionService.getSessionUsers(session_id);
      
      // Fetch complete user details for each session user
      const enhancedSessionUsers = await Promise.all(
        sessionUsersData.map(async (sessionUser) => {
          try {
            const userData = await userService.getUser(sessionUser.user_nmec);
            return {
              ...sessionUser,
              user: userData
            };
          } catch (error) {
            console.error(`Error fetching user ${sessionUser.user_nmec}:`, error);
            return {
              ...sessionUser,
              user: { name: "Unknown User" }
            };
          }
        })
      );
      
      setSessionUsers(enhancedSessionUsers);
    } catch (error) {
      console.error("Error fetching session users:", error);
    }
  }, [session_id]);

  // Initial data loading
  useEffect(() => {
    const fetchInitialData = async () => {
      try {
        setIsLoading(true);
        
        // Get session details
        const sessionData = await sessionService.getSession(course_id, exam_id, session_id);
        if (!sessionData) {
          router.push(notFound());
          return;
        }
        
        setSession(sessionData);
        
        // Get initial session users
        await fetchSessionUsers();
        
      } catch (error) {
        console.error("Error fetching initial data:", error);
        setError(true);
      } finally {
        setIsLoading(false);
      }
    };
    
    fetchInitialData();
  }, [course_id, exam_id, session_id, router, fetchSessionUsers]);

  // Set up polling for session users
  useEffect(() => {
    // Only start polling if we have the initial data loaded
    if (!isLoading && session) {
      // Set up the interval for polling
      const intervalId = setInterval(() => {
        fetchSessionUsers();
      }, pollingInterval);
      
      // Clean up the interval when component unmounts
      return () => clearInterval(intervalId);
    }
  }, [isLoading, session, fetchSessionUsers, pollingInterval]);

  if (error) {
    return null;
  }

  if (isLoading) {
    return <div className="min-h-screen flex items-center justify-center">Loading...</div>;
  }

  if (!session) {
    router.push(notFound());
    return null; // Add this return to prevent rendering after redirect
  }

  const handleSendBroadcastStart = async () => {
    try {
      await sessionService.startSession(course_id, exam_id, session_id);

      setSession(prevSession => ({
        ...prevSession,
        is_started: true
      }));

      toast.success("Broadcast started successfully");
    } catch (error) {
      toast.error(`Failed to start broadcast: ${error.message || "Unknown error"}`);
    }
  };

  const handleSendBroadcastEnd = async () => {
    try {
      await sessionService.endSession(course_id, exam_id, session_id);
      toast.success("Broadcast ended successfully");
    } catch (error) {
      toast.error(`Failed to end broadcast: ${error.message || "Unknown error"}`);
    }
  };

  const handleSendBroadcastMessage = async () => {
    try {
      if (!broadcastMessage.trim()) {
        toast.error("Please enter a message to broadcast");
        return;
      }
      
      // Disable button during submission
      const sendButton = document.getElementById('send-button');
      if (sendButton) sendButton.disabled = true;
      
      // Show loading toast
      const toastId = toast.loading("Sending broadcast...");
      
      const messagePromises = sessionUsers.map(user => 
        sessionService.sendBroadcastMessage(
          user.user_nmec,
          broadcastMessage,
          course_id,
          exam_id,
          session_id
        )
      );
      
      await Promise.all(messagePromises);

      // Dismiss loading toast and show success
      toast.dismiss(toastId);
      toast.success("Broadcast sent successfully");
      
      // Clear the input field after successful broadcast
      setBroadcastMessage("");
    } catch (error) {
      toast.error(`Failed to send broadcast: ${error.message || "Unknown error"}`);
    } finally {
      const sendButton = document.getElementById('send-button');
      if (sendButton) sendButton.disabled = false;
    }
  };

  const handleClearBroadcast = () => {
    setBroadcastMessage("");
  };

  const handleViewUserDetails = (sessionUser) => {
    console.log("View details for:", sessionUser);
  };

  const handleDownloadSubmissions = async () => {
    const downloadButton = document.getElementById('download-button');
    try {
      if (downloadButton) {
        downloadButton.disabled = true;
        downloadButton.innerText = 'Downloading...';
      }
      
      await sessionService.downloadSubmissions(course_id, exam_id, session_id);
      
      // Optional: Show success toast
    } catch (error) {
      console.error('Error downloading submissions:', error);
      alert(`Download failed: ${error.message || 'Unknown error'}`);
    } finally {
      if (downloadButton) {
        downloadButton.disabled = false;
        downloadButton.innerText = 'Download Submissions';
      }
    }
  };

  const handleExtendTime = async (user_nmec) => {
    try {
      const additionalMinutes = extensionMinutes[user_nmec] || 5;
      const seconds = additionalMinutes * 60;
      const toastId = toast.loading(`Extending time for user ${user_nmec}...`); 

      await sessionService.extendUserTime(
        user_nmec,
        seconds,
        course_id,
        exam_id,
        session_id
      );

      await fetchSessionUsers();

      toast.dismiss(toastId);
      toast.success(`Time extended successfully for user ${user_nmec} by ${additionalMinutes} minutes`);
    } catch (error) {
      toast.error(`Failed to extend time: ${error.message || "Unknown error"}`);
    }
  };

  const handleMinutesChange = (user_nmec, value) => {
    const minutes = Math.max(1, parseInt(value) || 1);
    setExtensionMinutes({
      ...extensionMinutes,
      [user_nmec]: minutes
    });
  };

  return (
    <div className="min-h-screen bg-white">
      <main className="container mx-auto px-4 py-8">
        <h1 className="text-4xl font-bold mb-8">{session?.name}</h1>
        
        {/* Generate Code Section */}
        <div className="flex flex-col items-center justify-center mb-12 mt-8">
          <div className="flex flex-col items-center gap-6 p-8 rounded-lg bg-gray-50 w-full max-w-2xl">
            <div className="text-4xl font-mono font-semibold tracking-wider">{session?.id}</div>
          </div>
        </div> 

        {/* Session Actions */}
        <div className="flex justify-center gap-4 mb-8">
          <Button 
            id="start-button"
            className="bg-[#5BA87A] hover:bg-[#4A8B65]"
            onClick={handleSendBroadcastStart}
            disabled={session?.is_started}
          >
            Start Session
          </Button>
          <Button 
            id="end-button"
            className="bg-[#993333] hover:bg-[#7A2929]"
            onClick={handleSendBroadcastEnd}
            disabled={!session?.is_started}
          >
            End Session
          </Button>
        </div>
      
        {/* Broadcast Message */}
        <div className="bg-gray-100 p-3 rounded-lg mb-8">
          <div className="flex items-center gap-2">
            <span className="font-medium">Broadcast Message:</span>
            <input 
              type="text" 
              value={broadcastMessage} 
              onChange={(e) => setBroadcastMessage(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === "Enter") {
                  handleSendBroadcastMessage();
                }
              }}
              className="flex-grow border p-1 rounded"
              placeholder="Enter message to broadcast to all students..."
            />
            <Button 
              id="send-button"
              className="bg-[#5BA87A] hover:bg-[#4A8B65] whitespace-nowrap"
              onClick={handleSendBroadcastMessage}
            >
              Send
            </Button>
            <Button 
              id="clear-button"
              className="bg-[#993333] hover:bg-[#7A2929] whitespace-nowrap"
              onClick={handleClearBroadcast}
            >
              Clear
            </Button>
          </div>
        </div>

        {/* Table */}
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead className="w-16">Student NMEC</TableHead>
              <TableHead>Student Name</TableHead>
              <TableHead>Device ID</TableHead>
              <TableHead>Start Time</TableHead>
              <TableHead>End Time</TableHead>
              <TableHead>Status</TableHead>
              <TableHead className="w-16">Add Time</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {sessionUsers.length > 0 ? (
              sessionUsers.map((sessionUser) => (
                <TableRow key={sessionUser.id}>
                  <TableCell>{sessionUser.user_nmec}</TableCell>
                  <TableCell>{sessionUser.user?.name || "Unknown User"}</TableCell>
                  <TableCell>{sessionUser.device_id}</TableCell>
                  <TableCell>{formatDateTime(sessionUser.start_time)}</TableCell>
                  <TableCell>{formatDateTime(sessionUser.end_time)}</TableCell>
                  <TableCell>{sessionUser.end_time ? "Completed" : "Connected"}</TableCell>
                  <TableCell>
                    <div className="flex items-center gap-2">
                      <input
                        type="number"
                        min="1"
                        value={extensionMinutes[sessionUser.user_nmec] || 5}
                        onChange={(e) => handleMinutesChange(sessionUser.user_nmec, e.target.value)}
                        className="w-12 h-8 border rounded-l text-xs text-center"
                        title="Minutes to add"
                      />
                      <Button 
                        size="sm"
                        className="rounded border bg-blue-500 text-white hover:bg-blue-800"
                        onClick={() => handleExtendTime(sessionUser.user_nmec)}
                        title="Add time"
                      >
                        <Plus size={16} />
                      </Button>
                      <Button 
                        variant="ghost" 
                        size="icon" 
                        onClick={() => handleViewUserDetails(sessionUser)}
                        title="View details"
                      >
                        ⚙
                      </Button>
                    </div>
                  </TableCell>
                </TableRow>
              ))
            ) : (
              <TableRow>
                <TableCell colSpan={7} className="text-center py-4">
                  No users entered this session yet.
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
        {/* Navigation Buttons */}
        <div className="flex justify-between items-center mt-8">
          <BackButton />
          <Button 
            type="button"
            id="download-button"
            onClick={handleDownloadSubmissions}
          >
            Download Submissions
          </Button>
        </div>
      </main>
      <Toaster />
    </div>
  );
}