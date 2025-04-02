"use client";
import { useState, useEffect, Fragment, useRef } from "react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { ChevronDown, ChevronRight, RefreshCw } from "lucide-react";
import { Input } from "@/components/ui/input";

const LogViewer = ({ deviceId }) => {
  const [logs, setLogs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [levelFilter, setLevelFilter] = useState("all");
  const [categoryFilter, setCategoryFilter] = useState("");
  const [useStreaming, setUseStreaming] = useState(false);
  const [count, setCount] = useState(100);
  const [expandedRows, setExpandedRows] = useState({});
  const eventSourceRef = useRef(null);

  const toggleRowExpansion = (index) => {
    setExpandedRows(prev => ({
      ...prev,
      [index]: !prev[index]
    }));
  };

  const fetchLogs = async () => {
    if (!deviceId) return;
    
    try {
      setLoading(true);
      const response = await fetch(`http://localhost:8000/logs/device/${deviceId}?count=${count}`);
      
      if (!response.ok) {
        throw new Error(`Failed to fetch logs: ${response.statusText}`);
      }

      const data = await response.json();
      setLogs(data);
      setError(null);
    } catch (err) {
      console.error("Error fetching logs:", err);
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const setupEventSource = () => {
    if (!deviceId || !useStreaming) return;
    
    // Close existing connection if any
    if (eventSourceRef.current) {
      eventSourceRef.current.close();
    }
    
    try {
      const url = `http://localhost:8000/logs/device/${deviceId}/stream`;
      eventSourceRef.current = new EventSource(url);
      
      eventSourceRef.current.onmessage = (event) => {
        try {
          const logData = JSON.parse(event.data);
          setLogs(prevLogs => {
            // Add new log at the beginning
            const newLogs = [logData, ...prevLogs];
            // Limit to count
            return newLogs.slice(0, count);
          });
        } catch (error) {
          console.error("Error parsing SSE data:", error);
        }
      };
      
      eventSourceRef.current.onerror = (error) => {
        console.error("EventSource error:", error);
        eventSourceRef.current.close();
        // Try to reconnect after a delay
        setTimeout(setupEventSource, 5000);
      };
    } catch (err) {
      console.error("Error setting up EventSource:", err);
    }
  };

  useEffect(() => {
    if (!deviceId) {
      setLogs([]);
      setLoading(false);
      return;
    }

    // Initial fetch of logs
    fetchLogs();
    
    // Set up streaming or polling
    if (useStreaming) {
      setupEventSource();
    } else {
      // Clean up any existing EventSource
      if (eventSourceRef.current) {
        eventSourceRef.current.close();
        eventSourceRef.current = null;
      }
      
      // Set up polling
      const intervalId = setInterval(fetchLogs, 5000);
      return () => clearInterval(intervalId);
    }
    
    // Cleanup
    return () => {
      if (eventSourceRef.current) {
        eventSourceRef.current.close();
        eventSourceRef.current = null;
      }
    };
  }, [deviceId, count, useStreaming]);

  const getLogLevelColor = (level) => {
    switch (level?.toLowerCase()) {
      case "error":
        return "bg-red-500";
      case "warning":
        return "bg-yellow-500";
      case "info":
        return "bg-blue-500";
      case "debug":
        return "bg-gray-500";
      default:
        return "bg-gray-500";
    }
  };

  // Apply filters to logs
  const filteredLogs = logs.filter(log => {
    // Apply level filter
    if (levelFilter !== "all" && log.level?.toLowerCase() !== levelFilter) {
      return false;
    }
    
    // Apply category filter
    if (categoryFilter && !log.category?.toLowerCase().includes(categoryFilter.toLowerCase())) {
      return false;
    }
    
    return true;
  });

  return (
    <div className="w-full">
      <div className="flex justify-between items-center mb-4">
        <h2 className="text-xl font-semibold">Device Activity Logs</h2>
        
        <div className="flex space-x-2">
          {/* Level filter */}
          <select 
            value={levelFilter}
            onChange={(e) => setLevelFilter(e.target.value)}
            className="border rounded px-2 py-1 text-sm"
          >
            <option value="all">All Levels</option>
            <option value="error">Errors</option>
            <option value="warning">Warnings</option>
            <option value="info">Info</option>
            <option value="debug">Debug</option>
          </select>
          
          {/* Count selector */}
          <select
            value={count}
            onChange={(e) => setCount(Number(e.target.value))}
            className="border rounded px-2 py-1 text-sm"
          >
            <option value={50}>50 logs</option>
            <option value={100}>100 logs</option>
            <option value={500}>500 logs</option>
            <option value={1000}>1000 logs</option>
          </select>
          
          {/* Streaming toggle */}
          <Button 
            onClick={() => setUseStreaming(!useStreaming)}
            className={`text-sm py-1 px-3 rounded ${
              useStreaming ? "bg-green-500 hover:bg-green-600" : "bg-gray-500 hover:bg-gray-600"
            } text-white`}
          >
            {useStreaming ? "Streaming" : "Polling"}
          </Button>
          
          {/* Manual refresh button */}
          <Button 
            onClick={fetchLogs}
            className="text-sm py-1 px-3 bg-blue-500 hover:bg-blue-600 text-white rounded"
          >
            <RefreshCw className="w-4 h-4 mr-1" />
            Refresh
          </Button>
        </div>
      </div>

      {/* Category filter input */}
      <div className="mb-4">
        <Input
          type="text"
          placeholder="Filter by category..."
          value={categoryFilter}
          onChange={(e) => setCategoryFilter(e.target.value)}
          className="max-w-xs"
        />
      </div>

      {loading && logs.length === 0 && (
        <div className="flex justify-center p-8">
          <p>Loading logs...</p>
        </div>
      )}

      {error && (
        <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded mb-4">
          <p>{error}</p>
        </div>
      )}

      {!deviceId && (
        <div className="bg-yellow-100 border border-yellow-400 text-yellow-700 px-4 py-3 rounded mb-4">
          <p>No device ID provided. Please select a device to view logs.</p>
        </div>
      )}

      <div className="bg-gray-50 rounded-lg border overflow-hidden">
        <div className="overflow-auto max-h-[500px]">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-100 sticky top-0">
              <tr>
                <th className="w-10 px-2 py-2"></th>
                <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase">Time</th>
                <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase">Level</th>
                <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase">Category</th>
                <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase">Message</th>
                <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase">Session/User</th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {filteredLogs.length > 0 ? (
                filteredLogs.map((log, index) => (
                  <Fragment key={log.id || log.es_id || `log-${index}`}>
                    <tr className="hover:bg-gray-50">
                      <td className="px-2 py-2">
                        {(log.details || log.data) && (
                          <button
                            onClick={() => toggleRowExpansion(index)}
                            className="p-1 rounded-full hover:bg-gray-200 focus:outline-none"
                          >
                            {expandedRows[index] ? 
                              <ChevronDown className="w-4 h-4 text-gray-500" /> : 
                              <ChevronRight className="w-4 h-4 text-gray-500" />
                            }
                          </button>
                        )}
                      </td>
                      <td className="px-4 py-2 text-sm text-gray-500 whitespace-nowrap">
                        {new Date(log.timestamp).toLocaleString('en-GB', {
                          year: 'numeric',
                          month: 'short',
                          day: 'numeric',
                          hour: '2-digit',
                          minute: '2-digit',
                          second: '2-digit'
                        })}
                      </td>
                      <td className="px-4 py-2">
                        <Badge className={`${getLogLevelColor(log.level)} text-white`}>
                          {log.level || "unknown"}
                        </Badge>
                      </td>
                      <td className="px-4 py-2 text-sm text-gray-600">
                        {log.category || "N/A"}
                      </td>
                      <td className="px-4 py-2 text-sm">
                        <div className="max-w-xl overflow-hidden text-ellipsis">
                          {log.message}
                        </div>
                      </td>
                      <td className="px-4 py-2 text-xs text-gray-500">
                        {log.session_id && <div>Session: {log.session_id}</div>}
                        {log.user_nmec && <div>User: {log.user_nmec}</div>}
                      </td>
                    </tr>
                    {expandedRows[index] && (log.details || log.data) && (
                      <tr className="bg-gray-50">
                        <td className="px-2 py-2"></td>
                        <td colSpan="5" className="px-4 py-2">
                          <div className="bg-white p-3 rounded border border-gray-200 shadow-sm">
                            <h4 className="text-sm font-medium mb-2 text-gray-700">Details:</h4>
                            <pre className="text-xs whitespace-pre-wrap bg-gray-50 p-3 rounded overflow-x-auto">
                              {typeof (log.details || log.data) === 'object' 
                                ? JSON.stringify(log.details || log.data, null, 2) 
                                : (log.details || log.data)}
                            </pre>
                          </div>
                        </td>
                      </tr>
                    )}
                  </Fragment>
                ))
              ) : (
                <tr>
                  <td colSpan="6" className="px-4 py-8 text-center text-gray-500">
                    {loading ? "Loading logs..." : "No logs found"}
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};

export default LogViewer;