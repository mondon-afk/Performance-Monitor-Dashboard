import React, { useEffect, useState } from "react";
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from "recharts";

const PerformanceDashboard = () => {
  const [history, setHistory] = useState([]);
  const [url, setUrl] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [alert, setAlert] = useState(null);

  useEffect(() => {
    const fetchHistory = () => {
      fetch("http://127.0.0.1:5000/history")
        .then((res) => res.json())
        .then((data) => {
          setHistory(data);
          checkForSlowResponses(data);
        })
        .catch((err) => console.error("Error fetching history:", err));
    };

    fetchHistory(); // Initial fetch
    const interval = setInterval(fetchHistory, 5000); // Auto-refresh every 5 seconds
    return () => clearInterval(interval); // Cleanup interval on component unmount
  }, []);

  const monitorUrl = async () => {
    if (!url) {
      setError("Please enter a URL");
      return;
    }
    setLoading(true);
    setError(null);
    try {
      const res = await fetch(`http://127.0.0.1:5000/monitor?url=${encodeURIComponent(url)}`);
      const data = await res.json();
      setHistory([data, ...history]);
      checkForSlowResponses([data, ...history]);
    } catch (err) {
      setError("Failed to fetch data");
    }
    setLoading(false);
  };

  const checkForSlowResponses = (data) => {
    const SLOW_RESPONSE_THRESHOLD = 1000; // Define threshold (e.g., 1000ms)
    const slowResponses = data.filter(item => item.response_time_ms > SLOW_RESPONSE_THRESHOLD);
    if (slowResponses.length > 0) {
      setAlert("Warning: Slow response times detected!");
    } else {
      setAlert(null);
    }
  };

  return (
    <div className="p-6 max-w-4xl mx-auto bg-gradient-to-r from-blue-500 to-purple-600 min-h-screen rounded-lg shadow-lg text-white">
      <h1 className="text-4xl font-extrabold mb-6 text-center">Performance Monitoring Dashboard</h1>
      {alert && <div className="bg-red-500 text-white p-3 rounded-lg mb-4 text-center font-semibold animate-pulse">{alert}</div>}
      <div className="mb-6 flex flex-col items-center">
        <input
          type="text"
          placeholder="Enter URL to monitor"
          value={url}
          onChange={(e) => setUrl(e.target.value)}
          className="p-3 border rounded-lg w-full max-w-lg shadow-sm text-black"
        />
        <button
          onClick={monitorUrl}
          className="mt-3 p-3 bg-yellow-400 hover:bg-yellow-500 text-black font-bold rounded-lg w-full max-w-lg shadow-md"
          disabled={loading}
        >
          {loading ? "Checking..." : "Monitor URL"}
        </button>
        {error && <p className="text-red-300 mt-2 font-semibold">{error}</p>}
      </div>

      <h2 className="text-2xl font-semibold mt-6 mb-4 text-center">Response Time History</h2>
      <div className="bg-white p-4 rounded-lg shadow-lg text-black">
        <ResponsiveContainer width="100%" height={300}>
          <LineChart data={history} margin={{ top: 10, right: 30, left: 0, bottom: 0 }}>
            <CartesianGrid strokeDasharray="3 3" stroke="#ddd" />
            <XAxis dataKey="timestamp" tickFormatter={(tick) => new Date(tick).toLocaleTimeString()} />
            <YAxis label={{ value: 'Response Time (ms)', angle: -90, position: 'insideLeft' }} />
            <Tooltip contentStyle={{ backgroundColor: "#333", color: "#fff" }} />
            <Line type="monotone" dataKey="response_time_ms" stroke="#ff7f50" strokeWidth={3} dot={{ r: 5, fill: "#ff4500" }} />
          </LineChart>
        </ResponsiveContainer>
      </div>

      <h2 className="text-2xl font-semibold mt-6 mb-4 text-center">Response Data</h2>
      <div className="overflow-x-auto">
        <table className="w-full border-collapse border border-gray-300 bg-white shadow-lg rounded-lg text-black">
          <thead>
            <tr className="bg-gradient-to-r from-green-400 to-blue-500 text-white">
              <th className="border p-3">URL</th>
              <th className="border p-3">Status Code</th>
              <th className="border p-3">Response Time (ms)</th>
              <th className="border p-3">Timestamp</th>
            </tr>
          </thead>
          <tbody>
            {history.length > 0 ? (
              history.map((item, index) => (
                <tr key={index} className="border hover:bg-gray-200">
                  <td className="border p-3">{item.url}</td>
                  <td className="border p-3 text-center font-semibold">{item.status_code}</td>
                  <td className={`border p-3 text-center font-semibold ${item.response_time_ms > 1000 ? 'text-red-500' : 'text-green-600'}`}>{item.response_time_ms}</td>
                  <td className="border p-3 text-center">{new Date(item.timestamp).toLocaleString()}</td>
                </tr>
              ))
            ) : (
              <tr>
                <td className="border p-3 text-center" colSpan="4">No data available</td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
};

export default PerformanceDashboard;
