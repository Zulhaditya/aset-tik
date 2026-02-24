import { useState, useEffect } from "react";
import { apiFetch } from "../lib/api";
import { Box, CheckCircle2, AlertCircle, History, User, Activity, MoveHorizontal } from "lucide-react";
import { motion } from "motion/react";

export default function Dashboard() {
  const [stats, setStats] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    apiFetch("/stats")
      .then(setStats)
      .finally(() => setLoading(false));
  }, []);

  if (loading) return <div className="animate-pulse space-y-8">
    <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
      {[1,2,3,4].map(i => <div key={i} className="h-32 bg-slate-200 rounded-2xl"></div>)}
    </div>
  </div>;

  const cards = [
    { name: "Total Aset", value: stats.totalAssets, icon: Box, color: "bg-blue-500" },
    { name: "Tersedia", value: stats.assetsByStatus.find((s: any) => s.status === "AVAILABLE")?._count || 0, icon: CheckCircle2, color: "bg-emerald-500" },
    { name: "Sedang Digunakan", value: stats.assetsByStatus.find((s: any) => s.status === "IN_USE")?._count || 0, icon: Activity, color: "bg-amber-500" },
    { name: "Dipinjam", value: stats.assetsByStatus.find((s: any) => s.status === "LOANED")?._count || 0, icon: MoveHorizontal, color: "bg-indigo-500" },
  ];

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-2xl font-bold text-slate-900">Dashboard Inventori</h1>
        <p className="text-slate-500">Ringkasan aset TIK Dinas Kominfo hari ini.</p>
      </div>

      {stats.reminders && stats.reminders.length > 0 && (
        <div className="bg-amber-50 border border-amber-200 rounded-2xl p-6">
          <h2 className="text-amber-800 font-bold flex items-center gap-2 mb-4">
            <AlertCircle size={20} />
            Pengingat Jadwal Servis
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {stats.reminders.map((r: any) => (
              <div key={r.id} className="bg-white p-4 rounded-xl border border-amber-100 shadow-sm flex justify-between items-center">
                <div>
                  <p className="font-bold text-slate-900 text-sm">{r.name}</p>
                  <p className="text-xs text-slate-500 font-mono">{r.code}</p>
                </div>
                <div className="text-right">
                  <p className="text-[10px] font-bold text-amber-600 uppercase tracking-wider">Jadwal</p>
                  <p className="text-sm font-semibold text-slate-700">{new Date(r.nextServiceDate).toLocaleDateString("id-ID")}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        {cards.map((card, i) => (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: i * 0.1 }}
            key={card.name}
            className="bg-white p-6 rounded-2xl border border-slate-100 shadow-sm"
          >
            <div className={`${card.color} w-10 h-10 rounded-lg flex items-center justify-center text-white mb-4`}>
              <card.icon size={20} />
            </div>
            <p className="text-sm text-slate-500 font-medium">{card.name}</p>
            <p className="text-2xl font-bold text-slate-900 mt-1">{card.value}</p>
          </motion.div>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* Recent Activity */}
        <div className="bg-white rounded-2xl border border-slate-100 shadow-sm overflow-hidden">
          <div className="p-6 border-b border-slate-50 flex items-center justify-between">
            <h2 className="font-bold text-slate-900 flex items-center gap-2">
              <History size={18} className="text-emerald-500" />
              Aktivitas Terbaru
            </h2>
          </div>
          <div className="divide-y divide-slate-50">
            {stats.recentLogs.map((log: any) => (
              <div key={log.id} className="p-4 hover:bg-slate-50 transition-colors">
                <div className="flex gap-3">
                  <div className="w-8 h-8 rounded-full bg-slate-100 flex items-center justify-center text-slate-500">
                    <User size={14} />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm text-slate-900">
                      <span className="font-semibold">{log.user?.name || "System"}</span>
                      {" melakukan "}
                      <span className="px-1.5 py-0.5 bg-slate-100 rounded text-[10px] font-bold uppercase tracking-wider">
                        {log.action}
                      </span>
                      {" pada "}
                      <span className="font-medium">{log.entity}</span>
                    </p>
                    <p className="text-xs text-slate-400 mt-1">
                      {new Date(log.timestamp).toLocaleString("id-ID")}
                    </p>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Categories Chart (Simple List) */}
        <div className="bg-white rounded-2xl border border-slate-100 shadow-sm p-6">
          <h2 className="font-bold text-slate-900 mb-6 flex items-center gap-2">
            <Box size={18} className="text-blue-500" />
            Kategori Aset
          </h2>
          <div className="space-y-4">
            {stats.assetsByCategory.map((cat: any) => (
              <div key={cat.category}>
                <div className="flex justify-between text-sm mb-1.5">
                  <span className="font-medium text-slate-700">{cat.category}</span>
                  <span className="text-slate-500">{cat._count} unit</span>
                </div>
                <div className="w-full bg-slate-100 h-2 rounded-full overflow-hidden">
                  <div 
                    className="bg-blue-500 h-full rounded-full" 
                    style={{ width: `${(cat._count / stats.totalAssets) * 100}%` }}
                  ></div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
