"use client";
import { useState, useEffect, Fragment } from "react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { ChevronDown, ChevronRight } from "lucide-react";

const LogViewer = ({ sessionId, nmec, deviceId }) => {
  const [logs, setLogs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [filter, setFilter] = useState("all");
  const [autoRefresh, setAutoRefresh] = useState(true);
  const [count, setCount] = useState(100);
  const [expandedRows, setExpandedRows] = useState({});

  const toggleRowExpansion = (index) => {
    setExpandedRows(prev => ({
      ...prev,
      [index]: !prev[index]
    }));
  };

  const fetchLogs = async () => {
    try {
      setLoading(true);
      let response;
      
      if (sessionId && nmec) {
        response = await fetch(`http://localhost:8000/logs/session/${sessionId}/user/${nmec}?count=${count}`);
      } else if (deviceId) {
        response = await fetch(`http://localhost:8000/logs/device/${deviceId}?count=${count}`);
      } else {
        throw new Error("Either sessionId+nmec or deviceId must be provided");
      }

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

  useEffect(() => {
    fetchLogs();
    
    let intervalId;
    if (autoRefresh) {
      intervalId = setInterval(fetchLogs, 5000);
    }
    
    return () => {
      if (intervalId) clearInterval(intervalId);
    };
  }, [sessionId, nmec, deviceId, count, autoRefresh]);

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

  const filteredLogs = filter === "all" 
    ? logs 
    : logs.filter(log => log.level?.toLowerCase() === filter);

  return (
    <div className="w-full">
      <div className="flex justify-between items-center mb-4">
        <h2 className="text-xl font-semibold">Activity Logs</h2>
        <div className="flex space-x-2">
          <select 
            value={filter}
            onChange={(e) => setFilter(e.target.value)}
            className="border rounded px-2 py-1 text-sm"
          >
            <option value="all">All Levels</option>
            <option value="error">Errors</option>
            <option value="warning">Warnings</option>
            <option value="info">Info</option>
            <option value="debug">Debug</option>
          </select>
          
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
          
          <Button 
            onClick={fetchLogs}
            className="text-sm py-1 px-3 bg-blue-500 hover:bg-blue-600 text-white rounded"
          >
            Refresh
          </Button>
          
          <Button 
            onClick={() => setAutoRefresh(!autoRefresh)}
            className={`text-sm py-1 px-3 rounded ${
              autoRefresh ? "bg-green-500 hover:bg-green-600" : "bg-gray-500 hover:bg-gray-600"
            } text-white`}
          >
            {autoRefresh ? "Auto-refresh On" : "Auto-refresh Off"}
          </Button>
        </div>
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
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {filteredLogs.length > 0 ? (
                filteredLogs.map((log, index) => (
                  <Fragment key={log.id || `log-${index}`}>
                    <tr className="hover:bg-gray-50">
                      <td className="px-2 py-2">
                        {log.details && (
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
                    </tr>
                    {expandedRows[index] && log.details && (
                      <tr className="bg-gray-50">
                        <td className="px-2 py-2"></td>
                        <td colSpan="4" className="px-4 py-2">
                          <div className="bg-white p-3 rounded border border-gray-200 shadow-sm">
                            <h4 className="text-sm font-medium mb-2 text-gray-700">Details:</h4>
                            <pre className="text-xs whitespace-pre-wrap bg-gray-50 p-3 rounded overflow-x-auto">
                              {typeof log.details === 'object' 
                                ? JSON.stringify(log.details, null, 2) 
                                : log.details}
                            </pre>
                          </div>
                        </td>
                      </tr>
                    )}
                  </Fragment>
                ))
              ) : (
                <tr>
                  <td colSpan="5" className="px-4 py-8 text-center text-gray-500">
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