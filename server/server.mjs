import express from "express";
import bodyParser from "body-parser";
import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { StdioServerTransport } from "@modelcontextprotocol/sdk/server/stdio.js";
import { z } from "zod";

// === Minimal Tool Definition ===

const weatherTool = {
  name: "weather",
  description: "Echoes back the input text",
  inputSchema: z.object({
    text: z.string().min(1, "Text is required")
  }),
  outputSchema: z.object({
    echoedText: z.string()
  }),
  handler: async ({ input }) => {
    console.log(`Echoing: ${input.text}`);
    return { echoedText: input.text };
  }
};

// === Tool Registry ===

const tools = { weather: weatherTool };

// === MCP Server Setup ===

const mcpServer = new McpServer({
  transport: new StdioServerTransport(),
  tools: tools
});

// === Express HTTP Server Setup ===

const app = express();
app.use(bodyParser.json());

// Health Check
app.get("/health", (req, res) => {
  res.json({ status: "healthy", timestamp: new Date().toISOString() });
});

// List tools
app.get("/tools", (req, res) => {
  res.json({
    tools: Object.keys(tools).map(name => ({
      name,
      description: tools[name].description
    }))
  });
});

// Execute tool
app.post("/weather", async (req, res) => {
  try {
    const { tool: toolName, input } = req.body;
    const tool = tools[toolName];
    if (!tool) {
      return res.status(404).json({ error: `Tool '${toolName}' not found` });
    }

    const parsedInput = tool.inputSchema.parse(input);
    const result = await tool.handler({ input: parsedInput });
    const parsedOutput = tool.outputSchema.parse(result);

    res.json({ success: true, tool: toolName, output: parsedOutput });
  } catch (error) {
    if (error.name === 'ZodError') {
      return res.status(400).json({ error: "Input validation failed", details: error.errors });
    }
    res.status(500).json({ error: error.message });
  }
});

// 404
app.use((req, res) => {
  res.status(404).json({ error: "Endpoint not found" });
});

// Start server
const PORT = process.env.PORT || 8000;
app.listen(PORT, () => {
  console.log(`🚀 Simple MCP Server running at http://localhost:${PORT}`);
  console.log(`🛠️ Available tools: ${Object.keys(tools).join(", ")}`);
});
