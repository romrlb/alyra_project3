import { publicClient } from '@/utils/client'
import { parseAbiItem } from 'viem'
import {
  NEXT_PUBLIC_VOTING_CONTRACT_ADDRESS,
  VOTING_CONTRACT_ABI
} from '@/constants'

// Fonction pour récupérer toutes les propositions
export const getProposals = async address => {
  const proposalEvents = await publicClient.getLogs({
    address: process.env.NEXT_PUBLIC_VOTING_CONTRACT_ADDRESS,
    event: parseAbiItem('event ProposalRegistered(uint proposalId)'),
    fromBlock: process.env.NEXT_PUBLIC_FROM_BLOCK
      ? BigInt(process.env.NEXT_PUBLIC_FROM_BLOCK)
      : 0n,
    toBlock: 'latest'
  })

  const detailedProposals = await Promise.all(
    proposalEvents.map(async event => {
      const block = await publicClient.getBlock({
        blockHash: event.blockHash
      })

      const transaction = await publicClient.getTransaction({
        hash: event.transactionHash
      })

      const proposal = await publicClient.readContract({
        address: NEXT_PUBLIC_VOTING_CONTRACT_ADDRESS,
        abi: VOTING_CONTRACT_ABI,
        functionName: 'getOneProposal',
        args: [event.args.proposalId],
        account: address
      })

      return {
        proposalId: Number(event.args.proposalId),
        description: proposal.description,
        blockTimestamp: Number(block.timestamp),
        sender: transaction.from,
        voteCount: Number(proposal.voteCount)
      }
    })
  )

  return detailedProposals
}
