/**
 * ReceiptThemes.js
 * Koleksi tema desain struk untuk aplikasi mobile.
 * Digunakan oleh ReceiptModal.js dan dipilih melalui setting admin.
 *
 * TEMA TERSEDIA:
 *   '1' - Klasik Modern (default, biru clean) — layout asli
 *   '2' - Modern Minimal Card (putih elegan, tiap item floating card, aksen violet)
 *   '3' - Tiket / Voucher (header berwarna biru, perforasi dashed, feel tiket fisik)
 */

import { Platform, StyleSheet } from 'react-native';

// ============================================================
// TEMA 1: Klasik Modern (bawaan, biru clean)
// ============================================================
export const theme1Styles = StyleSheet.create({
    receiptBody: { padding: 24, backgroundColor: '#FFFFFF' },
    receiptHeader: { alignItems: 'center', marginBottom: 24, backgroundColor: '#FFFFFF' },
    logoContainer: {
        width: 80, height: 80, borderRadius: 24,
        backgroundColor: '#148FEA', justifyContent: 'center', alignItems: 'center',
        marginBottom: 14,
        ...Platform.select({
            ios: { shadowColor: '#148FEA', shadowOffset: { width: 0, height: 10 }, shadowOpacity: 0.2, shadowRadius: 15 },
            android: { elevation: 10 },
            web: { boxShadow: '0px 10px 15px rgba(20, 143, 234, 0.2)' }
        })
    },
    logoImage: { width: '100%', height: '100%', borderRadius: 24 },
    logoPlaceholder: { alignItems: 'center' },
    logoText: { fontSize: 32, color: '#FFFFFF', fontWeight: '900', fontStyle: 'italic' },
    restaurantName: { fontSize: 22, fontWeight: '900', color: '#1E293B', letterSpacing: -0.5 },
    restaurantSlogan: { fontSize: 10, fontWeight: '900', color: '#94A3B8', letterSpacing: 2, marginTop: 4 },
    dividerRow: {
        flexDirection: 'row', alignItems: 'center', width: '100%',
        paddingHorizontal: 40, marginTop: 12, opacity: 0.3,
    },
    dividerLine: { flex: 1, height: 1.5, backgroundColor: '#94A3B8' },
    dividerDot: { width: 6, height: 6, borderRadius: 3, backgroundColor: '#94A3B8', marginHorizontal: 8 },
    infoBar: {
        flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center',
        backgroundColor: '#FFFFFF', padding: 16, borderRadius: 20,
        borderWidth: 1, borderColor: '#E2E8F0', marginBottom: 24,
    },
    infoLabel: { fontSize: 8, fontWeight: '900', color: '#94A3B8', letterSpacing: 1.5, marginBottom: 4 },
    idRow: { flexDirection: 'row', alignItems: 'center' },
    activeDot: { width: 6, height: 6, borderRadius: 3, backgroundColor: '#10B981', marginRight: 6 },
    idValue: { fontSize: 14, fontWeight: '900', color: '#1E293B' },
    dateValue: { fontSize: 12, fontWeight: 'bold', color: '#1E293B' },
    infoRight: { alignItems: 'flex-end' },
    sectionHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 },
    sectionTitleRow: { flexDirection: 'row', alignItems: 'center', gap: 8 },
    sectionTitle: { fontSize: 11, fontWeight: '900', color: '#1E293B', letterSpacing: 1 },
    itemCountBadge: { backgroundColor: 'rgba(20, 143, 234, 0.1)', paddingHorizontal: 8, paddingVertical: 4, borderRadius: 8 },
    itemCountText: { fontSize: 10, fontWeight: '900', color: '#148FEA' },
    customerSection: {
        backgroundColor: '#FFFFFF', padding: 14, borderRadius: 16, marginBottom: 16,
        borderWidth: 1, borderColor: '#F1F5F9',
    },
    customerSectionTitle: { fontSize: 10, fontWeight: '900', color: '#94A3B8', letterSpacing: 0.5, marginBottom: 8, textTransform: 'uppercase' },
    customerInfoRow: { flexDirection: 'row', alignItems: 'center', gap: 8 },
    customerInfoText: { fontSize: 13, fontWeight: 'bold', color: '#1E293B' },
    customerInfoDivider: { height: 1, backgroundColor: '#F1F5F9', marginVertical: 6 },
    itemsContainer: { marginBottom: 20 },
    itemRow: {
        flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center',
        marginBottom: 8, backgroundColor: '#F8FAFC', padding: 12, borderRadius: 14,
        borderWidth: 1, borderColor: '#F1F5F9',
    },
    itemLeft: { flexDirection: 'row', flex: 1, alignItems: 'center' },
    itemIndicator: { width: 4, height: 24, backgroundColor: '#138FEA', borderRadius: 4, marginRight: 10 },
    itemNameRow: { flexDirection: 'row', alignItems: 'center', gap: 8 },
    itemName: { fontSize: 14, fontWeight: '900', color: '#1E293B' },
    itemQtyBadge: { backgroundColor: '#1E293B', paddingHorizontal: 7, paddingVertical: 3, borderRadius: 8 },
    itemQtyText: { fontSize: 10, fontWeight: '900', color: '#FFFFFF' },
    itemRight: { alignItems: 'flex-end' },
    itemSublabel: { fontSize: 9, fontWeight: '900', color: '#94A3B8', marginBottom: 2, textTransform: 'uppercase' },
    itemPriceText: { fontSize: 15, fontWeight: '900', color: '#1E293B' },
    summaryCard: { position: 'relative', marginBottom: 20 },
    summaryGlow: { position: 'absolute', inset: 0, backgroundColor: '#148FEA', opacity: 0.04, borderRadius: 20 },
    summaryContent: {
        backgroundColor: '#FFFFFF', borderRadius: 20, padding: 18, borderWidth: 1, borderColor: '#F1F5F9',
        ...Platform.select({ ios: { shadowColor: '#000', shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.05, shadowRadius: 8 }, android: { elevation: 2 }, web: { boxShadow: '0px 4px 8px rgba(0,0,0,0.05)' } })
    },
    summaryRow: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 10 },
    summaryLabel: { fontSize: 12, color: '#64748B', fontWeight: 'bold' },
    summaryValue: { fontSize: 12, color: '#1E293B', fontWeight: '900' },
    thickDivider: { height: 1, backgroundColor: '#F1F5F9', width: '100%', marginVertical: 14 },
    totalSection: { alignItems: 'center' },
    totalLabel: { fontSize: 9, fontWeight: '900', color: '#94A3B8', letterSpacing: 3, marginBottom: 6 },
    totalValueRow: { flexDirection: 'row', alignItems: 'flex-start', gap: 4 },
    rpLabel: { fontSize: 14, color: '#148FEA', fontWeight: '900', marginTop: 4 },
    totalFinalValue: { fontSize: 32, fontWeight: '900', color: '#1E293B', letterSpacing: -1 },
    successBadge: {
        flexDirection: 'row', alignItems: 'center', backgroundColor: '#10B981',
        paddingHorizontal: 12, paddingVertical: 6, borderRadius: 20, marginTop: 12, gap: 6,
    },
    successText: { fontSize: 9, fontWeight: '900', color: '#FFFFFF', letterSpacing: 1 },
    paymentPill: {
        flexDirection: 'row', justifyContent: 'center', backgroundColor: '#1E293B',
        paddingVertical: 10, paddingHorizontal: 20, borderRadius: 30, alignSelf: 'center', marginBottom: 24,
    },
    pillPart: { paddingHorizontal: 12, alignItems: 'center', flexDirection: 'row', gap: 8 },
    pillBorder: { borderLeftWidth: 1, borderLeftColor: '#334155' },
    pillLabel: { fontSize: 7, fontWeight: '900', color: '#64748B', letterSpacing: 1 },
    pillValue: { fontSize: 9, fontWeight: '900', color: '#FFFFFF' },
    notesContainer: {
        backgroundColor: '#F8FAFC', padding: 14, borderRadius: 14, borderStyle: 'dashed',
        borderWidth: 1, borderColor: '#CBD5E1', marginBottom: 22, marginHorizontal: 8,
    },
    notesHeader: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 6, marginBottom: 6 },
    notesLabel: { fontSize: 8, fontWeight: '900', color: '#94A3B8', letterSpacing: 1.5 },
    notesText: { fontSize: 12, color: '#475569', fontStyle: 'italic', fontWeight: 'bold', textAlign: 'center', lineHeight: 18 },
    receiptFooter: { alignItems: 'center', marginTop: 8, marginBottom: 18 },
    footerDecoration: {},
    footerMainText: { fontSize: 14, fontWeight: '900', color: '#1E293B' },
    footerSubText: { fontSize: 10, color: '#94A3B8', fontWeight: 'bold', marginTop: 4 },
});

