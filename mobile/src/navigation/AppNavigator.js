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
    Search,
    Ticket
} from 'lucide-react-native';
import NewOrderPopup from '../components/NewOrderPopup';
import { useAuth } from '../context/AuthContext';
import { useOrderNotification } from '../context/OrderNotificationContext';
import { useChat } from '../context/ChatContext';
import { useConfirm } from '../context/ConfirmContext';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

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
import CustomerManagement from '../screens/seller/CustomerManagement';
import SellerMenu from '../screens/seller/SellerMenu';
import ExpenseManagement from '../screens/seller/ExpenseManagement';
import LapakDeposit from '../screens/seller/LapakDeposit';
import CashReconciliation from '../screens/seller/CashReconciliation';
import DailyReport from '../screens/seller/DailyReport';
import DeveloperCreditsScreen from '../screens/DeveloperCreditsScreen';
import TransactionTrash from '../screens/seller/TransactionTrash';
import BusinessReports from '../screens/seller/BusinessReports';
import PromoManagement from '../screens/seller/PromoManagement';
import ManageInformation from '../screens/seller/ManageInformation';

// Customer Screens
import InformationScreen from '../screens/customer/InformationScreen';
import CustomerMenu from '../screens/customer/Menu';
import CustomerCart from '../screens/customer/Cart';
import OrderHistory from '../screens/customer/OrderHistory';
import OrderDetails from '../screens/customer/OrderDetails';
import CustomerProfile from '../screens/customer/CustomerProfile';
import PointsHistory from '../screens/customer/PointsHistory';
import PromoScreen from '../screens/customer/PromoScreen';
import { View, Text, TouchableOpacity, Platform } from 'react-native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { getSafeBottomPadding, getSafeFooterHeight } from '../utils/safeArea';
import { navigationRef } from './navigationRef';

const Tab = createBottomTabNavigator();
const Stack = createNativeStackNavigator();

// Stack for Home Tab to allow screens like PointsHistory to show navbar
const HomeStack = () => (
    <Stack.Navigator screenOptions={{ headerShown: false }}>
        <Stack.Screen name="CustomerDashboard" component={CustomerDashboard} />
        <Stack.Screen name="PointsHistory" component={PointsHistory} />
    </Stack.Navigator>
);

// Stack for Profile Tab to allow screens like PointsHistory to show navbar
const ProfileStack = () => (
    <Stack.Navigator screenOptions={{ headerShown: false }}>
        <Stack.Screen name="CustomerProfile" component={CustomerProfile} />
        <Stack.Screen name="PointsHistory" component={PointsHistory} />
    </Stack.Navigator>
);

// Stack for Promo Tab
const PromoStack = () => (
    <Stack.Navigator screenOptions={{ headerShown: false }}>
        <Stack.Screen name="PromoScreen" component={PromoScreen} />
        <Stack.Screen name="PointsHistory" component={PointsHistory} />
    </Stack.Navigator>
);

import Svg, { Path } from 'react-native-svg';

