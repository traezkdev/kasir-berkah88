import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Image, SafeAreaView, Platform } from 'react-native';
import { PhoneOff, Mic, MicOff, Video, VideoOff, Camera, PhoneIncoming, Maximize2, RefreshCw } from 'lucide-react-native';
import { useCall } from '../context/CallContext';
import { scale, verticalScale, moderateScale } from '../utils/responsive';
import { LinearGradient } from 'expo-linear-gradient';

// Kondisional Import RTCView agar tidak error di Web
let RTCView = null;
if (Platform.OS !== 'web') {
    RTCView = require('react-native-webrtc').RTCView;
}

const VideoView = ({ stream, style, objectFit, muted }) => {
    const videoRef = React.useRef(null);

    React.useEffect(() => {
        if (Platform.OS === 'web' && videoRef.current && stream) {
            videoRef.current.srcObject = stream;
        }
    }, [stream]);

    if (Platform.OS === 'web') {
        return (
            <View style={[style, { backgroundColor: '#000' }]}>
                <video
                    ref={videoRef}
                    autoPlay
                    playsInline
                    muted={muted}
                    style={{
                        width: '100%',
                        height: '100%',
                        objectFit: objectFit === 'cover' ? 'cover' : 'contain',
                        transform: [{ scaleX: -1 }] // Efek kaca (mirror) di Web
                    }}
                />
            </View>
        );
    }

    if (!RTCView || !stream) return <View style={style} />;

    return (
        <RTCView
            streamURL={stream.toURL()}
            style={style}
            objectFit={objectFit}
            mirror={true} // Mengikuti sistem kasir: mirror true untuk semua aliran di Native
            zOrder={muted ? 1 : 0}
        />
    );
};

const InCallScreen = () => {
    const {
        localStream,
        remoteStream,
        isCalling,
        incomingCall,
        isInCall,
        callType,
        otherUserName,
        otherUserAvatar,
        callDuration,
        answerCall,
        rejectCall,
        endCall,
        switchCamera
    } = useCall();

    const [isMuted, setIsMuted] = React.useState(false);
    const [isVideoEnabled, setIsVideoEnabled] = React.useState(true);

    const toggleMute = () => {
        if (localStream) {
            localStream.getAudioTracks().forEach(track => {
                track.enabled = !track.enabled;
            });
            setIsMuted(!isMuted);
        }
    };

    const toggleVideo = () => {
        if (localStream) {
            localStream.getVideoTracks().forEach(track => {
                track.enabled = !track.enabled;
            });
            setIsVideoEnabled(!isVideoEnabled);
        }
    };

    const formatDuration = (seconds) => {
        const mins = Math.floor(seconds / 60);
        const secs = seconds % 60;
        return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
    };

    if (incomingCall) {
        return (
            <SafeAreaView style={styles.incomingContainer}>
                <LinearGradient colors={['#1F2937', '#111827']} style={styles.gradient}>
                    <View style={styles.callerInfo}>
                        <Image
                            source={{ uri: (incomingCall.callerAvatar) ? incomingCall.callerAvatar : 'https://ui-avatars.com/api/?name=' + (incomingCall.callerName || 'User') }}
                            style={styles.incomingAvatar}
                        />
                        <Text style={styles.incomingName}>{incomingCall.callerName || 'Seseorang'}</Text>
                        <Text style={styles.incomingStatus}>Panggilan {incomingCall.type === 'video' ? 'Video' : 'Suara'} Masuk</Text>
                    </View>

                    <View style={styles.incomingActions}>
                        <TouchableOpacity style={[styles.actionBtn, styles.declineBtn]} onPress={rejectCall}>
                            <PhoneOff color="#fff" size={30} />
                        </TouchableOpacity>
                        <TouchableOpacity style={[styles.actionBtn, styles.acceptBtn]} onPress={answerCall}>
                            <PhoneIncoming color="#fff" size={30} />
                        </TouchableOpacity>
                    </View>
                </LinearGradient>
            </SafeAreaView>
        );
    }

    if (!isCalling && !isInCall) return null;

    return (
        <SafeAreaView style={styles.container}>
            {callType === 'video' ? (
                <View style={styles.videoContainer}>
                    {remoteStream && (
                        <VideoView
                            stream={remoteStream}
                            style={styles.remoteVideo}
                            objectFit="cover"
                            muted={false}
                        />
                    )}
                    {localStream && isVideoEnabled && (
                        <View style={styles.localVideoContainer}>
                            <VideoView
                                stream={localStream}
                                style={styles.localVideo}
                                objectFit="cover"
                                muted={true}
                            />
                        </View>
                    )}

                    <LinearGradient colors={['rgba(0,0,0,0.6)', 'transparent']} style={styles.videoTop}>
                        <Text style={styles.videoName}>{otherUserName || 'Seseorang'}</Text>
                        <Text style={styles.videoStatus}>
                            {isInCall ? formatDuration(callDuration) : 'Memanggil...'}
                        </Text>
                    </LinearGradient>
                </View>
            ) : (
                <View style={styles.audioContainer}>
                    <LinearGradient colors={['#1F2937', '#111827']} style={styles.gradient}>
                        <View style={styles.audioInfo}>
                            <Image
                                source={{ uri: (otherUserAvatar) ? otherUserAvatar : 'https://ui-avatars.com/api/?name=' + (otherUserName || 'User') }}
                                style={styles.audioAvatar}
                            />
                            <Text style={styles.audioName}>{otherUserName || 'Seseorang'}</Text>
                            <Text style={styles.audioStatus}>
                                {isInCall ? formatDuration(callDuration) : (isCalling ? 'Dering...' : 'Menghubungkan...')}
                            </Text>
                        </View>
                    </LinearGradient>
                </View>
            )}

            <View style={styles.controls}>
                <TouchableOpacity style={styles.controlBtn} onPress={toggleMute}>
                    {isMuted ? <MicOff color="#fff" size={24} /> : <Mic color="#fff" size={24} />}
                </TouchableOpacity>

                {callType === 'video' && (
                    <>
                        <TouchableOpacity style={styles.controlBtn} onPress={toggleVideo}>
                            {isVideoEnabled ? <Video color="#fff" size={24} /> : <VideoOff color="#fff" size={24} />}
                        </TouchableOpacity>
                        <TouchableOpacity style={styles.controlBtn} onPress={switchCamera}>
                            <Camera color="#fff" size={24} />
                        </TouchableOpacity>
                    </>
                )}

                <TouchableOpacity style={[styles.controlBtn, styles.endCallBtn]} onPress={endCall}>
                    <PhoneOff color="#fff" size={24} />
                </TouchableOpacity>
            </View>
        </SafeAreaView>
    );
};

