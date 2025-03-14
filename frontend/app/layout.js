import localFont from "next/font/local";
import "./globals.css";
import RainbowKitAndWagmiProvider from "./RainbowKitAndWagmiProvider";
import { Toaster } from 'sonner';
import Layout from "@/components/shared/Layout";

export const metadata = {
  title: "Voting App",
  description: "voting app",
};

export default function RootLayout({ children }) {
  return (
    <html lang="en">
      <body>
        <RainbowKitAndWagmiProvider>
          <Layout>
            {children}
          </Layout>
        </RainbowKitAndWagmiProvider>
        <Toaster position="bottom-right" />
      </body>
    </html>
  );
}