const SellerTabs = () => {
    const { pendingCount } = useOrderNotification();
    const { unreadCount } = useChat();
    const insets = useSafeAreaInsets();

    return (
        <Tab.Navigator
            screenOptions={({ route }) => ({
                headerShown: false,
                tabBarStyle: {
                    height: getSafeFooterHeight(insets, 70),
                    paddingBottom: getSafeBottomPadding(insets, 5, 20),
                    paddingTop: 10,
                    backgroundColor: '#FFFFFF',
                    borderTopWidth: 1,
                    borderTopColor: '#F1F5F9',
                    elevation: 8,
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
        <Stack.Screen name="CustomerManagement" component={CustomerManagement} />
        <Stack.Screen name="CustomerDetails" component={CustomerDetails} />
        <Stack.Screen name="PointManagement" component={PointManagement} />
        <Stack.Screen name="SellerMenu" component={SellerMenu} />
        <Stack.Screen name="ExpenseManagement" component={ExpenseManagement} />
        <Stack.Screen name="LapakDeposit" component={LapakDeposit} />
        <Stack.Screen name="CashReconciliation" component={CashReconciliation} />
        <Stack.Screen name="DailyReport" component={DailyReport} />
        <Stack.Screen name="DeveloperCreditsScreen" component={DeveloperCreditsScreen} />
        <Stack.Screen name="TransactionTrash" component={TransactionTrash} />
        <Stack.Screen name="BusinessReports" component={BusinessReports} />
        <Stack.Screen name="PromoManagement" component={PromoManagement} />
        <Stack.Screen name="ManageInformation" component={ManageInformation} />
    </Stack.Navigator>
);

const CustomCustomerTabBar = ({ state, descriptors, navigation }) => {
    const insets = useSafeAreaInsets();

    return (
        <View style={[
            navStyles.bottomNav,
            {
                height: getSafeFooterHeight(insets, insets.bottom > 0 ? 60 : 66),
                paddingBottom: getSafeBottomPadding(insets, 0, 15),
                paddingTop: insets.bottom > 0 ? 12 : 18
            }
        ]}>
            {state.routes.map((route, index) => {
                const { options } = descriptors[route.key];
                const label = options.tabBarLabel !== undefined ? options.tabBarLabel : options.title !== undefined ? options.title : route.name;
                const isFocused = state.index === index;

                const onPress = () => {
                    const event = navigation.emit({
                        type: 'tabPress',
                        target: route.key,
                        canPreventDefault: true,
                    });

                    if (!isFocused && !event.defaultPrevented) {
                        navigation.navigate(route.name);
                    }
                };

                const iconColor = isFocused ? '#059669' : '#94A3B8';
                const strokeWidth = isFocused ? 2.5 : 2;

                const renderIcon = () => {
                    if (route.name === 'Home') return <Home size={24} color={iconColor} strokeWidth={strokeWidth} />;
                    if (route.name === 'Menu') return <Search size={24} color={iconColor} strokeWidth={strokeWidth} />;
                    if (route.name === 'Promo') {
                        return (
                            <View style={[navStyles.promoIconContainer, isFocused && navStyles.activePromoIcon]}>
                                <Ticket size={24} color={isFocused ? '#FFFFFF' : '#059669'} fill={isFocused ? '#FFFFFF' : 'none'} strokeWidth={2.5} />
                            </View>
                        );
                    }
                    if (route.name === 'Orders') return <ClipboardList size={24} color={iconColor} strokeWidth={strokeWidth} />;
                    if (route.name === 'Profile') return <User size={24} color={iconColor} strokeWidth={strokeWidth} />;
                    return null;
                };

                return (
                    <TouchableOpacity
                        key={index}
                        onPress={onPress}
                        style={[navStyles.navItem, route.name === 'Promo' && navStyles.promoNavItem]}
                        activeOpacity={0.7}
                    >
                        {renderIcon()}
                        <Text style={[navStyles.navLabel, isFocused && navStyles.activeNavLabel]}>
                            {label}
                        </Text>
                    </TouchableOpacity>
                );
            })}
        </View>
    );
};

const navStyles = {
    bottomNav: {
        flexDirection: 'row',
        backgroundColor: '#FFFFFF',
        borderTopWidth: 1,
        borderTopColor: '#F1F5F9',
        paddingTop: 12,
        paddingHorizontal: 16,
        justifyContent: 'space-between',
        alignItems: 'center',
    },
    navItem: {
        flex: 1,
        alignItems: 'center',
        justifyContent: 'center',
        gap: 6,
    },
    promoNavItem: {
        marginTop: -20,
    },
    promoIconContainer: {
        width: 54,
        height: 54,
        borderRadius: 20,
        backgroundColor: '#ECFDF5',
        justifyContent: 'center',
        alignItems: 'center',
        borderWidth: 1,
        borderColor: '#D1FAE5',
        ...Platform.select({
            web: { boxShadow: '0px 8px 15px rgba(5, 150, 105, 0.15)' },
            android: { elevation: 6 }
        })
    },
    activePromoIcon: {
        backgroundColor: '#059669',
        borderColor: '#059669',
    },
    navLabel: {
        fontSize: 9,
        fontWeight: '700',
        color: '#94A3B8',
        textTransform: 'uppercase',
    },
    activeNavLabel: {
        color: '#059669',
        fontWeight: '900',
    }
};

const CustomerTabs = () => {
    return (
        <Tab.Navigator
            tabBar={props => <CustomCustomerTabBar {...props} />}
            screenOptions={{ headerShown: false }}
        >
            <Tab.Screen
                name="Home"
                component={HomeStack}
                options={{ tabBarLabel: 'Beranda' }}
            />
            <Tab.Screen
                name="Menu"
                component={CustomerMenu}
                options={{ tabBarLabel: 'Cari' }}
            />
            <Tab.Screen
                name="Promo"
                component={PromoStack}
                options={{ tabBarLabel: 'Promo' }}
            />
            <Tab.Screen
                name="Orders"
                component={OrderHistory}
                options={{ tabBarLabel: 'Pesanan' }}
            />
            <Tab.Screen
                name="Profile"
                component={ProfileStack}
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
        {/* PointsHistory is now inside HomeStack and ProfileStack */}
        {/* PromoString removed to force navigation via MainTabs > PromoStack */}
        <Stack.Screen name="DeveloperCreditsScreen" component={DeveloperCreditsScreen} />
        <Stack.Screen name="InformationScreen" component={InformationScreen} />
    </Stack.Navigator>
);

const AppNavigator = () => {
    const { user } = useAuth();

    // Tentukan Dashboard berdasarkan Role
    const isSeller = user?.role === 'penjual' || user?.role === 'admin' || user?.role === 'seller' || user?.role === 'kasir' || user?.role === 'owner';

    if (isSeller) {
        return (
            <NavigationContainer ref={navigationRef}>
                <SellerRootStack />
                <NewOrderPopup />
            </NavigationContainer>
        );
    }

    return (
        <NavigationContainer ref={navigationRef}>
            <CustomerRootStack />
            <NewOrderPopup />
        </NavigationContainer>
    );
};

export default AppNavigator;
