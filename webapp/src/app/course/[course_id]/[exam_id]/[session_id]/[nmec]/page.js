'use client'
import { Button } from "@/components/ui/button";
import BackButton from "@/components/back-button";
import { useState, useEffect } from "react";
import { useParams, useRouter } from "next/navigation";
import { sessionService } from "@/api/services/sessionService";
import { userService } from "@/api/services/userService";
import { toast, Toaster } from "sonner";

export default function MonitoringPage() {
  const [userData, setUserData] = useState(null);
  const [sessionUser, setSessionUser] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);
  const [extensionMinutes, setExtensionMinutes] = useState(5);
  const [codeContent, setCodeContent] = useState("// Loading code...");
  const [consoleOutput, setConsoleOutput] = useState("Loading console output...");
  const [remainingTime, setRemainingTime] = useState(null);
  const [broadcastMessage, setBroadcastMessage] = useState("");
  
  const params = useParams();
  const router = useRouter();
  const { course_id, exam_id, session_id, nmec } = params;

  // Fetch user data and session user data
  useEffect(() => {
    async function fetchData() {
      try {
        setIsLoading(true);
        setError(null);
        const user = await userService.getUser(nmec);
        setUserData(user);
        
        const sessionUsers = await sessionService.getSessionUsers(session_id);
        const currentSessionUser = sessionUsers.find(su => su.user_nmec.toString() === nmec);
        
        if (currentSessionUser) {
          setSessionUser(currentSessionUser);
          // *TO BE IMPLEMENTED*
          // setCodeContent(await someService.getUserCode(nmec, session_id));
          // setConsoleOutput(await someService.getUserConsole(nmec, session_id));
        } else {
          setError("User not found in this session");
        }
      } catch (err) {
        console.error("Error fetching user data:", err);
        setError(err.message || "Failed to load user data");
      } finally {
        setIsLoading(false);
      }
    }
    
    fetchData();

    // // Set up polling for real-time updates (every 10 seconds)
    // const intervalId = setInterval(fetchData, 10000);
    // return () => clearInterval(intervalId);
  }, [nmec, session_id, course_id, exam_id]);

  useEffect(() => {
    // Calculate remaining time
    if (sessionUser?.start_time && !sessionUser?.end_time) {
      const calculateRemainingTime = () => {
        const startTime = new Date(sessionUser.start_time);
        const now = new Date();
        
        const durationMs = (sessionUser.duration || 60) * 1000;
        const extensionMs = (sessionUser.changed_time || 0) * 1000;
        const expectedEndTime = new Date(startTime.getTime() + durationMs + extensionMs);
        
        const remainingMs = expectedEndTime - now;
        
        if (remainingMs <= 0) {
          setRemainingTime("Time's up!");
          return;
        }
  
        const hours = Math.floor(remainingMs / (1000 * 60 * 60));
        const minutes = Math.floor((remainingMs % (1000 * 60 * 60)) / (1000 * 60));
        const seconds = Math.floor((remainingMs % (1000 * 60)) / 1000);
        
        setRemainingTime(`${hours.toString().padStart(2, '0')}:${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`);
      };
  
      calculateRemainingTime();
      
      const timerId = setInterval(calculateRemainingTime, 1000);
      return () => clearInterval(timerId);
    }
  }, [sessionUser]);

  const handleAddTime = async () => {
    try {
      const seconds = extensionMinutes * 60;

      setSessionUser(prevUser => ({
        ...prevUser,
        changed_time: (prevUser.changed_time || 0) + seconds
      }));
      
      await sessionService.extendUserTime(
        nmec,
        seconds,
        course_id, 
        exam_id,
        session_id,
        sessionUser.id
      );

      const sessionUsers = await sessionService.getSessionUsers(session_id);
      const updatedSessionUser = sessionUsers.find(su => su.user_nmec.toString() === nmec);
      if (updatedSessionUser) {
        setSessionUser(updatedSessionUser);
      }
      toast.success(`Added ${extensionMinutes} minutes to ${userData?.name}'s exam time`);
    } catch (err) {
      toast.error(`Failed to add time: ${err.message || "Unknown error"}`);
    }
  };

  const handleReduceTime = async () => {
    try {
      const seconds = -(extensionMinutes * 60); // Negative value to reduce time

      setSessionUser(prevUser => ({
        ...prevUser,
        changed_time: (prevUser.changed_time || 0) + seconds
      }));

      await sessionService.extendUserTime(
        nmec,
        seconds,
        course_id,
        exam_id, 
        session_id,
        sessionUser.id
      );

      const sessionUsers = await sessionService.getSessionUsers(session_id);
      const updatedSessionUser = sessionUsers.find(su => su.user_nmec.toString() === nmec);
      if (updatedSessionUser) {
        setSessionUser(updatedSessionUser);
      }
      toast.success(`Reduced ${extensionMinutes} minutes from ${userData?.name}'s exam time`);
    } catch (err) {
      toast.error(`Failed to reduce time: ${err.message || "Unknown error"}`);
    }
  };

  // Handle ending exam for this user
  const handleEndExam = async () => {
    try {
      if (!window.confirm(`Are you sure you want to end the exam for ${userData?.name}?`)) {
        return;
      }
      
      // Call an API to end the exam for this specific user with a message
      const message = "";
      await sessionService.endUserSession(nmec, course_id, exam_id, session_id, message);
      toast.success(`Exam ended for ${userData?.name}`);
    } catch (err) {
      toast.error(`Failed to end exam: ${err.message || "Unknown error"}`);
    }
  };

  // Send a message to this specific student
  const handleSendMessage = async () => {
    if (!broadcastMessage.trim()) {
      toast.error("Please enter a message to send");
      return;
    }
    
    try {
      await sessionService.sendBroadcastMessage(
        nmec,
        broadcastMessage,
        course_id,
        exam_id,
        session_id
      );
      toast.success(`Message sent to ${userData?.name}`);
      setBroadcastMessage("");
    } catch (err) {
      toast.error(`Failed to send message: ${err.message || "Unknown error"}`);
    }
  };

  if (isLoading) {
    return <div className="min-h-screen flex items-center justify-center">Loading user data...</div>;
  }

  if (error) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center">
        <div className="text-red-500 mb-4">{error}</div>
        <BackButton />
      </div>
    );
  }

   // Format the session status
   const getStatusDisplay = () => {
    if (!sessionUser) return "Unknown";
    if (sessionUser.end_time) return "Completed";
    if (sessionUser.start_time) return "In Progress";
    if (!sessionUser.start_time && !sessionUser.end_time) return "Not Started";
    return "Connected";
  };
  
      return (
        <div className="min-h-screen bg-light-gray">
          {/* Main Content */}
          <main className="p-8">
            {/* Student Info */}
            <div className="bg-white shadow rounded-lg p-6 mb-8">
          <h1 className="text-2xl font-bold mb-4">Student Monitoring</h1>
            {/* User Info */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <p className="text-lg mb-2"><span className="font-semibold">Name:</span> {userData?.name || "Unknown"}</p>
                <p className="text-lg mb-2"><span className="font-semibold">NºMec:</span> {nmec}</p>
                <p className="text-lg mb-2"><span className="font-semibold">Email:</span> {userData?.email || "Unknown"}</p>
                <p className="text-lg mb-2">
                  <span className="font-semibold">Status:</span> 
                  <span className={`ml-2 px-2 py-0.5 rounded ${
                    sessionUser?.end_time ? "bg-gray-200" : "bg-green-100"
                  }`}>
                    {getStatusDisplay()}
                  </span>
                </p>
              </div>
              
              <div>
                {sessionUser?.start_time && (
                  <p className="text-lg mb-2">
                    <span className="font-semibold">Started:</span> {new Date(sessionUser.start_time).toLocaleTimeString()}
                  </p>
                )}
                
                {sessionUser?.end_time ? (
                  <p className="text-lg mb-2">
                    <span className="font-semibold">Ended:</span> {new Date(sessionUser.end_time).toLocaleTimeString()}
                  </p>
                ) : remainingTime !== null ? (
                  <p className="text-lg mb-2">
                    <span className="font-semibold">Time Remaining:</span> {remainingTime} minutes
                  </p>
                ) : null}
                
                <p className="text-lg mb-2">
                  <span className="font-semibold">Device ID:</span> {sessionUser?.device_id || "Unknown"}
                </p>
              </div>
            </div>
          </div>
            {/* Time control and messaging */}
            <div className="bg-white shadow rounded-lg p-6 mb-8">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {/* Time extension */}
                <div>
                  <h2 className="text-xl font-semibold mb-4">Time Management</h2>
                  <div className="flex items-center space-x-2 mb-4">
                    <input 
                      type="number"
                      min="1"
                      value={extensionMinutes} 
                      onChange={(e) => setExtensionMinutes(Math.max(1, parseInt(e.target.value) || 1))}
                      className="w-16 border p-2 rounded text-center"
                    />
                    <span className="mr-2">minutes</span>
                    <Button 
                      className="bg-blue-500 hover:bg-blue-700"
                      onClick={handleAddTime}
                    >
                      Add Time
                    </Button>
                    <Button 
                      className="bg-gray-500 hover:bg-gray-700"
                      onClick={handleReduceTime}
                    >
                      Reduce Time
                    </Button>
                  </div>
                  {/* Control Buttons */}
                  <div className="flex justify-between items-center">
                    <Button 
                      variant="destructive"
                      onClick={handleEndExam}
                      disabled={sessionUser?.end_time}
                    >
                      End Exam for Student
                    </Button>
                  </div>
                </div>
                {/* Direct messaging */}
                <div>
                  <h2 className="text-xl font-semibold mb-4">Send Message</h2>
                  <div className="flex items-center space-x-2">
                    <input 
                      type="text" 
                      value={broadcastMessage} 
                      onChange={(e) => setBroadcastMessage(e.target.value)}
                      onKeyDown={(e) => e.key === "Enter" && handleSendMessage()}
                      className="flex-1 border p-2 rounded"
                      placeholder="Message to student..."
                    />
                    <Button 
                      className="bg-green-600 hover:bg-green-800"
                      onClick={handleSendMessage}
                    >
                      Send
                    </Button>
                  </div>
                </div>
              </div>
            </div>
            {/* Code Editor and Console */}
            <div className="flex justify-center">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-8">
                <div className="bg-[#1E1E1E] rounded-lg p-4 h-[700px] overflow-auto">
                  <pre className="text-green-400 font-mono text-sm">
                    {`// Code editor content
                        function example() {
                          // Your code here
                        }`}
                  </pre>
                </div>
                <div className="bg-black rounded-lg p-4 h-[700px] overflow-auto">
                  <pre className="text-green-400 font-mono text-sm whitespace-pre-wrap">
                    {`-991/7 I/WifiService: reportActivityInfo uid=1000
                        -991/7 I/WifiService: getSupportedFeatures uid=1000
                        152-23884/7 W/TileUtils: Found com.android.settings.backup.BackupSettingsActivity
                        152-23884/7 D/Settings: No enabled state changed, skipping updateCategory call
                        152-28452/7 D/DashboardSummary: Listening for condition changes
                        152-28452/7 D/DashboardSummary: onConditionsChanged`}
                  </pre>
                </div>
              </div>
            </div>
            {/* Back Button */}
            <div className="mt-8">
              <BackButton />
            </div>
          </main>
          <Toaster />
        </div>
      );
}