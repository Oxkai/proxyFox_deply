import { NextRequest, NextResponse } from "next/server";
import { monetizedServers } from "@/lib/monetizationData";
import { paymentMiddleware, Network, Resource } from "x402-next";


const facilitatorUrl = "https://x402.org/facilitator";
const _network = "base-sepolia"



export async function POST(req: NextRequest, { params }: { params: { serverId: string, tool: string } }) {
  const { serverId, tool } = params;

  const serverConfig = monetizedServers.find((s) => s.serverId === serverId);
  if (!serverConfig) {
    return NextResponse.json({ error: "Unknown server ID" }, { status: 404 });
  }

  const toolConfig = serverConfig.tools.find((t) => t.toolName === tool);
  if (!toolConfig) {
    return NextResponse.json({ error: "Unknown tool for this server" }, { status: 404 });
  }


  // 🔥 Apply payment check dynamically here
  const monetizationConfig = {
    [`/api/proxy/${serverId}/${tool}`]: {
      price: toolConfig.price,
      network: _network as Network,  // 👈 fix right here
      config: {
        description: `Access to ${tool} on ${serverId}`,
      },
    },
  };

const mw = paymentMiddleware(
    toolConfig.recipient as `0x${string}`,
    monetizationConfig,
    {
      url: facilitatorUrl,
    }
  );


  const monetizationResult = await mw(req);
  if (monetizationResult.status !== 200) {
    // If payment not verified, send the 402 or other response
    return monetizationResult;
  }

  // ✅ If payment ok, forward request to MCP server
  const body = await req.json();

  try {
    const response = await fetch(toolConfig.originalEndpoint, {
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
