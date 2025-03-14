'use client';
import { useState, useEffect } from 'react';
import { VOTING_CONTRACT_ADDRESS, VOTING_CONTRACT_ABI } from '@/constants';
import { useReadContract, useAccount } from 'wagmi';
import AlertMessage from '../shared/AlertMessage';

const Results = ({ isOwner }) => {
  const { address } = useAccount();
  const [proposals, setProposals] = useState([]);
  const [winningProposal, setWinningProposal] = useState(null);
  const [isLoading, setIsLoading] = useState(true);

  // Lire le statut actuel du workflow
  const { data: workflowStatus } = useReadContract({
    address: VOTING_CONTRACT_ADDRESS,
    abi: VOTING_CONTRACT_ABI,
    functionName: 'workflowStatus',
    account: address
  });

  // Simuler le chargement des propositions et du résultat
  useEffect(() => {
    // Simulation de données pour les propositions
    const mockProposals = [
      { id: 0, description: "Proposition 1: Exemple de proposition", voteCount: 0 },
      { id: 1, description: "Proposition 2: Une autre proposition", voteCount: 5 },
      { id: 2, description: "Proposition 3: Dernière proposition d'exemple", voteCount: 2 }
    ];
    
    // Trouver la proposition gagnante (celle avec le plus de votes)
    const winner = [...mockProposals].sort((a, b) => b.voteCount - a.voteCount)[0];
    
    const timer = setTimeout(() => {
      setProposals(mockProposals);
      setWinningProposal(winner);
      setIsLoading(false);
    }, 1000);
    
    return () => clearTimeout(timer);
  }, []);

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
                  <p className="font-medium text-lg">{winningProposal.description}</p>
                  <p className="mt-2 text-blue-600">Votes reçus: <span className="font-bold">{winningProposal.voteCount}</span></p>
                </div>
              </div>
              
              <h3 className="text-lg font-semibold mb-4">Toutes les propositions</h3>
              <div className="space-y-4">
                {proposals.map((proposal) => (
                  <div 
                    key={proposal.id} 
                    className={`p-4 border rounded-lg shadow-sm ${proposal.id === winningProposal.id ? 'bg-blue-50 border-blue-300' : 'bg-white'}`}
                  >
                    <p className="font-medium">{proposal.description}</p>
                    <p className="mt-2 text-gray-600">Votes reçus: <span className="font-semibold">{proposal.voteCount}</span></p>
                    {proposal.id === winningProposal.id && (
                      <span className="mt-2 inline-block px-3 py-1 bg-blue-100 text-blue-800 rounded-full text-sm">
                        Gagnant
                      </span>
                    )}
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