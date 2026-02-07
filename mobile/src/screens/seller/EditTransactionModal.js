import React, { useState, useEffect, useCallback, useMemo } from 'react';
import {
    StyleSheet,
    Text,
    View,
    TouchableOpacity,
    TextInput,
    ActivityIndicator,
    Alert,
    Platform,
    Modal as RNModal,
    StatusBar,
    FlatList,
    InteractionManager
} from 'react-native';
import { KeyboardAwareScrollView } from 'react-native-keyboard-aware-scroll-view';
import BottomModalTemplate from '../../components/templates/BottomModalTemplate';
import {
    X,
    Plus,
    Minus,
    Trash2,
    Save,
    User,
    Calendar,
    CreditCard,
    DollarSign,
    FileText,
    MapPin,
    Phone,
    Banknote,
    Settings,
    Search,
    CheckCircle2,
    Users,
    ArrowRight
} from 'lucide-react-native';
import apiService from '../../api/apiService';
import DateTimePicker from '@react-native-community/datetimepicker';

const EditTransactionModal = ({ visible, onClose, transaction, onSave }) => {
    const [loading, setLoading] = useState(false);
    const [menuItems, setMenuItems] = useState([]);
    const [fetchingMenu, setFetchingMenu] = useState(false);
    const [cart, setCart] = useState([]);
    const [manualDiscount, setManualDiscount] = useState('0');
    const [ppn, setPpn] = useState('0');
    const [notes, setNotes] = useState('');
    const [paymentMethod, setPaymentMethod] = useState('Tunai');
    const [customerName, setCustomerName] = useState('');
    const [customerPhone, setCustomerPhone] = useState('');
    const [customerAddress, setCustomerAddress] = useState('');
    const [cashPaid, setCashPaid] = useState('0');
    const [change, setChange] = useState('0');
    const [timestamp, setTimestamp] = useState('');
    const [menuSearch, setMenuSearch] = useState('');
    const [showSuccessPopup, setShowSuccessPopup] = useState(false);
    const [showDatePicker, setShowDatePicker] = useState(false);
    const [pickerMode, setPickerMode] = useState('date');
    const [dateValue, setDateValue] = useState(new Date());
    const [selectedCustomer, setSelectedCustomer] = useState(null);
    const [customerSearchResults, setCustomerSearchResults] = useState([]);
    const [isSearchingCustomer, setIsSearchingCustomer] = useState(false);
    const [showCustomerSearch, setShowCustomerSearch] = useState(false);
    const [customerSearchQuery, setCustomerSearchQuery] = useState('');

    useEffect(() => {
        if (visible && transaction) {
            setCart(transaction.items || []);
            setManualDiscount(String(transaction.manual_discount || 0));
            setPpn(String(transaction.ppn || 0));
            setNotes(transaction.catatan || '');

            // Normalize payment method to match UI options (Tunai, Gojek, etc.)
            const methods = ['Tunai', 'Gojek', 'Transfer', 'QRIS'];
            const backendMethod = transaction.payment_method || 'Tunai';
            const matchedMethod = methods.find(m => m.toLowerCase() === backendMethod.toLowerCase()) || 'Tunai';
            setPaymentMethod(matchedMethod);

            setCustomerName(transaction.customer_name || '');
            setCustomerPhone(transaction.customer_phone || '');
            setCustomerAddress(transaction.customer_address || '');
            setCashPaid(String(transaction.cash_paid || 0));
            setChange(String(transaction.change || 0));

            const date = new Date(transaction.timestamp);
            setDateValue(date);
            const pad = (n) => String(n).padStart(2, '0');
            const formattedDate = `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())} ${pad(date.getHours())}:${pad(date.getMinutes())}`;
            setTimestamp(formattedDate);

            // Defer heavy fetching to avoid lag during modal transition
            const task = InteractionManager.runAfterInteractions(() => {
                fetchMenuItems();
            });
            return () => task.cancel();
        }
    }, [visible, transaction]);

    const showPicker = () => {
        setPickerMode('date');
        setShowDatePicker(true);
    };

    const onDateChange = (event, selectedDate) => {
        if (event.type === 'dismissed') {
            setShowDatePicker(false);
            return;
        }

        const currentDate = selectedDate || dateValue;

        if (Platform.OS === 'android') {
            setShowDatePicker(false);
            setDateValue(currentDate);

            if (pickerMode === 'date') {
                setPickerMode('time');
                setTimeout(() => setShowDatePicker(true), 100);
            } else {
                const pad = (n) => String(n).padStart(2, '0');
                const formatted = `${currentDate.getFullYear()}-${pad(currentDate.getMonth() + 1)}-${pad(currentDate.getDate())} ${pad(currentDate.getHours())}:${pad(currentDate.getMinutes())}`;
                setTimestamp(formatted);
                setPickerMode('date');
            }
        } else {
            // iOS logic
            setDateValue(currentDate);
            const pad = (n) => String(n).padStart(2, '0');
            const formatted = `${currentDate.getFullYear()}-${pad(currentDate.getMonth() + 1)}-${pad(currentDate.getDate())} ${pad(currentDate.getHours())}:${pad(currentDate.getMinutes())}`;
            setTimestamp(formatted);
            if (event.type === 'set') setShowDatePicker(false); // Close on selection if using modal style
        }
    };

    const fetchMenuItems = async () => {
        setFetchingMenu(true);
        try {
            const response = await apiService.get('/api/menu-items/all');
            if (response.data && response.data.message === 'success') {
                setMenuItems(response.data.data);
            }
        } catch (error) {
            console.error('Error fetching menu items:', error);
        } finally {
            setFetchingMenu(false);
        }
    };

    const searchCustomers = useCallback(async (query = '') => {
        setIsSearchingCustomer(true);
        try {
            let url = '/api/customers?limit=20';
            if (query && query.length >= 1) {
                url = `/api/customers/search?query=${query}`;
            }
            const response = await apiService.get(url);
            setCustomerSearchResults(response.data.data || []);
        } catch (error) {
            console.error("Error searching customers:", error);
        } finally {
            setIsSearchingCustomer(false);
        }
    }, []);

    const handleSelectCustomer = (customer) => {
        setSelectedCustomer(customer);
        setCustomerName(customer.username || customer.name);
        setCustomerPhone(customer.phone);
        setCustomerAddress(customer.address);
        setShowCustomerSearch(false);
        setCustomerSearchQuery('');
        setCustomerSearchResults([]);
    };

    const filteredMenuItems = useMemo(() =>
        menuItems.filter(item =>
            item.name.toLowerCase().includes(menuSearch.toLowerCase())
        ), [menuItems, menuSearch]);

    const subtotal = useMemo(() =>
        cart.reduce((acc, item) => acc + (item.price * (item.quantity || item.qty || 1)), 0),
        [cart]
    );

    const total = useMemo(() =>
        subtotal + Number(ppn || 0) - Number(manualDiscount || 0),
        [subtotal, ppn, manualDiscount]
    );

    useEffect(() => {
        if (paymentMethod === 'Tunai' || paymentMethod === 'Cash') {
            const c = Math.max(0, Number(cashPaid || 0) - total);
            setChange(String(c));
        } else {
            setChange('0');
        }
    }, [cashPaid, total, paymentMethod]);

    const updateQty = useCallback((id, delta) => {
        setCart(prev => prev.map(item => {
            if (item.id === id) {
                const currentQty = item.quantity || item.qty || 1;
                const newQty = currentQty + delta;
                return { ...item, quantity: Math.max(1, newQty), qty: Math.max(1, newQty) };
            }
            return item;
        }));
    }, []);

    const removeItem = useCallback((id) => {
        setCart(prev => prev.filter(item => item.id !== id));
    }, []);

    const addItem = useCallback((item) => {
        setCart(prev => {
            const existing = prev.find(i => i.id === item.id);
            if (existing) {
                return prev.map(i => {
                    if (i.id === item.id) {
                        const currentQty = i.quantity || i.qty || 1;
                        const newQty = currentQty + 1;
                        return { ...i, quantity: newQty, qty: newQty };
                    }
                    return i;
                });
            } else {
                return [...prev, {
                    id: item.id,
                    name: item.name,
                    price: item.price,
                    quantity: 1,
                    qty: 1,
                    category: item.category
                }];
            }
        });
    }, []);

    const handleTotalChange = useCallback((text) => {
        const val = parseInt(text.replace(/[^0-9]/g, ''), 10) || 0;
        // Formula: total = subtotal + ppn - manualDiscount
        // Jadi: manualDiscount = subtotal + ppn - total
        const newDiscount = subtotal + Number(ppn || 0) - val;
        setManualDiscount(String(newDiscount));
    }, [subtotal, ppn]);

    const handleCashPaidChange = useCallback((text) => {
        // Hapus karakter non-angka agar kalkulasi aman
        const cleanValue = text.replace(/[^0-9]/g, '');
        setCashPaid(cleanValue === '' ? '0' : cleanValue);
    }, []);

    const handleSave = useCallback(async () => {
        if (cart.length === 0) {
            Alert.alert('Gagal', 'Keranjang tidak boleh kosong');
            return;
        }

        setLoading(true);
        try {
            const payload = {
                items: cart,
                total: total,
                ppn: Number(ppn || 0),
                manual_discount: Number(manualDiscount || 0),
                catatan: notes,
                payment_method: paymentMethod,
                customer_name: customerName,
                customer_phone: customerPhone,
                customer_address: customerAddress,
                customerId: selectedCustomer?.id || transaction.customer_id || null,
                cash_paid: (paymentMethod === 'Tunai' || paymentMethod === 'Cash') ? Number(cashPaid || 0) : 0,
                change: (paymentMethod === 'Tunai' || paymentMethod === 'Cash') ? Number(change || 0) : 0,
                timestamp: timestamp
            };

            const response = await apiService.put(`/api/transactions/${transaction.id}`, payload);
            if (response.data && response.data.message === 'success') {
                setShowSuccessPopup(true);
            } else {
                Alert.alert('Gagal', response.data.error || 'Terjadi kesalahan');
            }
        } catch (error) {
            console.error('Error updating transaction:', error);
            Alert.alert('Error', 'Gagal memperbarui transaksi');
        } finally {
            setLoading(false);
        }
    }, [cart, total, ppn, manualDiscount, notes, paymentMethod, customerName, customerPhone, customerAddress, cashPaid, change, timestamp, transaction]);

    const formatCurrency = (val) => {
        return new Intl.NumberFormat('id-ID', { style: 'currency', currency: 'IDR', minimumFractionDigits: 0 }).format(val || 0);
    };

    return (
        <RNModal visible={visible} animationType="slide" transparent={false} onRequestClose={onClose}>
            <View style={styles.container}>
                <StatusBar barStyle="dark-content" backgroundColor="#FFFFFF" />
                <View style={styles.header}>
                    <TouchableOpacity onPress={onClose} style={styles.backBtn}>
                        <X size={24} color="#1E293B" />
                    </TouchableOpacity>
                    <Text style={styles.headerTitle}>Edit Transaksi</Text>
                    <TouchableOpacity onPress={handleSave} disabled={loading} style={styles.saveBtn}>
                        {loading ? <ActivityIndicator size="small" color="#1E40AF" /> : <Save size={24} color="#1E40AF" />}
                    </TouchableOpacity>
                </View>

                <KeyboardAwareScrollView
                    style={{ flex: 1 }}
                    contentContainerStyle={{ paddingBottom: 20 }}
                    enableOnAndroid={true}
                    extraScrollHeight={Platform.OS === 'ios' ? 20 : 0}
                    keyboardShouldPersistTaps="handled"
                >
                    <View style={styles.content}>
                        <View style={styles.section}>
                            <View style={styles.sectionHeader}>
                                <FileText size={18} color="#1E40AF" />
                                <Text style={styles.sectionTitle}>Item Transaksi</Text>
                            </View>

                            {cart.map((item, idx) => (
                                <View key={idx} style={styles.itemRow}>
                                    <View style={{ flex: 1 }}>
                                        <Text style={styles.itemName}>{item.name}</Text>
                                        <Text style={styles.itemPrice}>{formatCurrency(item.price)}</Text>
                                    </View>
                                    <View style={styles.qtyContainer}>
                                        <TouchableOpacity onPress={() => updateQty(item.id, -1)} style={styles.qtyBtn}>
                                            <Minus size={16} color="#475569" />
                                        </TouchableOpacity>
                                        <Text style={styles.qtyText}>{item.quantity || item.qty || 1}</Text>
                                        <TouchableOpacity onPress={() => updateQty(item.id, 1)} style={styles.qtyBtn}>
                                            <Plus size={16} color="#475569" />
                                        </TouchableOpacity>
                                        <TouchableOpacity onPress={() => removeItem(item.id)} style={[styles.qtyBtn, { marginLeft: 10, backgroundColor: '#FEE2E2' }]}>
                                            <Trash2 size={16} color="#EF4444" />
                                        </TouchableOpacity>
                                    </View>
                                </View>
                            ))}

                            <View style={styles.addSection}>
                                <View style={styles.sectionHeader}>
                                    <Plus size={16} color="#1E40AF" />
                                    <Text style={styles.addLabel}>Tambah Menu ke Transaksi:</Text>
                                </View>

                                {/* Search Bar for Menu */}
                                <View style={styles.menuSearchContainer}>
                                    <Search size={16} color="#94A3B8" />
                                    <TextInput
                                        autoFocus={false}
                                        style={styles.menuSearchInput}
                                        placeholder="Cari menu..."
                                        value={menuSearch}
                                        onChangeText={setMenuSearch}
                                        placeholderTextColor="#94A3B8"
                                    />
                                    {menuSearch !== '' && (
                                        <TouchableOpacity onPress={() => setMenuSearch('')}>
                                            <X size={16} color="#94A3B8" />
                                        </TouchableOpacity>
                                    )}
                                </View>

                                {fetchingMenu ? (
                                    <View style={styles.menuLoader}>
                                        <ActivityIndicator size="small" color="#1E40AF" />
                                    </View>
                                ) : (
                                    <FlatList
                                        data={filteredMenuItems}
                                        horizontal
                                        showsHorizontalScrollIndicator={false}
                                        style={styles.menuHorizontalList}
                                        contentContainerStyle={{ paddingRight: 20 }}
                                        keyExtractor={item => item.id.toString()}
                                        renderItem={({ item }) => (
                                            <TouchableOpacity style={styles.menuMiniCard} onPress={() => addItem(item)}>
                                                <Text style={styles.menuMiniName} numberOfLines={1}>{item.name}</Text>
                                                <Text style={styles.menuMiniStock}>Stok: {item.stock ?? '∞'}</Text>
                                                <Text style={styles.menuMiniPrice}>{formatCurrency(item.price)}</Text>
                                            </TouchableOpacity>
                                        )}
                                        ListEmptyComponent={
                                            <View style={styles.emptyMenuSearch}>
                                                <Text style={styles.emptyMenuSearchText}>Menu tidak ditemukan</Text>
                                            </View>
                                        }
                                        initialNumToRender={5}
                                        maxToRenderPerBatch={5}
                                        windowSize={5}
                                        removeClippedSubviews={true}
                                    />
                                )}
                            </View>
                        </View>

                        <View style={styles.section}>
                            <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 15 }}>
                                <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
                                    <Users size={18} color="#1E40AF" />
                                    <Text style={{ fontSize: 10, fontWeight: '900', color: '#64748B', letterSpacing: 1 }}>DATA PELANGGAN</Text>
                                </View>
                                {!selectedCustomer && (
                                    <TouchableOpacity
                                        onPress={() => {
                                            setShowCustomerSearch(true);
                                            searchCustomers('');
                                        }}
                                        style={{ backgroundColor: '#EFF6FF', paddingHorizontal: 10, paddingVertical: 4, borderRadius: 8 }}
                                    >
                                        <Text style={{ color: '#2563EB', fontWeight: 'bold', fontSize: 12 }}>+ Cari Member</Text>
                                    </TouchableOpacity>
                                )}
                            </View>

                            {selectedCustomer ? (
                                <View style={styles.selectedCustomerCard}>
                                    <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                                        <View style={{ flex: 1 }}>
                                            <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6, flexWrap: 'wrap' }}>
                                                <Text style={styles.customerNameTitle}>{selectedCustomer.username || selectedCustomer.name}</Text>
                                                <View style={{ backgroundColor: '#DCFCE7', paddingHorizontal: 6, paddingVertical: 2, borderRadius: 4 }}>
                                                    <Text style={{ color: '#166534', fontSize: 10, fontWeight: 'bold' }}>MEMBER</Text>
                                                </View>
                                            </View>
                                            <Text style={styles.customerPhoneText}>{selectedCustomer.phone || '-'}</Text>
                                            <Text style={styles.customerAddressText}>{selectedCustomer.address || 'Alamat tidak diatur'}</Text>
                                        </View>
                                        <TouchableOpacity onPress={() => {
                                            setSelectedCustomer(null);
                                            setCustomerName('');
                                            setCustomerPhone('');
                                            setCustomerAddress('');
                                        }}>
                                            <X size={16} color="#94A3B8" />
                                        </TouchableOpacity>
                                    </View>
                                </View>
                            ) : (
                                <>
                                    <View style={styles.inputGroup}>
                                        <Text style={styles.inputLabel}>Nama Pelanggan</Text>
                                        <TextInput
                                            autoFocus={false}
                                            style={styles.input}
                                            value={customerName}
                                            onChangeText={setCustomerName}
                                            placeholder="Masukkan nama..."
                                        />
                                    </View>
                                    <View style={styles.inputGroup}>
                                        <Text style={styles.inputLabel}>No. Handphone</Text>
                                        <TextInput
                                            autoFocus={false}
                                            style={styles.input}
                                            value={customerPhone}
                                            onChangeText={setCustomerPhone}
                                            placeholder="0812..."
                                            keyboardType="phone-pad"
                                        />
                                    </View>
                                    <View style={styles.inputGroup}>
                                        <Text style={styles.inputLabel}>Alamat</Text>
                                        <TextInput
                                            autoFocus={false}
                                            style={[styles.input, { height: 80, textAlignVertical: 'top' }]}
                                            value={customerAddress}
                                            onChangeText={setCustomerAddress}
                                            placeholder="Alamat lengkap..."
                                            multiline
                                        />
                                    </View>
                                </>
                            )}
                        </View>

                        <View style={styles.section}>
                            <View style={styles.sectionHeader}>
                                <Banknote size={18} color="#1E40AF" />
                                <Text style={styles.sectionTitle}>Rincian Biaya & Pembayaran</Text>
                            </View>

                            <View style={styles.summaryRow}>
                                <Text style={styles.summaryLabel}>Subtotal</Text>
                                <Text style={styles.summaryValue}>{formatCurrency(subtotal)}</Text>
                            </View>

                            <View style={styles.inputRow}>
                                <View style={{ flex: 1, marginRight: 10 }}>
                                    <Text style={styles.inputLabel}>PPN</Text>
                                    <TextInput
                                        autoFocus={false}
                                        style={styles.input}
                                        value={ppn}
                                        onChangeText={setPpn}
                                        keyboardType="numeric"
                                    />
                                </View>
                                <View style={{ flex: 1 }}>
                                    <Text style={styles.inputLabel}>Diskon</Text>
                                    <TextInput
                                        autoFocus={false}
                                        style={styles.input}
                                        value={manualDiscount}
                                        onChangeText={setManualDiscount}
                                        keyboardType="numeric"
                                    />
                                </View>
                            </View>

                            <View style={[styles.summaryRow, { marginTop: 10 }]}>
                                <Text style={[styles.summaryLabel, { fontSize: 16, color: '#1E293B' }]}>Total Akhir</Text>
                                <View style={styles.totalInputWrapper}>
                                    <Text style={[styles.summaryValue, { fontSize: 20, color: '#1E40AF', marginRight: 4 }]}>Rp</Text>
                                    <TextInput
                                        autoFocus={false}
                                        style={[styles.summaryValue, { fontSize: 20, color: '#1E40AF', minWidth: 80, textAlign: 'right', padding: 0 }]}
                                        value={String(total)}
                                        onChangeText={handleTotalChange}
                                        keyboardType="numeric"
                                    />
                                </View>
                            </View>

                            <View style={styles.divider} />

                            <View style={styles.inputGroup}>
                                <Text style={styles.inputLabel}>Metode Pembayaran</Text>
                                <View style={styles.methodRow}>
                                    {['Tunai', 'Gojek', 'Transfer', 'QRIS'].map((m) => (
                                        <TouchableOpacity
                                            key={m}
                                            style={[styles.methodBtn, paymentMethod === m && styles.methodBtnActive]}
                                            onPress={() => setPaymentMethod(m)}
                                        >
                                            <Text style={[styles.methodBtnText, paymentMethod === m && styles.methodBtnTextActive]}>{m}</Text>
                                        </TouchableOpacity>
                                    ))}
                                </View>
                            </View>

                            {(paymentMethod === 'Tunai' || paymentMethod === 'Cash') && (
                                <View style={styles.inputRow}>
                                    <View style={{ flex: 1, marginRight: 10 }}>
                                        <Text style={styles.inputLabel}>Uang Dibayar</Text>
                                        <TextInput
                                            autoFocus={false}
                                            style={styles.input}
                                            value={cashPaid}
                                            onChangeText={handleCashPaidChange}
                                            keyboardType="numeric"
                                        />
                                    </View>
                                    <View style={{ flex: 1 }}>
                                        <Text style={styles.inputLabel}>Kembalian</Text>
                                        <TextInput
                                            style={[styles.input, { backgroundColor: '#F8FAFC' }]}
                                            value={formatCurrency(Number(change))}
                                            editable={false}
                                        />
                                    </View>
                                </View>
                            )}

                            <View style={styles.inputGroup}>
                                <View style={styles.sectionHeader}>
                                    <Calendar size={18} color="#1E40AF" />
                                    <Text style={styles.sectionTitle}>Waktu Transaksi</Text>
                                </View>
                                <TouchableOpacity onPress={showPicker} style={[styles.input, { justifyContent: 'center' }]}>
                                    <Text style={{ color: '#1E293B' }}>{timestamp || 'Pilih Waktu'}</Text>
                                </TouchableOpacity>
                                <Text style={{ fontSize: 10, color: '#94A3B8', marginTop: 4, fontStyle: 'italic' }}>
                                    Ketuk untuk mengubah tanggal dan jam
                                </Text>
                            </View>

                            {showDatePicker && (
                                <DateTimePicker
                                    value={dateValue}
                                    mode={pickerMode}
                                    is24Hour={true}
                                    display="default"
                                    onChange={onDateChange}
                                />
                            )}

                            <View style={styles.inputGroup}>
                                <View style={styles.sectionHeader}>
                                    <Settings size={18} color="#1E40AF" />
                                    <Text style={styles.sectionTitle}>Catatan</Text>
                                </View>
                                <TextInput
                                    style={[styles.input, { height: 60, textAlignVertical: 'top' }]}
                                    value={notes}
                                    onChangeText={setNotes}
                                    placeholder="Tambahkan catatan..."
                                    multiline
                                />
                            </View>
                        </View>
                    </View>
                </KeyboardAwareScrollView>

                <View style={styles.footer}>
                    <TouchableOpacity style={styles.cancelBtn} onPress={onClose}>
                        <Text style={styles.cancelBtnText}>Batal</Text>
                    </TouchableOpacity>
                    <TouchableOpacity style={styles.confirmBtn} onPress={handleSave} disabled={loading}>
                        {loading ? <ActivityIndicator color="#FFF" /> : <Text style={styles.confirmBtnText}>Simpan Perubahan</Text>}
                    </TouchableOpacity>
                </View>
            </View>

            {/* Success Popup */}
            <RNModal visible={showSuccessPopup} transparent animationType="fade">
                <View style={styles.popupOverlay}>
                    <View style={styles.popupContent}>
                        <View style={styles.successIconBg}>
                            <CheckCircle2 size={40} color="#FFFFFF" strokeWidth={3} />
                        </View>
                        <Text style={styles.popupTitle}>Berhasil Diperbarui!</Text>
                        <Text style={styles.popupSub}>Detail transaksi telah berhasil disimpan ke sistem.</Text>
                        <TouchableOpacity
                            style={styles.popupBtn}
                            onPress={() => {
                                setShowSuccessPopup(false);
                                onSave();
                                onClose();
                            }}
                        >
                            <Text style={styles.popupBtnText}>Selesai</Text>
                        </TouchableOpacity>
                    </View>
                </View>
            </RNModal>
            {/* Customer Search Modal */}
            <BottomModalTemplate
                visible={showCustomerSearch}
                onClose={() => setShowCustomerSearch(false)}
                title="Cari Member"
            >
                <View style={[styles.searchModalInputWrapper, { marginHorizontal: 0 }]}>
                    <Search size={20} color="#94A3B8" />
                    <TextInput
                        style={styles.searchModalInput}
                        placeholder="Cari nama atau nomor HP..."
                        value={customerSearchQuery}
                        onChangeText={(text) => {
                            setCustomerSearchQuery(text);
                            searchCustomers(text);
                        }}
                        autoFocus
                    />
                </View>

                {isSearchingCustomer ? (
                    <ActivityIndicator size="large" color="#1E40AF" style={{ marginTop: 20 }} />
                ) : customerSearchResults.length > 0 ? (
                    customerSearchResults.map((item) => (
                        <TouchableOpacity
                            key={item.id.toString()}
                            style={styles.customerSearchResultItem}
                            onPress={() => handleSelectCustomer(item)}
                        >
                            <View style={{ flex: 1 }}>
                                <Text style={styles.searchResultName}>{item.username || item.name}</Text>
                                <Text style={styles.searchResultPhone}>{item.phone || '-'}</Text>
                                <Text style={styles.searchResultAddress} numberOfLines={1}>{item.address || 'Alamat tidak diatur'}</Text>
                            </View>
                            <View style={{ alignItems: 'flex-end', marginLeft: 10 }}>
                                <Text style={styles.searchResultPoints}>{Number(item.points || 0).toLocaleString()} pts</Text>
                                <ArrowRight size={16} color="#2563EB" />
                            </View>
                        </TouchableOpacity>
                    ))
                ) : (
                    <Text style={{ textAlign: 'center', marginTop: 20, color: '#94A3B8' }}>Pelanggan tidak ditemukan</Text>
                )}
            </BottomModalTemplate>
        </RNModal>
    );
};

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: '#FFFFFF',
    },
    header: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        paddingHorizontal: 24,
        paddingTop: Platform.OS === 'android' ? (StatusBar.currentHeight || 0) + 15 : (Platform.OS === 'ios' ? 50 : 30),
        paddingBottom: 20,
        borderBottomWidth: 1,
        borderBottomColor: '#F1F5F9',
    },
    headerTitle: {
        fontSize: 18,
        fontWeight: '900',
        color: '#1E293B',
    },
    backBtn: {
        width: 40,
        height: 40,
        borderRadius: 20,
        backgroundColor: '#F1F5F9',
        justifyContent: 'center',
        alignItems: 'center',
    },
    saveBtn: {
        width: 40,
        height: 40,
        borderRadius: 20,
        backgroundColor: '#EFF6FF',
        justifyContent: 'center',
        alignItems: 'center',
    },
    content: {
        flex: 1,
    },
    section: {
        padding: 24,
        borderBottomWidth: 8,
        borderBottomColor: '#F8FAFC',
    },
    sectionHeader: {
        flexDirection: 'row',
        alignItems: 'center',
        marginBottom: 16,
        gap: 10,
    },
    sectionTitle: {
        fontSize: 15,
        fontWeight: '900',
        color: '#1E293B',
    },
    itemRow: {
        flexDirection: 'row',
        alignItems: 'center',
        paddingVertical: 12,
        borderBottomWidth: 1,
        borderBottomColor: '#F1F5F9',
    },
    itemName: {
        fontSize: 14,
        fontWeight: 'bold',
        color: '#334155',
    },
    itemPrice: {
        fontSize: 12,
        color: '#94A3B8',
        fontWeight: 'bold',
        marginTop: 2,
    },
    qtyContainer: {
        flexDirection: 'row',
        alignItems: 'center',
    },
    qtyBtn: {
        width: 34,
        height: 34,
        borderRadius: 10,
        backgroundColor: '#F1F5F9',
        justifyContent: 'center',
        alignItems: 'center',
    },
    qtyText: {
        fontSize: 14,
        fontWeight: '900',
        marginHorizontal: 12,
        color: '#1E293B',
    },
    addSection: {
        marginTop: 20,
    },
    addLabel: {
        fontSize: 13,
        fontWeight: '900',
        color: '#1E40AF',
    },
    menuHorizontalList: {
        marginTop: 5,
    },
    menuLoader: {
        padding: 20,
        alignItems: 'center',
    },
    menuSearchContainer: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: '#F8FAFC',
        borderWidth: 1,
        borderColor: '#F1F5F9',
        borderRadius: 12,
        paddingHorizontal: 12,
        height: 40,
        marginBottom: 10,
    },
    menuSearchInput: {
        flex: 1,
        marginLeft: 8,
        fontSize: 13,
        color: '#334155',
        fontWeight: 'bold',
        padding: 0,
    },
    emptyMenuSearch: {
        padding: 20,
        width: 150,
    },
    emptyMenuSearchText: {
        fontSize: 12,
        color: '#94A3B8',
        fontStyle: 'italic',
    },
    menuMiniCard: {
        width: 140,
        padding: 14,
        backgroundColor: '#F8FAFC',
        borderRadius: 16,
        marginRight: 12,
        borderWidth: 1,
        borderColor: '#F1F5F9',
    },
    menuMiniName: {
        fontSize: 13,
        fontWeight: 'bold',
        color: '#334155',
        marginBottom: 2,
    },
    menuMiniStock: {
        fontSize: 10,
        color: '#64748B',
        fontWeight: 'bold',
        marginBottom: 4,
    },
    menuMiniPrice: {
        fontSize: 12,
        color: '#1E40AF',
        fontWeight: '900',
    },
    inputGroup: {
        marginBottom: 18,
    },
    inputLabel: {
        fontSize: 12,
        fontWeight: '900',
        color: '#64748B',
        marginBottom: 8,
    },
    input: {
        height: 52,
        backgroundColor: '#F8FAFC',
        borderWidth: 1,
        borderColor: '#F1F5F9',
        borderRadius: 14,
        paddingHorizontal: 18,
        fontSize: 14,
        color: '#334155',
        fontWeight: 'bold',
    },
    inputRow: {
        flexDirection: 'row',
        marginBottom: 18,
    },
    dateSelectorBtn: {
        height: 52,
        backgroundColor: '#F8FAFC',
        borderWidth: 1,
        borderColor: '#F1F5F9',
        borderRadius: 14,
        paddingHorizontal: 18,
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
    },
    dateSelectorText: {
        fontSize: 14,
        color: '#334155',
        fontWeight: 'bold',
    },
    summaryRow: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: 10,
    },
    summaryLabel: {
        fontSize: 14,
        color: '#64748B',
        fontWeight: 'bold',
    },
    summaryValue: {
        fontSize: 14,
        fontWeight: '900',
        color: '#1E293B',
    },
    totalInputWrapper: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: '#EFF6FF',
        paddingHorizontal: 12,
        paddingVertical: 6,
        borderRadius: 12,
        borderWidth: 1,
        borderColor: '#DBEAFE',
    },
    divider: {
        height: 1,
        backgroundColor: '#F1F5F9',
        marginVertical: 18,
        borderStyle: 'dashed',
    },
    methodRow: {
        flexDirection: 'row',
        flexWrap: 'wrap',
        gap: 10,
    },
    methodBtn: {
        paddingHorizontal: 18,
        paddingVertical: 12,
        borderRadius: 12,
        backgroundColor: '#F8FAFC',
        borderWidth: 1,
        borderColor: '#F1F5F9',
    },
    methodBtnActive: {
        backgroundColor: '#1E40AF',
        borderColor: '#1E40AF',
    },
    methodBtnText: {
        fontSize: 13,
        fontWeight: 'bold',
        color: '#64748B',
    },
    methodBtnTextActive: {
        color: '#FFFFFF',
    },
    footer: {
        flexDirection: 'row',
        padding: 24,
        paddingBottom: Platform.OS === 'ios' ? 40 : 25,
        backgroundColor: '#FFFFFF',
        borderTopWidth: 1,
        borderTopColor: '#F1F5F9',
        gap: 15,
    },
    cancelBtn: {
        flex: 1,
        height: 54,
        borderRadius: 16,
        justifyContent: 'center',
        alignItems: 'center',
        backgroundColor: '#F1F5F9',
    },
    cancelBtnText: {
        fontSize: 16,
        fontWeight: 'bold',
        color: '#64748B',
    },
    confirmBtn: {
        flex: 2,
        height: 54,
        borderRadius: 16,
        justifyContent: 'center',
        alignItems: 'center',
        backgroundColor: '#1E40AF',
    },
    confirmBtnText: {
        fontSize: 16,
        fontWeight: '900',
        color: '#FFFFFF',
    },
    // Popup Styles
    popupOverlay: {
        flex: 1,
        backgroundColor: 'rgba(15, 23, 42, 0.8)',
        justifyContent: 'center',
        alignItems: 'center',
        padding: 24,
    },
    popupContent: {
        width: '100%',
        backgroundColor: '#FFFFFF',
        borderRadius: 32,
        padding: 40,
        alignItems: 'center',
        elevation: 10,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 10 },
        shadowOpacity: 0.25,
        shadowRadius: 20,
    },
    successIconBg: {
        width: 80,
        height: 80,
        borderRadius: 40,
        backgroundColor: '#10B981',
        justifyContent: 'center',
        alignItems: 'center',
        marginBottom: 24,
    },
    popupTitle: {
        fontSize: 22,
        fontWeight: '900',
        color: '#1E293B',
        marginBottom: 12,
    },
    popupSub: {
        fontSize: 14,
        color: '#64748B',
        textAlign: 'center',
        lineHeight: 22,
        marginBottom: 32,
        fontWeight: 'bold',
    },
    popupBtn: {
        width: '100%',
        height: 56,
        backgroundColor: '#1E40AF',
        borderRadius: 18,
        justifyContent: 'center',
        alignItems: 'center',
    },
    popupBtnText: {
        fontSize: 16,
        fontWeight: '900',
        color: '#FFFFFF',
    },
    // Search Modal Styles
    searchModalHeader: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        padding: 20,
        borderBottomWidth: 1,
        borderBottomColor: '#F1F5F9',
    },
    searchModalTitle: {
        fontSize: 18,
        fontWeight: '900',
        color: '#1E293B',
    },
    searchModalInputWrapper: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: '#F8FAFC',
        margin: 15,
        paddingHorizontal: 15,
        borderRadius: 12,
        borderWidth: 1,
        borderColor: '#E2E8F0',
        height: 50,
    },
    searchModalInput: {
        flex: 1,
        marginLeft: 10,
        fontSize: 14,
        color: '#1E293B',
        fontWeight: 'bold',
    },
    customerSearchResultItem: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        paddingVertical: 15,
        paddingHorizontal: 5,
        borderBottomWidth: 1,
        borderBottomColor: '#F1F5F9',
    },
    searchResultName: {
        fontSize: 15,
        fontWeight: 'bold',
        color: '#1E293B',
    },
    searchResultPhone: {
        fontSize: 13,
        color: '#64748B',
        marginTop: 2,
    },
    searchResultAddress: {
        fontSize: 11,
        color: '#94A3B8',
        marginTop: 2,
    },
    searchResultPoints: {
        fontSize: 12,
        fontWeight: 'bold',
        color: '#2563EB',
        marginBottom: 4,
    },
    selectedCustomerCard: {
        backgroundColor: '#F0F9FF',
        borderRadius: 16,
        padding: 16,
        borderWidth: 1,
        borderColor: '#BAE6FD',
        marginBottom: 10,
    },
    customerNameTitle: {
        fontSize: 16,
        fontWeight: 'bold',
        color: '#1E293B',
    },
    customerPhoneText: {
        fontSize: 14,
        color: '#64748B',
        marginTop: 2,
    },
    customerAddressText: {
        fontSize: 12,
        color: '#94A3B8',
        marginTop: 4,
    },
});

export default React.memo(EditTransactionModal);
