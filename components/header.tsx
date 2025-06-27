"use client";
import Link from "next/link";
import { EIP1193Provider } from 'viem'

import { useState } from "react";
import { ethers } from "ethers";

declare global {
  interface Window {
    ethereum?: EIP1193Provider;
  }
}





export default function Header() {

  const [walletAddress, setWalletAddress] = useState<string | null>(null);

  const connectWallet = async () => {
    if (typeof window.ethereum === "undefined") {
      alert("Please install MetaMask!");
      return;
    }

    try {
      const provider = new ethers.BrowserProvider(window.ethereum);
      const accounts = await provider.send("eth_requestAccounts", []);
      const address = accounts[0];
      setWalletAddress(address);
    } catch (err) {
      console.error(err);
      alert("Failed to connect wallet.");
    }
  };

  const shortAddress = (addr: string) =>
  `${addr.slice(0, 10)}...${addr.slice(-3)}`;



  const navItems = [
    { label: "Register", href: "/page1" },
    { label: "Server", href: "/page3" },
    { label: "Test", href: "/page2" },
    
  ];
  return (
    <div className="flex flex-row w-full  px-5 justify-between items-center">
      <div className="flex flex-row w-[123px] h-[35.321px] px-2.5 py-2.5 justify-center items-center gap-2.5 shrink-0">
        <h1 className="text-[#ededed] font-['Rajdhani'] text-xl font-semibold tracking-[4.6px]">
          CAESER
        </h1>
      </div>
       


      <div className="flex flex-row items-center gap-8">
         {navItems.map((item) => (
          <Link
            key={item.href}
            href={item.href}
            className={`text-[#ededed] text-center font-['Helvetica_Neue'] text-[15px] font-normal leading-6 `}
          >
            {item.label}
          </Link>
        ))}
      
      </div>
      
      <div  onClick={connectWallet} className="flex flex-row h-8 px-[11px] py-[5px] justify-center items-center gap-2.5 rounded-[5px] bg-[#ededed]">
       
        {walletAddress ? (
       
        <span className="text-[#0a0a0a] text-center font-['Helvetica_Neue'] text-sm font-medium leading-[21.985px]">{shortAddress(walletAddress)}
</span>
      ) : (
         <span className="text-[#0a0a0a] text-center font-['Helvetica_Neue'] text-sm font-medium leading-[21.985px]">
          Connect
        </span>
        
      )}
      </div>
    </div>
  );
}





