'use client';
import { useState, useEffect } from 'react';
import { NEXT_PUBLIC_VOTING_CONTRACT_ADDRESS, VOTING_CONTRACT_ABI } from '@/constants';
import { useReadContract, useAccount } from 'wagmi';
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { VoterWhitelist, Proposals, Votes, Results } from './voting-steps';
import Workflow from './voting-steps/Workflow';

const Voting = () => {
  const { address } = useAccount();
  const [isOwner, setIsOwner] = useState(false);
  const [activeTab, setActiveTab] = useState("workflow");

  // Lire l'adresse du propriétaire du contrat
  const { data: ownerAddress, isLoading: isLoadingOwner } = useReadContract({
    address: NEXT_PUBLIC_VOTING_CONTRACT_ADDRESS,
    abi: VOTING_CONTRACT_ABI,
    functionName: 'owner',
  });

  // Lire le statut actuel du workflow
  const { data: workflowStatus, isLoading: isLoadingStatus , refetch} = useReadContract({
    address: NEXT_PUBLIC_VOTING_CONTRACT_ADDRESS,
    abi: VOTING_CONTRACT_ABI,
    functionName: 'workflowStatus',
    account: address,
    watch: true, // Surveiller les changements
  });

  // Vérifier si l'utilisateur connecté est le propriétaire
  useEffect(() => {
    if (ownerAddress && address) {
      setIsOwner(ownerAddress.toLowerCase() === address.toLowerCase());
    }
  }, [ownerAddress, address]);

   
  return (
    <div className="flex flex-col">
      <h2 className="text-2xl font-bold mb-6">Plateforme de Vote</h2>
      
      {isLoadingOwner ? (
        <p className="mt-4">Vérification du statut de propriétaire...</p>
      ) : (
        <div className="mt-4 mb-6">
          {isOwner ? (
            <div className="p-4 bg-green-100 border border-green-400 text-green-700 rounded">
              <p className="font-bold">Vous êtes le propriétaire du contrat</p>
              <p>Vous avez accès aux fonctions d'administration.</p>
              <p className="mt-2 text-sm font-mono">Votre adresse: {address}</p>
            </div>
          ) : (
            <div className="p-4 bg-blue-100 border border-blue-400 text-blue-700 rounded">
              <p>Vous n'êtes pas le propriétaire du contrat.</p>
              <p>Certaines fonctionnalités peuvent être limitées.</p>
              <p className="mt-2 text-sm font-mono">Votre adresse: {address}</p>
              <p className="text-sm font-mono">Adresse du propriétaire: {ownerAddress}</p>
            </div>
          )}
        </div>
      )}

      {/* Système d'onglets */}
      <Tabs value={activeTab} onValueChange={setActiveTab} className="mt-8">
        <TabsList className="grid w-full grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-1 p-1 rounded-lg bg-gray-100">
          <TabsTrigger 
            value="workflow" 
            className="text-xs sm:text-sm font-medium transition-all data-[state=active]:bg-blue-600 data-[state=active]:text-white"
          >
            Etapes du vote
          </TabsTrigger>
          <TabsTrigger 
            value="voters" 
            className="text-xs sm:text-sm font-medium transition-all data-[state=active]:bg-blue-600 data-[state=active]:text-white"
          >
            Liste blanche
          </TabsTrigger>
          <TabsTrigger 
            value="proposals" 
            className="text-xs sm:text-sm font-medium transition-all data-[state=active]:bg-blue-600 data-[state=active]:text-white"
          >
            Propositions
          </TabsTrigger>
          <TabsTrigger 
            value="votes" 
            className="text-xs sm:text-sm font-medium transition-all data-[state=active]:bg-blue-600 data-[state=active]:text-white"
          >
            Votes
          </TabsTrigger>
          <TabsTrigger 
            value="result" 
            className="text-xs sm:text-sm font-medium transition-all data-[state=active]:bg-blue-600 data-[state=active]:text-white"
          >
            Resultat
          </TabsTrigger>
        </TabsList>
        
        <TabsContent value="workflow" className="p-4 mt-4 border rounded-lg shadow-sm">
          <Workflow isOwner={isOwner} />
        </TabsContent>
        
        <TabsContent value="voters" className="p-4 mt-4 border rounded-lg shadow-sm">
          <VoterWhitelist isOwner={isOwner} />
        </TabsContent>
        
        <TabsContent value="proposals" className="p-4 mt-4 border rounded-lg shadow-sm">
          <Proposals isOwner={isOwner}/>
        </TabsContent>
        
        <TabsContent value="votes" className="p-4 mt-4 border rounded-lg shadow-sm">
          <Votes isOwner={isOwner} />
        </TabsContent>
        
        <TabsContent value="result" className="p-4 mt-4 border rounded-lg shadow-sm">
          <Results isOwner={isOwner} />
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default Voting;