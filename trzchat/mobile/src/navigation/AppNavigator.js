import React from 'react';
import { NavigationContainer } from '@react-navigation/native';
import { createStackNavigator } from '@react-navigation/stack';
import { createDrawerNavigator } from '@react-navigation/drawer';
import { View, Text, StyleSheet, Image, TouchableOpacity } from 'react-native';
import { User, Users, Settings, Phone, Bookmark, Moon, Sun, LogOut } from 'lucide-react-native';
import axios from 'axios';
import { API_URL } from '../config/api';
import { removeToken } from '../utils/auth';

import WelcomeScreen from '../screens/WelcomeScreen';
import LoginScreen from '../screens/LoginScreen';
import RegisterScreen from '../screens/RegisterScreen';
import ChatListScreen from '../screens/ChatListScreen';
import ChatDetailScreen from '../screens/ChatDetailScreen';
import ProfileScreen from '../screens/ProfileScreen';

const Stack = createStackNavigator();
const Drawer = createDrawerNavigator();

const CustomDrawerContent = (props) => {
    const [user, setUser] = React.useState(null);

    React.useEffect(() => {
        const fetchUserData = async () => {
            try {
                const response = await axios.get(`${API_URL}/users/profile`);
                setUser(response.data);
            } catch (error) {
                console.error('Error fetching drawer user data:', error);
            }
        };
        fetchUserData();
    }, []);

    const handleLogout = async () => {
        await removeToken();
        props.navigation.reset({
            index: 0,
            routes: [{ name: 'Welcome' }],
        });
    };

    return (
        <View style={styles.drawerContainer}>
            <View style={styles.drawerHeader}>
                <Image
                    source={{ uri: user?.avatar || 'https://i.pravatar.cc/150?u=me' }}
                    style={styles.profileImage}
                />
                <View style={styles.headerTextContainer}>
                    <Text style={styles.profileName}>{user?.full_name || 'User Vira Chat'}</Text>
                    <Text style={styles.profilePhone}>@{user?.username || 'username'}</Text>
                </View>
                <TouchableOpacity style={styles.themeToggle}>
                    <Moon size={22} color="#fff" />
                </TouchableOpacity>
            </View>

            <View style={styles.drawerItems}>
                <DrawerItem
                    icon={<User size={22} color="#777" />}
                    label="Profil Saya"
                    onPress={() => props.navigation.navigate('Profile')}
                />
                <DrawerItem icon={<Users size={22} color="#777" />} label="Grup Baru" />
                <DrawerItem icon={<Phone size={22} color="#777" />} label="Panggilan" />
                <DrawerItem icon={<Bookmark size={22} color="#777" />} label="Pesan Tersimpan" />
                <DrawerItem icon={<Settings size={22} color="#777" />} label="Pengaturan" />
            </View>

            <View style={styles.drawerFooter}>
                <TouchableOpacity
                    style={styles.logoutButton}
                    onPress={handleLogout}
                >
                    <LogOut size={20} color="#FF3B30" />
                    <Text style={styles.logoutText}>Keluar</Text>
                </TouchableOpacity>
            </View>
        </View>
    );
};

const DrawerItem = ({ icon, label, onPress }) => (
    <TouchableOpacity style={styles.drawerItem} onPress={onPress}>
        {icon}
        <Text style={styles.drawerLabel}>{label}</Text>
    </TouchableOpacity>
);

const MainDrawer = () => (
    <Drawer.Navigator
        drawerContent={(props) => <CustomDrawerContent {...props} />}
        screenOptions={{
            headerShown: false,
            drawerStyle: { width: '80%' }
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
                screenOptions={{
                    headerShown: false,
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
        backgroundColor: '#fff',
    },
    drawerHeader: {
        backgroundColor: '#0088cc',
        paddingTop: 50,
        paddingBottom: 20,
        paddingHorizontal: 20,
    },
    profileImage: {
        width: 70,
        height: 70,
        borderRadius: 35,
        borderWidth: 2,
        borderColor: 'rgba(255,255,255,0.3)',
    },
    headerTextContainer: {
        marginTop: 15,
    },
    profileName: {
        color: '#fff',
        fontSize: 18,
        fontWeight: 'bold',
    },
    profilePhone: {
        color: 'rgba(255,255,255,0.7)',
        fontSize: 14,
        marginTop: 2,
    },
    themeToggle: {
        position: 'absolute',
        top: 50,
        right: 20,
    },
    drawerItems: {
        marginTop: 15,
        paddingHorizontal: 10,
    },
    drawerItem: {
        flexDirection: 'row',
        alignItems: 'center',
        paddingVertical: 15,
        paddingHorizontal: 15,
        borderRadius: 8,
    },
    drawerLabel: {
        marginLeft: 25,
        fontSize: 15,
        color: '#333',
        fontWeight: '600',
    },
    drawerFooter: {
        marginTop: 'auto',
        borderTopWidth: 1,
        borderTopColor: '#f0f0f0',
        padding: 20,
    },
    logoutButton: {
        flexDirection: 'row',
        alignItems: 'center',
    },
    logoutText: {
        marginLeft: 20,
        fontSize: 15,
        color: '#FF3B30',
        fontWeight: 'bold',
    }
});

export default AppNavigator;
