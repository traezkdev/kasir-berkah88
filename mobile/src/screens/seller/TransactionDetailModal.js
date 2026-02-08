
import React, { useMemo, useCallback } from 'react';
import {
    StyleSheet,
    Text,
    View,
    FlatList,
    TouchableOpacity,
    Modal,
    StatusBar,
    Platform
} from 'react-native';
import {
    X,
    User,
    MessageSquare,
    RefreshCw,
    Download,
    ArrowRight,
    FileText,
    Trash2
} from 'lucide-react-native';

const TransactionDetailModal = ({
    visible,
    transaction,
    onClose,
    onEdit,
    onPrint,
    navigation,
    formatCurrency,
    formatDate,
    onDelete,
    isAdmin
}) => {

    const items = useMemo(() => transaction?.items || [], [transaction]);

    const renderHeader = useCallback(() => {
        if (!transaction) return null;

        return (
            <View style={styles.txInfoCard}>
                <View style={styles.txInfoRow}>
                    <Text style={styles.txInfoLabel}>Waktu</Text>
                    <Text style={styles.txInfoValue}>{formatDate(transaction.timestamp)}</Text>
                </View>
                <View style={styles.txInfoRow}>
                    <Text style={styles.txInfoLabel}>Metode Pembayaran</Text>
                    <Text style={[styles.txInfoValue, { color: '#1E40AF', fontWeight: '900' }]}>
                        {transaction.payment_method?.toLowerCase() === 'transfer' ? 'QRIS' : (transaction.payment_method || 'Tunai').toUpperCase()}
                    </Text>
                </View>

                {/* Customer Info Card */}
                {transaction.customer_name && (
                    <View style={styles.sectionCard}>
                        <View style={styles.sectionHeader}>
                            <User size={16} color="#1E40AF" />
                            <Text style={styles.sectionLabel}>INFORMASI PELANGGAN</Text>
                        </View>

                        <View style={styles.infoRow}>
                            <View style={{ flex: 1 }}>
                                <Text style={styles.infoName}>{transaction.customer_name}</Text>
                                <Text style={styles.infoPhone}>{transaction.customer_phone || '-'}</Text>
                            </View>
                            <TouchableOpacity
                                style={styles.viewProfileBtn}
                                onPress={() => {
                                    onClose(); // Close modal first
                                    navigation.navigate('CustomerDetails', {
                                        customerName: transaction.customer_name,
                                        customerPhone: transaction.customer_phone,
                                        customerAddress: transaction.customer_address
                                    });
                                }}
                            >
                                <Text style={styles.viewProfileText}>Profil</Text>
                                <ArrowRight size={12} color="#138FEA" />
                            </TouchableOpacity>
                        </View>
                    </View>
                )}

                {/* Transaction Note */}
                {(transaction.catatan || transaction.notes) && (
                    <View style={[styles.sectionCard, { backgroundColor: '#FFFBEB', borderColor: '#FEF3C7' }]}>
                        <View style={styles.sectionHeader}>
                            <MessageSquare size={16} color="#B45309" />
                            <Text style={[styles.sectionLabel, { color: '#B45309' }]}>CATATAN TRANSAKSI</Text>
                        </View>
                        <Text style={styles.noteText}>
                            "{transaction.catatan || transaction.notes}"
                        </Text>
                    </View>
                )}
            </View>
        );
    }, [transaction, formatDate, navigation, onClose]);

    const renderItem = useCallback(({ item }) => (
        <View style={styles.modalItemRow}>
            <View style={styles.modalItemLeft}>
                <View style={styles.modalQtyBadge}>
                    <Text style={styles.modalQtyText}>x{item.qty || item.quantity || 1}</Text>
                </View>
                <View style={{ flex: 1 }}>
                    <Text style={styles.modalItemName}>{item.name}</Text>
                    <Text style={styles.modalItemPrice}>@{formatCurrency(item.price)}</Text>
                </View>
            </View>
            <Text style={styles.modalItemSubtotal}>
                {formatCurrency(item.price * (item.qty || item.quantity || 1))}
            </Text>
        </View>
    ), [formatCurrency]);

    const keyExtractor = useCallback((item, index) => {
        return item.id ? item.id.toString() : index.toString();
    }, []);

    if (!transaction) return null;

    return (
        <Modal
            visible={visible}
            animationType="slide"
            transparent={false}
            onRequestClose={onClose}
        >
            <View style={styles.modalContent}>
                <StatusBar barStyle="dark-content" backgroundColor="#FFFFFF" />

                {/* Header */}
                <View style={styles.modalHeader}>
                    <View>
                        <Text style={styles.modalTitle}>Detail Transaksi</Text>
                        <Text style={styles.modalId}>#{transaction.id}</Text>
                    </View>
                    <TouchableOpacity onPress={onClose} style={styles.closeBtn}>
                        <X size={20} color="#94A3B8" />
                    </TouchableOpacity>
                </View>

                {/* Scrollable Content */}
                <View style={styles.modalScrollContainer}>
                    <FlatList
                        data={items}
                        keyExtractor={keyExtractor}
                        style={styles.modalScroll}
                        contentContainerStyle={styles.modalScrollContent}
                        showsVerticalScrollIndicator={false}
                        ListHeaderComponent={renderHeader}
                        renderItem={renderItem}
                        initialNumToRender={5}
                        maxToRenderPerBatch={5}
                        windowSize={5}
                        removeClippedSubviews={true}
                    />
                </View>

                {/* Footer */}
                <View style={styles.modalFooter}>
                    {/* Footer Breakdown */}
                    <View style={{ marginBottom: 15, gap: 4 }}>
                        {transaction.manual_discount > 0 && (
                            <View style={styles.infoRowMini}>
                                <Text style={styles.miniLabel}>Diskon Transaksi</Text>
                                <Text style={[styles.miniValue, { color: '#DC2626' }]}>-{formatCurrency(transaction.manual_discount)}</Text>
                            </View>
                        )}
                        {transaction.points_used > 0 && (
                            <View style={styles.infoRowMini}>
                                <Text style={styles.miniLabel}>Diskon Poin</Text>
                                <Text style={[styles.miniValue, { color: '#2563EB' }]}>-{formatCurrency(transaction.points_used)}</Text>
                            </View>
                        )}
                        {transaction.ppn > 0 && (
                            <View style={styles.infoRowMini}>
                                <Text style={styles.miniLabel}>PPN</Text>
                                <Text style={styles.miniValue}>{formatCurrency(transaction.ppn)}</Text>
                            </View>
                        )}
                    </View>

                    <View style={styles.totalRow}>
                        <Text style={styles.grandTotalLabel}>Total Bayar</Text>
                        <Text style={styles.grandTotalValue}>
                            {transaction ? formatCurrency(transaction.total) : '0'}
                        </Text>
                    </View>
                    <View style={styles.footerDivider} />
                    <View style={styles.modalActionButtons}>
                        <TouchableOpacity style={styles.editBtn} onPress={onEdit}>
                            <RefreshCw size={20} color="#1E40AF" />
                            <Text style={styles.editBtnText}>Edit Transaksi</Text>
                        </TouchableOpacity>
                        <TouchableOpacity style={styles.printBtn} onPress={onPrint}>
                            <FileText size={20} color="#FFFFFF" />
                            <Text style={styles.printBtnText}>Lihat Struk</Text>
                        </TouchableOpacity>
                    </View>
                    {isAdmin && (
                        <TouchableOpacity
                            style={[styles.editBtn, { marginTop: 12, backgroundColor: '#FEF2F2', borderColor: '#FECACA' }]}
                            onPress={onDelete}
                        >
                            <Trash2 size={20} color="#DC2626" />
                            <Text style={[styles.editBtnText, { color: '#DC2626' }]}>Hapus Transaksi</Text>
                        </TouchableOpacity>
                    )}
                </View>
            </View>
        </Modal>
    );
};

