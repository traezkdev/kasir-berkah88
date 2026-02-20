import React, { useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { FiPhone, FiPhoneOff, FiVideo, FiMic, FiMicOff, FiCamera, FiX } from 'react-icons/fi';
import { useCall } from '../../contexts/CallContext';

const CallOverlay = () => {
    const {
        callStatus,
        callType,
        incomingCall,
        remoteUser,
        localStream,
        remoteStream,
        acceptCall,
        rejectCall,
        endCall
    } = useCall();

    const localVideoRef = useRef(null);
    const remoteVideoRef = useRef(null);

    useEffect(() => {
        if (localStream && localVideoRef.current) {
            localVideoRef.current.srcObject = localStream;
        }
    }, [localStream, callStatus]);

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
                        className="relative w-full h-full md:w-[900px] md:h-[600px] bg-gray-900 md:rounded-[40px] overflow-hidden flex flex-col"
                    >
                        {/* Video Display Area */}
                        <div className="flex-1 relative bg-black">
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
                                        <div className="w-full h-full flex flex-col items-center justify-center">
                                            <div className="w-24 h-24 bg-gray-800 rounded-full flex items-center justify-center mb-4 animate-pulse">
                                                <FiUser size={40} className="text-gray-600" />
                                            </div>
                                            <p className="text-gray-500 font-bold uppercase tracking-widest text-xs">Menunggu user...</p>
                                        </div>
                                    )}

                                    {/* Local Mirror (Small Window) */}
                                    {localStream && (
                                        <div className="absolute top-6 right-6 w-40 h-56 bg-gray-800 rounded-3xl overflow-hidden border-2 border-white/10 shadow-2xl z-10">
                                            <video
                                                ref={localVideoRef}
                                                autoPlay
                                                playsInline
                                                muted
                                                className="w-full h-full object-cover scale-x-[-1]"
                                            />
                                        </div>
                                    )}
                                </>
                            ) : (
                                <div className="w-full h-full flex flex-col items-center justify-center bg-gradient-to-b from-gray-900 to-black">
                                    <div className="w-32 h-32 bg-gray-800 rounded-full flex items-center justify-center mb-6 border-4 border-blue-500 shadow-2xl">
                                        <h1 className="text-5xl font-black text-white">{remoteUser?.username?.charAt(0).toUpperCase()}</h1>
                                    </div>
                                    <h2 className="text-3xl font-black text-white mb-2">{remoteUser?.username}</h2>
                                    <p className="text-blue-500 font-black uppercase tracking-[0.2em] text-sm">{callStatus === 'connected' ? 'Panggilan Aktif' : 'Menghubungkan...'}</p>
                                </div>
                            )}
                        </div>

                        {/* Controls Bar */}
                        <div className="p-10 md:p-12 flex justify-center items-center gap-10 bg-gray-900/80 backdrop-blur-xl border-t border-white/5">
                            <button className="p-4 bg-gray-800 hover:bg-gray-700 text-white rounded-2xl transition-all"><FiMic size={24} /></button>
                            <button
                                onClick={endCall}
                                className="w-20 h-20 bg-red-500 hover:bg-red-600 text-white rounded-full flex items-center justify-center transition-all shadow-2xl shadow-red-500/40 hover:scale-110 active:scale-95"
                            >
                                <FiPhoneOff size={32} />
                            </button>
                            <button className="p-4 bg-gray-800 hover:bg-gray-700 text-white rounded-2xl transition-all"><FiCamera size={24} /></button>
                        </div>

                        {/* Top Info Overlay */}
                        <div className="absolute top-8 left-10 z-20">
                            <h3 className="text-white font-black text-xl drop-shadow-md">{remoteUser?.username}</h3>
                            <div className="flex items-center gap-2 mt-1">
                                <span className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></span>
                                <span className="text-green-500 text-xs font-black uppercase tracking-tighter">HD • {callType === 'video' ? 'Video' : 'Voice'}</span>
                            </div>
                        </div>
                    </motion.div>
                )}
            </motion.div>
        </AnimatePresence>
    );
};

export default CallOverlay;
