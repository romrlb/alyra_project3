'use client';
import { useState, useEffect } from 'react';
import { VOTING_CONTRACT_ADDRESS, VOTING_CONTRACT_ABI } from '@/constants';
import { useReadContract, useAccount } from 'wagmi';
import { Button } from '@/components/ui/button';
import AlertMessage from '../shared/AlertMessage';

const Votes = ({ isOwner }) => {
  const { address } = useAccount();
  const [isVoter, setIsVoter] = useState(false);
  const [proposals, setProposals] = useState([]);
  const [hasVoted, setHasVoted] = useState(false);
  const [votedProposalId, setVotedProposalId] = useState(null);
  const [isLoading, setIsLoading] = useState(true);

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

  // Effet pour vérifier si l'utilisateur est un votant et s'il a déjà voté
  useEffect(() => {
    if (voterData) {
      setIsVoter(voterData.isRegistered);
      setHasVoted(voterData.hasVoted);
      if (voterData.hasVoted) {
        setVotedProposalId(Number(voterData.votedProposalId));
      }
    }
  }, [voterData]);

  // Simuler le chargement des propositions
  useEffect(() => {
    // Simulation de données pour les propositions
    const mockProposals = [
      { id: 0, description: "Proposition 1: Exemple de proposition", voteCount: 0 },
      { id: 1, description: "Proposition 2: Une autre proposition", voteCount: 2 },
      { id: 2, description: "Proposition 3: Dernière proposition d'exemple", voteCount: 1 }
    ];
    
    const timer = setTimeout(() => {
      setProposals(mockProposals);
      setIsLoading(false);
    }, 1000);
    
    return () => clearTimeout(timer);
  }, []);

  // Fonction pour voter (à implémenter par l'équipe)
  const submitVote = (proposalId) => {
    alert(`Fonctionnalité à implémenter par l'équipe: Voter pour la proposition #${proposalId}`);
  };

  // Déterminer le statut d'affichage en fonction du workflow
  const getDisplayStatus = () => {
    if (workflowStatus === undefined) return -1;
    return Number(workflowStatus);
  };

  const displayStatus = getDisplayStatus();

  return (
    <div>
      <h2 className="text-xl sm:text-2xl font-bold mb-4 mt-6">Votes</h2>
      
      {displayStatus === -1 ? (
        <p className="text-gray-500">Chargement du statut...</p>
      ) : displayStatus < 3 ? (
        <AlertMessage 
          type="warning"
          title="Information"
          message="La session de vote n'a pas encore commencé."
        />
      ) : displayStatus > 4 ? (
        <AlertMessage 
          type="info"
          title="Information"
          message="La session de vote est terminée."
        />
      ) : (
        <div>
          {!isVoter ? (
            <AlertMessage 
              type="warning"
              title="Accès limité"
              message="Seuls les votants enregistrés peuvent participer au vote."
            />
          ) : hasVoted ? (
            <div className="mb-6">
              <AlertMessage 
                type="success"
                title="Vote enregistré"
                message={`Vous avez déjà voté pour la proposition #${votedProposalId}.`}
              />
            </div>
          ) : (
            <div className="mb-6">
              <AlertMessage 
                type="info"
                title="Information"
                message="Vous pouvez voter pour une proposition ci-dessous."
              />
            </div>
          )}
          
          <div className="mt-6">
            <h3 className="text-lg font-semibold mb-4">Liste des propositions</h3>
            
            {isLoading ? (
              <p className="text-gray-500">Chargement des propositions...</p>
            ) : proposals.length === 0 ? (
              <p className="text-gray-500">Aucune proposition n'a été soumise.</p>
            ) : (
              <div className="space-y-4">
                {proposals.map((proposal) => (
                  <div key={proposal.id} className="p-4 bg-white border rounded-lg shadow-sm flex justify-between items-center">
                    <div>
                      <p className="font-medium">{proposal.description}</p>
                      {displayStatus >= 5 && (
                        <p className="mt-2 text-sm text-gray-600">Votes reçus: {proposal.voteCount}</p>
                      )}
                    </div>
                    
                    {displayStatus === 3 && isVoter && !hasVoted && (
                      <Button 
                        onClick={() => submitVote(proposal.id)}
                        className="bg-blue-600 hover:bg-blue-700"
                      >
                        Voter
                      </Button>
                    )}
                    
                    {hasVoted && votedProposalId === proposal.id && (
                      <span className="px-3 py-1 bg-green-100 text-green-800 rounded-full text-sm">
                        Votre vote
                      </span>
                    )}
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
};

export default Votes; 