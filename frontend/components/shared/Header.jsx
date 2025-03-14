'use client';
import { useAccount } from 'wagmi';
import { Button } from '@/components/ui/button';
import { ConnectButton } from "@rainbow-me/rainbowkit";

const Header = () => {
  const { address, isConnected } = useAccount();

  return (
    <header className="py-2 sm:py-4 mb-4 sm:mb-8 border-b">
      <div className="container mx-auto px-2 sm:px-4">
        <div className="flex flex-col sm:flex-row justify-between items-center gap-3 sm:gap-0">
          <div className="flex items-center gap-2 sm:gap-3">
            <img 
              src="/images/logo.png" 
              alt="Voting App Logo" 
              className="h-6 sm:h-8 w-auto"
            />
            <h1 className="text-xl sm:text-2xl font-bold">Voting DApp</h1>
          </div>
          
          <div className="mt-2 sm:mt-0">
            <ConnectButton />
          </div>
        </div>
      </div>
    </header>
  );
};

export default Header;
