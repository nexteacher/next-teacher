"use client";

import { WalletMultiButton } from "@solana/wallet-adapter-react-ui";

export default function WalletButton() {

  return (
    <div className="flex items-center">
      <WalletMultiButton className="!bg-black !text-white hover:!bg-gray-800 !rounded-md !px-4 !py-2 !text-sm !transition-colors" />
    </div>
  );
}
