import { useState, useEffect, useRef } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { motion, animate } from 'framer-motion';
import {
    ArrowRight, Zap, Shield, Users, Layers, Palette, GitBranch,
    Video, Database, LayoutGrid, Pencil, Star, ChevronRight,
    Globe, Clock, Lock, Sparkles
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';

const FEATURES = [
    {
        icon: Pencil,
        title: 'Infinite Whiteboard',
        desc: 'Freehand drawing, shapes, sticky notes — everything your team needs for visual brainstorming.',
        color: '#6366f1',
        gradient: 'linear-gradient(135deg, #6366f1 0%, #818cf8 100%)',
    },
    {
        icon: LayoutGrid,
        title: 'Architecture Diagrams',
        desc: 'Drag-and-drop 40+ cloud & DevOps icons. Design system architectures visually with your team.',
        color: '#06b6d4',
        gradient: 'linear-gradient(135deg, #06b6d4 0%, #22d3ee 100%)',
    },
    {
        icon: Database,
        title: 'ER Diagrams',
        desc: 'Model your database with table entities, field types, PK/FK badges, and relationship arrows.',
        color: '#8b5cf6',
        gradient: 'linear-gradient(135deg, #8b5cf6 0%, #a78bfa 100%)',
    },
    {
        icon: Video,
        title: 'Live Video Calls',
        desc: 'Built-in WebRTC video calling so your team stays connected while collaborating on boards.',
        color: '#f43f5e',
        gradient: 'linear-gradient(135deg, #f43f5e 0%, #fb7185 100%)',
    },
    {
        icon: Users,
        title: 'Real-Time Collaboration',
        desc: 'See teammates\' cursors, shapes, and changes instantly. Work together like you\'re in the same room.',
        color: '#10b981',
        gradient: 'linear-gradient(135deg, #10b981 0%, #34d399 100%)',
    },
    {
        icon: Layers,
        title: 'Multi-Page Boards',
        desc: 'Organize complex projects across multiple pages. Switch seamlessly without losing your work.',
        color: '#f59e0b',
        gradient: 'linear-gradient(135deg, #f59e0b 0%, #fbbf24 100%)',
    },
];

const STEPS = [
    { num: '01', title: 'Create a Workspace', desc: 'Organize your projects and invite your team members.' },
    { num: '02', title: 'Open a Board', desc: 'Choose Whiteboard, Architecture, or ER Diagram mode.' },
    { num: '03', title: 'Collaborate Live', desc: 'Draw, design, and discuss — all in real time.' },
];

const Counter = ({ value, isText }) => {
    const nodeRef = useRef();

    useEffect(() => {
        if (isText) {
            if (nodeRef.current) nodeRef.current.textContent = value;
            return;
        }

        const node = nodeRef.current;
        const controls = animate(0, value, {
            duration: 2.5,
            ease: "easeOut",
            onUpdate(val) {
                if (node) node.textContent = Math.round(val);
            },
        });
        return () => controls.stop();
    }, [value, isText]);

    return <span ref={nodeRef} />;
};

const fadeUp = {
    hidden: { opacity: 0, y: 30 },
    visible: (i = 0) => ({ opacity: 1, y: 0, transition: { delay: i * 0.1, duration: 0.6, ease: [0.16, 1, 0.3, 1] } }),
};

export default function LandingPage() {
    const navigate = useNavigate();
    const location = useLocation();
    const { loginWithToken } = useAuth();
    const hasAttemptedLogin = useRef(false);

    const [realStats, setRealStats] = useState({
        users: 0,
        workspaces: 0,
        uptime: '99.9%',
        security: '256-bit'
    });

    // Intercept Google OAuth JWT token from URL
    useEffect(() => {
        const params = new URLSearchParams(location.search);
        const token = params.get('token');

        if (token && !hasAttemptedLogin.current) {
            hasAttemptedLogin.current = true;

            const authenticateWithGoogleToken = async () => {
                // Clean up the URL first so it physically can't be read again
                window.history.replaceState({}, document.title, '/');
                await loginWithToken(token);
                navigate('/dashboard');
            };

            authenticateWithGoogleToken();
        }
    }, [location.search, loginWithToken, navigate]);

    useEffect(() => {
        fetch(`${import.meta.env.VITE_API_URL || 'http://localhost:5000/api'}/stats`)
            .then(res => res.json())
            .then(data => {
                setRealStats({
                    users: data.users || 0,
                    workspaces: data.workspaces || 0,
                    uptime: data.uptime || '99.9%',
                    security: data.security || '256-bit'
                });
            })
            .catch(err => console.error('Failed to fetch stats:', err));
    }, []);

    const displayStats = [
        { value: realStats.users, label: 'Active Makers', icon: Users, isText: false },
        { value: realStats.workspaces, label: 'Teams Created', icon: Layers, isText: false },
        { value: realStats.uptime, label: 'Uptime', icon: Clock, isText: true },
        { value: realStats.security, label: 'Encryption', icon: Lock, isText: true },
    ];

    return (
        <div className="landing-page">
            {/* ── Ambient Orbs ── */}
            <div className="landing-orbs">
                <div className="orb orb-1" />
                <div className="orb orb-2" />
                <div className="orb orb-3" />
            </div>

            {/* ── Navigation ── */}
            <motion.nav className="landing-nav"
                initial={{ opacity: 0, y: -20 }} animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.6 }}
            >
                <div className="landing-nav-inner">
                    <div className="landing-logo">
                        <div className="logo-icon">
                            <svg viewBox="0 0 40 40" fill="none">
                                <rect width="40" height="40" rx="10" fill="url(#g)" />
                                <path d="M12 20L18 14L26 22L20 28Z" fill="white" opacity="0.9" />
                                <path d="M20 12L28 20L22 26L14 18Z" fill="white" opacity="0.6" />
                                <defs><linearGradient id="g" x1="0" y1="0" x2="40" y2="40"><stop stopColor="#6366f1" /><stop offset="1" stopColor="#8b5cf6" /></linearGradient></defs>
                            </svg>
                        </div>
                        <span className="logo-text">centrio<span className="logo-dot">.io</span></span>
                    </div>
                    <div className="landing-nav-links">
                        <a href="#features">Features</a>
                        <a href="#how-it-works">How it works</a>
                        <a href="#stats">Enterprise</a>
                    </div>
                    <div className="landing-nav-actions">
                        <button className="btn btn-ghost" onClick={() => navigate('/join')} style={{ marginRight: '8px', color: '#a78bfa' }}>
                            Join Room
                        </button>
                        <button className="btn btn-ghost" onClick={() => navigate('/login')}>Sign In</button>
                        <button className="btn btn-primary" onClick={() => navigate('/register')}>
                            Get Started <ArrowRight size={16} />
                        </button>
                    </div>
                </div>
            </motion.nav>

            {/* ── Hero ── */}
            <section className="landing-hero">
                <motion.div className="hero-content"
                    initial="hidden" animate="visible" variants={fadeUp}
                >
                    <motion.div className="hero-badge" variants={fadeUp} custom={0}>
                        <Sparkles size={14} />
                        <span>Now with AI-powered diagram suggestions</span>
                    </motion.div>
                    <motion.h1 className="hero-title" variants={fadeUp} custom={1}>
                        Where Teams <span className="gradient-text">Design</span>,{' '}
                        <span className="gradient-text">Diagram</span> &{' '}
                        <span className="gradient-text">Collaborate</span>
                    </motion.h1>
                    <motion.p className="hero-subtitle" variants={fadeUp} custom={2}>
                        The all-in-one collaborative canvas for whiteboards, architecture diagrams,
                        and ER models — with real-time video calling built in.
                    </motion.p>
                    <motion.div className="hero-actions" variants={fadeUp} custom={3}>
                        <button className="btn btn-primary btn-lg hero-cta" onClick={() => navigate('/register')}>
                            Start Free <ArrowRight size={18} />
                        </button>
                        <button className="btn btn-secondary btn-lg" onClick={() => navigate('/login')}>
                            Sign In
                        </button>
                        <button className="btn btn-outline btn-lg" style={{ borderColor: 'rgba(255,255,255,0.2)', color: '#fff' }} onClick={() => navigate('/join')}>
                            <Users size={18} style={{ marginRight: 8 }} /> Join Room
                        </button>
                    </motion.div>
                    <motion.p className="hero-note" variants={fadeUp} custom={4}>
                        No credit card required · Free for up to 5 team members
                    </motion.p>
                </motion.div>

                {/* Hero Mockup */}
                <motion.div className="hero-mockup"
                    initial={{ opacity: 0, y: 50, scale: 0.95 }}
                    animate={{ opacity: 1, y: 0, scale: 1 }}
                    transition={{ delay: 0.5, duration: 0.8, ease: [0.16, 1, 0.3, 1] }}
                >
                    <div className="mockup-window">
                        <div className="mockup-titlebar">
                            <div className="mockup-dots">
                                <span /><span /><span />
                            </div>
                            <span className="mockup-title">centrio.io — Board</span>
                        </div>
                        <div className="mockup-body">
                            <div className="mockup-sidebar">
                                <div className="mockup-tool active" />
                                <div className="mockup-tool" />
                                <div className="mockup-tool" />
                                <div className="mockup-tool" />
                                <div className="mockup-tool" />
                            </div>
                            <div className="mockup-canvas">
                                {/* Animated shapes */}
                                <motion.div className="mockup-shape mockup-rect"
                                    animate={{ rotate: [0, 2, -1, 0], scale: [1, 1.02, 0.99, 1] }}
                                    transition={{ duration: 6, repeat: Infinity }}
                                />
                                <motion.div className="mockup-shape mockup-circle"
                                    animate={{ y: [0, -10, 5, 0] }}
                                    transition={{ duration: 5, repeat: Infinity }}
                                />
                                <motion.div className="mockup-shape mockup-arrow"
                                    animate={{ opacity: [0.6, 1, 0.6] }}
                                    transition={{ duration: 3, repeat: Infinity }}
                                />
                                <motion.div className="mockup-cursor"
                                    animate={{ x: [0, 80, 120, 40, 0], y: [0, -30, 50, 20, 0] }}
                                    transition={{ duration: 8, repeat: Infinity, ease: "easeInOut" }}
                                >
                                    <svg width="16" height="20" viewBox="0 0 16 20" fill="#6366f1">
                                        <path d="M0 0L16 12L8 12L6 20L0 0Z" />
                                    </svg>
                                    <span>Alice</span>
                                </motion.div>
                            </div>
                        </div>
                    </div>
                    <div className="mockup-glow" />
                </motion.div>
            </section>

            {/* ── Features ── */}
            <section className="landing-features" id="features">
                <motion.div className="section-header"
                    initial="hidden" whileInView="visible" viewport={{ once: true, margin: "-100px" }}
                    variants={fadeUp}
                >
                    <span className="section-badge"><Zap size={14} /> Features</span>
                    <h2>Everything you need to <span className="gradient-text">collaborate visually</span></h2>
                    <p>From quick sketches to complex system architectures — centrio.io has you covered.</p>
                </motion.div>

                <div className="features-grid">
                    {FEATURES.map((f, i) => (
                        <motion.div key={f.title} className="feature-card glass"
                            initial="hidden" whileInView="visible" viewport={{ once: true, margin: "-50px" }}
                            variants={fadeUp} custom={i}
                        >
                            <div className="feature-icon" style={{ background: f.gradient }}>
                                <f.icon size={24} color="white" />
                            </div>
                            <h3>{f.title}</h3>
                            <p>{f.desc}</p>
                        </motion.div>
                    ))}
                </div>
            </section>

            {/* ── How it Works ── */}
            <section className="landing-steps" id="how-it-works">
                <motion.div className="section-header"
                    initial="hidden" whileInView="visible" viewport={{ once: true, margin: "-100px" }}
                    variants={fadeUp}
                >
                    <span className="section-badge"><GitBranch size={14} /> How it works</span>
                    <h2>Get started in <span className="gradient-text">3 simple steps</span></h2>
                </motion.div>

                <div className="steps-grid">
                    {STEPS.map((step, i) => (
                        <motion.div key={step.num} className="step-card"
                            initial="hidden" whileInView="visible" viewport={{ once: true }}
                            variants={fadeUp} custom={i}
                        >
                            <span className="step-num">{step.num}</span>
                            <h3>{step.title}</h3>
                            <p>{step.desc}</p>
                        </motion.div>
                    ))}
                </div>
            </section>

            {/* ── Stats ── */}
            <section className="landing-stats" id="stats">
                <div className="stats-grid">
                    {displayStats.map((stat, i) => (
                        <motion.div key={stat.label} className="stat-card"
                            initial="hidden" whileInView="visible" viewport={{ once: true }}
                            variants={fadeUp} custom={i}
                        >
                            <stat.icon size={20} className="stat-icon" />
                            <span className="stat-value">
                                <Counter value={stat.value} isText={stat.isText} />
                                {!stat.isText && '+'}
                            </span>
                            <span className="stat-label">{stat.label}</span>
                        </motion.div>
                    ))}
                </div>
            </section>

            {/* ── CTA Section ── */}
            <section className="landing-cta">
                <motion.div className="cta-content glass-strong"
                    initial="hidden" whileInView="visible" viewport={{ once: true }}
                    variants={fadeUp}
                >
                    <h2>Ready to transform how your team collaborates?</h2>
                    <p>Join thousands of teams already using centrio.io for visual collaboration.</p>
                    <button className="btn btn-primary btn-lg hero-cta" onClick={() => navigate('/register')}>
                        Get Started Free <ArrowRight size={18} />
                    </button>
                </motion.div>
            </section>

            {/* ── Footer ── */}
            <footer className="landing-footer">
                <div className="footer-inner">
                    <div className="footer-brand">
                        <div className="landing-logo">
                            <div className="logo-icon" style={{ width: 32, height: 32 }}>
                                <svg viewBox="0 0 40 40" fill="none">
                                    <rect width="40" height="40" rx="10" fill="url(#gf)" />
                                    <path d="M12 20L18 14L26 22L20 28Z" fill="white" opacity="0.9" />
                                    <path d="M20 12L28 20L22 26L14 18Z" fill="white" opacity="0.6" />
                                    <defs><linearGradient id="gf" x1="0" y1="0" x2="40" y2="40"><stop stopColor="#6366f1" /><stop offset="1" stopColor="#8b5cf6" /></linearGradient></defs>
                                </svg>
                            </div>
                            <span className="logo-text" style={{ fontSize: '1rem' }}>centrio<span className="logo-dot">.io</span></span>
                        </div>
                        <p>The collaborative canvas for modern teams.</p>
                    </div>
                    <div className="footer-links">
                        <div className="footer-col">
                            <h4>Product</h4>
                            <a href="#features">Features</a>
                            <a href="#how-it-works">How it works</a>
                            <a href="#">Pricing</a>
                        </div>
                        <div className="footer-col">
                            <h4>Company</h4>
                            <a href="#">About</a>
                            <a href="#">Blog</a>
                            <a href="#">Careers</a>
                        </div>
                        <div className="footer-col">
                            <h4>Support</h4>
                            <a href="#">Documentation</a>
                            <a href="#">Contact</a>
                            <a href="#">Status</a>
                        </div>
                    </div>
                </div>
                <div className="footer-bottom">
                    <p>© 2026 centrio.io — All rights reserved.</p>
                </div>
            </footer>
        </div>
    );
}
