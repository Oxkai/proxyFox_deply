import { NextRequest, NextResponse } from "next/server";
import { v4 as uuidv4 } from "uuid";
import fs from "fs-extra";
import path from "path";

export async function POST(req: NextRequest) {
  const body = await req.json();

  const serverId = `${uuidv4()}-${body.serverName}`;

  if (
    !body.recipient ||
    !body.serverName ||
    !body.description ||
    !body.serverUri ||
    !Array.isArray(body.tools)
  ) {
    return NextResponse.json(
      { error: "Missing required fields" },
      { status: 400 }
    );
  }
  
  // Generate Monetized URI
  const monetizedUri = `http://localhost:3000/api/proxy/${serverId}`;

  const newConfig = {
    recipient: body.recipient,
    serverId,
    serverName: body.serverName,
    description: body.description,
    serverUri: body.serverUri,
    authEnabled: body.authEnabled,
    tools: body.tools,
    monetizedUri,
  };

  // Path to db.json
  const dbFilePath = path.resolve("db.json");

  // Read existing data or start with empty array
  const existing = (await fs.readJson(dbFilePath).catch(() => [])) as any[];

  // Add new config
  existing.push(newConfig);

  // Save back to db.json
  await fs.writeJson(dbFilePath, existing, { spaces: 2 });

  console.log("✔️ New config saved to db.json");

  return NextResponse.json({ monetizedUri });
}