const styles = StyleSheet.create({
    container: {
        ...StyleSheet.absoluteFillObject,
        backgroundColor: '#000',
        zIndex: 1000,
    },
    incomingContainer: {
        ...StyleSheet.absoluteFillObject,
        backgroundColor: '#111',
        zIndex: 2000,
    },
    gradient: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
    },
    callerInfo: {
        alignItems: 'center',
        marginBottom: verticalScale(100),
    },
    incomingAvatar: {
        width: scale(120),
        height: scale(120),
        borderRadius: scale(60),
        marginBottom: verticalScale(20),
        borderWidth: 2,
        borderColor: '#00A884',
    },
    incomingName: {
        fontSize: moderateScale(28),
        color: '#fff',
        fontWeight: 'bold',
    },
    incomingStatus: {
        fontSize: moderateScale(18),
        color: '#9CA3AF',
        marginTop: verticalScale(10),
    },
    incomingActions: {
        flexDirection: 'row',
        width: '100%',
        justifyContent: 'space-around',
        paddingHorizontal: scale(50),
    },
    actionBtn: {
        width: scale(70),
        height: scale(70),
        borderRadius: scale(35),
        justifyContent: 'center',
        alignItems: 'center',
        elevation: 5,
    },
    declineBtn: {
        backgroundColor: '#EF4444',
    },
    acceptBtn: {
        backgroundColor: '#10B981',
    },
    videoContainer: {
        flex: 1,
        backgroundColor: '#000',
    },
    remoteVideo: {
        flex: 1,
    },
    localVideoContainer: {
        position: 'absolute',
        top: 50,
        right: 20,
        width: scale(100),
        height: verticalScale(150),
        borderRadius: 10,
        overflow: 'hidden',
        borderWidth: 2,
        borderColor: '#fff',
    },
    localVideo: {
        flex: 1,
    },
    videoTop: {
        position: 'absolute',
        top: 0,
        left: 0,
        right: 0,
        paddingTop: verticalScale(50),
        paddingHorizontal: scale(20),
        height: verticalScale(150),
    },
    videoName: {
        color: '#fff',
        fontSize: moderateScale(20),
        fontWeight: '600',
    },
    audioContainer: {
        flex: 1,
    },
    audioInfo: {
        alignItems: 'center',
    },
    audioAvatar: {
        width: scale(150),
        height: scale(150),
        borderRadius: scale(75),
        marginBottom: verticalScale(30),
    },
    audioName: {
        fontSize: moderateScale(32),
        color: '#fff',
        fontWeight: 'bold',
    },
    audioStatus: {
        fontSize: moderateScale(20),
        color: '#9CA3AF',
        marginTop: verticalScale(10),
    },
    controls: {
        position: 'absolute',
        bottom: verticalScale(50),
        left: 0,
        right: 0,
        flexDirection: 'row',
        justifyContent: 'space-around',
        alignItems: 'center',
        paddingHorizontal: scale(30),
    },
    controlBtn: {
        width: scale(55),
        height: scale(55),
        borderRadius: scale(27.5),
        backgroundColor: 'rgba(255,255,255,0.2)',
        justifyContent: 'center',
        alignItems: 'center',
    },
    endCallBtn: {
        backgroundColor: '#EF4444',
        width: scale(65),
        height: scale(65),
        borderRadius: scale(32.5),
    }
});

export default InCallScreen;
