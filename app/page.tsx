'use client'
import { useState } from "react";
import { privateKeyToAccount } from "viem/accounts";
import { createPublicClient, createWalletClient, http,  } from 'viem';
import { baseSepolia } from 'viem/chains';

interface DebugLog {
  message: string;
  type: string;
  timestamp: string;
}



export default function Page() {
  const [responseData, setResponseData] = useState<any>(null);
  const [paymentInfo, setPaymentInfo] = useState<any>(null);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [debugLogs, setDebugLogs] = useState<DebugLog[]>([]);

  const account = privateKeyToAccount("0xd395aea4aa82b49e5ab9e31277ff6559431896b775bfc8e6dcd2de8ed2dfd21c");

  const addLog = (message: string, type: string = "info") => {
    setDebugLogs(prev => [...prev, { message, type, timestamp: new Date().toISOString() }]);
  };

  




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
  const resourceUrl = `${baseURL}${endpointPath}`;

  addLog("🚀 Starting EIP-3009 payment flow");
  addLog(`Account address: ${account.address}`);

  try {
    // Step 1: Initial request to get payment requirements
    addLog("📞 Making initial request to get payment requirements");

    const initialResponse = await fetch(resourceUrl, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
  "tool": "weather",
  "input": { "text": "Hello MCP!" }
}),
    });

    if (initialResponse.status !== 402) {
      addLog(`❌ Expected 402 but got ${initialResponse.status}`, "error");
      const errorText = await initialResponse.text();
      setError(errorText);
      return;
    }

    const paymentRequired = await initialResponse.json();
    addLog("💰 Received 402 Payment Required", "success");
    addLog(`Payment details: ${JSON.stringify(paymentRequired, null, 2)}`);

    const acceptsInfo = paymentRequired.accepts[0];
    setPaymentInfo(acceptsInfo);

    // Step 2: Create and sign EIP-3009 authorization
    addLog("📝 Creating and signing EIP-3009 TransferWithAuthorization");

    const validAfter = BigInt(Math.floor(Date.now() / 1000) - 600);
    const validBefore = BigInt(Math.floor(Date.now() / 1000) + 300);
const nonce = `0x${crypto.getRandomValues(new Uint8Array(32)).reduce((str, byte) => str + byte.toString(16).padStart(2, "0"), "")}` as `0x${string}`;

    // ✅ EIP-712 Type Definitions
    const authorizationTypes = {
      EIP712Domain: [
        { name: "name", type: "string" },
        { name: "version", type: "string" },
        { name: "chainId", type: "uint256" },
        { name: "verifyingContract", type: "address" },
      ],
      TransferWithAuthorization: [
        { name: "from", type: "address" },
        { name: "to", type: "address" },
        { name: "value", type: "uint256" },
        { name: "validAfter", type: "uint256" },
        { name: "validBefore", type: "uint256" },
        { name: "nonce", type: "bytes32" },
      ],
    } as const;

    // ✅ EIP-712 Domain
    const domain = {
      name: "USD Coin",
      version: "2",
      chainId: BigInt(baseSepolia.id),
      verifyingContract: acceptsInfo.asset as `0x${string}`,
    };

    // ✅ Message Payload
    const authorizationMessage = {
      from: account.address,
      to: acceptsInfo.payTo,
      value: BigInt(acceptsInfo.maxAmountRequired),
      validAfter,
      validBefore,
      nonce,
    };

    // ✅ Sign EIP-712 Typed Data
    const signature = await walletClient.signTypedData<
  typeof authorizationTypes, 
  "TransferWithAuthorization"
>({
  account,
  domain,
  types: authorizationTypes,
  primaryType: "TransferWithAuthorization",
  message: authorizationMessage,
});

    addLog(`✅ EIP-3009 signature: ${signature}`);

    // Step 3: Construct payment proof payload
    const paymentProof = {
      scheme: "exact",
      network: "base-sepolia",
      asset: acceptsInfo.asset,
      payTo: acceptsInfo.payTo,
      payer: account.address,
      value: acceptsInfo.maxAmountRequired,
      validAfter: validAfter.toString(),
      validBefore: validBefore.toString(),
      nonce,
      signature,
      x402Version: 2,
    };

    addLog(`📦 Payment proof created: ${JSON.stringify(paymentProof, null, 2)}`);

    // Step 4: Retry request with payment proof header
    addLog("🔄 Retrying request with X-PAYMENT header");

    const paymentHeader = btoa(JSON.stringify(paymentProof));

const retryResponse = await fetch(resourceUrl, {
  method: "POST",
  headers: {
    "Content-Type": "application/json",
    "X-PAYMENT": paymentHeader,
  },
  body: JSON.stringify({
    tool: "weather",
    input: {
      text: "Hello MCP!"
    }
  }),
});


    if (retryResponse.ok) {
      const data = await retryResponse.json();
      setResponseData(data);
      addLog("✅ Payment successful, data received", "success");
    } else {
      const errorText = await retryResponse.text();
      try {
        const errorData = JSON.parse(errorText);
        addLog(`❌ Payment validation failed: ${JSON.stringify(errorData, null, 2)}`, "error");
        setError(JSON.stringify(errorData, null, 2));
      } catch {
        addLog(`❌ Payment validation failed: ${errorText}`, "error");
        setError(errorText);
      }
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

  const response = await api.post(
  "/api/proxy/61f1b4b7-d495-48dd-b333-f84bb4a09ab1-weather_broad/weather",
  {
    tool: "weather",
    input: {
      text: "Hello, MCP!"
    }
  }
);

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