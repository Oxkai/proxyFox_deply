import { NextRequest, NextResponse } from "next/server";
import { paymentMiddleware, Network } from "x402-next";
import fs from "fs";
import path from "path";
import { baseSepolia } from "viem/chains";

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

  // Get headers for both middleware and forwarding
  const requestHeaders: Record<string, string> = {
    "Content-Type": "application/json",
    "Content-Length": new Blob([bodyText]).size.toString(),
  };

  // Forward optional headers
  const authorization = req.headers.get("authorization");
  if (authorization) requestHeaders["Authorization"] = authorization;

  const userAgent = req.headers.get("user-agent");
  if (userAgent) requestHeaders["User-Agent"] = userAgent;

  const xForwardedFor = req.headers.get("x-forwarded-for");
  if (xForwardedFor) requestHeaders["X-Forwarded-For"] = xForwardedFor;

  const xPayment = req.headers.get("x-payment");
  if (xPayment) requestHeaders["X-PAYMENT"] = xPayment;

  if (xPayment) {
    try {
      const decodedProof = JSON.parse(
        Buffer.from(xPayment, "base64").toString("utf-8")
      );
      console.log("✅ Decoded X-PAYMENT proof:", decodedProof);

      // Optional expiry check (maxTimeoutSeconds = 300)
      const maxTimeoutSeconds = 300;
      const now = Date.now();
      const expiry = decodedProof.timestamp + maxTimeoutSeconds * 1000;

      if (now > expiry) {
        console.log(
          `⚠️ Payment proof expired. Now: ${now}, Proof Expiry: ${expiry} (diff: ${
            (now - expiry) / 1000
          }s)`
        );
      } else {
        console.log(
          `✅ Payment proof valid. Expires in ${(expiry - now) / 1000}s`
        );
      }
    } catch (err) {
      console.error("❌ Failed to decode X-PAYMENT proof:", err);
    }
  } else {
    console.log("❌ No X-PAYMENT header received.");
  }

  console.log("📜 Final request headers:", requestHeaders);

  // Create fresh request with all headers including X-PAYMENT
  const freshRequest = new NextRequest(req.url, {
    method: req.method,
    headers: requestHeaders,
    body: bodyText,
  });

  console.log("📜 X-PAYMENT header in fresh request:", freshRequest.headers.get("x-payment"));
  console.log("📨 Created fresh NextRequest for payment middleware");

  const monetizationConfig = {
    [`/api/proxy/${serverId}/${tool}`]: {
      price: toolConfig.price,
      network: _network as Network,
      config: {
        description: `Access to ${tool} on ${serverConfig.serverName}`,
        mimeType: "application/json",
        maxTimeoutSeconds: 300,
      },
    },
  };
  console.log("💰 Monetization config prepared:", monetizationConfig);

  const mw = paymentMiddleware(
    serverConfig.recipient as `0x${string}`,
    monetizationConfig,
    {
      url: facilitatorUrl,
    }
  );
  console.log("⚙️ Payment middleware instantiated");

  try {
    console.log("🚀 Running payment middleware");
    // CRITICAL FIX: Pass freshRequest instead of req
    const monetizationResult = await mw(freshRequest);
    console.log("💸 Payment middleware result:", monetizationResult);

    if (monetizationResult.status !== 200) {
      console.log("❌ Payment failed");
      return monetizationResult;
    }

    const forwardHeaders: Record<string, string> = {
      "Content-Type": "application/json",
    };
    if (userAgent) {
      forwardHeaders["User-Agent"] = userAgent;
    }

    console.log(`📤 Forwarding request to ${serverConfig.serverUri}/tool/${tool}`);
    const response = await fetch(`${serverConfig.serverUri}/tool/${tool}`, {
      method: "POST",
      headers: forwardHeaders,
      body: JSON.stringify(parsedBody),
    });

    console.log(`📥 Upstream response status: ${response.status}`);

    if (!response.ok) {
      const errorText = await response.text();
      console.error(`❌ Upstream server error: ${response.status} ${response.statusText}`, errorText);
      return NextResponse.json(
        {
          error: `Upstream server error: ${response.status}`,
          details: errorText,
        },
        { status: response.status }
      );
    }

    const result = await response.json();
    console.log("✅ Final upstream result:", result);
    return NextResponse.json(result);

  } catch (err) {
    console.error("❌ Error in monetized proxy:", err);

    if (err instanceof TypeError && err.message.includes("fetch failed")) {
      return NextResponse.json(
        {
          error: "Failed to process payment or connect to upstream server",
          details: err.message,
        },
        { status: 500 }
      );
    }

    if (err instanceof SyntaxError) {
      return NextResponse.json(
        {
          error: "Invalid response from upstream server",
          details: err.message,
        },
        { status: 502 }
      );
    }

    return NextResponse.json(
      {
        error: "Internal server error",
        details: err instanceof Error ? err.message : String(err),
      },
      { status: 500 }
    );
  }
}