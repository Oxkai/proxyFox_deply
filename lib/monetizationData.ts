export type Network = "base-sepolia" | "base" | "avalanche-fuji" | "avalanche" | "iotex";

type MonetizedTool = {
  toolName: string;
  originalEndpoint: string;
  price: string;
  network: Network;
  recipient: `0x${string}`;
};

type MonetizedServer = {
  serverId: string;
  tools: MonetizedTool[];
};

export const monetizedServers = [
  {
    serverId: "local-mcp-server",
    tools: [
      {
        toolName: "weather",   // matches your tool name here
        originalEndpoint: "http://localhost:8000/weather",
        price: "$0.01",
        recipient: "0x5567D2FFdF5A9c0bBb0B79B8cD99a3a87C45dAFb"
      }
    ]
  },
 
];
