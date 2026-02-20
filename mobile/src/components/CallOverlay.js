import React from 'react';
import {
    StyleSheet,
    View,
    Text,
    TouchableOpacity,
    Modal,
    Platform,
    SafeAreaView,
    Dimensions
} from 'react-native';
import { Phone, PhoneOff, Video, VideoOff, Mic, MicOff, Camera } from 'lucide-react-native';
import { useCall } from '../context/CallContext';

// Import RTCView hanya untuk HP
let RTCView;
if (Platform.OS !== 'web') {
    try {
        RTCView = require('react-native-webrtc').RTCView;
    } catch (e) {
        RTCView = View; // Fallback
    }
} else {
    // Di Web kita bisa pakai tag <video> standar, namun RTCView dari react-native-webrtc 
    // biasanya tidak dibutuhkan. Kita handle manual di render.
    RTCView = View;
}

const { width, height } = Dimensions.get('window');

const CallOverlay = () => {
    const {
        callStatus,
        callType,
        incomingCall,
        remoteUser,
        localStream,
        remoteStream,
        localVideoEnabled,
        localAudioEnabled,
        acceptCall,
        rejectCall,
        endCall,
        toggleVideo,
        toggleAudio
    } = useCall();

    const renderVideo = (stream, isLocal = false) => {
        if (!stream) return null;

        if (Platform.OS === 'web') {
            return (
                <video
                    autoPlay
                    playsInline
                    muted={isLocal}
                    ref={(el) => {
                        if (el && el.srcObject !== stream) {
                            el.srcObject = stream;
                        }
                    }}
                    style={{
                        width: '100%',
                        height: '100%',
                        objectFit: 'cover',
                        transform: 'scaleX(-1)'
                    }}
                />
            );
        }

        return (
            <RTCView
                streamURL={stream.toURL()}
                style={isLocal ? styles.localVideo : styles.remoteVideo}
                objectFit="cover"
                zOrder={isLocal ? 1 : 0}
                mirror={true}
            />
        );
    };

    if (callStatus === 'idle') return null;

    // --- PANGGILAN MASUK ---
    if (callStatus === 'ringing' && incomingCall) {
        return (
            <Modal transparent animationType="slide" visible={true}>
                <View style={styles.incomingContainer}>
                    <View style={styles.incomingCard}>
                        <View style={styles.avatarLarge}>
                            <Phone size={40} color="#FFFFFF" strokeWidth={1.5} />
                        </View>
                        <Text style={styles.callerName}>{incomingCall.callerName}</Text>
                        <Text style={styles.callTypeLabel}>
                            Memanggil via {incomingCall.type === 'video' ? 'Video' : 'Suara'}...
                        </Text>

                        <View style={styles.actionRow}>
                            <TouchableOpacity
                                style={[styles.circleBtn, styles.rejectBtn]}
                                onPress={rejectCall}
                            >
                                <PhoneOff size={28} color="#FFFFFF" />
                            </TouchableOpacity>

                            <TouchableOpacity
                                style={[styles.circleBtn, styles.acceptBtn]}
                                onPress={acceptCall}
                            >
                                {incomingCall.type === 'video' ? (
                                    <Video size={28} color="#FFFFFF" />
                                ) : (
                                    <Phone size={28} color="#FFFFFF" />
                                )}
                            </TouchableOpacity>
                        </View>
                    </View>
                </View>
            </Modal>
        );
    }

    // --- SEDANG MENELPON / RINGING OUT ---
    return (
        <Modal transparent={false} animationType="fade" visible={true}>
            <SafeAreaView style={styles.activeContainer}>
                {/* VIDEO VIEW AREA */}
                <View style={styles.videoContainer}>
                    {callType === 'video' ? (
                        <>
                            {/* Remote Video (Layar Penuh) */}
                            {remoteStream ? (
                                renderVideo(remoteStream, false)
                            ) : (
                                <View style={styles.remotePlaceholder}>
                                    <Text style={styles.waitingText}>Menghubungkan Video...</Text>
                                </View>
                            )}

                            {/* Local Video (Jendela Kecil / PiP) */}
                            {localStream && localVideoEnabled && (
                                <View style={styles.localVideoWrapper}>
                                    {renderVideo(localStream, true)}
                                </View>
                            )}
                        </>
                    ) : (
                        /* Voice Call Placeholder */
                        <View style={styles.voicePlaceholder}>
                            <View style={styles.avatarLargeActive}>
                                <Text style={styles.avatarInitial}>
                                    {remoteUser?.username?.charAt(0).toUpperCase() || 'U'}
                                </Text>
                            </View>
                            <Text style={styles.activeName}>{remoteUser?.username || 'User'}</Text>
                            <Text style={styles.voiceCallLabel}>
                                {callStatus === 'connected' ? 'Terhubung' : 'Memanggil...'}
                            </Text>
                        </View>
                    )}
                </View>

                {/* Header Info (Hanya jika video aktif) */}
                {callType === 'video' && (
                    <View style={styles.videoOverlayHeader}>
                        <Text style={styles.videoActiveName}>{remoteUser?.username || 'User'}</Text>
                        <Text style={styles.videoTimer}>{callStatus === 'connected' ? 'Terhubung' : 'Menghubungkan...'}</Text>
                    </View>
                )}

                {/* Controls Bar */}
                <View style={styles.controlsBar}>
                    <TouchableOpacity
                        style={[styles.smallBtn, !localAudioEnabled && styles.disabledBtnBg]}
                        onPress={toggleAudio}
                    >
                        {localAudioEnabled ? <Mic size={24} color="#FFFFFF" /> : <MicOff size={24} color="#FFFFFF" />}
                    </TouchableOpacity>

                    {callType === 'video' && (
                        <TouchableOpacity
                            style={[styles.smallBtn, !localVideoEnabled && styles.disabledBtnBg]}
                            onPress={toggleVideo}
                        >
                            {localVideoEnabled ? <Video size={24} color="#FFFFFF" /> : <VideoOff size={24} color="#FFFFFF" />}
                        </TouchableOpacity>
                    )}

                    <TouchableOpacity
                        style={[styles.circleBtn, styles.rejectBtn, styles.endCallBtnShadow]}
                        onPress={endCall}
                    >
                        <PhoneOff size={30} color="#FFFFFF" />
                    </TouchableOpacity>
                </View>
            </SafeAreaView>
        </Modal>
    );
};

