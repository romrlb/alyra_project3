'use client';
import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { NEXT_PUBLIC_VOTING_CONTRACT_ADDRESS, VOTING_CONTRACT_ABI } from '@/constants';
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
    address: NEXT_PUBLIC_VOTING_CONTRACT_ADDRESS,
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
      address: NEXT_PUBLIC_VOTING_CONTRACT_ADDRESS,
      abi: VOTING_CONTRACT_ABI,
      functionName: functionNames[currentStep]
    });
  };

  return (
    <div>
      {isLoadingStatus ? (
        <p className="text-gray-500">Chargement du statut...</p>
      ) : (
        <div>
          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center">
            <div>
              <h2 className="text-xl sm:text-2xl font-bold mb-4 mt-6">Etape actuelle</h2>
              <p className="text-gray-600">{workflowSteps[Number(workflowStatus)].name}</p>
              <p className="text-sm text-gray-500">{workflowSteps[Number(workflowStatus)].description}</p>
            </div>
            
            {isOwner && Number(workflowStatus) < 5 && (
              <div className="mt-4 sm:mt-0">
                <Button 
                  onClick={nextWorkflowStep}
                  disabled={isWritePending || isConfirming}
                  className="bg-blue-600 hover:bg-blue-700"
                >
                  {isWritePending || isConfirming ? "En cours..." : `Passer à l'étape suivante`}
                </Button>
              </div>
            )}
          </div>
          
          <div className="flex flex-col w-full mt-6">
            {hash && (
              <AlertMessage 
                type="success"
                title="Information"
                message={`Transaction Hash: ${hash}`}
                breakAll={true}
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
                message="Étape du workflow mise à jour avec succès !"
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
          </div>
          
          <div className="mt-6">
            <h3 className="text-lg font-semibold mb-4">Toutes les étapes</h3>
            <div className="space-y-3">
              {workflowSteps.map((step) => (
                <div 
                  key={step.id} 
                  className={`p-3 border rounded-lg ${Number(workflowStatus) === step.id ? 'bg-blue-50 border-blue-300' : 'bg-white'}`}
                >
                  <div className="flex items-center">
                    <div className={`w-8 h-8 rounded-full flex items-center justify-center mr-3 ${Number(workflowStatus) === step.id ? 'bg-blue-500 text-white' : Number(workflowStatus) > step.id ? 'bg-green-500 text-white' : 'bg-gray-200'}`}>
                      {Number(workflowStatus) > step.id ? '✓' : step.id + 1}
                    </div>
                    <div>
                      <p className="font-medium">{step.name}</p>
                      <p className="text-sm text-gray-500">{step.description}</p>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default Workflow; 