// Warna ikons untuk tema 1
export const theme1Colors = {
    background: '#F8FAFC',
    accentColor: '#148FEA',
    iconColorCart: '#1E40AF',
    iconColorStatus: '#10B981',
    iconColorCustomer: '#64748B',
    iconColorFooter: '#E2E8F0',
};

// ============================================================
// TEMA 2: Modern Minimal Card
// Putih bersih, tiap item punya floating card, aksen violet/indigo
// Layout berbeda dari Tema 1: card-centric, spacious, bold
// ============================================================
export const theme2Styles = StyleSheet.create({
    // Container
    receiptBody: { paddingHorizontal: 0, paddingTop: 0, paddingBottom: 24, backgroundColor: '#FFFFFF' },

    // Header — full-width dengan logo menonjol
    receiptHeader: {
        alignItems: 'center',
        paddingTop: 32, paddingBottom: 28, paddingHorizontal: 24,
        backgroundColor: '#FFFFFF',
        borderBottomWidth: 1, borderBottomColor: '#F1F5F9',
        marginBottom: 0,
    },
    logoContainer: {
        width: 72, height: 72, borderRadius: 20,
        backgroundColor: '#6366F1', justifyContent: 'center', alignItems: 'center',
        marginBottom: 16,
        ...Platform.select({
            ios: { shadowColor: '#6366F1', shadowOffset: { width: 0, height: 12 }, shadowOpacity: 0.35, shadowRadius: 18 },
            android: { elevation: 14 },
            web: { boxShadow: '0px 12px 24px rgba(99, 102, 241, 0.35)' }
        })
    },
    logoImage: { width: '100%', height: '100%', borderRadius: 20 },
    logoPlaceholder: { alignItems: 'center' },
    logoText: { fontSize: 30, color: '#FFFFFF', fontWeight: '900' },
    restaurantName: { fontSize: 20, fontWeight: '900', color: '#0F172A', letterSpacing: -0.3 },
    restaurantSlogan: { fontSize: 9, fontWeight: '700', color: '#A5B4FC', letterSpacing: 2.5, marginTop: 5 },
    dividerRow: {
        flexDirection: 'row', alignItems: 'center',
        width: '100%', paddingHorizontal: 20, marginTop: 16, opacity: 0.5,
    },
    dividerLine: { flex: 1, height: 1, backgroundColor: '#E0E7FF' },
    dividerDot: { width: 5, height: 5, borderRadius: 2.5, backgroundColor: '#818CF8', marginHorizontal: 8 },

    // Info bar — dua kolom di atas konten
    infoBar: {
        flexDirection: 'row',
        marginHorizontal: 20, marginTop: 20, marginBottom: 20,
        backgroundColor: '#F8F7FF', borderRadius: 16,
        overflow: 'hidden', borderWidth: 1, borderColor: '#E0E7FF',
    },
    infoLabel: { fontSize: 8, fontWeight: '900', color: '#A5B4FC', letterSpacing: 1.5, marginBottom: 5 },
    idRow: { flexDirection: 'row', alignItems: 'center' },
    activeDot: { width: 7, height: 7, borderRadius: 3.5, backgroundColor: '#6366F1', marginRight: 7 },
    idValue: { fontSize: 15, fontWeight: '900', color: '#0F172A' },
    dateValue: { fontSize: 12, fontWeight: '700', color: '#334155', textAlign: 'right' },
    infoRight: { alignItems: 'flex-end' },

    // Section header
    sectionHeader: {
        flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center',
        marginBottom: 14, paddingHorizontal: 20, marginTop: 4,
    },
    sectionTitleRow: { flexDirection: 'row', alignItems: 'center', gap: 8 },
    sectionTitle: { fontSize: 10, fontWeight: '900', color: '#6366F1', letterSpacing: 2 },
    itemCountBadge: {
        backgroundColor: '#EEF2FF', paddingHorizontal: 10, paddingVertical: 4, borderRadius: 20,
        borderWidth: 1, borderColor: '#C7D2FE',
    },
    itemCountText: { fontSize: 10, fontWeight: '900', color: '#6366F1' },

    // Customer section
    customerSection: {
        marginHorizontal: 20, marginBottom: 16,
        backgroundColor: '#FAFAFA', padding: 14, borderRadius: 16,
        borderWidth: 1, borderColor: '#F1F5F9',
        borderLeftWidth: 3, borderLeftColor: '#818CF8',
    },
    customerSectionTitle: { fontSize: 9, fontWeight: '900', color: '#A5B4FC', letterSpacing: 1, marginBottom: 10 },
    customerInfoRow: { flexDirection: 'row', alignItems: 'center', gap: 10 },
    customerInfoText: { fontSize: 13, fontWeight: '700', color: '#1E293B' },
    customerInfoDivider: { height: 1, backgroundColor: '#F1F5F9', marginVertical: 7 },

    // Items — tiap item floating card tersendiri
    itemsContainer: { marginBottom: 8, paddingHorizontal: 20 },
    itemRow: {
        marginBottom: 10, backgroundColor: '#FFFFFF',
        borderRadius: 18, borderWidth: 1, borderColor: '#EEF2FF', overflow: 'hidden',
        ...Platform.select({
            ios: { shadowColor: '#6366F1', shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.08, shadowRadius: 10 },
            android: { elevation: 3 },
            web: { boxShadow: '0px 4px 12px rgba(99,102,241,0.08)' }
        })
    },
    // Accent strip atas setiap item card
    itemCardAccent: { height: 3, backgroundColor: '#6366F1', borderTopLeftRadius: 18, borderTopRightRadius: 18 },
    itemCardBody: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', padding: 14 },
    itemLeft: { flexDirection: 'row', flex: 1, alignItems: 'center' },
    itemIndicator: { width: 36, height: 36, borderRadius: 10, backgroundColor: '#EEF2FF', justifyContent: 'center', alignItems: 'center', marginRight: 12 },
    itemIndicatorText: { fontSize: 11, fontWeight: '900', color: '#6366F1' },
    itemNameRow: { flexDirection: 'column', gap: 3 },
    itemName: { fontSize: 14, fontWeight: '900', color: '#0F172A' },
    itemUnitPrice: { fontSize: 10, fontWeight: '600', color: '#94A3B8' },
    itemQtyBadge: {
        backgroundColor: '#EEF2FF', paddingHorizontal: 8, paddingVertical: 3, borderRadius: 8,
        alignSelf: 'flex-start', marginTop: 4,
    },
    itemQtyText: { fontSize: 10, fontWeight: '900', color: '#6366F1' },
    itemRight: { alignItems: 'flex-end' },
    itemSublabel: { fontSize: 8, fontWeight: '900', color: '#CBD5E1', marginBottom: 3, textTransform: 'uppercase' },
    itemPriceText: { fontSize: 16, fontWeight: '900', color: '#0F172A' },

    // Summary card
    summaryCard: { marginHorizontal: 20, marginTop: 12, marginBottom: 8 },
    summaryGlow: {},
    summaryContent: {
        backgroundColor: '#FAFAFF', borderRadius: 20, padding: 18,
        borderWidth: 1.5, borderColor: '#E0E7FF',
        ...Platform.select({
            ios: { shadowColor: '#6366F1', shadowOffset: { width: 0, height: 6 }, shadowOpacity: 0.1, shadowRadius: 14 },
            android: { elevation: 4 },
            web: { boxShadow: '0px 6px 16px rgba(99,102,241,0.1)' }
        })
    },
    summaryRow: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 10 },
    summaryLabel: { fontSize: 12, color: '#64748B', fontWeight: '600' },
    summaryValue: { fontSize: 12, color: '#1E293B', fontWeight: '900' },
    thickDivider: { height: 1.5, backgroundColor: '#E0E7FF', width: '100%', marginVertical: 14 },

    // Total
    totalSection: { alignItems: 'center', paddingTop: 4 },
    totalLabel: { fontSize: 8, fontWeight: '900', color: '#A5B4FC', letterSpacing: 3, marginBottom: 8 },
    totalValueRow: { flexDirection: 'row', alignItems: 'flex-start', gap: 3 },
    rpLabel: { fontSize: 16, color: '#6366F1', fontWeight: '900', marginTop: 6 },
    totalFinalValue: { fontSize: 36, fontWeight: '900', color: '#0F172A', letterSpacing: -1.5 },
    successBadge: {
        flexDirection: 'row', alignItems: 'center',
        backgroundColor: '#F0FDF4', borderWidth: 1.5, borderColor: '#86EFAC',
        paddingHorizontal: 14, paddingVertical: 7, borderRadius: 20, marginTop: 14, gap: 6,
    },
    successText: { fontSize: 9, fontWeight: '900', color: '#16A34A', letterSpacing: 1 },

    // Payment pill — chip bersih
    paymentPill: {
        flexDirection: 'row', justifyContent: 'center',
        marginHorizontal: 20, marginTop: 20, marginBottom: 20,
        backgroundColor: '#FFFFFF', borderRadius: 20,
        borderWidth: 1.5, borderColor: '#E0E7FF', overflow: 'hidden',
        ...Platform.select({
            ios: { shadowColor: '#6366F1', shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.08, shadowRadius: 8 },
            android: { elevation: 2 },
            web: { boxShadow: '0px 4px 8px rgba(99,102,241,0.08)' }
        })
    },
    pillPart: { flex: 1, paddingVertical: 14, paddingHorizontal: 12, alignItems: 'center', gap: 4 },
    pillBorder: { borderLeftWidth: 1.5, borderLeftColor: '#E0E7FF' },
    pillLabel: { fontSize: 7, fontWeight: '900', color: '#A5B4FC', letterSpacing: 1.5 },
    pillValue: { fontSize: 12, fontWeight: '900', color: '#0F172A' },

    // Notes
    notesContainer: {
        marginHorizontal: 20, marginBottom: 20,
        backgroundColor: '#FFFBF0', padding: 14, borderRadius: 14,
        borderStyle: 'dashed', borderWidth: 1.5, borderColor: '#FDE68A',
    },
    notesHeader: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 6, marginBottom: 6 },
    notesLabel: { fontSize: 8, fontWeight: '900', color: '#F59E0B', letterSpacing: 1.5 },
    notesText: { fontSize: 12, color: '#92400E', fontStyle: 'italic', fontWeight: '700', textAlign: 'center', lineHeight: 18 },

    // Footer
    receiptFooter: {
        alignItems: 'center', marginTop: 4, marginBottom: 20,
        paddingTop: 20, borderTopWidth: 1, borderTopColor: '#F1F5F9',
    },
    footerDecoration: {},
    footerMainText: { fontSize: 13, fontWeight: '900', color: '#0F172A', letterSpacing: 0.5 },
    footerSubText: { fontSize: 9, color: '#A5B4FC', fontWeight: '700', marginTop: 4, letterSpacing: 1 },
});

