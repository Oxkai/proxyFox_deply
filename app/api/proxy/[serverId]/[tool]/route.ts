import { NextRequest, NextResponse } from "next/server";
import { paymentMiddleware, Network } from "x402-next";
import fs from "fs";
import path from "path";

const facilitatorUrl = "https://x402.org/facilitator";
const _network = "base-sepolia";

// ✅ Function to read JSON config file
function getServerConfig() {
  const filePath = path.join(process.cwd(), "lib", "db.json");
  const jsonData = fs.readFileSync(filePath, "utf-8");
  return JSON.parse(jsonData);
}

export async function POST(req: NextRequest) {
  const pathnameParts = req.nextUrl.pathname.split("/");
  const serverId = pathnameParts[3];
  const tool = pathnameParts[4];

  // 📖 Load config JSON dynamically
  const monetizedServers = getServerConfig();

  const serverConfig = monetizedServers.find((s: any) => s.serverId === serverId);
  if (!serverConfig) {
    return NextResponse.json({ error: "Unknown server ID" }, { status: 404 });
  }

  const toolConfig = serverConfig.tools.find((t: any) => t.toolName === tool);
  if (!toolConfig) {
    return NextResponse.json({ error: "Unknown tool for this server" }, { status: 404 });
  }

  const monetizationConfig = {
    [`/api/proxy/${serverId}/${tool}`]: {
      price: toolConfig.price,
      network: _network as Network,
      config: {
        description: `Access to ${tool} on ${serverConfig.serverName}`,
      },
    },
  };

  const mw = paymentMiddleware(
    serverConfig.recipient as `0x${string}`,
    monetizationConfig,
    {
      url: facilitatorUrl,
    }
  );

  const monetizationResult = await mw(req);
  if (monetizationResult.status !== 200) {
    return monetizationResult;
  }

  const body = await req.json();

  try {
    const response = await fetch(`${serverConfig.serverUri}/tool/${tool}`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body),
    });

    const result = await response.json();
    return NextResponse.json(result);
  } catch (err) {
    console.error("Error forwarding request:", err);
    return NextResponse.json({ error: "Failed to forward request" }, { status: 500 });
  }
}
