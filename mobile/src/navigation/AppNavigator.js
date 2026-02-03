import React from 'react';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { NavigationContainer } from '@react-navigation/native';
import {
    Home,
    ClipboardList,
    User,
    Store,
    LayoutDashboard,
    ShoppingBag,
    ShoppingCart,
    Utensils,
    History
} from 'lucide-react-native';
import { useAuth } from '../context/AuthContext';

// Screens
import CustomerDashboard from '../screens/customer/Dashboard';
import SellerDashboard from '../screens/seller/Dashboard';
import OrderManagement from '../screens/seller/OrderManagement';
import MenuManagement from '../screens/seller/MenuManagement';
import TransactionHistory from '../screens/seller/TransactionHistory';
import SalesPOS from '../screens/seller/SalesPOS';
import { View, Text, TouchableOpacity } from 'react-native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';

const Tab = createBottomTabNavigator();
const Stack = createNativeStackNavigator();

const SellerStack = () => (
    <Stack.Navigator screenOptions={{ headerShown: false }}>
        <Stack.Screen name="SellerDashboard" component={SellerDashboard} />
        <Stack.Screen name="OrderManagement" component={OrderManagement} />
        <Stack.Screen name="MenuManagement" component={MenuManagement} />
        <Stack.Screen name="TransactionHistory" component={TransactionHistory} />
        <Stack.Screen name="SalesPOS" component={SalesPOS} />
    </Stack.Navigator>
);

const ProfilePlaceholder = () => {
    const { logout, user } = useAuth();
    return (
        <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: '#F8FAFC' }}>
            <View style={{ backgroundColor: '#FFFFFF', padding: 30, borderRadius: 20, alignItems: 'center', width: '80%', borderWidth: 1, borderColor: '#E2E8F0' }}>
                <View style={{ width: 80, height: 80, backgroundColor: '#138FEA', borderRadius: 40, justifyContent: 'center', alignItems: 'center', marginBottom: 20 }}>
                    <User color="#FFFFFF" size={40} />
                </View>
                <Text style={{ fontSize: 24, fontWeight: 'bold', color: '#1E293B' }}>{user?.name}</Text>
                <Text style={{ fontSize: 14, color: '#64748B', marginBottom: 30 }}>Role: {user?.role}</Text>

                <TouchableOpacity
                    onPress={logout}
                    style={{ backgroundColor: '#EF4444', paddingVertical: 12, paddingHorizontal: 40, borderRadius: 12 }}
                >
                    <Text style={{ color: '#FFFFFF', fontWeight: 'bold' }}>Keluar Akun</Text>
                </TouchableOpacity>
            </View>
        </View>
    );
};

const AppNavigator = () => {
    const { user } = useAuth();

    // Tentukan Dashboard berdasarkan Role
    const isSeller = user?.role === 'penjual' || user?.role === 'admin' || user?.role === 'seller';

    if (isSeller) {
        return (
            <NavigationContainer>
                <Tab.Navigator
                    screenOptions={({ route }) => ({
                        headerShown: false,
                        tabBarStyle: {
                            height: 75,
                            paddingBottom: 15,
                            paddingTop: 10,
                            backgroundColor: '#FFFFFF',
                            borderTopWidth: 1,
                            borderTopColor: '#F1F5F9',
                        },
                        tabBarActiveTintColor: '#138FEA',
                        tabBarInactiveTintColor: '#94A3B8',
                        tabBarLabelStyle: {
                            fontSize: 9,
                            fontWeight: '900',
                            textTransform: 'uppercase',
                            letterSpacing: -0.5,
                        },
                        tabBarIcon: ({ color, size, focused }) => {
                            const iconProps = { size, color, strokeWidth: focused ? 2.5 : 2 };
                            if (route.name === 'Dashboard') return <LayoutDashboard {...iconProps} />;
                            if (route.name === 'Pesanan') return <ShoppingBag {...iconProps} />;
                            if (route.name === 'Jual') return <ShoppingCart {...iconProps} />;
                            if (route.name === 'Katalog') return <Utensils {...iconProps} />;
                            if (route.name === 'Transaksi') return <History {...iconProps} />;
                            return null;
                        },
                    })}
                >
                    <Tab.Screen name="Dashboard" component={SellerDashboard} />
                    <Tab.Screen name="Pesanan" component={OrderManagement} />
                    <Tab.Screen name="Jual" component={SalesPOS} />
                    <Tab.Screen name="Katalog" component={MenuManagement} />
                    <Tab.Screen name="Transaksi" component={TransactionHistory} />
                </Tab.Navigator>
            </NavigationContainer>
        );
    }

    return (
        <NavigationContainer>
            <Tab.Navigator
                screenOptions={({ route }) => ({
                    headerShown: false,
                    tabBarStyle: {
                        height: 70,
                        paddingBottom: 10,
                        paddingTop: 10,
                        backgroundColor: '#FFFFFF',
                        borderTopWidth: 1,
                        borderTopColor: '#F1F5F9',
                    },
                    tabBarActiveTintColor: '#138FEA',
                    tabBarInactiveTintColor: '#94A3B8',
                    tabBarIcon: ({ color, size }) => {
                        if (route.name === 'Home') return <Home size={size} color={color} />;
                        if (route.name === 'Orders') return <ClipboardList size={size} color={color} />;
                        if (route.name === 'Profile') return <User size={size} color={color} />;
                        return null;
                    },
                })}
            >
                <Tab.Screen
                    name="Home"
                    component={CustomerDashboard}
                    options={{ tabBarLabel: 'Belanja' }}
                />

                <Tab.Screen
                    name="Orders"
                    component={() => (
                        <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }}>
                            <Text>Halaman Riwayat Pesanan (Segera Hadir)</Text>
                        </View>
                    )}
                    options={{ tabBarLabel: 'Pesanan' }}
                />

                <Tab.Screen name="Profile" component={ProfilePlaceholder} />
            </Tab.Navigator>
        </NavigationContainer>
    );
};

export default AppNavigator;
