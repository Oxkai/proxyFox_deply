# ProxyFox

## Table of Contents

* [Overview](#overview)
* [Architecture & Payment Flow](#architecture--payment-flow)
* [How x402 Works](#how-x402-works)
* [Frontend Wallet Integration](#frontend-wallet-integration)
* [Installation](#installation)
* [API Routes](#api-routes)
* [Example Monetized Endpoint](#example-monetized-endpoint)
* [Live Demo](#live-demo)
* [Integration with LLMs and Agents](#integration-with-llms-and-agents)

## Overview

ProxyFox is a Next.js (App Router) platform that lets developers **monetize their MCP (Model Context Protocol) server endpoints** using Coinbase’s new x402 payment standard. It generates proxy URLs that enforce per-request payments in USDC on the Base network. In practice, any client (user or AI agent) calling a protected endpoint must pay a small USDC fee before receiving the data. ProxyFox automates this flow by leveraging HTTP 402 responses and EIP-712 signatures. Under the hood, it uses Tailwind CSS for styling and is deployed on Vercel at [proxy-fox-deply.vercel.app](https://proxy-fox-deply.vercel.app).

The problem ProxyFox solves is enabling **instant, on-chain micropayments** for APIs and AI services without complex subscriptions or third-party payment redirects. By repurposing the HTTP 402 “Payment Required” status code, x402 embeds payment instructions directly in the web protocol. ProxyFox integrates this seamlessly: clients get a `402 Payment Required` with payment details when needed, sign the payment using EIP-712, and retry with the payment header attached. This makes monetization as easy as an ordinary API request.

## Architecture & Payment Flow

Below is a high-level ASCII diagram of the ProxyFox architecture and x402 payment flow. It shows how a client or AI agent interacts with ProxyFox and the underlying MCP server. The key steps are:

1. **Client Request:** The client sends an HTTP request to a ProxyFox API endpoint (e.g. a monetized `/api/proxy/...` route).
2. **Payment Challenge:** If the endpoint is protected, ProxyFox responds with `HTTP 402 Payment Required` and a JSON payload of payment instructions (amount, receiver address, token contract, network, expiry, nonce, etc.).
3. **Client Signs:** The client uses WalletKit to sign these instructions with EIP-712, creating an `X-PAYMENT` header (the signed payment payload).
4. **Retry with Payment:** The client retries the original request, now including the `X-PAYMENT` header.
5. **Verification & Settlement:** ProxyFox verifies the signature (usually via a Coinbase x402 facilitator), broadcasts the USDC transaction on Base, and waits for settlement.
6. **Fulfill & Respond:** Once paid, ProxyFox forwards the request to the actual MCP server endpoint, retrieves the data, and returns `200 OK` to the client. An `X-PAYMENT-RESPONSE` header is included, containing the on-chain transaction receipt for transparency.

```
Client/Agent         ProxyFox (Next.js)            MCP Server            Base Network
    |                    |                           |                    |
    | GET /api/proxy/... |                           |                    |
    |------------------->|                           |                    |
    |                    | 402 Payment Required (JSON with USDC payment info)  |
    |                    |<----------------------------------------------------|
    | [WalletKit/EIP-712 signs payment payload]        |                    |
    | GET /api/proxy/... + X-PAYMENT (signed payload)  |                    |
    |------------------->|                           |                    |
    |                    | verify signature & settle on Base (via x402 fac.)  |
    |                    |--------------------------->| (broadcast USDC tx) |
    |                    |                           |                    |
    |                    | forward to MCP server      |                    |
    |                    |--------------------------->|                    |
    |                    |                           |                    |
    |                    | 200 OK + X-PAYMENT-RESPONSE (receipt + data)       |
    |<-------------------|                           |                    |
```

This end-to-end flow is built on the x402 protocol and requires no external payment gateways. The HTTP layer itself carries the payment headers, so no OAuth or API keys are needed. ProxyFox simply enforces that each protected endpoint is paid per request.

## How x402 Works

ProxyFox relies on the **x402 protocol** (by Coinbase) for on-chain payments over HTTP. In summary:

* **HTTP 402 Payment Required:** When a client calls a paid endpoint without payment, the server (ProxyFox) returns `402 Payment Required`. The response body is a JSON **PaymentRequirements** object specifying how much to pay, which token (USDC), which chain (Base), the receiver address, an expiration time, and a unique nonce. This tells the client exactly *what* payment to authorize.

* **X-PAYMENT Header:** The client then constructs a matching payment payload and **signs** it using EIP-712 (Ethereum typed structured data). This signature proves the client authorizes the payment. The client retries the request, including a header `X-PAYMENT` whose value is the signed payment payload (including amount, asset, receiver, nonce, etc.). In other words, `X-PAYMENT` carries the encoded payment instructions and the cryptographic signature.

* **EIP-712 Signing:** Signing uses the Ethereum [EIP-712](https://eips.ethereum.org/EIPS/eip-712) standard. This creates a human-readable typed data structure for the payment, then hashes and signs it. The result is a secure signature bound to this specific request and nonce. This prevents replay attacks and ensures the on-chain transaction matches the server’s original payment requirement.

* **X-PAYMENT-RESPONSE Header:** Upon successful payment verification and settlement (via a facilitator service), ProxyFox completes the original request and responds with `200 OK`. It includes an `X-PAYMENT-RESPONSE` header containing the on-chain transaction receipt or metadata, so the client can confirm the payment. This final header provides transparency about the actual USDC transfer that took place.

This entire flow happens at the HTTP protocol layer, making payments as seamless as normal web requests. In practice, ProxyFox (or its middleware) handles sending the 402 challenge, verifying the incoming `X-PAYMENT`, and settling the payment on Base. The server does not need to manage accounts or store credit card data – it simply enforces that the correct stablecoin payment is attached to each request.




## Frontend Wallet Integration

The ProxyFox **frontend** uses Coinbase’s **CDP WalletKit** to manage user wallets and signing. WalletKit is an all-in-one smart wallet framework that lets apps create Ethereum smart wallets (with ERC-4337 account abstraction) without handling raw keys or gas fees. In ProxyFox, the user can connect or create a wallet via WalletKit (backed by the Coinbase Developer Platform). WalletKit automatically handles key management and can sponsor gas through a paymaster, so the user experience is smooth.

When the user (or agent) needs to pay, WalletKit provides the signing functions. It uses the user’s wallet on Base and signs the x402 payment payload with EIP-712 under the hood. In effect, WalletKit generates the `X-PAYMENT` header for the client securely. Because it uses Coinbase’s infrastructure, no private key is ever exposed to the browser. This integration means ProxyFox developers don’t have to implement wallet UIs or EIP-712 signing from scratch – WalletKit does it with just a few lines of code. The result is a seamless flow where the user simply confirms a payment in their wallet and ProxyFox handles the rest.

## Installation

To run ProxyFox locally:

1. **Clone the repository:**

   ```bash
   git clone https://github.com/Oxkai/ProxyFox
   cd ProxyFox
   ```

2. **Install dependencies:**

   ```bash
   npm install
   ```



3. **Run the development server:**

   ```bash
   npm run dev
   ```

   Open [http://localhost:3000](http://localhost:3000) in your browser. The app will hot-reload on changes.

ProxyFox requires **Node.js 18+**. It uses Next.js (App Router) and Tailwind CSS. Deployment is handled via Vercel (a `vercel.json` is included). The live instance is already deployed at [proxy-fox-deply.vercel.app](https://proxy-fox-deply.vercel.app).

## API Routes

ProxyFox exposes a dynamic API route at `/api/proxy/[...path]`. This route proxies incoming requests to your registered MCP server endpoints and enforces x402 payments. The URL path after `/api/proxy/` encodes the target server and path. For example, a request to:

```
GET /api/proxy/https/api.example.com/data?foo=bar
```

will proxy to `https://api.example.com/data?foo=bar`. In this setup you should have previously registered `api.example.com` as an MCP server with a set price per request. When the proxy handler receives the request, it checks for a valid payment. If no valid `X-PAYMENT` header is present, it returns `HTTP 402` with the payment requirements JSON. If a valid payment is attached, it forwards the request to the real MCP server and returns its response.

In summary:

* **Route format:** The path after `/api/proxy/` should include the protocol, host, and path of your MCP endpoint. E.g. `/api/proxy/https/api.example.com/foo`.
* **HTTP Method:** All methods (`GET`, `POST`, etc.) are supported. ProxyFox forwards the method and body to the target server.
* **Headers:** On a retried request, include `X-PAYMENT: <signed payload>` and any necessary auth headers. ProxyFox also returns `X-PAYMENT-RESPONSE` on success.
* **Protection:** Only MCP servers you have registered (with a price) are protected. Other requests can pass through normally or be rejected (configurable).

Internally, ProxyFox uses the **x402-next** middleware (a Next.js integration) and **x402-axios** client for handling the payment logic. This means you don’t have to write custom 402 logic in each handler: simply hitting `/api/proxy/...` will automatically trigger the x402 payment handshake when needed.

## Example Monetized Endpoint

Below is an example of how a monetized proxy endpoint works. Assume you have an MCP server at `https://api.example.com` with an endpoint `/greet` that costs 0.01 USDC per call. After registering this server in ProxyFox, you can call it via the proxy:

```bash
# 1) Initial request without payment:

# GET request
curl -i http://localhost:3000/api/proxy/61f1b4b7-d495-48dd-b333-f84bb4a09ab1-weather_broad

# POST request with data
curl -i -X POST \
  -H "Content-Type: application/json" \
  -d '{"location": "New York", "days": 5}' \
  http://localhost:3000/api/proxy/61f1b4b7-d495-48dd-b333-f84bb4a09ab1-weather_broad
```

ProxyFox will respond:

```
HTTP/1.1 402 Payment Required
Content-Type: application/json

{
  "paymentRequirement": [
    {
      "kind": {"exact": "base-mainnet"},
      "receiver": "0xYourWalletAddress",
      "amount": "10000000",
      "asset": "0xA0b86991c6218b36c1d19d4a2e9eb0ce3606eb48",
      "expiry": 1700000000,
      "nonce": "uuid-1234"
    }
  ]
}
```

This JSON tells the client to pay 0.01 USDC (10<sup>6</sup> USDC has 6 decimals) to `0xYourWalletAddress` on the Base chain (chain=base-mainnet) by the given expiry.

Next, the client uses WalletKit to sign this payment payload with EIP-712 and retries the request with the signature:

```bash
# 2) Retry with payment header (after signing):
# GET with payment header
curl -i -H "X-PAYMENT: {signedPaymentData}" \
  http://localhost:3000/api/proxy/61f1b4b7-d495-48dd-b333-f84bb4a09ab1-weather_broad

# POST with payment header
curl -i -X POST \
  -H "Content-Type: application/json" \
  -H "X-PAYMENT: {signedPaymentData}" \
  -d '{"location": "New York", "days": 5}' \
  http://localhost:3000/api/proxy/61f1b4b7-d495-48dd-b333-f84bb4a09ab1-weather_broad
```

ProxyFox will verify and settle the payment on-chain. If the payment is valid, it forwards the request to the MCP server and returns:

```
HTTP/1.1 200 OK
X-Payment-Response: {"txHash":"0xabc123...","status":"success"}
Content-Type: application/json

{
  "weather": {
    "location": "New York",
    "forecast": [...]
  }
}
```

Here, `X-PAYMENT-RESPONSE` contains the transaction receipt (e.g. the Base block hash), and the JSON body is the actual data from the MCP server. This shows a complete monetized call: the client paid in USDC and then received the premium API response in one seamless flow.

## Live Demo

You can try ProxyFox right now on Vercel at **[https://proxy-fox-deply.vercel.app](https://proxy-fox-deply.vercel.app)**. The live app allows you to register your own MCP server endpoints (enter the URL, set a price in USDC) and then it provides a proxy URL. Use your browser or tools like `curl` to hit the proxy URL and see the 402/payment flow in action. The demo is open for experimentation.

## Integration with LLMs and Agents

ProxyFox is built to integrate smoothly with AI-powered tools and agents. Recall that MCP (Model Context Protocol) is an open standard for connecting AI systems to data sources. With ProxyFox, any LLM or agent that supports MCP can call a ProxyFox endpoint just like any API. For example, an AI assistant (like Claude) can discover context via an MCP call, but the context endpoint can be wrapped by ProxyFox so that the assistant must pay per call. The assistant simply makes an HTTP request; ProxyFox returns 402, the assistant signs the payment (using an integrated wallet), retries, and then gets the data.

This enables **autonomous agents** to pay for information in real time. As Coinbase notes, “AI models dynamically discover, retrieve, and autonomously pay for context and tools” using x402 in the MCP ecosystem. Agent frameworks can use Coinbase’s x402 client libraries (e.g. [x402-axios](https://github.com/coinbase/x402) or \[x402-fetch]) to automate the handshake. In practice, this means a Claude agent or an in-browser agent can call ProxyFox endpoints and handle the `402 → signature → retry` loop programmatically.

ProxyFox’s design (standard HTTP with JSON and headers) makes it a natural fit for LLM/agent integration. No special plugins are needed – just normal HTTP calls. This unlocks powerful use cases: e.g. a Claude agent in a chatbot can fetch paid premium data via ProxyFox, paying in USDC on the fly, without any human in the loop. In short, ProxyFox extends the MCP vision by adding decentralized payments to AI data access, enabling truly agentic applications.

*References:* The x402 protocol is documented by Coinbase, and the MCP standard is described by Anthropic. For more on implementing x402 payments in Node/JS, see Coinbase’s x402 SDK and examples. ProxyFox leverages these standards so developers can focus on their data and pricing, not on payment plumbing.