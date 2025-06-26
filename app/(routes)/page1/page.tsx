"use client";

import { useState } from "react";
import axios from "axios";

type Tool = {
  name: string;
  description: string;
};

export default function page1() {
   const [wallet, setWallet] = useState("");
  const [serverUri, setServerUri] = useState("");
  const [serverName, setServerName] = useState("");
  const [description, setDescription] = useState("");
  const [authEnabled, setAuthEnabled] = useState(false);
  const [tools, setTools] = useState<Tool[]>([]);
  const [prices, setPrices] = useState<{ [key: string]: string }>({});
  const [monetizedUri, setMonetizedUri] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
 const [showModal, setShowModal] = useState(false);


  const fetchTools = async () => {
    if (!serverUri) {
      setError("Please enter a Server URI first.");
      return;
    }

    setLoading(true);
    setError(null);
    setTools([]);

    try {
      const response = await axios.get(`${serverUri}/tools`);
      if (response.data.tools && Array.isArray(response.data.tools)) {
        setTools(response.data.tools);
        
      } else {
        setError("Unexpected response format.");
      }
    } catch (err: any) {
      setError("Failed to fetch tools: " + (err.message || "Unknown error"));
    }

    setLoading(false);
  };

  const handlePriceChange = (toolName: string, value: string) => {
    setPrices((prev) => ({ ...prev, [toolName]: value }));
  };

  const handleMonetize = async () => {
    const monetizedTools = tools.map((tool) => ({
      toolName: tool.name,
      description: tool.description,
      price: prices[tool.name] || "$0.00",
    }));

    const payload = {
      recipient: wallet,
      serverName,
      description,
      serverUri,
      authEnabled,
      tools: monetizedTools,
    };

    try {
      const res = await axios.post("/api/monetize", payload);
      setMonetizedUri(res.data.monetizedUri);
      setShowModal(true);
    } catch (err) {
      console.error(err);
      alert("Failed to monetize.");
    }
  };
  return (
    <div className="w-full  px-[100px] flex flex-col justify-center   items-center bg-black border-t border-b border-[#1f1f1f]">
      {/* Header Section */}
      <div className="pt-[23px] px-[46px] pb-[23px] mb-[-0.5px] mt-[-1px] flex flex-col justify-center items-start  w-full border border-[#1f1f1f]">
        <div className="flex flex-col items-start gap-[17px] w-full">
          <h1 className="w-full text-[#ededed] font-['Helvetica_Neue'] text-4xl font-bold">
            Server Configuration
          </h1>
          <p className="w-full text-[#a1a1a1] font-['Helvetica_Neue'] text-base font-normal">
            To deploy a new Project, import an existing Git Repository or get started with one of our Templates.
          </p>
        </div>
      </div>

      {/* Main Content */}
      <div className="flex flex-row h-[589px]  mt-[-0.5px] mb-[-0.5px]  justify-center w-full   items-start ">
       
        <div className="flex flex-col   items-start mr-[-1px]    flex-1 h-full w-full">
          <div className=" flex flex-col p-12  items-start gap-[31px] mb-[-0.5px] w-full border border-[#1f1f1f]">
            <div className="flex flex-col items-start gap-[30px] w-full">
              <div className="flex flex-col  items-start gap-4 w-full">
                <label className="w-full text-white font-['Helvetica_Neue'] text-base font-bold leading-6">
                  MCP Server URL*
                </label>
                <input
          type="text"
          value={serverUri}
          onChange={(e) => setServerUri(e.target.value)}
          className="flex flex-row h-[42px]  py-[9px] px-3 items-center placeholder-[#a1a1a1]  w-full rounded-md border border-[#1f1f1f] text-[#ededed] text-start font-['Helvetica_Neue'] text-sm font-normal leading-6 "
          placeholder="https://your-mcp-server.com/mcp"
        />
          
                <div className="flex flex-row py-0 px-[5px] items-center gap-[7px] w-full">
                   <input
          type="checkbox"
          checked={authEnabled}
          className="w-[16px] h-[16px] rounded-sm bg-white"
          onChange={() => setAuthEnabled(!authEnabled)}
        />
                  <span className="text-white full text-center font-['Helvetica_Neue'] text-sm font-normal leading-6">
                    Enable Authentication Headers
                  </span>
                </div>
              </div>
            </div>
          </div>
        <div className=" flex flex-col  p-12 items-start gap-[31px] mt-[-0.5px] flex-1 h-full w-full border border-[#1f1f1f]">
          <div className="flex flex-col items-start gap-4 w-full">
            <div className="flex flex-row justify-center items-center  w-full">
              <h2 className="flex-1 text-white font-['Helvetica_Neue'] text-base font-bold leading-6">
                Detected tools
              </h2>
              <div  onClick={fetchTools}>

 <svg   xmlns="http://www.w3.org/2000/svg" width="19" height="19" viewBox="0 0 19 19" fill="none">
              <path d="M1.5 1.32061V6.32061H2.082M2.082 6.32061C2.74585 4.67874 3.93568 3.30351 5.46503 2.41047C6.99438 1.51742 8.7768 1.15702 10.533 1.38575C12.2891 1.61447 13.9198 2.4194 15.1694 3.67438C16.419 4.92936 17.2168 6.56347 17.438 8.32061M2.082 6.32061H6.5M17.5 17.3206V12.3206H16.919M16.919 12.3206C16.2542 13.9615 15.064 15.3357 13.5348 16.2279C12.0056 17.1201 10.2237 17.4801 8.4681 17.2515C6.71246 17.0228 5.0822 16.2185 3.83253 14.9643C2.58287 13.7102 1.78435 12.0771 1.562 10.3206M16.919 12.3206H12.5" stroke="#EDEDED" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
              </svg>
              </div>
             
             
            </div>
            
          
            {/* <div className="flex flex-row py-3 px-3 justify-between items-center w-full rounded-md border border-[#1f1f1f]">
              <div className="flex flex-col items-start ">
                <span className="text-white   font-['Helvetica_Neue'] text-sm font-normal">
                  Weather
                </span>
                <span className="text-[#a1a1a1] font-['Helvetica_Neue'] text-sm font-normal capitalize">
                  fatch information about weather
                </span>
              </div>
              <div className="flex flex-row h-[42px] py-2.5 px-3 items-center  rounded-md border border-[#1f1f1f]">
                <span className="text-[#a1a1a1] text-center font-['Helvetica_Neue'] text-base font-normal leading-6">
                  $ 10
                </span>
              </div>
            </div> */}

            {tools.length > 0 && (
        <div className="w-full max-h-[230px] scrollbar-hide overflow-y-auto flex flex-col gap-[16px]">
          {tools.map((tool) => (

              <div 
              key={tool.name}
              className="flex flex-row py-3 px-3 justify-between items-center w-full rounded-md border border-[#1f1f1f]">

            <div  key={tool.name} className="flex gap-[10px] flex-col items-start ">
                <span className="text-white font-['Helvetica_Neue'] text-sm font-normal">
                  {tool.name}
                </span>
                <span className="text-[#a1a1a1] font-['Helvetica_Neue'] text-sm font-normal capitalize">
                 {tool.description}
                </span>
              </div>
              

                <input
                type="text"
                value={prices[tool.name] || ""}
                onChange={(e) =>
                  handlePriceChange(tool.name, e.target.value)
                }
              className="flex flex-row w-[56px]  h-[42px] py-[9px] px-3 items-center  rounded-md border border-[#1f1f1f] text-[#a1a1a1] text-center font-['Helvetica_Neue'] text-base font-normal leading-6"
              placeholder="$ 10"
              />
           
          </div>


          ))}
        </div>
      )}

      {showModal && (
        <div className="fixed inset-0 bg-black bg-opacity-70 flex items-center justify-center z-50">
          <div className="bg-[#111] border border-[#1f1f1f] rounded-[6px] p-6 max-w-lg w-full space-y-4">
            <h2 className="text-2xl font-bold font-['Helvetica_Neue']"> Monetized Link</h2>
            <p className="text-sm font-['Helvetica_Neue']">Your MCP monetized URI:</p>
            <code className="block break-all text-green-400">{monetizedUri}</code>
            <button
              onClick={() => setShowModal(false)}
              className="border border-[#1f1f1f] rounded-[6px] px-4 py-2 font-semibold hover:bg-white hover:text-black transition mt-3 w-full"
            >
              Close
            </button>
          </div>
        </div>
      )}

           
            {/* <div className="flex flex-row py-3 px-3 justify-between items-center w-full rounded-md border border-[#1f1f1f]">
              <div className="flex flex-col items-start ">
                <span className="text-white font-['Helvetica_Neue'] text-sm font-normal">
                  Weather
                </span>
                <span className="text-[#a1a1a1] font-['Helvetica_Neue'] text-sm font-normal capitalize">
                  fatch information about weather
                </span>
              </div>
              <div className="flex flex-row h-[42px] py-[9px] px-3 items-center  rounded-md border border-[#1f1f1f]">
                <span className="text-[#a1a1a1] text-center font-['Helvetica_Neue'] text-base font-normal leading-6">
                  $ 10
                </span>
              </div>
            </div> */}
          </div>
        </div>
        </div>
        {/* Right Column */}
        <div className="min-h-[589px]   flex flex-col  items-start flex-1 h-full  w-full border border-[#1f1f1f]">
          <div className="flex flex-col p-12  items-start gap-[30px] flex-1 w-full">
            <div className="flex flex-col items-start gap-4 w-full">
              <h2 className="w-full text-white font-['Helvetica_Neue'] text-base font-bold leading-6">
                Payment Wallet
              </h2>
              <div className="flex flex-col items-start gap-2 w-full">
                <div className="flex flex-row justify-center items-center gap-1 w-full">
                  <span className="flex-1 text-[#a1a1a1] font-['Helvetica_Neue'] text-xs font-normal leading-6">
                    Connected wallet
                  </span>
                </div>
               <input
          type="text"
          value={wallet}
          onChange={(e) => setWallet(e.target.value)}
          className="flex flex-row h-[42px]  py-[9px] px-3 items-center placeholder-[#a1a1a1]  w-full rounded-md border border-[#1f1f1f] text-[#ededed] text-start font-['Helvetica_Neue'] text-sm font-normal leading-6"
          placeholder="0x..."
        />
                <div className="flex flex-row justify-center items-center ">
                  <span className=" text-[#a1a1a1] font-['Helvetica_Neue'] w-full text-xs font-normal leading-6">
                    Connect your wallet to receive payment from tool usage
                  </span>
                </div>
              </div>
            </div>

            <div className="flex flex-col items-start gap-[30px] flex-1 w-full">
              <div className="flex flex-col items-start gap-4 w-full">
                <label className="w-full text-white font-['Helvetica_Neue'] text-base font-bold leading-6">
                  Server name
                </label>
                <input
          type="text"
          value={serverName}
          onChange={(e) => setServerName(e.target.value)}
          className="flex flex-row h-[42px]  py-[9px] px-3 items-center placeholder-[#a1a1a1]  w-full rounded-md border border-[#1f1f1f] text-[#ededed] text-start font-['Helvetica_Neue'] text-sm font-normal leading-6"
          placeholder="My MCP Server"
        />
              </div>
              
              <div className="flex flex-col items-start gap-4 flex-1 w-full">
                <label className="w-full text-white font-['Helvetica_Neue'] text-base font-bold leading-6">
                  Description
                </label>
                  <textarea
          value={description}
          onChange={(e) => setDescription(e.target.value)}
          className="flex flex-row h-full  py-[9px] px-3 items-center placeholder-[#a1a1a1]  w-full rounded-md border border-[#1f1f1f] text-[#ededed] text-start font-['Helvetica_Neue'] text-sm font-normal leading-6"
          placeholder="Describe your MCP server"
        />
                <button 
                onClick={handleMonetize}
                 className="flex flex-row h-12 py-[9px] px-3 justify-center items-center  w-full rounded-md bg-[#ededed]">
                  <span className="text-black text-center font-['Helvetica_Neue'] text-base font-medium leading-6">
                    Monetize
                  </span>
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Bottom Grid */}
      <div className="flex flex-row mt-[-0.5px] mb-[-1px] px-[0.5px]  h-[91px] items-center w-full">
        {Array.from({ length: 12 }).map((_, index) => (
          <div
            key={index}
            className="h-[91px] flex-1 mx-[-0.5px]  border border-[#1f1f1f]"
          />
        ))}
      </div>
    </div>
  );
}