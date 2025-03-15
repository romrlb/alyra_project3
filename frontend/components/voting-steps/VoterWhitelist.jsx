'use client';
import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { VOTING_CONTRACT_ADDRESS, VOTING_CONTRACT_ABI } from '@/constants';
import { useReadContract, useAccount, useWriteContract, useWaitForTransactionReceipt } from 'wagmi';
import { toast } from 'sonner';
import { RocketIcon } from "@radix-ui/react-icons";
import { parseAbiItem } from 'viem';
import { publicClient } from '@/utils/client';
import AlertMessage from '../shared/AlertMessage';
import {
  Alert,
  AlertDescription,
  AlertTitle,
} from "@/components/ui/alert";

const VoterWhitelist = ({ isOwner }) => {
  const { address } = useAccount();
  const [voterAddress, setVoterAddress] = useState('');
  const [whitelistedVoters, setWhitelistedVoters] = useState([]);
  const [isAddressValid, setIsAddressValid] = useState(false);
  const [isLoadingVoters, setIsLoadingVoters] = useState(true);

  // Lire le statut actuel du workflow
  const { data: workflowStatus, isLoading: isLoadingStatus } = useReadContract({
    address: VOTING_CONTRACT_ADDRESS,
    abi: VOTING_CONTRACT_ABI,
    functionName: 'workflowStatus',
    account: address
  });

  // Fonction pour ajouter un votant
  const { data: hash, error, isPending: isWritePending, writeContract } = useWriteContract();
  
  // Attendre la confirmation de la transaction
  const { isLoading: isConfirming, isSuccess, error: errorConfirmation } = useWaitForTransactionReceipt({
    hash
  });

  // Vérifier si l'adresse est valide
  useEffect(() => {
    // Vérification simple : l'adresse doit commencer par 0x et avoir une longueur de 42 caractères
    setIsAddressValid(voterAddress.startsWith('0x') && voterAddress.length === 42);
  }, [voterAddress]);

  // Effet pour gérer le succès de la transaction
  useEffect(() => {
    if (isSuccess) {
      toast.success("Votant ajouté avec succès !");
      setVoterAddress('');
      // Rafraîchir la liste des votants après l'ajout
      fetchVoters();
    }
    if (errorConfirmation) {
      toast.error(`Erreur: ${errorConfirmation.message || "Erreur lors de l'ajout du votant"}`);
    }
  }, [isSuccess, errorConfirmation]);

  // Fonction pour récupérer la liste des votants via les événements
  const fetchVoters = async () => {
    try {
      setIsLoadingVoters(true);
      
      // Récupérer tous les événements VoterRegistered
      const voterRegisteredLogs = await publicClient.getLogs({
        address: VOTING_CONTRACT_ADDRESS,
        event: parseAbiItem('event VoterRegistered(address voterAddress)'),
        fromBlock: process.env.NEXT_PUBLIC_FROM_BLOCK ? BigInt(process.env.NEXT_PUBLIC_FROM_BLOCK) : 0n,
        toBlock: 'latest'
      });
      
      // Extraire les adresses des votants des logs
      const voters = voterRegisteredLogs.map(log => log.args.voterAddress);
      
      // Mettre à jour l'état avec les votants uniques (pour éviter les doublons)
      setWhitelistedVoters([...new Set(voters)]);
      
    } catch (error) {
      console.error("Erreur lors de la récupération des votants:", error);
      toast.error("Erreur lors de la récupération des votants");
    } finally {
      setIsLoadingVoters(false);
    }
  };

  // Charger la liste des votants au chargement du composant
  useEffect(() => {
    fetchVoters();
  }, []);

  // Fonction pour ajouter un votant
  const addVoter = () => {
    if (!isAddressValid) return;
    
    writeContract({
      address: VOTING_CONTRACT_ADDRESS,
      abi: VOTING_CONTRACT_ABI,
      functionName: 'addVoter',
      args: [voterAddress]
    });
  };

  return (
    <div className="mt-4">
      <h2 className="text-xl sm:text-2xl font-bold mb-4 mt-6">Gestion des votants</h2>
      
      {!isOwner ? (
        <AlertMessage 
          type="warning"
          title="Information"
          message="Seul l'administrateur peut gérer les votants."
        />
      ) : (
        <>
          <div className="flex flex-col w-full mb-4">
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
                message="Votant ajouté avec succès !"
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
          
          {workflowStatus !== undefined && Number(workflowStatus) === 0 ? (
            <div className="flex gap-2 mb-6">
              <Input 
                placeholder="Adresse du votant" 
                value={voterAddress}
                onChange={(e) => setVoterAddress(e.target.value)}
                className="flex-grow"
              />
              <Button 
                onClick={addVoter}
                disabled={!voterAddress || isWritePending || isConfirming}
                className="bg-blue-600 hover:bg-blue-700"
              >
                {isWritePending || isConfirming ? "En cours..." : "Ajouter"}
              </Button>
            </div>
          ) : (
            <AlertMessage 
              type="warning"
              title="Information"
              message="L'enregistrement des votants est terminé."
            />
          )}
        </>
      )}
      
      <div className="mt-6">
        <h3 className="text-lg sm:text-xl font-semibold mb-2">Liste des votants</h3>
        {isLoadingVoters ? (
          <p className="text-gray-500">Chargement des votants...</p>
        ) : whitelistedVoters.length === 0 ? (
          <p className="text-gray-500">Aucun votant enregistré pour le moment.</p>
        ) : (
          <ul className="space-y-2 mt-2">
            {whitelistedVoters.map((voter, index) => (
              <li key={index} className="p-2 bg-gray-100 rounded-md break-all">
                {voter}
              </li>
            ))}
          </ul>
        )}
      </div>
    </div>
  );
};

export default VoterWhitelist; 