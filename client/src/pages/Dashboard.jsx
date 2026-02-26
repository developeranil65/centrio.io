import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import {
    Plus, Layout, Search, LogOut, Settings, Clock,
    ChevronRight, Layers, Users, Sun, Moon
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { useTheme } from '../context/ThemeContext';
import { getWorkspaces, createWorkspace, deleteWorkspace } from '../api/workspace.api';
import { getInitials, getAvatarColor, formatDate } from '../utils/helpers';
import toast from 'react-hot-toast';

export default function Dashboard() {
    const { user, logout } = useAuth();
    const { theme, toggleTheme } = useTheme();
    const navigate = useNavigate();
    const [workspaces, setWorkspaces] = useState([]);
    const [loading, setLoading] = useState(true);
    const [showCreate, setShowCreate] = useState(false);
    const [newName, setNewName] = useState('');
    const [newDesc, setNewDesc] = useState('');
    const [creating, setCreating] = useState(false);
    const [search, setSearch] = useState('');

    useEffect(() => {
        fetchWorkspaces();
    }, []);

    const fetchWorkspaces = async () => {
        try {
            const { data } = await getWorkspaces();
            setWorkspaces(data);
        } catch (err) {
            toast.error('Failed to load workspaces');
        } finally {
            setLoading(false);
        }
    };

    const handleCreate = async (e) => {
        e.preventDefault();
        if (!newName.trim()) return toast.error('Name is required');
        setCreating(true);
        try {
            const { data } = await createWorkspace({ name: newName, description: newDesc });
            setWorkspaces([data, ...workspaces]);
            setShowCreate(false);
            setNewName('');
            setNewDesc('');
            toast.success('Workspace created!');
        } catch (err) {
            toast.error(err.response?.data?.message || 'Failed to create workspace');
        } finally {
            setCreating(false);
        }
    };

    const handleDelete = async (id) => {
        if (!confirm('Delete this workspace?')) return;
        try {
            await deleteWorkspace(id);
            setWorkspaces(workspaces.filter((w) => w._id !== id));
            toast.success('Workspace deleted');
        } catch (err) {
            toast.error('Failed to delete');
        }
    };

    const filtered = workspaces.filter((w) =>
        w.name.toLowerCase().includes(search.toLowerCase())
    );

    const container = {
        hidden: { opacity: 0 },
        show: {
            opacity: 1,
            transition: { staggerChildren: 0.06 },
        },
    };

    const item = {
        hidden: { opacity: 0, y: 20 },
        show: { opacity: 1, y: 0 },
    };

    return (
        <motion.div
            className="dashboard"
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.4 }}
        >
            {/* ── Sidebar ── */}
            <aside className="sidebar glass">
                <div className="sidebar-top">
                    <div className="sidebar-logo">
                        <div className="logo-icon-sm">
                            <svg viewBox="0 0 32 32" fill="none">
                                <rect x="2" y="2" width="28" height="28" rx="8" fill="url(#gs)" />
                                <path d="M10 16L14 20L22 12" stroke="white" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" />
                                <defs><linearGradient id="gs" x1="0" y1="0" x2="32" y2="32"><stop stopColor="#6366f1" /><stop offset="1" stopColor="#8b5cf6" /></linearGradient></defs>
                            </svg>
                        </div>
                        <span className="gradient-text sidebar-brand">centrio.io</span>
                    </div>

                    <nav className="sidebar-nav">
                        <a className="sidebar-link active">
                            <Layout size={18} />
                            <span>Workspaces</span>
                        </a>
                        <a className="sidebar-link" onClick={() => navigate('/join')} style={{ cursor: 'pointer' }}>
                            <Users size={18} />
                            <span>Join Room</span>
                        </a>
                        <a className="sidebar-link">
                            <Clock size={18} />
                            <span>Recent</span>
                        </a>
                        <a className="sidebar-link">
                            <Settings size={18} />
                            <span>Settings</span>
                        </a>
                    </nav>
                </div>

                <div className="sidebar-bottom">
                    <div className="sidebar-user">
                        <div
                            className="avatar"
                            style={{ background: getAvatarColor(user?.name) }}
                        >
                            {getInitials(user?.name)}
                        </div>
                        <div className="sidebar-user-info">
                            <span className="sidebar-user-name">{user?.name}</span>
                            <span className="sidebar-user-email">{user?.email}</span>
                        </div>
                    </div>
                    <div style={{ display: 'flex', gap: '8px' }}>
                        <button onClick={toggleTheme} className="btn btn-ghost btn-sm sidebar-logout" data-tooltip="Toggle Theme">
                            {theme === 'dark' ? <Sun size={16} /> : <Moon size={16} />}
                        </button>
                        <button onClick={logout} className="btn btn-ghost btn-sm sidebar-logout" data-tooltip="Logout">
                            <LogOut size={16} />
                        </button>
                    </div>
                </div>
            </aside>

            {/* ── Main Content ── */}
            <main className="dashboard-main">
                <header className="dashboard-header">
                    <div>
                        <h1 className="dashboard-title">Workspaces</h1>
                        <p className="dashboard-subtitle">
                            {workspaces.length} workspace{workspaces.length !== 1 ? 's' : ''}
                        </p>
                    </div>
                    <div className="dashboard-actions">
                        <div className="search-box">
                            <Search size={16} />
                            <input
                                type="text"
                                placeholder="Search workspaces..."
                                value={search}
                                onChange={(e) => setSearch(e.target.value)}
                            />
                        </div>
                        <button
                            className="btn btn-primary"
                            onClick={() => setShowCreate(true)}
                        >
                            <Plus size={18} />
                            New Workspace
                        </button>
                    </div>
                </header>

                {loading ? (
                    <div className="dashboard-loading">
                        <div className="spinner spinner-lg" />
                    </div>
                ) : filtered.length === 0 ? (
                    <div className="empty-state">
                        <Layers size={64} />
                        <h3>{search ? 'No results found' : 'No workspaces yet'}</h3>
                        <p>{search ? 'Try a different search term' : 'Create your first workspace to get started'}</p>
                        {!search && (
                            <button
                                className="btn btn-primary"
                                style={{ marginTop: '1rem' }}
                                onClick={() => setShowCreate(true)}
                            >
                                <Plus size={18} />
                                Create Workspace
                            </button>
                        )}
                    </div>
                ) : (
                    <motion.div
                        className="workspace-grid"
                        variants={container}
                        initial="hidden"
                        animate="show"
                    >
                        {filtered.map((ws) => (
                            <motion.div
                                key={ws._id}
                                className="card card-glow workspace-card"
                                variants={item}
                                onClick={() => navigate(`/workspace/${ws._id}`)}
                                whileHover={{ scale: 1.02 }}
                                whileTap={{ scale: 0.98 }}
                            >
                                <div className="workspace-card-top">
                                    <div
                                        className="workspace-card-icon"
                                        style={{ background: getAvatarColor(ws.name) }}
                                    >
                                        {getInitials(ws.name)}
                                    </div>
                                    <button
                                        className="btn btn-ghost btn-icon sm"
                                        onClick={(e) => {
                                            e.stopPropagation();
                                            handleDelete(ws._id);
                                        }}
                                        data-tooltip="Delete"
                                    >
                                        ×
                                    </button>
                                </div>
                                <h3 className="workspace-card-name">{ws.name}</h3>
                                {ws.description && (
                                    <p className="workspace-card-desc">{ws.description}</p>
                                )}
                                <div className="workspace-card-footer">
                                    <div className="workspace-card-meta">
                                        <Users size={14} />
                                        <span>{ws.members?.length || 1} member{(ws.members?.length || 1) > 1 ? 's' : ''}</span>
                                    </div>
                                    <div className="workspace-card-meta">
                                        <Clock size={14} />
                                        <span>{formatDate(ws.createdAt)}</span>
                                    </div>
                                </div>
                                <div className="workspace-card-arrow">
                                    <ChevronRight size={18} />
                                </div>
                            </motion.div>
                        ))}
                    </motion.div>
                )}
            </main>

            {/* ── Create Modal ── */}
            <AnimatePresence>
                {showCreate && (
                    <motion.div
                        className="modal-overlay"
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        onClick={() => setShowCreate(false)}
                    >
                        <motion.div
                            className="modal"
                            initial={{ opacity: 0, scale: 0.9, y: 20 }}
                            animate={{ opacity: 1, scale: 1, y: 0 }}
                            exit={{ opacity: 0, scale: 0.9, y: 20 }}
                            transition={{ duration: 0.3, ease: [0.16, 1, 0.3, 1] }}
                            onClick={(e) => e.stopPropagation()}
                        >
                            <h2>Create Workspace</h2>
                            <form onSubmit={handleCreate} className="modal-form">
                                <div className="input-group">
                                    <label>Workspace Name</label>
                                    <input
                                        className="input"
                                        placeholder="My Team Workspace"
                                        value={newName}
                                        onChange={(e) => setNewName(e.target.value)}
                                        autoFocus
                                    />
                                </div>
                                <div className="input-group">
                                    <label>Description (optional)</label>
                                    <input
                                        className="input"
                                        placeholder="A brief description..."
                                        value={newDesc}
                                        onChange={(e) => setNewDesc(e.target.value)}
                                    />
                                </div>
                                <div className="modal-actions">
                                    <button
                                        type="button"
                                        className="btn btn-secondary"
                                        onClick={() => setShowCreate(false)}
                                    >
                                        Cancel
                                    </button>
                                    <button
                                        type="submit"
                                        className="btn btn-primary"
                                        disabled={creating}
                                    >
                                        {creating ? <div className="spinner" /> : 'Create'}
                                    </button>
                                </div>
                            </form>
                        </motion.div>
                    </motion.div>
                )}
            </AnimatePresence>
        </motion.div>
    );
}
