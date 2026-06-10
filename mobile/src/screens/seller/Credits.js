import React, { useState, useEffect, useCallback } from 'react';
import {
    StyleSheet,
    View,
    Text,
    TouchableOpacity,
    FlatList,
    ActivityIndicator,
    TextInput,
    Alert,
    Platform,
    StatusBar,
    RefreshControl
} from 'react-native';
import {
    ChevronLeft,
    Plus,
    Users,
    Wallet,
    Trash2,
    Edit3,
    FileText
} from 'lucide-react-native';
import apiService from '../../api/apiService';
import { useAuth } from '../../context/AuthContext';
import { useToast } from '../../context/ToastContext';
import BottomModalTemplate from '../../components/templates/BottomModalTemplate';
import DateTimePicker from '@react-native-community/datetimepicker';

const Credits = ({ navigation }) => {
    const { user } = useAuth();
    const { showToast } = useToast();

    const [credits, setCredits] = useState([]);
    const [loading, setLoading] = useState(true);
    const [refreshing, setRefreshing] = useState(false);
    
    // Form State
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [editingId, setEditingId] = useState(null);
    const [formData, setFormData] = useState({
        employee_name: '',
        amount: '',
        description: '',
        credit_date: new Date().toISOString().split('T')[0],
        due_date: '',
        status: 'unpaid'
    });
    const [installmentAmount, setInstallmentAmount] = useState('');
    const [showDatePicker, setShowDatePicker] = useState(false);
    const [showDueDatePicker, setShowDueDatePicker] = useState(false);

    const formatCurrency = (amount) => {
        return new Intl.NumberFormat('id-ID', {
            style: 'currency',
            currency: 'IDR',
            minimumFractionDigits: 0
        }).format(amount);
    };

    const fetchCredits = useCallback(async () => {
        try {
            const response = await apiService.get('/api/credits');
            setCredits(response.data.data);
        } catch (error) {
            console.error('Error fetching credits:', error);
            showToast('Gagal memuat data kasbon', 'error');
        } finally {
            setLoading(false);
            setRefreshing(false);
        }
    }, [showToast]);

    useEffect(() => {
        fetchCredits();
    }, [fetchCredits]);

    const handleRefresh = () => {
        setRefreshing(true);
        fetchCredits();
    };

    const handleSubmit = async () => {
        if (!formData.employee_name || !formData.amount || !formData.credit_date) {
            showToast('Harap isi field yang wajib', 'error');
            return;
        }

        try {
            if (editingId) {
                let finalData = { ...formData };
                
                // Logic cicilan
                if (installmentAmount && parseFloat(installmentAmount) > 0) {
                    const payment = parseFloat(installmentAmount);
                    const currentDebt = parseFloat(formData.amount);
                    
                    if (payment > currentDebt) {
                        showToast('Jumlah bayar melebihi sisa hutang', 'error');
                        return;
                    }
                    
                    const remaining = currentDebt - payment;
                    
                    if (remaining <= 0) {
                        finalData.amount = 0;
                        finalData.status = 'paid';
                        finalData.description = `${finalData.description ? finalData.description + ' | ' : ''}Lunas via Cicilan`;
                    } else {
                        finalData.amount = remaining;
                        finalData.status = 'partial';
                        finalData.description = `${finalData.description ? finalData.description + ' | ' : ''}Dicicil: ${payment} (Sisa: ${remaining})`;
                    }
                }

                await apiService.put(`/api/credits/${editingId}`, finalData);
                showToast('Data berhasil diperbarui', 'success');
            } else {
                await apiService.post('/api/credits', formData);
                showToast('Kasbon berhasil ditambahkan', 'success');
            }
            setIsModalOpen(false);
            resetForm();
            fetchCredits();
        } catch (error) {
            console.error('Error saving credit:', error);
            showToast('Gagal menyimpan data', 'error');
        }
    };

    const handleDelete = (id) => {
        Alert.alert(
            'Hapus Data',
            'Yakin ingin menghapus data ini?',
            [
                { text: 'Batal', style: 'cancel' },
                {
                    text: 'Hapus',
                    style: 'destructive',
                    onPress: async () => {
                        try {
                            await apiService.delete(`/api/credits/${id}`);
                            showToast('Data berhasil dihapus', 'success');
                            fetchCredits();
                        } catch (error) {
                            showToast('Gagal menghapus data', 'error');
                        }
                    }
                }
            ]
        );
    };

    const handleEdit = (credit) => {
        setEditingId(credit.id);
        setFormData({
            employee_name: credit.employee_name,
            amount: credit.amount.toString(),
            description: credit.description || '',
            credit_date: credit.credit_date ? credit.credit_date.split('T')[0] : new Date().toISOString().split('T')[0],
            due_date: credit.due_date ? credit.due_date.split('T')[0] : '',
            status: credit.status
        });
        setInstallmentAmount('');
        setIsModalOpen(true);
    };

    const resetForm = () => {
        setEditingId(null);
        setFormData({
            employee_name: '',
            amount: '',
            description: '',
            credit_date: new Date().toISOString().split('T')[0],
            due_date: '',
            status: 'unpaid'
        });
        setInstallmentAmount('');
    };

    const totalUnpaid = credits
        .filter(c => c.status === 'unpaid' || c.status === 'partial')
        .reduce((sum, c) => sum + parseFloat(c.amount), 0);

    const totalCredits = credits.length;

    const renderDateInput = (label, value, onDateChange, showPickerState, setShowPickerState) => {
        return (
            <View style={{ marginBottom: 15 }}>
                <Text style={styles.inputLabel}>{label}</Text>
                <TouchableOpacity
                    style={styles.input}
                    onPress={() => setShowPickerState(true)}
                >
                    <Text style={{ color: value ? '#1E293B' : '#94A3B8' }}>
                        {value || 'Pilih Tanggal'}
                    </Text>
                </TouchableOpacity>
                {showPickerState && (
                    <DateTimePicker
                        value={value ? new Date(value) : new Date()}
                        mode="date"
                        display="default"
                        onChange={(event, selectedDate) => {
                            setShowPickerState(false);
                            if (selectedDate) {
                                const year = selectedDate.getFullYear();
                                const month = String(selectedDate.getMonth() + 1).padStart(2, '0');
                                const day = String(selectedDate.getDate()).padStart(2, '0');
                                onDateChange(`${year}-${month}-${day}`);
                            }
                        }}
                    />
                )}
            </View>
        );
    };

    const renderItem = ({ item }) => {
        const statusConfig = {
            paid: { label: 'Lunas', color: '#10B981', bg: '#D1FAE5' },
            partial: { label: 'Sebagian', color: '#F59E0B', bg: '#FEF3C7' },
            unpaid: { label: 'Belum Lunas', color: '#EF4444', bg: '#FEE2E2' }
        };
        const st = statusConfig[item.status] || statusConfig.unpaid;

        return (
            <View style={styles.card}>
                <View style={styles.cardHeader}>
                    <View>
                        <Text style={styles.dateText}>
                            {new Date(item.credit_date).toLocaleDateString('id-ID', { day: 'numeric', month: 'long', year: 'numeric' })}
                        </Text>
                        <Text style={styles.employeeName}>{item.employee_name}</Text>
                    </View>
                    <View style={[styles.statusBadge, { backgroundColor: st.bg }]}>
                        <Text style={[styles.statusText, { color: st.color }]}>{st.label}</Text>
                    </View>
                </View>
                
                <View style={styles.descBox}>
                    <Text style={styles.descText}>"{item.description || 'Tidak ada keterangan'}"</Text>
                </View>

                <View style={styles.cardFooter}>
                    <View>
                        <Text style={styles.amountLabel}>Jumlah Pinjaman</Text>
                        <Text style={styles.amountText}>{formatCurrency(item.amount)}</Text>
                    </View>
                    <View style={styles.actionRow}>
                        <TouchableOpacity onPress={() => handleEdit(item)} style={[styles.actionBtn, { backgroundColor: '#E0F2FE' }]}>
                            <Edit3 size={18} color="#0284C7" />
                        </TouchableOpacity>
                        <TouchableOpacity onPress={() => handleDelete(item.id)} style={[styles.actionBtn, { backgroundColor: '#FEE2E2' }]}>
                            <Trash2 size={18} color="#EF4444" />
                        </TouchableOpacity>
                    </View>
                </View>
            </View>
        );
    };

    return (
        <View style={styles.container}>
            <StatusBar barStyle="dark-content" backgroundColor="#FFFFFF" />
            
            <View style={styles.header}>
                <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backBtn}>
                    <ChevronLeft size={24} color="#1E293B" />
                </TouchableOpacity>
                <Text style={styles.headerTitle}>Piutang Karyawan</Text>
                <View style={{ width: 40 }} />
            </View>

            <View style={styles.summaryContainer}>
                <View style={styles.summaryCard}>
                    <View style={[styles.iconBox, { backgroundColor: '#FEE2E2' }]}>
                        <Wallet size={20} color="#EF4444" />
                    </View>
                    <Text style={styles.summaryLabel}>Total Belum Lunas</Text>
                    <Text style={styles.summaryValue}>{formatCurrency(totalUnpaid)}</Text>
                </View>
                <View style={styles.summaryCard}>
                    <View style={[styles.iconBox, { backgroundColor: '#E0F2FE' }]}>
                        <Users size={20} color="#0284C7" />
                    </View>
                    <Text style={styles.summaryLabel}>Total Transaksi</Text>
                    <Text style={styles.summaryValue}>{totalCredits}</Text>
                </View>
            </View>

            {loading ? (
                <View style={styles.centerContainer}>
                    <ActivityIndicator size="large" color="#1E40AF" />
                </View>
            ) : credits.length === 0 ? (
                <View style={styles.centerContainer}>
                    <FileText size={48} color="#CBD5E1" />
                    <Text style={styles.emptyText}>Belum ada data kasbon.</Text>
                </View>
            ) : (
                <FlatList
                    data={credits}
                    keyExtractor={item => item.id.toString()}
                    renderItem={renderItem}
                    contentContainerStyle={styles.listContainer}
                    refreshControl={<RefreshControl refreshing={refreshing} onRefresh={handleRefresh} />}
                />
            )}

            <TouchableOpacity style={styles.fab} onPress={() => { resetForm(); setIsModalOpen(true); }}>
                <Plus size={24} color="#FFFFFF" />
            </TouchableOpacity>

            <BottomModalTemplate
                visible={isModalOpen}
                onClose={() => setIsModalOpen(false)}
                title={editingId ? 'Edit Kasbon' : 'Tambah Kasbon Baru'}
                footer={
                    <TouchableOpacity style={styles.submitBtn} onPress={handleSubmit}>
                        <Text style={styles.submitBtnText}>Simpan</Text>
                    </TouchableOpacity>
                }
            >
                <View style={styles.formContainer}>
                    <Text style={styles.inputLabel}>Nama Karyawan *</Text>
                    <TextInput
                        style={styles.input}
                        placeholder="Contoh: Asep"
                        value={formData.employee_name}
                        onChangeText={t => setFormData({...formData, employee_name: t})}
                    />

                    <Text style={styles.inputLabel}>Jumlah Kasbon (Rp) *</Text>
                    <TextInput
                        style={styles.input}
                        placeholder="0"
                        keyboardType="numeric"
                        value={formData.amount}
                        onChangeText={t => setFormData({...formData, amount: t.replace(/[^0-9]/g, '')})}
                    />

                    {renderDateInput('Tanggal *', formData.credit_date, (val) => setFormData({...formData, credit_date: val}), showDatePicker, setShowDatePicker)}
                    {renderDateInput('Jatuh Tempo (Opsional)', formData.due_date, (val) => setFormData({...formData, due_date: val}), showDueDatePicker, setShowDueDatePicker)}

                    {editingId && (
                        <View style={{ marginBottom: 15 }}>
                            <Text style={styles.inputLabel}>Status</Text>
                            <View style={styles.statusRow}>
                                {['unpaid', 'partial', 'paid'].map(st => (
                                    <TouchableOpacity 
                                        key={st} 
                                        style={[styles.statusOption, formData.status === st && styles.statusOptionActive]}
                                        onPress={() => setFormData({...formData, status: st})}
                                    >
                                        <Text style={[styles.statusOptionText, formData.status === st && styles.statusOptionTextActive]}>
                                            {st === 'unpaid' ? 'Belum Lunas' : st === 'partial' ? 'Dicicil' : 'Lunas'}
                                        </Text>
                                    </TouchableOpacity>
                                ))}
                            </View>
                        </View>
                    )}

                    {editingId && formData.status !== 'paid' && (
                        <View style={styles.installmentBox}>
                            <Text style={styles.installmentLabel}>Bayar Cicilan / Pelunasan</Text>
                            <TextInput
                                style={styles.input}
                                placeholder="Rp 0"
                                keyboardType="numeric"
                                value={installmentAmount}
                                onChangeText={t => setInstallmentAmount(t.replace(/[^0-9]/g, ''))}
                            />
                        </View>
                    )}

                    <Text style={styles.inputLabel}>Keterangan</Text>
                    <TextInput
                        style={[styles.input, { height: 80, textAlignVertical: 'top' }]}
                        placeholder="Keterangan tambahan..."
                        multiline
                        value={formData.description}
                        onChangeText={t => setFormData({...formData, description: t})}
                    />
                </View>
            </BottomModalTemplate>
        </View>
    );
};

