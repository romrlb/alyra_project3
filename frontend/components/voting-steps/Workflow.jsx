'use client';
import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { VOTING_CONTRACT_ADDRESS, VOTING_CONTRACT_ABI } from '@/constants';
import { useReadContract, useAccount, useWriteContract, useWaitForTransactionReceipt } from 'wagmi';
import { toast } from 'sonner';
import AlertMessage from '../shared/AlertMessage';

const workflowSteps = [
  { id: 0, name: "Enregistrement des votants", description: "L'administrateur enregistre les votants" },
  { id: 1, name: "Enregistrement des propositions", description: "Les votants peuvent soumettre des propositions" },
  { id: 2, name: "Fin de l'enregistrement des propositions", description: "Les propositions ne peuvent plus être soumises" },
  { id: 3, name: "Session de vote", description: "Les votants peuvent voter pour une proposition" },
  { id: 4, name: "Fin de la session de vote", description: "Les votes ne peuvent plus être soumis" },
  { id: 5, name: "Votes comptabilisés", description: "Les résultats sont disponibles" }
];

const Workflow = ({ isOwner }) => {
  const { address } = useAccount();

  // Lire le statut actuel du workflow
  const { data: workflowStatus, isLoading: isLoadingStatus, refetch: refetchWorkflowStatus } = useReadContract({
    address: VOTING_CONTRACT_ADDRESS,
    abi: VOTING_CONTRACT_ABI,
    functionName: 'workflowStatus',
    account: address
  });

  // Fonction pour passer à l'étape suivante du workflow
  const { data: hash, error, isPending: isWritePending, writeContract } = useWriteContract();
  
  // Attendre la confirmation de la transaction
  const { isLoading: isConfirming, isSuccess, error: errorConfirmation } = useWaitForTransactionReceipt({
    hash
  });

  // Effet pour gérer le succès de la transaction
  useEffect(() => {
    if (isSuccess) {
      toast.success("Étape du workflow mise à jour avec succès !");
      // Rafraîchir le statut du workflow après une transaction réussie
      refetchWorkflowStatus();
    }
    if (errorConfirmation) {
      toast.error(`Erreur: ${errorConfirmation.message || "Erreur lors de la mise à jour de l'étape du workflow"}`);
    }
  }, [isSuccess, errorConfirmation, refetchWorkflowStatus]);

  // Fonction pour passer à l'étape suivante du workflow
  const nextWorkflowStep = () => {
    const currentStep = Number(workflowStatus);
    
    if (currentStep >= 5) return;
    
    const functionNames = [
      'startProposalsRegistering',
      'endProposalsRegistering',
      'startVotingSession',
      'endVotingSession',
      'tallyVotes'
    ];
    
    writeContract({
      address: VOTING_CONTRACT_ADDRESS,
      abi: VOTING_CONTRACT_ABI,
      functionName: functionNames[currentStep]
    });
  };

  return (
    <div>
      <h2 className="text-xl sm:text-2xl font-bold mb-4 mt-6">Étapes du processus de vote</h2>
      
      {/* Afficher l'étape actuelle du workflow */}
      {workflowStatus !== undefined ? (
        <div className="mb-6">
          <div className="p-4 bg-blue-50 border border-blue-200 rounded-lg mb-4">
            <p className="font-medium text-blue-800">
              Étape actuelle : <span className="font-bold">{workflowSteps[Number(workflowStatus)].name}</span>
            </p>
            <p className="text-blue-600 mt-1">
              {workflowSteps[Number(workflowStatus)].description}
            </p>
          </div>
          
          {/* Afficher le bouton "Étape suivante" uniquement pour le propriétaire */}
          {isOwner && (
            <div className="mt-4">
              <Button 
                onClick={nextWorkflowStep}
                disabled={
                  Number(workflowStatus) >= workflowSteps.length - 1 || 
                  isWritePending || 
                  isConfirming
                }
                className="bg-green-600 hover:bg-green-700"
              >
                {isWritePending || isConfirming ? "Traitement en cours..." : "Passer à l'étape suivante"}
              </Button>
            </div>
          )}
        </div>
      ) : (
        <p className="text-gray-500">Chargement du statut du workflow...</p>
      )}

      {/* Alertes pour les transactions */}
      {hash && (
        <AlertMessage 
          type="success"
          title="Transaction envoyée"
          message={`Hash de transaction: ${hash}`}
          breakAll={true}
        />
      )}

      {error && (
        <AlertMessage 
          type="error"
          title="Erreur"
          message={error.message}
          breakAll={true}
        />
      )}

      {isConfirming && (
        <AlertMessage 
          type="info"
          title="En attente de confirmation"
          message="La transaction est en cours de confirmation sur la blockchain..."
        />
      )}

      {isSuccess && (
        <AlertMessage 
          type="success"
          title="Transaction confirmée"
          message="L'étape du workflow a été mise à jour avec succès !"
        />
      )}

      {/* Afficher toutes les étapes du workflow sous forme de timeline */}
      <div className="mt-8">
        <h3 className="text-lg font-semibold mb-4">Progression du vote</h3>
        <div className="relative">
          <div className="absolute left-4 top-0 h-full w-0.5 bg-gray-200"></div>
          {workflowSteps.map((step, index) => (
            <div key={step.id} className="relative pl-10 pb-8">
              <div className={`absolute left-0 top-1 w-8 h-8 flex items-center justify-center rounded-full border-2 ${
                Number(workflowStatus) === index 
                  ? 'bg-blue-500 border-blue-500 text-white' 
                  : Number(workflowStatus) > index 
                    ? 'bg-green-500 border-green-500 text-white' 
                    : 'bg-white border-gray-300 text-gray-500'
              }`}>
                {Number(workflowStatus) > index ? (
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                    <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                  </svg>
                ) : (
                  <span>{index + 1}</span>
                )}
              </div>
              <div className={`font-medium ${
                Number(workflowStatus) === index 
                  ? 'text-blue-500' 
                  : Number(workflowStatus) > index 
                    ? 'text-green-600' 
                    : 'text-gray-500'
              }`}>
                {step.name}
              </div>
              <div className="text-sm text-gray-500 mt-1">{step.description}</div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

export default Workflow; 