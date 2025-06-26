'use client'
import { useState } from "react";
import { privateKeyToAccount } from "viem/accounts";
import { createPublicClient, createWalletClient, http, parseUnits, getContract,  } from 'viem';
import { baseSepolia } from 'viem/chains';

interface DebugLog {
  message: string;
  type: string;
  timestamp: string;
}

export default function X402DebugComponent() {
  const [responseData, setResponseData] = useState<any>(null);
  const [paymentInfo, setPaymentInfo] = useState<any>(null);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [debugLogs, setDebugLogs] = useState<DebugLog[]>([]);

  const account = privateKeyToAccount("0xd395aea4aa82b49e5ab9e31277ff6559431896b775bfc8e6dcd2de8ed2dfd21c");

  const addLog = (message: string, type: string = "info") => {
    setDebugLogs(prev => [...prev, { message, type, timestamp: new Date().toISOString() }]);
  };

  

// Minimal ERC-20 ABI
const erc20Abi = [
  {
    "constant": false,
    "inputs": [
      { "name": "_to", "type": "address" },
      { "name": "_value", "type": "uint256" }
    ],
    "name": "transfer",
    "outputs": [{ "name": "", "type": "bool" }],
    "type": "function"
  }
];



  const publicClient = createPublicClient({
  chain: baseSepolia,
  transport: http('https://sepolia.base.org'),
});

const walletClient = createWalletClient({
  account,
  chain: baseSepolia,
  transport: http('https://sepolia.base.org'),
});

  const handleManualPayment = async () => {
  setLoading(true);
  setError(null);
  setResponseData(null);
  setPaymentInfo(null);
  setDebugLogs([]);

  const baseURL = "http://localhost:3000";
  const endpointPath = "/api/proxy/61f1b4b7-d495-48dd-b333-f84bb4a09ab1-weather_broad/weather";

  addLog("🚀 Starting manual payment flow");
  addLog(`Account address: ${account.address}`);

  try {
    // Step 1: Make initial request to get payment requirements
    addLog("📞 Making initial request to get payment requirements");

    const initialResponse = await fetch(`${baseURL}${endpointPath}`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        location: "new york",
        units: "celsius",
      }),
    });

    if (initialResponse.status === 402) {
      const paymentRequired = await initialResponse.json();
      addLog("💰 Received 402 Payment Required", "success");
      addLog(`Payment details: ${JSON.stringify(paymentRequired, null, 2)}`);

      const acceptsInfo = paymentRequired.accepts[0];
      setPaymentInfo(acceptsInfo);

      // Step 2: Send real payment transaction
      addLog("🔐 Sending real payment transaction");

const amountInWei = BigInt(acceptsInfo.maxAmountRequired);

      const tokenContract = getContract({
        address: acceptsInfo.asset as `0x${string}`,
        abi: erc20Abi,
        client: walletClient,
      });

      const txHash = await tokenContract.write.transfer([acceptsInfo.payTo, amountInWei]);

      addLog(`📦 Transaction sent: ${txHash}`);

      // Wait for confirmation
      await publicClient.waitForTransactionReceipt({ hash: txHash });
      addLog("✅ Transaction confirmed");

      // Step 3: Create payment proof
      const paymentProof = {
        scheme: "exact",
        network: "base-sepolia",
        txHash,
        amount: acceptsInfo.maxAmountRequired,
        asset: acceptsInfo.asset,
        payTo: acceptsInfo.payTo,
        timestamp: Date.now(),
      };

      addLog(`✅ Payment proof created: ${JSON.stringify(paymentProof, null, 2)}`);

      // Step 4: Retry request with payment header
      addLog("🔄 Retrying request with payment proof");

      const paymentHeader = btoa(JSON.stringify(paymentProof)); // base64 encode

      const retryResponse = await fetch(`${baseURL}${endpointPath}`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "X-PAYMENT": paymentHeader,
        },
        body: JSON.stringify({
          location: "new york",
          units: "celsius",
        }),
      });

      if (retryResponse.ok) {
        const data = await retryResponse.json();
        setResponseData(data);
        addLog("✅ Payment successful, received data", "success");
      } else {
        const errorData = await retryResponse.json();
        addLog(`❌ Payment validation failed: ${JSON.stringify(errorData, null, 2)}`, "error");
        setError(JSON.stringify(errorData, null, 2));
      }

    } else {
      addLog("❌ Expected 402 status but got: " + initialResponse.status, "error");
      const errorData = await initialResponse.text();
      setError(errorData);
    }

  } catch (err: unknown) {
    const errorMessage = err instanceof Error ? err.message : String(err);
    addLog(`❌ Request failed: ${errorMessage}`, "error");
    setError(errorMessage);
  } finally {
    setLoading(false);
  }
};

  const handleWithInterceptor = async () => {
    setLoading(true);
    setError(null);
    setResponseData(null);
    setPaymentInfo(null);
    setDebugLogs([]);

    addLog("🚀 Testing with payment interceptor");

    try {
      // Check if withPaymentInterceptor is available
      if (typeof window !== 'undefined' && (window as any).withPaymentInterceptor) {
        const api = (window as any).withPaymentInterceptor(
          // Create axios-like instance
          {
            create: (config: any) => ({
              post: async (url: string, data: any) => {
                addLog(`Making POST request to: ${config.baseURL}${url}`);
                const response = await fetch(`${config.baseURL}${url}`, {
                  method: "POST",
                  headers: {
                    "Content-Type": "application/json",
                  },
                  body: JSON.stringify(data),
                });
                
                if (!response.ok && response.status !== 402) {
                  throw new Error(`HTTP ${response.status}`);
                }
                
                const responseData = await response.json();
                return {
                  data: responseData,
                  status: response.status,
                  headers: Object.fromEntries(response.headers.entries())
                };
              }
            })
          },
          account
        );

        const response = await api.post("/api/proxy/61f1b4b7-d495-48dd-b333-f84bb4a09ab1-weather_broad/weather", {
          location: "new york",
          units: "celsius",
        });

        setResponseData(response.data);
        addLog("✅ Interceptor request successful", "success");

      } else {
        addLog("❌ withPaymentInterceptor not available", "error");
        setError("withPaymentInterceptor not available in this environment");
      }

    } catch (err: unknown) {
      const errorMessage = err instanceof Error ? err.message : String(err);
      addLog(`❌ Interceptor request failed: ${errorMessage}`, "error");
      setError(errorMessage);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="p-6 max-w-4xl mx-auto">
      <h1 className="text-2xl font-bold mb-6">X402 Payment Debug Tool</h1>
      
      <div className="space-y-4 mb-6">
        <button
          onClick={handleManualPayment}
          disabled={loading}
          className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 disabled:opacity-50 mr-4"
        >
          {loading ? "Processing..." : "Test Manual Payment Flow"}
        </button>
        
        <button
          onClick={handleWithInterceptor}
          disabled={loading}
          className="px-4 py-2 bg-green-600 text-white rounded hover:bg-green-700 disabled:opacity-50"
        >
          {loading ? "Processing..." : "Test With Interceptor"}
        </button>
      </div>

      {debugLogs.length > 0 && (
        <div className="mb-6 p-4 bg-gray-100 rounded">
          <h2 className="font-semibold mb-2">🔍 Debug Logs:</h2>
          <div className="space-y-1 max-h-60 overflow-y-auto">
            {debugLogs.map((log, index) => (
              <div key={index} className={`text-sm p-2 rounded ${
                log.type === 'error' ? 'bg-red-100 text-red-800' :
                log.type === 'success' ? 'bg-green-100 text-green-800' :
                'bg-blue-100 text-blue-800'
              }`}>
                <span className="text-xs text-gray-500">{new Date(log.timestamp).toLocaleTimeString()}</span>
                <br />
                {log.message}
              </div>
            ))}
          </div>
        </div>
      )}

      {responseData && (
        <div className="mb-6 p-4 bg-green-50 border border-green-200 rounded">
          <h2 className="font-semibold text-green-800 mb-2">✅ Success Response:</h2>
          <pre className="text-sm bg-white p-2 rounded overflow-auto">
            {JSON.stringify(responseData, null, 2)}
          </pre>
        </div>
      )}

      {paymentInfo && (
        <div className="mb-6 p-4 bg-yellow-50 border border-yellow-200 rounded">
          <h2 className="font-semibold text-yellow-800 mb-2">💰 Payment Requirements:</h2>
          <pre className="text-sm bg-white p-2 rounded overflow-auto">
            {JSON.stringify(paymentInfo, null, 2)}
          </pre>
        </div>
      )}

      {error && (
        <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded">
          <h2 className="font-semibold text-red-800 mb-2">❌ Error:</h2>
          <pre className="text-sm bg-white p-2 rounded overflow-auto">{error}</pre>
        </div>
      )}

      <div className="mt-8 p-4 bg-blue-50 border border-blue-200 rounded">
        <h3 className="font-semibold text-blue-800 mb-2">🔧 Troubleshooting Steps:</h3>
        <ol className="list-decimal list-inside space-y-2 text-sm text-blue-700">
          <li>Verify that x402-axios is properly installed and imported</li>
          <li>Check that your private key has sufficient balance on base-sepolia</li>
          <li>Ensure the payment interceptor is correctly configured</li>
          <li>Verify the network configuration matches the server requirements</li>
          <li>Check that the token contract address matches what the server expects</li>
          <li>Test the manual payment flow to understand the expected headers</li>
        </ol>
      </div>
    </div>
  );
}