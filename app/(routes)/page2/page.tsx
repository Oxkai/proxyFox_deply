"use client";

import { useState } from "react";
import axios from "axios";

type Tool = {
  name: string;
  description: string;
};

export default function Page2() {
  const [wallet, setWallet] = useState("");
  const [serverUri, setServerUri] = useState("");
  const [serverName, setServerName] = useState("");
  const [description, setDescription] = useState("");
  const [authEnabled, setAuthEnabled] = useState(false);
  const [tools, setTools] = useState<Tool[]>([]);
  const [prices, setPrices] = useState<{ [key: string]: string }>({});
  const [monetizedUri, setMonetizedUri] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchTools = async () => {
    if (!serverUri) {
      setError("Please enter a Server URI first.");
      return;
    }

    setLoading(true);
    setError(null);
    setTools([]);

    try {
      const response = await axios.get(`${serverUri}/tools`);
      if (response.data.tools && Array.isArray(response.data.tools)) {
        setTools(response.data.tools);
      } else {
        setError("Unexpected response format.");
      }
    } catch (err: any) {
      setError("Failed to fetch tools: " + (err.message || "Unknown error"));
    }

    setLoading(false);
  };

  const handlePriceChange = (toolName: string, value: string) => {
    setPrices((prev) => ({ ...prev, [toolName]: value }));
  };

  const handleMonetize = async () => {
    const monetizedTools = tools.map((tool) => ({
      toolName: tool.name,
      description: tool.description,
      price: prices[tool.name] || "$0.00",
    }));

    const payload = {
      recipient: wallet,
      serverName,
      description,
      serverUri,
      authEnabled,
      tools: monetizedTools,
    };

    try {
      const res = await axios.post("/api/monetize", payload);
      setMonetizedUri(res.data.monetizedUri);
    } catch (err) {
      console.error(err);
      alert("Failed to monetize.");
    }
  };

  return (
    <main className="max-w-2xl mx-auto py-12 px-6 bg-black text-white space-y-6 min-h-screen">
      <h1 className="text-3xl font-bold">Monetize MCP Server</h1>

      {/* Wallet */}
      <div>
        <label className="block font-medium">Payment Wallet *</label>
        <input
          type="text"
          value={wallet}
          onChange={(e) => setWallet(e.target.value)}
          className="border border-white rounded px-3 py-2 w-full bg-black text-white mt-1"
          placeholder="0x..."
        />
      </div>

      {/* Server URI */}
      <div>
        <label className="block font-medium">MCP Server URL *</label>
        <input
          type="text"
          value={serverUri}
          onChange={(e) => setServerUri(e.target.value)}
          className="border border-white rounded px-3 py-2 w-full bg-black text-white mt-1"
          placeholder="https://your-mcp-server.com/mcp"
        />
      </div>

      {/* Fetch Tools Button */}
      <button
        onClick={fetchTools}
        disabled={loading}
        className="border border-white rounded px-4 py-2 font-semibold hover:bg-white hover:text-black transition mt-3"
      >
        {loading ? "Fetching..." : "Fetch Tools"}
      </button>

      {error && <p className="text-red-500 mt-2">{error}</p>}

      {/* Server Name */}
      <div>
        <label className="block font-medium mt-4">Server Name *</label>
        <input
          type="text"
          value={serverName}
          onChange={(e) => setServerName(e.target.value)}
          className="border border-white rounded px-3 py-2 w-full bg-black text-white mt-1"
          placeholder="My MCP Server"
        />
      </div>

      {/* Description */}
      <div>
        <label className="block font-medium">Description *</label>
        <textarea
          value={description}
          onChange={(e) => setDescription(e.target.value)}
          className="border border-white rounded px-3 py-2 w-full bg-black text-white mt-1"
          placeholder="Describe your MCP server"
        />
      </div>

      {/* Auth Enabled */}
      <div className="flex items-center gap-3 mt-2">
        <input
          type="checkbox"
          checked={authEnabled}
          onChange={() => setAuthEnabled(!authEnabled)}
        />
        <label className="font-medium">Enable Authentication Headers</label>
      </div>

      {/* Tools */}
      {tools.length > 0 && (
        <div>
          <h2 className="text-xl font-semibold mt-6 mb-2">
            Detected Tools ({tools.length})
          </h2>
          {tools.map((tool) => (
            <div
              key={tool.name}
              className="border border-gray-700 rounded p-4 mb-4 space-y-2"
            >
              <h3 className="font-bold">{tool.name}</h3>
              <p className="text-gray-400 text-sm">{tool.description}</p>
              <input
                type="text"
                value={prices[tool.name] || ""}
                onChange={(e) =>
                  handlePriceChange(tool.name, e.target.value)
                }
                className="border border-white rounded px-3 py-2 w-full bg-black text-white mt-1"
                placeholder="Enter price ($)"
              />
            </div>
          ))}
        </div>
      )}

      {/* Monetize Button */}
      {tools.length > 0 && (
        <button
          onClick={handleMonetize}
          className="border border-green-500 text-green-400 rounded-xl px-6 py-3 font-semibold hover:bg-green-500 hover:text-black transition w-full"
        >
          🚀 Monetize Now
        </button>
      )}

      {/* Monetized URI */}
      {monetizedUri && (
        <div className="border border-gray-700 rounded-lg p-4 mt-6">
          <p className="text-sm mb-2">Monetized URI:</p>
          <code className="block break-all">{monetizedUri}</code>
        </div>
      )}
    </main>
  );
}
