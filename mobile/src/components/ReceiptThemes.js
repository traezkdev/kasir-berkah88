/**
 * ReceiptThemes.js
 * Koleksi tema desain struk untuk aplikasi mobile.
 * Digunakan oleh ReceiptModal.js dan dipilih melalui setting admin.
 *
 * TEMA TERSEDIA:
 *   '1' - Klasik Modern (default, biru clean)
 *   '2' - Dark Premium (gelap mewah)
 *   '3' - Warung Berkah (earthy / cokelat hangat)
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
// TEMA 2: Dark Premium (gelap mewah — struk hitam dengan aksen gold)
// ============================================================
export const theme2Styles = StyleSheet.create({
    receiptBody: { padding: 24, backgroundColor: '#0F172A' },
    receiptHeader: { alignItems: 'center', marginBottom: 24, backgroundColor: '#0F172A' },
    logoContainer: {
        width: 80, height: 80, borderRadius: 20,
        backgroundColor: '#1E293B', justifyContent: 'center', alignItems: 'center',
        marginBottom: 14,
        borderWidth: 1.5, borderColor: '#D4AF37',
        ...Platform.select({
            ios: { shadowColor: '#D4AF37', shadowOffset: { width: 0, height: 10 }, shadowOpacity: 0.3, shadowRadius: 15 },
            android: { elevation: 12 },
            web: { boxShadow: '0px 10px 20px rgba(212, 175, 55, 0.25)' }
        })
    },
    logoImage: { width: '100%', height: '100%', borderRadius: 20 },
    logoPlaceholder: { alignItems: 'center' },
    logoText: { fontSize: 32, color: '#D4AF37', fontWeight: '900', fontStyle: 'italic' },
    restaurantName: { fontSize: 22, fontWeight: '900', color: '#F8FAFC', letterSpacing: 0.5 },
    restaurantSlogan: { fontSize: 9, fontWeight: '800', color: '#64748B', letterSpacing: 2.5, marginTop: 4 },
    dividerRow: {
        flexDirection: 'row', alignItems: 'center', width: '100%',
        paddingHorizontal: 30, marginTop: 14, opacity: 0.4,
    },
    dividerLine: { flex: 1, height: 1, backgroundColor: '#D4AF37' },
    dividerDot: { width: 5, height: 5, borderRadius: 2.5, backgroundColor: '#D4AF37', marginHorizontal: 8 },
    infoBar: {
        flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center',
        backgroundColor: '#1E293B', padding: 16, borderRadius: 20,
        borderWidth: 1, borderColor: '#334155', marginBottom: 22,
    },
    infoLabel: { fontSize: 8, fontWeight: '900', color: '#475569', letterSpacing: 1.5, marginBottom: 4 },
    idRow: { flexDirection: 'row', alignItems: 'center' },
    activeDot: { width: 6, height: 6, borderRadius: 3, backgroundColor: '#D4AF37', marginRight: 6 },
    idValue: { fontSize: 14, fontWeight: '900', color: '#F1F5F9' },
    dateValue: { fontSize: 12, fontWeight: 'bold', color: '#CBD5E1' },
    infoRight: { alignItems: 'flex-end' },
    sectionHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 },
    sectionTitleRow: { flexDirection: 'row', alignItems: 'center', gap: 8 },
    sectionTitle: { fontSize: 11, fontWeight: '900', color: '#E2E8F0', letterSpacing: 1.5 },
    itemCountBadge: { backgroundColor: 'rgba(212,175,55,0.15)', paddingHorizontal: 8, paddingVertical: 4, borderRadius: 8 },
    itemCountText: { fontSize: 10, fontWeight: '900', color: '#D4AF37' },
    customerSection: {
        backgroundColor: '#1E293B', padding: 14, borderRadius: 16, marginBottom: 16,
        borderWidth: 1, borderColor: '#334155',
    },
    customerSectionTitle: { fontSize: 10, fontWeight: '900', color: '#475569', letterSpacing: 0.5, marginBottom: 8, textTransform: 'uppercase' },
    customerInfoRow: { flexDirection: 'row', alignItems: 'center', gap: 8 },
    customerInfoText: { fontSize: 13, fontWeight: 'bold', color: '#CBD5E1' },
    customerInfoDivider: { height: 1, backgroundColor: '#334155', marginVertical: 6 },
    itemsContainer: { marginBottom: 20 },
    itemRow: {
        flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center',
        marginBottom: 8, backgroundColor: '#1E293B', padding: 12, borderRadius: 14,
        borderWidth: 1, borderColor: '#334155',
    },
    itemLeft: { flexDirection: 'row', flex: 1, alignItems: 'center' },
    itemIndicator: { width: 3, height: 24, backgroundColor: '#D4AF37', borderRadius: 4, marginRight: 10 },
    itemNameRow: { flexDirection: 'row', alignItems: 'center', gap: 8 },
    itemName: { fontSize: 14, fontWeight: '900', color: '#F1F5F9' },
    itemQtyBadge: { backgroundColor: '#D4AF37', paddingHorizontal: 7, paddingVertical: 3, borderRadius: 8 },
    itemQtyText: { fontSize: 10, fontWeight: '900', color: '#0F172A' },
    itemRight: { alignItems: 'flex-end' },
    itemSublabel: { fontSize: 9, fontWeight: '900', color: '#475569', marginBottom: 2, textTransform: 'uppercase' },
    itemPriceText: { fontSize: 15, fontWeight: '900', color: '#F1F5F9' },
    summaryCard: { position: 'relative', marginBottom: 20 },
    summaryGlow: { position: 'absolute', inset: 0, backgroundColor: '#D4AF37', opacity: 0.04, borderRadius: 20 },
    summaryContent: {
        backgroundColor: '#1E293B', borderRadius: 20, padding: 18, borderWidth: 1, borderColor: '#334155',
        ...Platform.select({ ios: { shadowColor: '#D4AF37', shadowOffset: { width: 0, height: 6 }, shadowOpacity: 0.1, shadowRadius: 12 }, android: { elevation: 4 }, web: { boxShadow: '0px 6px 12px rgba(0,0,0,0.3)' } })
    },
    summaryRow: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 10 },
    summaryLabel: { fontSize: 12, color: '#64748B', fontWeight: 'bold' },
    summaryValue: { fontSize: 12, color: '#CBD5E1', fontWeight: '900' },
    thickDivider: { height: 1, backgroundColor: '#334155', width: '100%', marginVertical: 14 },
    totalSection: { alignItems: 'center' },
    totalLabel: { fontSize: 9, fontWeight: '900', color: '#475569', letterSpacing: 3, marginBottom: 6 },
    totalValueRow: { flexDirection: 'row', alignItems: 'flex-start', gap: 4 },
    rpLabel: { fontSize: 14, color: '#D4AF37', fontWeight: '900', marginTop: 4 },
    totalFinalValue: { fontSize: 32, fontWeight: '900', color: '#F8FAFC', letterSpacing: -1 },
    successBadge: {
        flexDirection: 'row', alignItems: 'center', backgroundColor: '#D4AF37',
        paddingHorizontal: 12, paddingVertical: 6, borderRadius: 20, marginTop: 12, gap: 6,
    },
    successText: { fontSize: 9, fontWeight: '900', color: '#0F172A', letterSpacing: 1 },
    paymentPill: {
        flexDirection: 'row', justifyContent: 'center', backgroundColor: '#1E293B',
        paddingVertical: 10, paddingHorizontal: 20, borderRadius: 30, alignSelf: 'center',
        marginBottom: 24, borderWidth: 1, borderColor: '#D4AF37',
    },
    pillPart: { paddingHorizontal: 12, alignItems: 'center', flexDirection: 'row', gap: 8 },
    pillBorder: { borderLeftWidth: 1, borderLeftColor: '#334155' },
    pillLabel: { fontSize: 7, fontWeight: '900', color: '#475569', letterSpacing: 1 },
    pillValue: { fontSize: 9, fontWeight: '900', color: '#D4AF37' },
    notesContainer: {
        backgroundColor: '#1E293B', padding: 14, borderRadius: 14, borderStyle: 'dashed',
        borderWidth: 1, borderColor: '#475569', marginBottom: 22, marginHorizontal: 8,
    },
    notesHeader: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 6, marginBottom: 6 },
    notesLabel: { fontSize: 8, fontWeight: '900', color: '#475569', letterSpacing: 1.5 },
    notesText: { fontSize: 12, color: '#94A3B8', fontStyle: 'italic', fontWeight: 'bold', textAlign: 'center', lineHeight: 18 },
    receiptFooter: { alignItems: 'center', marginTop: 8, marginBottom: 18 },
    footerDecoration: {},
    footerMainText: { fontSize: 14, fontWeight: '900', color: '#F8FAFC' },
    footerSubText: { fontSize: 10, color: '#475569', fontWeight: 'bold', marginTop: 4 },
});

export const theme2Colors = {
    background: '#0F172A',
    accentColor: '#D4AF37',
    iconColorCart: '#D4AF37',
    iconColorStatus: '#D4AF37',
    iconColorCustomer: '#475569',
    iconColorFooter: '#334155',
};

// ============================================================
// TEMA 3: Warung Berkah (earthy/warm — cokelat & hijau alami)
// ============================================================
export const theme3Styles = StyleSheet.create({
    receiptBody: { padding: 20, backgroundColor: '#FDF6EE' },
    receiptHeader: { alignItems: 'center', marginBottom: 22, backgroundColor: '#FDF6EE' },
    logoContainer: {
        width: 76, height: 76, borderRadius: 38,
        backgroundColor: '#4A3728', justifyContent: 'center', alignItems: 'center',
        marginBottom: 12,
        ...Platform.select({
            ios: { shadowColor: '#4A3728', shadowOffset: { width: 0, height: 8 }, shadowOpacity: 0.25, shadowRadius: 12 },
            android: { elevation: 8 },
            web: { boxShadow: '0px 8px 16px rgba(74, 55, 40, 0.25)' }
        })
    },
    logoImage: { width: '100%', height: '100%', borderRadius: 38 },
    logoPlaceholder: { alignItems: 'center' },
    logoText: { fontSize: 30, color: '#F5E6D3', fontWeight: '900' },
    restaurantName: { fontSize: 21, fontWeight: '900', color: '#2D1B0E', letterSpacing: 0.3 },
    restaurantSlogan: { fontSize: 10, fontWeight: '700', color: '#A0856E', letterSpacing: 1.5, marginTop: 4 },
    dividerRow: {
        flexDirection: 'row', alignItems: 'center', width: '100%',
        paddingHorizontal: 30, marginTop: 14, opacity: 0.35,
    },
    dividerLine: { flex: 1, height: 1.5, backgroundColor: '#A0856E' },
    dividerDot: { width: 5, height: 5, borderRadius: 2.5, backgroundColor: '#A0856E', marginHorizontal: 8 },
    infoBar: {
        flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center',
        backgroundColor: '#F5E6D3', padding: 14, borderRadius: 16,
        borderWidth: 1.5, borderColor: '#D4B89A', marginBottom: 20,
    },
    infoLabel: { fontSize: 8, fontWeight: '900', color: '#A0856E', letterSpacing: 1.5, marginBottom: 4 },
    idRow: { flexDirection: 'row', alignItems: 'center' },
    activeDot: { width: 6, height: 6, borderRadius: 3, backgroundColor: '#5C8C60', marginRight: 6 },
    idValue: { fontSize: 14, fontWeight: '900', color: '#2D1B0E' },
    dateValue: { fontSize: 12, fontWeight: 'bold', color: '#4A3728' },
    infoRight: { alignItems: 'flex-end' },
    sectionHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 10 },
    sectionTitleRow: { flexDirection: 'row', alignItems: 'center', gap: 8 },
    sectionTitle: { fontSize: 11, fontWeight: '900', color: '#2D1B0E', letterSpacing: 0.8 },
    itemCountBadge: { backgroundColor: '#5C8C60', paddingHorizontal: 8, paddingVertical: 4, borderRadius: 8 },
    itemCountText: { fontSize: 10, fontWeight: '900', color: '#FFFFFF' },
    customerSection: {
        backgroundColor: '#F5E6D3', padding: 14, borderRadius: 14, marginBottom: 14,
        borderWidth: 1.5, borderColor: '#D4B89A',
    },
    customerSectionTitle: { fontSize: 10, fontWeight: '900', color: '#A0856E', letterSpacing: 0.5, marginBottom: 8, textTransform: 'uppercase' },
    customerInfoRow: { flexDirection: 'row', alignItems: 'center', gap: 8 },
    customerInfoText: { fontSize: 13, fontWeight: 'bold', color: '#2D1B0E' },
    customerInfoDivider: { height: 1, backgroundColor: '#D4B89A', marginVertical: 6 },
    itemsContainer: { marginBottom: 18 },
    itemRow: {
        flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center',
        marginBottom: 8, backgroundColor: '#FFF8F0', padding: 12, borderRadius: 12,
        borderWidth: 1.5, borderColor: '#E8D5BE',
    },
    itemLeft: { flexDirection: 'row', flex: 1, alignItems: 'center' },
    itemIndicator: { width: 4, height: 22, backgroundColor: '#5C8C60', borderRadius: 4, marginRight: 10 },
    itemNameRow: { flexDirection: 'row', alignItems: 'center', gap: 8 },
    itemName: { fontSize: 14, fontWeight: '900', color: '#2D1B0E' },
    itemQtyBadge: { backgroundColor: '#4A3728', paddingHorizontal: 7, paddingVertical: 3, borderRadius: 8 },
    itemQtyText: { fontSize: 10, fontWeight: '900', color: '#F5E6D3' },
    itemRight: { alignItems: 'flex-end' },
    itemSublabel: { fontSize: 9, fontWeight: '900', color: '#A0856E', marginBottom: 2, textTransform: 'uppercase' },
    itemPriceText: { fontSize: 15, fontWeight: '900', color: '#2D1B0E' },
    summaryCard: { position: 'relative', marginBottom: 18 },
    summaryGlow: { position: 'absolute', inset: 0, backgroundColor: '#4A3728', opacity: 0.04, borderRadius: 18 },
    summaryContent: {
        backgroundColor: '#F5E6D3', borderRadius: 18, padding: 16, borderWidth: 1.5, borderColor: '#D4B89A',
        ...Platform.select({ ios: { shadowColor: '#4A3728', shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.08, shadowRadius: 8 }, android: { elevation: 3 }, web: { boxShadow: '0px 4px 8px rgba(74,55,40,0.1)' } })
    },
    summaryRow: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 10 },
    summaryLabel: { fontSize: 12, color: '#A0856E', fontWeight: 'bold' },
    summaryValue: { fontSize: 12, color: '#2D1B0E', fontWeight: '900' },
    thickDivider: { height: 1, backgroundColor: '#D4B89A', width: '100%', marginVertical: 12 },
    totalSection: { alignItems: 'center' },
    totalLabel: { fontSize: 9, fontWeight: '900', color: '#A0856E', letterSpacing: 3, marginBottom: 6 },
    totalValueRow: { flexDirection: 'row', alignItems: 'flex-start', gap: 4 },
    rpLabel: { fontSize: 14, color: '#5C8C60', fontWeight: '900', marginTop: 4 },
    totalFinalValue: { fontSize: 32, fontWeight: '900', color: '#2D1B0E', letterSpacing: -1 },
    successBadge: {
        flexDirection: 'row', alignItems: 'center', backgroundColor: '#5C8C60',
        paddingHorizontal: 12, paddingVertical: 6, borderRadius: 20, marginTop: 12, gap: 6,
    },
    successText: { fontSize: 9, fontWeight: '900', color: '#FFFFFF', letterSpacing: 1 },
    paymentPill: {
        flexDirection: 'row', justifyContent: 'center', backgroundColor: '#4A3728',
        paddingVertical: 10, paddingHorizontal: 20, borderRadius: 30, alignSelf: 'center', marginBottom: 22,
    },
    pillPart: { paddingHorizontal: 12, alignItems: 'center', flexDirection: 'row', gap: 8 },
    pillBorder: { borderLeftWidth: 1, borderLeftColor: '#6B4E38' },
    pillLabel: { fontSize: 7, fontWeight: '900', color: '#A0856E', letterSpacing: 1 },
    pillValue: { fontSize: 9, fontWeight: '900', color: '#F5E6D3' },
    notesContainer: {
        backgroundColor: '#FFF8F0', padding: 14, borderRadius: 14, borderStyle: 'dashed',
        borderWidth: 1.5, borderColor: '#D4B89A', marginBottom: 20, marginHorizontal: 8,
    },
    notesHeader: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 6, marginBottom: 6 },
    notesLabel: { fontSize: 8, fontWeight: '900', color: '#A0856E', letterSpacing: 1.5 },
    notesText: { fontSize: 12, color: '#4A3728', fontStyle: 'italic', fontWeight: 'bold', textAlign: 'center', lineHeight: 18 },
    receiptFooter: { alignItems: 'center', marginTop: 8, marginBottom: 18 },
    footerDecoration: {},
    footerMainText: { fontSize: 14, fontWeight: '900', color: '#2D1B0E' },
    footerSubText: { fontSize: 10, color: '#A0856E', fontWeight: 'bold', marginTop: 4 },
});

export const theme3Colors = {
    background: '#FDF6EE',
    accentColor: '#5C8C60',
    iconColorCart: '#4A3728',
    iconColorStatus: '#5C8C60',
    iconColorCustomer: '#A0856E',
    iconColorFooter: '#D4B89A',
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
        description: 'Bersih, biru elegan — tampilan default',
        accentColor: '#148FEA',
        bgColor: '#FFFFFF',
        textColor: '#1E293B',
        badge: 'Default',
    },
    {
        id: '2',
        name: 'Dark Premium',
        description: 'Gelap mewah dengan aksen emas',
        accentColor: '#D4AF37',
        bgColor: '#0F172A',
        textColor: '#F8FAFC',
    },
    {
        id: '3',
        name: 'Warung Berkah',
        description: 'Hangat, natural — tone cokelat alami',
        accentColor: '#5C8C60',
        bgColor: '#FDF6EE',
        textColor: '#2D1B0E',
    },
];
