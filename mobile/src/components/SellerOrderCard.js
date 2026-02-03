import React, { useState, memo } from 'react';
import { StyleSheet, Text, View, TouchableOpacity, LayoutAnimation, Platform, UIManager } from 'react-native';
import { User, MapPin, Wallet, ShoppingBag, ChevronDown, X, ArrowRight } from 'lucide-react-native';

if (Platform.OS === 'android') {
    if (UIManager.setLayoutAnimationEnabledExperimental) {
        UIManager.setLayoutAnimationEnabledExperimental(true);
    }
}

const SellerOrderCard = ({ order, onAccept, onReject }) => {
    const [isExpanded, setIsExpanded] = useState(false);

    const formatCurrency = (val) => {
        return new Intl.NumberFormat('id-ID', { style: 'currency', currency: 'IDR', minimumFractionDigits: 0 }).format(val);
    };

    const parsedItems = typeof order.items === 'string' ? JSON.parse(order.items) : (order.items || []);
    const totalQty = parsedItems.reduce((acc, item) => acc + (item.quantity || 0), 0);

    const toggleExpand = () => {
        LayoutAnimation.configureNext(LayoutAnimation.Presets.easeInEaseOut);
        setIsExpanded(!isExpanded);
    };

    return (
        <View style={styles.card}>
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
                            <Text style={styles.infoText}>{order.customer_address || 'Ambil di Toko'}</Text>
                        </View>
                        <View style={styles.infoLine}>
                            <Wallet size={10} color="#22C55E" />
                            <Text style={[styles.infoText, { color: '#22C55E' }]}>{order.payment_method || 'Tunai'}</Text>
                        </View>
                    </View>
                </View>

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
                {(onAccept && onReject) && (
                    <View style={styles.actions}>
                        <TouchableOpacity
                            onPress={onReject}
                            style={styles.rejectBtn}
                        >
                            <X size={20} color="#EF4444" strokeWidth={3} />
                        </TouchableOpacity>
                        <TouchableOpacity
                            onPress={onAccept}
                            style={styles.acceptBtn}
                        >
                            <Text style={styles.acceptBtnText}>Terima Sekarang</Text>
                            <ArrowRight size={18} color="#FFFFFF" />
                        </TouchableOpacity>
                    </View>
                )}
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
    }
});

export default memo(SellerOrderCard);
