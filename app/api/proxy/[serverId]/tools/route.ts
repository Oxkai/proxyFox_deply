import { NextRequest, NextResponse } from "next/server";
import fs from "fs";
import path from "path";




interface ToolConfig {
  toolName: string;
  description: string;
  price: string;
  asset: string;
}

interface ServerConfig {
  recipient: string;
  serverId: string;
  serverName: string;
  description: string;
  serverUri: string;
  authEnabled: boolean;
  tools: ToolConfig[];
  monetizedUri: string;
}

function getServerConfig() {
  const filePath = path.join(process.cwd(), "lib", "db.json");
  const jsonData = fs.readFileSync(filePath, "utf-8");
  return JSON.parse(jsonData);
}

export async function GET(req: NextRequest) {
  const pathnameParts = req.nextUrl.pathname.split("/");
  const serverId = pathnameParts[3];

  const monetizedServers = getServerConfig();
  const serverConfig = monetizedServers.find((s: ServerConfig) => s.serverId === serverId);

  if (!serverConfig) {
    return NextResponse.json({ error: "Unknown server ID" }, { status: 404 });
  }

  try {
const response = await fetch(`${serverConfig.serverUri}/tools`, {
      method: "GET",
      headers: { "Content-Type": "application/json" },
    });

    const result = await response.json();

    // 👇 wrap it here
    return NextResponse.json({ tools: result });
  } catch (err) {
    console.error("Error forwarding GET request:", err);
    return NextResponse.json({ error: "Failed to forward request" }, { status: 500 });
  }
}
