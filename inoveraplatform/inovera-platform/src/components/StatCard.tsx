interface StatCardProps {
  label: string;
  value: string | number;
  sub?: string;
  tone?: "brand" | "green" | "amber" | "red";
}

const TONES: Record<string, string> = {
  brand: "text-[#5b3df6]",
  green: "text-emerald-600",
  amber: "text-amber-600",
  red: "text-red-600",
};

export default function StatCard({ label, value, sub, tone = "brand" }: StatCardProps) {
  return (
    <div className="bg-white rounded-2xl shadow-sm border border-slate-100 p-5">
      <div className="text-sm text-slate-500">{label}</div>
      <div className={`text-3xl font-extrabold mt-1 ${TONES[tone]}`}>{value}</div>
      {sub && <div className="text-xs text-slate-400 mt-1">{sub}</div>}
    </div>
  );
}
