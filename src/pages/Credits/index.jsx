import React, { useState, useEffect } from 'react';
import axios from 'axios';
import NavigationHeader from '../../components/ui/NavigationHeader';
import BreadcrumbNavigation from '../../components/ui/BreadcrumbNavigation';
import Icon from '../../components/AppIcon';
import { useTheme } from '../../contexts/ThemeContext';
import { toast, Toaster } from 'react-hot-toast';

const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:4000';

const Credits = () => {
  const { theme } = useTheme();
  const [credits, setCredits] = useState([]);
  const [loading, setLoading] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingId, setEditingId] = useState(null);

  // Form State
  const [formData, setFormData] = useState({
    employee_name: '',
    amount: '',
    description: '',
    credit_date: new Date().toISOString().split('T')[0],
    due_date: '',
    status: 'unpaid'
  });
  const [installmentAmount, setInstallmentAmount] = useState('');

  const fetchCredits = async () => {
    try {
      const token = localStorage.getItem('token');
      const response = await axios.get(`${API_BASE_URL}/api/credits`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      setCredits(response.data.data);
    } catch (error) {
      console.error('Error fetching credits:', error);
      toast.error('Gagal memuat data kasbon');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchCredits();
  }, []);

  const handleSubmit = async (e) => {
    e.preventDefault();
    const token = localStorage.getItem('token');

    try {
      if (editingId) {
        let finalData = { ...formData };

        // Logika Cicilan
        if (installmentAmount && parseFloat(installmentAmount) > 0) {
          const payment = parseFloat(installmentAmount);
          const currentDebt = parseFloat(formData.amount);

          // Validasi agar tidak bayar lebih dari hutang
          if (payment > currentDebt) {
            toast.error('Jumlah bayar melebihi sisa hutang');
            return;
          }

          const remaining = currentDebt - payment;

          if (remaining <= 0) {
            finalData.amount = 0;
            finalData.status = 'paid';
            finalData.description = `${finalData.description ? finalData.description + ' | ' : ''}Lunas via Cicilan`;
          } else {
            finalData.amount = remaining;
            finalData.status = 'partial';
            finalData.description = `${finalData.description ? finalData.description + ' | ' : ''}Dicicil: ${payment} (Sisa: ${remaining})`;
          }
        }

        await axios.put(`${API_BASE_URL}/api/credits/${editingId}`, finalData, {
          headers: { Authorization: `Bearer ${token}` }
        });
        toast.success('Data berhasil diperbarui');
      } else {
        await axios.post(`${API_BASE_URL}/api/credits`, formData, {
          headers: { Authorization: `Bearer ${token}` }
        });
        toast.success('Kasbon berhasil ditambahkan');
      }
      setIsModalOpen(false);
      resetForm();
      fetchCredits();
    } catch (error) {
      console.error('Error saving credit:', error);
      toast.error('Gagal menyimpan data');
    }
  };

  const handleDelete = async (id) => {
    if (!window.confirm('Yakin ingin menghapus data ini?')) return;

    try {
      const token = localStorage.getItem('token');
      await axios.delete(`${API_BASE_URL}/api/credits/${id}`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      toast.success('Data berhasil dihapus');
      fetchCredits();
    } catch (error) {
      toast.error('Gagal menghapus data');
    }
  };

  const formatDateForInput = (dateString) => {
    if (!dateString) return '';
    const date = new Date(dateString);
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const day = String(date.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
  };

  const handleEdit = (credit) => {
    setEditingId(credit.id);
    setFormData({
      employee_name: credit.employee_name,
      amount: credit.amount,
      description: credit.description || '',
      credit_date: formatDateForInput(credit.credit_date),
      due_date: credit.due_date ? formatDateForInput(credit.due_date) : '',
      status: credit.status
    });
    setIsModalOpen(true);
    setInstallmentAmount('');
  };

  const resetForm = () => {
    setEditingId(null);
    setFormData({
      employee_name: '',
      amount: '',
      description: '',
      credit_date: formatDateForInput(new Date()),
      due_date: '',
      status: 'unpaid'
    });
    setInstallmentAmount('');
  };

  // Calculations
  const totalUnpaid = credits
    .filter(c => c.status === 'unpaid' || c.status === 'partial')
    .reduce((sum, c) => sum + parseFloat(c.amount), 0);

  const totalCredits = credits.length;

  return (
    <div className={`flex flex-col min-h-screen ${theme === 'default' ? 'bg-background' : 'bg-transparent'}`}>
      <Toaster position="top-right" />
      {theme === 'default' && <NavigationHeader headerTitle="Piutang Karyawan" />}

      <main className={`flex-grow px-4 lg:px-6 pb-20 overflow-auto ${theme === 'default' ? 'pt-24' : 'pt-4'}`}>
        <div className={theme === 'default' ? "max-w-7xl mx-auto" : ""}>
          {/* Breadcrumb & Header */}
          <div className="flex flex-col lg:flex-row justify-between items-start lg:items-center mb-6 gap-4">
            <div className="hidden md:block">
              <BreadcrumbNavigation paths={[
                { name: 'Beranda', path: '/main-dashboard' },
                { name: 'Keuangan', path: '#' },
                { name: 'Piutang Karyawan', path: '/credits' }
              ]} />
            </div>

            <div className="w-full lg:w-auto">
              <h1 className="text-2xl lg:text-3xl font-bold text-text-primary mb-1">
                Piutang Karyawan
              </h1>
              <p className="text-text-secondary text-sm">Kelola data kasbon dan pinjaman karyawan.</p>
            </div>

            <button
              onClick={() => { resetForm(); setIsModalOpen(true); }}
              className="bg-primary hover:bg-primary/90 text-primary-foreground font-bold py-2.5 px-6 rounded-xl shadow-lg shadow-primary/20 flex items-center gap-2 transition-all active:scale-95 w-full lg:w-auto justify-center"
            >
              <Icon name="Plus" size={20} />
              Tambah Kasbon
            </button>
          </div>

          {/* Summary Cards */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 mb-8">
            <div className="bg-white dark:bg-slate-800 p-6 rounded-3xl shadow-sm border border-gray-100 dark:border-slate-700 flex items-center gap-4">
              <div className="p-3 bg-red-50 dark:bg-red-900/20 rounded-2xl">
                <Icon name="Wallet" className="text-red-500" size={24} />
              </div>
              <div>
                <p className="text-sm text-gray-500 font-medium">Total Belum Lunas</p>
                <h3 className="text-2xl font-black text-gray-900 dark:text-gray-100">
                  Rp {totalUnpaid.toLocaleString('id-ID')}
                </h3>
              </div>
            </div>

            <div className="bg-white dark:bg-slate-800 p-6 rounded-3xl shadow-sm border border-gray-100 dark:border-slate-700 flex items-center gap-4">
              <div className="p-3 bg-blue-50 dark:bg-blue-900/20 rounded-2xl">
                <Icon name="Users" className="text-blue-500" size={24} />
              </div>
              <div>
                <p className="text-sm text-gray-500 font-medium">Total Transaksi</p>
                <h3 className="text-2xl font-black text-gray-900 dark:text-gray-100">
                  {totalCredits}
                </h3>
              </div>
            </div>
          </div>

          {/* List Data */}
          <div className="bg-white dark:bg-slate-800 rounded-3xl shadow-sm border border-gray-100 dark:border-slate-700 overflow-hidden">
            <div className="p-6 border-b border-gray-100 dark:border-slate-700">
              <h3 className="font-bold text-lg text-text-primary">Daftar Kasbon Terbaru</h3>
            </div>

            {loading ? (
              <div className="p-8 text-center text-gray-500">Memuat data...</div>
            ) : credits.length === 0 ? (
              <div className="p-10 text-center flex flex-col items-center justify-center text-gray-400">
                <Icon name="FileText" size={48} className="mb-4 opacity-20" />
                <p>Belum ada data kasbon.</p>
              </div>
            ) : (
              <>
                {/* Desktop View Table */}
                <div className="hidden md:block overflow-x-auto">
                  <table className="w-full text-left border-collapse">
                    <thead className="bg-gray-50 dark:bg-slate-700/50">
                      <tr>
                        <th className="p-4 text-xs font-bold text-gray-500 uppercase tracking-wider">Tanggal</th>
                        <th className="p-4 text-xs font-bold text-gray-500 uppercase tracking-wider">Karyawan</th>
                        <th className="p-4 text-xs font-bold text-gray-500 uppercase tracking-wider">Keterangan</th>
                        <th className="p-4 text-xs font-bold text-gray-500 uppercase tracking-wider text-right">Jumlah</th>
                        <th className="p-4 text-xs font-bold text-gray-500 uppercase tracking-wider text-center">Status</th>
                        <th className="p-4 text-xs font-bold text-gray-500 uppercase tracking-wider text-center">Aksi</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-100 dark:divide-slate-700">
                      {credits.map((item) => (
                        <tr key={item.id} className="hover:bg-gray-50/50 dark:hover:bg-slate-700/30 transition-colors">
                          <td className="p-4 text-sm font-medium whitespace-nowrap">
                            {new Date(item.credit_date).toLocaleDateString('id-ID', { day: 'numeric', month: 'short', year: 'numeric' })}
                          </td>
                          <td className="p-4 text-sm font-bold text-gray-900 dark:text-gray-100">{item.employee_name}</td>
                          <td className="p-4 text-sm text-gray-500 max-w-xs truncate">{item.description || '-'}</td>
                          <td className="p-4 text-sm font-bold text-right text-red-500">
                            Rp {parseFloat(item.amount).toLocaleString('id-ID')}
                          </td>
                          <td className="p-4 text-center">
                            <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${item.status === 'paid' ? 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400' :
                              item.status === 'partial' ? 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-400' :
                                'bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-400'
                              }`}>
                              {item.status === 'paid' ? 'Lunas' : item.status === 'unpaid' ? 'Belum Lunas' : 'Sebagian'}
                            </span>
                          </td>
                          <td className="p-4 text-center">
                            <div className="flex items-center justify-center gap-2">
                              <button
                                onClick={() => handleEdit(item)}
                                className="p-2 text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
                                title="Edit"
                              >
                                <Icon name="Edit" size={16} />
                              </button>
                              <button
                                onClick={() => handleDelete(item.id)}
                                className="p-2 text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                                title="Hapus"
                              >
                                <Icon name="Trash" size={16} />
                              </button>
                            </div>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>

                {/* Mobile View Cards */}
                <div className="md:hidden space-y-4 p-4">
                  {credits.map((item) => (
                    <div key={item.id} className="bg-white dark:bg-slate-800 border-b last:border-0 dark:border-slate-700 pb-4 last:pb-0 mb-4 last:mb-0">
                      <div className="flex justify-between items-start mb-2">
                        <div className="flex flex-col">
                          <span className="text-xs text-gray-400 mb-1">
                            {new Date(item.credit_date).toLocaleDateString('id-ID', { day: 'numeric', month: 'long', year: 'numeric' })}
                          </span>
                          <h4 className="font-bold text-text-primary text-lg">{item.employee_name}</h4>
                        </div>
                        <span className={`inline-flex items-center px-2 py-1 rounded-lg text-[10px] font-bold uppercase tracking-wider ${item.status === 'paid' ? 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400' :
                          item.status === 'partial' ? 'bg-yellow-100 text-yellow-700 dark:bg-yellow-900/30 dark:text-yellow-400' :
                            'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400'
                          }`}>
                          {item.status === 'paid' ? 'Lunas' : item.status === 'unpaid' ? 'Belum Lunas' : 'Sebagian'}
                        </span>
                      </div>

                      <div className="bg-gray-50 dark:bg-slate-700/30 p-3 rounded-xl mb-3">
                        <p className="text-sm text-gray-600 dark:text-gray-300 italic">
                          "{item.description || 'Tidak ada keterangan'}"
                        </p>
                      </div>

                      <div className="flex justify-between items-center">
                        <div>
                          <p className="text-xs text-gray-500 mb-0.5">Jumlah Pinjaman</p>
                          <p className="font-black text-red-500 text-lg">Rp {parseFloat(item.amount).toLocaleString('id-ID')}</p>
                        </div>
                        <div className="flex gap-2">
                          <button
                            onClick={() => handleEdit(item)}
                            className="p-2.5 bg-blue-50 text-blue-600 rounded-xl hover:bg-blue-100 dark:bg-blue-900/20 dark:text-blue-400"
                          >
                            <Icon name="Edit" size={18} />
                          </button>
                          <button
                            onClick={() => handleDelete(item.id)}
                            className="p-2.5 bg-red-50 text-red-600 rounded-xl hover:bg-red-100 dark:bg-red-900/20 dark:text-red-400"
                          >
                            <Icon name="Trash" size={18} />
                          </button>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </>
            )}
          </div>
        </div>
      </main>

      {/* Modal Form */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm animate-in fade-in duration-200">
          <div className="bg-white dark:bg-slate-800 rounded-3xl shadow-xl w-full max-w-md overflow-hidden animate-in zoom-in-95 duration-200">
            <div className="p-6 border-b border-gray-100 dark:border-slate-700 flex justify-between items-center">
              <h3 className="text-xl font-bold">{editingId ? 'Edit Kasbon' : 'Tambah Kasbon Baru'}</h3>
              <button onClick={() => setIsModalOpen(false)} className="text-gray-400 hover:text-gray-600">
                <Icon name="X" size={24} />
              </button>
            </div>

            <form onSubmit={handleSubmit} className="p-6 space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Nama Karyawan</label>
                <input
                  type="text"
                  required
                  className="w-full px-4 py-2 rounded-xl border border-gray-200 dark:border-slate-600 bg-gray-50 dark:bg-slate-700 focus:outline-none focus:ring-2 focus:ring-primary/50"
                  value={formData.employee_name}
                  onChange={(e) => setFormData({ ...formData, employee_name: e.target.value })}
                  placeholder="Contoh: Asep"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Jumlah Kasbon</label>
                <input
                  type="number"
                  required
                  min="1"
                  className="w-full px-4 py-2 rounded-xl border border-gray-200 dark:border-slate-600 bg-gray-50 dark:bg-slate-700 focus:outline-none focus:ring-2 focus:ring-primary/50"
                  value={formData.amount}
                  onChange={(e) => setFormData({ ...formData, amount: e.target.value })}
                  placeholder="Rp"
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Tanggal</label>
                  <input
                    type="date"
                    required
                    className="w-full px-4 py-2 rounded-xl border border-gray-200 dark:border-slate-600 bg-gray-50 dark:bg-slate-700 focus:outline-none focus:ring-2 focus:ring-primary/50"
                    value={formData.credit_date}
                    onChange={(e) => setFormData({ ...formData, credit_date: e.target.value })}
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Jatuh Tempo (Opsional)</label>
                  <input
                    type="date"
                    className="w-full px-4 py-2 rounded-xl border border-gray-200 dark:border-slate-600 bg-gray-50 dark:bg-slate-700 focus:outline-none focus:ring-2 focus:ring-primary/50"
                    value={formData.due_date}
                    onChange={(e) => setFormData({ ...formData, due_date: e.target.value })}
                  />
                </div>
              </div>

              {editingId && (
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Status</label>
                  <select
                    className="w-full px-4 py-2 rounded-xl border border-gray-200 dark:border-slate-600 bg-gray-50 dark:bg-slate-700 focus:outline-none focus:ring-2 focus:ring-primary/50"
                    value={formData.status}
                    onChange={(e) => setFormData({ ...formData, status: e.target.value })}
                  >
                    <option value="unpaid">Belum Lunas</option>
                    <option value="partial">Dicicil</option>
                    <option value="paid">Lunas</option>
                  </select>
                </div>
              )}

              {/* Input Cicilan - Hanya muncul saat Edit dan Status belum Lunas */}
              {editingId && formData.status !== 'paid' && (
                <div className="bg-green-50 dark:bg-green-900/10 p-4 rounded-xl border border-green-100 dark:border-green-800/30">
                  <label className="block text-sm font-bold text-green-700 dark:text-green-400 mb-1">
                    Bayar Cicilan / Pelunasan
                  </label>
                  <div className="flex items-center gap-2">
                    <div className="relative flex-grow">
                      <span className="absolute left-3 top-2.5 text-gray-500">Rp</span>
                      <input
                        type="number"
                        className="w-full pl-10 pr-4 py-2 rounded-lg border border-green-200 dark:border-green-800 bg-white dark:bg-slate-800 focus:outline-none focus:ring-2 focus:ring-green-500/50"
                        value={installmentAmount}
                        onChange={(e) => setInstallmentAmount(e.target.value)}
                        placeholder="0"
                        max={formData.amount}
                      />
                    </div>
                    <div className="text-xs text-green-600 dark:text-green-400 font-medium">
                      {installmentAmount && parseFloat(installmentAmount) > 0 ?
                        (parseFloat(formData.amount) - parseFloat(installmentAmount) <= 0 ? '(Lunas)' : `(Sisa: ${(parseFloat(formData.amount) - parseFloat(installmentAmount)).toLocaleString('id-ID')})`)
                        : ''}
                    </div>
                  </div>
                </div>
              )}

              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Keterangan</label>
                <textarea
                  className="w-full px-4 py-2 rounded-xl border border-gray-200 dark:border-slate-600 bg-gray-50 dark:bg-slate-700 focus:outline-none focus:ring-2 focus:ring-primary/50 min-h-[80px]"
                  value={formData.description}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  placeholder="Keterangan tambahan..."
                ></textarea>
              </div>

              <div className="pt-4 flex gap-3">
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="flex-1 py-2.5 rounded-xl border border-gray-200 dark:border-slate-600 font-medium hover:bg-gray-50 dark:hover:bg-slate-700 transition-colors"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  className="flex-1 py-2.5 rounded-xl bg-primary text-primary-foreground font-bold hover:bg-primary/90 transition-colors shadow-lg shadow-primary/20"
                >
                  Simpan
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default Credits;
