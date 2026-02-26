import { useState, useEffect, useRef, useCallback } from 'react';
import { motion } from 'framer-motion';
import {
    Video, VideoOff, Mic, MicOff, PhoneOff,
    Monitor, MonitorOff, Maximize2, Minimize2
} from 'lucide-react';
import Peer from 'simple-peer';
import { getInitials, getAvatarColor } from '../../utils/helpers';

// STUN + TURN servers for reliable ICE candidate discovery & relay fallback
const ICE_SERVERS = {
    iceServers: [
        { urls: 'stun:stun.l.google.com:19302' },
        { urls: 'stun:stun1.l.google.com:19302' },
        { urls: 'stun:stun2.l.google.com:19302' },
        // Free TURN relay servers (Open Relay by Metered) — fallback for symmetric NATs
        {
            urls: 'turn:a.relay.metered.ca:80',
            username: 'e8dd65b92f070c41e0b060c3',
            credential: '4F5qQhkjL+VhEJwi',
        },
        {
            urls: 'turn:a.relay.metered.ca:80?transport=tcp',
            username: 'e8dd65b92f070c41e0b060c3',
            credential: '4F5qQhkjL+VhEJwi',
        },
        {
            urls: 'turn:a.relay.metered.ca:443',
            username: 'e8dd65b92f070c41e0b060c3',
            credential: '4F5qQhkjL+VhEJwi',
        },
        {
            urls: 'turns:a.relay.metered.ca:443?transport=tcp',
            username: 'e8dd65b92f070c41e0b060c3',
            credential: '4F5qQhkjL+VhEJwi',
        },
    ],
};

/**
 * VideoCall — Zoom-like floating video panel with WebRTC via simple-peer.
 * Auto-starts camera on mount. Queues incoming offers until stream is ready.
 * Props: socket, roomId, user, onClose
 */
