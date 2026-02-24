import React, { useState, useEffect } from "react";
import { useParams, useNavigate, Link } from "react-router-dom";
import { apiFetch } from "../lib/api";
import { ArrowLeft, MapPin, Calendar, Tag, Info, History, MoveHorizontal, CheckCircle2, AlertCircle, Trash2, Edit2, Plus, Wrench, UserPlus, RotateCcw } from "lucide-react";
import { QRCodeSVG } from "qrcode.react";

export default function AssetDetail() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [asset, setAsset] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState("info");
  const [user, setUser] = useState<any>(null);
  
  // Modals
  const [isMutationModalOpen, setIsMutationModalOpen] = useState(false);
  const [isMaintenanceModalOpen, setIsMaintenanceModalOpen] = useState(false);
  const [isLoanModalOpen, setIsLoanModalOpen] = useState(false);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);

  // Form States
  const [mutationData, setMutationData] = useState({ toLocation: "", description: "" });
  const [maintenanceData, setMaintenanceData] = useState({ type: "ROUTINE", cost: "", description: "", performedBy: "", nextServiceDate: "" });
  const [loanData, setLoanData] = useState({ borrowerName: "", borrowerDept: "", dueDate: "", notes: "" });
  const [editData, setEditData] = useState({
    name: "",
    category: "",
    brand: "",
    model: "",
    serialNumber: "",
    location: "",
    condition: "",
    description: "",
    price: "",
    imageUrl: ""
  });

  useEffect(() => {
    fetchAsset();
    const savedUser = localStorage.getItem("user");
    if (savedUser) setUser(JSON.parse(savedUser));
  }, [id]);

  const fetchAsset = () => {
    setLoading(true);
    apiFetch(`/assets/${id}`)
      .then((data) => {
        setAsset(data);
        setEditData({
          name: data.name,
          category: data.category,
          brand: data.brand || "",
          model: data.model || "",
          serialNumber: data.serialNumber || "",
          location: data.location,
          condition: data.condition,
          description: data.description || "",
          price: data.price?.toString() || "",
          imageUrl: data.imageUrl || ""
        });
      })
      .finally(() => setLoading(false));
  };

  const handleEdit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await apiFetch(`/assets/${id}`, {
        method: "PUT",
        body: JSON.stringify({
          ...editData,
          price: parseFloat(editData.price) || 0
        })
      });
      setIsEditModalOpen(false);
      fetchAsset();
    } catch (err: any) {
      alert(err.message);
    }
  };

  const handleEditImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        setEditData({ ...editData, imageUrl: reader.result as string });
      };
      reader.readAsDataURL(file);
    }
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

  const handleMaintenance = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await apiFetch("/maintenances", {
        method: "POST",
        body: JSON.stringify({ assetId: id, ...maintenanceData, cost: parseFloat(maintenanceData.cost) || 0 })
      });
      setIsMaintenanceModalOpen(false);
      fetchAsset();
    } catch (err: any) {
      alert(err.message);
    }
  };

  const handleLoan = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await apiFetch("/loans", {
        method: "POST",
        body: JSON.stringify({ assetId: id, ...loanData })
      });
      setIsLoanModalOpen(false);
      fetchAsset();
    } catch (err: any) {
      alert(err.message);
    }
  };

  const handleReturn = async (loanId: string) => {
    if (!confirm("Konfirmasi pengembalian aset?")) return;
    try {
      await apiFetch(`/loans/${loanId}/return`, { method: "POST" });
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

  const activeLoan = asset.loans.find((l: any) => l.status === "ACTIVE");

  return (
    <div className="space-y-8">
      <div className="flex items-center justify-between">
        <Link to="/assets" className="flex items-center gap-2 text-slate-500 hover:text-slate-900 transition-colors">
          <ArrowLeft size={18} />
          Kembali ke Daftar
        </Link>
        <div className="flex gap-3">
          {asset.status === "AVAILABLE" && (
            <button 
              onClick={() => setIsLoanModalOpen(true)}
              className="flex items-center gap-2 px-4 py-2 bg-indigo-600 text-white rounded-lg font-semibold hover:bg-indigo-700 transition-colors"
            >
              <UserPlus size={18} />
              Pinjamkan
            </button>
          )}
          {asset.status === "LOANED" && activeLoan && (
            <button 
              onClick={() => handleReturn(activeLoan.id)}
              className="flex items-center gap-2 px-4 py-2 bg-emerald-600 text-white rounded-lg font-semibold hover:bg-emerald-700 transition-colors"
            >
              <RotateCcw size={18} />
              Kembalikan
            </button>
          )}
          <button 
            onClick={() => setIsMaintenanceModalOpen(true)}
            className="flex items-center gap-2 px-4 py-2 bg-white border border-slate-200 rounded-lg text-slate-700 font-semibold hover:bg-slate-50 transition-colors"
          >
            <Wrench size={18} />
            Catat Servis
          </button>
          <button 
            onClick={() => setIsMutationModalOpen(true)}
            className="flex items-center gap-2 px-4 py-2 bg-white border border-slate-200 rounded-lg text-slate-700 font-semibold hover:bg-slate-50 transition-colors"
          >
            <MoveHorizontal size={18} />
            Mutasi
          </button>
          <button 
            onClick={() => setIsEditModalOpen(true)}
            className="p-2 text-slate-400 hover:text-blue-500 transition-colors"
          >
            <Edit2 size={20} />
          </button>
          {user?.role === "ADMIN" && (
            <button onClick={handleDelete} className="p-2 text-slate-400 hover:text-red-500 transition-colors">
              <Trash2 size={20} />
            </button>
          )}
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Main Info */}
        <div className="lg:col-span-2 space-y-8">
          <div className="bg-white rounded-2xl border border-slate-100 shadow-sm overflow-hidden">
            <div className="flex border-b border-slate-100">
              {["info", "mutations", "maintenance", "loans"].map((tab) => (
                <button
                  key={tab}
                  onClick={() => setActiveTab(tab)}
                  className={`px-6 py-4 text-sm font-bold uppercase tracking-wider transition-colors ${
                    activeTab === tab ? "text-emerald-600 border-b-2 border-emerald-600 bg-emerald-50/30" : "text-slate-400 hover:text-slate-600"
                  }`}
                >
                  {tab === "info" ? "Informasi" : tab === "mutations" ? "Mutasi" : tab === "maintenance" ? "Servis" : "Peminjaman"}
                </button>
              ))}
            </div>

            <div className="p-8">
              {activeTab === "info" && (
                <div className="space-y-8">
                  <div className="flex items-start justify-between">
                    <div className="flex gap-6">
                      {asset.imageUrl && (
                        <img src={asset.imageUrl} alt={asset.name} className="w-32 h-32 object-cover rounded-2xl border border-slate-100 shadow-sm" />
                      )}
                      <div>
                        <span className="px-3 py-1 bg-slate-100 text-slate-500 rounded-full text-[10px] font-bold uppercase tracking-wider mb-2 inline-block">
                          {asset.category}
                        </span>
                        <h1 className="text-3xl font-bold text-slate-900">{asset.name}</h1>
                        <p className="text-slate-500 font-mono mt-1">{asset.code}</p>
                      </div>
                    </div>
                    <div className={`px-4 py-2 rounded-xl text-xs font-bold uppercase tracking-widest flex items-center gap-2 ${
                      asset.status === "AVAILABLE" ? "bg-emerald-50 text-emerald-600" : 
                      asset.status === "LOANED" ? "bg-indigo-50 text-indigo-600" : "bg-blue-50 text-blue-600"
                    }`}>
                      {asset.status === "AVAILABLE" ? <CheckCircle2 size={16} /> : <AlertCircle size={16} />}
                      {asset.status.replace("_", " ")}
                    </div>
                  </div>

                  <div className="grid grid-cols-2 md:grid-cols-3 gap-8">
                    <div className="space-y-1">
                      <p className="text-xs font-bold text-slate-400 uppercase">Harga Perolehan</p>
                      <p className="font-semibold text-slate-900">Rp {asset.price?.toLocaleString("id-ID") || "-"}</p>
                    </div>
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
                      <p className="text-xs font-bold text-slate-400 uppercase">Jadwal Servis Berikutnya</p>
                      <p className={`font-semibold ${asset.nextServiceDate ? "text-amber-600" : "text-slate-900"}`}>
                        {asset.nextServiceDate ? new Date(asset.nextServiceDate).toLocaleDateString("id-ID") : "Belum dijadwalkan"}
                      </p>
                    </div>
                  </div>

                  {asset.status === "LOANED" && activeLoan && (
                    <div className="bg-indigo-50 border border-indigo-100 rounded-xl p-4 flex items-center justify-between">
                      <div>
                        <p className="text-xs font-bold text-indigo-400 uppercase tracking-wider mb-1">Sedang Dipinjam Oleh</p>
                        <p className="font-bold text-indigo-900">{activeLoan.borrowerName} ({activeLoan.borrowerDept})</p>
                        <p className="text-xs text-indigo-500 mt-0.5">Jatuh Tempo: {activeLoan.dueDate ? new Date(activeLoan.dueDate).toLocaleDateString("id-ID") : "N/A"}</p>
                      </div>
                      <div className="text-right">
                        <p className="text-xs font-bold text-indigo-400 uppercase tracking-wider mb-1">Tanggal Pinjam</p>
                        <p className="font-bold text-indigo-900">{new Date(activeLoan.loanDate).toLocaleDateString("id-ID")}</p>
                      </div>
                    </div>
                  )}

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
              )}

              {activeTab === "mutations" && (
                <div className="relative">
                  <div className="absolute left-4 top-4 bottom-4 w-0.5 bg-slate-100"></div>
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
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {activeTab === "maintenance" && (
                <div className="space-y-6">
                  {asset.maintenances.length === 0 ? (
                    <div className="text-center py-12">
                      <Wrench size={48} className="mx-auto text-slate-200 mb-4" />
                      <p className="text-slate-400">Belum ada catatan servis untuk aset ini.</p>
                    </div>
                  ) : asset.maintenances.map((m: any) => (
                    <div key={m.id} className="bg-white border border-slate-100 rounded-xl p-5 shadow-sm">
                      <div className="flex justify-between items-start mb-4">
                        <div>
                          <span className={`px-2 py-0.5 rounded text-[10px] font-bold uppercase tracking-wider ${
                            m.type === "REPAIR" ? "bg-red-100 text-red-600" : "bg-blue-100 text-blue-600"
                          }`}>
                            {m.type}
                          </span>
                          <h4 className="font-bold text-slate-900 mt-1">{new Date(m.date).toLocaleDateString("id-ID")}</h4>
                        </div>
                        <p className="font-bold text-slate-900">Rp {m.cost?.toLocaleString("id-ID") || 0}</p>
                      </div>
                      <p className="text-sm text-slate-600 mb-4">{m.description}</p>
                      <div className="flex justify-between items-center text-[10px] font-bold text-slate-400 uppercase tracking-widest">
                        <span>Teknisi: {m.performedBy || "N/A"}</span>
                        <span>Dicatat: {new Date(m.createdAt).toLocaleDateString("id-ID")}</span>
                      </div>
                    </div>
                  ))}
                </div>
              )}

              {activeTab === "loans" && (
                <div className="space-y-6">
                  {asset.loans.length === 0 ? (
                    <div className="text-center py-12">
                      <UserPlus size={48} className="mx-auto text-slate-200 mb-4" />
                      <p className="text-slate-400">Belum ada histori peminjaman.</p>
                    </div>
                  ) : asset.loans.map((l: any) => (
                    <div key={l.id} className={`border rounded-xl p-5 ${l.status === "ACTIVE" ? "bg-indigo-50/30 border-indigo-100" : "bg-white border-slate-100"}`}>
                      <div className="flex justify-between items-start mb-4">
                        <div>
                          <span className={`px-2 py-0.5 rounded text-[10px] font-bold uppercase tracking-wider ${
                            l.status === "ACTIVE" ? "bg-indigo-100 text-indigo-600" : "bg-slate-100 text-slate-600"
                          }`}>
                            {l.status}
                          </span>
                          <h4 className="font-bold text-slate-900 mt-1">{l.borrowerName}</h4>
                          <p className="text-xs text-slate-500">{l.borrowerDept}</p>
                        </div>
                        <div className="text-right">
                          <p className="text-xs font-bold text-slate-400 uppercase">Tgl Pinjam</p>
                          <p className="text-sm font-bold text-slate-900">{new Date(l.loanDate).toLocaleDateString("id-ID")}</p>
                        </div>
                      </div>
                      {l.notes && <p className="text-sm text-slate-600 mb-4 italic">"{l.notes}"</p>}
                      <div className="flex justify-between items-center text-[10px] font-bold text-slate-400 uppercase tracking-widest pt-4 border-t border-slate-100">
                        <span>Jatuh Tempo: {l.dueDate ? new Date(l.dueDate).toLocaleDateString("id-ID") : "N/A"}</span>
                        <span>Kembali: {l.returnDate ? new Date(l.returnDate).toLocaleDateString("id-ID") : "-"}</span>
                      </div>
                    </div>
                  ))}
                </div>
              )}
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
            <div className="bg-white p-6 rounded-xl flex flex-col items-center">
              <div className="mb-4 p-2 bg-white rounded-lg shadow-sm border border-slate-100">
                <QRCodeSVG value={asset.code} size={120} level="H" />
              </div>
              <p className="text-slate-900 font-mono font-bold text-lg">{asset.code}</p>
              <p className="text-slate-400 text-[10px] font-bold uppercase tracking-widest mt-1">Dinas Kominfo</p>
            </div>
            <button 
              onClick={() => window.print()}
              className="w-full mt-6 py-2 bg-emerald-500 text-slate-900 font-bold rounded-lg hover:bg-emerald-400 transition-colors text-sm"
            >
              Cetak Label
            </button>
          </div>
        </div>
      </div>

      {/* Edit Modal */}
      {isEditModalOpen && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-slate-900/50 backdrop-blur-sm">
          <div className="bg-white w-full max-w-lg rounded-2xl shadow-2xl overflow-hidden">
            <div className="p-6 border-b border-slate-100 flex justify-between items-center">
              <h2 className="text-xl font-bold text-slate-900">Edit Aset</h2>
              <button onClick={() => setIsEditModalOpen(false)} className="text-slate-400 hover:text-slate-600"><Plus className="rotate-45" /></button>
            </div>
            <form onSubmit={handleEdit} className="p-6 space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold text-slate-500 uppercase mb-1">Nama Perangkat</label>
                  <input
                    required
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg outline-none focus:ring-2 focus:ring-emerald-500"
                    value={editData.name}
                    onChange={e => setEditData({...editData, name: e.target.value})}
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-500 uppercase mb-1">Kategori</label>
                  <input
                    required
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg outline-none focus:ring-2 focus:ring-emerald-500"
                    value={editData.category}
                    onChange={e => setEditData({...editData, category: e.target.value})}
                  />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold text-slate-500 uppercase mb-1">Merk</label>
                  <input
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg outline-none focus:ring-2 focus:ring-emerald-500"
                    value={editData.brand}
                    onChange={e => setEditData({...editData, brand: e.target.value})}
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-500 uppercase mb-1">Model</label>
                  <input
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg outline-none focus:ring-2 focus:ring-emerald-500"
                    value={editData.model}
                    onChange={e => setEditData({...editData, model: e.target.value})}
                  />
                </div>
              </div>
              <div>
                <label className="block text-xs font-bold text-slate-500 uppercase mb-1">Serial Number</label>
                <input
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg outline-none focus:ring-2 focus:ring-emerald-500"
                  value={editData.serialNumber}
                  onChange={e => setEditData({...editData, serialNumber: e.target.value})}
                />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold text-slate-500 uppercase mb-1">Lokasi</label>
                  <input
                    required
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg outline-none focus:ring-2 focus:ring-emerald-500"
                    value={editData.location}
                    onChange={e => setEditData({...editData, location: e.target.value})}
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-500 uppercase mb-1">Kondisi</label>
                  <select
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg outline-none focus:ring-2 focus:ring-emerald-500"
                    value={editData.condition}
                    onChange={e => setEditData({...editData, condition: e.target.value})}
                  >
                    <option value="GOOD">Baik</option>
                    <option value="FAIR">Cukup</option>
                    <option value="POOR">Buruk</option>
                  </select>
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold text-slate-500 uppercase mb-1">Harga Perolehan (Rp)</label>
                  <input
                    type="number"
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg outline-none focus:ring-2 focus:ring-emerald-500"
                    value={editData.price}
                    onChange={e => setEditData({...editData, price: e.target.value})}
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-500 uppercase mb-1">Gambar Aset</label>
                  <input
                    type="file"
                    accept="image/*"
                    className="w-full text-xs text-slate-500 file:mr-4 file:py-2 file:px-4 file:rounded-lg file:border-0 file:text-xs file:font-semibold file:bg-emerald-50 file:text-emerald-700 hover:file:bg-emerald-100"
                    onChange={handleEditImageChange}
                  />
                </div>
              </div>
              {editData.imageUrl && (
                <div className="mt-2">
                  <img src={editData.imageUrl} alt="Preview" className="h-20 w-20 object-cover rounded-lg border border-slate-200" />
                </div>
              )}
              <div>
                <label className="block text-xs font-bold text-slate-500 uppercase mb-1">Deskripsi</label>
                <textarea
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg outline-none focus:ring-2 focus:ring-emerald-500 min-h-[80px]"
                  value={editData.description}
                  onChange={e => setEditData({...editData, description: e.target.value})}
                />
              </div>
              <div className="flex justify-end gap-3 pt-4">
                <button type="button" onClick={() => setIsEditModalOpen(false)} className="px-4 py-2 text-slate-600 font-semibold hover:bg-slate-50 rounded-lg">Batal</button>
                <button type="submit" className="px-6 py-2 bg-slate-900 text-white font-semibold rounded-lg hover:bg-slate-800">Simpan Perubahan</button>
              </div>
            </form>
          </div>
        </div>
      )}

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
                <button type="button" onClick={() => setIsMutationModalOpen(false)} className="px-4 py-2 text-slate-600 font-semibold hover:bg-slate-50 rounded-lg">Batal</button>
                <button type="submit" className="px-6 py-2 bg-slate-900 text-white font-semibold rounded-lg hover:bg-slate-800">Proses Mutasi</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Maintenance Modal */}
      {isMaintenanceModalOpen && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-slate-900/50 backdrop-blur-sm">
          <div className="bg-white w-full max-w-md rounded-2xl shadow-2xl overflow-hidden">
            <div className="p-6 border-b border-slate-100 flex justify-between items-center">
              <h2 className="text-xl font-bold text-slate-900">Catat Servis / Maintenance</h2>
              <button onClick={() => setIsMaintenanceModalOpen(false)} className="text-slate-400 hover:text-slate-600"><Plus className="rotate-45" /></button>
            </div>
            <form onSubmit={handleMaintenance} className="p-6 space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold text-slate-500 uppercase mb-1">Tipe Servis</label>
                  <select
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg outline-none focus:ring-2 focus:ring-emerald-500"
                    value={maintenanceData.type}
                    onChange={e => setMaintenanceData({...maintenanceData, type: e.target.value})}
                  >
                    <option value="ROUTINE">Rutin</option>
                    <option value="REPAIR">Perbaikan</option>
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-500 uppercase mb-1">Biaya (Rp)</label>
                  <input
                    type="number"
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg outline-none focus:ring-2 focus:ring-emerald-500"
                    placeholder="0"
                    value={maintenanceData.cost}
                    onChange={e => setMaintenanceData({...maintenanceData, cost: e.target.value})}
                  />
                </div>
              </div>
              <div>
                <label className="block text-xs font-bold text-slate-500 uppercase mb-1">Keterangan Servis</label>
                <textarea
                  required
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg outline-none focus:ring-2 focus:ring-emerald-500 min-h-[80px]"
                  placeholder="Detail pengerjaan..."
                  value={maintenanceData.description}
                  onChange={e => setMaintenanceData({...maintenanceData, description: e.target.value})}
                />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold text-slate-500 uppercase mb-1">Teknisi / Vendor</label>
                  <input
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg outline-none focus:ring-2 focus:ring-emerald-500"
                    placeholder="Nama teknisi"
                    value={maintenanceData.performedBy}
                    onChange={e => setMaintenanceData({...maintenanceData, performedBy: e.target.value})}
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-500 uppercase mb-1">Jadwal Berikutnya</label>
                  <input
                    type="date"
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg outline-none focus:ring-2 focus:ring-emerald-500"
                    value={maintenanceData.nextServiceDate}
                    onChange={e => setMaintenanceData({...maintenanceData, nextServiceDate: e.target.value})}
                  />
                </div>
              </div>
              <div className="flex justify-end gap-3 pt-4">
                <button type="button" onClick={() => setIsMaintenanceModalOpen(false)} className="px-4 py-2 text-slate-600 font-semibold hover:bg-slate-50 rounded-lg">Batal</button>
                <button type="submit" className="px-6 py-2 bg-slate-900 text-white font-semibold rounded-lg hover:bg-slate-800">Simpan Catatan</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Loan Modal */}
      {isLoanModalOpen && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-slate-900/50 backdrop-blur-sm">
          <div className="bg-white w-full max-w-md rounded-2xl shadow-2xl overflow-hidden">
            <div className="p-6 border-b border-slate-100 flex justify-between items-center">
              <h2 className="text-xl font-bold text-slate-900">Peminjaman Aset</h2>
              <button onClick={() => setIsLoanModalOpen(false)} className="text-slate-400 hover:text-slate-600"><Plus className="rotate-45" /></button>
            </div>
            <form onSubmit={handleLoan} className="p-6 space-y-4">
              <div>
                <label className="block text-xs font-bold text-slate-500 uppercase mb-1">Nama Peminjam</label>
                <input
                  required
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg outline-none focus:ring-2 focus:ring-emerald-500"
                  placeholder="Nama lengkap"
                  value={loanData.borrowerName}
                  onChange={e => setLoanData({...loanData, borrowerName: e.target.value})}
                />
              </div>
              <div>
                <label className="block text-xs font-bold text-slate-500 uppercase mb-1">Bidang / Instansi</label>
                <input
                  required
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg outline-none focus:ring-2 focus:ring-emerald-500"
                  placeholder="Contoh: Bidang TIK"
                  value={loanData.borrowerDept}
                  onChange={e => setLoanData({...loanData, borrowerDept: e.target.value})}
                />
              </div>
              <div>
                <label className="block text-xs font-bold text-slate-500 uppercase mb-1">Jatuh Tempo Kembali</label>
                <input
                  type="date"
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg outline-none focus:ring-2 focus:ring-emerald-500"
                  value={loanData.dueDate}
                  onChange={e => setLoanData({...loanData, dueDate: e.target.value})}
                />
              </div>
              <div>
                <label className="block text-xs font-bold text-slate-500 uppercase mb-1">Catatan</label>
                <textarea
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg outline-none focus:ring-2 focus:ring-emerald-500 min-h-[80px]"
                  placeholder="Tujuan peminjaman..."
                  value={loanData.notes}
                  onChange={e => setLoanData({...loanData, notes: e.target.value})}
                />
              </div>
              <div className="flex justify-end gap-3 pt-4">
                <button type="button" onClick={() => setIsLoanModalOpen(false)} className="px-4 py-2 text-slate-600 font-semibold hover:bg-slate-50 rounded-lg">Batal</button>
                <button type="submit" className="px-6 py-2 bg-indigo-600 text-white font-semibold rounded-lg hover:bg-indigo-700">Proses Pinjam</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