const styles = StyleSheet.create({
    modalContent: {
        backgroundColor: '#FFFFFF',
        flex: 1,
        width: '100%',
        flexDirection: 'column',
    },
    modalHeader: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        padding: 24,
        paddingTop: Platform.OS === 'android' ? (StatusBar.currentHeight || 0) + 15 : (Platform.OS === 'ios' ? 50 : 25),
        borderBottomWidth: 1,
        borderBottomColor: '#F1F5F9',
        backgroundColor: '#FFFFFF',
        zIndex: 10,
    },
    modalTitle: {
        fontSize: 20,
        fontWeight: '900',
        color: '#1E293B',
    },
    modalId: {
        fontSize: 12,
        fontWeight: 'bold',
        color: '#94A3B8',
        marginTop: 2,
    },
    closeBtn: {
        width: 44,
        height: 44,
        backgroundColor: '#F1F5F9',
        borderRadius: 22,
        justifyContent: 'center',
        alignItems: 'center',
    },
    modalScroll: {
        flex: 1,
        paddingHorizontal: 24,
    },
    modalScrollContainer: {
        flex: 1,
        backgroundColor: '#FFFFFF',
    },
    modalScrollContent: {
        paddingBottom: 40,
        flexGrow: 1,
    },
    txInfoCard: {
        backgroundColor: '#F8FAFC',
        padding: 16,
        borderRadius: 20,
        marginTop: 16,
        marginBottom: 24,
    },
    txInfoRow: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        marginBottom: 8,
    },
    txInfoLabel: {
        fontSize: 12,
        fontWeight: 'bold',
        color: '#64748B',
    },
    txInfoValue: {
        fontSize: 12,
        fontWeight: 'bold',
        color: '#1E293B',
    },
    modalItemRow: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: 16,
    },
    modalItemLeft: {
        flexDirection: 'row',
        alignItems: 'center',
        flex: 1,
    },
    modalQtyBadge: {
        backgroundColor: '#EFF6FF',
        paddingHorizontal: 8,
        paddingVertical: 4,
        borderRadius: 8,
        marginRight: 12,
    },
    modalQtyText: {
        fontSize: 11,
        fontWeight: '900',
        color: '#1E40AF',
    },
    modalItemName: {
        fontSize: 14,
        fontWeight: '900',
        color: '#1E293B',
    },
    modalItemPrice: {
        fontSize: 11,
        color: '#94A3B8',
        fontWeight: 'bold',
    },
    modalItemSubtotal: {
        fontSize: 14,
        fontWeight: '900',
        color: '#1E293B',
        marginLeft: 10,
    },
    sectionCard: {
        backgroundColor: '#FFFFFF',
        borderRadius: 16,
        padding: 16,
        marginTop: 16,
        borderWidth: 1,
        borderColor: '#F1F5F9',
        ...Platform.select({
            web: { boxShadow: '0px 4px 12px rgba(0,0,0,0.05)' },
            android: { elevation: 2 }
        })
    },
    sectionHeader: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 8,
        marginBottom: 12,
    },
    sectionLabel: {
        fontSize: 10,
        fontWeight: '900',
        color: '#64748B',
        letterSpacing: 1,
    },
    infoRow: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
    },
    infoName: {
        fontSize: 15,
        fontWeight: '900',
        color: '#1E293B',
    },
    infoPhone: {
        fontSize: 11,
        color: '#94A3B8',
        fontWeight: 'bold',
        marginTop: 2,
    },
    viewProfileBtn: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: '#F0F9FF',
        paddingHorizontal: 10,
        paddingVertical: 6,
        borderRadius: 10,
        gap: 4,
    },
    viewProfileText: {
        fontSize: 11,
        fontWeight: '900',
        color: '#138FEA',
    },
    noteText: {
        fontSize: 14,
        color: '#92400E',
        fontStyle: 'italic',
        fontWeight: '500',
    },
    modalFooter: {
        padding: 24,
        paddingBottom: Platform.OS === 'ios' ? 40 : 30,
        backgroundColor: '#FFFFFF',
        borderTopWidth: 1,
        borderTopColor: '#F1F5F9',
        zIndex: 999,
        elevation: 20,
        ...Platform.select({
            ios: {
                shadowColor: '#000',
                shadowOffset: { width: 0, height: -10 },
                shadowOpacity: 0.1,
                shadowRadius: 10,
            },
            android: {
                elevation: 20,
                borderTopWidth: 0,
            },
            web: {
                boxShadow: '0px -15px 30px rgba(0,0,0,0.08)',
                borderTopWidth: 0,
            }
        })
    },
    totalRow: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: 12,
    },
    grandTotalLabel: {
        fontSize: 16,
        fontWeight: '900',
        color: '#1E293B',
    },
    grandTotalValue: {
        fontSize: 24,
        fontWeight: '900',
        color: '#1E40AF',
    },
    printBtnText: {
        color: '#FFFFFF',
        fontSize: 16,
        fontWeight: '900',
    },
    modalActionButtons: {
        flexDirection: 'row',
        gap: 12,
    },
    editBtn: {
        flex: 1,
        backgroundColor: '#EFF6FF',
        height: 50,
        borderRadius: 16,
        flexDirection: 'row',
        justifyContent: 'center',
        alignItems: 'center',
        gap: 10,
        borderWidth: 1,
        borderColor: '#BFDBFE',
    },
    editBtnText: {
        color: '#1E40AF',
        fontSize: 16,
        fontWeight: '900',
    },
    printBtn: {
        flex: 1,
        backgroundColor: '#1E40AF',
        height: 50,
        borderRadius: 16,
        flexDirection: 'row',
        justifyContent: 'center',
        alignItems: 'center',
        gap: 10,
    },
    footerDivider: {
        height: 1,
        backgroundColor: '#F1F5F9',
        marginVertical: 16,
    },
    infoRowMini: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
    },
    miniLabel: {
        fontSize: 13,
        fontWeight: 'bold',
        color: '#64748B',
    },
    miniValue: {
        fontSize: 13,
        fontWeight: '900',
        color: '#1E293B',
    },
});

export default React.memo(TransactionDetailModal);