export default function VideoCall({ socket, roomId, user, onClose }) {
    const [peers, setPeers] = useState({});
    const [localStream, setLocalStream] = useState(null);
    const [videoEnabled, setVideoEnabled] = useState(true);
    const [audioEnabled, setAudioEnabled] = useState(true);
    const [isScreenSharing, setIsScreenSharing] = useState(false);
    const [expanded, setExpanded] = useState(false);
    const [status, setStatus] = useState('Connecting camera...');

    const localVideoRef = useRef(null);
    const peersRef = useRef({});
    const localStreamRef = useRef(null);
    const pendingOffersRef = useRef([]);
    const screenStreamRef = useRef(null);
    const mountedRef = useRef(true);

    // ── Create a peer connection ──
    const createPeer = useCallback((socketId, userName, initiator, stream, signal) => {
        if (peersRef.current[socketId]) {
            console.log(`[VideoCall] Peer already exists for ${userName} (${socketId})`);
            return;
        }

        console.log(`[VideoCall] Creating ${initiator ? 'initiator' : 'receiver'} peer for ${userName}`);

        const peer = new Peer({
            initiator,
            trickle: true,
            stream,
            config: ICE_SERVERS,
        });

        peer.on('signal', (data) => {
            if (initiator) {
                console.log(`[VideoCall] Sending offer to ${userName}`);
                socket?.emit('call:offer', { to: socketId, signal: data, roomId, userName: user?.name });
            } else {
                console.log(`[VideoCall] Sending answer to ${userName}`);
                socket?.emit('call:answer', { to: socketId, signal: data, roomId });
            }
        });

        peer.on('stream', (remoteStream) => {
            console.log(`[VideoCall] Got remote stream from ${userName}`);
            if (mountedRef.current) {
                setPeers(prev => ({
                    ...prev,
                    [socketId]: { ...prev[socketId], stream: remoteStream },
                }));
                setStatus('Connected');
            }
        });

        peer.on('connect', () => {
            console.log(`[VideoCall] Peer connected with ${userName}`);
        });

        peer.on('close', () => {
            console.log(`[VideoCall] Peer closed: ${userName}`);
            removePeer(socketId);
        });

        peer.on('error', (err) => {
            console.error(`[VideoCall] Peer error with ${userName}:`, err.message);
            // Don't auto-remove on error, simple-peer sometimes errors on close gracefully
            // removePeer(socketId);
        });

        // If we're the receiver, signal the incoming offer
        if (!initiator && signal) {
            peer.signal(signal);
        }

        peersRef.current[socketId] = peer;
        setPeers(prev => ({
            ...prev,
            [socketId]: { peer, stream: null, userName },
        }));

        return peer;
    }, [socket, roomId, user]);

    // ── Auto-start camera on mount ──
    useEffect(() => {
        mountedRef.current = true;
        let stream = null;

        const initCamera = async () => {
            try {
                stream = await navigator.mediaDevices.getUserMedia({
                    video: { width: { ideal: 640 }, height: { ideal: 480 }, facingMode: 'user' },
                    audio: { echoCancellation: true, noiseSuppression: true },
                });

                if (!mountedRef.current) {
                    stream.getTracks().forEach(t => t.stop());
                    return;
                }

                setLocalStream(stream);
                localStreamRef.current = stream;

                if (localVideoRef.current) {
                    localVideoRef.current.srcObject = stream;
                }

                setStatus('In call');
                console.log('[VideoCall] Camera started, joining video room and emitting call:start');

                // Join dedicated video room
                socket?.emit('call:join-room', { roomId });

                // Announce to room
                socket?.emit('call:start', { roomId, userName: user?.name });

                // Process queued offers
                while (pendingOffersRef.current.length > 0) {
                    const offer = pendingOffersRef.current.shift();
                    console.log(`[VideoCall] Processing queued offer from ${offer.userName}`);
                    createPeer(offer.from, offer.userName, false, stream, offer.signal);
                }
            } catch (err) {
                console.error('[VideoCall] Camera access failed:', err);
                setStatus('Camera access denied');
            }
        };

        initCamera();

        return () => {
            mountedRef.current = false;
            // Stop local stream
            if (localStreamRef.current) {
                localStreamRef.current.getTracks().forEach(t => t.stop());
                localStreamRef.current = null;
            }
            if (screenStreamRef.current) {
                screenStreamRef.current.getTracks().forEach(t => t.stop());
                screenStreamRef.current = null;
            }
            // Destroy all peers
            Object.entries(peersRef.current).forEach(([id, peer]) => {
                try { peer.destroy(); } catch { }
            });
            peersRef.current = {};
            socket?.emit('call:leave-room', { roomId });
            socket?.emit('call:end', { roomId });
        };
    }, [roomId, socket, user?.name]);

    // ── Socket signaling listeners ──
    useEffect(() => {
        if (!socket) return;

        // Another user joined the call — I am the initiator
        const onUserJoined = ({ socketId, userName }) => {
            console.log(`[VideoCall] User joined: ${userName} (${socketId})`);
            if (socketId === socket.id) return; // ignore our own join
            if (peersRef.current[socketId]) return;
            if (!localStreamRef.current) {
                console.log('[VideoCall] Stream not ready, will connect when they send offer');
                return;
            }
            createPeer(socketId, userName, true, localStreamRef.current);
        };

        // Received an offer — I am the receiver
        const onOffer = ({ from, signal, userName }) => {
            console.log(`[VideoCall] Received offer from ${userName} (${from})`);
            if (peersRef.current[from]) {
                // Already have a peer — just signal it (likely an ICE candidate arriving early/late)
                try { peersRef.current[from].signal(signal); } catch { }
                return;
            }
            if (!localStreamRef.current) {
                console.log('[VideoCall] Stream not ready, queueing offer');
                pendingOffersRef.current.push({ from, signal, userName });
                return;
            }
            createPeer(from, userName, false, localStreamRef.current, signal);
        };

        // Received an answer to our offer
        const onAnswer = ({ from, signal }) => {
            console.log(`[VideoCall] Received answer from ${from}`);
            const peer = peersRef.current[from];
            if (peer && !peer.destroyed) {
                try { peer.signal(signal); } catch (e) {
                    console.error('[VideoCall] Error signaling answer:', e);
                }
            }
        };

        // ICE candidate
        const onIceCandidate = ({ from, candidate }) => {
            const peer = peersRef.current[from];
            if (peer && !peer.destroyed) {
                try { peer.signal(candidate); } catch { }
            }
        };

        // User ended their call
        const onCallEnd = ({ from }) => {
            console.log(`[VideoCall] User left call: ${from}`);
            removePeer(from);
        };

        socket.on('call:user-joined', onUserJoined);
        socket.on('call:offer', onOffer);
        socket.on('call:answer', onAnswer);
        socket.on('call:ice-candidate', onIceCandidate);
        socket.on('call:end', onCallEnd);

        return () => {
            socket.off('call:user-joined', onUserJoined);
            socket.off('call:offer', onOffer);
            socket.off('call:answer', onAnswer);
            socket.off('call:ice-candidate', onIceCandidate);
            socket.off('call:end', onCallEnd);
        };
    }, [socket, user, createPeer]);

    const removePeer = useCallback((peerId) => {
        if (peersRef.current[peerId]) {
            try { peersRef.current[peerId].destroy(); } catch { }
            delete peersRef.current[peerId];
        }
        if (mountedRef.current) {
            setPeers(prev => {
                const next = { ...prev };
                delete next[peerId];
                return next;
            });
        }
    }, []);

    const toggleVideo = () => {
        if (localStreamRef.current) {
            const track = localStreamRef.current.getVideoTracks()[0];
            if (track) {
                track.enabled = !track.enabled;
                setVideoEnabled(track.enabled);
            }
        }
    };

    const toggleAudio = () => {
        if (localStreamRef.current) {
            const track = localStreamRef.current.getAudioTracks()[0];
            if (track) {
                track.enabled = !track.enabled;
                setAudioEnabled(track.enabled);
            }
        }
    };

    const toggleScreenShare = async () => {
        if (isScreenSharing) {
            if (screenStreamRef.current) {
                screenStreamRef.current.getTracks().forEach(t => t.stop());
                screenStreamRef.current = null;
            }
            const camTrack = localStreamRef.current?.getVideoTracks()[0];
            if (camTrack) {
                Object.values(peersRef.current).forEach(peer => {
                    try {
                        const sender = peer._pc?.getSenders().find(s => s.track?.kind === 'video');
                        if (sender) sender.replaceTrack(camTrack);
                    } catch { }
                });
                if (localVideoRef.current) {
                    localVideoRef.current.srcObject = localStreamRef.current;
                }
            }
            setIsScreenSharing(false);
        } else {
            try {
                const screenStream = await navigator.mediaDevices.getDisplayMedia({ video: true });
                screenStreamRef.current = screenStream;
                const screenTrack = screenStream.getVideoTracks()[0];

                Object.values(peersRef.current).forEach(peer => {
                    try {
                        const sender = peer._pc?.getSenders().find(s => s.track?.kind === 'video');
                        if (sender) sender.replaceTrack(screenTrack);
                    } catch { }
                });

                if (localVideoRef.current) {
                    localVideoRef.current.srcObject = screenStream;
                }

                screenTrack.onended = () => {
                    if (mountedRef.current) toggleScreenShare();
                };
                setIsScreenSharing(true);
            } catch (err) {
                console.error('[VideoCall] Screen share failed:', err);
            }
        }
    };

    const peerEntries = Object.entries(peers);
    const participantCount = peerEntries.length + 1;

    return (
        <motion.div
            className={`video-panel glass ${expanded ? 'expanded' : ''}`}
            initial={{ opacity: 0, y: 50, scale: 0.9 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 50, scale: 0.9 }}
            drag={!expanded}
            dragMomentum={false}
        >
            <div className="video-header">
                <div className="video-header-info">
                    <div className="video-live-dot" />
                    <h4>{status} · {participantCount}</h4>
                </div>
                <div className="video-header-actions">
                    <button className="btn btn-ghost btn-icon sm" onClick={() => setExpanded(!expanded)}
                        title={expanded ? 'Minimize' : 'Maximize'}>
                        {expanded ? <Minimize2 size={14} /> : <Maximize2 size={14} />}
                    </button>
                    <button className="btn btn-ghost btn-icon sm" onClick={onClose}>×</button>
                </div>
            </div>

            <div className={`video-grid ${participantCount > 1 ? 'multi' : ''}`}>
                <div className="video-tile local">
                    <video
                        ref={localVideoRef}
                        autoPlay
                        playsInline
                        muted
                        className={`video-elem ${!videoEnabled && !isScreenSharing ? 'hidden' : ''}`}
                    />
                    {!videoEnabled && !isScreenSharing && (
                        <div className="video-avatar" style={{ background: getAvatarColor(user?.name) }}>
                            {getInitials(user?.name)}
                        </div>
                    )}
                    <span className="video-name">
                        You {isScreenSharing ? '(Screen)' : ''}
                        {!audioEnabled && <MicOff size={12} style={{ marginLeft: 4, opacity: 0.7 }} />}
                    </span>
                </div>

                {peerEntries.map(([peerId, peerData]) => (
                    <div key={peerId} className="video-tile">
                        {peerData.stream ? (
                            <PeerVideo stream={peerData.stream} />
                        ) : (
                            <div className="video-avatar" style={{ background: getAvatarColor(peerData.userName) }}>
                                {getInitials(peerData.userName)}
                            </div>
                        )}
                        <span className="video-name">{peerData.userName || 'Peer'}</span>
                    </div>
                ))}
            </div>

            <div className="video-controls">
                <button className={`video-ctrl-btn ${!audioEnabled ? 'off' : ''}`}
                    onClick={toggleAudio} title={audioEnabled ? 'Mute' : 'Unmute'}>
                    {audioEnabled ? <Mic size={18} /> : <MicOff size={18} />}
                </button>
                <button className={`video-ctrl-btn ${!videoEnabled ? 'off' : ''}`}
                    onClick={toggleVideo} title={videoEnabled ? 'Camera off' : 'Camera on'}>
                    {videoEnabled ? <Video size={18} /> : <VideoOff size={18} />}
                </button>
                <button className={`video-ctrl-btn ${isScreenSharing ? 'active' : ''}`}
                    onClick={toggleScreenShare} title={isScreenSharing ? 'Stop sharing' : 'Share screen'}>
                    {isScreenSharing ? <MonitorOff size={18} /> : <Monitor size={18} />}
                </button>
                <button className="video-ctrl-btn end" onClick={onClose} title="Leave call">
                    <PhoneOff size={18} />
                </button>
            </div>
        </motion.div>
    );
}

function PeerVideo({ stream }) {
    const ref = useRef(null);
    useEffect(() => {
        if (ref.current && stream) {
            ref.current.srcObject = stream;
        }
    }, [stream]);
    return <video ref={ref} autoPlay playsInline className="video-elem" />;
}
