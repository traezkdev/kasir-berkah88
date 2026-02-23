import React from 'react';
import { NavigationContainer, useIsFocused } from '@react-navigation/native';
import { createStackNavigator, CardStyleInterpolators } from '@react-navigation/stack';
import { createDrawerNavigator } from '@react-navigation/drawer';
import { View, Text, StyleSheet, Image, TouchableOpacity, Platform } from 'react-native';
import { User, Users, Settings, Phone, Bookmark, Moon, Sun, LogOut } from 'lucide-react-native';
import axios from 'axios';
import { API_URL, fixUrl } from '../config/api';
import { removeToken } from '../utils/auth';

import WelcomeScreen from '../screens/WelcomeScreen';
import LoginScreen from '../screens/LoginScreen';
import RegisterScreen from '../screens/RegisterScreen';
import ChatListScreen from '../screens/ChatListScreen';
import ChatDetailScreen from '../screens/ChatDetailScreen';
import ProfileScreen from '../screens/ProfileScreen';

const Stack = createStackNavigator();
const Drawer = createDrawerNavigator();

const FAST_TRANSITION = {
    animation: 'timing',
    config: {
        duration: 200,
    },
};

import { LinearGradient } from 'expo-linear-gradient';

const CustomDrawerContent = (props) => {
    const [user, setUser] = React.useState(null);
    const isFocused = useIsFocused();

    React.useEffect(() => {
        const syncUserData = async () => {
            try {
                const { getToken, getUser, setUser: saveUser } = require('../utils/auth');
                const cachedUser = await getUser();
                if (cachedUser) {
                    const processed = { ...cachedUser };
                    if (processed.avatar) processed.avatar = fixUrl(processed.avatar);
                    setUser(processed);
                }

                const token = await getToken();
                if (!token) return;

                const response = await axios.get(`${API_URL}/users/profile`, {
                    headers: { 'Authorization': `Bearer ${token}` }
                });

                const serverUser = response.data;
                if (serverUser.avatar) serverUser.avatar = fixUrl(serverUser.avatar);
                await saveUser(serverUser);
                setUser(serverUser);
            } catch (error) {
                console.error('Error syncing drawer data:', error);
            }
        };

        if (isFocused) {
            syncUserData();
        }
    }, [isFocused]);

    const handleLogout = async () => {
        await removeToken();
        props.navigation.reset({
            index: 0,
            routes: [{ name: 'Welcome' }],
        });
    };

    return (
        <View style={styles.drawerContainer}>
            <LinearGradient
                colors={['#6366F1', '#8B5CF6']}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 1 }}
                style={styles.drawerHeader}
            >
                <View style={styles.profileImageWrapper}>
                    <Image
                        source={{
                            uri: user?.avatar || 'https://ui-avatars.com/api/?name=' + (user?.full_name || 'User'),
                            cache: 'force-cache'
                        }}
                        style={styles.profileImage}
                    />
                    <View style={styles.onlineIndicator} />
                </View>
                <View style={styles.headerTitleGroup}>
                    <Text style={styles.profileName} numberOfLines={1}>{user?.full_name || 'Vira User'}</Text>
                    <Text style={styles.profilePhone}>@{user?.username || 'user'}</Text>
                </View>
            </LinearGradient>

            <View style={styles.drawerItemsContainer}>
                <DrawerItem
                    icon={<View style={[styles.iconBox, { backgroundColor: '#EEF2FF' }]}><User size={20} color="#6366F1" /></View>}
                    label="Profil Saya"
                    onPress={() => props.navigation.navigate('Profile')}
                />
                <DrawerItem
                    icon={<View style={[styles.iconBox, { backgroundColor: '#F5F3FF' }]}><Users size={20} color="#8B5CF6" /></View>}
                    label="Grup Baru"
                />
                <DrawerItem
                    icon={<View style={[styles.iconBox, { backgroundColor: '#FFF1F2' }]}><Bookmark size={20} color="#F43F5E" /></View>}
                    label="Pesan Tersimpan"
                />
                <DrawerItem
                    icon={<View style={[styles.iconBox, { backgroundColor: '#F0FDF4' }]}><Settings size={20} color="#22C55E" /></View>}
                    label="Pengaturan"
                />
                <DrawerItem
                    icon={<View style={[styles.iconBox, { backgroundColor: '#FFFBEB' }]}><Phone size={20} color="#F59E0B" /></View>}
                    label="Bantuan"
                />
            </View>

            <View style={styles.drawerFooter}>
                <TouchableOpacity
                    style={styles.logoutButton}
                    onPress={handleLogout}
                >
                    <View style={styles.logoutIconBox}>
                        <LogOut size={18} color="#EF4444" />
                    </View>
                    <Text style={styles.logoutText}>Keluar Aplikasi</Text>
                </TouchableOpacity>
                <Text style={styles.versionText}>Vira Chat v1.0.5</Text>
            </View>
        </View>
    );
};

