import React, { useState, useEffect } from "react";
import { useParams, useNavigate, Link } from "react-router-dom";
import { apiFetch } from "../lib/api";
import { ArrowLeft, MapPin, Calendar, Tag, Info, History, MoveHorizontal, CheckCircle2, AlertCircle, Trash2, Edit2, Plus } from "lucide-react";

export default function AssetDetail() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [asset, setAsset] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [isMutationModalOpen, setIsMutationModalOpen] = useState(false);
  const [mutationData, setMutationData] = useState({ toLocation: "", description: "" });

  useEffect(() => {
    fetchAsset();
  }, [id]);

  const fetchAsset = () => {
    setLoading(true);
    apiFetch(`/assets/${id}`)
      .then(setAsset)
      .finally(() => setLoading(false));
  };

  const handleMutation = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await apiFetch("/mutations", {
        method: "POST",
        body: JSON.stringify({ assetId: id, ...mutationData })
      });
      setIsMutationModalOpen(false);
      fetchAsset();
    } catch (err: any) {
      alert(err.message);
    }
  };

  const handleDelete = async () => {
    if (!confirm("Apakah Anda yakin ingin menghapus aset ini?")) return;
    try {
      await apiFetch(`/assets/${id}`, { method: "DELETE" });
      navigate("/assets");
    } catch (err: any) {
      alert(err.message);
    }
  };

  if (loading) return <div className="animate-pulse space-y-8">
    <div className="h-8 w-48 bg-slate-200 rounded"></div>
    <div className="grid grid-cols-3 gap-8">
      <div className="col-span-2 h-96 bg-slate-200 rounded-2xl"></div>
      <div className="h-96 bg-slate-200 rounded-2xl"></div>
    </div>
  </div>;

  if (!asset) return <div>Aset tidak ditemukan.</div>;

  return (
    <div className="space-y-8">
      <div className="flex items-center justify-between">
        <Link to="/assets" className="flex items-center gap-2 text-slate-500 hover:text-slate-900 transition-colors">
          <ArrowLeft size={18} />
          Kembali ke Daftar
        </Link>
        <div className="flex gap-3">
          <button 
            onClick={() => setIsMutationModalOpen(true)}
            className="flex items-center gap-2 px-4 py-2 bg-white border border-slate-200 rounded-lg text-slate-700 font-semibold hover:bg-slate-50 transition-colors"
          >
            <MoveHorizontal size={18} />
            Mutasi Lokasi
          </button>
          <button className="p-2 text-slate-400 hover:text-blue-500 transition-colors"><Edit2 size={20} /></button>
          <button onClick={handleDelete} className="p-2 text-slate-400 hover:text-red-500 transition-colors"><Trash2 size={20} /></button>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Main Info */}
        <div className="lg:col-span-2 space-y-8">
          <div className="bg-white rounded-2xl border border-slate-100 shadow-sm p-8">
            <div className="flex items-start justify-between mb-8">
              <div>
                <span className="px-3 py-1 bg-slate-100 text-slate-500 rounded-full text-[10px] font-bold uppercase tracking-wider mb-2 inline-block">
                  {asset.category}
                </span>
                <h1 className="text-3xl font-bold text-slate-900">{asset.name}</h1>
                <p className="text-slate-500 font-mono mt-1">{asset.code}</p>
              </div>
              <div className={`px-4 py-2 rounded-xl text-xs font-bold uppercase tracking-widest flex items-center gap-2 ${
                asset.status === "AVAILABLE" ? "bg-emerald-50 text-emerald-600" : "bg-blue-50 text-blue-600"
              }`}>
                {asset.status === "AVAILABLE" ? <CheckCircle2 size={16} /> : <AlertCircle size={16} />}
                {asset.status.replace("_", " ")}
              </div>
            </div>

            <div className="grid grid-cols-2 md:grid-cols-3 gap-8">
              <div className="space-y-1">
                <p className="text-xs font-bold text-slate-400 uppercase">Merk / Brand</p>
                <p className="font-semibold text-slate-900">{asset.brand || "-"}</p>
              </div>
              <div className="space-y-1">
                <p className="text-xs font-bold text-slate-400 uppercase">Model / Tipe</p>
                <p className="font-semibold text-slate-900">{asset.model || "-"}</p>
              </div>
              <div className="space-y-1">
                <p className="text-xs font-bold text-slate-400 uppercase">Serial Number</p>
                <p className="font-semibold text-slate-900 font-mono">{asset.serialNumber || "-"}</p>
              </div>
              <div className="space-y-1">
                <p className="text-xs font-bold text-slate-400 uppercase">Kondisi</p>
                <p className="font-semibold text-slate-900">{asset.condition}</p>
              </div>
              <div className="space-y-1">
                <p className="text-xs font-bold text-slate-400 uppercase">Lokasi Saat Ini</p>
                <div className="flex items-center gap-1.5 text-emerald-600 font-semibold">
                  <MapPin size={14} />
                  {asset.location}
                </div>
              </div>
              <div className="space-y-1">
                <p className="text-xs font-bold text-slate-400 uppercase">Tanggal Perolehan</p>
                <p className="font-semibold text-slate-900">
                  {asset.purchaseDate ? new Date(asset.purchaseDate).toLocaleDateString("id-ID") : "-"}
                </p>
              </div>
            </div>

            <div className="mt-10 pt-10 border-t border-slate-50">
              <h3 className="font-bold text-slate-900 mb-4 flex items-center gap-2">
                <Info size={18} className="text-slate-400" />
                Deskripsi Tambahan
              </h3>
              <p className="text-slate-600 leading-relaxed">
                {asset.description || "Tidak ada deskripsi tambahan untuk aset ini."}
              </p>
            </div>
          </div>

          {/* Mutation History */}
          <div className="bg-white rounded-2xl border border-slate-100 shadow-sm overflow-hidden">
            <div className="p-6 border-b border-slate-50">
              <h2 className="font-bold text-slate-900 flex items-center gap-2">
                <History size={18} className="text-emerald-500" />
                Histori Mutasi Aset
              </h2>
            </div>
            <div className="relative p-6">
              <div className="absolute left-8 top-8 bottom-8 w-0.5 bg-slate-100"></div>
              <div className="space-y-8 relative">
                {asset.mutations.length === 0 ? (
                  <p className="text-center text-slate-400 py-4">Belum ada histori mutasi.</p>
                ) : asset.mutations.map((mut: any) => (
                  <div key={mut.id} className="flex gap-6">
                    <div className="w-4 h-4 rounded-full bg-emerald-500 border-4 border-white shadow-sm z-10 mt-1"></div>
                    <div className="flex-1">
                      <div className="flex items-center justify-between mb-1">
                        <p className="text-sm font-bold text-slate-900">Pindah ke {mut.toLocation}</p>
                        <span className="text-xs text-slate-400">{new Date(mut.date).toLocaleDateString("id-ID")}</span>
                      </div>
                      <p className="text-xs text-slate-500 mb-2">Dari: {mut.fromLocation}</p>
                      <div className="bg-slate-50 p-3 rounded-lg border border-slate-100">
                        <p className="text-sm text-slate-600 italic">"{mut.description || "Tanpa keterangan"}"</p>
                      </div>
                      <p className="text-[10px] text-slate-400 mt-2 uppercase font-bold tracking-wider">Oleh: {mut.user.name}</p>
                    </div>
                  </div>
                ))}
                {/* Initial Entry */}
                <div className="flex gap-6">
                  <div className="w-4 h-4 rounded-full bg-slate-300 border-4 border-white shadow-sm z-10 mt-1"></div>
                  <div className="flex-1">
                    <p className="text-sm font-bold text-slate-900">Aset Terdaftar</p>
                    <p className="text-xs text-slate-400">{new Date(asset.createdAt).toLocaleDateString("id-ID")}</p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Sidebar Info */}
        <div className="space-y-8">
          <div className="bg-slate-900 text-white rounded-2xl p-6 shadow-xl shadow-slate-200">
            <h3 className="font-bold mb-4 flex items-center gap-2">
              <Tag size={18} className="text-emerald-400" />
              Label Inventaris
            </h3>
            <div className="bg-white p-4 rounded-xl flex flex-col items-center">
              <div className="w-full h-24 bg-slate-100 rounded-lg flex items-center justify-center mb-4">
                <span className="text-slate-300 font-mono text-xs">[QR CODE PLACEHOLDER]</span>
              </div>
              <p className="text-slate-900 font-mono font-bold text-lg">{asset.code}</p>
              <p className="text-slate-400 text-[10px] font-bold uppercase tracking-widest mt-1">Dinas Kominfo</p>
            </div>
            <button className="w-full mt-6 py-2 bg-emerald-500 text-slate-900 font-bold rounded-lg hover:bg-emerald-400 transition-colors text-sm">
              Cetak Label
            </button>
          </div>
        </div>
      </div>

      {/* Mutation Modal */}
      {isMutationModalOpen && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-slate-900/50 backdrop-blur-sm">
          <div className="bg-white w-full max-w-md rounded-2xl shadow-2xl overflow-hidden">
            <div className="p-6 border-b border-slate-100 flex justify-between items-center">
              <h2 className="text-xl font-bold text-slate-900">Mutasi Lokasi Aset</h2>
              <button onClick={() => setIsMutationModalOpen(false)} className="text-slate-400 hover:text-slate-600"><Plus className="rotate-45" /></button>
            </div>
            <form onSubmit={handleMutation} className="p-6 space-y-4">
              <div>
                <label className="block text-xs font-bold text-slate-500 uppercase mb-1">Lokasi Baru</label>
                <input
                  required
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg outline-none focus:ring-2 focus:ring-emerald-500"
                  placeholder="Contoh: Ruang Server Lt. 3"
                  value={mutationData.toLocation}
                  onChange={e => setMutationData({...mutationData, toLocation: e.target.value})}
                />
              </div>
              <div>
                <label className="block text-xs font-bold text-slate-500 uppercase mb-1">Keterangan Mutasi</label>
                <textarea
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg outline-none focus:ring-2 focus:ring-emerald-500 min-h-[100px]"
                  placeholder="Alasan pemindahan aset..."
                  value={mutationData.description}
                  onChange={e => setMutationData({...mutationData, description: e.target.value})}
                />
              </div>
              <div className="flex justify-end gap-3 pt-4">
                <button 
                  type="button"
                  onClick={() => setIsMutationModalOpen(false)}
                  className="px-4 py-2 text-slate-600 font-semibold hover:bg-slate-50 rounded-lg transition-colors"
                >
                  Batal
                </button>
                <button 
                  type="submit"
                  className="px-6 py-2 bg-slate-900 text-white font-semibold rounded-lg hover:bg-slate-800 transition-colors"
                >
                  Proses Mutasi
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
