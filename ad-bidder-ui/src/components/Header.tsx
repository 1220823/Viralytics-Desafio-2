export default function Header() {
  return (
    <header className="bg-white border-b border-slate-200 sticky top-0 z-30">
      <div className="max-w-4xl mx-auto px-4">
        <div className="flex justify-between items-center h-16">
          <div className="flex items-center gap-3">
            <div className="bg-[#1d3d5d]/10 p-2 rounded-lg text-[#1d3d5d]">
              <span className="material-symbols-outlined text-3xl">analytics</span>
            </div>
            <div>
              <h1 className="text-xl font-bold text-[#1d3d5d] leading-none">Ad-Bidder</h1>
              <p className="text-xs text-slate-500 font-medium mt-1">
                Demographic &amp; Budget Optimization Engine
              </p>
            </div>
          </div>
        </div>
      </div>
    </header>
  );
}