export const theme2Colors = {
    background: '#FFFFFF',
    accentColor: '#6366F1',
    iconColorCart: '#6366F1',
    iconColorStatus: '#16A34A',
    iconColorCustomer: '#818CF8',
    iconColorFooter: '#E0E7FF',
};


// ============================================================
// TEMA 3: Tiket / Voucher Style
// Putih bersih, header berwarna sky blue, perforasi dashed,
// feel tiket fisik premium dengan barcode dekoratif di footer
// ============================================================
export const theme3Styles = StyleSheet.create({
    // Container — Pure white paper
    receiptBody: { paddingHorizontal: 0, paddingTop: 0, paddingBottom: 24, backgroundColor: '#FFFFFF' },

    // Header zone — Putih bersih dengan logo beraksen sky blue
    receiptHeader: {
        alignItems: 'center',
        paddingTop: 32, paddingBottom: 24, paddingHorizontal: 24,
        backgroundColor: '#FFFFFF',
        marginBottom: 0,
    },
    logoContainer: {
        width: 72, height: 72, borderRadius: 36,
        backgroundColor: '#F0F9FF', justifyContent: 'center', alignItems: 'center',
        marginBottom: 14, borderWidth: 2, borderColor: '#BAE6FD',
        ...Platform.select({
            ios: { shadowColor: '#0EA5E9', shadowOffset: { width: 0, height: 8 }, shadowOpacity: 0.15, shadowRadius: 14 },
            android: { elevation: 6 },
            web: { boxShadow: '0px 8px 16px rgba(14, 165, 233, 0.15)' }
        })
    },
    logoImage: { width: '100%', height: '100%', borderRadius: 36 },
    logoPlaceholder: { alignItems: 'center' },
    logoText: { fontSize: 28, color: '#0EA5E9', fontWeight: '900' },
    restaurantName: { fontSize: 22, fontWeight: '900', color: '#0F172A', letterSpacing: -0.5 },
    restaurantSlogan: { fontSize: 9, fontWeight: '800', color: '#0EA5E9', letterSpacing: 2.5, marginTop: 5 },
    // Divider disembunyikan (perforasi dirender langsung di JSX)
    dividerRow: { height: 0, overflow: 'hidden' },
    dividerLine: {},
    dividerDot: {},
    // Zona perforasi — garis dashed + lingkaran sobekan di sisi kiri & kanan (tiket voucher)
    perforationRow: { flexDirection: 'row', alignItems: 'center', backgroundColor: '#FFFFFF', marginVertical: 8 },
    perforationCircleLeft: { width: 20, height: 20, borderRadius: 10, backgroundColor: '#F1F5F9', marginLeft: -10 },
    perforationLine: { flex: 1, height: 0, borderTopWidth: 1.5, borderTopColor: '#CBD5E1', borderStyle: 'dashed', marginHorizontal: 4 },
    perforationCircleRight: { width: 20, height: 20, borderRadius: 10, backgroundColor: '#F1F5F9', marginRight: -10 },
    // Info bar — di bawah perforasi
    infoBar: {
        flexDirection: 'row', justifyContent: 'space-between',
        paddingHorizontal: 24, paddingVertical: 16,
        backgroundColor: '#FFFFFF',
        borderBottomWidth: 1, borderBottomColor: '#F1F5F9',
    },
    infoLabel: { fontSize: 8, fontWeight: '900', color: '#94A3B8', letterSpacing: 1.5, marginBottom: 4 },
    idRow: { flexDirection: 'row', alignItems: 'center' },
    activeDot: { width: 7, height: 7, borderRadius: 3.5, backgroundColor: '#0EA5E9', marginRight: 7 },
    idValue: { fontSize: 15, fontWeight: '900', color: '#0F172A' },
    dateValue: { fontSize: 12, fontWeight: '700', color: '#334155', textAlign: 'right' },
    infoRight: { alignItems: 'flex-end' },

    // Section header
    sectionHeader: {
        flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center',
        paddingHorizontal: 24, paddingTop: 18, paddingBottom: 10,
    },
    sectionTitleRow: { flexDirection: 'row', alignItems: 'center', gap: 8 },
    sectionTitle: { fontSize: 10, fontWeight: '900', color: '#0EA5E9', letterSpacing: 2 },
    itemCountBadge: {
        backgroundColor: '#F0F9FF', paddingHorizontal: 10, paddingVertical: 4, borderRadius: 20,
        borderWidth: 1, borderColor: '#BAE6FD',
    },
    itemCountText: { fontSize: 10, fontWeight: '900', color: '#0284C7' },

    // Customer
    customerSection: {
        marginHorizontal: 24, marginBottom: 14,
        backgroundColor: '#FFFFFF', padding: 14, borderRadius: 14,
        borderWidth: 1, borderColor: '#E2E8F0',
    },
    customerSectionTitle: { fontSize: 9, fontWeight: '900', color: '#94A3B8', letterSpacing: 1, marginBottom: 8 },
    customerInfoRow: { flexDirection: 'row', alignItems: 'center', gap: 10 },
    customerInfoText: { fontSize: 13, fontWeight: '700', color: '#0F172A' },
    customerInfoDivider: { height: 1, backgroundColor: '#F1F5F9', marginVertical: 6 },

    // Items — baris tabel rapi seperti nota kasir
    itemsContainer: { paddingHorizontal: 24, marginBottom: 0 },
    itemRow: {
        flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center',
        paddingVertical: 12, borderBottomWidth: 1, borderBottomColor: '#F1F5F9',
    },
    itemLeft: { flex: 1 },
    itemIndicator: { display: 'none', width: 0, height: 0 },
    itemNameRow: { flexDirection: 'column', gap: 2 },
    itemName: { fontSize: 14, fontWeight: '800', color: '#0F172A' },
    itemUnitPrice: { fontSize: 10, fontWeight: '600', color: '#94A3B8' },
    itemQtyBadge: {
        backgroundColor: '#F0F9FF', borderWidth: 1, borderColor: '#BAE6FD', paddingHorizontal: 7, paddingVertical: 2,
        borderRadius: 6, alignSelf: 'flex-start', marginTop: 4,
    },
    itemQtyText: { fontSize: 9, fontWeight: '900', color: '#0284C7' },
    itemRight: { alignItems: 'flex-end' },
    itemSublabel: { fontSize: 8, fontWeight: '900', color: '#CBD5E1', marginBottom: 2 },
    itemPriceText: { fontSize: 15, fontWeight: '900', color: '#0F172A' },

    // Summary — latar putih dengan border rapi
    summaryCard: { marginTop: 12, marginHorizontal: 24 },
    summaryGlow: {},
    summaryContent: {
        backgroundColor: '#FFFFFF',
        padding: 18, borderRadius: 18,
        borderWidth: 1.5, borderColor: '#E2E8F0',
    },
    summaryRow: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 8 },
    summaryLabel: { fontSize: 12, color: '#64748B', fontWeight: '600' },
    summaryValue: { fontSize: 12, color: '#0F172A', fontWeight: '900' },
    thickDivider: { height: 1, backgroundColor: '#E2E8F0', width: '100%', marginVertical: 12 },

    // Total
    totalSection: { alignItems: 'center', paddingVertical: 4 },
    totalLabel: { fontSize: 8, fontWeight: '900', color: '#94A3B8', letterSpacing: 3, marginBottom: 8 },
    totalValueRow: { flexDirection: 'row', alignItems: 'flex-start', gap: 3 },
    rpLabel: { fontSize: 16, color: '#0EA5E9', fontWeight: '900', marginTop: 6 },
    totalFinalValue: { fontSize: 36, fontWeight: '900', color: '#0F172A', letterSpacing: -1.5 },
    successBadge: {
        flexDirection: 'row', alignItems: 'center', backgroundColor: '#F0FDF4',
        borderWidth: 1.5, borderColor: '#86EFAC',
        paddingHorizontal: 16, paddingVertical: 8, borderRadius: 20, marginTop: 14, gap: 6,
    },
    successText: { fontSize: 9, fontWeight: '900', color: '#16A34A', letterSpacing: 1.5 },

    // Payment pill — putih bersih dengan aksen garis
    paymentPill: {
        flexDirection: 'row', justifyContent: 'center',
        marginHorizontal: 24, marginTop: 16, marginBottom: 0,
        backgroundColor: '#FFFFFF', borderRadius: 16,
        borderWidth: 1.5, borderColor: '#E2E8F0', overflow: 'hidden',
    },
    pillPart: { flex: 1, paddingVertical: 14, alignItems: 'center', gap: 3 },
    pillBorder: { borderLeftWidth: 1.5, borderLeftColor: '#E2E8F0' },
    pillLabel: { fontSize: 7, fontWeight: '900', color: '#94A3B8', letterSpacing: 1.5 },
    pillValue: { fontSize: 12, fontWeight: '900', color: '#0F172A' },

    // Notes
    notesContainer: {
        marginHorizontal: 24, marginTop: 16, marginBottom: 0,
        backgroundColor: '#FFFFFF', padding: 14, borderRadius: 12,
        borderStyle: 'dashed', borderWidth: 1.5, borderColor: '#FCD34D',
    },
    notesHeader: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 6, marginBottom: 6 },
    notesLabel: { fontSize: 8, fontWeight: '900', color: '#D97706', letterSpacing: 1.5 },
    notesText: { fontSize: 12, color: '#92400E', fontStyle: 'italic', fontWeight: '700', textAlign: 'center', lineHeight: 18 },

    // Footer zona tiket — barcode style
    receiptFooter: {
        alignItems: 'center', marginTop: 20, marginBottom: 10,
        paddingTop: 20, paddingHorizontal: 24,
        borderTopWidth: 1, borderTopColor: '#F1F5F9',
    },
    footerDecoration: {},
    footerMainText: { fontSize: 13, fontWeight: '900', color: '#0F172A', letterSpacing: 1 },
    footerSubText: { fontSize: 9, color: '#94A3B8', fontWeight: '700', marginTop: 4, letterSpacing: 2 },

    // Barcode dekoratif
    barcodeContainer: { flexDirection: 'row', gap: 2, marginTop: 14, marginBottom: 4, alignItems: 'flex-end' },
    barcodeBar: { width: 2, backgroundColor: '#94A3B8', borderRadius: 1 },
    barcodeText: { fontSize: 7, fontWeight: '700', color: '#94A3B8', letterSpacing: 3, marginTop: 6 },
});

