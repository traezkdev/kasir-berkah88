import React from 'react';
import { View, Text, StyleSheet, FlatList, Image, TouchableOpacity, SafeAreaView, StatusBar, Platform, ScrollView } from 'react-native';
import { Search, MoreVertical, Phone, Calendar, Grid, Heart, ArrowUpRight, ArrowDownLeft, Video, Plus, PhoneCall, MessageSquare, CircleDashed, Users } from 'lucide-react-native';
import { scale, verticalScale, moderateScale } from '../utils/responsive';
import dayjs from 'dayjs';

const CallsScreen = ({ navigation }) => {
    const callHistory = [
        { id: '1', name: 'Teh Ika', time: 'Kemarin 22.26', type: 'audio', status: 'incoming', count: 0, avatar: 'https://i.pravatar.cc/150?u=ika' },
        { id: '2', name: '❤️', time: 'Kemarin 20.35', type: 'video', status: 'outgoing', count: 3, avatar: 'https://i.pravatar.cc/150?u=heart' },
        { id: '3', name: '❤️', time: '26 Februari 22.41', type: 'audio', status: 'outgoing', count: 0, avatar: 'https://i.pravatar.cc/150?u=heart2' },
        { id: '4', name: 'Anomali Sandi', time: '26 Februari 20.58', type: 'audio', status: 'outgoing', count: 0, avatar: 'https://i.pravatar.cc/150?u=sandi' },
        { id: '5', name: '❤️', time: '26 Februari 17.28', type: 'video', status: 'incoming', count: 0, avatar: 'https://i.pravatar.cc/150?u=heart3' },
        { id: '6', name: '❤️', time: '26 Februari 02.53', type: 'audio', status: 'incoming', count: 0, avatar: 'https://i.pravatar.cc/150?u=heart4' },
        { id: '7', name: '❤️', time: '25 Februari 20.58', type: 'video', status: 'outgoing', count: 5, avatar: 'https://i.pravatar.cc/150?u=heart5' },
        { id: '8', name: '❤️', time: '24 Februari 22.29', type: 'video', status: 'outgoing', count: 2, avatar: 'https://i.pravatar.cc/150?u=heart6' },
    ];

    const QuickAction = ({ icon: Icon, label }) => (
        <TouchableOpacity style={styles.quickActionContainer}>
            <View style={styles.quickActionCircle}>
                <Icon size={24} color="#444" />
            </View>
            <Text style={styles.quickActionLabel}>{label}</Text>
        </TouchableOpacity>
    );

    const CallItem = ({ item }) => (
        <View style={styles.callRow}>
            <Image source={{ uri: item.avatar }} style={styles.avatar} />
            <View style={styles.callInfo}>
                <Text style={styles.name} numberOfLines={1}>
                    {item.name} {item.count > 0 && `(${item.count})`}
                </Text>
                <View style={styles.statusRow}>
                    {item.status === 'incoming' ? (
                        <ArrowDownLeft size={16} color="#1DAB61" style={styles.statusIcon} />
                    ) : (
                        <ArrowUpRight size={16} color="#1DAB61" style={styles.statusIcon} />
                    )}
                    <Text style={styles.time}>{item.time}</Text>
                </View>
            </View>
            <TouchableOpacity style={styles.callTypeBtn}>
                {item.type === 'video' ? (
                    <Video size={24} color="#111B21" />
                ) : (
                    <Phone size={24} color="#111B21" />
                )}
            </TouchableOpacity>
        </View>
    );

    return (
        <SafeAreaView style={styles.container}>
            <StatusBar barStyle="dark-content" backgroundColor="#fff" />

            {/* Header */}
            <View style={styles.header}>
                <Text style={styles.headerTitle}>Panggilan</Text>
                <View style={styles.headerIcons}>
                    <TouchableOpacity style={styles.iconBtn}>
                        <Search size={24} color="#111B21" />
                    </TouchableOpacity>
                    <TouchableOpacity style={styles.iconBtn}>
                        <MoreVertical size={24} color="#111B21" />
                    </TouchableOpacity>
                </View>
            </View>

            <ScrollView showsVerticalScrollIndicator={false}>
                {/* Quick Actions */}
                <View style={styles.quickActionsRow}>
                    <QuickAction icon={Phone} label="Telepon" />
                    <QuickAction icon={Calendar} label="Jadwal" />
                    <QuickAction icon={Grid} label="Keypad" />
                    <QuickAction icon={Heart} label="Favorit" />
                </View>

                {/* Section Title */}
                <Text style={styles.sectionTitle}>Terbaru</Text>

                {/* Call List */}
                {callHistory.map(item => (
                    <CallItem key={item.id} item={item} />
                ))}

                {/* Bottom detail for list end */}
                <View style={{ height: verticalScale(100) }} />
            </ScrollView>

            {/* Floating Action Button */}
            <TouchableOpacity style={styles.fab}>
                <PhoneCall size={24} color="#fff" />
                <View style={styles.fabPlus}>
                    <Plus size={12} color="#fff" />
                </View>
            </TouchableOpacity>

            {/* Bottom Nav Synchronized with ChatListScreen */}
            <View style={styles.waBottomNav}>
                <TouchableOpacity style={styles.waNavItem} onPress={() => navigation.navigate('Main')}>
                    <View style={styles.waIconContainer}>
                        <MessageSquare size={22} color="#444" />
                    </View>
                    <Text style={styles.waNavItemText}>Chat</Text>
                </TouchableOpacity>
                <TouchableOpacity style={styles.waNavItem}>
                    <View style={styles.waIconContainer}>
                        <CircleDashed size={22} color="#444" />
                    </View>
                    <Text style={styles.waNavItemText}>Pembaruan</Text>
                </TouchableOpacity>
                <TouchableOpacity style={styles.waNavItem}>
                    <View style={styles.waIconContainer}>
                        <Users size={22} color="#444" />
                    </View>
                    <Text style={styles.waNavItemText}>Komunitas</Text>
                </TouchableOpacity>
                <TouchableOpacity style={styles.waNavItem}>
                    <View style={[styles.waIconContainer, styles.waNavItemIconActive]}>
                        <Phone size={22} color="#000" />
                    </View>
                    <Text style={styles.waNavItemTextActive}>Panggilan</Text>
                </TouchableOpacity>
            </View>
        </SafeAreaView>
    );
};

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: '#fff',
    },
    header: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        paddingHorizontal: scale(16),
        paddingTop: Platform.OS === 'android' ? verticalScale(10) : 0,
        height: verticalScale(60),
    },
    headerTitle: {
        fontSize: moderateScale(22),
        fontWeight: '500',
        color: '#111B21',
    },
    headerIcons: {
        flexDirection: 'row',
    },
    iconBtn: {
        marginLeft: scale(18),
    },
    quickActionsRow: {
        flexDirection: 'row',
        justifyContent: 'space-around',
        paddingVertical: verticalScale(20),
        paddingHorizontal: scale(10),
    },
    quickActionContainer: {
        alignItems: 'center',
        width: scale(80),
    },
    quickActionCircle: {
        width: scale(56),
        height: scale(56),
        borderRadius: scale(28),
        backgroundColor: '#F0F2F5',
        justifyContent: 'center',
        alignItems: 'center',
        marginBottom: verticalScale(8),
    },
    quickActionLabel: {
        fontSize: moderateScale(13),
        color: '#666',
    },
    sectionTitle: {
        fontSize: moderateScale(17),
        fontWeight: 'bold',
        color: '#111B21',
        paddingHorizontal: scale(16),
        marginTop: verticalScale(10),
        marginBottom: verticalScale(15),
    },
    callRow: {
        flexDirection: 'row',
        paddingHorizontal: scale(16),
        paddingVertical: verticalScale(12),
        alignItems: 'center',
    },
    avatar: {
        width: scale(52),
        height: scale(52),
        borderRadius: scale(26),
        marginRight: scale(15),
        backgroundColor: '#F0F2F5',
    },
    callInfo: {
        flex: 1,
        justifyContent: 'center',
    },
    name: {
        fontSize: moderateScale(16),
        fontWeight: '600',
        color: '#111B21',
        marginBottom: verticalScale(2),
    },
    statusRow: {
        flexDirection: 'row',
        alignItems: 'center',
    },
    statusIcon: {
        marginRight: scale(4),
    },
    time: {
        fontSize: moderateScale(14),
        color: '#666',
    },
    callTypeBtn: {
        padding: scale(10),
    },
    fab: {
        position: 'absolute',
        bottom: verticalScale(100),
        right: scale(20),
        width: scale(60),
        height: scale(60),
        borderRadius: scale(18),
        backgroundColor: '#005D4B',
        justifyContent: 'center',
        alignItems: 'center',
        elevation: 5,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.3,
        shadowRadius: 3,
    },
    fabPlus: {
        position: 'absolute',
        top: scale(16),
        right: scale(16),
    },
    waBottomNav: {
        flexDirection: 'row',
        paddingBottom: verticalScale(10),
        paddingTop: verticalScale(10),
        borderTopWidth: 1,
        borderTopColor: '#F0F2F5',
        backgroundColor: '#fff',
    },
    waNavItem: {
        flex: 1,
        alignItems: 'center',
    },
    waIconContainer: {
        height: verticalScale(30),
        justifyContent: 'center',
        alignItems: 'center',
        minWidth: scale(56),
    },
    waNavItemIconActive: {
        backgroundColor: '#E7FFEB',
        borderRadius: scale(15),
    },
    waNavItemText: {
        fontSize: moderateScale(12),
        color: '#444',
        marginTop: verticalScale(4),
    },
    waNavItemTextActive: {
        fontSize: moderateScale(12),
        fontWeight: 'bold',
        color: '#000',
        marginTop: verticalScale(4),
    },
});

export default CallsScreen;
