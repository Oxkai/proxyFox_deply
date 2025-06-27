import { NextRequest, NextResponse } from "next/server";
import { paymentMiddleware, Network } from "x402-next";
import fs from "fs";
import path from "path";

const facilitatorUrl = "https://x402.org/facilitator";
const _network = "base-sepolia";

function getServerConfig() {
  const filePath = path.join(process.cwd(), "lib", "db.json");
  console.log(`📄 Reading server config from ${filePath}`);
  const jsonData = fs.readFileSync(filePath, "utf-8");
  return JSON.parse(jsonData);
}

export async function POST(req: NextRequest) {
  console.log("📥 Incoming POST request", req.method, req.nextUrl.pathname);

  const pathnameParts = req.nextUrl.pathname.split("/");
  const serverId = pathnameParts[3];
  const tool = pathnameParts[4];
  console.log(`🔍 Extracted serverId: ${serverId}, tool: ${tool}`);

  const monetizedServers = getServerConfig();
  const serverConfig = monetizedServers.find((s: any) => s.serverId === serverId);
  console.log(`🗂 Found server config:`, serverConfig);

  if (!serverConfig) {
    console.log("❌ Unknown server ID");
    return NextResponse.json({ error: "Unknown server ID" }, { status: 404 });
  }

  const toolConfig = serverConfig.tools.find((t: any) => t.toolName === tool);
  console.log(`🛠 Found tool config:`, toolConfig);

  if (!toolConfig) {
    console.log("❌ Unknown tool for this server");
    return NextResponse.json({ error: "Unknown tool for this server" }, { status: 404 });
  }

  const bodyArrayBuffer = await req.arrayBuffer();
  const bodyText = new TextDecoder().decode(bodyArrayBuffer);
  console.log("📦 Received raw body:", bodyText);

  let parsedBody;
  try {
    parsedBody = JSON.parse(bodyText);
    console.log("✅ Parsed body:", parsedBody);
  } catch (err) {
    console.log("❌ Invalid JSON body", err);
    return NextResponse.json({ error: "Invalid JSON body" }, { status: 400 });
  }

  // Collect headers
  const requestHeaders: Record<string, string> = {
    "Content-Type": "application/json",
    "Content-Length": new Blob([bodyText]).size.toString(),
  };

  const copyHeader = (name: string) => {
    const value = req.headers.get(name);
    if (value) requestHeaders[name] = value;
  };

  ["authorization", "user-agent", "x-forwarded-for", "x-payment"].forEach(copyHeader);

  console.log("📜 Final request headers:", requestHeaders);

  // Create fresh request for middleware
  const freshRequest = new NextRequest(req.url, {
    method: req.method,
    headers: requestHeaders,
    body: bodyText,
  });

  const xPaymentHeader = freshRequest.headers.get("x-payment");
  console.log("📜 X-PAYMENT header in fresh request:", xPaymentHeader);

  if (!xPaymentHeader) {
    console.log("🛑 No X-PAYMENT header — enforcing payment via middleware");

    const monetizationConfig = {
      [`/api/proxy/${serverId}/${tool}`]: {
        price: {
          amount: toolConfig.price,
          asset: {
            address: toolConfig.asset,
            decimals: 6,
            eip712: {
              name: "USDC",
              version: "2",
            },
          },
        },
        network: _network as Network,
        config: {
          description: `Access to ${tool} on ${serverConfig.serverName}`,
          mimeType: "application/json",
          maxTimeoutSeconds: 300,
        },
      },
    };

    const mw = paymentMiddleware(
      serverConfig.recipient as `0x${string}`,
      monetizationConfig,
      { url: facilitatorUrl }
    );
    console.log("⚙️ Payment middleware instantiated");

    const monetizationResult = await mw(freshRequest);
    console.log("💸 Payment middleware result:", monetizationResult);

    if (monetizationResult.status !== 200) {
      console.log("❌ Payment failed");
      return monetizationResult;
    }
  } else {
    console.log("✅ X-PAYMENT header present — bypassing middleware");
  }

  // Forward request to upstream server
  const forwardHeaders: Record<string, string> = {
    "Content-Type": "application/json",
  };

  const userAgent = req.headers.get("user-agent");
  if (userAgent) {
    forwardHeaders["User-Agent"] = userAgent;
  }
  console.log("✅ Parsed body:", parsedBody);


  console.log(JSON.stringify({
    tool,
    input: parsedBody.input,
  }))
  console.log(`📤 Forwarding request to ${serverConfig.serverUri}/${tool}`);
  console.log(`📤 Forwarding request to ${serverConfig.serverUri}/${tool}`);
  const response = await fetch(`${serverConfig.serverUri}/${tool}`, {
  method: "POST",
  headers: forwardHeaders,
  body: JSON.stringify({
    tool: "weather",
    input: {
      text: "Hello MCP!"
    }
  }),
});



  console.log(`📥 Upstream response status: ${response.status}`);

  if (!response.ok) {
    const errorText = await response.text();
    console.error(`❌ Upstream server error: ${response.status} ${response.statusText}`, errorText);
    return NextResponse.json(
      { error: `Upstream server error: ${response.status}`, details: errorText },
      { status: response.status }
    );
  }

  const result = await response.json();
  console.log("✅ Final upstream result:", result);
  return NextResponse.json(result);
}
