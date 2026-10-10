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

    Ticket,
    DollarSign,
    BarChart3
} from 'lucide-react-native';
import NewOrderPopup from '../components/NewOrderPopup';
import { useAuth } from '../context/AuthContext';
import { useOrderNotification } from '../context/OrderNotificationContext';
import { useChat } from '../context/ChatContext';
import { useConfirm } from '../context/ConfirmContext';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import Svg, { Path } from 'react-native-svg';

// Screens
import ChatScreen from '../screens/seller/ChatScreen';
import ProfileScreen from '../screens/seller/ProfileScreen';
import CustomerDashboard from '../screens/customer/Dashboard';
import SellerDashboard from '../screens/seller/Dashboard';
import OwnerDashboard from '../screens/owner/Dashboard';
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
import SellerLaporanHarian from '../screens/seller/LaporanHarian';
import DeveloperCreditsScreen from '../screens/DeveloperCreditsScreen';
import TransactionTrash from '../screens/seller/TransactionTrash';
import BusinessReports from '../screens/seller/BusinessReports';
import PromoManagement from '../screens/seller/PromoManagement';
import ManageInformation from '../screens/seller/ManageInformation';
import FinancialReport from '../screens/seller/FinancialReport';
import HppManagement from '../screens/seller/HppManagement';
import HppReport from '../screens/seller/HppReport';
// Popup Management Scale
import PopupManagement from '../screens/seller/PopupManagement';
import ReviewManagement from '../screens/seller/ReviewManagement';
import DatabaseManagement from '../screens/seller/DatabaseManagement';
import OwnerDatabaseManagement from '../screens/owner/DatabaseManagement';
import OwnerDeveloperCreditsScreen from '../screens/owner/DeveloperCreditsScreen';
import OwnerExpenseManagement from '../screens/owner/ExpenseManagement';
import OwnerLapakDeposit from '../screens/owner/LapakDeposit';
import OrderTrash from '../screens/seller/OrderTrash';
import Credits from '../screens/seller/Credits';

// Owner Screens
import OwnerBusinessReports from '../screens/owner/BusinessReports';
import OwnerFinancialReport from '../screens/owner/FinancialReport';
import OwnerDailyReport from '../screens/owner/DailyReport';
import OwnerLaporanHarian from '../screens/owner/LaporanHarian';
import OwnerCashReconciliation from '../screens/owner/CashReconciliation';
import OwnerCategoryManagement from '../screens/owner/CategoryManagement';
import OwnerPromoManagement from '../screens/owner/PromoManagement';
import OwnerManageInformation from '../screens/owner/ManageInformation';
import OwnerProfileScreen from '../screens/owner/ProfileScreen';
import OwnerAllFeatures from '../screens/owner/AllFeatures';
import BusinessMoney from '../screens/owner/BusinessMoney';
import OwnerAuditor from '../screens/owner/Auditor';
import SellerAuditor from '../screens/seller/Auditor';

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



const CustomSellerTabBar = ({ state, descriptors, navigation }) => {
    const insets = useSafeAreaInsets();
    const { pendingCount } = useOrderNotification();

    return (
        <View style={[
            sellerNavStyles.bottomNav,
            {
                height: getSafeFooterHeight(insets, 65),
                paddingBottom: getSafeBottomPadding(insets, 6, 15),
                paddingTop: 18,
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

                const iconColor = isFocused ? '#138FEA' : '#94A3B8';
                const strokeWidth = isFocused ? 2.5 : 2;
                const size = 22;

                const renderIcon = () => {
                    const props = { size, color: iconColor, strokeWidth };
                    if (route.name === 'Dashboard') return <LayoutDashboard {...props} />;
                    if (route.name === 'Pesanan') return <ShoppingBag {...props} />;
                    if (route.name === 'Jual') return <ShoppingCart {...props} />;
                    if (route.name === 'Katalog') return <Utensils {...props} />;
                    if (route.name === 'Transaksi') return <History {...props} />;
                    return null;
                };

                return (
                    <TouchableOpacity
                        key={index}
                        onPress={onPress}
                        style={sellerNavStyles.navItem}
                        activeOpacity={0.7}
                    >
                        <View style={sellerNavStyles.iconWrapper}>
                            {renderIcon()}
                            {route.name === 'Pesanan' && pendingCount > 0 && (
                                <View style={sellerNavStyles.badge}>
                                    <Text style={sellerNavStyles.badgeText}>{pendingCount}</Text>
                                </View>
                            )}
                        </View>
                        <Text style={[
                            sellerNavStyles.navLabel,
                            isFocused && sellerNavStyles.activeNavLabel
                        ]}>
                            {label}
                        </Text>
                    </TouchableOpacity>
                );
            })}
        </View>
    );
};

