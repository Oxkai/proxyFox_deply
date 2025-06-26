import express from "express";
import bodyParser from "body-parser";
import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { StdioServerTransport } from "@modelcontextprotocol/sdk/server/stdio.js";
import { z } from "zod";
import fs from "fs/promises";
import path from "path";
import crypto from "crypto";

// ===== TOOL DEFINITIONS =====

const weatherTool = {
  name: "weather",
  description: "Get weather information for a location",
  inputSchema: z.object({
    location: z.string().min(1, "Location is required"),
    units: z.enum(["celsius", "fahrenheit"]).default("celsius")
  }),
  outputSchema: z.object({
    location: z.string(),
    temperature: z.number(),
    condition: z.string(),
    humidity: z.number(),
    windSpeed: z.number(),
    units: z.string()
  }),
  handler: async ({ input }) => {
    console.log(`Weather requested for: ${input.location}`);
    
    // Simulate API call with random but realistic data
    const conditions = ["Sunny", "Cloudy", "Rainy", "Partly Cloudy", "Stormy", "Foggy"];
    const baseTemp = input.units === "fahrenheit" ? 70 : 20;
    const tempVariation = input.units === "fahrenheit" ? 30 : 15;
    
    return {
      location: input.location,
      temperature: Math.round(baseTemp + (Math.random() * tempVariation - tempVariation/2)),
      condition: conditions[Math.floor(Math.random() * conditions.length)],
      humidity: Math.round(Math.random() * 100),
      windSpeed: Math.round(Math.random() * 25),
      units: input.units
    };
  }
};

const calculateTool = {
  name: "calculate",
  description: "Perform mathematical calculations with support for complex expressions",
  inputSchema: z.object({
    expression: z.string().min(1, "Expression is required"),
    precision: z.number().min(0).max(10).default(2)
  }),
  outputSchema: z.object({
    expression: z.string(),
    result: z.number(),
    formatted: z.string()
  }),
  handler: async ({ input }) => {
    console.log(`Calculating: ${input.expression}`);
    
    try {
      // Simple and safe expression evaluation (in production, use a proper math parser)
      const sanitized = input.expression.replace(/[^0-9+\-*/().\s]/g, '');
      if (sanitized !== input.expression) {
        throw new Error("Invalid characters in expression");
      }
      
      const result = Function(`"use strict"; return (${sanitized})`)();
      
      if (typeof result !== 'number' || !isFinite(result)) {
        throw new Error("Invalid calculation result");
      }
      
      return {
        expression: input.expression,
        result: result,
        formatted: result.toFixed(input.precision)
      };
    } catch (error) {
      throw new Error(`Calculation failed: ${error.message}`);
    }
  }
};

const textAnalysisTool = {
  name: "text_analysis",
  description: "Analyze text for various metrics and properties",
  inputSchema: z.object({
    text: z.string().min(1, "Text is required"),
    includeReadability: z.boolean().default(false)
  }),
  outputSchema: z.object({
    characterCount: z.number(),
    wordCount: z.number(),
    sentenceCount: z.number(),
    paragraphCount: z.number(),
    averageWordsPerSentence: z.number(),
    mostCommonWords: z.array(z.object({
      word: z.string(),
      count: z.number()
    })),
    readabilityScore: z.number().optional()
  }),
  handler: async ({ input }) => {
    console.log(`Analyzing text of length: ${input.text.length}`);
    
    const text = input.text.trim();
    const words = text.toLowerCase().match(/\b\w+\b/g) || [];
    const sentences = text.split(/[.!?]+/).filter(s => s.trim().length > 0);
    const paragraphs = text.split(/\n\s*\n/).filter(p => p.trim().length > 0);
    
    // Count word frequency
    const wordFreq = {};
    words.forEach(word => {
      wordFreq[word] = (wordFreq[word] || 0) + 1;
    });
    
    const mostCommonWords = Object.entries(wordFreq)
      .sort(([,a], [,b]) => b - a)
      .slice(0, 5)
      .map(([word, count]) => ({ word, count }));
    
    // Simple readability score (Flesch-like)
    let readabilityScore;
    if (input.includeReadability && sentences.length > 0) {
      const avgWordsPerSentence = words.length / sentences.length;
      const avgSyllablesPerWord = words.reduce((sum, word) => {
        return sum + Math.max(1, word.length / 3); // Rough syllable estimate
      }, 0) / words.length;
      
      readabilityScore = Math.max(0, Math.min(100, 
        206.835 - (1.015 * avgWordsPerSentence) - (84.6 * avgSyllablesPerWord)
      ));
    }
    
    return {
      characterCount: text.length,
      wordCount: words.length,
      sentenceCount: sentences.length,
      paragraphCount: paragraphs.length,
      averageWordsPerSentence: sentences.length > 0 ? words.length / sentences.length : 0,
      mostCommonWords,
      ...(readabilityScore !== undefined && { readabilityScore: Math.round(readabilityScore) })
    };
  }
};

