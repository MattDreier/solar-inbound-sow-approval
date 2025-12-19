export function Header() {
  return (
    <header className="bg-white border-b border-gray-200 sticky top-0 z-40">
      <div className="max-w-5xl mx-auto px-4 py-6">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-4">
            {/* Lunex Power Logo - using text for now, can be replaced with actual logo */}
            <div className="flex items-center gap-2">
              <div className="w-10 h-10 bg-primary rounded-lg flex items-center justify-center">
                <span className="text-white font-bold text-xl">L</span>
              </div>
              <span className="text-xl font-semibold text-gray-900">Lunex Power</span>
            </div>
          </div>
          <h1 className="text-lg font-medium text-gray-700">Scope of Work</h1>
        </div>
      </div>
    </header>
  );
}