const sellerNavStyles = {
    bottomNav: {
        flexDirection: 'row',
        backgroundColor: '#FFFFFF',
        justifyContent: 'space-around',
        alignItems: 'center',
        paddingHorizontal: 10,
        ...Platform.select({
            web: { boxShadow: '0px -8px 25px rgba(0,0,0,0.06)' },
            android: { elevation: 20 },
            ios: {
                shadowColor: '#000',
                shadowOffset: { width: 0, height: -8 },
                shadowOpacity: 0.06,
                shadowRadius: 15,
            }
        })
    },
    navItem: {
        flex: 1,
        alignItems: 'center',
        justifyContent: 'center',
        gap: 2,
    },
    iconWrapper: {
        width: 42,
        height: 32,
        justifyContent: 'center',
        alignItems: 'center',
        borderRadius: 12,
        position: 'relative',
    },
    navLabel: {
        fontSize: 9,
        fontWeight: '700',
        color: '#94A3B8',
        textTransform: 'uppercase',
        letterSpacing: -0.2,
    },
    activeNavLabel: {
        color: '#138FEA',
        fontWeight: '900',
    },
    badge: {
        position: 'absolute',
        top: -2,
        right: 0,
        backgroundColor: '#EF4444',
        minWidth: 16,
        height: 16,
        borderRadius: 8,
        justifyContent: 'center',
        alignItems: 'center',
        paddingHorizontal: 4,
        borderWidth: 1.5,
        borderColor: '#FFFFFF',
    },
    badgeText: {
        color: '#FFFFFF',
        fontSize: 8,
        fontWeight: 'bold',
    }
};

const SellerDashboardStack = () => (
    <Stack.Navigator screenOptions={{ headerShown: false }}>
        <Stack.Screen name="SellerDashboardHome" component={SellerDashboard} />
    </Stack.Navigator>
);

const SellerTabs = () => {
    return (
        <Tab.Navigator
            tabBar={props => <CustomSellerTabBar {...props} />}
            screenOptions={{ headerShown: false }}
        >
            <Tab.Screen name="Dashboard" component={SellerDashboardStack} />
            <Tab.Screen name="Pesanan" component={OrderManagement} />
            <Tab.Screen name="Jual" component={SalesPOS} />
            <Tab.Screen name="Katalog" component={MenuManagement} />
            <Tab.Screen name="Transaksi" component={TransactionHistory} />
        </Tab.Navigator>
    );
};
const SellerRootStack = () => (
    <Stack.Navigator screenOptions={{ headerShown: false }}>
        <Stack.Screen name="MainTabs" component={SellerTabs} />
        <Stack.Screen name="TransactionTrash" component={TransactionTrash} />
        <Stack.Screen name="OrderTrash" component={OrderTrash} />
        <Stack.Screen name="ChatScreen" component={ChatScreen} />
        <Stack.Screen name="ProfileScreen" component={ProfileScreen} />
        <Stack.Screen name="CustomerManagement" component={CustomerManagement} />
        <Stack.Screen name="CustomerDetails" component={CustomerDetails} />
        <Stack.Screen name="PromoManagement" component={PromoManagement} />
        <Stack.Screen name="BusinessReports" component={BusinessReports} />
        <Stack.Screen name="DatabaseManagement" component={DatabaseManagement} />
        <Stack.Screen name="DeveloperCreditsScreen" component={DeveloperCreditsScreen} />
        <Stack.Screen name="Banners" component={Banners} />
        <Stack.Screen name="CategoryManagement" component={CategoryManagement} />
        <Stack.Screen name="PointManagement" component={PointManagement} />
        <Stack.Screen name="SellerMenu" component={SellerMenu} />
        <Stack.Screen name="ExpenseManagement" component={ExpenseManagement} />
        <Stack.Screen name="LapakDeposit" component={LapakDeposit} />
        <Stack.Screen name="CashReconciliation" component={CashReconciliation} />
        <Stack.Screen name="DailyReport" component={DailyReport} />
        <Stack.Screen name="LaporanHarian" component={SellerLaporanHarian} />
        <Stack.Screen name="ManageInformation" component={ManageInformation} />
        <Stack.Screen name="FinancialReport" component={FinancialReport} />
        <Stack.Screen name="HppManagement" component={HppManagement} />
        <Stack.Screen name="HppReport" component={HppReport} />
        <Stack.Screen name="PopupManagement" component={PopupManagement} />
        <Stack.Screen name="ReviewManagement" component={ReviewManagement} />
        <Stack.Screen name="Auditor" component={SellerAuditor} />
        <Stack.Screen name="Credits" component={Credits} />
    </Stack.Navigator>
);

