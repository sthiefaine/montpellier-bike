export default function DailyStatsSkeleton() {
  return (
    <div className="bg-white/50 backdrop-blur-sm p-4 rounded-2xl shadow-sm border border-gray-100">
      <div className="h-6 w-24 bg-gray-200 rounded animate-pulse mb-4" />
      <div className="h-[180px]">
        <div className="h-full w-[250px] bg-gray-100 rounded-lg animate-pulse" />
      </div>
    </div>
  );
}
