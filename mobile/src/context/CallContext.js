import React, { createContext, useContext, useState, useEffect, useRef, useCallback } from 'react';
import { Platform, Alert } from 'react-native';
import { Audio } from 'expo-av';
import { useAuth } from './AuthContext';
import { useOrderNotification } from './OrderNotificationContext';
import apiService from '../api/apiService';

// Logic untuk membedakan WebRTC di HP vs Web
let WebRTC;
if (Platform.OS === 'web') {
    // Di Web pakai API bawaan browser
    WebRTC = {
        RTCPeerConnection: window.RTCPeerConnection || window.webkitRTCPeerConnection,
        RTCSessionDescription: window.RTCSessionDescription,
        RTCIceCandidate: window.RTCIceCandidate,
        mediaDevices: navigator.mediaDevices
    };
} else {
    // Di HP pakai library native
    try {
        // Gunakan pemanggilan yang lebih standar untuk Metro
        const WebRTCModule = require('react-native-webrtc');
        WebRTC = {
            RTCPeerConnection: WebRTCModule.RTCPeerConnection,
            RTCSessionDescription: WebRTCModule.RTCSessionDescription,
            RTCIceCandidate: WebRTCModule.RTCIceCandidate,
            mediaDevices: WebRTCModule.mediaDevices
        };
        console.log('[WebRTC] Native Library loaded successfully');
    } catch (e) {
        console.error('[WebRTC] FAILED TO LOAD NATIVE LIBRARY:', e.message);
        WebRTC = null;
    }
}

const CallContext = createContext();

// Konfigurasi ICE default (hanya STUN, sebagai fallback sebelum TURN di-load)
const defaultIceServers = [
    { urls: 'stun:stun.l.google.com:19302' },
    { urls: 'stun:stun1.l.google.com:19302' },
];

