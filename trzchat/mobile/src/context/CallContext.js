import React, { createContext, useContext, useState, useEffect, useRef } from 'react';
import { View, Alert, Platform } from 'react-native';
import io from 'socket.io-client';
import { SOCKET_URL, fixUrl } from '../config/api';
import { getToken } from '../utils/auth';

// Kondisional Import untuk menghindari error di Web
let RTCPeerConnection, RTCIceCandidate, RTCSessionDescription, mediaDevices;
let InCallManager = {
    start: () => { },
    stop: () => { },
    startRingtone: () => { },
    stopRingtone: () => { }
};

if (Platform.OS !== 'web') {
    const WebRTC = require('react-native-webrtc');
    RTCPeerConnection = WebRTC.RTCPeerConnection;
    RTCIceCandidate = WebRTC.RTCIceCandidate;
    RTCSessionDescription = WebRTC.RTCSessionDescription;
    mediaDevices = WebRTC.mediaDevices;
    InCallManager = require('react-native-incall-manager').default;
} else {
    // Browser environment
    RTCPeerConnection = window.RTCPeerConnection;
    RTCIceCandidate = window.RTCIceCandidate;
    RTCSessionDescription = window.RTCSessionDescription;
    mediaDevices = window.navigator.mediaDevices;
}

const CallContext = createContext();