export const theme3Colors = {
    background: '#FFFFFF',
    accentColor: '#0EA5E9',
    iconColorCart: '#0284C7',
    iconColorStatus: '#10B981',
    iconColorCustomer: '#0EA5E9',
    iconColorFooter: '#CBD5E1',
};

/**
 * Mengambil objek style + colors berdasarkan versi tema
 * @param {string|number} version - '1', '2', atau '3'
 * @returns {{ styles: StyleSheet, colors: object }}
 */
export function getReceiptTheme(version) {
    switch (String(version)) {
        case '2': return { styles: theme2Styles, colors: theme2Colors };
        case '3': return { styles: theme3Styles, colors: theme3Colors };
        default:  return { styles: theme1Styles, colors: theme1Colors };
    }
}

/**
 * Meta info setiap tema, digunakan untuk preview di Settings web
 */
export const RECEIPT_THEMES = [
    {
        id: '1',
        name: 'Klasik Modern',
        description: 'Putih bersih, layout klasik dengan indikator baris biru',
        accentColor: '#148FEA',
        bgColor: '#FFFFFF',
        textColor: '#1E293B',
        badge: 'Default',
    },
    {
        id: '2',
        name: 'Modern Minimal Card',
        description: 'Putih bersih, layout floating card per item, aksen indigo',
        accentColor: '#6366F1',
        bgColor: '#FFFFFF',
        textColor: '#0F172A',
        badge: 'Cards',
    },
    {
        id: '3',
        name: 'Tiket / Voucher Struk',
        description: 'Putih bersih, perforasi dashed tiket fisik, tabel nota & barcode',
        accentColor: '#0EA5E9',
        bgColor: '#FFFFFF',
        textColor: '#0F172A',
        badge: 'Ticket',
    },
];
