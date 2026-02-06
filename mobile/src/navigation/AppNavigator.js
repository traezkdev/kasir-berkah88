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
    History,
    MessageCircle,
    Search
} from 'lucide-react-native';
import NewOrderPopup from '../components/NewOrderPopup';
import { useAuth } from '../context/AuthContext';
import { useOrderNotification } from '../context/OrderNotificationContext';
import { useChat } from '../context/ChatContext';
import { useConfirm } from '../context/ConfirmContext';

// Screens
import ChatScreen from '../screens/seller/ChatScreen';
import ProfileScreen from '../screens/seller/ProfileScreen';
import CustomerDashboard from '../screens/customer/Dashboard';
import SellerDashboard from '../screens/seller/Dashboard';
import OrderManagement from '../screens/seller/OrderManagement';
import MenuManagement from '../screens/seller/MenuManagement';
import TransactionHistory from '../screens/seller/TransactionHistory';
import SalesPOS from '../screens/seller/SalesPOS';
import Banners from '../screens/seller/Banners';
import CategoryManagement from '../screens/seller/CategoryManagement';
import CustomerDetails from '../screens/seller/CustomerDetails';
import PointManagement from '../screens/seller/PointManagement';

// Customer Screens
import CustomerMenu from '../screens/customer/Menu';
import CustomerCart from '../screens/customer/Cart';
import OrderHistory from '../screens/customer/OrderHistory';
import OrderDetails from '../screens/customer/OrderDetails';
import CustomerProfile from '../screens/customer/CustomerProfile';
import PointsHistory from '../screens/customer/PointsHistory';
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
        <Stack.Screen name="ChatScreen" component={ChatScreen} />
    </Stack.Navigator>
);

const ProfilePlaceholder = () => {
    const { logout, user } = useAuth();
    const { confirm } = useConfirm();

    const handleLogout = async () => {
        const accepted = await confirm({
            title: 'Keluar Akun',
            message: 'Apakah Anda yakin ingin keluar dari akun Anda?',
            confirmText: 'Ya, Keluar',
            type: 'danger'
        });
        if (accepted) logout();
    };

    return (
        <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: '#F8FAFC' }}>
            <View style={{ backgroundColor: '#FFFFFF', padding: 30, borderRadius: 20, alignItems: 'center', width: '80%', borderWidth: 1, borderColor: '#E2E8F0' }}>
                <View style={{ width: 80, height: 80, backgroundColor: '#138FEA', borderRadius: 40, justifyContent: 'center', alignItems: 'center', marginBottom: 20 }}>
                    <User color="#FFFFFF" size={40} />
                </View>
                <Text style={{ fontSize: 24, fontWeight: 'bold', color: '#1E293B' }}>{user?.name}</Text>
                <Text style={{ fontSize: 14, color: '#64748B', marginBottom: 30 }}>Role: {user?.role}</Text>

                <TouchableOpacity
                    onPress={handleLogout}
                    style={{ backgroundColor: '#EF4444', paddingVertical: 12, paddingHorizontal: 40, borderRadius: 12 }}
                >
                    <Text style={{ color: '#FFFFFF', fontWeight: 'bold' }}>Keluar Akun</Text>
                </TouchableOpacity>
            </View>
        </View>
    );
};

const SellerTabs = () => {
    const { pendingCount } = useOrderNotification();
    const { unreadCount } = useChat();

    return (
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
            <Tab.Screen
                name="Pesanan"
                component={OrderManagement}
                options={{
                    tabBarBadge: pendingCount > 0 ? pendingCount : null,
                    tabBarBadgeStyle: { backgroundColor: '#EF4444', color: '#FFFFFF' }
                }}
            />
            <Tab.Screen name="Jual" component={SalesPOS} />
            <Tab.Screen name="Katalog" component={MenuManagement} />
            <Tab.Screen name="Transaksi" component={TransactionHistory} />
        </Tab.Navigator>
    );
};

const SellerRootStack = () => (
    <Stack.Navigator screenOptions={{ headerShown: false }}>
        <Stack.Screen name="MainTabs" component={SellerTabs} />
        <Stack.Screen name="ChatScreen" component={ChatScreen} />
        <Stack.Screen name="ProfileScreen" component={ProfileScreen} />
        <Stack.Screen name="Banners" component={Banners} />
        <Stack.Screen name="CategoryManagement" component={CategoryManagement} />
        <Stack.Screen name="CustomerDetails" component={CustomerDetails} />
        <Stack.Screen name="PointManagement" component={PointManagement} />
    </Stack.Navigator>
);

const CustomerTabs = () => {
    return (
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
                tabBarActiveTintColor: '#059669',
                tabBarInactiveTintColor: '#94A3B8',
                tabBarLabelStyle: {
                    fontSize: 9,
                    fontWeight: '900',
                    textTransform: 'uppercase',
                    letterSpacing: 0,
                },
                tabBarIcon: ({ color, size, focused }) => {
                    const iconProps = { size, color, strokeWidth: focused ? 2.5 : 2 };
                    if (route.name === 'Home') return <Home {...iconProps} />;
                    if (route.name === 'Menu') return <Search {...iconProps} />;
                    if (route.name === 'Orders') return <ClipboardList {...iconProps} />;
                    if (route.name === 'Profile') return <User {...iconProps} />;
                    return null;
                },
            })}
        >
            <Tab.Screen
                name="Home"
                component={CustomerDashboard}
                options={{ tabBarLabel: 'Beranda' }}
            />
            <Tab.Screen
                name="Menu"
                component={CustomerMenu}
                options={{ tabBarLabel: 'Cari' }}
            />
            <Tab.Screen
                name="Orders"
                component={OrderHistory}
                options={{ tabBarLabel: 'Pesanan' }}
            />
            <Tab.Screen
                name="Profile"
                component={CustomerProfile}
                options={{ tabBarLabel: 'Profil' }}
            />
        </Tab.Navigator>
    );
};

const CustomerRootStack = () => (
    <Stack.Navigator screenOptions={{ headerShown: false }}>
        <Stack.Screen name="MainTabs" component={CustomerTabs} />
        <Stack.Screen name="Menu" component={CustomerMenu} />
        <Stack.Screen name="Cart" component={CustomerCart} />
        <Stack.Screen name="OrderDetails" component={OrderDetails} />
        <Stack.Screen name="ChatScreen" component={ChatScreen} />
        <Stack.Screen name="PointsHistory" component={PointsHistory} />
    </Stack.Navigator>
);

const AppNavigator = () => {
    const { user } = useAuth();

    // Tentukan Dashboard berdasarkan Role
    const isSeller = user?.role === 'penjual' || user?.role === 'admin' || user?.role === 'seller' || user?.role === 'kasir' || user?.role === 'owner';

    if (isSeller) {
        return (
            <NavigationContainer>
                <SellerRootStack />
                <NewOrderPopup />
            </NavigationContainer>
        );
    }

    return (
        <NavigationContainer>
            <CustomerRootStack />
            <NewOrderPopup />
        </NavigationContainer>
    );
};

export default AppNavigator;
