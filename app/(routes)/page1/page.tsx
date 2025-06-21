"use client";

import { useState } from "react";
import axios from "axios";

type Tool = {
  name: string;
  description: string;
};

export default function Page1() {
  const [walletAddress, setWalletAddress] = useState("");
  const [uri, setUri] = useState("");
  const [serverName, setServerName] = useState("");
  const [description, setDescription] = useState("");
  const [authEnabled, setAuthEnabled] = useState(false);
  const [tools, setTools] = useState<Tool[]>([]);
  const [amounts, setAmounts] = useState<{ [key: string]: string }>({});
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchTools = async () => {
    setLoading(true);
    setError(null);
    setTools([]);

    try {
      const response = await axios.get(`${uri}/tools`);
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

  const handleAmountChange = (toolName: string, value: string) => {
    setAmounts((prev) => ({ ...prev, [toolName]: value }));
  };

  const handleMonetize = () => {
    console.log("Wallet:", walletAddress);
    console.log("Amounts:", amounts);
  };

  return (
    <main className="max-w-3xl mx-auto py-12 px-6 space-y-8 bg-black min-h-screen text-white font-sans">
      <h1 className="text-4xl font-bold mb-6 border-b border-gray-800 pb-4">
        Server Configuration
      </h1>

      {/* Payment Wallet */}
      <div>
        <label className="block text-lg font-medium mb-2">Payment Wallet *</label>
        <div className="flex items-center space-x-3">
          <input
            type="text"
            value={walletAddress}
            onChange={(e) => setWalletAddress(e.target.value)}
            placeholder="0x..."
            className="bg-black border border-gray-700 rounded-lg px-4 py-2 flex-1 focus:ring-2 focus:ring-white focus:outline-none"
          />
          <button className="text-sm text-white border border-gray-600 rounded-lg px-3 py-2 hover:bg-white hover:text-black transition">
            Disconnect
          </button>
        </div>
      </div>

      {/* MCP Server URL */}
      <div>
        <label className="block text-lg font-medium mb-2">MCP Server URL *</label>
        <input
          type="text"
          value={uri}
          onChange={(e) => setUri(e.target.value)}
          className="bg-black border border-gray-700 rounded-lg px-4 py-2 w-full focus:ring-2 focus:ring-white focus:outline-none"
          placeholder="http://localhost:8000"
        />
      </div>

      {/* Enable Authentication Headers */}
      <div className="flex items-center space-x-3">
        <input
          type="checkbox"
          checked={authEnabled}
          onChange={() => setAuthEnabled(!authEnabled)}
          className="accent-white"
        />
        <span className="text-base">Enable Authentication Headers</span>
      </div>

      {/* Server Name */}
      <div>
        <label className="block text-lg font-medium mb-2">Server Name *</label>
        <input
          type="text"
          value={serverName}
          onChange={(e) => setServerName(e.target.value)}
          className="bg-black border border-gray-700 rounded-lg px-4 py-2 w-full focus:ring-2 focus:ring-white focus:outline-none"
          placeholder="Your MCP Server Name"
        />
      </div>

      {/* Description */}
      <div>
        <label className="block text-lg font-medium mb-2">Description *</label>
        <textarea
          value={description}
          onChange={(e) => setDescription(e.target.value)}
          className="bg-black border border-gray-700 rounded-lg px-4 py-2 w-full focus:ring-2 focus:ring-white focus:outline-none"
          placeholder="Describe your MCP Server and tools..."
          rows={3}
        />
      </div>

      {/* Fetch Tools Button */}
      <button
        onClick={fetchTools}
        disabled={loading}
        className={`rounded-xl px-5 py-3 w-full text-lg font-semibold border transition 
        ${loading ? "border-gray-500 text-gray-400 cursor-not-allowed" : "border-white text-white hover:bg-white hover:text-black"}`}
      >
        {loading ? "Fetching Tools..." : "Fetch Tools"}
      </button>

      {/* Error */}
      {error && <p className="text-red-500 text-sm">{error}</p>}

      {/* Detected Tools */}
      {tools.length > 0 && (
        <div className="space-y-5 mt-10">
          <div className="flex items-center justify-between">
            <h2 className="text-2xl font-bold">Detected Tools ({tools.length})</h2>
            <button
              onClick={fetchTools}
              className="text-sm border border-gray-600 rounded-lg px-3 py-2 hover:bg-white hover:text-black transition"
            >
              Refresh
            </button>
          </div>

          {tools.map((tool) => (
            <div
              key={tool.name}
              className="border border-gray-800 rounded-xl p-5 bg-black shadow-sm hover:shadow-md transition space-y-2"
            >
              <h3 className="font-bold text-xl">{tool.name}</h3>
              <p className="text-gray-400 text-sm">{tool.description}</p>
              <div>
                <label className="block text-sm font-medium mb-1">Amount ($)</label>
                <input
                  type="text"
                  value={amounts[tool.name] || ""}
                  onChange={(e) => handleAmountChange(tool.name, e.target.value)}
                  className="bg-black border border-gray-700 rounded-lg px-4 py-2 w-full focus:ring-2 focus:ring-white focus:outline-none"
                  placeholder="Enter price"
                />
              </div>
            </div>
          ))}

          <button
            onClick={handleMonetize}
            className="bg-white text-black font-semibold rounded-xl px-5 py-3 w-full hover:bg-gray-200 transition"
          >
            Monetize Tools
          </button>
        </div>
      )}
    </main>
  );
}
