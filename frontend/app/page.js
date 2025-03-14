'use client';
import Voting from '@/components/Voting';
import { useAccount } from 'wagmi';
import { ConnectButton } from '@rainbow-me/rainbowkit';

const NotConnected = () => {
  return (
    <div className="flex flex-col items-center justify-center min-h-[60vh]">
      <h1 className="text-3xl font-bold mb-6">Système de vote décentralisé</h1>
      <p className="text-xl mb-8">Connectez votre portefeuille pour accéder à l'application</p>
      <ConnectButton />
    </div>
  );
};

export default function Home() {
  const { isConnected } = useAccount();

  return (
    <main className="container mx-auto px-4 py-8">
      {isConnected ? <Voting /> : <NotConnected />}
    </main>
  );
}