const hashTool = {
  name: "hash",
  description: "Generate cryptographic hashes for text or data",
  inputSchema: z.object({
    data: z.string().min(1, "Data is required"),
    algorithm: z.enum(["md5", "sha1", "sha256", "sha512"]).default("sha256"),
    encoding: z.enum(["hex", "base64"]).default("hex")
  }),
  outputSchema: z.object({
    original: z.string(),
    algorithm: z.string(),
    hash: z.string(),
    encoding: z.string()
  }),
  handler: async ({ input }) => {
    console.log(`Generating ${input.algorithm} hash`);
    
    const hash = crypto.createHash(input.algorithm);
    hash.update(input.data);
    const result = hash.digest(input.encoding);
    
    return {
      original: input.data,
      algorithm: input.algorithm,
      hash: result,
      encoding: input.encoding
    };
  }
};

const uuidTool = {
  name: "uuid",
  description: "Generate UUIDs in various formats",
  inputSchema: z.object({
    version: z.enum(["v4"]).default("v4"),
    count: z.number().min(1).max(100).default(1),
    format: z.enum(["standard", "compact", "uppercase"]).default("standard")
  }),
  outputSchema: z.object({
    uuids: z.array(z.string()),
    version: z.string(),
    format: z.string()
  }),
  handler: async ({ input }) => {
    console.log(`Generating ${input.count} UUID(s)`);
    
    const uuids = [];
    for (let i = 0; i < input.count; i++) {
      let uuid = crypto.randomUUID();
      
      switch (input.format) {
        case "compact":
          uuid = uuid.replace(/-/g, '');
          break;
        case "uppercase":
          uuid = uuid.toUpperCase();
          break;
      }
      
      uuids.push(uuid);
    }
    
    return {
      uuids,
      version: input.version,
      format: input.format
    };
  }
};

