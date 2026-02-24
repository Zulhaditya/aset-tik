import React, { useState, useEffect } from "react";
import { apiFetch } from "../lib/api";
import { Search, Plus, Filter, MoreVertical, Eye, Edit2, Trash2, ChevronRight } from "lucide-react";
import { Link } from "react-router-dom";

export default function AssetList() {
  const [assets, setAssets] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("ALL");
  const [categoryFilter, setCategoryFilter] = useState("ALL");
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [user, setUser] = useState<any>(null);
  const [formData, setFormData] = useState({
    code: "",
    name: "",
    category: "Komputer",
    location: "",
    status: "AVAILABLE",
    condition: "GOOD",
    price: "",
    imageUrl: ""
  });

  useEffect(() => {
    fetchAssets();
    const savedUser = localStorage.getItem("user");
    if (savedUser) setUser(JSON.parse(savedUser));
  }, []);

  const fetchAssets = () => {
    setLoading(true);
    apiFetch("/assets")
      .then(setAssets)
      .finally(() => setLoading(false));
  };

  const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        setFormData({ ...formData, imageUrl: reader.result as string });
      };
      reader.readAsDataURL(file);
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm("Apakah Anda yakin ingin menghapus aset ini?")) return;
    try {
      await apiFetch(`/assets/${id}`, { method: "DELETE" });
      fetchAssets();
    } catch (err: any) {
      alert(err.message);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await apiFetch("/assets", {
        method: "POST",
        body: JSON.stringify({
          ...formData,
          price: parseFloat(formData.price) || 0
        })
      });
      setIsModalOpen(false);
      setFormData({
        code: "",
        name: "",
        category: "Komputer",
        location: "",
        status: "AVAILABLE",
        condition: "GOOD",
        price: "",
        imageUrl: ""
      });
      fetchAssets();
    } catch (err: any) {
      alert(err.message);
    }
  };

  const filteredAssets = assets.filter(a => {
    const matchesSearch = a.name.toLowerCase().includes(search.toLowerCase()) || 
                         a.code.toLowerCase().includes(search.toLowerCase()) ||
                         a.location.toLowerCase().includes(search.toLowerCase());
    const matchesStatus = statusFilter === "ALL" || a.status === statusFilter;
    const matchesCategory = categoryFilter === "ALL" || a.category === categoryFilter;
    
    return matchesSearch && matchesStatus && matchesCategory;
  });

  const getStatusColor = (status: string) => {
    switch (status) {
      case "AVAILABLE": return "bg-emerald-100 text-emerald-700";
      case "IN_USE": return "bg-blue-100 text-blue-700";
      case "REPAIRING": return "bg-amber-100 text-amber-700";
      case "BROKEN": return "bg-red-100 text-red-700";
      default: return "bg-slate-100 text-slate-700";
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">Daftar Aset TIK</h1>
          <p className="text-slate-500">Kelola dan pantau seluruh perangkat TIK Kominfo.</p>
        </div>
        <button 
          onClick={() => setIsModalOpen(true)}
          className="bg-slate-900 text-white px-4 py-2 rounded-lg flex items-center gap-2 hover:bg-slate-800 transition-colors"
        >
          <Plus size={18} />
          Tambah Aset Baru
        </button>
      </div>

      {/* Filters & Search */}
      <div className="bg-white p-4 rounded-xl border border-slate-100 shadow-sm flex flex-col md:flex-row gap-4">
        <div className="flex-1 relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
          <input
            type="text"
            placeholder="Cari nama aset, kode, atau lokasi..."
            className="w-full pl-10 pr-4 py-2 bg-slate-50 border border-slate-200 rounded-lg focus:ring-2 focus:ring-emerald-500 outline-none"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>
        <div className="flex gap-2">
          <select 
            className="px-4 py-2 border border-slate-200 rounded-lg text-slate-600 bg-white outline-none focus:ring-2 focus:ring-emerald-500"
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
          >
            <option value="ALL">Semua Status</option>
            <option value="AVAILABLE">Tersedia</option>
            <option value="IN_USE">Digunakan</option>
            <option value="LOANED">Dipinjam</option>
            <option value="REPAIRING">Perbaikan</option>
            <option value="BROKEN">Rusak</option>
          </select>
          <select 
            className="px-4 py-2 border border-slate-200 rounded-lg text-slate-600 bg-white outline-none focus:ring-2 focus:ring-emerald-500"
            value={categoryFilter}
            onChange={(e) => setCategoryFilter(e.target.value)}
          >
            <option value="ALL">Semua Kategori</option>
            <option value="Komputer">Komputer</option>
            <option value="Laptop">Laptop</option>
            <option value="Server">Server</option>
            <option value="Router">Router</option>
            <option value="Switch">Switch</option>
            <option value="Access Point">Access Point</option>
            <option value="Printer">Printer</option>
          </select>
        </div>
      </div>

      {/* Table */}
      <div className="bg-white rounded-xl border border-slate-100 shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-slate-50 border-b border-slate-100">
                <th className="px-6 py-4 text-xs font-bold text-slate-500 uppercase tracking-wider">Kode Aset</th>
                <th className="px-6 py-4 text-xs font-bold text-slate-500 uppercase tracking-wider">Nama Perangkat</th>
                <th className="px-6 py-4 text-xs font-bold text-slate-500 uppercase tracking-wider">Kategori</th>
                <th className="px-6 py-4 text-xs font-bold text-slate-500 uppercase tracking-wider">Lokasi</th>
                <th className="px-6 py-4 text-xs font-bold text-slate-500 uppercase tracking-wider">Status</th>
                <th className="px-6 py-4 text-xs font-bold text-slate-500 uppercase tracking-wider text-right">Aksi</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-50">
              {loading ? (
                [1,2,3,4,5].map(i => (
                  <tr key={i} className="animate-pulse">
                    <td colSpan={6} className="px-6 py-4"><div className="h-8 bg-slate-100 rounded"></div></td>
                  </tr>
                ))
              ) : filteredAssets.length === 0 ? (
                <tr>
                  <td colSpan={6} className="px-6 py-12 text-center text-slate-400">Tidak ada aset ditemukan.</td>
                </tr>
              ) : filteredAssets.map((asset) => (
                <tr key={asset.id} className="hover:bg-slate-50 transition-colors group">
                  <td className="px-6 py-4">
                    <span className="font-mono text-xs font-bold text-slate-400">{asset.code}</span>
                  </td>
                  <td className="px-6 py-4">
                    <p className="font-semibold text-slate-900">{asset.name}</p>
                    <p className="text-xs text-slate-400">{asset.brand} {asset.model}</p>
                  </td>
                  <td className="px-6 py-4">
                    <span className="text-sm text-slate-600">{asset.category}</span>
                  </td>
                  <td className="px-6 py-4">
                    <span className="text-sm text-slate-600">{asset.location}</span>
                  </td>
                  <td className="px-6 py-4">
                    <span className={`px-2.5 py-1 rounded-full text-[10px] font-bold uppercase tracking-wide ${getStatusColor(asset.status)}`}>
                      {asset.status.replace("_", " ")}
                    </span>
                  </td>
                  <td className="px-6 py-4 text-right flex justify-end gap-2">
                    <Link to={`/assets/${asset.id}`} className="inline-flex items-center justify-center w-8 h-8 rounded-lg text-slate-400 hover:bg-slate-100 hover:text-slate-900 transition-colors">
                      <Eye size={18} />
                    </Link>
                    {user?.role === "ADMIN" && (
                      <button 
                        onClick={() => handleDelete(asset.id)}
                        className="inline-flex items-center justify-center w-8 h-8 rounded-lg text-slate-400 hover:bg-red-50 hover:text-red-600 transition-colors"
                      >
                        <Trash2 size={18} />
                      </button>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Add Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-slate-900/50 backdrop-blur-sm">
          <div className="bg-white w-full max-w-lg rounded-2xl shadow-2xl overflow-hidden">
            <div className="p-6 border-b border-slate-100 flex justify-between items-center">
              <h2 className="text-xl font-bold text-slate-900">Tambah Aset Baru</h2>
              <button onClick={() => setIsModalOpen(false)} className="text-slate-400 hover:text-slate-600"><Plus className="rotate-45" /></button>
            </div>
            <form onSubmit={handleSubmit} className="p-6 space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold text-slate-500 uppercase mb-1">Kode Aset</label>
                  <input
                    required
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg outline-none focus:ring-2 focus:ring-emerald-500"
                    placeholder="TIK-2024-XXX"
                    value={formData.code}
                    onChange={e => setFormData({...formData, code: e.target.value})}
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-500 uppercase mb-1">Kategori</label>
                  <select
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg outline-none focus:ring-2 focus:ring-emerald-500"
                    value={formData.category}
                    onChange={e => setFormData({...formData, category: e.target.value})}
                  >
                    <option>Komputer</option>
                    <option>Laptop</option>
                    <option>Server</option>
                    <option>Router</option>
                    <option>Switch</option>
                    <option>Access Point</option>
                    <option>Printer</option>
                  </select>
                </div>
              </div>
              <div>
                <label className="block text-xs font-bold text-slate-500 uppercase mb-1">Nama Perangkat</label>
                <input
                  required
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg outline-none focus:ring-2 focus:ring-emerald-500"
                  placeholder="Contoh: PC Kerja Admin"
                  value={formData.name}
                  onChange={e => setFormData({...formData, name: e.target.value})}
                />
              </div>
              <div>
                <label className="block text-xs font-bold text-slate-500 uppercase mb-1">Lokasi</label>
                <input
                  required
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg outline-none focus:ring-2 focus:ring-emerald-500"
                  placeholder="Contoh: Ruang IT Lt. 1"
                  value={formData.location}
                  onChange={e => setFormData({...formData, location: e.target.value})}
                />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold text-slate-500 uppercase mb-1">Harga Perolehan (Rp)</label>
                  <input
                    type="number"
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg outline-none focus:ring-2 focus:ring-emerald-500"
                    placeholder="0"
                    value={formData.price}
                    onChange={e => setFormData({...formData, price: e.target.value})}
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-500 uppercase mb-1">Gambar Aset</label>
                  <input
                    type="file"
                    accept="image/*"
                    className="w-full text-xs text-slate-500 file:mr-4 file:py-2 file:px-4 file:rounded-lg file:border-0 file:text-xs file:font-semibold file:bg-emerald-50 file:text-emerald-700 hover:file:bg-emerald-100"
                    onChange={handleImageChange}
                  />
                </div>
              </div>
              {formData.imageUrl && (
                <div className="mt-2">
                  <img src={formData.imageUrl} alt="Preview" className="h-20 w-20 object-cover rounded-lg border border-slate-200" />
                </div>
              )}
              <div className="flex justify-end gap-3 pt-4">
                <button 
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="px-4 py-2 text-slate-600 font-semibold hover:bg-slate-50 rounded-lg transition-colors"
                >
                  Batal
                </button>
                <button 
                  type="submit"
                  className="px-6 py-2 bg-slate-900 text-white font-semibold rounded-lg hover:bg-slate-800 transition-colors"
                >
                  Simpan Aset
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