export const CallProvider = ({ children }) => {
    const [localStream, setLocalStream] = useState(null);
    const [remoteStream, setRemoteStream] = useState(null);
    const [isCalling, setIsCalling] = useState(false); // Outgoing state
    const [incomingCall, setIncomingCall] = useState(null); // { from, type, offer, callerName }
    const [isInCall, setIsInCall] = useState(false);
    const [callType, setCallType] = useState('audio'); // 'audio' or 'video')
    const [otherUserId, setOtherUserId] = useState(null);
    const [otherUserName, setOtherUserName] = useState('');
    const [otherUserAvatar, setOtherUserAvatar] = useState(null);
    const otherUserIdRef = useRef(null);
    const [socket, setSocket] = useState(null);
    const [callDuration, setCallDuration] = useState(0);
    const timerRef = useRef(null);

    const pc = useRef(null);

    const configuration = {
        iceServers: [
            { urls: 'stun:stun.l.google.com:19302' },
            { urls: 'stun:stun1.l.google.com:19302' },
            { urls: 'stun:stun2.l.google.com:19302' },
        ],
    };

    useEffect(() => {
        if (isInCall) {
            setCallDuration(0);
            timerRef.current = setInterval(() => {
                setCallDuration(prev => prev + 1);
            }, 1000);
        } else {
            if (timerRef.current) clearInterval(timerRef.current);
            setCallDuration(0);
        }

        return () => {
            if (timerRef.current) clearInterval(timerRef.current);
        };
    }, [isInCall]);

    useEffect(() => {
        let checkTokenInterval;

        const initSocket = async () => {
            const token = await getToken();
            if (!token) return;

            if (socket) return; // Sudah ada socket

            const newSocket = io(SOCKET_URL, {
                auth: { token },
                transports: ['polling', 'websocket'],
                reconnection: true,
                reconnectionAttempts: Infinity,
                secure: true,
                rejectUnauthorized: false,
                timeout: 30000,
                forceNew: true
            });
            setSocket(newSocket);

            newSocket.on('connect', () => console.log('[CallSocket] Connected to:', SOCKET_URL));
            newSocket.on('connect_error', (err) => {
                console.log('[CallSocket] Connection Error:', {
                    message: err.message,
                    description: err.description
                });
            });

            newSocket.on('incoming-call', (data) => {
                console.log('[Call] Incoming call from', data.from);
                setIncomingCall({
                    ...data,
                    callerAvatar: fixUrl(data.callerAvatar)
                });
                setOtherUserName(data.callerName || 'Seseorang');
                setOtherUserAvatar(fixUrl(data.callerAvatar));
                otherUserIdRef.current = Number(data.from);
                InCallManager.startRingtone('_BUNDLE_');
            });

            newSocket.on('call-answered', async (data) => {
                console.log('[Call] Answered by', data.from);
                if (pc.current) {
                    await pc.current.setRemoteDescription(new RTCSessionDescription(data.answer));
                    setIsInCall(true);
                    setIsCalling(false);
                    // Hentikan nada dering/tunggu dan mulai sesi audio
                    InCallManager.stop();
                    InCallManager.start({ audio: 'speaker' });
                }
            });

            newSocket.on('ice-candidate', async (data) => {
                if (pc.current) {
                    try {
                        await pc.current.addIceCandidate(new RTCIceCandidate(data.candidate));
                    } catch (e) { }
                }
            });

            newSocket.on('call-rejected', (data) => {
                console.log('[Call] Rejected:', data?.reason);
                cleanup();
                Alert.alert('Panggilan', data?.reason === 'offline' ? 'User sedang tidak aktif.' : 'Penerima menolak panggilan Anda.');
            });

            newSocket.on('call-ended', () => {
                console.log('[Call] Ended by peer');
                cleanup();
            });
        };

        initSocket();
        checkTokenInterval = setInterval(initSocket, 5000); // Cek setiap 5 detik jika belum terhubung

        return () => {
            clearInterval(checkTokenInterval);
            if (socket) socket.disconnect();
        };
    }, [socket]);

    const setupPeerConnection = async (stream) => {
        pc.current = new RTCPeerConnection(configuration);

        stream.getTracks().forEach(track => {
            pc.current.addTrack(track, stream);
        });

        pc.current.onicecandidate = (event) => {
            if (event.candidate && socket && otherUserIdRef.current) {
                socket.emit('ice-candidate', { targetUserId: otherUserIdRef.current, candidate: event.candidate });
            }
        };

        pc.current.ontrack = (event) => {
            if (event.streams && event.streams[0]) {
                setRemoteStream(event.streams[0]);
            }
        };

        pc.current.onconnectionstatechange = () => {
            if (!pc.current) return;
            console.log('Connection state changed:', pc.current.connectionState);
            if (pc.current.connectionState === 'disconnected' || pc.current.connectionState === 'failed') {
                cleanup();
            }
        };
    };

    const startCall = async (targetUserId, targetUserName, targetAvatar, type = 'audio') => {
        try {
            console.log('Starting call to:', targetUserId);
            setCallType(type);
            setOtherUserId(targetUserId);
            setOtherUserName(targetUserName);
            setOtherUserAvatar(fixUrl(targetAvatar));
            otherUserIdRef.current = targetUserId;
            setIsCalling(true);

            const stream = await mediaDevices.getUserMedia({
                audio: true,
                video: type === 'video'
            });

            // Explicitly enable video tracks for Native (important for some Android devices)
            if (type === 'video') {
                stream.getVideoTracks().forEach(track => {
                    track.enabled = true;
                });
            }

            setLocalStream(stream);

            await setupPeerConnection(stream);

            const offer = await pc.current.createOffer();
            await pc.current.setLocalDescription(offer);

            socket.emit('call-user', { targetUserId, offer, type });
            InCallManager.start({ ringback: '_BUNDLE_' });
        } catch (e) {
            console.error('Error starting call', e);
            cleanup();
        }
    };

    const answerCall = async () => {
        if (!incomingCall) return;
        try {
            InCallManager.stopRingtone();
            setCallType(incomingCall.type);
            setOtherUserId(incomingCall.from);
            setOtherUserName(incomingCall.callerName || 'Seseorang');
            setOtherUserAvatar(fixUrl(incomingCall.callerAvatar));
            setIsInCall(true);

            const stream = await mediaDevices.getUserMedia({
                audio: true,
                video: incomingCall.type === 'video'
            });

            // Explicitly enable tracks for Native
            stream.getTracks().forEach(track => {
                track.enabled = true;
            });

            setLocalStream(stream);

            await setupPeerConnection(stream);

            await pc.current.setRemoteDescription(new RTCSessionDescription(incomingCall.offer));

            const answer = await pc.current.createAnswer();
            await pc.current.setLocalDescription(answer);

            socket.emit('answer-call', { targetUserId: incomingCall.from, answer });
            setIncomingCall(null);
            InCallManager.start({ audio: 'speaker' });
        } catch (e) {
            console.error('Error answering call', e);
            cleanup();
        }
    };

    const rejectCall = () => {
        if (incomingCall && socket) {
            socket.emit('reject-call', { targetUserId: incomingCall.from });
        }
        setIncomingCall(null);
        InCallManager.stopRingtone();
    };

    const endCall = () => {
        if (otherUserId && socket) {
            socket.emit('end-call', { targetUserId: otherUserId });
        }
        cleanup();
    };

    const cleanup = () => {
        console.log('[Call] Cleaning up resources...');

        // Stop all tracks explicitly for Web browser compatibility
        if (localStream) {
            localStream.getTracks().forEach(track => {
                track.stop();
                console.log(`[Call] Stopped local track: ${track.kind}`);
            });
            setLocalStream(null);
        }

        if (remoteStream) {
            remoteStream.getTracks().forEach(track => {
                track.stop();
            });
            setRemoteStream(null);
        }

        if (pc.current) {
            pc.current.close();
            pc.current = null;
        }

        if (timerRef.current) {
            clearInterval(timerRef.current);
            timerRef.current = null;
        }

        setIsCalling(false);
        setIsInCall(false);
        setIncomingCall(null);
        setOtherUserId(null);
        setOtherUserName('');
        setOtherUserAvatar(null);
        setCallDuration(0);

        // Ensure audio manager stops
        InCallManager.stop();
        InCallManager.stopRingtone();
    };

    const switchCamera = () => {
        if (localStream && callType === 'video') {
            localStream.getVideoTracks().forEach(track => {
                track._switchCamera();
            });
        }
    };

    return (
        <CallContext.Provider value={{
            localStream,
            remoteStream,
            isCalling,
            incomingCall,
            isInCall,
            callType,
            otherUserName,
            otherUserAvatar,
            callDuration,
            startCall,
            answerCall,
            rejectCall,
            endCall,
            switchCamera
        }}>
            {children}
        </CallContext.Provider>
    );
};

export const useCall = () => useContext(CallContext);