const styles = StyleSheet.create({
    container: { flex: 1, backgroundColor: '#F8FAFC' },
    header: {
        flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
        paddingHorizontal: 20, paddingTop: Platform.OS === 'android' ? StatusBar.currentHeight + 10 : 20,
        paddingBottom: 20, backgroundColor: '#FFFFFF', borderBottomWidth: 1, borderBottomColor: '#F1F5F9'
    },
    backBtn: { width: 40, height: 40, justifyContent: 'center', alignItems: 'center', backgroundColor: '#F1F5F9', borderRadius: 12 },
    headerTitle: { fontSize: 18, fontWeight: 'bold', color: '#1E293B' },
    summaryContainer: { flexDirection: 'row', padding: 20, gap: 15 },
    summaryCard: { flex: 1, backgroundColor: '#FFFFFF', padding: 15, borderRadius: 16, shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.05, shadowRadius: 15, elevation: 2 },
    iconBox: { width: 40, height: 40, borderRadius: 10, justifyContent: 'center', alignItems: 'center', marginBottom: 10 },
    summaryLabel: { fontSize: 12, color: '#64748B', fontWeight: '600' },
    summaryValue: { fontSize: 18, fontWeight: '900', color: '#1E293B', marginTop: 4 },
    centerContainer: { flex: 1, justifyContent: 'center', alignItems: 'center' },
    emptyText: { marginTop: 10, color: '#94A3B8', fontSize: 14 },
    listContainer: { padding: 20, paddingTop: 0, paddingBottom: 100 },
    card: { backgroundColor: '#FFFFFF', borderRadius: 16, padding: 15, marginBottom: 15, shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.05, shadowRadius: 10, elevation: 2 },
    cardHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 10 },
    dateText: { fontSize: 11, color: '#94A3B8', marginBottom: 4 },
    employeeName: { fontSize: 16, fontWeight: 'bold', color: '#1E293B' },
    statusBadge: { paddingHorizontal: 8, paddingVertical: 4, borderRadius: 8 },
    statusText: { fontSize: 10, fontWeight: 'bold', textTransform: 'uppercase' },
    descBox: { backgroundColor: '#F8FAFC', padding: 10, borderRadius: 8, marginBottom: 15 },
    descText: { fontSize: 13, color: '#475569', fontStyle: 'italic' },
    cardFooter: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
    amountLabel: { fontSize: 11, color: '#64748B', marginBottom: 2 },
    amountText: { fontSize: 16, fontWeight: '900', color: '#EF4444' },
    actionRow: { flexDirection: 'row', gap: 10 },
    actionBtn: { width: 36, height: 36, borderRadius: 10, justifyContent: 'center', alignItems: 'center' },
    fab: { position: 'absolute', right: 20, bottom: 30, width: 60, height: 60, borderRadius: 30, backgroundColor: '#1E40AF', justifyContent: 'center', alignItems: 'center', shadowColor: '#1E40AF', shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.3, shadowRadius: 10, elevation: 5 },
    formContainer: { paddingBottom: 20 },
    inputLabel: { fontSize: 13, fontWeight: '600', color: '#475569', marginBottom: 8 },
    input: { backgroundColor: '#F8FAFC', borderWidth: 1, borderColor: '#E2E8F0', borderRadius: 12, paddingHorizontal: 15, paddingVertical: 12, fontSize: 14, color: '#1E293B', marginBottom: 15 },
    statusRow: { flexDirection: 'row', gap: 10 },
    statusOption: { flex: 1, paddingVertical: 10, alignItems: 'center', borderRadius: 10, borderWidth: 1, borderColor: '#E2E8F0' },
    statusOptionActive: { backgroundColor: '#1E40AF', borderColor: '#1E40AF' },
    statusOptionText: { fontSize: 13, fontWeight: '600', color: '#64748B' },
    statusOptionTextActive: { color: '#FFFFFF' },
    installmentBox: { backgroundColor: '#F0FDF4', padding: 15, borderRadius: 12, borderWidth: 1, borderColor: '#BBF7D0', marginBottom: 15 },
    installmentLabel: { fontSize: 13, fontWeight: 'bold', color: '#166534', marginBottom: 8 },
    submitBtn: { backgroundColor: '#1E40AF', paddingVertical: 15, borderRadius: 12, alignItems: 'center' },
    submitBtnText: { color: '#FFFFFF', fontSize: 16, fontWeight: 'bold' }
});

export default Credits;
