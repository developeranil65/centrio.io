import { useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Video, Users, ArrowRight } from 'lucide-react';
import { useAuth } from '../context/AuthContext';

/**
 * JoinRoom — Anonymous users enter a board via room code + display name.
 * Route: /join or /join/:code
 */
export default function JoinRoom() {
    const { code: urlCode } = useParams();
    const navigate = useNavigate();
    const { user } = useAuth();
    const [roomCode, setRoomCode] = useState(urlCode || '');
    const [displayName, setDisplayName] = useState('');
    const [email, setEmail] = useState('');
    const [error, setError] = useState('');

    const handleJoin = (e) => {
        e.preventDefault();
        if (!roomCode.trim()) return setError('Room code is required');

        if (!user) {
            if (!displayName.trim()) return setError('Display name is required');
            if (!email.trim() || !email.includes('@')) return setError('Valid email is required');
            sessionStorage.setItem('guestName', displayName.trim());
            sessionStorage.setItem('guestEmail', email.trim());
        }

        setError('');
        sessionStorage.setItem('guestRoom', roomCode.trim());
        navigate(`/board/${roomCode.trim()}`);
    };

    return (
        <div className="join-room-page">
            <motion.div
                className="join-card glass"
                initial={{ opacity: 0, y: 30 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.4 }}
            >
                <div className="join-icon">
                    <Video size={32} />
                </div>
                <h1>Join Board</h1>
                <p className="join-subtitle">Enter the room code shared by the host to join the whiteboard session.</p>

                <form onSubmit={handleJoin} className="join-form">
                    <div className="input-group">
                        <label>Room Code</label>
                        <input
                            className="input"
                            placeholder="Paste board ID or room code"
                            value={roomCode}
                            onChange={(e) => setRoomCode(e.target.value)}
                            autoFocus={!urlCode}
                        />
                    </div>

                    {!user && (
                        <>
                            <div className="input-group">
                                <label>Your Name</label>
                                <input
                                    className="input"
                                    placeholder="Enter your display name"
                                    value={displayName}
                                    onChange={(e) => setDisplayName(e.target.value)}
                                    autoFocus={!!urlCode}
                                />
                            </div>
                            <div className="input-group">
                                <label>Your Email</label>
                                <input
                                    className="input"
                                    type="email"
                                    placeholder="Enter your email address"
                                    value={email}
                                    onChange={(e) => setEmail(e.target.value)}
                                />
                            </div>
                        </>
                    )}

                    {error && <p className="join-error">{error}</p>}
                    <button type="submit" className="btn btn-primary btn-lg join-btn">
                        <Users size={18} />
                        Join Session
                        <ArrowRight size={16} />
                    </button>
                </form>

                <p className="join-hint">
                    Don't have a code? Ask the board owner to share the board ID from the URL bar.
                </p>
            </motion.div>
        </div >
    );
}