const base64Tool = {
  name: "base64",
  description: "Encode or decode base64 data",
  inputSchema: z.object({
    data: z.string().min(1, "Data is required"),
    operation: z.enum(["encode", "decode"]),
    urlSafe: z.boolean().default(false)
  }),
  outputSchema: z.object({
    original: z.string(),
    result: z.string(),
    operation: z.string()
  }),
  handler: async ({ input }) => {
    console.log(`Base64 ${input.operation} operation`);
    
    try {
      let result;
      
      if (input.operation === "encode") {
        result = Buffer.from(input.data, 'utf8').toString('base64');
        if (input.urlSafe) {
          result = result.replace(/\+/g, '-').replace(/\//g, '_').replace(/=/g, '');
        }
      } else {
        let data = input.data;
        if (input.urlSafe) {
          data = data.replace(/-/g, '+').replace(/_/g, '/');
          while (data.length % 4) {
            data += '=';
          }
        }
        result = Buffer.from(data, 'base64').toString('utf8');
      }
      
      return {
        original: input.data,
        result,
        operation: input.operation
      };
    } catch (error) {
      throw new Error(`Base64 ${input.operation} failed: ${error.message}`);
    }
  }
};

const timestampTool = {
  name: "timestamp",
  description: "Work with timestamps and date conversions",
  inputSchema: z.object({
    operation: z.enum(["current", "parse", "format"]),
    input: z.string().optional(),
    format: z.string().default("ISO"),
    timezone: z.string().default("UTC")
  }),
  outputSchema: z.object({
    timestamp: z.number(),
    formatted: z.string(),
    timezone: z.string(),
    operation: z.string()
  }),
  handler: async ({ input }) => {
    console.log(`Timestamp operation: ${input.operation}`);
    
    let date;
    
    switch (input.operation) {
      case "current":
        date = new Date();
        break;
      case "parse":
        if (!input.input) throw new Error("Input required for parse operation");
        date = new Date(input.input);
        if (isNaN(date.getTime())) throw new Error("Invalid date format");
        break;
      case "format":
        if (!input.input) throw new Error("Input required for format operation");
        const timestamp = parseInt(input.input);
        if (isNaN(timestamp)) throw new Error("Invalid timestamp");
        date = new Date(timestamp * 1000);
        break;
      default:
        throw new Error("Invalid operation");
    }
    
    const timestamp = Math.floor(date.getTime() / 1000);
    let formatted;
    
    switch (input.format.toLowerCase()) {
      case "iso":
        formatted = date.toISOString();
        break;
      case "unix":
        formatted = timestamp.toString();
        break;
      case "readable":
        formatted = date.toLocaleString();
        break;
      default:
        formatted = date.toISOString();
    }
    
    return {
      timestamp,
      formatted,
      timezone: input.timezone,
      operation: input.operation
    };
  }
};

const jsonTool = {
  name: "json",
  description: "Validate, format, and manipulate JSON data",
  inputSchema: z.object({
    data: z.string().min(1, "JSON data is required"),
    operation: z.enum(["validate", "format", "minify", "extract"]),
    path: z.string().optional(),
    indent: z.number().min(0).max(8).default(2)
  }),
  outputSchema: z.object({
    valid: z.boolean(),
    result: z.string(),
    operation: z.string(),
    error: z.string().optional()
  }),
  handler: async ({ input }) => {
    console.log(`JSON operation: ${input.operation}`);
    
    try {
      const parsed = JSON.parse(input.data);
      let result;
      
      switch (input.operation) {
        case "validate":
          result = "Valid JSON";
          break;
        case "format":
          result = JSON.stringify(parsed, null, input.indent);
          break;
        case "minify":
          result = JSON.stringify(parsed);
          break;
        case "extract":
          if (!input.path) throw new Error("Path required for extract operation");
          const pathParts = input.path.split('.');
          let extracted = parsed;
          for (const part of pathParts) {
            if (extracted && typeof extracted === 'object') {
              extracted = extracted[part];
            } else {
              throw new Error(`Path not found: ${input.path}`);
            }
          }
          result = JSON.stringify(extracted, null, input.indent);
          break;
      }
      
      return {
        valid: true,
        result,
        operation: input.operation
      };
    } catch (error) {
      return {
        valid: false,
        result: input.data,
        operation: input.operation,
        error: error.message
      };
    }
  }
};

// ===== TOOL REGISTRY =====

const tools = {
  weather: weatherTool,
  calculate: calculateTool,
  text_analysis: textAnalysisTool,
  hash: hashTool,
  uuid: uuidTool,
  base64: base64Tool,
  timestamp: timestampTool,
  json: jsonTool
};

// ===== MCP SERVER SETUP =====

const mcpServer = new McpServer({
  transport: new StdioServerTransport(),
  tools: tools,
});

// ===== EXPRESS HTTP SERVER SETUP =====

const app = express();

// Middleware
app.use(bodyParser.json({ limit: '10mb' }));
app.use(bodyParser.urlencoded({ extended: true, limit: '10mb' }));

// CORS middleware
app.use((req, res, next) => {
  res.setHeader("Access-Control-Allow-Origin", "*");
  res.setHeader("Access-Control-Allow-Methods", "GET, POST, OPTIONS, PUT, DELETE");
  res.setHeader("Access-Control-Allow-Headers", "Content-Type, Authorization");
  
  if (req.method === 'OPTIONS') {
    res.sendStatus(200);
    return;
  }
  
  next();
});

// Logging middleware
app.use((req, res, next) => {
  console.log(`${new Date().toISOString()} - ${req.method} ${req.path}`);
  next();
});

// ===== API ROUTES =====

// Health check endpoint
app.get("/health", (req, res) => {
  res.json({ 
    status: "healthy", 
    timestamp: new Date().toISOString(),
    uptime: process.uptime(),
    tools: Object.keys(tools).length
  });
});

// List all available tools
app.get("/tools", (req, res) => {
  const toolList = Object.entries(tools).map(([name, tool]) => ({
    name,
    description: tool.description,
    inputSchema: tool.inputSchema._def,
    outputSchema: tool.outputSchema._def
  }));
  
  res.json({ 
    tools: toolList,
    count: toolList.length 
  });
});

// Get specific tool information
app.get("/tools/:toolName", (req, res) => {
  const { toolName } = req.params;
  const tool = tools[toolName];
  
  if (!tool) {
    return res.status(404).json({ 
      error: `Tool '${toolName}' not found`,
      available: Object.keys(tools)
    });
  }
  
  res.json({
    name: toolName,
    description: tool.description,
    inputSchema: tool.inputSchema._def,
    outputSchema: tool.outputSchema._def
  });
});

// Execute a tool
app.post("/execute", async (req, res) => {
  const startTime = Date.now();
  
  try {
    const { tool: toolName, input } = req.body;
    
    if (!toolName) {
      return res.status(400).json({ error: "Tool name is required" });
    }
    
    const tool = tools[toolName];
    if (!tool) {
      return res.status(404).json({ 
        error: `Tool '${toolName}' not found`,
        available: Object.keys(tools)
      });
    }
    
    // Validate input
    const parsedInput = tool.inputSchema.parse(input || {});
    
    // Execute tool
    const result = await tool.handler({ input: parsedInput });
    
    // Validate output
    const parsedOutput = tool.outputSchema.parse(result);
    
    const executionTime = Date.now() - startTime;
    
    res.json({ 
      success: true,
      tool: toolName,
      input: parsedInput,
      output: parsedOutput,
      executionTime: `${executionTime}ms`
    });
    
  } catch (error) {
    const executionTime = Date.now() - startTime;
    
    console.error("Tool execution error:", error);
    
    if (error.name === 'ZodError') {
      return res.status(400).json({ 
        error: "Input validation failed",
        details: error.errors,
        executionTime: `${executionTime}ms`
      });
    }
    
    res.status(500).json({ 
      error: "Tool execution failed",
      details: error.message,
      executionTime: `${executionTime}ms`
    });
  }
});

// Batch execute multiple tools
app.post("/batch", async (req, res) => {
  const startTime = Date.now();
  
  try {
    const { operations } = req.body;
    
    if (!Array.isArray(operations)) {
      return res.status(400).json({ error: "Operations must be an array" });
    }
    
    if (operations.length > 10) {
      return res.status(400).json({ error: "Maximum 10 operations per batch" });
    }
    
    const results = [];
    
    for (let i = 0; i < operations.length; i++) {
      const { tool: toolName, input, id } = operations[i];
      
      try {
        const tool = tools[toolName];
        if (!tool) {
          results.push({
            id: id || i,
            success: false,
            error: `Tool '${toolName}' not found`
          });
          continue;
        }
        
        const parsedInput = tool.inputSchema.parse(input || {});
        const result = await tool.handler({ input: parsedInput });
        const parsedOutput = tool.outputSchema.parse(result);
        
        results.push({
          id: id || i,
          success: true,
          tool: toolName,
          output: parsedOutput
        });
        
      } catch (error) {
        results.push({
          id: id || i,
          success: false,
          tool: toolName,
          error: error.message
        });
      }
    }
    
    const executionTime = Date.now() - startTime;
    
    res.json({
      results,
      total: operations.length,
      successful: results.filter(r => r.success).length,
      failed: results.filter(r => !r.success).length,
      executionTime: `${executionTime}ms`
    });
    
  } catch (error) {
    const executionTime = Date.now() - startTime;
    console.error("Batch execution error:", error);
    
    res.status(500).json({ 
      error: "Batch execution failed",
      details: error.message,
      executionTime: `${executionTime}ms`
    });
  }
});

// Error handling middleware
app.use((err, req, res, next) => {
  console.error("Unhandled error:", err);
  res.status(500).json({ 
    error: "Internal server error",
    details: err.message
  });
});

// 404 handler
app.use((req, res) => {
  res.status(404).json({ 
    error: "Endpoint not found",
    available: [
      "GET /health",
      "GET /tools",
      "GET /tools/:toolName",
      "POST /execute",
      "POST /batch"
    ]
  });
});

// ===== SERVER STARTUP =====

const PORT = process.env.PORT || 8000;

app.listen(PORT, () => {
  console.log("🚀 Advanced MCP Server Started");
  console.log(`🟢 HTTP API listening at http://localhost:${PORT}`);
  console.log("\n📚 Available endpoints:");
  console.log(`   GET  /health              - Server health check`);
  console.log(`   GET  /tools               - List all tools`);
  console.log(`   GET  /tools/:name         - Get tool details`);
  console.log(`   POST /execute             - Execute a single tool`);  
  console.log(`   POST /batch               - Execute multiple tools`);
  console.log("\n🛠️  Available tools:");
  Object.entries(tools).forEach(([name, tool]) => {
    console.log(`   • ${name.padEnd(15)} - ${tool.description}`);
  });
  console.log(`\n💡 Example usage:`);
  console.log(`   curl -X POST http://localhost:${PORT}/execute \\`);
  console.log(`        -H "Content-Type: application/json" \\`);
  console.log(`        -d '{"tool":"weather","input":{"location":"New York"}}'`);
});

// Graceful shutdown
process.on('SIGINT', () => {
  console.log('\n🛑 Shutting down server...');
  process.exit(0);
});

process.on('SIGTERM', () => {
  console.log('\n🛑 Shutting down server...');
  process.exit(0);
});