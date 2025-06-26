import { ethers } from "ethers";

// 🔐 Hardcoded config (use this only for dev/testing)
const PRIVATE_KEY = "0xYOUR_PRIVATE_KEY_HERE";
const RPC_URL = "https://sepolia.base.org";

export async function sendPayment(
  payTo: string,
  amount: string,
  tokenAddress: string,
  rpcUrl: string = RPC_URL  // default to the hardcoded RPC URL
) {
  const provider = new ethers.JsonRpcProvider(rpcUrl);
  const signer = new ethers.Wallet(PRIVATE_KEY, provider);

  const token = new ethers.Contract(
    tokenAddress,
    ["function transfer(address to, uint256 amount) public returns (bool)"],
    signer
  );

  console.log(`🔄 Sending payment of ${amount} to ${payTo} on ${rpcUrl}`);
  const tx = await token.transfer(payTo, amount);
  await tx.wait();

  console.log(`✅ Payment sent. Tx hash: ${tx.hash}`);
  return tx.hash;
}
