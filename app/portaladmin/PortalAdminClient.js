'use client';

import { useState, useEffect, useCallback } from 'react';

const TOKEN_KEY = 'qa_admin_token';
const TOKEN_EXPIRY_KEY = 'qa_token_exp';
const USERNAME_KEY = 'qa_admin_user';

export default function PortalAdminClient() {
  const [token, setToken] = useState(null);
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [adminUser, setAdminUser] = useState('');

  // Login Form
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [loginError, setLoginError] = useState('');
  const [loginSubmitting, setLoginSubmitting] = useState(false);

  // Dashboard Data
  const [stats, setStats] = useState({ total: 0, pending: 0, answered: 0 });
  const [questions, setQuestions] = useState([]);
  const [filterStatus, setFilterStatus] = useState('all');
  const [searchQuery, setSearchQuery] = useState('');

  // UI state
  const [loadingData, setLoadingData] = useState(false);
  const [sessionStatus, setSessionStatus] = useState('waiting');
  const [sessionUpdating, setSessionUpdating] = useState(false);
  const [toasts, setToasts] = useState([]);

  // Bulk Selection state
  const [selectedIds, setSelectedIds] = useState([]);
  const [bulkLoading, setBulkLoading] = useState(false);

  const addToast = (message, type = 'success') => {
    const id = Date.now() + Math.random();
    setToasts((prev) => [...prev, { id, message, type }]);
    setTimeout(() => {
      setToasts((prev) => prev.filter((t) => t.id !== id));
    }, 3500);
  };

  const handleLogout = useCallback((expired = false) => {
    sessionStorage.removeItem(TOKEN_KEY);
    sessionStorage.removeItem(TOKEN_EXPIRY_KEY);
    sessionStorage.removeItem(USERNAME_KEY);
    setToken(null);
    setIsLoggedIn(false);
    setUsername('');
    setPassword('');
    setSelectedIds([]);
    if (expired) {
      setLoginError('Sesi Anda telah habis. Silakan masuk kembali.');
    }
  }, []);

  const apiFetch = useCallback(
    async (url, options = {}) => {
      const savedToken = sessionStorage.getItem(TOKEN_KEY);
      const headers = {
        'Content-Type': 'application/json',
        ...(savedToken ? { Authorization: `Bearer ${savedToken}` } : {}),
        ...options.headers,
      };

      const res = await fetch(url, { ...options, headers });
      if (res.status === 401) {
        handleLogout(true);
        throw new Error('SESSION_EXPIRED');
      }
      return res;
    },
    [handleLogout]
  );

  const loadDashboard = useCallback(
    async (showSpinner = true) => {
      if (showSpinner) setLoadingData(true);
      try {
        const [statsRes, qRes] = await Promise.all([
          apiFetch('/api/admin/stats'),
          apiFetch('/api/admin/questions'),
        ]);

        if (statsRes.ok) {
          const s = await statsRes.json();
          setStats(s);
          if (s.sessionStatus) {
            setSessionStatus(s.sessionStatus);
          }
        }
        if (qRes.ok) {
          const data = await qRes.json();
          setQuestions(data.questions || []);
        }
      } catch (err) {
        if (err.message !== 'SESSION_EXPIRED') {
          addToast('Tidak dapat terhubung ke server.', 'error');
        }
      } finally {
        if (showSpinner) setLoadingData(false);
      }
    },
    [apiFetch]
  );

  // Auto restore session on mount
  useEffect(() => {
    const savedToken = sessionStorage.getItem(TOKEN_KEY);
    const exp = sessionStorage.getItem(TOKEN_EXPIRY_KEY);
    const savedUser = sessionStorage.getItem(USERNAME_KEY);

    if (savedToken && exp && Date.now() < Number(exp)) {
      setToken(savedToken);
      setAdminUser(savedUser || 'Admin');
      setIsLoggedIn(true);
    } else {
      sessionStorage.removeItem(TOKEN_KEY);
      sessionStorage.removeItem(TOKEN_EXPIRY_KEY);
      sessionStorage.removeItem(USERNAME_KEY);
    }
  }, []);

  // Poll dashboard data when logged in
  useEffect(() => {
    if (!isLoggedIn) return;

    loadDashboard(true);
    const interval = setInterval(() => {
      loadDashboard(false);
    }, 5000);

    return () => clearInterval(interval);
  }, [isLoggedIn, loadDashboard]);

  // Session duration timer
  useEffect(() => {
    if (!isLoggedIn) return;

    const interval = setInterval(() => {
      const exp = sessionStorage.getItem(TOKEN_EXPIRY_KEY);
      if (exp && Date.now() >= Number(exp)) {
        handleLogout(true);
      }
    }, 10000);

    return () => clearInterval(interval);
  }, [isLoggedIn, handleLogout]);

  // Session status updater
  const handleUpdateSession = async (newStatus) => {
    if (newStatus === sessionStatus || sessionUpdating) return;
    setSessionUpdating(true);
    try {
      const res = await apiFetch('/api/admin/session', {
        method: 'POST',
        body: JSON.stringify({ status: newStatus }),
      });

      if (res.ok) {
        setSessionStatus(newStatus);
        const labels = {
          waiting: '⏳ Sesi diubah menjadi: Menunggu Sesi',
          active: '▶️ Sesi kajian DIMULAI! Jamaah dapat bertanya.',
          ended: '⏹️ Sesi kajian DITUTUP. Formulir jamaah dinonaktifkan.',
        };
        addToast(labels[newStatus] || 'Status sesi diperbarui.', 'success');
      } else {
        const data = await res.json().catch(() => ({}));
        addToast(data.error || 'Gagal mengubah status sesi.', 'error');
      }
    } catch {
      addToast('Terjadi kesalahan jaringan.', 'error');
    } finally {
      setSessionUpdating(false);
    }
  };

  // Login handler
  const handleLoginSubmit = async (e) => {
    e.preventDefault();
    setLoginError('');

    if (!username.trim() || !password) {
      setLoginError('Username dan password wajib diisi.');
      return;
    }

    setLoginSubmitting(true);
    try {
      const res = await fetch('/api/admin/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ username: username.trim(), password }),
      });

      const data = await res.json();
      if (!res.ok) {
        setLoginError(data.error || 'Login gagal.');
        return;
      }

      sessionStorage.setItem(TOKEN_KEY, data.token);
      sessionStorage.setItem(TOKEN_EXPIRY_KEY, String(Date.now() + 2 * 3600 * 1000));
      sessionStorage.setItem(USERNAME_KEY, data.username || username.trim());
      setAdminUser(data.username || username.trim());
      setToken(data.token);
      setIsLoggedIn(true);
      addToast(`Selamat datang, ${data.username || 'Ustadz'}! 👋`);
    } catch {
      setLoginError('Tidak dapat terhubung ke server.');
    } finally {
      setLoginSubmitting(false);
      setPassword('');
    }
  };

  // Action Handlers
  const handleToggleAnswer = async (id, currentStatus) => {
    const action = currentStatus === 'pending' ? 'answer' : 'unanswer';
    const newStatus = action === 'answer' ? 'answered' : 'pending';

    // Optimistic UI Update
    setQuestions((prev) =>
      prev.map((q) => (q.id === id ? { ...q, status: newStatus } : q))
    );
    setStats((prev) => ({
      ...prev,
      pending: action === 'answer' ? Math.max(0, prev.pending - 1) : prev.pending + 1,
      answered: action === 'answer' ? prev.answered + 1 : Math.max(0, prev.answered - 1),
    }));

    try {
      const res = await apiFetch(`/api/admin/questions/${id}/${action}`, { method: 'PUT' });
      if (!res.ok) {
        await loadDashboard(false);
        addToast('Gagal memperbarui status.', 'error');
      } else {
        addToast(
          action === 'answer'
            ? 'Pertanyaan ditandai sudah dijawab ✅'
            : 'Pertanyaan dikembalikan ke antrian ⏳'
        );
      }
    } catch {
      await loadDashboard(false);
    }
  };

  const handleDelete = async (id) => {
    if (!confirm(`Hapus pertanyaan #${id}? Tindakan ini tidak dapat dibatalkan.`)) {
      return;
    }

    const target = questions.find((q) => q.id === id);
    setQuestions((prev) => prev.filter((q) => q.id !== id));
    setSelectedIds((prev) => prev.filter((selectedId) => selectedId !== id));

    if (target) {
      setStats((prev) => ({
        ...prev,
        total: Math.max(0, prev.total - 1),
        pending: target.status === 'pending' ? Math.max(0, prev.pending - 1) : prev.pending,
        answered: target.status === 'answered' ? Math.max(0, prev.answered - 1) : prev.answered,
      }));
    }

    try {
      const res = await apiFetch(`/api/admin/questions/${id}`, { method: 'DELETE' });
      if (!res.ok) {
        await loadDashboard(false);
        addToast('Gagal menghapus pertanyaan.', 'error');
      } else {
        addToast(`Pertanyaan #${id} telah dihapus.`);
      }
    } catch {
      await loadDashboard(false);
    }
  };

  const handleResetAll = async () => {
    const confirmation = prompt(
      '⚠️ PERINGATAN KERAS:\nTindakan ini akan MENGHAPUS SEMUA PERTANYAAN dan me-reset nomor urut antrian kembali ke #1.\n\nKetik "RESET" untuk mengonfirmasi:'
    );

    if (confirmation !== 'RESET') {
      if (confirmation !== null) {
        addToast('Konfirmasi reset salah. Tindakan dibatalkan.', 'error');
      }
      return;
    }

    try {
      const res = await apiFetch('/api/admin/questions', { method: 'DELETE' });
      if (res.ok) {
        setQuestions([]);
        setSelectedIds([]);
        setStats({ total: 0, pending: 0, answered: 0 });
        addToast('Seluruh pertanyaan dibersihkan! Antrian kembali ke #1.', 'success');
      } else {
        addToast('Gagal mengosongkan pertanyaan.', 'error');
      }
    } catch {
      addToast('Terjadi kesalahan jaringan.', 'error');
    }
  };

  // Bulk Selection Handlers
  const toggleSelectOne = (id) => {
    setSelectedIds((prev) =>
      prev.includes(id) ? prev.filter((item) => item !== id) : [...prev, id]
    );
  };

  const toggleSelectAll = () => {
    if (selectedIds.length === filteredQuestions.length) {
      setSelectedIds([]);
    } else {
      setSelectedIds(filteredQuestions.map((q) => q.id));
    }
  };

  const clearSelection = () => {
    setSelectedIds([]);
  };

  const handleBulkAction = async (action) => {
    if (selectedIds.length === 0) return;

    if (action === 'delete') {
      const ok = confirm(`Hapus ${selectedIds.length} pertanyaan terpilih secara permanen?`);
      if (!ok) return;
    }

    setBulkLoading(true);

    // Optimistic UI updates
    const currentSelected = [...selectedIds];
    if (action === 'delete') {
      setQuestions((prev) => prev.filter((q) => !currentSelected.includes(q.id)));
      setSelectedIds([]);
    } else {
      const newStatus = action === 'answer' ? 'answered' : 'pending';
      setQuestions((prev) =>
        prev.map((q) => (currentSelected.includes(q.id) ? { ...q, status: newStatus } : q))
      );
      setSelectedIds([]);
    }

    try {
      const res = await apiFetch('/api/admin/questions/bulk', {
        method: 'POST',
        body: JSON.stringify({ ids: currentSelected, action }),
      });

      if (res.ok) {
        const actionLabels = {
          answer: 'ditandai sudah dijawab ✅',
          unanswer: 'dikembalikan ke antrian ⏳',
          delete: 'berhasil dihapus 🗑️',
        };
        addToast(`${currentSelected.length} pertanyaan ${actionLabels[action] || 'diperbarui'}.`, 'success');
        await loadDashboard(false);
      } else {
        addToast('Gagal memproses aksi massal.', 'error');
        await loadDashboard(false);
      }
    } catch {
      addToast('Terjadi kesalahan koneksi.', 'error');
      await loadDashboard(false);
    } finally {
      setBulkLoading(false);
    }
  };

  // Filter & Search Logic
  const filteredQuestions = questions.filter((q) => {
    const matchFilter =
      filterStatus === 'all'
        ? true
        : filterStatus === 'pending'
        ? q.status === 'pending'
        : q.status === 'answered';

    if (!matchFilter) return false;

    if (!searchQuery.trim()) return true;
    const term = searchQuery.toLowerCase();
    return (
      q.name.toLowerCase().includes(term) ||
      q.question.toLowerCase().includes(term) ||
      String(q.id).includes(term)
    );
  });

  const isAllSelected =
    filteredQuestions.length > 0 && selectedIds.length === filteredQuestions.length;

  const formatTime = (isoStr) => {
    try {
      const date = new Date(isoStr);
      return date.toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit' });
    } catch {
      return '';
    }
  };

  // -----------------------------------------------------------------
  // LOGIN VIEW
  // -----------------------------------------------------------------
  if (!isLoggedIn) {
    return (
      <div className="login-wrapper">
        <div className="login-card animate-in">
          <div className="login-icon-wrap">
            <svg
              className="icon-svg"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
            >
              <rect x="3" y="11" width="18" height="11" rx="2" ry="2" />
              <path d="M7 11V7a5 5 0 0 1 10 0v4" />
            </svg>
          </div>

          <h1 style={{ marginBottom: '24px' }}>Portal Admin Kajian</h1>

          {loginError && (
            <div className="alert alert-error" role="alert" style={{ marginBottom: '16px' }}>
              <svg
                className="icon-svg"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
                style={{ flexShrink: 0 }}
              >
                <circle cx="12" cy="12" r="10" />
                <line x1="12" y1="8" x2="12" y2="12" />
                <line x1="12" y1="16" x2="12.01" y2="16" />
              </svg>
              <span>{loginError}</span>
            </div>
          )}

          <form onSubmit={handleLoginSubmit} noValidate>
            <div className="form-group" style={{ marginBottom: '14px', textAlign: 'left' }}>
              <label htmlFor="input-username" style={{ display: 'block', marginBottom: '6px', fontSize: '0.88rem', color: 'var(--gold-light)' }}>
                Username
              </label>
              <input
                type="text"
                id="input-username"
                placeholder="Masukkan username..."
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                required
                maxLength={64}
                autoComplete="username"
                style={{
                  width: '100%',
                  padding: '12px 14px',
                  borderRadius: 'var(--radius)',
                  background: 'var(--bg-input)',
                  border: '1px solid var(--border-gold)',
                  color: '#fff',
                  fontSize: '16px',
                }}
              />
            </div>

            <div className="form-group" style={{ marginBottom: '20px', textAlign: 'left' }}>
              <label htmlFor="input-password" style={{ display: 'block', marginBottom: '6px', fontSize: '0.88rem', color: 'var(--gold-light)' }}>
                Password
              </label>
              <input
                type="password"
                id="input-password"
                placeholder="Masukkan password..."
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                maxLength={128}
                autoComplete="current-password"
                style={{
                  width: '100%',
                  padding: '12px 14px',
                  borderRadius: 'var(--radius)',
                  background: 'var(--bg-input)',
                  border: '1px solid var(--border-gold)',
                  color: '#fff',
                  fontSize: '16px',
                }}
              />
            </div>

            <button type="submit" className="btn btn-primary" disabled={loginSubmitting} style={{ width: '100%', padding: '12px', fontSize: '1rem', fontWeight: 600 }}>
              {loginSubmitting ? (
                <>
                  <span className="spinner" /> Memproses...
                </>
              ) : (
                <>
                  <svg
                    className="icon-svg"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="2"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  >
                    <path d="M15 3h4a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2h-4" />
                    <polyline points="10 17 15 12 10 7" />
                    <line x1="15" y1="12" x2="3" y2="12" />
                  </svg>
                  Masuk Portal
                </>
              )}
            </button>
          </form>
        </div>
      </div>
    );
  }

  // -----------------------------------------------------------------
  // DASHBOARD VIEW
  // -----------------------------------------------------------------
  return (
    <div style={{ display: 'flex', flexDirection: 'column', minHeight: '100vh' }}>
      {/* ===== STICKY HEADER ===== */}
      <header className="admin-header">
        <div className="admin-brand">
          <svg
            style={{ width: '22px', height: '22px', flexShrink: 0 }}
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
          >
            <path d="M2 22h20" />
            <path d="M5 22V12a7 7 0 0 1 14 0v10" />
            <path d="M9 22v-4a3 3 0 0 1 6 0v4" />
          </svg>
          <div style={{ display: 'flex', flexDirection: 'column' }}>
            <span>Portal Admin Kajian</span>
            <span style={{ fontSize: '0.72rem', color: 'var(--gold)', fontWeight: 400 }}>
              Login sebagai: <strong>{adminUser}</strong>
            </span>
          </div>
        </div>

        <div className="admin-nav">
          {/* Kontrol Status Sesi Tanya Jawab */}
          <div className="session-control-group no-print" title="Pengaturan Status Sesi Tanya Jawab">
            <button
              type="button"
              className={`session-btn ${sessionStatus === 'waiting' ? 'active-waiting' : ''}`}
              onClick={() => handleUpdateSession('waiting')}
              disabled={sessionUpdating}
              title="Menunggu Sesi: Halaman user menampilkan info sesi kajian akan segera dimulai"
            >
              <svg
                className="icon-svg"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
              >
                <circle cx="12" cy="12" r="10" />
                <polyline points="12 6 12 12 16 14" />
              </svg>
              <span>Menunggu Sesi</span>
            </button>

            <button
              type="button"
              className={`session-btn ${sessionStatus === 'active' ? 'active-started' : ''}`}
              onClick={() => handleUpdateSession('active')}
              disabled={sessionUpdating}
              title="Mulai Sesi: Kolom pertanyaan dibuka untuk jamaah"
            >
              <svg
                className="icon-svg"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2.5"
                strokeLinecap="round"
                strokeLinejoin="round"
              >
                <polygon points="5 3 19 12 5 21 5 3" />
              </svg>
              <span>Mulai Sesi</span>
            </button>

            <button
              type="button"
              className={`session-btn ${sessionStatus === 'ended' ? 'active-ended' : ''}`}
              onClick={() => handleUpdateSession('ended')}
              disabled={sessionUpdating}
              title="Hentikan Sesi: Kolom pertanyaan ditutup dan menampilkan ucapan jazakumullah khairan"
            >
              <svg
                className="icon-svg"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2.5"
                strokeLinecap="round"
                strokeLinejoin="round"
              >
                <rect x="5" y="5" width="14" height="14" rx="2" />
              </svg>
              <span>Hentikan Sesi</span>
            </button>
          </div>

          {stats.pending > 0 && (
            <div className="pending-badge-wrap" title="Pertanyaan belum dijawab">
              <span className="pending-badge">{stats.pending}</span>
              <span>belum dijawab</span>
            </div>
          )}

          <button
            type="button"
            className="btn btn-sm btn-outline no-print"
            onClick={() => window.print()}
            title="Cetak pertanyaan yang belum dijawab"
          >
            <svg
              className="icon-svg"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
            >
              <polyline points="6 9 6 2 18 2 18 9" />
              <path d="M6 18H4a2 2 0 0 1-2-2v-5a2 2 0 0 1 2-2h16a2 2 0 0 1 2 2v5a2 2 0 0 1-2 2h-2" />
              <rect x="6" y="14" width="12" height="8" />
            </svg>
            <span className="no-print">Cetak</span>
          </button>

          <button
            type="button"
            className="btn btn-sm btn-outline no-print"
            onClick={handleResetAll}
            title="Kosongkan semua pertanyaan dan reset nomor antrian ke #1 untuk sesi kajian baru"
            style={{ borderColor: 'rgba(239, 68, 68, 0.4)', color: '#f87171' }}
          >
            <svg
              className="icon-svg"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
            >
              <polyline points="3 6 5 6 21 6" />
              <path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2" />
            </svg>
            <span className="no-print">Reset Sesi (#1)</span>
          </button>

          <button
            type="button"
            className="btn btn-sm btn-danger"
            onClick={() => handleLogout(false)}
          >
            <svg
              className="icon-svg"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
            >
              <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4" />
              <polyline points="16 17 21 12 16 7" />
              <line x1="21" y1="12" x2="3" y2="12" />
            </svg>
            Keluar
          </button>
        </div>
      </header>

      {/* ===== DASHBOARD CONTENT ===== */}
      <div className="dashboard-content">
        {/* Stats Grid */}
        <div className="stats-grid">
          <div className="stat-card highlight">
            <div className="stat-value">{stats.total}</div>
            <div className="stat-label">Total Pertanyaan</div>
          </div>
          <div className="stat-card">
            <div className="stat-value" style={{ color: 'var(--gold-light)' }}>
              {stats.pending}
            </div>
            <div className="stat-label">⏳ Belum Dijawab</div>
          </div>
          <div className="stat-card">
            <div className="stat-value" style={{ color: '#6bff8b' }}>
              {stats.answered}
            </div>
            <div className="stat-label">✅ Sudah Dijawab</div>
          </div>
        </div>

        {/* Filter + Search */}
        <div className="filter-area">
          <div className="filter-tabs">
            <button
              className={`filter-tab ${filterStatus === 'all' ? 'active' : ''}`}
              onClick={() => { setFilterStatus('all'); setSelectedIds([]); }}
            >
              Semua <span className="tab-count">{stats.total}</span>
            </button>
            <button
              className={`filter-tab ${filterStatus === 'pending' ? 'active' : ''}`}
              onClick={() => { setFilterStatus('pending'); setSelectedIds([]); }}
            >
              ⏳ Belum Dijawab <span className="tab-count">{stats.pending}</span>
            </button>
            <button
              className={`filter-tab ${filterStatus === 'answered' ? 'active' : ''}`}
              onClick={() => { setFilterStatus('answered'); setSelectedIds([]); }}
            >
              ✅ Sudah Dijawab <span className="tab-count">{stats.answered}</span>
            </button>
          </div>

          <div className="search-bar">
            <div className="search-input-wrapper">
              <svg
                className="search-icon-svg"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
                aria-hidden="true"
              >
                <circle cx="11" cy="11" r="8" />
                <line x1="21" y1="21" x2="16.65" y2="16.65" />
              </svg>
              <input
                type="search"
                className="search-input"
                placeholder="Cari nama, ID, atau isi pertanyaan..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                maxLength={100}
              />
              {searchQuery && (
                <button
                  type="button"
                  className="search-clear-btn"
                  onClick={() => setSearchQuery('')}
                  title="Bersihkan pencarian"
                  aria-label="Bersihkan pencarian"
                >
                  <svg
                    viewBox="0 0 24 24"
                    width="14"
                    height="14"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="2.5"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  >
                    <line x1="18" y1="6" x2="6" y2="18" />
                    <line x1="6" y1="6" x2="18" y2="18" />
                  </svg>
                </button>
              )}
            </div>
            <button
              type="button"
              className="btn btn-sm btn-outline search-refresh-btn no-print"
              onClick={() => loadDashboard(true)}
              title="Muat ulang"
            >
              <svg
                className="icon-svg"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
              >
                <polyline points="23 4 23 10 17 10" />
                <path d="M20.49 15a9 9 0 1 1-2.12-9.36L23 10" />
              </svg>
              <span className="search-refresh-text">Segarkan</span>
            </button>
          </div>
        </div>

        {/* Sticky Floating Bulk Action Bar */}
        {selectedIds.length > 0 && (
          <div className="bulk-bar-container no-print">
            <div className="bulk-bar">
              <div className="bulk-bar-info">
                <span className="bulk-bar-badge">{selectedIds.length}</span>
                <span>Pertanyaan Terpilih</span>
              </div>

              <div className="bulk-bar-actions">
                <button
                  type="button"
                  className="btn btn-sm btn-answer"
                  onClick={() => handleBulkAction('answer')}
                  disabled={bulkLoading}
                >
                  <svg
                    className="icon-svg"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="2.5"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  >
                    <polyline points="20 6 9 17 4 12" />
                  </svg>
                  Tandai Sudah Dijawab
                </button>

                <button
                  type="button"
                  className="btn btn-sm btn-outline"
                  onClick={() => handleBulkAction('unanswer')}
                  disabled={bulkLoading}
                >
                  <svg
                    className="icon-svg"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="2"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  >
                    <polyline points="1 4 1 10 7 10" />
                    <path d="M3.51 15a9 9 0 1 0 2.13-9.36L1 10" />
                  </svg>
                  Kembalikan Belum Dijawab
                </button>

                <button
                  type="button"
                  className="btn btn-sm btn-delete"
                  onClick={() => handleBulkAction('delete')}
                  disabled={bulkLoading}
                >
                  <svg
                    className="icon-svg"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="2"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  >
                    <polyline points="3 6 5 6 21 6" />
                    <path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2" />
                  </svg>
                  Hapus
                </button>

                <button
                  type="button"
                  className="btn btn-sm btn-outline"
                  onClick={clearSelection}
                  disabled={bulkLoading}
                  style={{ opacity: 0.8 }}
                >
                  ✕ Batal
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Bulk Select All Toolbar Row */}
        {filteredQuestions.length > 0 && !loadingData && (
          <div className="bulk-toolbar-row no-print">
            <label className="bulk-select-all-wrap">
              <input
                type="checkbox"
                className="custom-checkbox"
                checked={isAllSelected}
                onChange={toggleSelectAll}
              />
              <span>
                {isAllSelected ? 'Batalkan Pilih Semua' : 'Pilih Semua'}
                {' '}
                <span style={{ color: 'var(--text-muted)' }}>({filteredQuestions.length})</span>
              </span>
            </label>

            {selectedIds.length > 0 && (
              <span style={{ fontSize: '0.85rem', color: 'var(--gold-light)', fontWeight: 600 }}>
                {selectedIds.length} dari {filteredQuestions.length} pertanyaan dipilih
              </span>
            )}
          </div>
        )}

        {/* Cards Container */}
        <div className="questions-container">
          {loadingData ? (
            <>
              <div className="skeleton-card">
                <div className="skeleton-line s40" />
                <div className="skeleton-line tall" />
                <div className="skeleton-line s65" />
              </div>
              <div className="skeleton-card">
                <div className="skeleton-line s40" />
                <div className="skeleton-line tall" />
                <div className="skeleton-line s65" />
              </div>
            </>
          ) : filteredQuestions.length === 0 ? (
            <div className="empty-state-full">
              <div className="empty-icon-wrap empty">💬</div>
              <h3>Tidak ada pertanyaan</h3>
              <p>
                {searchQuery
                  ? 'Tidak ada pertanyaan yang cocok dengan pencarian Anda.'
                  : 'Belum ada pertanyaan pada kategori ini.'}
              </p>
            </div>
          ) : (
            filteredQuestions.map((q) => {
              const isPending = q.status === 'pending';
              const isSelected = selectedIds.includes(q.id);
              return (
                <div
                  key={q.id}
                  className={`question-card animate-in ${
                    isPending ? 'pending' : 'answered'
                  } ${isSelected ? 'selected' : ''}`}
                >
                  <div className="question-card-header">
                    <div className="question-meta">
                      <input
                        type="checkbox"
                        className="custom-checkbox no-print"
                        checked={isSelected}
                        onChange={() => toggleSelectOne(q.id)}
                        aria-label={`Pilih pertanyaan #${q.id}`}
                      />
                      <span className="question-number">#{q.id}</span>
                      <span className="question-author">{q.name}</span>
                      <span className="question-time">{formatTime(q.created_at)}</span>
                    </div>
                    <span
                      className={`badge ${
                        isPending ? 'badge-pending' : 'badge-answered'
                      }`}
                    >
                      {isPending ? '⏳ Belum Dijawab' : '✅ Sudah Dijawab'}
                    </span>
                  </div>

                  <div className="question-card-body">
                    <p className="question-content">{q.question}</p>
                  </div>

                  <div className="question-card-footer no-print">
                    {isPending ? (
                      <button
                        type="button"
                        className="btn btn-sm btn-answer"
                        onClick={() => handleToggleAnswer(q.id, q.status)}
                      >
                        <svg
                          className="icon-svg"
                          viewBox="0 0 24 24"
                          fill="none"
                          stroke="currentColor"
                          strokeWidth="2.5"
                          strokeLinecap="round"
                          strokeLinejoin="round"
                        >
                          <polyline points="20 6 9 17 4 12" />
                        </svg>
                        Tandai Dijawab
                      </button>
                    ) : (
                      <button
                        type="button"
                        className="btn btn-sm btn-unanswer"
                        onClick={() => handleToggleAnswer(q.id, q.status)}
                      >
                        <svg
                          className="icon-svg"
                          viewBox="0 0 24 24"
                          fill="none"
                          stroke="currentColor"
                          strokeWidth="2"
                          strokeLinecap="round"
                          strokeLinejoin="round"
                        >
                          <polyline points="1 4 1 10 7 10" />
                          <path d="M3.51 15a9 9 0 1 0 2.13-9.36L1 10" />
                        </svg>
                        Batalkan
                      </button>
                    )}

                    <button
                      type="button"
                      className="btn btn-sm btn-danger"
                      onClick={() => handleDelete(q.id)}
                    >
                      <svg
                        className="icon-svg"
                        viewBox="0 0 24 24"
                        fill="none"
                        stroke="currentColor"
                        strokeWidth="2"
                        strokeLinecap="round"
                        strokeLinejoin="round"
                      >
                        <polyline points="3 6 5 6 21 6" />
                        <path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2" />
                      </svg>
                      Hapus
                    </button>
                  </div>
                </div>
              );
            })
          )}
        </div>
      </div>

      {/* Toast Notifications */}
      <div className="toast-container">
        {toasts.map((t) => (
          <div key={t.id} className={`toast ${t.type}`}>
            <span>{t.message}</span>
          </div>
        ))}
      </div>

      <footer className="page-footer no-print border-t border-white/10 w-full pt-8 flex flex-col items-center gap-2 text-sm text-muted-foreground/60">
        <p>© 2026 Thuba Project. Dedicated to building the Ummah.</p>
        <p className="font-serif italic text-xs tracking-wider">Faith. Focus. Create.</p>
      </footer>
    </div>
  );
}
