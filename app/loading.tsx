export default function Loading() {
  return (
    <div className="min-h-screen bg-[#0a0a0a] flex items-center justify-center">
      <div className="text-center">
        <div className="inline-block h-12 w-12 animate-spin rounded-full border-4 border-solid border-[#d4a574] border-r-transparent mb-4" />
        <p className="text-[#888] text-sm">Loading...</p>
      </div>
    </div>
  );
}
