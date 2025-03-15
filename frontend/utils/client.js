import { createPublicClient, http } from 'viem';
import { hardhat, sepolia } from 'viem/chains';
const RPC = process.env.SEPOLIA_RPC_URL || "";

// export const publicClient = createPublicClient({
//   chain: hardhat,
//   transport: http(),
// });

export const publicClient = createPublicClient({
  chain: sepolia,
  transport: http(RPC),
})
