import { useState, useEffect, useContext } from 'react';
import axios from 'axios';
import { AuthContext } from '../context/AuthContext';

const UserManagement = () => {
    const { token } = useContext(AuthContext);
    const [users, setUsers] = useState<any[]>([]);
    
    // State untuk pencarian
    const [searchQuery, setSearchQuery] = useState('');

    // State untuk form
    const [showForm, setShowForm] = useState(false);
    const [editId, setEditId] = useState<number | null>(null);
    const [name, setName] = useState('');
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [role, setRole] = useState('OPERATOR_POLRES');
    const [loading, setLoading] = useState(false);
    const [message, setMessage] = useState({ text: '', type: '' });

    const fetchUsers = async () => {
        try {
            const response = await axios.get('/api/auth/users', {
                headers: { Authorization: `Bearer ${token}` }
            });
            setUsers(response.data);
        } catch (error) {
            console.error("Gagal mengambil data user:", error);
        }
    };

    useEffect(() => {
        if (token) {
            fetchUsers();
        }
    }, [token]);

    // Memfilter data berdasarkan pencarian
    const filteredUsers = users.filter(u => 
        u.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        u.email.toLowerCase().includes(searchQuery.toLowerCase())
    );

    const openAddForm = () => {
        setEditId(null);
        setName('');
        setEmail('');
        setRole('OPERATOR_POLRES');
        setPassword('');
        setMessage({text: '', type: ''});
        setShowForm(true);
    };

    const openEditForm = (user: any) => {
        setEditId(user.id);
        setName(user.name);
        setEmail(user.email);
        setRole(user.role);
        setPassword(''); // Dikosongkan agar tidak perlu diisi jika tidak ingin ganti password
        setMessage({text: '', type: ''});
        setShowForm(true);
    };

    const handleFormSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setLoading(true);
        setMessage({ text: '', type: '' });

        try {
            if (editId) {
                // Update User
                await axios.put(`/api/auth/users/${editId}`, {
                    name, email, password: password || undefined, role
                }, {
                    headers: { Authorization: `Bearer ${token}` }
                });
                setMessage({ text: 'User berhasil diperbarui!', type: 'success' });
            } else {
                // Buat User Baru
                await axios.post('/api/auth/register', {
                    name, email, password, role
                }, {
                    headers: { Authorization: `Bearer ${token}` }
                });
                setMessage({ text: 'User berhasil didaftarkan!', type: 'success' });
            }

            fetchUsers();
            
            // Tutup form setelah 2 detik
            setTimeout(() => {
                setShowForm(false);
                setMessage({ text: '', type: '' });
            }, 2000);
        } catch (error: any) {
            setMessage({ 
                text: error.response?.data?.error || 'Gagal menyimpan data', 
                type: 'error' 
            });
        } finally {
            setLoading(false);
        }
    };

    const handleDelete = async (id: number, userName: string) => {
        if (!window.confirm(`PERINGATAN: Apakah Anda yakin ingin menghapus akun ${userName}? Data yang terhapus tidak dapat dikembalikan.`)) return;
        try {
            await axios.delete(`/api/auth/users/${id}`, {
                headers: { Authorization: `Bearer ${token}` }
            });
            fetchUsers();
        } catch (error: any) {
            alert(error.response?.data?.error || 'Gagal menghapus user');
        }
    };

    const handleResetPassword = async (id: number, userName: string) => {
        if (!window.confirm(`Apakah Anda yakin ingin mereset sandi akses untuk akun ${userName}?`)) return;
        try {
            const res = await axios.post(`/api/auth/users/${id}/reset-password`, {}, {
                headers: { Authorization: `Bearer ${token}` }
            });
            alert(`Sandi Akses Berhasil Direset!\n\nEmail: ${res.data.email}\nSandi Baru: ${res.data.newPassword}\n\nHarap salin sandi ini dan berikan ke ${userName}.`);
        } catch (error: any) {
            alert(error.response?.data?.error || 'Gagal mereset sandi akses');
        }
    };

    return (
        <div className="flex flex-col gap-lg">
            {/* Page Header */}
            <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-md mb-xl">
                <div>
                    <h3 className="font-display text-display text-on-surface">Manajemen User</h3>
                    <p className="font-body-md text-body-md text-on-surface-variant mt-1">Kelola hak akses dan akun personil di tingkat Polres.</p>
                </div>
                <button 
                    onClick={openAddForm}
                    className="flex items-center gap-sm bg-primary text-on-primary px-lg py-sm rounded-lg font-label-md text-label-md hover:opacity-90 transition-all active:scale-[0.98] shadow-sm">
                    <span className="material-symbols-outlined text-[20px]">person_add</span>
                    + Tambah Akun Polres Baru
                </button>
            </div>

            {/* Form Tambah/Edit User (Popup Modal) */}
            {showForm && (
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm animate-[fadeIn_0.2s_ease-in-out] p-4">
                    <section className="bg-white p-lg rounded-xl shadow-xl w-full max-w-2xl relative">
                        <button 
                            onClick={() => setShowForm(false)}
                            className="absolute top-4 right-4 w-8 h-8 flex items-center justify-center rounded-full bg-surface-container text-on-surface-variant hover:text-error hover:bg-error-container transition-colors"
                        >
                            <span className="material-symbols-outlined text-[18px]">close</span>
                        </button>

                        <h3 className="font-headline-md text-on-surface font-semibold mb-4 border-b border-outline-variant pb-2 pr-8">
                            {editId ? 'Edit Akun Personil' : 'Buat Akun Baru'}
                        </h3>
                        
                        {message.text && (
                            <div className={`p-4 mb-4 rounded-lg font-body-md ${message.type === 'success' ? 'bg-green-100 text-green-800' : 'bg-error-container text-on-error-container'}`}>
                                {message.text}
                            </div>
                        )}

                        <form onSubmit={handleFormSubmit} className="grid grid-cols-1 md:grid-cols-2 gap-md">
                            <div>
                                <label className="block font-label-md text-on-surface-variant mb-1">Nama / Instansi</label>
                                <input 
                                    type="text" 
                                    required 
                                    value={name}
                                    onChange={(e) => setName(e.target.value)}
                                    className="w-full px-4 py-2 border border-outline-variant rounded-lg focus:ring-2 focus:ring-primary focus:border-primary outline-none bg-surface"
                                />
                            </div>
                            <div>
                                <label className="block font-label-md text-on-surface-variant mb-1">Alamat Email</label>
                                <input 
                                    type="email" 
                                    required 
                                    value={email}
                                    onChange={(e) => setEmail(e.target.value)}
                                    className="w-full px-4 py-2 border border-outline-variant rounded-lg focus:ring-2 focus:ring-primary focus:border-primary outline-none bg-surface"
                                />
                            </div>
                            <div>
                                <label className="block font-label-md text-on-surface-variant mb-1">
                                    Sandi Akses {editId && <span className="text-on-surface-variant text-[10px] font-normal italic">(Kosongkan jika tidak diubah)</span>}
                                </label>
                                <input 
                                    type="password" 
                                    required={!editId} 
                                    value={password}
                                    onChange={(e) => setPassword(e.target.value)}
                                    className="w-full px-4 py-2 border border-outline-variant rounded-lg focus:ring-2 focus:ring-primary focus:border-primary outline-none bg-surface"
                                />
                            </div>
                            <div>
                                <label className="block font-label-md text-on-surface-variant mb-1">Peran Akses (Role)</label>
                                <select 
                                    value={role}
                                    onChange={(e) => setRole(e.target.value)}
                                    className="w-full px-4 py-2 border border-outline-variant rounded-lg focus:ring-2 focus:ring-primary focus:border-primary outline-none bg-surface"
                                >
                                    <option value="OPERATOR_POLRES">OPERATOR POLRES </option>
                                    <option value="ADMIN_POLDA">ADMIN POLDA </option>
                                </select>
                            </div>
                            <div className="md:col-span-2 pt-4 border-t border-outline-variant mt-2 flex justify-end gap-3">
                                <button 
                                    type="button"
                                    onClick={() => setShowForm(false)}
                                    className="px-6 py-2.5 border border-outline-variant text-on-surface-variant font-label-md rounded-lg hover:bg-surface-container transition-all"
                                >
                                    Batal
                                </button>
                                <button 
                                    type="submit" 
                                    disabled={loading}
                                    className="px-6 py-2.5 bg-primary text-white font-label-md rounded-lg hover:opacity-90 active:scale-95 transition-all disabled:opacity-50 inline-flex items-center justify-center gap-2"
                                >
                                    <span className="material-symbols-outlined text-[18px]">{editId ? 'save' : 'person_add'}</span>
                                    {loading ? 'Memproses...' : (editId ? 'Simpan Perubahan' : 'Daftarkan Akun')}
                                </button>
                            </div>
                        </form>
                    </section>
                </div>
            )}

            {/* Bento Grid Stats */}
            <div className="grid grid-cols-1 md:grid-cols-4 gap-gutter mb-lg">
                <div className="bg-surface border border-outline-variant p-md rounded-xl border-l-4 border-l-primary flex items-center gap-md shadow-sm">
                    <div className="w-12 h-12 bg-secondary-container rounded-full flex items-center justify-center text-on-secondary-container">
                        <span className="material-symbols-outlined">groups</span>
                    </div>
                    <div>
                        <p className="font-label-sm text-label-sm text-on-surface-variant">Total Akun</p>
                        <p className="font-headline-md text-headline-md font-bold">{users.length}</p>
                    </div>
                </div>
                <div className="bg-surface border border-outline-variant p-md rounded-xl border-l-4 border-l-primary/60 flex items-center gap-md shadow-sm">
                    <div className="w-12 h-12 bg-surface-container rounded-full flex items-center justify-center text-on-surface-variant">
                        <span className="material-symbols-outlined">shield_person</span>
                    </div>
                    <div>
                        <p className="font-label-sm text-label-sm text-on-surface-variant">Aktif Hari Ini</p>
                        <p className="font-headline-md text-headline-md font-bold">{users.length > 0 ? users.length - 1 : 0}</p>
                    </div>
                </div>
                <div className="bg-surface border border-outline-variant p-md rounded-xl border-l-4 border-l-tertiary-container flex items-center gap-md shadow-sm">
                    <div className="w-12 h-12 bg-tertiary-fixed rounded-full flex items-center justify-center text-on-tertiary-fixed">
                        <span className="material-symbols-outlined">lock_open</span>
                    </div>
                    <div>
                        <p className="font-label-sm text-label-sm text-on-surface-variant">Reset Required</p>
                        <p className="font-headline-md text-headline-md font-bold">0</p>
                    </div>
                </div>
                <div className="bg-surface border border-outline-variant p-md rounded-xl border-l-4 border-l-error flex items-center gap-md shadow-sm">
                    <div className="w-12 h-12 bg-error-container rounded-full flex items-center justify-center text-on-error-container">
                        <span className="material-symbols-outlined">block</span>
                    </div>
                    <div>
                        <p className="font-label-sm text-label-sm text-on-surface-variant">Suspended</p>
                        <p className="font-headline-md text-headline-md font-bold">0</p>
                    </div>
                </div>
            </div>

            {/* Table Container */}
            <div className="bg-surface border border-outline-variant rounded-xl shadow-sm overflow-hidden flex flex-col">
                <div className="p-md border-b border-outline-variant bg-surface-container-low flex justify-between items-center">
                    <div className="flex items-center gap-md">
                        <div className="relative">
                            <span className="material-symbols-outlined absolute left-3 top-1/2 -translate-y-1/2 text-outline text-[18px]">search</span>
                            <input 
                                className="pl-10 pr-md py-sm border border-outline-variant rounded-lg bg-white font-body-md text-body-md w-64 focus:ring-2 focus:ring-primary/10 focus:border-primary transition-all" 
                                placeholder="Cari Polres atau Email..." 
                                type="text" 
                                value={searchQuery}
                                onChange={(e) => setSearchQuery(e.target.value)}
                            />
                        </div>
                    </div>
                    <div className="flex items-center gap-sm">
                        <button className="p-sm text-on-surface-variant hover:bg-surface-container-high rounded-lg transition-colors" title="Filter (Segera Hadir)">
                            <span className="material-symbols-outlined">filter_list</span>
                        </button>
                        <button className="p-sm text-on-surface-variant hover:bg-surface-container-high rounded-lg transition-colors" title="Unduh CSV (Segera Hadir)">
                            <span className="material-symbols-outlined">download</span>
                        </button>
                    </div>
                </div>

                <div className="overflow-x-auto custom-scrollbar">
                    <table className="w-full text-left border-collapse">
                        <thead className="bg-surface-container-high">
                            <tr>
                                <th className="px-md py-sm font-label-md text-label-md text-on-surface-variant uppercase tracking-wider w-16">No</th>
                                <th className="px-md py-sm font-label-md text-label-md text-on-surface-variant uppercase tracking-wider">Nama Polres</th>
                                <th className="px-md py-sm font-label-md text-label-md text-on-surface-variant uppercase tracking-wider">Username / Email</th>
                                <th className="px-md py-sm font-label-md text-label-md text-on-surface-variant uppercase tracking-wider">Role</th>
                                <th className="px-md py-sm font-label-md text-label-md text-on-surface-variant uppercase tracking-wider text-right">Aksi</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-outline-variant">
                            {filteredUsers.length === 0 ? (
                                <tr>
                                    <td colSpan={5} className="text-center py-8 text-on-surface-variant font-body-md">Tidak ada data ditemukan.</td>
                                </tr>
                            ) : (
                                filteredUsers.map((u, idx) => (
                                    <tr key={u.id} className="hover:bg-surface-container-low transition-colors group">
                                        <td className="px-md py-md font-body-md text-body-md">{idx + 1}</td>
                                        <td className="px-md py-md">
                                            <div className="flex items-center gap-sm">
                                                <div className="w-8 h-8 rounded-lg bg-secondary-container flex items-center justify-center text-on-secondary-container font-bold text-[12px]">
                                                    {u.name.substring(0, 2).toUpperCase()}
                                                </div>
                                                <span className="font-body-md text-body-md font-semibold text-on-surface">{u.name}</span>
                                            </div>
                                        </td>
                                        <td className="px-md py-md font-body-md text-body-md font-mono text-on-surface-variant">{u.email}</td>
                                        <td className="px-md py-md">
                                            {u.role === 'ADMIN_POLDA' ? (
                                                <span className="px-sm py-[2px] bg-secondary-fixed text-on-secondary-fixed-variant rounded-full text-label-sm font-medium">Admin</span>
                                            ) : (
                                                <span className="px-sm py-[2px] bg-surface-variant text-on-surface-variant rounded-full text-label-sm font-medium">Operator</span>
                                            )}
                                        </td>
                                        <td className="px-md py-md text-right">
                                            <div className="flex justify-end gap-xs opacity-0 group-hover:opacity-100 transition-opacity">
                                                <button onClick={() => openEditForm(u)} className="p-xs text-on-surface-variant hover:text-primary transition-colors" title="Edit Akun">
                                                    <span className="material-symbols-outlined">edit</span>
                                                </button>
                                                <button onClick={() => handleResetPassword(u.id, u.name)} className="p-xs text-on-surface-variant hover:text-tertiary-container transition-colors" title="Reset Sandi Akses">
                                                    <span className="material-symbols-outlined">lock_reset</span>
                                                </button>
                                                <button onClick={() => handleDelete(u.id, u.name)} className="p-xs text-on-surface-variant hover:text-error transition-colors" title="Hapus Akun">
                                                    <span className="material-symbols-outlined">delete</span>
                                                </button>
                                            </div>
                                        </td>
                                    </tr>
                                ))
                            )}
                        </tbody>
                    </table>
                </div>
            </div>


        </div>
    );
};

export default UserManagement;