const styles = StyleSheet.create({
    incomingContainer: {
        flex: 1,
        backgroundColor: 'rgba(15, 23, 42, 0.95)',
        justifyContent: 'center',
        alignItems: 'center',
    },
    incomingCard: {
        width: '85%',
        alignItems: 'center',
        padding: 30,
        backgroundColor: 'rgba(30, 41, 59, 0.5)',
        borderRadius: 40,
        borderWidth: 1,
        borderColor: 'rgba(255,255,255,0.1)',
    },
    avatarLarge: {
        width: 100,
        height: 100,
        borderRadius: 50,
        backgroundColor: '#138FEA',
        justifyContent: 'center',
        alignItems: 'center',
        marginBottom: 20,
        shadowColor: '#138FEA',
        shadowOffset: { width: 0, height: 10 },
        shadowOpacity: 0.5,
        shadowRadius: 15,
        elevation: 15,
    },
    callerName: {
        fontSize: 28,
        fontWeight: '900',
        color: '#FFFFFF',
        marginBottom: 8,
    },
    callTypeLabel: {
        fontSize: 16,
        color: '#94A3B8',
        fontWeight: '600',
        marginBottom: 40,
    },
    actionRow: {
        flexDirection: 'row',
        gap: 40,
    },
    circleBtn: {
        width: 75,
        height: 75,
        borderRadius: 38,
        justifyContent: 'center',
        alignItems: 'center',
    },
    acceptBtn: {
        backgroundColor: '#10B981',
    },
    rejectBtn: {
        backgroundColor: '#EF4444',
    },
    activeContainer: {
        flex: 1,
        backgroundColor: '#0F172A',
    },
    videoContainer: {
        flex: 1,
        backgroundColor: '#000',
    },
    remoteVideo: {
        flex: 1,
    },
    remotePlaceholder: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
        backgroundColor: '#1E293B',
    },
    waitingText: {
        color: '#94A3B8',
        fontSize: 14,
        fontWeight: 'bold',
    },
    localVideoWrapper: {
        position: 'absolute',
        top: 60,
        right: 20,
        width: 120,
        height: 180,
        borderRadius: 20,
        overflow: 'hidden',
        borderWidth: 2,
        borderColor: 'rgba(255,255,255,0.3)',
        backgroundColor: '#000',
    },
    localVideo: {
        width: '100%',
        height: '100%',
    },
    voicePlaceholder: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
    },
    avatarLargeActive: {
        width: 150,
        height: 150,
        borderRadius: 75,
        backgroundColor: '#1E293B',
        justifyContent: 'center',
        alignItems: 'center',
        borderWidth: 4,
        borderColor: '#138FEA',
        marginBottom: 30,
    },
    avatarInitial: {
        fontSize: 60,
        color: '#FFFFFF',
        fontWeight: '900',
    },
    activeName: {
        color: '#FFFFFF',
        fontSize: 32,
        fontWeight: '900',
        marginBottom: 10,
    },
    voiceCallLabel: {
        color: '#138FEA',
        fontSize: 16,
        fontWeight: '800',
        textTransform: 'uppercase',
        letterSpacing: 2,
    },
    videoOverlayHeader: {
        position: 'absolute',
        top: 60,
        left: 20,
    },
    videoActiveName: {
        color: '#FFFFFF',
        fontSize: 24,
        fontWeight: '900',
        textShadowColor: 'rgba(0,0,0,0.5)',
        textShadowOffset: { width: 0, height: 2 },
        textShadowRadius: 4,
    },
    videoTimer: {
        color: '#10B981',
        fontSize: 14,
        fontWeight: '800',
    },
    controlsBar: {
        position: 'absolute',
        bottom: 50,
        left: 0,
        right: 0,
        flexDirection: 'row',
        justifyContent: 'space-evenly',
        alignItems: 'center',
        paddingHorizontal: 20,
    },
    smallBtn: {
        width: 60,
        height: 60,
        borderRadius: 30,
        backgroundColor: 'rgba(255,255,255,0.15)',
        justifyContent: 'center',
        alignItems: 'center',
        borderWidth: 1,
        borderColor: 'rgba(255,255,255,0.1)',
    },
    disabledBtnBg: {
        backgroundColor: '#EF4444',
    },
    endCallBtnShadow: {
        width: 80,
        height: 80,
        borderRadius: 40,
        shadowColor: '#EF4444',
        shadowOffset: { width: 0, height: 5 },
        shadowOpacity: 0.5,
        shadowRadius: 10,
        elevation: 10,
    }
});

export default CallOverlay;