export const CallProvider = ({ children }) => {
    const { user } = useAuth();
    const { socket } = useOrderNotification();

    const [incomingCall, setIncomingCall] = useState(null);
    const [callStatus, setCallStatus] = useState('idle');
    const [callType, setCallType] = useState(null);
    const [remoteUser, setRemoteUser] = useState(null);
    const [localStream, setLocalStream] = useState(null);
    const [remoteStream, setRemoteStream] = useState(null);
    const [localVideoEnabled, setLocalVideoEnabled] = useState(true);
    const [localAudioEnabled, setLocalAudioEnabled] = useState(true);
    const [iceServers, setIceServers] = useState(defaultIceServers);

    const pc = useRef(null);
    const iceServersRef = useRef(defaultIceServers);
    const localStreamRef = useRef(null);
    const callStatusRef = useRef('idle');
    const ringtoneSoundRef = useRef(null);
    const pendingOffer = useRef(null);
    const pendingCandidates = useRef([]);

    // Sound Assets
    const SOUNDS = {
        incoming: 'https://assets.mixkit.co/active_storage/sfx/1359/1359-preview.mp3', // Digital Ringing
        outgoing: 'https://assets.mixkit.co/active_storage/sfx/1360/1360-preview.mp3'  // Ringback tone
    };

    const playSound = async (type) => {
        try {
            await stopSound();
            const { sound } = await Audio.Sound.createAsync(
                { uri: SOUNDS[type] },
                { shouldPlay: true, isLooping: true, volume: 1.0 }
            );
            ringtoneSoundRef.current = sound;
        } catch (error) {
            console.log('[WebRTC] Error playing sound:', error);
        }
    };

    const stopSound = async () => {
        if (ringtoneSoundRef.current) {
            try {
                await ringtoneSoundRef.current.stopAsync();
                await ringtoneSoundRef.current.unloadAsync();
                ringtoneSoundRef.current = null;
            } catch (error) {
                console.log('[WebRTC] Error stopping sound:', error);
            }
        }
    };

    // Helper wrapper to update both state and ref
    const updateCallStatus = (status) => {
        setCallStatus(status);
        callStatusRef.current = status;
    };

    // Ambil TURN credentials dari backend kita sendiri
    const fetchIceServers = async () => {
        try {
            console.log('[WebRTC] Fetching TURN credentials from backend...');
            const response = await apiService.get('/api/turn-credentials');
            if (response.data && response.data.iceServers) {
                console.log('[WebRTC] TURN credentials received successfully. Count:', response.data.iceServers.length);
                setIceServers(response.data.iceServers);
                iceServersRef.current = response.data.iceServers;
                return response.data.iceServers;
            }
        } catch (err) {
            console.warn('[WebRTC] Gagal mengambil TURN credentials, menggunakan STUN saja:', err.message);
        }
        return defaultIceServers;
    };

    // Fungsi untuk meminta izin di Android secara runtime
    const requestPermissions = async () => {
        if (Platform.OS !== 'android') return true;

        const { PermissionsAndroid } = require('react-native');
        try {
            const granted = await PermissionsAndroid.requestMultiple([
                PermissionsAndroid.PERMISSIONS.CAMERA,
                PermissionsAndroid.PERMISSIONS.RECORD_AUDIO,
            ]);

            const cameraGranted = granted[PermissionsAndroid.PERMISSIONS.CAMERA] === PermissionsAndroid.RESULTS.GRANTED;
            const micGranted = granted[PermissionsAndroid.PERMISSIONS.RECORD_AUDIO] === PermissionsAndroid.RESULTS.GRANTED;

            if (!cameraGranted || !micGranted) {
                console.warn('[WebRTC] Izin ditolak oleh pengguna');
                return false;
            }
            return true;
        } catch (err) {
            console.warn('[WebRTC] Gagal meminta izin:', err);
            return false;
        }
    };

    const setupMedia = async (type) => {
        console.log('[WebRTC] setupMedia started. type:', type);

        if (!WebRTC) {
            console.error('[WebRTC] Critical Error: WebRTC library is NOT loaded. (Are you using Expo Go? WebRTC needs a Dev Build)');
            return null;
        }

        if (!WebRTC.mediaDevices) {
            console.error('[WebRTC] Error: mediaDevices is undefined.');
            return null;
        }

        // Minta izin dulu di Android
        const hasPermission = await requestPermissions();
        if (!hasPermission) {
            Alert.alert('Izin Dibutuhkan', 'Kamera dan Mikrofon diperlukan untuk melakukan panggilan.');
            return null;
        }

        // Set Audio Mode agar suara keluar dari speaker (bukan earpiece) di Android
        if (Platform.OS !== 'web') {
            try {
                await Audio.setAudioModeAsync({
                    allowsRecordingIOS: true,
                    playsInSilentModeIOS: true,
                    staysActiveInBackground: true,
                    shouldDuckAndroid: false,
                    playThroughEarpieceAndroid: false, // false = speaker, true = earpiece
                });
                console.log('[WebRTC] Audio mode set successfully');
            } catch (audioErr) {
                console.warn('[WebRTC] Gagal set audio mode:', audioErr.message);
            }
        }

        try {
            console.log('[WebRTC] Requesting getUserMedia...');
            const stream = await WebRTC.mediaDevices.getUserMedia({
                audio: true,
                video: type === 'video'
            });
            console.log('[WebRTC] Stream obtained successfully');
            setLocalStream(stream);
            localStreamRef.current = stream;
            return stream;
        } catch (e) {
            console.error('[WebRTC] getUserMedia Error:', e);
            Alert.alert('Izin Media', 'Gagal mengakses kamera/mic: ' + (e.message || 'Izin ditolak'));
            return null;
        }
    };

    useEffect(() => {
        if (!socket) return;

        const handleIncomingCall = (data) => {
            console.log('[WebRTC] handleIncomingCall received. Status:', callStatusRef.current, 'From:', data.callerId);

            // AGRESIF: Selalu terima sinyal masuk jika kita sedang tidak dalam panggilan yang sudah TERHUBUNG (connected)
            if (callStatusRef.current !== 'connected') {
                console.log('[WebRTC] Forcing UI for incoming call');
                setIncomingCall(data);
                updateCallStatus('ringing');
                setCallType(data.type);
                playSound('incoming');
            } else {
                // Hanya kirim busy jika kita benar-benar sedang ngobrol (connected)
                console.log('[WebRTC] Truly busy (connected), emitting call_busy');
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
                        await peer.setRemoteDescription(new WebRTC.RTCSessionDescription(signal));
                        const answer = await peer.createAnswer();
                        await peer.setLocalDescription(answer);
                        socket.emit('webrtc_signal', { to: from, signal: answer });

                        // Proses kandidat yang mungkin sudah datang duluan
                        if (pendingCandidates.current.length > 0) {
                            for (const cand of pendingCandidates.current) {
                                await peer.addIceCandidate(new WebRTC.RTCIceCandidate(cand));
                            }
                            pendingCandidates.current = [];
                        }
                    } else if (signal.type === 'answer') {
                        console.log('[WebRTC] Receiving Answer...');
                        await peer.setRemoteDescription(new WebRTC.RTCSessionDescription(signal));

                        // Penting: Proses kandidat setelah Answer diterima (untuk penelpon)
                        if (pendingCandidates.current.length > 0) {
                            for (const cand of pendingCandidates.current) {
                                await peer.addIceCandidate(new WebRTC.RTCIceCandidate(cand));
                            }
                            pendingCandidates.current = [];
                        }
                    } else if (signal.candidate) {
                        // Hanya tambahkan ICe jika remoteDescription sudah terpasang
                        if (peer.remoteDescription) {
                            console.log('[WebRTC] Adding ICE Candidate...');
                            await peer.addIceCandidate(new WebRTC.RTCIceCandidate(signal.candidate));
                        } else {
                            console.log('[WebRTC] Storing pending ICE Candidate...');
                            pendingCandidates.current.push(signal.candidate);
                        }
                    }
                } catch (err) {
                    console.error('[WebRTC] Signal handling error:', err);
                }
            } else {
                // Simpan sinyal jika PeerConnection belum siap
                if (signal.type === 'offer') {
                    pendingOffer.current = signal;
                } else if (signal.candidate) {
                    pendingCandidates.current.push(signal.candidate);
                }
            }
        };

        const handleCallAccepted = async (data) => {
            console.log(`[WebRTC] Call accepted by: ${data.acceptedBy} (${data.acceptedName})`);
            updateCallStatus('connected');
            stopSound(); // Berhenti berdering saat tersambung

            // Jika yang mengangkat berbeda dengan target awal (Group Call), update info
            if (data.acceptedBy) {
                console.log('[WebRTC] Customer updating remote user info to acceptor');
                setRemoteUser(prev => ({
                    ...(prev || {}),
                    user_id: data.acceptedBy,
                    username: data.acceptedName || prev?.username || 'Staf Berkah'
                }));

                // KHUSUS PENELPON: Baru mulai handshake WebRTC sekarang ke ID pengangkat yang tepat
                if (localStreamRef.current && !pc.current) {
                    try {
                        const peer = createPeerConnection(data.acceptedBy, iceServersRef.current);
                        localStreamRef.current.getTracks().forEach(track => peer.addTrack(track, localStreamRef.current));

                        const offer = await peer.createOffer();
                        await peer.setLocalDescription(offer);
                        socket.emit('webrtc_signal', { to: data.acceptedBy, signal: offer });
                        console.log('[WebRTC] Offer sent to actual acceptor:', data.acceptedBy);
                    } catch (err) {
                        console.error('[WebRTC] Error during post-accept handshake:', err);
                    }
                }
            }
        };

        socket.on('incoming_call', handleIncomingCall);
        socket.on('webrtc_signal', handleWebRTCSignal);
        socket.on('call_accepted', handleCallAccepted);

        socket.on('call_rejected', () => {
            // Hanya endCall jika sedang dalam fase memanggil (ringing)
            // Jika sudah terhubung (connected), abaikan penolakan dari seller lain
            if (callStatusRef.current === 'ringing') {
                console.log('[WebRTC] Call rejected while ringing, ending call.');
                endCall();
            } else {
                console.log('[WebRTC] Call rejected but already connected, ignoring.');
            }
        });

        socket.on('call_ended', endCall);
        socket.on('call_busy', () => {
            endCall();
            Alert.alert('Sibuk', 'Penerima sedang menelpon.');
        });

        // Tangani jika salah satu tim seller sudah mengangkat/menolak
        socket.on('call_handled', (data) => {
            if (callStatusRef.current === 'ringing' && incomingCall && incomingCall.callerId === data.callerId) {
                console.log('[WebRTC] Call was handled by another team member:', data.by);
                endCall();
            }
        });

        return () => {
            socket.off('incoming_call', handleIncomingCall);
            socket.off('webrtc_signal', handleWebRTCSignal);
            socket.off('call_accepted', handleCallAccepted);
            socket.off('call_rejected', endCall);
            socket.off('call_ended', endCall);
            socket.off('call_busy', () => {
                endCall();
                Alert.alert('Sibuk', 'Penerima sedang menelpon.');
            });
            socket.off('call_handled');
        };
    }, [socket]); // Hanya bergantung pada socket, tidak re-run saat status berubah

    const createPeerConnection = (targetId, customIceServers = null) => {
        if (!WebRTC) return null;

        // Gunakan Ref jika state belum terupdate
        const activeIceServers = customIceServers || iceServersRef.current || defaultIceServers;

        console.log('[WebRTC] Creating RTCPeerConnection for target:', targetId, '| ICE servers count:', activeIceServers.length);

        const peer = new WebRTC.RTCPeerConnection({
            iceServers: activeIceServers,
            iceCandidatePoolSize: 10 // Mempercepat gathering ICE candidates
        });

        peer.onicecandidate = (event) => {
            if (event.candidate) {
                console.log('[WebRTC] New ICE Candidate gathered');
                socket.emit('webrtc_signal', { to: targetId, signal: { candidate: event.candidate } });
            }
        };

        // Modern track handling
        peer.ontrack = (event) => {
            console.log('[WebRTC] Remote track received:', event.track?.kind);
            if (event.streams && event.streams[0]) {
                setRemoteStream(event.streams[0]);
            }
        };

        // Fallback untuk versi native webrtc tertentu (seringkali lebih stabil di Android)
        peer.onaddstream = (event) => {
            console.log('[WebRTC] Remote stream added (onaddstream)');
            if (event.stream) {
                setRemoteStream(event.stream);
            }
        };

        peer.oniceconnectionstatechange = () => {
            console.log('[WebRTC] ICE Connection State:', peer.iceConnectionState);
            if (peer.iceConnectionState === 'failed') {
                console.warn('[WebRTC] ICE connection failed. Potential firewall issue or TURN server unreachable.');
            }
        };

        peer.onsignalingstatechange = () => {
            console.log('[WebRTC] Signaling State:', peer.signalingState);
        };

        pc.current = peer;
        return peer;
    };

    const startCall = async (targetUser, type = 'voice') => {
        console.log('[WebRTC] startCall invoked for:', targetUser?.username, 'type:', type);

        if (!targetUser || !targetUser.user_id) {
            console.error('[WebRTC] Invalid targetUser:', targetUser);
            Alert.alert('Error', 'Data pengguna tidak valid untuk melakukan panggilan.');
            return;
        }

        // Fetch TURN credentials SEBELUM setup media
        const activeIceServers = await fetchIceServers();
        setIceServers(activeIceServers);

        const stream = await setupMedia(type);
        if (!stream) {
            console.error('[WebRTC] No stream obtained');
            Alert.alert('Media Error', 'Gagal mendapatkan akses Kamera/Mic. Pastikan izin sudah diberikan dan library native terpasang.');
            return;
        }

        updateCallStatus('ringing');
        setCallType(type);
        setRemoteUser(targetUser);
        playSound('outgoing'); // Suara tut.. tut.. tut.. panggil

        try {
            // Kita tidak membuat PeerConnection dulu.
            // Kita tunggu 'call_accepted' untuk tahu ID siapa yang harus kita ajak jabat tangan.
            // (Penting untuk Group Call jika pengangkatnya berbeda dengan ID target awal)

            socket.emit('start_call', {
                to: targetUser.user_id,
                from: user.id || user.userId,
                callerName: user.name || user.username || 'Seseorang',
                type: type
            });
            console.log('[WebRTC] start_call emitted, waiting for acceptance...');
        } catch (err) {
            console.error('[WebRTC] Start Call Error:', err);
            Alert.alert('Error', 'Gagal memulakan panggilan.');
            endCall();
        }
    };

    const acceptCall = async () => {
        if (!incomingCall) return;

        // Fetch TURN credentials SEBELUM setup media
        const activeIceServers = await fetchIceServers();
        setIceServers(activeIceServers);

        const stream = await setupMedia(incomingCall.type);
        if (!stream) return;

        socket.emit('accept_call', { to: incomingCall.callerId });
        updateCallStatus('connected');
        setRemoteUser({ user_id: incomingCall.callerId, username: incomingCall.callerName });
        stopSound(); // Berhenti berdering saat kita angkat

        const peer = createPeerConnection(incomingCall.callerId, activeIceServers);
        stream.getTracks().forEach(track => peer.addTrack(track, stream));

        // Jika Offer sudah ada (datang duluan sebelum tombol terima ditekan)
        if (pendingOffer.current) {
            try {
                await peer.setRemoteDescription(new WebRTC.RTCSessionDescription(pendingOffer.current));
                pendingOffer.current = null;

                const answer = await peer.createAnswer();
                await peer.setLocalDescription(answer);
                socket.emit('webrtc_signal', { to: incomingCall.callerId, signal: answer });

                // Proses kandidat yang tertunda
                if (pendingCandidates.current.length > 0) {
                    for (const cand of pendingCandidates.current) {
                        await peer.addIceCandidate(new WebRTC.RTCIceCandidate(cand));
                    }
                    pendingCandidates.current = [];
                }
            } catch (err) {
                console.error('[WebRTC] Error processing pending offer:', err);
            }
        }
        // Jika Offer belum ada, kita DIAM saja. handleWebRTCSignal akan otomatis 
        // membuat Answer saat Offer datang nanti (karena pc.current sudah ada).

        setIncomingCall(null);
    };

    const rejectCall = () => {
        if (incomingCall) socket.emit('reject_call', { to: incomingCall.callerId });
        endCall();
    };

    const endCall = () => {
        if (callStatus === 'idle' && !pc.current && !localStream) return;

        console.log('[WebRTC] Ending call, clearing states...');
        if (socket && remoteUser) {
            socket.emit('end_call', { to: remoteUser.user_id });
        }

        if (localStream) {
            localStream.getTracks().forEach(t => {
                try { t.stop(); } catch (e) { console.log('Error stopping track:', e); }
            });
        }

        stopSound();

        if (pc.current) {
            try {
                pc.current.onicecandidate = null;
                pc.current.ontrack = null;
                pc.current.oniceconnectionstatechange = null;
                pc.current.close();
            } catch (e) {
                console.log('Error closing PeerConnection:', e);
            }
        }

        if (localStreamRef.current) {
            try {
                localStreamRef.current.getTracks().forEach(track => track.stop());
            } catch (e) {
                console.log('Error stopping tracks:', e);
            }
        }

        pc.current = null;
        localStreamRef.current = null;
        setLocalStream(null);
        setRemoteStream(null);
        updateCallStatus('idle');
        setIncomingCall(null);
        setRemoteUser(null);
        pendingOffer.current = null;
        pendingCandidates.current = [];
    };

    const toggleVideo = () => {
        if (localStream) {
            localStream.getVideoTracks().forEach(t => t.enabled = !localVideoEnabled);
            setLocalVideoEnabled(!localVideoEnabled);
        }
    };

    const toggleAudio = () => {
        if (localStream) {
            localStream.getAudioTracks().forEach(t => t.enabled = !localAudioEnabled);
            setLocalAudioEnabled(!localAudioEnabled);
        }
    };

    return (
        <CallContext.Provider value={{
            callStatus, callType, incomingCall, remoteUser,
            localStream, remoteStream, localVideoEnabled, localAudioEnabled,
            startCall, acceptCall, rejectCall, endCall, toggleVideo, toggleAudio,
            setIncomingCall, updateCallStatus, setCallType
        }}>
            {children}
        </CallContext.Provider>
    );
};

export const useCall = () => useContext(CallContext);
export default CallContext;
