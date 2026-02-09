import React, { useEffect, useRef } from 'react';
import { View, StyleSheet, Animated, Dimensions } from 'react-native';

const { width } = Dimensions.get('window');
const COLUMN_WIDTH = (width - 48) / 2;

const ModernLoader = ({ type = 'grid' }) => {
    const animation = useRef(new Animated.Value(0.3)).current;

    useEffect(() => {
        const startAnimation = () => {
            Animated.loop(
                Animated.sequence([
                    Animated.timing(animation, {
                        toValue: 0.7,
                        duration: 800,
                        useNativeDriver: true,
                    }),
                    Animated.timing(animation, {
                        toValue: 0.3,
                        duration: 800,
                        useNativeDriver: true,
                    }),
                ])
            ).start();
        };

        startAnimation();
    }, [animation]);

    const renderSkeletonItem = (index) => (
        <View key={index} style={styles.skeletonCard}>
            <Animated.View style={[styles.skeletonImage, { opacity: animation }]} />
            <View style={styles.skeletonInfo}>
                <Animated.View style={[styles.skeletonTextSmall, { opacity: animation }]} />
                <Animated.View style={[styles.skeletonTextLarge, { opacity: animation, width: '80%' }]} />
                <Animated.View style={[styles.skeletonTextMedium, { opacity: animation, width: '60%' }]} />
                <View style={styles.skeletonFooter}>
                    <Animated.View style={[styles.skeletonDot, { opacity: animation }]} />
                    <Animated.View style={[styles.skeletonTextSmall, { opacity: animation, width: '40%' }]} />
                </View>
            </View>
        </View>
    );

    if (type === 'list') {
        return (
            <View style={styles.listContainer}>
                {[1, 2, 3, 4, 5].map((_, i) => (
                    <View key={i} style={styles.skeletonListItem}>
                        <Animated.View style={[styles.skeletonCircle, { opacity: animation }]} />
                        <View style={{ flex: 1, gap: 8 }}>
                            <Animated.View style={[styles.skeletonTextMedium, { opacity: animation }]} />
                            <Animated.View style={[styles.skeletonTextSmall, { opacity: animation, width: '40%' }]} />
                        </View>
                        <Animated.View style={[styles.skeletonTextLarge, { opacity: animation, width: 60 }]} />
                    </View>
                ))}
            </View>
        );
    }

    return (
        <View style={styles.gridContainer}>
            {[1, 2, 3, 4, 5, 6].map((_, i) => renderSkeletonItem(i))}
        </View>
    );
};

const styles = StyleSheet.create({
    gridContainer: {
        flexDirection: 'row',
        flexWrap: 'wrap',
        padding: 15,
        justifyContent: 'center',
    },
    listContainer: {
        padding: 20,
        gap: 16,
    },
    skeletonCard: {
        backgroundColor: '#FFFFFF',
        width: COLUMN_WIDTH,
        margin: 7,
        borderRadius: 20,
        padding: 12,
        borderWidth: 1,
        borderColor: '#F1F5F9',
    },
    skeletonImage: {
        width: '100%',
        height: COLUMN_WIDTH - 40,
        backgroundColor: '#F1F5F9',
        borderRadius: 16,
        marginBottom: 12,
    },
    skeletonInfo: {
        gap: 8,
    },
    skeletonTextSmall: {
        height: 10,
        backgroundColor: '#F1F5F9',
        borderRadius: 4,
    },
    skeletonTextMedium: {
        height: 14,
        backgroundColor: '#F1F5F9',
        borderRadius: 4,
    },
    skeletonTextLarge: {
        height: 18,
        backgroundColor: '#F1F5F9',
        borderRadius: 4,
    },
    skeletonFooter: {
        flexDirection: 'row',
        alignItems: 'center',
        marginTop: 4,
        gap: 6,
    },
    skeletonDot: {
        width: 8,
        height: 8,
        borderRadius: 4,
        backgroundColor: '#F1F5F9',
    },
    skeletonListItem: {
        flexDirection: 'row',
        alignItems: 'center',
        padding: 16,
        backgroundColor: '#FFFFFF',
        borderRadius: 20,
        borderWidth: 1,
        borderColor: '#F1F5F9',
        gap: 12,
    },
    skeletonCircle: {
        width: 48,
        height: 48,
        borderRadius: 24,
        backgroundColor: '#F1F5F9',
    },
});

export default ModernLoader;
