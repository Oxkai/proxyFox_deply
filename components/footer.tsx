export default function Footer() {
  return (
    <div 
      className="flex flex-row w-full px-5 justify-between items-center"
     
    >
      <p className="text-zinc-200 text-center text-base font-normal leading-6">
        copyright © 2025 caeser. all rights reserved.
      </p>
      
      <div className="flex flex-row w-[123px] h-[35px] p-2.5 justify-center items-center gap-2.5 flex-shrink-0">
        <span className="text-zinc-200 text-xl font-semibold tracking-[4.6px] font-['Rajdhani']">
          CAESER
        </span>
      </div>
    </div>
  );
}