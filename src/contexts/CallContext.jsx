import React, { createContext, useContext, useState, useEffect, useRef } from 'react';
import { useOrderNotification } from './OrderNotificationContext';
import { toast } from 'react-hot-toast';

const CallContext = createContext();

const configuration = {
    iceServers: [
        { urls: 'stun:stun.l.google.com:19302' },
        { urls: 'stun:stun1.l.google.com:19302' },
        { urls: 'stun:stun2.l.google.com:19302' },
    ],
};

export const CallProvider = ({ children }) => {
    const { socket } = useOrderNotification();
    const myId = parseInt(localStorage.getItem('userId'));
    const myName = localStorage.getItem('username') || 'Penjual';

    const [incomingCall, setIncomingCall] = useState(null);
    const [callStatus, setCallStatus] = useState('idle'); // 'idle', 'ringing', 'connected'
    const [callType, setCallType] = useState(null);
    const [remoteUser, setRemoteUser] = useState(null);
    const [localStream, setLocalStream] = useState(null);
    const [remoteStream, setRemoteStream] = useState(null);

    const pc = useRef(null);

    const setupMedia = async (type) => {
        try {
            const stream = await navigator.mediaDevices.getUserMedia({
                audio: true,
                video: type === 'video'
            });
            setLocalStream(stream);
            return stream;
        } catch (e) {
            console.error('[WebRTC] Media Error:', e);
            toast.error('Gagal mengakses Kamera/Mic');
            return null;
        }
    };

    useEffect(() => {
        if (!socket) return;

        const handleIncomingCall = (data) => {
            if (callStatus === 'idle') {
                setIncomingCall(data);
                setCallStatus('ringing');
                setCallType(data.type);
            } else {
                socket.emit('call_busy', { to: data.callerId });
            }
        };

        const handleWebRTCSignal = async (data) => {
            const { signal } = data;
            if (pc.current) {
                if (signal.type === 'offer' || signal.type === 'answer') {
                    await pc.current.setRemoteDescription(new RTCSessionDescription(signal));
                } else if (signal.candidate) {
                    await pc.current.addIceCandidate(new RTCIceCandidate(signal.candidate));
                }
            }
        };

        socket.on('incoming_call', handleIncomingCall);
        socket.on('webrtc_signal', handleWebRTCSignal);
        socket.on('call_accepted', () => setCallStatus('connected'));
        socket.on('call_rejected', () => endCall());
        socket.on('call_ended', () => endCall());
        socket.on('call_busy', () => {
            endCall();
            toast.error('Penerima sedang sibuk');
        });

        return () => {
            socket.off('incoming_call');
            socket.off('webrtc_signal');
            socket.off('call_accepted');
            socket.off('call_rejected');
            socket.off('call_ended');
            socket.off('call_busy');
        };
    }, [socket, callStatus]);

    const createPeerConnection = (targetId) => {
        const peer = new RTCPeerConnection(configuration);

        peer.onicecandidate = (event) => {
            if (event.candidate) {
                socket.emit('webrtc_signal', { to: targetId, signal: { candidate: event.candidate } });
            }
        };

        peer.ontrack = (event) => {
            setRemoteStream(event.streams[0]);
        };

        pc.current = peer;
        return peer;
    };

    const startCall = async (targetUser, type = 'voice') => {
        const stream = await setupMedia(type);
        if (!stream) return;

        setCallStatus('ringing');
        setCallType(type);
        setRemoteUser(targetUser);

        const peer = createPeerConnection(targetUser.user_id);
        stream.getTracks().forEach(track => peer.addTrack(track, stream));

        const offer = await peer.createOffer();
        await peer.setLocalDescription(offer);

        socket.emit('start_call', {
            to: targetUser.user_id,
            from: myId,
            callerName: myName,
            type: type
        });
        socket.emit('webrtc_signal', { to: targetUser.user_id, signal: offer });
    };

    const acceptCall = async () => {
        if (!incomingCall) return;
        const stream = await setupMedia(incomingCall.type);
        if (!stream) return;

        socket.emit('accept_call', { to: incomingCall.callerId });
        setCallStatus('connected');
        setRemoteUser({ user_id: incomingCall.callerId, username: incomingCall.callerName });

        const peer = createPeerConnection(incomingCall.callerId);
        stream.getTracks().forEach(track => peer.addTrack(track, stream));

        const answer = await peer.createAnswer();
        await peer.setLocalDescription(answer);
        socket.emit('webrtc_signal', { to: incomingCall.callerId, signal: answer });
        setIncomingCall(null);
    };

    const rejectCall = () => {
        if (incomingCall) socket.emit('reject_call', { to: incomingCall.callerId });
        endCall();
    };

    const endCall = () => {
        if (socket && remoteUser) socket.emit('end_call', { to: remoteUser.user_id });
        if (localStream) localStream.getTracks().forEach(t => t.stop());
        if (pc.current) pc.current.close();
        pc.current = null;
        setLocalStream(null);
        setRemoteStream(null);
        setCallStatus('idle');
        setIncomingCall(null);
    };

    return (
        <CallContext.Provider value={{
            callStatus, callType, incomingCall, remoteUser,
            localStream, remoteStream,
            startCall, acceptCall, rejectCall, endCall
        }}>
            {children}
        </CallContext.Provider>
    );
};

export const useCall = () => useContext(CallContext);
export default CallContext;