const OwnerNavStyles = {
    bottomNav: {
        flexDirection: 'row',
        backgroundColor: '#FFFFFF',
        justifyContent: 'space-around',
        alignItems: 'center',
        paddingHorizontal: 10,
        ...Platform.select({
            web: { boxShadow: '0px -8px 25px rgba(0,0,0,0.05)' },
            android: { elevation: 20 },
            ios: {
                shadowColor: '#000',
                shadowOffset: { width: 0, height: -8 },
                shadowOpacity: 0.05,
                shadowRadius: 15,
            }
        })
    },
    navItem: {
        flex: 1,
        alignItems: 'center',
        justifyContent: 'center',
        gap: 4,
    },
    navLabel: {
        fontSize: 9,
        fontWeight: '700',
        color: '#94A3B8',
        textTransform: 'uppercase',
        letterSpacing: 0.5,
    },
    activeNavLabel: {
        color: '#349BE5',
        fontWeight: '900',
    },
};

const CustomOwnerTabBar = ({ state, descriptors, navigation }) => {
    const insets = useSafeAreaInsets();

    return (
        <View style={[
            OwnerNavStyles.bottomNav,
            {
                height: getSafeFooterHeight(insets, 70),
                paddingBottom: getSafeBottomPadding(insets, 8, 20),
                paddingTop: 15,
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

                const iconColor = isFocused ? '#349BE5' : '#64748B';

                const renderIcon = () => {
                    if (route.name === 'Dashboard') return <LayoutDashboard size={24} color={iconColor} strokeWidth={isFocused ? 2.5 : 2} />;
                    if (route.name === 'Bisnis') return <BarChart3 size={24} color={iconColor} strokeWidth={isFocused ? 2.5 : 2} />;
                    if (route.name === 'Keuangan') return <DollarSign size={24} color={iconColor} strokeWidth={isFocused ? 2.5 : 2} />;
                    if (route.name === 'Profil') return <User size={24} color={iconColor} strokeWidth={isFocused ? 2.5 : 2} />;
                    return null;
                };

                return (
                    <TouchableOpacity
                        key={index}
                        onPress={onPress}
                        style={OwnerNavStyles.navItem}
                        activeOpacity={0.7}
                    >
                        {renderIcon()}
                        <Text style={[
                            OwnerNavStyles.navLabel,
                            isFocused && OwnerNavStyles.activeNavLabel
                        ]}>
                            {label}
                        </Text>
                    </TouchableOpacity>
                );
            })}
        </View>
    );
};

// Stack for Dashboard Tab - includes all dashboard-related screens
const OwnerDashboardStack = () => (
    <Stack.Navigator screenOptions={{ headerShown: false }}>
        <Stack.Screen name="OwnerDashboard" component={OwnerDashboard} />
        <Stack.Screen name="AllFeatures" component={OwnerAllFeatures} />
        <Stack.Screen name="DailyReport" component={OwnerDailyReport} />
        <Stack.Screen name="LaporanHarian" component={OwnerLaporanHarian} />
        <Stack.Screen name="ExpenseManagement" component={OwnerExpenseManagement} />
        <Stack.Screen name="LapakDeposit" component={OwnerLapakDeposit} />
        <Stack.Screen name="CashReconciliation" component={OwnerCashReconciliation} />
        <Stack.Screen name="BusinessMoney" component={BusinessMoney} />
        <Stack.Screen name="Auditor" component={OwnerAuditor} />
    </Stack.Navigator>
);

