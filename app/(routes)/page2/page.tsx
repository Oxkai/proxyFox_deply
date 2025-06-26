"use client";

import { useState } from "react";
import axios from "axios";
import { privateKeyToAccount } from "viem/accounts";
import { Hex } from "viem";


const privateKey = `0xd395aea4aa82b49e5ab9e31277ff6559431896b775bfc8e6dcd2de8ed2dfd21c` as Hex;


export default function Home() {

  const [location, setLocation] = useState("");
  const [result, setResult] = useState<string | null>(null);
  const [statusCode, setStatusCode] = useState<number | null>(null);
  const [loading, setLoading] = useState(false);

  const account = privateKeyToAccount(privateKey);

  console.log('account',account)

  const fetchWeather = async () => {
    setLoading(true);
    setStatusCode(null);
    setResult(null);

    try {
      const response = await axios.post("http://localhost:3000/api/proxy/61f1b4b7-d495-48dd-b333-f84bb4a09ab1-weather_broad/weather", {
        tool: "weather",
        input: { location },
      });

      console.log("Full response:", response);

      const fullResponse = {
        status: response.status,
        statusText: response.statusText,
        headers: response.headers,
        data: response.data,
      };

      setStatusCode(response.status);
      setResult(JSON.stringify(fullResponse, null, 2));
    } catch (error: any) {
      if (error.response) {
        const errorResponse = {
          status: error.response.status,
          statusText: error.response.statusText,
          headers: error.response.headers,
          data: error.response.data,
        };
        setStatusCode(error.response.status);
        setResult(JSON.stringify(errorResponse, null, 2));
      } else {
        setResult("Error: " + error.message);
      }
    }

    setLoading(false);
  };

  return (
    <main className="flex flex-col items-center  h-screen p-6 bg-black text-white">
      <h1 className="text-3xl font-bold mb-6">Weather Checker</h1>

      <input
        type="text"
        value={location}
        onChange={(e) => setLocation(e.target.value)}
        placeholder="Enter location"
        className="p-2 border border-gray-300 rounded w-64 mb-4 text-white"
      />

      <button
        onClick={fetchWeather}
        disabled={!location || loading}
        className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 disabled:opacity-50"
      >
        {loading ? "Fetching..." : "Get Weather"}
      </button>

      {statusCode !== null && (
        <p className="mt-4 text-lg">
          Status Code: <span className="font-bold">{statusCode}</span>
        </p>
      )}

      {result && (
        <pre className="mt-4 p-4 bg-white text-black border rounded w-full max-w-2xl overflow-auto">
          {result}
        </pre>
      )}
    </main>
  );
}
