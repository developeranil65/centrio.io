import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import {
    Plus, ArrowLeft, Pencil, Layout, Database,
    Trash2, Users, UserPlus, Clock, ChevronRight
} from 'lucide-react';
import { getWorkspace, addMember } from '../api/workspace.api';
import { getBoards, createBoard, deleteBoard } from '../api/board.api';
import { useAuth } from '../context/AuthContext';
import { getInitials, getAvatarColor, formatDate } from '../utils/helpers';
import toast from 'react-hot-toast';

const MODE_ICONS = {
    whiteboard: <Pencil size={20} />,
    architecture: <Layout size={20} />,
    er: <Database size={20} />,
};

const MODE_COLORS = {
    whiteboard: '#6366f1',
    architecture: '#06b6d4',
    er: '#10b981',
};

export default function WorkspaceDetail() {
    const { id } = useParams();
    const navigate = useNavigate();
    const { user } = useAuth();
    const [workspace, setWorkspace] = useState(null);
    const [boards, setBoards] = useState([]);
    const [loading, setLoading] = useState(true);
    const [showCreate, setShowCreate] = useState(false);
    const [showInvite, setShowInvite] = useState(false);
    const [newTitle, setNewTitle] = useState('');
    const [newMode, setNewMode] = useState('whiteboard');
    const [inviteEmail, setInviteEmail] = useState('');
    const [inviteRole, setInviteRole] = useState('editor');

    useEffect(() => {
        fetchData();
    }, [id]);

    const fetchData = async () => {
        try {
            const [wsRes, boardRes] = await Promise.all([
                getWorkspace(id),
                getBoards(id),
            ]);
            setWorkspace(wsRes.data);
            setBoards(boardRes.data);
        } catch (err) {
            toast.error('Failed to load workspace');
            navigate('/dashboard');
        } finally {
            setLoading(false);
        }
    };

    const handleCreateBoard = async (e) => {
        e.preventDefault();
        if (!newTitle.trim()) return toast.error('Title required');
        try {
            const { data } = await createBoard(id, { title: newTitle, mode: newMode });
            setBoards([data, ...boards]);
            setShowCreate(false);
            setNewTitle('');
            toast.success('Board created!');
        } catch (err) {
            toast.error('Failed to create board');
        }
    };

    const handleDeleteBoard = async (boardId) => {
        if (!confirm('Delete this board and all its pages?')) return;
        try {
            await deleteBoard(boardId);
            setBoards(boards.filter((b) => b._id !== boardId));
            toast.success('Board deleted');
        } catch {
            toast.error('Failed to delete');
        }
    };

    const handleInvite = async (e) => {
        e.preventDefault();
        if (!inviteEmail.trim()) return toast.error('Email address required');
        try {
            await addMember(id, { email: inviteEmail, role: inviteRole });
            toast.success('Member invited!');
            setShowInvite(false);
            setInviteEmail('');
            fetchData();
        } catch (err) {
            toast.error(err.response?.data?.message || 'Failed to invite member');
        }
    };

    if (loading) {
        return (
            <div className="page-loading">
                <div className="spinner spinner-lg" />
            </div>
        );
    }

    const container = {
        hidden: { opacity: 0 },
        show: { opacity: 1, transition: { staggerChildren: 0.05 } },
    };

    const item = {
        hidden: { opacity: 0, y: 15 },
        show: { opacity: 1, y: 0 },
    };

    return (
        <motion.div
            className="workspace-detail"
            initial={{ opacity: 0, scale: 0.98 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.4, ease: "easeOut" }}
        >
            <header className="workspace-header glass">
                <div className="workspace-header-left">
                    <button
                        className="btn btn-ghost btn-icon"
                        onClick={() => navigate('/dashboard')}
                        data-tooltip="Back"
                    >
                        <ArrowLeft size={20} />
                    </button>
                    <div>
                        <h1 className="workspace-title">{workspace?.name}</h1>
                        {workspace?.description && (
                            <p className="workspace-desc">{workspace.description}</p>
                        )}
                    </div>
                </div>
                <div className="workspace-header-right">
                    <div className="avatar-group">
                        {workspace?.members?.slice(0, 5).map((m) => (
                            <div
                                key={m.user?._id || m.user}
                                className="avatar avatar-sm"
                                style={{ background: getAvatarColor(m.user?.name || '') }}
                                data-tooltip={m.user?.name || 'Member'}
                            >
                                {getInitials(m.user?.name || '?')}
                            </div>
                        ))}
                        {(workspace?.members?.length || 0) > 5 && (
                            <div className="avatar avatar-sm" style={{ background: 'var(--surface-active)' }}>
                                +{workspace.members.length - 5}
                            </div>
                        )}
                    </div>
                    <button className="btn btn-secondary btn-sm" onClick={() => setShowInvite(true)}>
                        <UserPlus size={16} /> Invite
                    </button>
                    <button className="btn btn-primary" onClick={() => setShowCreate(true)}>
                        <Plus size={18} /> New Board
                    </button>
                </div>
            </header>

            {boards.length === 0 ? (
                <div className="empty-state">
                    <Layout size={64} />
                    <h3>No boards yet</h3>
                    <p>Create your first board to start collaborating</p>
                    <button
                        className="btn btn-primary"
                        style={{ marginTop: '1rem' }}
                        onClick={() => setShowCreate(true)}
                    >
                        <Plus size={18} /> Create Board
                    </button>
                </div>
            ) : (
                <motion.div
                    className="boards-grid"
                    variants={container}
                    initial="hidden"
                    animate="show"
                >
                    {boards.map((board) => (
                        <motion.div
                            key={board._id}
                            className="card card-glow board-card"
                            variants={item}
                            onClick={() => navigate(`/board/${board._id}`)}
                            whileHover={{ scale: 1.02 }}
                            whileTap={{ scale: 0.98 }}
                        >
                            <div className="board-card-header">
                                <div
                                    className="board-mode-badge"
                                    style={{ background: `${MODE_COLORS[board.mode]}20`, color: MODE_COLORS[board.mode] }}
                                >
                                    {MODE_ICONS[board.mode]}
                                    <span>{board.mode}</span>
                                </div>
                                <button
                                    className="btn btn-ghost btn-icon sm"
                                    onClick={(e) => {
                                        e.stopPropagation();
                                        handleDeleteBoard(board._id);
                                    }}
                                >
                                    <Trash2 size={14} />
                                </button>
                            </div>
                            <h3 className="board-card-title">{board.title}</h3>
                            <div className="board-card-footer">
                                <Clock size={14} />
                                <span>{formatDate(board.createdAt)}</span>
                            </div>
                            <div className="workspace-card-arrow">
                                <ChevronRight size={18} />
                            </div>
                        </motion.div>
                    ))}
                </motion.div>
            )}

            {/* Create Board Modal */}
            <AnimatePresence>
                {showCreate && (
                    <motion.div className="modal-overlay" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} onClick={() => setShowCreate(false)}>
                        <motion.div className="modal" initial={{ opacity: 0, scale: 0.9, y: 20 }} animate={{ opacity: 1, scale: 1, y: 0 }} exit={{ opacity: 0, scale: 0.9, y: 20 }} onClick={(e) => e.stopPropagation()}>
                            <h2>Create Board</h2>
                            <form onSubmit={handleCreateBoard} className="modal-form">
                                <div className="input-group">
                                    <label>Board Title</label>
                                    <input className="input" placeholder="System Architecture" value={newTitle} onChange={(e) => setNewTitle(e.target.value)} autoFocus />
                                </div>
                                <div className="input-group">
                                    <label>Mode</label>
                                    <div className="mode-selector">
                                        {['whiteboard', 'architecture', 'er'].map((m) => (
                                            <button
                                                key={m}
                                                type="button"
                                                className={`mode-option ${newMode === m ? 'active' : ''}`}
                                                onClick={() => setNewMode(m)}
                                                style={newMode === m ? { borderColor: MODE_COLORS[m], background: `${MODE_COLORS[m]}15` } : {}}
                                            >
                                                {MODE_ICONS[m]}
                                                <span>{m === 'er' ? 'ER Diagram' : m.charAt(0).toUpperCase() + m.slice(1)}</span>
                                            </button>
                                        ))}
                                    </div>
                                </div>
                                <div className="modal-actions">
                                    <button type="button" className="btn btn-secondary" onClick={() => setShowCreate(false)}>Cancel</button>
                                    <button type="submit" className="btn btn-primary">Create</button>
                                </div>
                            </form>
                        </motion.div>
                    </motion.div>
                )}
            </AnimatePresence>

            {/* Invite Modal */}
            <AnimatePresence>
                {showInvite && (
                    <motion.div className="modal-overlay" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} onClick={() => setShowInvite(false)}>
                        <motion.div className="modal" initial={{ opacity: 0, scale: 0.9, y: 20 }} animate={{ opacity: 1, scale: 1, y: 0 }} exit={{ opacity: 0, scale: 0.9, y: 20 }} onClick={(e) => e.stopPropagation()}>
                            <h2>Invite Member</h2>
                            <form onSubmit={handleInvite} className="modal-form">
                                <div className="input-group">
                                    <label>Email Address</label>
                                    <input className="input" type="email" placeholder="colleague@company.com" value={inviteEmail} onChange={(e) => setInviteEmail(e.target.value)} autoFocus />
                                </div>
                                <div className="input-group">
                                    <label>Role</label>
                                    <select className="input" value={inviteRole} onChange={(e) => setInviteRole(e.target.value)}>
                                        <option value="editor">Editor</option>
                                        <option value="viewer">Viewer</option>
                                    </select>
                                </div>
                                <div className="modal-actions">
                                    <button type="button" className="btn btn-secondary" onClick={() => setShowInvite(false)}>Cancel</button>
                                    <button type="submit" className="btn btn-primary">Invite</button>
                                </div>
                            </form>
                        </motion.div>
                    </motion.div>
                )}
            </AnimatePresence>
        </motion.div>
    );
}
