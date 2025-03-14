'use client';
import { useState, useEffect } from 'react';
import { VOTING_CONTRACT_ADDRESS, VOTING_CONTRACT_ABI } from '@/constants';
import { useReadContract, useAccount } from 'wagmi';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import AlertMessage from '../shared/AlertMessage';

const Proposals = ({ isOwner }) => {
  const { address } = useAccount();
  const [isVoter, setIsVoter] = useState(false);
  const [proposals, setProposals] = useState([]);
  const [proposalInput, setProposalInput] = useState('');
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

  // Effet pour vérifier si l'utilisateur est un votant
  useEffect(() => {
    if (voterData) {
      setIsVoter(voterData.isRegistered);
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

  // Fonction pour soumettre une proposition (à implémenter par l'équipe)
  const submitProposal = (e) => {
    e.preventDefault();
    alert("Fonctionnalité à implémenter par l'équipe: Soumettre la proposition: " + proposalInput);
    setProposalInput('');
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
            <div className="mb-6 p-4 bg-gray-100 rounded-lg">
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
                  disabled={!proposalInput.trim()}
                >
                  Soumettre
                </Button>
              </form>
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
              <p className="text-gray-500">Chargement des propositions...</p>
            ) : proposals.length === 0 ? (
              <p className="text-gray-500">Aucune proposition n'a été soumise.</p>
            ) : (
              <div className="space-y-4">
                {proposals.map((proposal) => (
                  <div key={proposal.id} className="p-4 bg-white border rounded-lg shadow-sm">
                    <p className="font-medium">{proposal.description}</p>
                    {displayStatus >= 5 && (
                      <p className="mt-2 text-sm text-gray-600">Votes reçus: {proposal.voteCount}</p>
                    )}
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      ) : null}
    </div>
  );
};

export default Proposals; 