const DrawerItem = ({ icon, label, onPress }) => (
    <TouchableOpacity style={styles.drawerItem} onPress={onPress} activeOpacity={0.7}>
        <View style={styles.drawerItemLeft}>
            {icon}
            <Text style={styles.drawerLabel}>{label}</Text>
        </View>
        <View style={styles.drawerItemArrow} />
    </TouchableOpacity>
);

const MainDrawer = () => (
    <Drawer.Navigator
        drawerContent={(props) => <CustomDrawerContent {...props} />}
        screenOptions={{
            headerShown: false,
            drawerStyle: { width: '85%', borderTopRightRadius: 25, borderBottomRightRadius: 25 },
            drawerType: 'front',
            swipeEdgeWidth: 100,
            overlayColor: 'rgba(0,0,0,0.5)',
        }}
    >
        <Drawer.Screen name="ChatList" component={ChatListScreen} />
    </Drawer.Navigator>
);

const AppNavigator = () => {
    return (
        <NavigationContainer>
            <Stack.Navigator
                initialRouteName="Welcome"
                detachInactiveScreens={true}
                screenOptions={{
                    headerShown: false,
                    gestureEnabled: true,
                    cardStyleInterpolator: CardStyleInterpolators.forHorizontalIOS,
                    transitionSpec: {
                        open: FAST_TRANSITION,
                        close: FAST_TRANSITION,
                    },
                }}
            >
                <Stack.Screen name="Welcome" component={WelcomeScreen} />
                <Stack.Screen name="Login" component={LoginScreen} />
                <Stack.Screen name="Register" component={RegisterScreen} />
                <Stack.Screen name="Main" component={MainDrawer} />
                <Stack.Screen name="ChatDetail" component={ChatDetailScreen} />
                <Stack.Screen name="Profile" component={ProfileScreen} />
            </Stack.Navigator>
        </NavigationContainer>
    );
};

const styles = StyleSheet.create({
    drawerContainer: {
        flex: 1,
        backgroundColor: '#FCFCFD',
    },
    drawerHeader: {
        paddingTop: 60,
        paddingBottom: 30,
        paddingHorizontal: 25,
        borderBottomRightRadius: 30,
    },
    profileImageWrapper: {
        position: 'relative',
        width: 80,
        height: 80,
    },
    profileImage: {
        width: 80,
        height: 80,
        borderRadius: 24,
        borderWidth: 3,
        borderColor: 'rgba(255,255,255,0.4)',
    },
    onlineIndicator: {
        position: 'absolute',
        bottom: 2,
        right: 2,
        width: 18,
        height: 18,
        borderRadius: 9,
        backgroundColor: '#22C55E',
        borderWidth: 3,
        borderColor: '#6366F1',
    },
    headerTitleGroup: {
        marginTop: 20,
    },
    profileName: {
        color: '#fff',
        fontSize: 22,
        fontWeight: '800',
        letterSpacing: 0.5,
    },
    profilePhone: {
        color: 'rgba(255,255,255,0.8)',
        fontSize: 14,
        fontWeight: '500',
        marginTop: 2,
    },
    drawerItemsContainer: {
        marginTop: 25,
        paddingHorizontal: 15,
    },
    drawerItem: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        paddingVertical: 12,
        paddingHorizontal: 10,
        borderRadius: 16,
        marginBottom: 4,
    },
    drawerItemLeft: {
        flexDirection: 'row',
        alignItems: 'center',
    },
    iconBox: {
        width: 42,
        height: 42,
        borderRadius: 12,
        justifyContent: 'center',
        alignItems: 'center',
    },
    drawerLabel: {
        marginLeft: 16,
        fontSize: 16,
        color: '#1F2937',
        fontWeight: '600',
    },
    drawerFooter: {
        marginTop: 'auto',
        padding: 25,
        borderTopWidth: 1,
        borderTopColor: '#F3F4F6',
    },
    logoutButton: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: '#FEF2F2',
        padding: 14,
        borderRadius: 16,
    },
    logoutIconBox: {
        width: 32,
        height: 32,
        borderRadius: 10,
        backgroundColor: '#fff',
        justifyContent: 'center',
        alignItems: 'center',
    },
    logoutText: {
        marginLeft: 15,
        fontSize: 15,
        color: '#EF4444',
        fontWeight: '700',
    },
    versionText: {
        textAlign: 'center',
        marginTop: 15,
        fontSize: 12,
        color: '#9CA3AF',
        fontWeight: '500',
    }
});

export default AppNavigator;
