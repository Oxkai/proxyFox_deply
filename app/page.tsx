

'use client'; // ensure this is at the top if you're using Next.js app directory

import { useRouter } from 'next/navigation';









export default function Page() {
  const router = useRouter();

  const handleMonetize = () => {
    router.push('/page1');
  };
  const handleExplore = () => {
    router.push('/page3');
  };




  return (
    <div className="w-full  px-[100px] flex flex-col justify-center   items-center bg-black border-t border-b border-[#1f1f1f]">
      {/* Header Section */}
      

      {/* Main Content */}
     
    
      <div className="flex flex-row w-full py-[40px]  px-[70.7px] mt-[-0.5px]  justify-center items-center gap-[44.5px]  border border-[#1f1f1f] bg-black ">
        <div className="flex flex-col justify-center items-center gap-[10px] flex-1">
          <div className="flex flex-col items-center gap-[14px] w-full">
            <h1 className="text-[#EDEDED] text-center text-[35px] font-semibold tracking-[-1px] leading-tight">
              The native monetization platform
            </h1>
            <p className="w-full text-[#a1a1a1] text-center font-['Helvetica_Neue'] text-[17.66px] font-normal leading-8 tracking-[0.5px]">
              <span className="text-[#EDEDED] font-medium  font-['Helvetica_Neue']">
                Built for developers,
                </span> With Proxy Fox, easy to monetize, scale, and manage your APIs and MCP servers
            </p>
          </div>
          <div className="flex flex-row items-end gap-2.5 mt-4">
            <button 
            onClick={handleMonetize}
            className="flex flex-row h-12 px-[29px] py-[9px] justify-center items-center gap-2.5 rounded-[30px] bg-[#ededed] hover:bg-gray-200 transition-colors duration-200">
              <span className="text-[#0a0a0a] text-base font-['Helvetica_Neue'] font-medium leading-[30px]">
                Start Monetizing
              </span>
            </button>
            <button 
             onClick={handleExplore}
            className="flex flex-row w-[181px] h-12 px-[29px] py-[9px] justify-center items-center gap-2.5 rounded-[30px] border border-[#212121] bg-[#0a0a0a] hover:bg-[#1a1a1a] transition-colors duration-200">
              <span className="text-[#ededed] text-base font-medium font-['Helvetica_Neue'] leading-[30px]">
                Explore
              </span>
            </button>
          </div>
        </div>
        <div className=" px-[52.818px]  flex flex-col justify-center items-center gap-[20.612px] flex-shrink-0">
         <svg xmlns="http://www.w3.org/2000/svg" width="232" height="325" viewBox="0 0 232 325" fill="none">
  <path d="M38.6668 185.982L92.256 239.571V281.444L116.013 305.202L139.987 281.228V239.571L193.36 185.982L203.231 195.854L153.873 245.321V287.085L116.122 324.837L78.3705 287.302V245.646L28.795 195.854L38.6668 185.982Z" fill="#EDEDED"/>
  <path fill-rule="evenodd" clipRule="evenodd" d="M3.7361 5.47064L15.235 0.37207L90.7373 75.7659H141.289L216.574 0.480551L228.29 5.25368L228.507 114.71L122.956 220.045V291.316H109.179V220.045L3.7361 114.493V5.47064ZM17.6216 108.961V21.8512L78.1536 82.7086L40.294 120.568L50.0572 130.331L91.0627 89.4344H141.289L182.078 130.44L191.949 120.677L153.981 82.7086L214.622 21.9596V108.961L116.122 207.461L17.6216 108.961Z" fill="#EDEDED"/>
  <path d="M20.2251 140.203L0.15625 160.38V217.441L55.0473 272.441L64.919 262.569L13.9332 211.8V166.238L29.9883 150.183L20.2251 140.203Z" fill="#EDEDED"/>
  <path d="M211.91 140.312L231.979 160.489V217.55L177.088 272.549L167.216 262.677L218.202 211.909V166.347L202.147 150.292L211.91 140.312Z" fill="#EDEDED"/>
</svg>
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









// "use client";

// import { useState } from "react";
// import axios from "axios";
// import { privateKeyToAccount } from "viem/accounts";
// import { Hex } from "viem";


// const privateKey = `0xd395aea4aa82b49e5ab9e31277ff6559431896b775bfc8e6dcd2de8ed2dfd21c` as Hex;

// interface CustomError {
//   response: {
//     status: number;
//     statusText: string;
//     headers: Record<string, unknown>;
//     data: unknown;
//   };
// }

// export default function Home() {

//   const [location, setLocation] = useState("");
//   const [result, setResult] = useState<string | null>(null);
//   const [statusCode, setStatusCode] = useState<number | null>(null);
//   const [loading, setLoading] = useState(false);

//   const account = privateKeyToAccount(privateKey);

//   console.log('account',account)

//   const fetchWeather = async () => {
//     setLoading(true);
//     setStatusCode(null);
//     setResult(null);

//     try {
//       const response = await axios.post("http://localhost:3000/api/proxy/61f1b4b7-d495-48dd-b333-f84bb4a09ab1-weather_broad/weather", {
//         tool: "weather",
//         input: { location },
//       });

//       console.log("Full response:", response);

//       const fullResponse = {
//         status: response.status,
//         statusText: response.statusText,
//         headers: response.headers,
//         data: response.data,
//       };

//       setStatusCode(response.status);
//       setResult(JSON.stringify(fullResponse, null, 2));
//     } catch (error: unknown) {
//   if (typeof error === "object" && error !== null && "response" in error) {
//     const err = error as CustomError;
//     const errorResponse = {
//       status: err.response.status,
//       statusText: err.response.statusText,
//       headers: err.response.headers,
//       data: err.response.data,
//     };
//     setStatusCode(err.response.status);
//     setResult(JSON.stringify(errorResponse, null, 2));
//   } else if (error instanceof Error) {
//     setResult("Error: " + error.message);
//   } else {
//     setResult("An unknown error occurred.");
//   }
// }

//     setLoading(false);
//   };

//   return (
//     <main className="flex flex-col items-center  h-screen p-6 bg-black text-white">
//       <h1 className="text-3xl font-bold mb-6">Weather Checker</h1>

//       <input
//         type="text"
//         value={location}
//         onChange={(e) => setLocation(e.target.value)}
//         placeholder="Enter location"
//         className="p-2 border border-gray-300 rounded w-64 mb-4 text-white"
//       />

//       <button
//         onClick={fetchWeather}
//         disabled={!location || loading}
//         className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 disabled:opacity-50"
//       >
//         {loading ? "Fetching..." : "Get Weather"}
//       </button>

//       {statusCode !== null && (
//         <p className="mt-4 text-lg">
//           Status Code: <span className="font-bold">{statusCode}</span>
//         </p>
//       )}

//       {result && (
//         <pre className="mt-4 p-4 bg-white text-black border rounded w-full max-w-2xl overflow-auto">
//           {result}
//         </pre>
//       )}
//     </main>
//   );
// }

