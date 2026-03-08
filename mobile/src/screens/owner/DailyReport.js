import React, { useState, useEffect, useCallback } from 'react';
import {
    StyleSheet,
    View,
    Text,
    ScrollView,
    TouchableOpacity,
    Platform,
    StatusBar,
    RefreshControl,
    ActivityIndicator,
} from 'react-native';
import {
    ChevronLeft,
    CheckCircle2,
    Circle,
    AlertCircle,
    TrendingDown,
    Wallet,
    Calculator,
    ChevronRight,
    Calendar,
    Clock,
} from 'lucide-react-native';
import apiService from '../../api/apiService';
import { useToast } from '../../context/ToastContext';

const DailyReport = ({ navigation }) => {
    const { showToast } = useToast();
    const [loading, setLoading] = useState(true);
    const [refreshing, setRefreshing] = useState(false);
    const getLocalDateString = () => {
        const date = new Date();
        const year = date.getFullYear();
        const month = String(date.getMonth() + 1).padStart(2, '0');
        const day = String(date.getDate()).padStart(2, '0');
        return `${year}-${month}-${day}`;
    };

    const [selectedDate, setSelectedDate] = useState(getLocalDateString());

    // Status untuk setiap tahapan
    const [taskStatus, setTaskStatus] = useState({
        expense: { completed: false, count: 0, total: 0 },
        deposit: { completed: false, count: 0, total: 0 },
        reconciliation: { completed: false, variance: 0 }
    });

    // Fetch status semua tahapan
    const fetchDailyStatus = useCallback(async () => {
        setLoading(true);

        // Helper function to safely parse dates
        // Helper function to safely parse dates (Comparison in Local Time)
        const isSameDate = (dateString, targetDate) => {
            try {
                if (!dateString) return false;
                const normalizedDateStr = dateString.includes(' ') ? dateString.replace(' ', 'T') : dateString;
                const date = new Date(normalizedDateStr);
                if (isNaN(date.getTime())) return false;

                const year = date.getFullYear();
                const month = String(date.getMonth() + 1).padStart(2, '0');
                const day = String(date.getDate()).padStart(2, '0');
                const localDate = `${year}-${month}-${day}`;

                return localDate === targetDate;
            } catch {
                return false;
            }
        };

        // Fetch Expense Status
        try {
            const expenseRes = await apiService.get(`/api/expenses`);
            const todayExpenses = expenseRes.data.data?.filter(item =>
                // item.expense_date usually YYYY-MM-DD from API, or datetime string
                isSameDate(item.date || item.expense_date, selectedDate)
            ) || [];
            const expenseCount = todayExpenses.length;
            const expenseTotal = todayExpenses.reduce((sum, item) => sum + parseFloat(item.amount || 0), 0);

            setTaskStatus(prev => ({
                ...prev,
                expense: { completed: expenseCount > 0, count: expenseCount, total: expenseTotal }
            }));
        } catch (error) {
            console.error('Error fetching expenses:', error.response?.data || error.message);
        }

        // Fetch Deposit Status (using account transactions)
        try {
            const accountName = 'lapak_deposit';
            const depositRes = await apiService.get('/api/accounts/' + accountName);
            const transactions = depositRes.data.data?.transactions || [];

            const todayDeposits = transactions.filter(item =>
                item.type === 'deposit' && isSameDate(item.created_at, selectedDate)
            );

            const depositCount = todayDeposits.length;
            const depositTotal = todayDeposits.reduce((sum, item) => sum + parseFloat(item.amount || 0), 0);

            setTaskStatus(prev => ({
                ...prev,
                deposit: { completed: depositCount > 0, count: depositCount, total: depositTotal }
            }));
        } catch (error) {
            console.error('Error fetching deposits from /api/accounts/lapak_deposit:', error.response?.data || error.message);
        }

        // Fetch Reconciliation Status
        try {
            const reconRes = await apiService.get(`/api/cash-reconciliation/history?startDate=${selectedDate}&endDate=${selectedDate}`);
            const reconCompleted = reconRes.data.data?.length > 0;
            const reconVariance = reconCompleted ? parseFloat(reconRes.data.data[0].variance_tunai || 0) +
                parseFloat(reconRes.data.data[0].variance_transfer || 0) +
                parseFloat(reconRes.data.data[0].variance_gojek || 0) : 0;

            setTaskStatus(prev => ({
                ...prev,
                reconciliation: { completed: reconCompleted, variance: reconVariance }
            }));
        } catch (error) {
            console.error('Error fetching reconciliation:', error.response?.data || error.message);
        }

        setLoading(false);
    }, [selectedDate]);

    useEffect(() => {
        fetchDailyStatus();
    }, [fetchDailyStatus]);

    const handleRefresh = async () => {
        setRefreshing(true);
        await fetchDailyStatus();
        setRefreshing(false);
    };

    const formatCurrency = (amount) => {
        return new Intl.NumberFormat('id-ID', {
            style: 'currency',
            currency: 'IDR',
            minimumFractionDigits: 0,
            maximumFractionDigits: 0
        }).format(amount);
    };

    const getProgressPercentage = () => {
        const completed = Object.values(taskStatus).filter(task => task.completed).length;
        return Math.round((completed / 3) * 100);
    };

    const TaskCard = ({ title, description, icon: Icon, iconColor, iconBg, completed, onPress, stats }) => (
        <TouchableOpacity
            style={[styles.taskCard, completed && styles.taskCardCompleted]}
            onPress={onPress}
            activeOpacity={0.7}
        >
            <View style={styles.taskCardLeft}>
                <View style={[styles.taskIconWrap, { backgroundColor: iconBg }]}>
                    <Icon size={24} color={iconColor} />
                </View>
                <View style={styles.taskInfo}>
                    <Text style={styles.taskTitle}>{title}</Text>
                    <Text style={styles.taskDesc}>{description}</Text>
                    {stats && <Text style={styles.taskStats}>{stats}</Text>}
                </View>
            </View>
            <View style={styles.taskCardRight}>
                {completed ? (
                    <CheckCircle2 size={28} color="#10B981" />
                ) : (
                    <Circle size={28} color="#CBD5E1" />
                )}
                <ChevronRight size={20} color="#94A3B8" style={styles.chevron} />
            </View>
        </TouchableOpacity>
    );

    const progress = getProgressPercentage();
    const allCompleted = progress === 100;

    return (
        <View style={styles.container}>
            <StatusBar barStyle="light-content" backgroundColor="transparent" translucent={true} />

            {/* Header */}
            <View style={styles.header}>
                <View style={styles.headerTop}>
                    <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backBtn}>
                        <ChevronLeft size={24} color="#FFFFFF" />
                    </TouchableOpacity>
                    <Text style={styles.headerTitle}>Laporan Harian</Text>
                    <View style={{ width: 40 }} />
                </View>

                <View style={styles.dateCard}>
                    <Calendar size={20} color="#349BE5" />
                    <View style={styles.dateInfo}>
                        <Text style={styles.dateLabel}>Tanggal Laporan</Text>
                        <Text style={styles.dateValue}>
                            {new Date(selectedDate).toLocaleDateString('id-ID', {
                                weekday: 'long',
                                day: 'numeric',
                                month: 'long',
                                year: 'numeric'
                            })}
                        </Text>
                    </View>
                </View>

                {/* Progress Bar */}
                <View style={styles.progressSection}>
                    <View style={styles.progressHeader}>
                        <Text style={styles.progressLabel}>Progress Hari Ini</Text>
                        <Text style={styles.progressPercent}>{progress}%</Text>
                    </View>
                    <View style={styles.progressBarBg}>
                        <View style={[styles.progressBarFill, { width: `${progress}%` }]} />
                    </View>
                    <Text style={styles.progressSubtext}>
                        {allCompleted ? '🎉 Semua tahapan selesai!' : `${Object.values(taskStatus).filter(t => t.completed).length} dari 3 tahapan selesai`}
                    </Text>
                </View>
            </View>

            {/* Content */}
            <ScrollView
                style={styles.content}
                contentContainerStyle={styles.scrollContent}
                showsVerticalScrollIndicator={false}
                refreshControl={
                    <RefreshControl refreshing={refreshing} onRefresh={handleRefresh} colors={['#349BE5']} />
                }
            >
                {loading ? (
                    <View style={styles.loadingContainer}>
                        <ActivityIndicator size="large" color="#0F172A" />
                        <Text style={styles.loadingText}>Memuat status laporan...</Text>
                    </View>
                ) : (
                    <>
                        <Text style={styles.sectionTitle}>Checklist Harian</Text>
                        <Text style={styles.sectionSubtitle}>Selesaikan semua tahapan untuk laporan harian yang lengkap</Text>

                        {/* Task 1: Pengeluaran */}
                        <TaskCard
                            title="Pencatatan Pengeluaran"
                            description="Catat semua pengeluaran operasional hari ini"
                            icon={TrendingDown}
                            iconColor="#2176AE"
                            iconBg="#E1F5FE"
                            completed={taskStatus.expense.completed}
                            onPress={() => navigation.navigate('ExpenseManagement')}
                            stats={taskStatus.expense.completed ?
                                `${taskStatus.expense.count} pengeluaran • ${formatCurrency(taskStatus.expense.total)}` :
                                'Belum ada pengeluaran tercatat'}
                        />

                        {/* Task 2: Deposit Lapak */}
                        <TaskCard
                            title="Pencatatan Deposit Lapak"
                            description="Catat deposit dari pelanggan lapak"
                            icon={Wallet}
                            iconColor="#2176AE"
                            iconBg="#E1F5FE"
                            completed={taskStatus.deposit.completed}
                            onPress={() => navigation.navigate('LapakDeposit')}
                            stats={taskStatus.deposit.completed ?
                                `${taskStatus.deposit.count} deposit • ${formatCurrency(taskStatus.deposit.total)}` :
                                'Belum ada deposit tercatat'}
                        />

                        {/* Task 3: Rekonsiliasi */}
                        <TaskCard
                            title="Rekonsiliasi Kas"
                            description="Cocokkan kas fisik dengan sistem"
                            icon={Calculator}
                            iconColor="#349BE5"
                            iconBg="#E1F5FE"
                            completed={taskStatus.reconciliation.completed}
                            onPress={() => navigation.navigate('CashReconciliation')}
                            stats={taskStatus.reconciliation.completed ?
                                `Selisih: ${formatCurrency(Math.abs(taskStatus.reconciliation.variance))}` :
                                'Belum melakukan rekonsiliasi'}
                        />

                        {/* Summary Card */}
                        {allCompleted && (
                            <View style={styles.summaryCard}>
                                <View style={[styles.summaryIcon, { backgroundColor: '#E1F5FE' }]}>
                                    <CheckCircle2 size={32} color="#10B981" />
                                </View>
                                <Text style={styles.summaryTitle}>Laporan Harian Selesai!</Text>
                                <Text style={styles.summaryText}>
                                    Semua tahapan laporan harian untuk tanggal {new Date(selectedDate).toLocaleDateString('id-ID')} telah diselesaikan.
                                </Text>
                                <View style={styles.summaryStats}>
                                    <View style={styles.summaryStatItem}>
                                        <Text style={styles.summaryStatLabel}>Total Pengeluaran</Text>
                                        <Text style={styles.summaryStatValue}>{formatCurrency(taskStatus.expense.total)}</Text>
                                    </View>
                                    <View style={styles.summaryDivider} />
                                    <View style={styles.summaryStatItem}>
                                        <Text style={styles.summaryStatLabel}>Total Deposit</Text>
                                        <Text style={styles.summaryStatValue}>{formatCurrency(taskStatus.deposit.total)}</Text>
                                    </View>
                                </View>
                            </View>
                        )}

                        {/* Reminder Card */}
                        {!allCompleted && (
                            <View style={styles.reminderCard}>
                                <AlertCircle size={20} color="#349BE5" />
                                <View style={styles.reminderContent}>
                                    <Text style={styles.reminderTitle}>Jangan Lupa!</Text>
                                    <Text style={styles.reminderText}>
                                        Selesaikan semua tahapan sebelum menutup kasir untuk memastikan laporan harian akurat.
                                    </Text>
                                </View>
                            </View>
                        )}

                        <View style={styles.footer}>
                            <Clock size={16} color="#94A3B8" />
                            <Text style={styles.footerText}>
                                Terakhir diperbarui: {new Date().toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit' })}
                            </Text>
                        </View>
                    </>
                )}
            </ScrollView>
        </View>
    );
};

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: '#F8FAFC',
    },
    header: {
        backgroundColor: '#349BE5',
        paddingTop: Platform.OS === 'android' && StatusBar ? (StatusBar.currentHeight || 0) + 10 : 60,
        paddingBottom: 25,
        paddingHorizontal: 20,
        borderBottomLeftRadius: 30,
        borderBottomRightRadius: 30,
    },
    headerTop: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        marginBottom: 20,
    },
    backBtn: {
        width: 40,
        height: 40,
        backgroundColor: 'rgba(255,255,255,0.15)',
        borderRadius: 12,
        alignItems: 'center',
        justifyContent: 'center',
    },
    headerTitle: {
        flex: 1,
        color: '#FFFFFF',
        fontSize: 18,
        fontWeight: '900',
        letterSpacing: 0.5,
        textAlign: 'center',
    },
    dateCard: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: '#FFFFFF',
        padding: 15,
        borderRadius: 15,
        marginBottom: 20,
        gap: 12,
    },
    dateInfo: {
        flex: 1,
    },
    dateLabel: {
        fontSize: 11,
        color: '#64748B',
        fontWeight: 'bold',
        marginBottom: 2,
    },
    dateValue: {
        fontSize: 14,
        color: '#1E293B',
        fontWeight: '800',
    },
    progressSection: {
        backgroundColor: 'rgba(255,255,255,0.1)',
        padding: 15,
        borderRadius: 15,
    },
    progressHeader: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: 10,
    },
    progressLabel: {
        color: '#FFFFFF',
        fontSize: 13,
        fontWeight: 'bold',
    },
    progressPercent: {
        color: '#FFFFFF',
        fontSize: 20,
        fontWeight: '900',
    },
    progressBarBg: {
        height: 8,
        backgroundColor: 'rgba(255,255,255,0.2)',
        borderRadius: 10,
        overflow: 'hidden',
        marginBottom: 8,
    },
    progressBarFill: {
        height: '100%',
        backgroundColor: '#349BE5',
        borderRadius: 10,
    },
    progressSubtext: {
        color: 'rgba(255,255,255,0.8)',
        fontSize: 12,
        fontWeight: '600',
    },
    content: {
        flex: 1,
    },
    scrollContent: {
        padding: 20,
        paddingBottom: 40,
    },
    loadingContainer: {
        alignItems: 'center',
        justifyContent: 'center',
        paddingVertical: 60,
    },
    loadingText: {
        marginTop: 15,
        fontSize: 14,
        color: '#64748B',
        fontWeight: '600',
    },
    sectionTitle: {
        fontSize: 18,
        fontWeight: '900',
        color: '#1E293B',
        marginBottom: 5,
    },
    sectionSubtitle: {
        fontSize: 13,
        color: '#64748B',
        marginBottom: 20,
        lineHeight: 18,
    },
    taskCard: {
        backgroundColor: '#FFFFFF',
        borderRadius: 20,
        padding: 16,
        marginBottom: 12,
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        borderWidth: 1,
        borderColor: '#F1F5F9',
    },
    taskCardCompleted: {
        borderColor: '#D1FAE5',
        backgroundColor: '#FAFFFE',
    },
    taskCardLeft: {
        flexDirection: 'row',
        alignItems: 'center',
        flex: 1,
        gap: 12,
    },
    taskIconWrap: {
        width: 50,
        height: 50,
        borderRadius: 15,
        alignItems: 'center',
        justifyContent: 'center',
    },
    taskInfo: {
        flex: 1,
    },
    taskTitle: {
        fontSize: 15,
        fontWeight: '900',
        color: '#1E293B',
        marginBottom: 3,
    },
    taskDesc: {
        fontSize: 12,
        color: '#64748B',
        marginBottom: 4,
    },
    taskStats: {
        fontSize: 11,
        color: '#0F172A',
        fontWeight: '700',
    },
    taskCardRight: {
        alignItems: 'center',
        gap: 5,
    },
    chevron: {
        marginTop: 2,
    },
    summaryCard: {
        backgroundColor: '#ECFDF5',
        borderRadius: 20,
        padding: 20,
        marginTop: 10,
        marginBottom: 15,
        borderWidth: 1,
        borderColor: '#D1FAE5',
        alignItems: 'center',
    },
    summaryIcon: {
        marginBottom: 12,
    },
    summaryTitle: {
        fontSize: 18,
        fontWeight: '900',
        color: '#10B981',
        marginBottom: 8,
    },
    summaryText: {
        fontSize: 13,
        color: '#064E3B',
        textAlign: 'center',
        lineHeight: 20,
        marginBottom: 20,
    },
    summaryStats: {
        flexDirection: 'row',
        width: '100%',
        gap: 15,
    },
    summaryStatItem: {
        flex: 1,
        alignItems: 'center',
    },
    summaryStatLabel: {
        fontSize: 11,
        color: '#059669',
        fontWeight: 'bold',
        marginBottom: 5,
    },
    summaryStatValue: {
        fontSize: 14,
        fontWeight: '900',
        color: '#064E3B',
    },
    summaryDivider: {
        width: 1,
        backgroundColor: '#A7F3D0',
    },
    reminderCard: {
        backgroundColor: '#E1F5FE',
        borderRadius: 15,
        padding: 15,
        marginTop: 10,
        flexDirection: 'row',
        gap: 12,
        borderWidth: 1,
        borderColor: '#B3E5FC',
    },
    reminderContent: {
        flex: 1,
    },
    reminderTitle: {
        fontSize: 14,
        fontWeight: '900',
        color: '#075985',
        marginBottom: 4,
    },
    reminderText: {
        fontSize: 12,
        color: '#0369A1',
        lineHeight: 18,
    },
    footer: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        gap: 8,
        marginTop: 30,
        paddingTop: 20,
        borderTopWidth: 1,
        borderTopColor: '#F1F5F9',
    },
    footerText: {
        fontSize: 12,
        color: '#94A3B8',
        fontWeight: '600',
    },
});

export default DailyReport;
