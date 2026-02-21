import React, { createContext, useContext, useState, useEffect, useRef } from 'react';
import { useOrderNotification } from './OrderNotificationContext';
import { toast } from 'react-hot-toast';
import axios from 'axios';

const CallContext = createContext();

const defaultIceServers = [
    { urls: 'stun:stun.l.google.com:19302' },
    { urls: 'stun:stun1.l.google.com:19302' },
    { urls: 'stun:stun2.l.google.com:19302' },
];

const API_URL = import.meta.env.VITE_API_URL || '';

export const CallProvider = ({ children }) => {
    const { socket } = useOrderNotification();
    const myId = parseInt(localStorage.getItem('userId'));
    const myName = localStorage.getItem('username') || 'Pelanggan';

    const [incomingCall, setIncomingCall] = useState(null);
    const [callStatus, setCallStatus] = useState('idle'); // 'idle', 'ringing', 'connected'
    const [callType, setCallType] = useState(null);
    const [remoteUser, setRemoteUser] = useState(null);
    const [localStream, setLocalStream] = useState(null);
    const [remoteStream, setRemoteStream] = useState(null);
    const [localVideoEnabled, setLocalVideoEnabled] = useState(true);
    const [localAudioEnabled, setLocalAudioEnabled] = useState(true);

    const pc = useRef(null);
    const localStreamRef = useRef(null);
    const iceServersRef = useRef(defaultIceServers);
    const callStatusRef = useRef('idle');
    const pendingCandidates = useRef([]);
    const pendingOffer = useRef(null);

    const updateCallStatus = (status) => {
        setCallStatus(status);
        callStatusRef.current = status;
    };

    const fetchIceServers = async () => {
        try {
            const token = localStorage.getItem('token');
            const res = await axios.get(`${API_URL}/api/turn-credentials`, {
                headers: { Authorization: `Bearer ${token}` }
            });
            if (res.data && res.data.iceServers) {
                console.log('[WebRTC] ICE Servers loaded from backend');
                iceServersRef.current = res.data.iceServers;
            }
        } catch (e) {
            console.warn('[WebRTC] Failed to fetch TURN credentials, using defaults', e.message);
        }
    };

    const stopAllTracks = (stream) => {
        if (stream && stream.getTracks) {
            stream.getTracks().forEach(track => {
                try {
                    track.stop();
                    console.log(`[WebRTC] Track ${track.kind} stopped`);
                } catch (e) {
                    console.error('[WebRTC] Error stopping track:', e);
                }
            });
        }
    };

    useEffect(() => {
        fetchIceServers();
        // Cleanup on unmount
        return () => {
            if (localStreamRef.current) {
                stopAllTracks(localStreamRef.current);
            }
        };
    }, []);

    const setupMedia = async (type) => {
        try {
            // Stop existing stream if any
            if (localStreamRef.current) {
                stopAllTracks(localStreamRef.current);
            }

            const stream = await navigator.mediaDevices.getUserMedia({
                audio: true,
                video: type === 'video' ? {
                    width: { ideal: 1280 },
                    height: { ideal: 720 },
                    facingMode: 'user'
                } : false
            });

            setLocalStream(stream);
            localStreamRef.current = stream;
            setLocalVideoEnabled(true);
            setLocalAudioEnabled(true);
            return stream;
        } catch (e) {
            console.error('[WebRTC] Media Error:', e);
            toast.error('Gagal mengakses Kamera/Mic. Pastikan izin diberikan.');
            return null;
        }
    };

    const endCall = React.useCallback(() => {
        console.log('[WebRTC] endCall initiated');
        const targetId = remoteUser?.user_id || remoteUser?.id || incomingCall?.callerId;
        if (socket && targetId) {
            socket.emit('end_call', { to: targetId });
        }

        // Stop media tracks using Ref (always up-to-date)
        if (localStreamRef.current) {
            console.log('[WebRTC] Stopping local stream (ref)');
            stopAllTracks(localStreamRef.current);
            localStreamRef.current = null;
        }

        // Also stop tracks from state stream just in case
        if (localStream) {
            console.log('[WebRTC] Stopping local stream (state)');
            stopAllTracks(localStream);
        }

        // Stop remote tracks
        if (remoteStream) {
            console.log('[WebRTC] Stopping remote stream');
            stopAllTracks(remoteStream);
        }

        if (pc.current) {
            pc.current.onicecandidate = null;
            pc.current.ontrack = null;
            pc.current.close();
            pc.current = null;
        }

        setLocalStream(null);
        setRemoteStream(null);
        updateCallStatus('idle');
        setIncomingCall(null);
        setRemoteUser(null);
        pendingCandidates.current = [];
        pendingOffer.current = null;
    }, [socket, remoteUser, incomingCall, localStream, remoteStream]);

    const rejectCall = () => {
        if (incomingCall) socket.emit('reject_call', { to: incomingCall.callerId });
        endCall();
    };

    const createPeerConnection = (targetId) => {
        const peer = new RTCPeerConnection({
            iceServers: iceServersRef.current,
            iceCandidatePoolSize: 10
        });

        peer.onicecandidate = (event) => {
            if (event.candidate) {
                socket.emit('webrtc_signal', { to: targetId, signal: { candidate: event.candidate } });
            }
        };

        peer.ontrack = (event) => {
            console.log('[WebRTC] Remote track received');
            if (event.streams && event.streams[0]) {
                setRemoteStream(event.streams[0]);
            }
        };

        pc.current = peer;
        return peer;
    };

    const startCall = async (targetUser, type = 'voice') => {
        const stream = await setupMedia(type);
        if (!stream) return;

        updateCallStatus('ringing');
        setCallType(type);
        setRemoteUser(targetUser);

        const peer = createPeerConnection(targetUser.id || targetUser.user_id);
        stream.getTracks().forEach(track => peer.addTrack(track, stream));

        try {
            const offer = await peer.createOffer();
            await peer.setLocalDescription(offer);

            socket.emit('start_call', {
                to: targetUser.id || targetUser.user_id,
                from: myId,
                callerName: myName,
                type: type
            });
            socket.emit('webrtc_signal', { to: targetUser.id || targetUser.user_id, signal: offer });
        } catch (e) {
            console.error('[WebRTC] Error starting call:', e);
            endCall();
        }
    };

    const acceptCall = async () => {
        if (!incomingCall) return;
        const stream = await setupMedia(incomingCall.type);
        if (!stream) return;

        socket.emit('accept_call', { to: incomingCall.callerId });
        updateCallStatus('connected');
        setCallType(incomingCall.type);
        setRemoteUser({ user_id: incomingCall.callerId, username: incomingCall.callerName });

        const peer = createPeerConnection(incomingCall.callerId);
        stream.getTracks().forEach(track => peer.addTrack(track, stream));

        // Jika Offer sudah ada (datang duluan sebelum tombol terima ditekan)
        if (pendingOffer.current) {
            try {
                console.log('[WebRTC] Processing pending offer in acceptCall...');
                await peer.setRemoteDescription(new RTCSessionDescription(pendingOffer.current));
                pendingOffer.current = null;

                const answer = await peer.createAnswer();
                await peer.setLocalDescription(answer);
                socket.emit('webrtc_signal', { to: incomingCall.callerId, signal: answer });

                // Proses kandidat yang tertunda
                if (pendingCandidates.current.length > 0) {
                    for (const cand of pendingCandidates.current) {
                        try {
                            await peer.addIceCandidate(new RTCIceCandidate(cand));
                        } catch (e) {
                            console.error('[WebRTC] Error adding pending candidate:', e);
                        }
                    }
                    pendingCandidates.current = [];
                }
            } catch (err) {
                console.error('[WebRTC] Error processing pending offer:', err);
            }
        }

        setIncomingCall(null);
    };

    useEffect(() => {
        if (!socket) return;

        const handleIncomingCall = (data) => {
            console.log('[WebRTC] handleIncomingCall received. Status:', callStatusRef.current, 'From:', data.callerId);

            // Longgarkan pengecekan: Jika sedang idle ATAU ringing, terima panggilannya
            // Ini mencegah bug 'sibuk' palsu saat transisi status
            if (callStatusRef.current === 'idle' || callStatusRef.current === 'ringing' || (incomingCall && incomingCall.callerId === data.callerId)) {
                console.log('[WebRTC] Accepting incoming call signal');
                setIncomingCall(data);
                updateCallStatus('ringing');
                setCallType(data.type);
            } else {
                console.log('[WebRTC] Busy, emitting call_busy');
                socket.emit('call_busy', { to: data.callerId });
            }
        };

        const handleWebRTCSignal = async (data) => {
            const { from, signal } = data;
            const peer = pc.current;

            if (peer && peer.signalingState !== 'closed') {
                try {
                    if (signal.type === 'offer') {
                        console.log('[WebRTC] Receiving Offer...');
                        await peer.setRemoteDescription(new RTCSessionDescription(signal));

                        // Cek state sebelum createAnswer untuk mencegah "Called in wrong state"
                        if (peer.signalingState === 'have-remote-offer') {
                            const answer = await peer.createAnswer();
                            await peer.setLocalDescription(answer);
                            socket.emit('webrtc_signal', { to: from || incomingCall?.callerId || remoteUser?.user_id, signal: answer });
                        }

                        // Proses kandidat yang mungkin sudah datang duluan
                        if (pendingCandidates.current.length > 0) {
                            for (const cand of pendingCandidates.current) {
                                try {
                                    await peer.addIceCandidate(new RTCIceCandidate(cand));
                                } catch (e) {
                                    console.error('[WebRTC] Error adding pending candidate:', e);
                                }
                            }
                            pendingCandidates.current = [];
                        }
                    } else if (signal.type === 'answer') {
                        console.log('[WebRTC] Receiving Answer...');
                        await peer.setRemoteDescription(new RTCSessionDescription(signal));

                        // Proses kandidat setelah Answer diterima
                        if (pendingCandidates.current.length > 0) {
                            for (const cand of pendingCandidates.current) {
                                try {
                                    await peer.addIceCandidate(new RTCIceCandidate(cand));
                                } catch (e) {
                                    console.error('[WebRTC] Error adding pending candidate:', e);
                                }
                            }
                            pendingCandidates.current = [];
                        }
                    } else if (signal.candidate) {
                        if (peer.remoteDescription && peer.remoteDescription.type) {
                            console.log('[WebRTC] Adding ICE Candidate');
                            await peer.addIceCandidate(new RTCIceCandidate(signal.candidate));
                        } else {
                            console.log('[WebRTC] Storing pending ICE Candidate');
                            pendingCandidates.current.push(signal.candidate);
                        }
                    }
                } catch (e) {
                    console.error('[WebRTC] Signal handling error:', e);
                }
            } else {
                // Simpan sinyal jika PeerConnection belum siap
                if (signal.type === 'offer') {
                    console.log('[WebRTC] Storing pending offer...');
                    pendingOffer.current = signal;
                } else if (signal.candidate) {
                    pendingCandidates.current.push(signal.candidate);
                }
            }
        };

        socket.on('incoming_call', handleIncomingCall);
        socket.on('webrtc_signal', handleWebRTCSignal);
        socket.on('call_accepted', () => {
            console.log('[WebRTC] Call accepted by remote party');
            updateCallStatus('connected');
        });
        socket.on('call_rejected', () => {
            console.log('[WebRTC] Call rejected by remote party');
            toast.error('Panggilan ditolak');
            endCall();
        });
        socket.on('call_ended', () => {
            console.log('[WebRTC] Call ended by remote party');
            endCall();
        });
        socket.on('call_busy', () => {
            console.log('[WebRTC] Remote party is busy');
            toast.error('Penerima sedang sibuk');
            endCall();
        });

        return () => {
            socket.off('incoming_call');
            socket.off('webrtc_signal');
            socket.off('call_accepted');
            socket.off('call_rejected');
            socket.off('call_ended');
            socket.off('call_busy');
        };
    }, [socket, incomingCall, endCall, remoteUser]);

    const toggleVideo = () => {
        if (localStream) {
            const enabled = !localVideoEnabled;
            localStream.getVideoTracks().forEach(t => t.enabled = enabled);
            setLocalVideoEnabled(enabled);
        }
    };

    const toggleAudio = () => {
        if (localStream) {
            const enabled = !localAudioEnabled;
            localStream.getAudioTracks().forEach(t => t.enabled = enabled);
            setLocalAudioEnabled(enabled);
        }
    };

    return (
        <CallContext.Provider value={{
            callStatus, callType, incomingCall, remoteUser,
            localStream, remoteStream, localVideoEnabled, localAudioEnabled,
            startCall, acceptCall, rejectCall, endCall, toggleVideo, toggleAudio
        }}>
            {children}
        </CallContext.Provider>
    );
};

export const useCall = () => useContext(CallContext);
export default CallContext;