// Stack for Business Tab - includes business-related screens
const OwnerBusinessStack = () => (
    <Stack.Navigator screenOptions={{ headerShown: false }}>
        <Stack.Screen name="OwnerBusinessReports" component={OwnerBusinessReports} />
        <Stack.Screen name="LaporanHarian" component={OwnerLaporanHarian} />
        <Stack.Screen name="CategoryManagement" component={OwnerCategoryManagement} />
        <Stack.Screen name="PromoManagement" component={OwnerPromoManagement} />
        <Stack.Screen name="ManageInformation" component={OwnerManageInformation} />
    </Stack.Navigator>
);

// Stack for Finance Tab - includes finance-related screens
const OwnerFinanceStack = () => (
    <Stack.Navigator screenOptions={{ headerShown: false }}>
        <Stack.Screen name="OwnerFinancialReport" component={OwnerFinancialReport} />
        <Stack.Screen name="ExpenseManagement" component={OwnerExpenseManagement} />
        <Stack.Screen name="LapakDeposit" component={OwnerLapakDeposit} />
        <Stack.Screen name="CashReconciliation" component={OwnerCashReconciliation} />
        <Stack.Screen name="BusinessMoney" component={BusinessMoney} />
    </Stack.Navigator>
);

// Stack for Profile Tab - includes profile-related screens
const OwnerProfileStack = () => (
    <Stack.Navigator screenOptions={{ headerShown: false }}>
        <Stack.Screen name="OwnerProfileScreen" component={OwnerProfileScreen} />
        <Stack.Screen name="DatabaseManagement" component={OwnerDatabaseManagement} />
        <Stack.Screen name="DeveloperCreditsScreen" component={OwnerDeveloperCreditsScreen} />
        <Stack.Screen name="PromoManagement" component={OwnerPromoManagement} />
    </Stack.Navigator>
);

const OwnerTabs = () => {
    return (
        <Tab.Navigator
            tabBar={props => <CustomOwnerTabBar {...props} />}
            screenOptions={{ headerShown: false }}
        >
            <Tab.Screen name="Dashboard" component={OwnerDashboardStack} options={{ tabBarLabel: 'Beranda' }} />
            <Tab.Screen name="Bisnis" component={OwnerBusinessStack} options={{ tabBarLabel: 'Bisnis' }} />
            <Tab.Screen name="Keuangan" component={OwnerFinanceStack} options={{ tabBarLabel: 'Keuangan' }} />
            <Tab.Screen name="Profil" component={OwnerProfileStack} options={{ tabBarLabel: 'Profil' }} />
        </Tab.Navigator>
    );
};

const OwnerRootStack = () => (
    <Stack.Navigator screenOptions={{ headerShown: false }}>
        <Stack.Screen name="MainTabs" component={OwnerTabs} />
        {/* Fallback screens for direct navigation */}
        <Stack.Screen name="OwnerDashboard" component={OwnerDashboard} />
        <Stack.Screen name="OwnerBusinessReports" component={OwnerBusinessReports} />
        <Stack.Screen name="OwnerFinancialReport" component={OwnerFinancialReport} />
        <Stack.Screen name="OwnerProfileScreen" component={OwnerProfileScreen} />
        <Stack.Screen name="Auditor" component={OwnerAuditor} />
        <Stack.Screen name="Credits" component={Credits} />
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
                                <Ticket size={24} color={isFocused ? '#FFFFFF' : '#059669'} fill="none" strokeWidth={2.5} />
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
    const isOwner = user?.role === 'owner';
    const isSeller = user?.role === 'penjual' || user?.role === 'admin' || user?.role === 'seller' || user?.role === 'kasir';

    console.log('[DEBUG Navigation] User Role:', user?.role, '| isOwner:', isOwner, '| isSeller:', isSeller);

    if (isOwner) {
        return (
            <NavigationContainer ref={navigationRef}>
                <OwnerRootStack />
            </NavigationContainer>
        );
    }

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
        </NavigationContainer>
    );
};

export default AppNavigator;
