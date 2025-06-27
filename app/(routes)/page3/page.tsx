




"use client";
import data from "../../../lib/db.json";



type Server = {
  serverName: string;
  description: string;
  monetizedUri: string;
};


export default function Page3() {
const servers: Server[] = data;


  return (
    <div className="w-full  px-[100px] flex flex-col justify-center   items-center bg-black border-t border-b border-[#1f1f1f]">
      {/* Header Section */}
      <div className="pt-[23px] px-[46px] pb-[23px] mb-[-0.5px] mt-[-1px] flex flex-col justify-center items-start  w-full border border-[#1f1f1f]">
        <div className="flex flex-col items-start gap-[17px] w-full">
          <h1 className="w-full text-[#ededed] font-['Helvetica_Neue'] text-4xl font-bold">
            Monetized Servers
          </h1>
          <p className="w-full text-[#a1a1a1] font-['Helvetica_Neue'] text-base font-normal">
            To deploy a new Project, import an existing Git Repository or get started with one of our Templates.
          </p>
        </div>
      </div>

      {/* Main Content */}
      <div className="flex flex-wrap mt-[-0.5px] mb-[-0.5px]  justify-start w-full   items-start ">
      {servers.map((server, index) => (
        <div
          key={index}
          className="max-w-[calc(100%/3)]  pt-12 pl-10 pb-12 pr-10 ml-[-0.5px] flex flex-col items-start gap-11 border border-zinc-800 bg-black"
        >
          <div className="px-2 flex flex-col items-start gap-5 w-full">
            <h1 className="text-white text-center font-bold text-[29px] leading-none">
              {server.serverName}
            </h1>
            <p className="w-full h-[57px] text-zinc-400 text-base font-normal leading-normal">
              {server.description}
            </p>
          </div>

          <div className="flex flex-col items-start gap-2.5 w-full">
            <div 
            onClick={() => {
    navigator.clipboard.writeText(server.monetizedUri);
    alert("URL copied to clipboard!");
  }}
            className="flex flex-row py-2 px-3 items-center gap-2.5 w-full rounded-md border border-zinc-800">
              <span className="flex-1 text-zinc-400 text-justify text-sm font-normal leading-6">
                {server.monetizedUri}
              </span>
            </div>

            <button
              onClick={() => window.open(server.monetizedUri, "_blank")}
              className="flex flex-row h-10 py-2 px-3 justify-center items-center gap-2.5 w-full rounded-md border border-zinc-200 bg-zinc-200"
            >
              <span className="text-black text-center text-lg font-medium leading-6">
                Visit
              </span>
            </button>
          </div>
        </div>
      ))}
       
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