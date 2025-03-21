'use client';
import { useState, useEffect } from 'react';
import { VOTING_CONTRACT_ADDRESS, VOTING_CONTRACT_ABI } from '@/constants';
import { useReadContract, useAccount, useWriteContract, useWaitForTransactionReceipt } from 'wagmi';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import AlertMessage from '../shared/AlertMessage';
import { getProposals } from '@/utils/votingUtils';
import { toast } from 'sonner';

const Votes = ({ isOwner, onRefresh }) => {
  const { address } = useAccount();
  const [isVoter, setIsVoter] = useState(true);
  const [proposals, setProposals] = useState([]);
  const [hasVoted, setHasVoted] = useState(false);
  const [votedProposalId, setVotedProposalId] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [transactionStatus, setTransactionStatus] = useState(null);

  // hook pour les transactions d'écriture
  const { data: hash, error, isPending: isWritePending, writeContract } = useWriteContract();
  
  // hook pour attendre la confirmation de la transaction
  const { isLoading: isConfirming, isSuccess, error: errorConfirmation } = useWaitForTransactionReceipt({
    hash
  });

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
  }, [voterData, address]);

// Récupérer les propositions
  const fetchProposals = async() => {
    try {
      setIsLoading(true)
      const proposals = await getProposals(address)
      setProposals(proposals)
    } catch (error) {
      console.error("Erreur lors de la récupération des propositions:", error)
      setTransactionStatus({
        type: 'error',
        message: "Erreur lors de la récupération des propositions"
      })
    } finally {
      setIsLoading(false)
    }
  }

  // Effet pour récupérer les propositions
  useEffect(() => {
    if (address && isVoter) {
      fetchProposals()
    }
  }, [address, voterData])

  // Effet pour gérer le succès de la transaction
  useEffect(() => {
    if (isSuccess) {

      // Rafraîchir l'onglet après le vote
      onRefresh();
    }
    
    if (errorConfirmation) {
      console.log("Erreur lors du vote" + errorConfirmation.shortMessage || errorConfirmation.message);
      toast.error("Erreur lors du vote" + errorConfirmation.shortMessage || errorConfirmation.message);
    }

  }, [isSuccess, errorConfirmation, address]);

  // Modifier la fonction submitVote
  const submitVote = async (proposalId) => {
    try {
      writeContract({
        address: VOTING_CONTRACT_ADDRESS,
        abi: VOTING_CONTRACT_ABI,
        functionName: 'setVote',
        args: [Number(proposalId)]
      });

    } catch(error) {
      console.error("Erreur lors du vote:", error);
      toast.error("Erreur lors du vote" + error.shortMessage || error.message);
    }
  };

  // Déterminer le statut d'affichage en fonction du workflow
  const getDisplayStatus = () => {
    if (workflowStatus === undefined) return -1;
    return Number(workflowStatus);
  };

  // Obtenir la description de la proposition votée
  const getVotedProposalDescription = () => {
    if (!hasVoted || votedProposalId === null || proposals.length === 0) return "";
    
    const votedProposal = proposals.find(p => Number(p.proposalId) === votedProposalId);
    return votedProposal ? votedProposal.description : "";
  };

  const displayStatus = getDisplayStatus();
  const votedProposalDescription = getVotedProposalDescription();

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
          {hash && (
          <AlertMessage 
            type="success"
            title="Information"
            message={`Transaction Hash: ${hash}`}
            breakAll={true}
            />
          )}

          {isWritePending && (
            <AlertMessage 
              type="info"
              title="Information"
              message="Transaction en cours de traitement..."
            />
          )}

          {isConfirming && (
            <AlertMessage 
              type="warning"
              title="Information"
              message="En attente de confirmation..."
            />
          )}

          {isSuccess && (
            <AlertMessage 
              type="success"
              title="Information"
              message="Proposition ajoutée avec succès !"
            />
          )}

          {error && (
            <AlertMessage 
              type="error"
              title="Erreur"
              message={error.shortMessage || error.message}
              breakAll={true}
            />
          )}

          {errorConfirmation && (
            <AlertMessage 
              type="error"
              title="Erreur"
              message={errorConfirmation.shortMessage || errorConfirmation.message}
              breakAll={true}
            />
          )}
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
                message={`Vous avez voté pour la proposition #${votedProposalId}${votedProposalDescription ? ` : "${votedProposalDescription}"` : ""}.`}
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
                    </div>)}
                 </div>
          <div className="mt-6">
            <h3 className="text-lg font-semibold mb-4">Liste des propositions</h3>
            
            {isLoading ? (
              <p className="text-gray-500">Chargement des propositions...</p>
            ) : proposals.length === 0 ? (
              <p className="text-gray-500">Aucune proposition n'a été soumise.</p>
            ) : (
              <div className="space-y-4">
                {proposals.map((proposal) => (
                  <div 
                    key={proposal.proposalId.toString()} 
                    className="p-4 mb-3 border rounded-lg shadow-sm hover:shadow-md transition-shadow bg-white dark:bg-gray-800"
                  >
                    <div className="flex justify-between items-center">
                      <div className="flex items-center space-x-4">
                        <Badge 
                          variant="outline" 
                          className="bg-purple-100 text-purple-700 border-purple-200"
                        >
                          Proposition #{proposal.proposalId.toString()}
                        </Badge>
                        <span className="text-lg font-semibold">{proposal.description}</span>
                      </div>
                      
                      <div>
                        {displayStatus === 3 && isVoter && !hasVoted && (
                          <Button 
                            onClick={() => submitVote(proposal.proposalId)}
                            className="bg-blue-600 hover:bg-blue-700"
                          >
                            Voter
                          </Button>
                        )}
                        {hasVoted && votedProposalId === Number(proposal.proposalId) && (
                          <span className="px-3 py-1 bg-green-100 text-green-800 rounded-full text-sm">
                            Votre vote
                          </span>
                        )}
                      </div>
                    </div>
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