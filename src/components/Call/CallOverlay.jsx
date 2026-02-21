import React, { useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { FiPhone, FiPhoneOff, FiVideo, FiMic, FiMicOff, FiCamera, FiX, FiUser } from 'react-icons/fi';
import { useCall } from '../../contexts/CallContext';

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

    const localVideoRef = useRef(null);
    const remoteVideoRef = useRef(null);

    useEffect(() => {
        if (localStream && localVideoRef.current) {
            localVideoRef.current.srcObject = localStream;
        }
    }, [localStream, callStatus, localVideoEnabled]);

    useEffect(() => {
        if (remoteStream && remoteVideoRef.current) {
            remoteVideoRef.current.srcObject = remoteStream;
        }
    }, [remoteStream, callStatus]);

    if (callStatus === 'idle') return null;

    return (
        <AnimatePresence>
            <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                className="fixed inset-0 z-[9999] flex items-center justify-center bg-black/80 backdrop-blur-md"
            >
                {callStatus === 'ringing' && incomingCall ? (
                    <motion.div
                        initial={{ scale: 0.9, y: 20 }}
                        animate={{ scale: 1, y: 0 }}
                        className="bg-gray-900 border border-gray-800 p-8 rounded-[40px] text-center max-w-sm w-full mx-4"
                    >
                        <div className="w-24 h-24 bg-blue-500 rounded-full flex items-center justify-center mx-auto mb-6 shadow-xl shadow-blue-500/20">
                            <FiPhone size={40} className="text-white" />
                        </div>
                        <h2 className="text-2xl font-black text-white mb-2">{incomingCall.callerName}</h2>
                        <p className="text-gray-400 mb-8 font-medium">Memanggil {incomingCall.type === 'video' ? 'Video...' : 'Suara...'}</p>

                        <div className="flex justify-center gap-8">
                            <button
                                onClick={rejectCall}
                                className="w-16 h-16 bg-red-500 rounded-full flex items-center justify-center hover:bg-red-600 transition-colors shadow-lg shadow-red-500/20"
                            >
                                <FiPhoneOff size={24} className="text-white" />
                            </button>
                            <button
                                onClick={acceptCall}
                                className="w-16 h-16 bg-green-500 rounded-full flex items-center justify-center hover:bg-green-600 transition-colors shadow-lg shadow-green-500/20"
                            >
                                {incomingCall.type === 'video' ? <FiVideo size={24} className="text-white" /> : <FiPhone size={24} className="text-white" />}
                            </button>
                        </div>
                    </motion.div>
                ) : (
                    <motion.div
                        layout
                        className="relative w-full h-full md:w-[1000px] md:h-[650px] bg-slate-950 md:rounded-[3rem] overflow-hidden shadow-2xl flex flex-col border border-white/10"
                    >
                        {/* Main Video/Content Area (Background) */}
                        <div className="absolute inset-0 z-0 bg-slate-900">
                            {callType === 'video' ? (
                                <>
                                    {remoteStream ? (
                                        <video
                                            ref={remoteVideoRef}
                                            autoPlay
                                            playsInline
                                            className="w-full h-full object-cover"
                                        />
                                    ) : (
                                        <div className="w-full h-full flex flex-col items-center justify-center space-y-4">
                                            <div className="relative">
                                                <div className="w-24 h-24 bg-blue-500/20 rounded-full flex items-center justify-center border border-blue-500/30 animate-pulse">
                                                    <FiUser size={40} className="text-blue-400" />
                                                </div>
                                                <motion.div
                                                    animate={{ scale: [1, 1.2, 1], opacity: [0.3, 0.6, 0.3] }}
                                                    transition={{ repeat: Infinity, duration: 2 }}
                                                    className="absolute -inset-4 bg-blue-500/10 rounded-full -z-10"
                                                />
                                            </div>
                                            <p className="text-blue-400/60 font-black uppercase tracking-[0.3em] text-[10px]">Menunggu Koneksi...</p>
                                        </div>
                                    )}
                                </>
                            ) : (
                                <div className="w-full h-full flex flex-col items-center justify-center bg-[radial-gradient(circle_at_center,_var(--tw-gradient-stops))] from-slate-800 to-slate-950 text-center">
                                    <div className="relative mb-8">
                                        <div className="w-32 h-32 bg-slate-800 rounded-full flex items-center justify-center border-4 border-blue-500 shadow-[0_0_50px_-12px_rgba(59,130,246,0.5)]">
                                            <h1 className="text-5xl font-black text-white">{remoteUser?.username?.charAt(0).toUpperCase()}</h1>
                                        </div>
                                        {callStatus === 'connected' && (
                                            <div className="absolute -bottom-2 -right-2 w-8 h-8 bg-green-500 rounded-full border-4 border-slate-900 flex items-center justify-center">
                                                <div className="w-2 h-2 bg-white rounded-full animate-ping" />
                                            </div>
                                        )}
                                    </div>
                                    <h2 className="text-4xl font-black text-white mb-2 tracking-tight">{remoteUser?.username}</h2>
                                    <p className="text-blue-400 font-black uppercase tracking-[0.4em] text-xs opacity-70">
                                        {callStatus === 'connected' ? 'Panggilan Suara Aktif' : 'Menghubungkan...'}
                                    </p>
                                </div>
                            )}
                        </div>

                        {/* Top Info Overlay (Glassmorphism) */}
                        <div className="absolute top-8 left-8 z-30 pointer-events-none">
                            <div className="bg-slate-900/40 backdrop-blur-md border border-white/10 px-6 py-3 rounded-2xl">
                                <h3 className="text-white font-black text-lg">{remoteUser?.username}</h3>
                                <div className="flex items-center gap-2 mt-1">
                                    <span className={`w-2 h-2 ${callStatus === 'connected' ? 'bg-green-500 shadow-[0_0_10px_rgba(34,197,94,0.8)]' : 'bg-yellow-500'} rounded-full`}></span>
                                    <span className="text-white/60 text-[10px] font-black uppercase tracking-widest">
                                        {callStatus === 'connected' ? 'TERHUBUNG' : 'MENGHUBUNGKAN'} • {callType === 'video' ? 'VIDEO HD' : 'AUDIO'}
                                    </span>
                                </div>
                            </div>
                        </div>

                        {/* Local Mirror (Floating window) */}
                        {callType === 'video' && localStream && (
                            <div className="absolute top-8 right-8 w-40 h-56 bg-slate-900 rounded-[2rem] overflow-hidden border border-white/10 shadow-2xl z-20 group">
                                {localVideoEnabled ? (
                                    <video
                                        ref={localVideoRef}
                                        autoPlay
                                        playsInline
                                        muted
                                        className="w-full h-full object-cover scale-x-[-1]"
                                    />
                                ) : (
                                    <div className="w-full h-full flex items-center justify-center bg-slate-800">
                                        <FiUser size={32} className="text-slate-600" />
                                    </div>
                                )}
                                <div className="absolute inset-0 bg-black/20 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center bg-gradient-to-t from-black/60 to-transparent">
                                    <span className="text-[10px] text-white font-bold tracking-widest uppercase">Pratinjau</span>
                                </div>
                            </div>
                        )}

                        {/* Controls Bar (ABSOLUTE OVERLAY - Always on Top) */}
                        <div className="absolute bottom-10 left-1/2 -translate-x-1/2 z-40 w-full px-6 flex justify-center pointer-events-none">
                            <div className="flex justify-center items-center gap-6 bg-slate-900/60 backdrop-blur-2xl px-10 py-6 rounded-[2.5rem] border border-white/10 shadow-2xl pointer-events-auto">
                                <button
                                    onClick={toggleAudio}
                                    title={localAudioEnabled ? 'Mute Mic' : 'Unmute Mic'}
                                    className={`w-14 h-14 flex items-center justify-center ${localAudioEnabled ? 'bg-slate-800 hover:bg-slate-700' : 'bg-red-500 hover:bg-red-600 shadow-[0_0_20px_rgba(239,68,68,0.4)]'} text-white rounded-2xl transition-all active:scale-90`}
                                >
                                    {localAudioEnabled ? <FiMic size={22} /> : <FiMicOff size={22} />}
                                </button>

                                <button
                                    onClick={endCall}
                                    title="Akhiri Panggilan"
                                    className="w-20 h-20 bg-red-500 hover:bg-red-600 text-white rounded-[2rem] flex items-center justify-center transition-all shadow-xl shadow-red-500/40 hover:scale-110 active:scale-90"
                                >
                                    <FiPhoneOff size={32} />
                                </button>

                                {callType === 'video' && (
                                    <button
                                        onClick={toggleVideo}
                                        title={localVideoEnabled ? 'Matikan Kamera' : 'Nyalakan Kamera'}
                                        className={`w-14 h-14 flex items-center justify-center ${localVideoEnabled ? 'bg-slate-800 hover:bg-slate-700' : 'bg-red-500 hover:bg-red-600 shadow-[0_0_20px_rgba(239,68,68,0.4)]'} text-white rounded-2xl transition-all active:scale-90`}
                                    >
                                        <FiCamera size={22} />
                                    </button>
                                )}
                            </div>
                        </div>
                    </motion.div>
                )}
            </motion.div>
        </AnimatePresence>
    );
};

export default CallOverlay;

