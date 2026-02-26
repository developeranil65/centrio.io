import { useState, useEffect, useRef, useCallback } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Stage, Layer, Line, Rect, Circle, Text, Arrow, Transformer, Group, Path } from 'react-konva';
import { motion, AnimatePresence } from 'framer-motion';
import {
    ArrowLeft, Pencil, Eraser, Square, Circle as CircleIcon,
    Type, MousePointer, ArrowUpRight, Undo2, Redo2,
    Download, FileImage, Plus, Trash2, MessageCircle,
    Send, X, Move, Users, ZoomIn, ZoomOut, Video,
    Database, Link2, StickyNote, Paintbrush, GitBranch,
    LayoutGrid, Copy, Paperclip, Sun, Moon, Share2
} from 'lucide-react';
import { getBoard, getBoards } from '../api/board.api';
import { getPages, createPage, updatePage, deletePage } from '../api/page.api';
import { uploadFile } from '../api/upload.api';
import { useSocket } from '../context/SocketContext';
import { useAuth } from '../context/AuthContext';
import { useTheme } from '../context/ThemeContext';
import { getInitials, getAvatarColor, formatTime } from '../utils/helpers';
import ShapeLibrary from '../components/canvas/ShapeLibrary';
import EREntity from '../components/canvas/EREntity';
import EREditModal from '../components/canvas/EREditModal';
import VideoCall from '../components/canvas/VideoCall';
import { ARCH_ICONS } from '../utils/archIcons';
import toast from 'react-hot-toast';
import jsPDF from 'jspdf';

/* ─── Tool definitions ─── */
const TOOLS = [
    { id: 'select', icon: MousePointer, label: 'Select', key: 'V' },
    { id: 'pencil', icon: Pencil, label: 'Pencil', key: 'P' },
    { id: 'eraser', icon: Eraser, label: 'Eraser', key: 'E' },
    { id: 'rect', icon: Square, label: 'Rectangle', key: 'R' },
    { id: 'circle', icon: CircleIcon, label: 'Circle', key: 'O' },
    { id: 'text', icon: Type, label: 'Text', key: 'T' },
    { id: 'arrow', icon: ArrowUpRight, label: 'Arrow', key: 'A' },
    { id: 'pan', icon: Move, label: 'Pan', key: 'H' },
];

const COLORS = ['#f1f5f9', '#6366f1', '#8b5cf6', '#06b6d4', '#10b981', '#f59e0b', '#ef4444', '#ec4899'];
const SIZES = [2, 4, 6, 10, 16];

