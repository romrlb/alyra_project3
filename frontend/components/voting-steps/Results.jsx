'use client';
import { useState, useEffect } from 'react';
import { VOTING_CONTRACT_ADDRESS, VOTING_CONTRACT_ABI } from '@/constants';
import { useReadContract, useAccount } from 'wagmi';
import AlertMessage from '../shared/AlertMessage';
import { getProposals } from '@/utils/votingUtils';
import { Badge } from '@/components/ui/badge';

const Results = ({ isOwner }) => {
  const { address } = useAccount();
  const [proposals, setProposals] = useState([]);
  const [winningProposalId, setWinningProposalId] = useState(null);
  const [isLoading, setIsLoading] = useState(true);

  // Lire le statut actuel du workflow
  const { data: workflowStatus } = useReadContract({
    address: VOTING_CONTRACT_ADDRESS,
    abi: VOTING_CONTRACT_ABI,
    functionName: 'workflowStatus',
    account: address
  });

  // Lire l'ID de la proposition gagnante
  const { data: winningProposalID } = useReadContract({
    address: VOTING_CONTRACT_ADDRESS,
    abi: VOTING_CONTRACT_ABI,
    functionName: 'winningProposalID',
    account: address  
  });

  // Effet pour mettre à jour winningProposalId quand winningProposalID change
  useEffect(() => {
    if (winningProposalID !== undefined) {
      setWinningProposalId(Number(winningProposalID));
    }
  }, [winningProposalID]);

  // Effet séparé pour récupérer les propositions
  useEffect(() => {
    const init = async () => {
      try {
        setIsLoading(true);
        const props = await getProposals();
        setProposals(props);
      } catch (error) {
        console.error("Erreur lors de la récupération des propositions:", error);
      } finally {
        setIsLoading(false);
      }
    };

    init();
  }, []);

  // Obtenir la description de la proposition votée
  const getProposal = (propID) => {
    if (proposals.length === 0) return "";
    return proposals.find(prop => Number(prop.proposalId) === Number(propID));
  };

  // Déterminer le statut d'affichage en fonction du workflow
  const getDisplayStatus = () => {
    if (workflowStatus === undefined) return -1;
    return Number(workflowStatus);
  };

  const displayStatus = getDisplayStatus();

  return (
    <div>
      <h2 className="text-xl sm:text-2xl font-bold mb-4 mt-6">Résultats</h2>
      
      {displayStatus === -1 ? (
        <p className="text-gray-500">Chargement du statut...</p>
      ) : displayStatus < 5 ? (
        <AlertMessage 
          type="warning"
          title="Information"
          message="Les votes n'ont pas encore été comptabilisés. Veuillez attendre que l'administrateur termine le processus de vote."
        />
      ) : (
        <div>
          {isLoading ? (
            <p className="text-gray-500">Chargement des résultats...</p>
          ) : (
            <>
              <div className="mb-8 p-6 bg-blue-50 border border-blue-200 rounded-lg">
                <h3 className="text-lg font-semibold mb-2 text-blue-800">Proposition gagnante</h3>
                <div className="p-4 bg-white border border-blue-300 rounded-lg shadow-sm">
                  {winningProposalId !== null && (
                    <>
                      <p className="font-medium text-lg">
                        {getProposal(winningProposalId)?.description || "Aucune proposition"}
                      </p>
                      <p className="mt-2 text-blue-600">
                        Votes reçus: <span className="font-bold">
                          {getProposal(winningProposalId)?.voteCount || 0}
                        </span>
                      </p>
                    </>
                  )}
                </div>
              </div>
              
              <h3 className="text-lg font-semibold mb-4">Toutes les propositions</h3>
              <div className="space-y-4">
                {proposals.map((proposal) => (
                  <div 
                    key={proposal.proposalId} 
                    className={`p-4 border rounded-lg shadow-sm ${proposal.proposalId === winningProposalId ? 'bg-blue-50 border-blue-300' : 'bg-white'}`}
                  >
                    <div className="flex justify-between items-center mb-2">
                      <Badge 
                        variant="outline" 
                        className="bg-purple-100 text-purple-700 border-purple-200"
                      >
                        Proposition #{proposal.proposalId.toString()}
                      </Badge>
                      {proposal.proposalId === winningProposalId && (
                        <span className="mx-auto px-3 py-1 bg-blue-100 text-blue-800 rounded-full text-sm">
                          Gagnant
                        </span>
                      )}
                      <span className="text-lg font-semibold ml-auto">{proposal.description}</span>
                    </div>
                    <p className="mt-2 text-gray-600">
                      Votes reçus: <span className="font-semibold">{proposal.voteCount}</span>
                    </p>
                  </div>
                ))}
              </div>
            </>
          )}
        </div>
      )}
    </div>
  );
};

export default Results;