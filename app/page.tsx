"use client";

import { useState } from "react";
import axios from "axios";

interface Tool {
  name: string;
  description: string;
  inputSchema: object;
}

export default function Home() {
  const [tools, setTools] = useState<Tool[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchTools = async () => {
    setLoading(true);
    setError(null);
    setTools([]);

    try {
      const response = await axios.get("http://localhost:8000/tools");
      console.log("Response:", response.data);

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

  return (
    <main className="flex flex-col items-center justify-center min-h-screen p-8 bg-black text-white">
      <h1 className="text-3xl font-bold mb-6">MCP Tools Viewer</h1>

      <button
        onClick={fetchTools}
        disabled={loading}
        className="mb-6 px-4 py-2 bg-blue-600 rounded hover:bg-blue-700 disabled:opacity-50"
      >
        {loading ? "Fetching Tools..." : "Fetch Tools"}
      </button>

      {error && <p className="text-red-500 mb-4">{error}</p>}

      {tools.length > 0 && (
        <div className="text-left w-full max-w-3xl bg-white text-black p-4 rounded">
          <h2 className="text-xl font-bold mb-4">Available Tools ({tools.length})</h2>
          <ul className="space-y-4">
            {tools.map((tool, index) => (
              <li key={index} className="border-b pb-4">
                <p>
                  <strong>Name:</strong> {tool.name}
                </p>
                <p>
                  <strong>Description:</strong> {tool.description}
                </p>
                <div className="mt-2">
                  <strong>Input Schema:</strong>
                  <pre className="bg-gray-100 p-2 mt-1 rounded overflow-auto">
                    {JSON.stringify(tool.inputSchema, null, 2)}
                  </pre>
                </div>
              </li>
            ))}
          </ul>
        </div>
      )}
    </main>
  );
}