export default function BoardPage() {
    const { id: boardId } = useParams();
    const navigate = useNavigate();
    const socket = useSocket();
    const { user } = useAuth();
    const { theme, toggleTheme } = useTheme();

    // Guest fallback — anonymous users who joined via room code
    const guestName = sessionStorage.getItem('guestName');
    const guestEmail = sessionStorage.getItem('guestEmail');
    // Unique guest ID persisted in sessionStorage so it stays consistent across re-renders
    const getGuestId = () => {
        let gid = sessionStorage.getItem('guestId');
        if (!gid) {
            gid = `guest-${Date.now()}-${Math.random().toString(36).substr(2, 6)}`;
            sessionStorage.setItem('guestId', gid);
        }
        return gid;
    };
    const effectiveUser = user || (guestName ? { _id: getGuestId(), name: guestName, email: guestEmail || '' } : null);

    const [board, setBoard] = useState(null);
    const [workspaceBoards, setWorkspaceBoards] = useState([]);
    const [pages, setPages] = useState([]);
    const [activePageId, setActivePageId] = useState(null);
    const activePageIdRef = useRef(null);
    const [loading, setLoading] = useState(true);

    // Canvas state
    const [tool, setTool] = useState('pencil');
    const [color, setColor] = useState('#f1f5f9');
    const [brushSize, setBrushSize] = useState(4);
    const [lines, setLines] = useState([]);
    const [shapes, setShapes] = useState([]);
    const [isDrawing, setIsDrawing] = useState(false);

    // Dynamically adjust primary ink color for light mode contrast
    const activeColors = [
        theme === 'light' ? '#0f172a' : '#f1f5f9',
        '#6366f1', '#8b5cf6', '#06b6d4', '#10b981', '#f59e0b', '#ef4444', '#ec4899'
    ];

    // Migrate brush color on theme swap to prevent drawing with invisible ink
    useEffect(() => {
        if (theme === 'light' && color === '#f1f5f9') setColor('#0f172a');
        if (theme === 'dark' && color === '#0f172a') setColor('#f1f5f9');
    }, [theme, color]);

    // ── History (undo/redo) — ref-based to avoid stale closures ──
    const [historyLen, setHistoryLen] = useState(0); // trigger re-renders
    const [historyIdx, setHistoryIdx] = useState(-1);
    const historyRef = useRef([]);
    const linesRef = useRef([]);
    const shapesRef = useRef([]);

    // Keep refs in sync with state
    useEffect(() => { linesRef.current = lines; }, [lines]);
    useEffect(() => { shapesRef.current = shapes; }, [shapes]);
    useEffect(() => { activePageIdRef.current = activePageId; }, [activePageId]);

    // Shape creation by dragging
    const [drawingShape, setDrawingShape] = useState(null);

    // ── Multi-select: Set of IDs ──
    const [selectedIds, setSelectedIds] = useState(new Set());

    // ── Inline text editing (no more prompt!) ──
    const [editingText, setEditingText] = useState(null); // { id, x, y, width, height, value, type }
    const textareaRef = useRef(null);
    const fileInputRef = useRef(null);

    // ER edit modal
    const [editingERShape, setEditingERShape] = useState(null);

    // Stage transform
    const [stageScale, setStageScale] = useState(1);
    const [stagePos, setStagePos] = useState({ x: 0, y: 0 });

    // Chat
    const [showChat, setShowChat] = useState(false);
    const [chatMessages, setChatMessages] = useState([]);
    const [chatInput, setChatInput] = useState('');

    const [showVideo, setShowVideo] = useState(false);

    // Recording
    const [isRecording, setIsRecording] = useState(false);
    const mediaRecorderRef = useRef(null);
    const recordedChunksRef = useRef([]);

    // Presence
    const [remoteCursors, setRemoteCursors] = useState({});
    const [onlineUsers, setOnlineUsers] = useState([]);

    // Track remote user strokes by userId → line index for multi-user drawing
    const remoteStrokesRef = useRef({});

    const stageRef = useRef(null);
    const containerRef = useRef(null);
    const trRef = useRef(null);
    const [stageSize, setStageSize] = useState({ width: 800, height: 600 });

    // ── BUG FIX 1: Page data ref-map — avoids stale closure issues ──
    const pageDataRef = useRef({}); // { pageId: { drawings, elements } }

    // ── Load board and pages ──
    useEffect(() => {
        const load = async () => {
            try {
                const [boardRes, pagesRes] = await Promise.all([
                    getBoard(boardId),
                    getPages(boardId),
                ]);
                const b = boardRes.data;
                setBoard(b);

                // Fetch other boards in the same workspace for the switcher (only for auth users)
                if (user && b.workspace) {
                    try {
                        const wsId = typeof b.workspace === 'object' ? b.workspace._id : b.workspace;
                        const wsBoards = await getBoards(wsId);
                        setWorkspaceBoards(wsBoards.data);
                    } catch (err) {
                        console.error('Failed to load workspace boards', err);
                    }
                }

                const pgs = pagesRes.data;
                setPages(pgs);
                // Populate page data ref
                pgs.forEach(p => {
                    pageDataRef.current[p._id] = {
                        drawings: p.drawings || [],
                        elements: p.elements || [],
                    };
                });
                if (pgs.length > 0) {
                    setActivePageId(pgs[0]._id);
                    const firstData = pageDataRef.current[pgs[0]._id];
                    setLines(firstData.drawings);
                    setShapes(firstData.elements);
                    // Init history with first snapshot
                    const snap = { lines: [...firstData.drawings], shapes: [...firstData.elements] };
                    historyRef.current = [snap];
                    setHistoryIdx(0);
                    setHistoryLen(1);
                }

                // Force default tool depending on board type
                const bMode = boardRes.data.mode;
                if (bMode === 'architecture' || bMode === 'er') {
                    setTool('select');
                }
            } catch {
                toast.error('Failed to load board');
                navigate('/dashboard');
            } finally {
                setLoading(false);
            }
        };
        load();
    }, [boardId]);

    // ── Resize — use ResizeObserver so stage resizes when panels toggle ──
    useEffect(() => {
        const container = containerRef.current;
        if (!container) return;
        const obs = new ResizeObserver((entries) => {
            for (const entry of entries) {
                setStageSize({ width: entry.contentRect.width, height: entry.contentRect.height });
            }
        });
        obs.observe(container);
        return () => obs.disconnect();
    }, [loading]);

    // ── Transformer attach — supports multi-select ──
    useEffect(() => {
        if (!trRef.current) return;
        const stage = stageRef.current;
        if (!stage) return;
        if (selectedIds.size > 0) {
            const nodes = [];
            selectedIds.forEach(id => {
                const node = stage.findOne('#' + id);
                if (node) nodes.push(node);
            });
            trRef.current.nodes(nodes);
            trRef.current.getLayer()?.batchDraw();
        } else {
            trRef.current.nodes([]);
            trRef.current.getLayer()?.batchDraw();
        }
    }, [selectedIds, shapes]);

    // ── Socket room ──
    useEffect(() => {
        if (!socket || !boardId) return;
        // Send workspaceId along with board join for workspace-scoped chat/video
        const wsId = board?.workspace;
        socket.emit('room:join', { boardId, workspaceId: wsId });

        socket.on('room:user-joined', (data) => {
            setOnlineUsers((prev) => {
                if (prev.find(u => u.userId === data.userId)) return prev;
                return [...prev, data];
            });
        });

        socket.on('room:user-left', (data) => {
            setOnlineUsers((prev) => prev.filter((u) => u.userId !== data.userId));
            setRemoteCursors((prev) => {
                const next = { ...prev };
                delete next[data.userId];
                return next;
            });
            // Clean up stroke tracking for this user
            delete remoteStrokesRef.current[data.userId];
        });

        // Remote drawing — per-userId stroke tracking for multi-user support
        socket.on('draw:start', (data) => {
            if (data.pageId && data.pageId !== activePageIdRef.current) return;
            setLines((prev) => {
                const newLine = { points: data.stroke?.points || [], color: data.stroke?.color || '#fff', width: data.stroke?.width || 4, tool: data.stroke?.tool || 'pencil', userId: data.userId };
                const newLines = [...prev, newLine];
                // Record this user's line index
                remoteStrokesRef.current[data.userId] = newLines.length - 1;
                return newLines;
            });
        });
        socket.on('draw:move', (data) => {
            if (data.pageId && data.pageId !== activePageIdRef.current) return;
            const lineIdx = remoteStrokesRef.current[data.userId];
            if (lineIdx === undefined) return;
            setLines((prev) => {
                if (lineIdx >= prev.length) return prev;
                const updated = [...prev];
                updated[lineIdx] = { ...updated[lineIdx], points: [...updated[lineIdx].points, ...(data.points || [])] };
                return updated;
            });
        });
        socket.on('draw:end', (data) => {
            if (data?.userId) delete remoteStrokesRef.current[data.userId];
        });
        socket.on('draw:clear', (data) => {
            if (data.pageId === activePageIdRef.current) {
                setLines([]);
                setShapes([]);
            }
        });

        // Remote shapes — only apply if on same page
        socket.on('shape:add', (data) => {
            if (data.pageId && data.pageId !== activePageIdRef.current) return;
            setShapes((prev) => [...prev, data.shape]);
        });
        socket.on('shape:move', (data) => {
            if (data.pageId && data.pageId !== activePageIdRef.current) return;
            setShapes((prev) => prev.map(s => s.id === data.shapeId ? { ...s, x: data.x, y: data.y } : s));
        });
        socket.on('shape:update', (data) => {
            if (data.pageId && data.pageId !== activePageIdRef.current) return;
            setShapes((prev) => prev.map(s => s.id === data.shapeId ? { ...s, ...data.updates } : s));
        });
        socket.on('shape:delete', (data) => {
            if (data.pageId && data.pageId !== activePageIdRef.current) return;
            setShapes((prev) => prev.filter(s => s.id !== data.shapeId));
        });

        // Cursor presence
        socket.on('cursor:move', (data) => {
            if (data.pageId === activePageIdRef.current) {
                setRemoteCursors((prev) => ({ ...prev, [data.userId]: data }));
            }
        });

        // Chat
        socket.on('chat:message', (msg) => {
            setChatMessages((prev) => [...prev, msg]);
        });

        // Page sync — new page created by another user
        socket.on('page:create', (data) => {
            if (data.page) {
                setPages(prev => {
                    if (prev.find(p => p._id === data.page._id)) return prev;
                    return [...prev, data.page];
                });
            }
        });

        return () => {
            socket.emit('room:leave', { boardId });
            socket.off('room:user-joined');
            socket.off('room:user-left');
            socket.off('draw:start');
            socket.off('draw:move');
            socket.off('draw:end');
            socket.off('draw:clear');
            socket.off('shape:add');
            socket.off('shape:move');
            socket.off('shape:update');
            socket.off('shape:delete');
            socket.off('cursor:move');
            socket.off('chat:message');
            socket.off('page:create');
        };
    }, [socket, boardId, board?.workspace]);

    // ── Generate unique shape ID ──
    const genId = () => `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;

    // ── BUG FIX 3: History with refs — always reads latest state ──
    const pushHistory = useCallback(() => {
        const state = {
            lines: JSON.parse(JSON.stringify(linesRef.current)),
            shapes: JSON.parse(JSON.stringify(shapesRef.current)),
        };
        const currentIdx = historyRef.current.length > 0 ? historyRef.current._idx ?? historyRef.current.length - 1 : -1;
        const newHistory = historyRef.current.slice(0, currentIdx + 1);
        newHistory.push(state);
        // Limit history to 50 entries
        if (newHistory.length > 50) newHistory.shift();
        historyRef.current = newHistory;
        historyRef.current._idx = newHistory.length - 1;
        setHistoryIdx(newHistory.length - 1);
        setHistoryLen(newHistory.length);
    }, []);

    const undo = useCallback(() => {
        const idx = historyRef.current._idx ?? historyRef.current.length - 1;
        if (idx <= 0) return;
        const prevIdx = idx - 1;
        const prev = historyRef.current[prevIdx];
        if (!prev) return;
        setLines(prev.lines);
        setShapes(prev.shapes);
        historyRef.current._idx = prevIdx;
        setHistoryIdx(prevIdx);
    }, []);

    const redo = useCallback(() => {
        const idx = historyRef.current._idx ?? historyRef.current.length - 1;
        if (idx >= historyRef.current.length - 1) return;
        const nextIdx = idx + 1;
        const next = historyRef.current[nextIdx];
        if (!next) return;
        setLines(next.lines);
        setShapes(next.shapes);
        historyRef.current._idx = nextIdx;
        setHistoryIdx(nextIdx);
    }, []);

    // ── Drawing handlers — drag-to-size for shapes ──
    const handleMouseDown = (e) => {
        // Don't process canvas clicks while inline text editor is open
        if (editingText) return;

        // Click on empty stage → deselect
        if (e.target === e.target.getStage()) {
            setSelectedIds(new Set());
        }
        if (tool === 'select' || tool === 'pan') return;

        const stage = e.target.getStage();
        const pos = stage.getRelativePointerPosition();

        if (tool === 'pencil' || tool === 'eraser') {
            setIsDrawing(true);
            const newLine = {
                points: [pos.x, pos.y],
                color: tool === 'eraser' ? 'rgba(0,0,0,1)' : color,
                width: tool === 'eraser' ? brushSize * 3 : brushSize,
                tool,
            };
            setLines(prev => [...prev, newLine]);
            socket?.emit('draw:start', { boardId, pageId: activePageId, stroke: newLine });
        } else if (tool === 'rect') {
            setDrawingShape({ id: genId(), type: 'rect', x: pos.x, y: pos.y, width: 0, height: 0, fill: 'transparent', stroke: color, strokeWidth: 2 });
            setIsDrawing(true);
        } else if (tool === 'circle') {
            setDrawingShape({ id: genId(), type: 'circle', x: pos.x, y: pos.y, radius: 0, fill: 'transparent', stroke: color, strokeWidth: 2 });
            setIsDrawing(true);
        } else if (tool === 'arrow') {
            setDrawingShape({ id: genId(), type: 'arrow', points: [pos.x, pos.y, pos.x, pos.y], stroke: color, strokeWidth: 2 });
            setIsDrawing(true);
        } else if (tool === 'sticky') {
            const id = genId();
            const shape = { id, type: 'sticky', x: pos.x, y: pos.y, width: 180, height: 140, text: '', fill: color === '#f1f5f9' ? '#f59e0b' : color, fontSize: 14 };
            setShapes(prev => [...prev, shape]);
            socket?.emit('shape:add', { boardId, pageId: activePageId, shape });
            pushHistory();
        } else if (tool === 'text') {
            const id = genId();
            const shape = { id, type: 'text', x: pos.x, y: pos.y, text: 'Text', fill: color, fontSize: 18 };
            setShapes(prev => [...prev, shape]);
            socket?.emit('shape:add', { boardId, pageId: activePageId, shape });
            // Open inline editor immediately
            const stageBox = containerRef.current?.getBoundingClientRect();
            if (stageBox) {
                const absX = stageBox.left + pos.x * stageScale + stagePos.x;
                const absY = stageBox.top + pos.y * stageScale + stagePos.y;
                setEditingText({ id, x: absX, y: absY, width: 200, height: 32, value: 'Text', type: 'text' });
            }
        }
    };

    const handleMouseMove = (e) => {
        const stage = e.target.getStage();
        const pos = stage.getRelativePointerPosition();

        // Emit cursor
        if (socket && boardId) {
            socket.emit('cursor:move', { boardId, x: pos.x, y: pos.y, pageId: activePageId });
        }

        if (!isDrawing) return;

        if (tool === 'pencil' || tool === 'eraser') {
            setLines(prev => {
                const updated = [...prev];
                const last = { ...updated[updated.length - 1] };
                last.points = [...last.points, pos.x, pos.y];
                updated[updated.length - 1] = last;
                return updated;
            });
            socket?.emit('draw:move', { boardId, pageId: activePageId, points: [pos.x, pos.y] });
        } else if (drawingShape) {
            if (drawingShape.type === 'rect') {
                setDrawingShape(prev => ({ ...prev, width: pos.x - prev.x, height: pos.y - prev.y }));
            } else if (drawingShape.type === 'circle') {
                const dx = pos.x - drawingShape.x;
                const dy = pos.y - drawingShape.y;
                setDrawingShape(prev => ({ ...prev, radius: Math.sqrt(dx * dx + dy * dy) }));
            } else if (drawingShape.type === 'arrow') {
                setDrawingShape(prev => ({ ...prev, points: [prev.points[0], prev.points[1], pos.x, pos.y] }));
            }
        }
    };

    const handleMouseUp = () => {
        if (isDrawing && (tool === 'pencil' || tool === 'eraser')) {
            setIsDrawing(false);
            socket?.emit('draw:end', { boardId, pageId: activePageId });
            // Defer pushHistory so state has updated
            setTimeout(() => pushHistory(), 0);
        } else if (isDrawing && drawingShape) {
            setIsDrawing(false);
            let commitShape = { ...drawingShape };
            let shouldCommit = true;

            if (commitShape.type === 'rect') {
                if (commitShape.width < 0) { commitShape.x += commitShape.width; commitShape.width = Math.abs(commitShape.width); }
                if (commitShape.height < 0) { commitShape.y += commitShape.height; commitShape.height = Math.abs(commitShape.height); }
                if (commitShape.width < 5 && commitShape.height < 5) shouldCommit = false;
            } else if (commitShape.type === 'circle') {
                if (commitShape.radius < 3) shouldCommit = false;
            } else if (commitShape.type === 'arrow') {
                const dx = commitShape.points[2] - commitShape.points[0];
                const dy = commitShape.points[3] - commitShape.points[1];
                if (Math.sqrt(dx * dx + dy * dy) < 5) shouldCommit = false;
            }

            if (shouldCommit) {
                // In ER mode, auto-set default cardinality on arrows
                if (isERMode && commitShape.type === 'arrow') {
                    commitShape.cardinality = '1:N';
                }
                setShapes(prev => [...prev, commitShape]);
                socket?.emit('shape:add', { boardId, pageId: activePageId, shape: commitShape });
                setTimeout(() => pushHistory(), 0);
                // In ER mode, auto-select the arrow and switch back to select tool
                if (isERMode && commitShape.type === 'arrow') {
                    setSelectedIds(new Set([commitShape.id]));
                    setTool('select');
                }
            }
            setDrawingShape(null);
        }
    };

    // ── BUG FIX 2: Multi-select — Shift+Click adds/removes, plain click sets single ──
    const handleShapeClick = (e, shapeId) => {
        // Eraser tool: click shape to delete it
        if (tool === 'eraser') {
            e.cancelBubble = true;
            setShapes(prev => prev.filter(s => s.id !== shapeId));
            socket?.emit('shape:delete', { boardId, pageId: activePageId, shapeId });
            setTimeout(() => pushHistory(), 0);
            return;
        }
        if (tool !== 'select') return;
        e.cancelBubble = true;

        if (e.evt?.shiftKey) {
            // Toggle this shape in the selection set
            setSelectedIds(prev => {
                const next = new Set(prev);
                if (next.has(shapeId)) next.delete(shapeId);
                else next.add(shapeId);
                return next;
            });
        } else {
            setSelectedIds(new Set([shapeId]));
        }
    };

    // ── Handle shape transform end (resize) ──
    const handleTransformEnd = (e, shape) => {
        const node = e.target;
        const updates = {};
        if (shape.type === 'rect' || shape.type === 'sticky') {
            updates.x = node.x(); updates.y = node.y();
            updates.width = Math.max(5, node.width() * node.scaleX());
            updates.height = Math.max(5, node.height() * node.scaleY());
            node.scaleX(1); node.scaleY(1);
        } else if (shape.type === 'circle') {
            updates.x = node.x(); updates.y = node.y();
            updates.radius = Math.max(5, shape.radius * Math.max(node.scaleX(), node.scaleY()));
            node.scaleX(1); node.scaleY(1);
        } else if (shape.type === 'text') {
            updates.x = node.x(); updates.y = node.y();
            updates.fontSize = Math.max(8, shape.fontSize * node.scaleY());
            node.scaleX(1); node.scaleY(1);
        }
        setShapes(prev => prev.map(s => s.id === shape.id ? { ...s, ...updates } : s));
        socket?.emit('shape:update', { boardId, pageId: activePageId, shapeId: shape.id, updates });
        setTimeout(() => pushHistory(), 0);
    };

    // ── Handle drag end for shapes — supports multi-drag ──
    const handleShapeDragEnd = (e, shape) => {
        const node = e.target;
        const dx = node.x() - shape.x;
        const dy = node.y() - shape.y;

        if (selectedIds.size > 1 && selectedIds.has(shape.id)) {
            // Move all selected shapes by the same delta
            setShapes(prev => prev.map(s => {
                if (selectedIds.has(s.id)) {
                    const newPos = s.id === shape.id
                        ? { x: node.x(), y: node.y() }
                        : { x: s.x + dx, y: s.y + dy };
                    socket?.emit('shape:move', { boardId, pageId: activePageId, shapeId: s.id, ...newPos });
                    return { ...s, ...newPos };
                }
                return s;
            }));
        } else {
            const pos = { x: node.x(), y: node.y() };
            setShapes(prev => prev.map(s => s.id === shape.id ? { ...s, ...pos } : s));
            socket?.emit('shape:move', { boardId, pageId: activePageId, shapeId: shape.id, ...pos });
        }
        setTimeout(() => pushHistory(), 0);
    };

    // ── Delete selected shapes ──
    const deleteSelected = useCallback(() => {
        if (selectedIds.size === 0) return;
        setShapes(prev => prev.filter(s => !selectedIds.has(s.id)));
        selectedIds.forEach(id => {
            socket?.emit('shape:delete', { boardId, pageId: activePageId, shapeId: id });
        });
        setSelectedIds(new Set());
        setTimeout(() => pushHistory(), 0);
    }, [selectedIds, boardId, activePageId, socket, pushHistory]);

    // ── Duplicate selected shapes ──
    const duplicateSelected = useCallback(() => {
        if (selectedIds.size === 0) return;
        const newShapes = [];
        shapesRef.current.forEach(s => {
            if (selectedIds.has(s.id)) {
                const clone = { ...s, id: genId(), x: (s.x || 0) + 20, y: (s.y || 0) + 20 };
                newShapes.push(clone);
            }
        });
        setShapes(prev => [...prev, ...newShapes]);
        newShapes.forEach(shape => {
            socket?.emit('shape:add', { boardId, pageId: activePageId, shape });
        });
        setSelectedIds(new Set(newShapes.map(s => s.id)));
        setTimeout(() => pushHistory(), 0);
    }, [selectedIds, boardId, activePageId, socket, pushHistory]);

    // Keyboard handler — tool shortcuts + actions
    useEffect(() => {
        const handleKey = (e) => {
            // Don't capture keys when editing text or ER modal
            if (editingERShape || editingText) return;
            const tag = e.target.tagName;
            if (tag === 'INPUT' || tag === 'TEXTAREA' || tag === 'SELECT') return;

            // Tool shortcuts (no modifiers)
            if (!e.ctrlKey && !e.metaKey && !e.altKey) {
                const key = e.key.toLowerCase();
                const bType = board?.type;
                const isArch = bType === 'architecture';
                const isER = bType === 'er';

                let allowed = true;
                if (isER && ['p', 'e', 'r', 'o', 't', 'a', 'n'].includes(key)) allowed = false;
                if (isArch && ['p', 'e', 'r', 'o', 'n'].includes(key)) allowed = false;

                if (allowed) {
                    switch (key) {
                        case 'v': setTool('select'); break;
                        case 'p': setTool('pencil'); break;
                        case 'e': setTool('eraser'); break;
                        case 'r': setTool('rect'); break;
                        case 'o': setTool('circle'); break;
                        case 't': setTool('text'); break;
                        case 'a': setTool('arrow'); break;
                        case 'h': setTool('pan'); break;
                        case 'n': setTool('sticky'); break;
                        case '1': setBrushSize(2); break;
                        case '2': setBrushSize(4); break;
                        case '3': setBrushSize(6); break;
                        case '4': setBrushSize(10); break;
                        case '5': setBrushSize(16); break;
                        case '+': case '=': setStageScale(s => Math.min(5, s * 1.2)); break;
                        case '-': setStageScale(s => Math.max(0.1, s / 1.2)); break;
                        default: break;
                    }
                }
            }

            // Action shortcuts
            if (e.key === 'Delete' || e.key === 'Backspace') {
                if (selectedIds.size > 0) { e.preventDefault(); deleteSelected(); }
            }
            if (e.key === 'Escape') setSelectedIds(new Set());
            if ((e.ctrlKey || e.metaKey) && e.key === 'z') { e.preventDefault(); undo(); }
            if ((e.ctrlKey || e.metaKey) && e.key === 'y') { e.preventDefault(); redo(); }
            if ((e.ctrlKey || e.metaKey) && e.key === 'd') { e.preventDefault(); duplicateSelected(); }
        };
        window.addEventListener('keydown', handleKey);
        return () => window.removeEventListener('keydown', handleKey);
    }, [selectedIds, editingERShape, editingText, deleteSelected, duplicateSelected, undo, redo, board?.type]);

    // ── BUG FIX 1: Page switching — save current to ref-map, load new from ref-map ──
    const switchPage = useCallback(async (pageId, pageObj) => {
        // Save current page data to ref-map AND backend
        const currentId = activePageId;
        if (currentId) {
            const currentDrawings = linesRef.current;
            const currentElements = shapesRef.current;
            pageDataRef.current[currentId] = { drawings: currentDrawings, elements: currentElements };
            try {
                await updatePage(currentId, { drawings: currentDrawings, elements: currentElements });
            } catch { }
        }

        // Load new page data from ref-map
        const data = pageObj
            ? { drawings: pageObj.drawings || [], elements: pageObj.elements || [] }
            : pageDataRef.current[pageId] || { drawings: [], elements: [] };

        setActivePageId(pageId);
        setLines(data.drawings);
        setShapes(data.elements);
        setSelectedIds(new Set());

        // Reset history for new page
        const snap = { lines: [...data.drawings], shapes: [...data.elements] };
        historyRef.current = [snap];
        historyRef.current._idx = 0;
        setHistoryIdx(0);
        setHistoryLen(1);

        socket?.emit('page:switch', { boardId, pageId });
    }, [activePageId, boardId, socket]);

    const addPage = async () => {
        try {
            const { data } = await createPage(boardId, { title: `Page ${pages.length + 1}` });
            // Store empty data for new page
            pageDataRef.current[data._id] = { drawings: [], elements: [] };
            setPages(prev => [...prev, data]);
            // Pass page object directly to avoid stale closure
            switchPage(data._id, data);
            socket?.emit('page:create', { boardId, page: data });
            toast.success('Page added');
        } catch {
            toast.error('Failed to add page');
        }
    };

    // ── Autosave (updates ref-map too) ──
    useEffect(() => {
        if (!activePageId) return;
        const timer = setTimeout(async () => {
            const currentDrawings = linesRef.current;
            const currentElements = shapesRef.current;
            pageDataRef.current[activePageId] = { drawings: currentDrawings, elements: currentElements };
            try {
                await updatePage(activePageId, { drawings: currentDrawings, elements: currentElements });
            } catch { }
        }, 3000);
        return () => clearTimeout(timer);
    }, [lines, shapes, activePageId]);

    // ── Chat ──
    const sendChat = (e) => {
        e.preventDefault();
        if (!chatInput.trim() || !socket) return;
        // Add local echo since server now uses socket.to() (excludes sender)
        setChatMessages(prev => [...prev, {
            userId: effectiveUser?._id,
            userName: effectiveUser?.name || 'You',
            message: chatInput,
            timestamp: new Date().toISOString(),
        }]);
        socket.emit('chat:message', { boardId, workspaceId: board?.workspace, message: chatInput });
        setChatInput('');
    };

    const handleFileUpload = async (e) => {
        const file = e.target.files[0];
        if (!file) return;

        e.target.value = ''; // Reset input
        const formData = new FormData();
        formData.append('file', file);
        const wsId = board?.workspace
            ? (typeof board.workspace === 'object' ? board.workspace._id : board.workspace)
            : null;
        if (wsId) formData.append('workspaceId', wsId);

        try {
            const { data } = await uploadFile(formData);
            if (data.url) {
                // Determine base URL dynamically based on axios baseURL
                const baseUrl = (import.meta.env.VITE_API_URL || 'http://localhost:5000/api').replace('/api', '');
                const fileUrl = `${baseUrl}${data.url}`;
                socket.emit('chat:message', {
                    boardId,
                    workspaceId: wsId,
                    message: `Shared a file: ${fileUrl}`
                });
            } else {
                toast.error(data.message || 'File upload failed');
            }
        } catch (err) {
            console.error('Upload Error:', err);
            toast.error('Failed to upload file');
        }
    };

    // ── Export ──
    const exportPNG = () => {
        const stage = stageRef.current;
        if (!stage) return;
        const uri = stage.toDataURL({ pixelRatio: 2 });
        const link = document.createElement('a');
        link.download = `${board?.title || 'board'}-page.png`;
        link.href = uri;
        link.click();
        toast.success('PNG exported!');
    };

    const exportPDF = () => {
        const stage = stageRef.current;
        if (!stage) return;
        const uri = stage.toDataURL({ pixelRatio: 2 });
        const pdf = new jsPDF('landscape', 'px', [stageSize.width, stageSize.height]);
        pdf.addImage(uri, 'PNG', 0, 0, stageSize.width, stageSize.height);
        pdf.save(`${board?.title || 'board'}.pdf`);
        toast.success('PDF exported!');
    };

    const copyShareLink = () => {
        const joinLink = `${window.location.origin}/join/${boardId}`;
        const textToCopy = `Join my room on centrio.io!\nRoom Code: ${boardId}\nLink: ${joinLink}`;
        navigator.clipboard.writeText(textToCopy);
        toast.success('Room code and link copied!');
    };

    // ── Recording ──
    const toggleRecording = () => {
        if (isRecording) {
            // Stop recording
            mediaRecorderRef.current?.stop();
            setIsRecording(false);
            toast.success('Recording stopped. Downloading...');
        } else {
            // Start recording
            try {
                // Grab the correct Konva canvas (the last/top canvas in the container)
                const canvases = containerRef.current?.querySelectorAll('canvas');
                const canvas = canvases?.[canvases.length - 1];
                if (!canvas) throw new Error('Canvas not found');
                const stream = canvas.captureStream(30); // 30 fps
                const options = { mimeType: 'video/webm' };
                // Fallback to simpler options if webm is not supported by the browser
                const mediaRecorder = new MediaRecorder(stream, MediaRecorder.isTypeSupported('video/webm;codecs=vp9') ? { mimeType: 'video/webm;codecs=vp9' } : undefined);

                mediaRecorder.ondataavailable = (e) => {
                    if (e.data.size > 0) {
                        recordedChunksRef.current.push(e.data);
                    }
                };

                mediaRecorder.onstop = () => {
                    const blob = new Blob(recordedChunksRef.current, { type: 'video/webm' });
                    const url = URL.createObjectURL(blob);
                    const a = document.createElement('a');
                    a.style.display = 'none';
                    a.href = url;
                    a.download = `${board?.title || 'session'}-recording.webm`;
                    document.body.appendChild(a);
                    a.click();
                    setTimeout(() => {
                        document.body.removeChild(a);
                        URL.revokeObjectURL(url);
                    }, 100);
                    recordedChunksRef.current = [];
                };

                mediaRecorder.start(1000); // gather chunks every 1s
                mediaRecorderRef.current = mediaRecorder;
                setIsRecording(true);
                toast.success('Recording started');
            } catch (err) {
                console.error(err);
                toast.error('Failed to start recording');
            }
        }
    };

    // ── Zoom ──
    const handleWheel = (e) => {
        e.evt.preventDefault();
        const scaleBy = 1.08;
        const stage = e.target.getStage();
        const oldScale = stage.scaleX();
        const pointer = stage.getPointerPosition();
        const mousePointTo = {
            x: (pointer.x - stage.x()) / oldScale,
            y: (pointer.y - stage.y()) / oldScale,
        };
        const direction = e.evt.deltaY > 0 ? -1 : 1;
        const newScale = direction > 0 ? oldScale * scaleBy : oldScale / scaleBy;
        const clampedScale = Math.max(0.1, Math.min(5, newScale));
        setStageScale(clampedScale);
        setStagePos({
            x: pointer.x - mousePointTo.x * clampedScale,
            y: pointer.y - mousePointTo.y * clampedScale,
        });
    };

    // ── Clear ──
    const clearPage = () => {
        if (!confirm('Clear this page?')) return;
        setLines([]);
        setShapes([]);
        socket?.emit('draw:clear', { boardId, pageId: activePageId });
        setTimeout(() => pushHistory(), 0);
    };

    // ── Drag-drop from ShapeLibrary ──
    const handleCanvasDrop = (e) => {
        e.preventDefault();
        try {
            const iconData = JSON.parse(e.dataTransfer.getData('application/json'));
            const stage = stageRef.current;
            if (!stage) return;
            stage.setPointersPositions(e);
            const pos = stage.getRelativePointerPosition();
            const id = genId();
            const shape = {
                id, type: 'arch-icon', archId: iconData.id,
                x: pos.x - 40, y: pos.y - 40, width: 80, height: 80,
                label: iconData.label, iconPath: iconData.path,
                iconViewBox: iconData.viewBox, iconColor: iconData.color,
                stroke: '#2a2a3e', strokeWidth: 1,
            };
            setShapes(prev => [...prev, shape]);
            socket?.emit('shape:add', { boardId, pageId: activePageId, shape });
            setTimeout(() => pushHistory(), 0);
        } catch { }
    };

    const handleCanvasDragOver = (e) => { e.preventDefault(); e.dataTransfer.dropEffect = 'copy'; };

    // ── ER Diagram: Add Table ──
    const addERTable = () => {
        const id = genId();
        const shape = {
            id, type: 'er-table',
            x: (stageSize.width / 2) / stageScale - stagePos.x / stageScale,
            y: (stageSize.height / 2) / stageScale - stagePos.y / stageScale,
            tableName: 'new_table',
            fields: [{ name: 'id', type: 'uuid', pk: true, fk: false }],
        };
        setShapes(prev => [...prev, shape]);
        socket?.emit('shape:add', { boardId, pageId: activePageId, shape });
        setTimeout(() => pushHistory(), 0);
    };

    const addRelationship = () => { setTool('arrow'); toast('Draw an arrow between two tables', { icon: '↗️' }); };

    const handleERSave = (updatedShape) => {
        setShapes(prev => prev.map(s => s.id === updatedShape.id ? updatedShape : s));
        socket?.emit('shape:update', { boardId, pageId: activePageId, shapeId: updatedShape.id, updates: updatedShape });
        setTimeout(() => pushHistory(), 0);
    };

    // ── Commit inline text edit ──
    const commitTextEdit = useCallback((value) => {
        if (!editingText) return;
        const finalText = (value ?? editingText.value).trim();

        if (editingText.type === 'arch-label') {
            // Architecture icon label edit
            const labelToSave = finalText || editingText.value || 'Component';
            setShapes(prev => prev.map(s => s.id === editingText.id ? { ...s, label: labelToSave } : s));
            socket?.emit('shape:update', { boardId, pageId: activePageId, shapeId: editingText.id, updates: { label: labelToSave } });
        } else {
            // Regular text or sticky
            const textToSave = finalText || 'Text';
            setShapes(prev => prev.map(s => s.id === editingText.id ? { ...s, text: textToSave } : s));
            socket?.emit('shape:update', { boardId, pageId: activePageId, shapeId: editingText.id, updates: { text: textToSave } });
        }
        setTimeout(() => pushHistory(), 0);
        setEditingText(null);
    }, [editingText, socket, boardId, activePageId, pushHistory]);

    // Auto-focus textarea when editing starts
    useEffect(() => {
        if (editingText && textareaRef.current) {
            textareaRef.current.focus();
            // Move cursor to the end instead of selecting all, OR just select all initially once
            textareaRef.current.select();
        }
    }, [editingText?.id]); // BUG FIX: Only run when the editing ID changes, NOT on every keystroke

    // ── Mode helpers ──
    const isArchMode = board?.mode === 'architecture';
    const isERMode = board?.mode === 'er';
    const isWhiteboard = !isArchMode && !isERMode;

    // Mode-specific tools
    const modeTools = [];
    if (isERMode) {
        modeTools.push(
            { id: 'er-table', icon: Database, label: 'Add Table', action: addERTable },
            { id: 'er-rel', icon: Link2, label: 'Relationship', action: addRelationship },
        );
    }
    if (isWhiteboard) {
        modeTools.push(
            { id: 'sticky', icon: StickyNote, label: 'Sticky Note', action: () => setTool('sticky') },
        );
    }

    if (loading) {
        return (
            <div className="page-loading">
                <div className="spinner spinner-lg" />
            </div>
        );
    }

    const modeLabel = isArchMode ? 'Architecture' : isERMode ? 'ER Diagram' : 'Whiteboard';
    const modeColor = isArchMode ? '#06b6d4' : isERMode ? '#8b5cf6' : '#6366f1';

    // ── Role-based Permissions ──
    const isHost = board?.createdBy && effectiveUser?._id === board.createdBy.toString();

    let availableTools = TOOLS;
    if (isArchMode) {
        availableTools = TOOLS.filter(t => ['select', 'pan', 'arrow', 'text'].includes(t.id));
    } else if (isERMode) {
        availableTools = TOOLS.filter(t => ['select', 'pan', 'arrow'].includes(t.id));
    }

    return (
        <motion.div
            className="board-page"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.4 }}
        >
            {/* ── Top Bar ── */}
            <header className="board-topbar glass">
                <div className="board-topbar-left">
                    <button className="btn btn-ghost btn-icon" onClick={() => navigate(-1)} data-tooltip="Back">
                        <ArrowLeft size={20} />
                    </button>
                    {workspaceBoards.length > 1 ? (
                        <select
                            className="board-switcher-select"
                            value={board?._id || ''}
                            onChange={(e) => navigate(`/board/${e.target.value}`)}
                        >
                            {workspaceBoards.map(wb => (
                                <option key={wb._id} value={wb._id}>{wb.title}</option>
                            ))}
                        </select>
                    ) : (
                        <h2 className="board-name">{board?.title}</h2>
                    )}
                    <span className="mode-badge" style={{ background: `${modeColor}22`, color: modeColor, borderColor: `${modeColor}44` }}>
                        {isArchMode && <LayoutGrid size={12} />}
                        {isERMode && <Database size={12} />}
                        {isWhiteboard && <Paintbrush size={12} />}
                        {modeLabel}
                    </span>
                </div>
                <div className="board-topbar-center">
                    <div className="presence-bar">
                        {onlineUsers.map(u => (
                            <div key={u.userId} className="avatar avatar-sm" style={{ background: getAvatarColor(u.userName), position: 'relative' }} data-tooltip={u.userName}>
                                {getInitials(u.userName)}
                                {board?.createdBy && u.userId === board.createdBy.toString() && (
                                    <span style={{ position: 'absolute', bottom: -12, left: '50%', transform: 'translateX(-50%)', fontSize: '8px', background: 'var(--primary)', color: 'white', padding: '1px 4px', borderRadius: '4px', fontWeight: 'bold', zIndex: 2 }}>HOST</span>
                                )}
                            </div>
                        ))}
                    </div>
                </div>
                <div className="board-topbar-right">
                    <button className="btn btn-ghost btn-sm" onClick={copyShareLink} data-tooltip="Copy Join Link">
                        <Share2 size={16} /> Share
                    </button>
                    <button className="btn btn-ghost btn-sm" onClick={toggleTheme} data-tooltip="Toggle Theme">
                        {theme === 'dark' ? <Sun size={16} /> : <Moon size={16} />}
                    </button>
                    <button className="btn btn-ghost btn-sm" onClick={exportPNG}><FileImage size={16} /> PNG</button>
                    <button className="btn btn-ghost btn-sm" onClick={exportPDF}><Download size={16} /> PDF</button>
                    <button className={`btn btn-sm ${isRecording ? 'btn-danger' : 'btn-ghost'}`} style={{ color: isRecording ? '#ef4444' : undefined }} onClick={toggleRecording}>
                        <span style={{ width: 8, height: 8, borderRadius: '50%', background: isRecording ? '#ef4444' : 'currentColor', display: 'inline-block', marginRight: 4, animation: isRecording ? 'pulse 2s infinite' : 'none' }} />
                        {isRecording ? 'Rec' : 'Record'}
                    </button>
                    <button className={`btn btn-sm ${showVideo ? 'btn-primary' : 'btn-ghost'}`} onClick={() => setShowVideo(!showVideo)}>
                        <Video size={16} /> Call
                    </button>
                    <button className={`btn btn-sm ${showChat ? 'btn-primary' : 'btn-secondary'}`} onClick={() => setShowChat(!showChat)}>
                        <MessageCircle size={16} />
                        {chatMessages.length > 0 && <span className="chat-badge">{chatMessages.length}</span>}
                    </button>
                </div>
            </header>

            <div className="board-body">
                {/* ── Canvas ── */}
                <div className={`canvas-container ${isArchMode ? 'bg-architecture' : isERMode ? 'bg-er-diagram' : 'bg-whiteboard'}`} ref={containerRef} onDrop={handleCanvasDrop} onDragOver={handleCanvasDragOver}>
                    <Stage
                        ref={stageRef}
                        width={stageSize.width} height={stageSize.height}
                        scaleX={stageScale} scaleY={stageScale}
                        x={stagePos.x} y={stagePos.y}
                        draggable={tool === 'pan'}
                        onWheel={handleWheel}
                        onMouseDown={handleMouseDown} onMousemove={handleMouseMove} onMouseup={handleMouseUp}
                        onTouchStart={handleMouseDown} onTouchMove={handleMouseMove} onTouchEnd={handleMouseUp}
                        onDragEnd={(e) => { if (tool === 'pan') setStagePos({ x: e.target.x(), y: e.target.y() }); }}
                        style={{ cursor: tool === 'pan' ? 'grab' : tool === 'select' ? 'default' : 'crosshair' }}
                    >
                        <Layer>
                            {/* Lines */}
                            {lines.map((line, i) => (
                                <Line key={i} points={line.points} stroke={line.color} strokeWidth={line.width}
                                    tension={0.5} lineCap="round" lineJoin="round"
                                    globalCompositeOperation={line.tool === 'eraser' ? 'destination-out' : 'source-over'}
                                />
                            ))}

                            {/* Shapes */}
                            {shapes.map((s) => {
                                const isSelected = selectedIds.has(s.id);

                                if (s.type === 'rect') {
                                    return (
                                        <Rect key={s.id} id={s.id} x={s.x} y={s.y}
                                            width={s.width} height={s.height}
                                            fill={s.fill} stroke={s.stroke} strokeWidth={s.strokeWidth}
                                            draggable={tool === 'select'} cornerRadius={4}
                                            onClick={(e) => handleShapeClick(e, s.id)} onTap={(e) => handleShapeClick(e, s.id)}
                                            onDragEnd={(e) => handleShapeDragEnd(e, s)}
                                            onTransformEnd={(e) => handleTransformEnd(e, s)}
                                        />
                                    );
                                }
                                if (s.type === 'circle') {
                                    return (
                                        <Circle key={s.id} id={s.id} x={s.x} y={s.y} radius={s.radius}
                                            fill={s.fill} stroke={s.stroke} strokeWidth={s.strokeWidth}
                                            draggable={tool === 'select'}
                                            onClick={(e) => handleShapeClick(e, s.id)} onTap={(e) => handleShapeClick(e, s.id)}
                                            onDragEnd={(e) => handleShapeDragEnd(e, s)}
                                            onTransformEnd={(e) => handleTransformEnd(e, s)}
                                        />
                                    );
                                }
                                if (s.type === 'text') {
                                    return (
                                        <Text key={s.id} id={s.id} x={s.x} y={s.y} text={s.text || 'Type here...'}
                                            fill={s.text ? s.fill : '#666'} fontSize={s.fontSize} fontFamily="Inter"
                                            draggable={tool === 'select'}
                                            onClick={(e) => handleShapeClick(e, s.id)} onTap={(e) => handleShapeClick(e, s.id)}
                                            onDragEnd={(e) => handleShapeDragEnd(e, s)}
                                            onTransformEnd={(e) => handleTransformEnd(e, s)}
                                            onDblClick={() => {
                                                const stageBox = containerRef.current?.getBoundingClientRect();
                                                if (stageBox) {
                                                    const absX = stageBox.left + s.x * stageScale + stagePos.x;
                                                    const absY = stageBox.top + s.y * stageScale + stagePos.y;
                                                    setEditingText({ id: s.id, x: absX, y: absY, width: 300, height: 32, value: s.text || '', type: 'text' });
                                                }
                                            }}
                                        />
                                    );
                                }
                                if (s.type === 'sticky') {
                                    const sw = s.width || 180;
                                    const sh = s.height || 140;
                                    const stickyColors = {
                                        '#f59e0b': { bg: '#fef3c7', text: '#78350f', fold: '#fbbf24' },
                                        '#22c55e': { bg: '#dcfce7', text: '#14532d', fold: '#4ade80' },
                                        '#6366f1': { bg: '#e0e7ff', text: '#312e81', fold: '#818cf8' },
                                        '#ec4899': { bg: '#fce7f3', text: '#831843', fold: '#f472b6' },
                                        '#06b6d4': { bg: '#cffafe', text: '#164e63', fold: '#22d3ee' },
                                    };
                                    const theme = stickyColors[s.fill] || { bg: s.fill || '#fef3c7', text: '#78350f', fold: '#fbbf24' };
                                    return (
                                        <Group key={s.id} id={s.id} x={s.x} y={s.y}
                                            draggable={tool === 'select'}
                                            onClick={(e) => handleShapeClick(e, s.id)} onTap={(e) => handleShapeClick(e, s.id)}
                                            onDragEnd={(e) => handleShapeDragEnd(e, s)}
                                            onTransformEnd={(e) => handleTransformEnd(e, s)}
                                            onDblClick={() => {
                                                const stageBox = containerRef.current?.getBoundingClientRect();
                                                if (stageBox) {
                                                    const absX = stageBox.left + s.x * stageScale + stagePos.x;
                                                    const absY = stageBox.top + s.y * stageScale + stagePos.y;
                                                    setEditingText({
                                                        id: s.id, x: absX + 12, y: absY + 12,
                                                        width: sw - 24, height: sh - 24,
                                                        value: s.text || '', type: 'sticky'
                                                    });
                                                }
                                            }}
                                        >
                                            {/* Shadow */}
                                            <Rect x={3} y={4} width={sw} height={sh}
                                                fill="rgba(0,0,0,0.08)" cornerRadius={4}
                                            />
                                            {/* Main body */}
                                            <Rect width={sw} height={sh}
                                                fill={theme.bg} cornerRadius={4}
                                                stroke={isSelected ? '#6366f1' : 'transparent'} strokeWidth={2}
                                            />
                                            {/* Fold triangle */}
                                            <Line points={[sw - 16, 0, sw, 0, sw, 16]} fill={theme.fold} closed />
                                            {/* Title bar */}
                                            <Rect x={0} y={0} width={sw} height={28}
                                                fill={`${theme.fold}40`} cornerRadius={[4, 4, 0, 0]}
                                            />
                                            <Text x={8} y={7} width={sw - 16}
                                                text="📌 Note" fill={theme.text} fontSize={11}
                                                fontFamily="Inter" fontStyle="600" opacity={0.6}
                                            />
                                            {/* Content */}
                                            <Text x={12} y={34} width={sw - 24} height={sh - 46}
                                                text={s.text || 'Double-click to edit'} fill={s.text ? theme.text : `${theme.text}80`}
                                                fontSize={s.fontSize || 14}
                                                fontFamily="Inter" fontStyle="500" lineHeight={1.4}
                                            />
                                        </Group>
                                    );
                                }
                                if (s.type === 'arrow') {
                                    const hasCardinality = s.cardinality && s.cardinality !== 'none';
                                    const midX = (s.points[0] + s.points[2]) / 2;
                                    const midY = (s.points[1] + s.points[3]) / 2;
                                    const arrColor = isSelected ? '#6366f1' : (s.stroke || '#94a3b8');
                                    // Crow's foot rendering helpers
                                    const dx = s.points[2] - s.points[0];
                                    const dy = s.points[3] - s.points[1];
                                    const len = Math.sqrt(dx * dx + dy * dy) || 1;
                                    const nx = dx / len;
                                    const ny = dy / len;
                                    const px = -ny; // perpendicular
                                    const py = nx;
                                    const cf = 10; // crow's foot spread
                                    const cl = 14; // crow's foot line length

                                    const renderCrowsFoot = (x, y, dir, type) => {
                                        // dir: 1 = at target end, -1 = at source end
                                        const dnx = nx * dir;
                                        const dny = ny * dir;
                                        if (type === 'many') {
                                            return (
                                                <Group>
                                                    <Line points={[x, y, x - dnx * cl + px * cf, y - dny * cl + py * cf]} stroke={arrColor} strokeWidth={2} />
                                                    <Line points={[x, y, x - dnx * cl - px * cf, y - dny * cl - py * cf]} stroke={arrColor} strokeWidth={2} />
                                                    <Line points={[x, y, x - dnx * cl, y - dny * cl]} stroke={arrColor} strokeWidth={2} />
                                                </Group>
                                            );
                                        }
                                        if (type === 'one') {
                                            const bx = x - dnx * 8;
                                            const by = y - dny * 8;
                                            return <Line points={[bx + px * cf, by + py * cf, bx - px * cf, by - py * cf]} stroke={arrColor} strokeWidth={2} />;
                                        }
                                        return null;
                                    };

                                    let sourceType = null;
                                    let targetType = null;
                                    if (hasCardinality) {
                                        const c = s.cardinality;
                                        if (c === '1:1') { sourceType = 'one'; targetType = 'one'; }
                                        else if (c === '1:N') { sourceType = 'one'; targetType = 'many'; }
                                        else if (c === 'N:1') { sourceType = 'many'; targetType = 'one'; }
                                        else if (c === 'N:M') { sourceType = 'many'; targetType = 'many'; }
                                        else if (c === '0..1') { sourceType = 'one'; targetType = 'one'; }
                                        else if (c === '0..N') { sourceType = 'one'; targetType = 'many'; }
                                    }

                                    return (
                                        <Group key={s.id} id={s.id}
                                            draggable={tool === 'select'}
                                            onClick={(e) => handleShapeClick(e, s.id)} onTap={(e) => handleShapeClick(e, s.id)}
                                            onDragEnd={(e) => {
                                                const ddx = e.target.x(); const ddy = e.target.y();
                                                const newPoints = s.points.map((p, i) => i % 2 === 0 ? p + ddx : p + ddy);
                                                e.target.x(0); e.target.y(0);
                                                setShapes(prev => prev.map(sh => sh.id === s.id ? { ...sh, points: newPoints } : sh));
                                                socket?.emit('shape:update', { boardId, pageId: activePageId, shapeId: s.id, updates: { points: newPoints } });
                                            }}
                                        >
                                            <Line points={s.points}
                                                stroke={arrColor} strokeWidth={isSelected ? 3 : (s.strokeWidth || 2)}
                                                tension={0} lineCap="round" lineJoin="round"
                                            />
                                            {/* Crow's foot notation at endpoints */}
                                            {sourceType && renderCrowsFoot(s.points[0], s.points[1], -1, sourceType)}
                                            {targetType && renderCrowsFoot(s.points[2], s.points[3], 1, targetType)}
                                            {/* Arrow head for non-ER or when no cardinality */}
                                            {!hasCardinality && (
                                                <Arrow points={s.points}
                                                    stroke={arrColor} strokeWidth={isSelected ? 3 : (s.strokeWidth || 2)} fill={arrColor}
                                                    tension={0} lineCap="round" lineJoin="round" pointerLength={10} pointerWidth={10}
                                                />
                                            )}
                                            {hasCardinality && (
                                                <Group x={midX} y={midY} offsetX={22} offsetY={12}>
                                                    <Rect width={44} height={24} fill="#12121e" cornerRadius={6} stroke="#8b5cf6" strokeWidth={1.5}
                                                        shadowColor="rgba(99,102,241,0.2)" shadowBlur={6} />
                                                    <Text width={44} align="center" verticalAlign="middle" height={24}
                                                        text={s.cardinality} fill="#a78bfa" fontSize={12} fontFamily="Inter" fontStyle="bold"
                                                    />
                                                </Group>
                                            )}
                                        </Group>
                                    );
                                }
                                if (s.type === 'arch-icon') {
                                    const iw = s.width || 80;
                                    const ih = s.height || 80;
                                    return (
                                        <Group key={s.id} id={s.id} x={s.x} y={s.y}
                                            draggable={tool === 'select'}
                                            onClick={(e) => handleShapeClick(e, s.id)} onTap={(e) => handleShapeClick(e, s.id)}
                                            onDragEnd={(e) => handleShapeDragEnd(e, s)}
                                            onDblClick={() => {
                                                const stageBox = containerRef.current?.getBoundingClientRect();
                                                if (stageBox) {
                                                    const absX = stageBox.left + s.x * stageScale + stagePos.x;
                                                    const absY = stageBox.top + (s.y + ih + 4) * stageScale + stagePos.y;
                                                    setEditingText({ id: s.id, x: absX, y: absY, width: iw, height: 20, value: s.label || '', type: 'arch-label' });
                                                }
                                            }}
                                        >
                                            {/* Selection ring */}
                                            {isSelected && (
                                                <Rect x={-3} y={-3} width={iw + 6} height={ih + 28}
                                                    fill="transparent" stroke="#6366f1" strokeWidth={2} cornerRadius={12} dash={[4, 2]}
                                                />
                                            )}
                                            {/* Gradient background */}
                                            <Rect width={iw} height={ih}
                                                fill="#14141f" stroke={s.stroke || '#2a2a3e'}
                                                strokeWidth={1} cornerRadius={10}
                                                shadowColor="rgba(0,0,0,0.4)" shadowBlur={8} shadowOffsetY={3}
                                            />
                                            {/* Icon color glow */}
                                            <Rect x={4} y={4} width={iw - 8} height={ih - 8}
                                                fill={`${s.iconColor || '#6366f1'}12`} cornerRadius={8}
                                            />
                                            {/* SVG Icon */}
                                            <Path x={(iw - 38) / 2} y={(ih - 38) / 2} data={s.iconPath}
                                                fill={s.iconColor || '#6366f1'} scaleX={1.6} scaleY={1.6}
                                            />
                                            {/* Label pill */}
                                            <Rect x={4} y={ih + 4} width={iw - 8} height={20}
                                                fill="rgba(255,255,255,0.05)" cornerRadius={6}
                                            />
                                            <Text x={4} y={ih + 6} width={iw - 8}
                                                text={s.label || ''} fill="#cbd5e1" fontSize={10}
                                                fontFamily="Inter, sans-serif" align="center" fontStyle="600"
                                            />
                                        </Group>
                                    );
                                }
                                if (s.type === 'er-table') {
                                    return (
                                        <EREntity key={s.id} shape={s} isSelected={isSelected} tool={tool}
                                            onSelect={() => { if (tool === 'select') setSelectedIds(new Set([s.id])); }}
                                            onDragEnd={(e) => handleShapeDragEnd(e, s)}
                                            onDoubleClick={() => setEditingERShape(s)}
                                        />
                                    );
                                }
                                return null;
                            })}

                            {/* Drawing preview */}
                            {drawingShape && drawingShape.type === 'rect' && (
                                <Rect x={drawingShape.x} y={drawingShape.y} width={drawingShape.width} height={drawingShape.height}
                                    fill="transparent" stroke={drawingShape.stroke} strokeWidth={drawingShape.strokeWidth}
                                    dash={[6, 3]} cornerRadius={4}
                                />
                            )}
                            {drawingShape && drawingShape.type === 'circle' && (
                                <Circle x={drawingShape.x} y={drawingShape.y} radius={drawingShape.radius}
                                    fill="transparent" stroke={drawingShape.stroke} strokeWidth={drawingShape.strokeWidth} dash={[6, 3]}
                                />
                            )}
                            {drawingShape && drawingShape.type === 'arrow' && (
                                <Arrow points={drawingShape.points} stroke={drawingShape.stroke}
                                    strokeWidth={drawingShape.strokeWidth} fill={drawingShape.stroke} dash={[6, 3]}
                                />
                            )}

                            {/* Transformer — multi-select */}
                            <Transformer ref={trRef} flipEnabled={false}
                                boundBoxFunc={(oldBox, newBox) => {
                                    if (Math.abs(newBox.width) < 5 || Math.abs(newBox.height) < 5) return oldBox;
                                    return newBox;
                                }}
                                anchorStroke="#6366f1" anchorFill="#1a1a2e" anchorSize={8}
                                borderStroke="#6366f1" borderDash={[4, 2]}
                            />
                        </Layer>
                    </Stage>

                    {/* Remote Cursors Overlay */}
                    {Object.values(remoteCursors).map((c) => (
                        <div key={c.userId} className="remote-cursor"
                            style={{
                                left: c.x * stageScale + stagePos.x,
                                top: c.y * stageScale + stagePos.y,
                                borderColor: getAvatarColor(c.userName),
                            }}
                        >
                            <svg width="16" height="20" viewBox="0 0 16 20" fill={getAvatarColor(c.userName)}>
                                <path d="M0 0L16 12L8 12L6 20L0 0Z" />
                            </svg>
                            <span className="cursor-label" style={{ background: getAvatarColor(c.userName) }}>
                                {c.userName}
                            </span>
                        </div>
                    ))}

                    {/* Selection info bar */}
                    {selectedIds.size > 0 && (
                        <div className="selection-bar glass">
                            <span>{selectedIds.size} selected</span>

                            {/* Visual Cardinality picker for ER relationships */}
                            {selectedIds.size === 1 && shapes.find(s => s.id === [...selectedIds][0])?.type === 'arrow' && isERMode && (() => {
                                const shapeId = [...selectedIds][0];
                                const currentCard = shapes.find(s => s.id === shapeId)?.cardinality || 'none';
                                const CARDINALITIES = [
                                    { value: 'none', label: 'Line', icon: '━━━' },
                                    { value: '1:1', label: 'One-to-One', icon: '┤├' },
                                    { value: '1:N', label: 'One-to-Many', icon: '┤╞' },
                                    { value: 'N:1', label: 'Many-to-One', icon: '╡├' },
                                    { value: 'N:M', label: 'Many-to-Many', icon: '╡╞' },
                                    { value: '0..1', label: 'Zero or One', icon: 'o┤├' },
                                    { value: '0..N', label: 'Zero or Many', icon: 'o┤╞' },
                                ];
                                return (
                                    <div className="cardinality-picker">
                                        {CARDINALITIES.map((c) => (
                                            <button key={c.value}
                                                className={`card-option ${currentCard === c.value ? 'active' : ''}`}
                                                onClick={() => {
                                                    setShapes(prev => prev.map(s => s.id === shapeId ? { ...s, cardinality: c.value } : s));
                                                    socket?.emit('shape:update', { boardId, pageId: activePageId, shapeId, updates: { cardinality: c.value } });
                                                    setTimeout(() => pushHistory(), 0);
                                                }}
                                                title={c.label}
                                            >
                                                <span className="card-icon">{c.icon}</span>
                                                <span className="card-lbl">{c.value === 'none' ? 'Line' : c.value}</span>
                                            </button>
                                        ))}
                                    </div>
                                );
                            })()}

                            <button className="btn btn-ghost btn-sm" onClick={duplicateSelected}><Copy size={14} /> Duplicate</button>
                            <button className="btn btn-ghost btn-sm" style={{ color: 'var(--danger)' }} onClick={deleteSelected}><Trash2 size={14} /> Delete</button>
                        </div>
                    )}

                    {/* Inline text editor overlay */}
                    {editingText && (
                        <textarea
                            ref={textareaRef}
                            className="inline-text-editor"
                            style={{
                                position: 'fixed',
                                left: editingText.x,
                                top: editingText.y,
                                width: Math.max(editingText.width, 120),
                                minHeight: editingText.type === 'sticky' ? editingText.height : 32,
                                fontSize: 16 * stageScale,
                                color: editingText.type === 'sticky' ? '#78350f' : editingText.type === 'arch-label' ? '#cbd5e1' : '#f1f5f9',
                                background: editingText.type === 'sticky' ? 'rgba(254, 243, 199, 0.95)' : editingText.type === 'arch-label' ? 'rgba(20, 20, 31, 0.95)' : 'rgba(20, 20, 31, 0.95)',
                            }}
                            value={editingText.value}
                            onChange={(e) => setEditingText(prev => ({ ...prev, value: e.target.value }))}
                            onBlur={() => commitTextEdit()}
                            onKeyDown={(e) => {
                                if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); commitTextEdit(); }
                                if (e.key === 'Escape') { setEditingText(null); }
                            }}
                            placeholder={editingText.type === 'sticky' ? 'Type your note...' : 'Type here...'}
                        />
                    )}

                    {/* ── Floating Toolbar ── */}
                    <div className="floating-toolbar glass">
                        <div className="ft-group">
                            {availableTools.map((t) => (
                                <button key={t.id} className={`ft-btn ${tool === t.id ? 'active' : ''}`}
                                    onClick={() => setTool(t.id)} title={`${t.label} (${t.key})`}>
                                    <t.icon size={18} />
                                    <span className="ft-shortcut">{t.key}</span>
                                </button>
                            ))}
                        </div>
                        <div className="ft-divider" />
                        {/* Mode tools */}
                        {modeTools.length > 0 && (
                            <>
                                <div className="ft-group">
                                    {modeTools.map(mt => (
                                        <button key={mt.id} className="ft-btn" onClick={mt.action} title={mt.label}>
                                            <mt.icon size={18} />
                                        </button>
                                    ))}
                                </div>
                                <div className="ft-divider" />
                            </>
                        )}
                        <div className="ft-group">
                            {activeColors.slice(0, 6).map((c) => (
                                <button key={c} className={`ft-color ${color === c ? 'active' : ''}`}
                                    style={{ background: c }} onClick={() => setColor(c)} />
                            ))}
                        </div>
                        <div className="ft-divider" />
                        {/* Brush / Eraser size selector — visible for pencil and eraser */}
                        {(tool === 'pencil' || tool === 'eraser') && (
                            <>
                                <div className="ft-group ft-sizes">
                                    {SIZES.map((s) => (
                                        <button key={s} className={`ft-size-btn ${brushSize === s ? 'active' : ''}`}
                                            onClick={() => setBrushSize(s)} title={`Size ${s}`}>
                                            <span className="ft-size-dot" style={{
                                                width: Math.max(4, s * (tool === 'eraser' ? 1.5 : 1)),
                                                height: Math.max(4, s * (tool === 'eraser' ? 1.5 : 1)),
                                            }} />
                                        </button>
                                    ))}
                                </div>
                                <div className="ft-divider" />
                            </>
                        )}
                        <div className="ft-group">
                            <button className="ft-btn" onClick={undo} title="Undo (Ctrl+Z)"><Undo2 size={16} /></button>
                            <button className="ft-btn" onClick={redo} title="Redo (Ctrl+Y)"><Redo2 size={16} /></button>
                            {isHost && (
                                <button className="ft-btn" onClick={clearPage} title="Clear Page"><Trash2 size={16} /></button>
                            )}
                        </div>
                        <div className="ft-divider" />
                        <div className="ft-group">
                            <button className="ft-btn" onClick={() => setStageScale(s => Math.min(5, s * 1.2))} title="Zoom In (+)"><ZoomIn size={16} /></button>
                            <span className="ft-zoom">{Math.round(stageScale * 100)}%</span>
                            <button className="ft-btn" onClick={() => setStageScale(s => Math.max(0.1, s / 1.2))} title="Zoom Out (-)"><ZoomOut size={16} /></button>
                        </div>
                    </div>

                    {/* Video Call Panel */}
                    <AnimatePresence>
                        {showVideo && (
                            <VideoCall socket={socket} roomId={board?.workspace || boardId} user={effectiveUser} onClose={() => setShowVideo(false)} />
                        )}
                    </AnimatePresence>
                </div>

                {/* ── Architecture Shape Library (right panel) ── */}
                {isArchMode && <ShapeLibrary onDragStart={() => { }} />}

                {/* ── Chat Sidebar ── */}
                <AnimatePresence>
                    {showChat && (
                        <motion.div className="chat-panel glass"
                            initial={{ width: 0, opacity: 0 }} animate={{ width: 320, opacity: 1 }}
                            exit={{ width: 0, opacity: 0 }} transition={{ duration: 0.3, ease: [0.16, 1, 0.3, 1] }}
                        >
                            <div className="chat-header">
                                <h3><MessageCircle size={16} /> Chat</h3>
                                <button className="btn btn-ghost btn-icon sm" onClick={() => setShowChat(false)}><X size={16} /></button>
                            </div>
                            <div className="chat-messages">
                                {chatMessages.length === 0 ? (
                                    <p className="chat-empty">No messages yet</p>
                                ) : (
                                    chatMessages.map((msg, i) => {
                                        // Render URLs as clickable links
                                        const renderMessage = (text) => {
                                            const parts = text.split(/(https?:\/\/[^\s]+)/g);
                                            return parts.map((part, j) =>
                                                /^https?:\/\//.test(part)
                                                    ? <a key={j} href={part} target="_blank" rel="noopener noreferrer" style={{ color: 'var(--primary)', textDecoration: 'underline' }}>{part.length > 50 ? part.substring(0, 50) + '...' : part}</a>
                                                    : part
                                            );
                                        };
                                        return (
                                            <div key={i} className={`chat-msg ${msg.userId === effectiveUser?._id ? 'own' : ''}`}>
                                                <div className="chat-msg-header">
                                                    <span className="chat-msg-name" style={{ color: getAvatarColor(msg.userName) }}>
                                                        {msg.userId === effectiveUser?._id ? 'You' : msg.userName}
                                                    </span>
                                                    <span className="chat-msg-time">{formatTime(msg.timestamp)}</span>
                                                </div>
                                                <p className="chat-msg-text">{renderMessage(msg.message)}</p>
                                            </div>
                                        );
                                    })
                                )}
                            </div>
                            <form className="chat-input-form" onSubmit={sendChat}>
                                <input type="file" ref={fileInputRef} style={{ display: 'none' }} onChange={handleFileUpload} accept="image/*,.pdf" />
                                <button type="button" className="btn btn-ghost btn-icon" onClick={() => fileInputRef.current?.click()} data-tooltip="Attach File">
                                    <Paperclip size={16} />
                                </button>
                                <input className="input" placeholder="Type a message..." value={chatInput} onChange={(e) => setChatInput(e.target.value)} />
                                <button type="submit" className="btn btn-primary btn-icon"><Send size={16} /></button>
                            </form>
                        </motion.div>
                    )}
                </AnimatePresence>
            </div>

            {/* ── Page Tabs ── */}
            <div className="page-tabs glass">
                <div className="page-tabs-list">
                    {pages.map((page) => (
                        <button key={page._id} className={`page-tab ${activePageId === page._id ? 'active' : ''}`}
                            onClick={() => switchPage(page._id)}
                        >
                            {page.title}
                        </button>
                    ))}
                </div>
                <button className="btn btn-ghost btn-sm" onClick={addPage}><Plus size={16} /> Add Page</button>
            </div>

            {/* ── ER Edit Modal ── */}
            <AnimatePresence>
                {editingERShape && (
                    <EREditModal shape={editingERShape} onSave={handleERSave} onClose={() => setEditingERShape(null)} />
                )}
            </AnimatePresence>
        </motion.div>
    );
}
