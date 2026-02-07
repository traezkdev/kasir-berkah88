import React, { useState, memo } from 'react';
import { StyleSheet, Text, View, TouchableOpacity, LayoutAnimation, Platform, UIManager } from 'react-native';
import { User, MapPin, Wallet, ShoppingBag, ChevronDown, X, ArrowRight, MessageCircle, CheckCircle, Info, Banknote, QrCode, CreditCard } from 'lucide-react-native';
import { useNavigation } from '@react-navigation/native';
import { useChat } from '../context/ChatContext';
import { useConfirm } from '../context/ConfirmContext';

if (Platform.OS === 'android') {
    if (UIManager.setLayoutAnimationEnabledExperimental) {
        UIManager.setLayoutAnimationEnabledExperimental(true);
    }
}

const SellerOrderCard = ({ order, onAccept, onReject, onComplete, onViewDetail }) => {
    const [isExpanded, setIsExpanded] = useState(false);
    const navigation = useNavigation();
    const { setActiveChat, setActiveOrder } = useChat();
    const { confirm } = useConfirm();

    const handleAccept = async () => {
        const ok = await confirm({
            title: 'Terima Pesanan',
            message: `Apakah Anda yakin ingin menerima pesanan #${order.id}?`,
            confirmText: 'Terima Sekarang',
            type: 'primary'
        });
        if (ok && onAccept) onAccept(order.id);
    };

    const handleReject = async () => {
        const ok = await confirm({
            title: 'Tolak Pesanan',
            message: `Apakah Anda yakin ingin menolak pesanan #${order.id}? Tindakan ini tidak dapat dibatalkan.`,
            confirmText: 'Ya, Tolak',
            type: 'danger'
        });
        if (ok && onReject) onReject(order.id);
    };

    const handleComplete = async () => {
        const ok = await confirm({
            title: 'Selesaikan Pesanan',
            message: `Apakah pesanan #${order.id} sudah benar-benar selesai?`,
            confirmText: 'Ya, Selesai',
            type: 'primary'
        });
        if (ok && onComplete) onComplete(order.id);
    };

    const handleChatCustomer = () => {
        setActiveChat({
            user_id: order.user_id,
            username: order.customer_name,
            avatar_url: null // Bisa ditambahkan jika ada di order
        });
        setActiveOrder(order);
        navigation.navigate('ChatScreen');
    };

    const handleViewDetail = () => {
        if (onViewDetail) {
            onViewDetail(order);
        }
    };

    const formatCurrency = (val) => {
        return new Intl.NumberFormat('id-ID', { style: 'currency', currency: 'IDR', minimumFractionDigits: 0 }).format(val);
    };

    const parsedItems = typeof order.items === 'string' ? JSON.parse(order.items) : (order.items || []);
    const totalQty = parsedItems.reduce((acc, item) => acc + (item.quantity || item.qty || 0), 0);

    const toggleExpand = () => {
        LayoutAnimation.configureNext(LayoutAnimation.Presets.easeInEaseOut);
        setIsExpanded(!isExpanded);
    };

    const getMethodIcon = () => {
        const method = (order.payment_method || '').toLowerCase();
        if (method.includes('transfer')) return <Wallet size={120} color="#3B82F6" />;
        if (method.includes('cash') || method.includes('tunai')) return <Banknote size={120} color="#22C55E" />;
        if (method.includes('qris')) return <QrCode size={120} color="#3B82F6" />;
        return <CreditCard size={120} color="#3B82F6" />;
    };

    return (
        <View style={styles.card}>
            {/* Background Icon */}
            <View style={styles.cardBgIcon}>
                {getMethodIcon()}
            </View>
            {/* Top Info Bar */}
            <View style={styles.topBar}>
                <View style={styles.orderIdGroup}>
                    <View style={styles.pulseDot} />
                    <Text style={styles.orderIdText}>PESANAN #{order.id}</Text>
                </View>
                <Text style={styles.timeText}>
                    {new Date(order.created_at).toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit' })}
                </Text>
            </View>

            <View style={styles.content}>
                {/* Customer Section */}
                <View style={styles.customerRow}>
                    <View style={styles.avatar}>
                        <User size={20} color="#FFFFFF" strokeWidth={2.5} />
                    </View>
                    <View style={styles.customerInfo}>
                        <Text style={styles.customerName}>{order.customer_name}</Text>
                        <View style={styles.infoLine}>
                            <MapPin size={10} color="#94A3B8" />
                            <Text style={styles.infoText} numberOfLines={1}>{order.customer_address || 'Alamat Pelanggan'}</Text>
                        </View>
                        <View style={styles.infoLine}>
                            <Wallet size={10} color="#22C55E" />
                            <Text style={[styles.infoText, { color: '#22C55E' }]}>{order.payment_method || 'Tunai'}</Text>
                        </View>
                    </View>

                    <View style={styles.customerActions}>
                        <TouchableOpacity
                            style={styles.detailBtn}
                            onPress={handleViewDetail}
                        >
                            <Info size={20} color="#64748B" />
                        </TouchableOpacity>
                        <TouchableOpacity
                            style={styles.chatCustomerBtn}
                            onPress={handleChatCustomer}
                        >
                            <MessageCircle size={20} color="#138FEA" />
                        </TouchableOpacity>
                    </View>
                </View>

                {/* Order Note */}
                {order.note && (
                    <View style={styles.noteContainer}>
                        <Info size={16} color="#F59E0B" />
                        <Text style={styles.noteText}>"{order.note}"</Text>
                    </View>
                )}


                {/* Items Summary Toggle */}
                <TouchableOpacity
                    onPress={toggleExpand}
                    style={styles.expandButton}
                    activeOpacity={0.7}
                >
                    <View style={styles.bagIconContainer}>
                        <ShoppingBag size={16} color="#1E40AF" />
                    </View>
                    <View style={styles.summaryTextContainer}>
                        <Text style={styles.summaryLabel}>PESANAN</Text>
                        <Text style={styles.summaryValue}>{totalQty} Item • {formatCurrency(order.total)}</Text>
                    </View>
                    <ChevronDown
                        size={18}
                        color="#94A3B8"
                        style={{ transform: [{ rotate: isExpanded ? '180deg' : '0deg' }] }}
                    />
                </TouchableOpacity>

                {/* Expanded Details */}
                {isExpanded && (
                    <View style={styles.expandedContent}>
                        {parsedItems.map((item, idx) => (
                            <View key={idx} style={styles.itemRow}>
                                <View style={styles.itemNameGroup}>
                                    <View style={styles.qtyBadge}>
                                        <Text style={styles.qtyText}>{item.quantity}x</Text>
                                    </View>
                                    <Text style={styles.itemName}>{item.name}</Text>
                                </View>
                                <Text style={styles.itemSubtotal}>{formatCurrency(item.price * item.quantity)}</Text>
                            </View>
                        ))}
                    </View>
                )}

                {/* Actions */}
                {/* Actions */}
                <View style={styles.actions}>
                    {onReject && (
                        <TouchableOpacity
                            onPress={handleReject}
                            style={styles.rejectBtn}
                        >
                            <X size={20} color="#EF4444" strokeWidth={3} />
                        </TouchableOpacity>
                    )}

                    {onAccept && (
                        <TouchableOpacity
                            onPress={handleAccept}
                            style={styles.acceptBtn}
                        >
                            <Text style={styles.acceptBtnText}>Terima Sekarang</Text>
                            <ArrowRight size={18} color="#FFFFFF" />
                        </TouchableOpacity>
                    )}

                    {onComplete && (
                        <TouchableOpacity
                            onPress={handleComplete}
                            style={styles.acceptBtn} // Reusing accept button style for primary action
                        >
                            <Text style={styles.acceptBtnText}>Selesaikan Pesanan</Text>
                            <CheckCircle size={18} color="#FFFFFF" />
                        </TouchableOpacity>
                    )}
                </View>
            </View>
        </View>
    );
};

const styles = StyleSheet.create({
    card: {
        backgroundColor: '#FFFFFF',
        borderRadius: 24,
        borderWidth: 1,
        borderColor: '#F1F5F9',
        overflow: 'hidden',
        marginBottom: 16,
        ...Platform.select({
            web: { boxShadow: '0px 4px 12px rgba(0,0,0,0.05)' },
            android: { elevation: 3 }
        })
    },
    cardBgIcon: {
        position: 'absolute',
        right: -20,
        top: -20,
        opacity: 0.08,
        transform: [{ rotate: '-15deg' }],
        zIndex: 0,
    },
    topBar: {
        backgroundColor: '#F1F5F9',
        paddingHorizontal: 16,
        paddingVertical: 10,
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
    },
    orderIdGroup: {
        flexDirection: 'row',
        alignItems: 'center',
    },
    pulseDot: {
        width: 6,
        height: 6,
        backgroundColor: '#3B82F6',
        borderRadius: 3,
        marginRight: 8,
    },
    orderIdText: {
        fontSize: 10,
        fontWeight: '900',
        color: '#1E40AF',
        letterSpacing: 1,
    },
    timeText: {
        fontSize: 10,
        fontWeight: 'bold',
        color: '#94A3B8',
    },
    content: {
        padding: 16,
    },
    customerRow: {
        flexDirection: 'row',
        alignItems: 'center',
        marginBottom: 16,
    },
    avatar: {
        width: 44,
        height: 44,
        backgroundColor: '#3B82F6',
        borderRadius: 14,
        justifyContent: 'center',
        alignItems: 'center',
    },
    customerInfo: {
        marginLeft: 12,
        flex: 1,
        paddingRight: 10, // Safe gap so text doesn't touch buttons
    },
    customerName: {
        fontSize: 16,
        fontWeight: '900',
        color: '#1E293B',
    },
    infoLine: {
        flexDirection: 'row',
        alignItems: 'center',
        marginTop: 2,
    },
    infoText: {
        fontSize: 11,
        fontWeight: 'bold',
        color: '#94A3B8',
        marginLeft: 4,
        flex: 1, // Ensure text stays within bounds
    },
    expandButton: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: '#F8FAFC',
        padding: 12,
        borderRadius: 16,
        marginBottom: 4,
    },
    bagIconContainer: {
        backgroundColor: '#FFFFFF',
        padding: 8,
        borderRadius: 10,
        ...Platform.select({
            web: { boxShadow: '0px 2px 4px rgba(0,0,0,0.05)' },
            android: { elevation: 1 }
        })
    },
    summaryTextContainer: {
        flex: 1,
        marginLeft: 12,
    },
    summaryLabel: {
        fontSize: 10,
        fontWeight: '900',
        color: '#94A3B8',
        letterSpacing: 0.5,
    },
    summaryValue: {
        fontSize: 12,
        fontWeight: 'bold',
        color: '#334155',
    },
    expandedContent: {
        borderTopWidth: 1,
        borderStyle: 'dashed',
        borderColor: '#E2E8F0',
        paddingTop: 12,
        marginTop: 8,
        marginBottom: 12,
    },
    itemRow: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: 8,
    },
    itemNameGroup: {
        flexDirection: 'row',
        alignItems: 'center',
        flex: 1,
    },
    qtyBadge: {
        backgroundColor: '#EFF6FF',
        paddingHorizontal: 6,
        paddingVertical: 2,
        borderRadius: 6,
        marginRight: 10,
    },
    qtyText: {
        fontSize: 10,
        fontWeight: '900',
        color: '#1E40AF',
    },
    itemName: {
        fontSize: 12,
        fontWeight: 'bold',
        color: '#475569',
    },
    itemSubtotal: {
        fontSize: 12,
        fontWeight: '900',
        color: '#1E293B',
    },
    actions: {
        flexDirection: 'row',
        gap: 12,
        marginTop: 8,
    },
    rejectBtn: {
        width: 52,
        height: 52,
        backgroundColor: '#FEF2F2',
        borderRadius: 16,
        justifyContent: 'center',
        alignItems: 'center',
    },
    acceptBtn: {
        flex: 1,
        height: 52,
        backgroundColor: '#1E40AF',
        borderRadius: 16,
        flexDirection: 'row',
        justifyContent: 'center',
        alignItems: 'center',
        gap: 8,
    },
    acceptBtnText: {
        color: '#FFFFFF',
        fontSize: 14,
        fontWeight: '900',
    },
    chatCustomerBtn: {
        width: 40,
        height: 40,
        backgroundColor: '#F0F9FF',
        borderRadius: 12,
        justifyContent: 'center',
        alignItems: 'center',
        borderWidth: 1,
        borderColor: '#E0F2FE',
    },
    customerActions: {
        flexDirection: 'row',
        gap: 8,
    },
    detailBtn: {
        width: 40,
        height: 40,
        backgroundColor: '#F8FAFC',
        borderRadius: 12,
        justifyContent: 'center',
        alignItems: 'center',
        borderWidth: 1,
        borderColor: '#E2E8F0',
    },
    noteContainer: {
        backgroundColor: '#FFFBEB',
        padding: 12,
        borderRadius: 12,
        marginBottom: 16,
        flexDirection: 'row',
        gap: 10,
        alignItems: 'center',
        borderWidth: 1,
        borderColor: '#FEF3C7',
    },
    noteText: {
        fontSize: 13,
        color: '#B45309',
        flex: 1,
        fontStyle: 'italic',
        fontWeight: '500',
    }
});

export default memo(SellerOrderCard);
