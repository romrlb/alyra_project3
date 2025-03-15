'use client';
import { useState, useEffect } from 'react';
import { VOTING_CONTRACT_ADDRESS, VOTING_CONTRACT_ABI } from '@/constants';
import { useReadContract, useWriteContract, useAccount, useWaitForTransactionReceipt } from 'wagmi';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import AlertMessage from '../shared/AlertMessage';
import { Badge } from '@/components/ui/badge';
import { publicClient } from '@/utils/client';
import { parseAbiItem } from 'viem';

const Proposals = ({ isOwner }) => {
  const { address } = useAccount();
  const [isVoter, setIsVoter] = useState(false);
  const [proposals, setProposals] = useState([]);
  const [proposalInput, setProposalInput] = useState('');
  const [isLoading, setIsLoading] = useState(true);
  const [transactionStatus, setTransactionStatus] = useState(null); // Ajoutez cet état

  // Lire le statut actuel du workflow
  const { data: workflowStatus } = useReadContract({
    address: VOTING_CONTRACT_ADDRESS,
    abi: VOTING_CONTRACT_ABI,
    functionName: 'workflowStatus',
    account: address
  });

  // Vérifier si l'utilisateur est un votant
  const { data: voterData } = useReadContract({
    address: VOTING_CONTRACT_ADDRESS,
    abi: VOTING_CONTRACT_ABI,
    functionName: 'getVoter',
    args: [address],
    account: address
  });

  // eléments BC nécessaires à l'enregistement des propositions
  const { data: hash, error, isSuccess, isPending, writeContract } = useWriteContract()

  // Ajouter le hook pour attendre la transaction
  const { isLoading: isConfirming } = useWaitForTransactionReceipt({
    hash,
    onSuccess: async () => {
      setTransactionStatus({
        type: 'success',
        message: "Proposition ajoutée avec succès!"
      });
      await getProposals();
      setProposalInput('');
    },
  });

  // Gérer la soumission de la proposition
  const handleProposal = async () => { 
    try {
      setTransactionStatus({
        type: 'info',
        message: "Transaction en cours de traitement..."
      });
      
      await writeContract({
        address: VOTING_CONTRACT_ADDRESS,
        abi: VOTING_CONTRACT_ABI,
        functionName: 'addProposal',
        args: [proposalInput]
      });

    } catch(error) {
      console.error("Erreur lors de la soumission de la proposition:", error);
      setTransactionStatus({
        type: 'error',
        message: "Erreur lors de la soumission de la proposition"
      });
    }
  };

  // Récupérer les propositions
  const getProposals = async() => {
    try {
      setIsLoading(true);
      const proposalEvents = await publicClient.getLogs({
        address: VOTING_CONTRACT_ADDRESS,
        event: parseAbiItem('event ProposalRegistered(uint proposalId)'),
        fromBlock: process.env.NEXT_PUBLIC_FROM_BLOCK ? BigInt(process.env.NEXT_PUBLIC_FROM_BLOCK) : 0n,
        toBlock: 'latest'
      });

      const detailedProposals = await Promise.all(
        proposalEvents.map(async (event) => {
          const block = await publicClient.getBlock({ blockHash: event.blockHash });
          const transaction = await publicClient.getTransaction({ hash: event.transactionHash });
          
          const proposal = await publicClient.readContract({
            address: VOTING_CONTRACT_ADDRESS,
            abi: VOTING_CONTRACT_ABI,
            functionName: 'getOneProposal',
            args: [event.args.proposalId]
          });

          return {
            proposalId: event.args.proposalId,
            description: proposal.description,
            blockTimestamp: Number(block.timestamp),
            sender: transaction.from
          };
        })
      );
      setProposals(detailedProposals);
    } catch (error) {
      console.error("Erreur lors de la récupération des propositions:", error);
    } finally {
      setIsLoading(false);
    }
  };

  // Effet pour récupérer les propositions
  useEffect(() => {
    if (address) {
      getProposals();
    }
  }, [address]);

  // Effet pour vérifier si l'utilisateur est un votant
  useEffect(() => {
    if (voterData) {
      setIsVoter(voterData.isRegistered);
    }
  }, [voterData]);

  // Gestion des échecs ou succès lors de la soumission de la proposition 
  useEffect(() => {
    if (error) {
      setTransactionStatus({
        type: 'error',
        message: "Erreur lors de la soumission de la proposition"
      });
    }
    else  if (isSuccess) {
      setTransactionStatus({
        type: 'success',
        message: "Proposition ajoutée avec succès!"
      });
    }
  }, [error, isSuccess]);

  // Fonction pour soumettre une proposition
  const submitProposal = (e) => {
    e.preventDefault();
    handleProposal();
  };

  // Déterminer le statut d'affichage en fonction du workflow
  const getDisplayStatus = () => {
    if (workflowStatus === undefined) return -1;
    return Number(workflowStatus);
  };

  const displayStatus = getDisplayStatus();

  return (
    <div>
      <h2 className="text-xl sm:text-2xl font-bold mb-4 mt-6">Propositions</h2>
      
      {displayStatus === -1 ? (
        <p className="text-gray-500">Chargement du statut...</p>
      ) : displayStatus === 0 ? (
        <AlertMessage 
          type="warning"
          title="Information"
          message="L'enregistrement des propositions n'a pas encore commencé."
        />
      ) : displayStatus > 0 ? (
        <div>
          {displayStatus === 1 && isVoter && (
            <div className="mb-6">
              {transactionStatus && (
                <div className="mb-4">
                  <AlertMessage 
                    type={transactionStatus.type}
                    title={
                      transactionStatus.type === 'success' ? "Succès" : 
                      transactionStatus.type === 'error' ? "Erreur" :
                      "Information"  // Cas par défaut pour 'info'
                    }
                    message={transactionStatus.message}
                  />
                </div>
              )}
              <div className="p-4 bg-gray-100 rounded-lg">
                <h3 className="text-lg font-semibold mb-2">Soumettre une proposition</h3>
                <form onSubmit={submitProposal} className="flex flex-col space-y-4">
                  <Input
                    type="text"
                    placeholder="Entrez votre proposition"
                    value={proposalInput}
                    onChange={(e) => setProposalInput(e.target.value)}
                    required
                    className="w-full"
                  />
                  <Button 
                    type="submit" 
                    className="bg-blue-600 hover:bg-blue-700"
                    disabled={!proposalInput.trim() || isPending}
                  >
                    {isPending ? 'Transaction en cours...' : 'Soumettre'}
                  </Button>
                </form>
              </div>
            </div>
          )}
          
          {displayStatus === 1 && !isVoter && (
            <AlertMessage 
              type="warning"
              title="Accès limité"
              message="Seuls les votants enregistrés peuvent soumettre des propositions."
            />
          )}
          
          {displayStatus > 1 && (
            <AlertMessage 
              type="info"
              title="Information"
              message="La période de soumission des propositions est terminée."
            />
          )}
          
          <div className="mt-6">
            <h3 className="text-lg font-semibold mb-4">Liste des propositions</h3>
            
            {isLoading ? (
              <div className="p-4 text-center">
                <p className="text-gray-500">Chargement des propositions...</p>
              </div>
            ) : proposals && proposals.length > 0 ? (
              <div className="space-y-4">
                {proposals.map((proposal, index) => (
                  <div 
                    key={proposal.proposalId.toString()} 
                    className="p-4 mb-3 border rounded-lg shadow-sm hover:shadow-md transition-shadow bg-white dark:bg-gray-800"
                  >
                    <div className="flex justify-between items-center mb-2">
                      <Badge 
                        variant="outline" 
                        className="bg-purple-100 text-purple-700 border-purple-200"
                      >
                        Proposition #{proposal.proposalId.toString()}
                      </Badge><span className="items-center text-lg font-semibold mb-4">{proposal.description}</span>
                    </div>
                    <div className="flex justify-between items-center mt-3">
                      <span className="text-xs text-gray-500 dark:text-gray-400">
                        Proposé par : {proposal.sender}
                      </span>
                      <span className="text-xs text-gray-500 dark:text-gray-400">
                        le : {new Date(proposal.blockTimestamp * 1000).toLocaleString()}
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="p-4 text-center">
                <p className="text-gray-500">Aucune proposition n'a été soumise.</p>
              </div>
            )}
          </div>
        </div>
      ) : null}
    </div>
  );
};

export default Proposals;