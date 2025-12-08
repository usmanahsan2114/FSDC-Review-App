import { AnimatedEntry } from '@/components/AnimatedEntry';
import { GlassCard } from '@/components/GlassCard';
import OptimizedImage from '@/components/OptimizedImage';
import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import ThemeToggle from '@/components/ThemeToggle';
import { Simulator } from '@/constants/simulators';
import { useTheme } from '@/contexts/ThemeContext';
import { useThemeColor } from '@/hooks/use-theme-color';
import { getSimulators } from '@/utils/simulatorStorage';
import { router, useFocusEffect } from 'expo-router';
import React, { useCallback, useState } from 'react';
import { Linking, ScrollView, StyleSheet, TouchableOpacity, View } from 'react-native';
import { IconButton } from 'react-native-paper';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { getDevicePadding, hp, isTablet, rs, wp } from '../../utils/responsive';

export default function HomeScreen() {
  const { isDark } = useTheme();
  const insets = useSafeAreaInsets();
  const primaryColor = useThemeColor({}, 'primary');
  const accentColor = useThemeColor({}, 'accent');
  const [simulators, setSimulators] = useState<Simulator[]>([]);

  useFocusEffect(
    useCallback(() => {
      getSimulators().then(setSimulators);
    }, [])
  );

  const handleAddReview = () => router.push('/add-review');
  const handleAddJoyrideReview = () => router.push('/add-review?type=joyride');
  const handleViewReviews = () => router.push('/reviews-list');
  const handleAdminQuestions = () => router.push('/admin-questions');
  const handleDashboard = () => router.push('/dashboard');

  const ActionButton = ({ 
    icon, 
    label, 
    subLabel, 
    onPress, 
    color = primaryColor,
    variant = 'default' 
  }: { 
    icon: string, 
    label: string, 
    subLabel?: string, 
    onPress: () => void, 
    color?: string,
    variant?: 'default' | 'accent' | 'outline'
  }) => (
    <TouchableOpacity 
      onPress={onPress} 
      activeOpacity={0.7}
      style={[styles.actionButtonWrapper, isTablet && styles.actionButtonWrapperTablet]}
    >
      <GlassCard 
        style={[
          styles.actionButton, 
          variant === 'accent' && { borderColor: color, borderWidth: 2 },
          variant === 'outline' && { borderColor: 'rgba(255,255,255,0.2)' }
        ]}
        intensity={variant === 'accent' ? 40 : 20}
      >
        <View style={styles.actionIconContainer}>
          <IconButton icon={icon} iconColor={color} size={32} style={{ margin: 0 }} />
        </View>
        <View style={styles.actionTextContainer}>
          <ThemedText type="defaultSemiBold" style={{ color: variant === 'accent' ? color : (isDark ? '#FFFFFF' : '#000000') }}>
            {label}
          </ThemedText>
          {subLabel && (
            <ThemedText type="technical-label" style={{ color: isDark ? 'rgba(255,255,255,0.7)' : 'rgba(0,0,0,0.6)', marginTop: 4 }}>
              {subLabel}
            </ThemedText>
          )}
        </View>
        <IconButton icon="chevron-right" iconColor={color} size={20} />
      </GlassCard>
    </TouchableOpacity>
  );

  return (
    <AnimatedEntry style={{ flex: 1 }}>
      <ThemedView style={styles.container} variant="grid-background">
        <View style={[styles.header, { marginTop: insets.top }]}>
          <View style={styles.statusBadge}>
            <View style={[styles.statusDot, { backgroundColor: '#10B981' }]} />
            <ThemedText type="technical-label">SYSTEM ONLINE</ThemedText>
          </View>
          <ThemeToggle />
        </View>
        
        <ScrollView
          contentContainerStyle={[
            styles.content,
            { paddingBottom: Math.max(insets.bottom, rs(24)) },
          ]}
          showsVerticalScrollIndicator={false}
        >
          <View style={styles.heroSection}>
            <OptimizedImage 
              source={isDark ? require('@/assets/images/white-logo.png') : require('@/assets/images/black-logo.png')} 
              style={styles.logo}
              contentFit="contain"
              transition={200}
            />
            
            <ThemedText type="hero-title" style={[styles.title, { color: primaryColor }]}>
              ORBITAL COMMAND
            </ThemedText>
            
            <ThemedText type="technical-label" style={[styles.subtitle, { color: isDark ? 'rgba(255,255,255,0.8)' : 'rgba(0,0,0,0.6)' }]}>
              FLIGHT SIMULATION DATA CENTER FSDC
            </ThemedText>
          </View>

          {/* Simulator Slideshow */}
          <View style={{ marginBottom: rs(32) }}>
            <ScrollView 
              horizontal 
              showsHorizontalScrollIndicator={false}
              contentContainerStyle={{ paddingHorizontal: rs(24), gap: rs(16) }}
            >
              {simulators.map((sim) => (
                <GlassCard 
                  key={sim.id} 
                  style={{ 
                    width: wp(60), 
                    height: hp(20), 
                    borderRadius: 16, 
                    overflow: 'hidden',
                  }}
                  variant="glass-panel"
                >
                  <View style={{ 
                    flex: 1, 
                    padding: 24, 
                    justifyContent: 'center', 
                    alignItems: 'center',
                    backgroundColor: 'rgba(0,0,0,0.2)' // Subtle backing like add-review
                  }}>
                    <OptimizedImage
                      source={{ uri: sim.imageUrl || 'https://fsdcpak.com/assets/img/home/super-mushak.webp' }}
                      style={{ width: '100%', height: '100%' }}
                      contentFit="contain"
                    />
                  </View>
                  <View style={{ 
                    position: 'absolute', 
                    bottom: 0, 
                    left: 0, 
                    right: 0, 
                    padding: 12,
                    backgroundColor: 'rgba(0,0,0,0.6)' 
                  }}>
                    <ThemedText type="defaultSemiBold" style={{ color: '#FFF' }}>
                      {sim.name}
                    </ThemedText>
                  </View>
                </GlassCard>
              ))}
            </ScrollView>
          </View>

          <View style={styles.gridContainer}>
            <View style={styles.sectionHeader}>
              <ThemedText type="technical-label" style={{ color: primaryColor }}>PRIMARY OPERATIONS</ThemedText>
              <View style={[styles.divider, { backgroundColor: primaryColor }]} />
            </View>

            <ActionButton 
              icon="plus-circle-outline" 
              label={"New Flight Log\n"} 
              subLabel="Professional Review"
              onPress={handleAddReview}
              variant="accent"
            />

            <ActionButton 
              icon="airplane-takeoff" 
              label={"Joyride Entry\n"} 
              subLabel="Visitor Experience"
              onPress={handleAddJoyrideReview}
              color="#D946EF" // Magenta
            />

            <ActionButton 
              icon="web" 
              label={"FSDC Website\n"} 
              subLabel="Official Portal"
              onPress={() => Linking.openURL('https://fsdcpak.com')}
              color="#0EA5E9" // Sky Blue
            />

            <View style={[styles.sectionHeader, { marginTop: rs(24) }]}>
              <ThemedText type="technical-label" style={{ color: accentColor }}>DATA ANALYSIS</ThemedText>
              <View style={[styles.divider, { backgroundColor: accentColor }]} />
            </View>

            <ActionButton 
              icon="chart-box-outline" 
              label={"Mission Analytics\n"} 
              subLabel="Dashboard & Metrics"
              onPress={handleDashboard}
              color={accentColor}
            />

            <ActionButton 
              icon="format-list-bulleted" 
              label={"Flight Archives\n"} 
              subLabel="View All Logs"
              onPress={handleViewReviews}
              variant="outline"
            />

            <View style={[styles.sectionHeader, { marginTop: rs(24) }]}>
              <ThemedText type="technical-label" style={{ opacity: 0.5 }}>SYSTEM CONFIG</ThemedText>
              <View style={[styles.divider, { opacity: 0.2 }]} />
            </View>

            <ActionButton 
              icon="cog-outline" 
              label="Admin Console" 
              subLabel="Manage Parameters"
              onPress={handleAdminQuestions}
              color="#64748B"
              variant="outline"
            />
          </View>
          
        </ScrollView>
      </ThemedView>
    </AnimatedEntry>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: rs(24),
    paddingVertical: rs(16),
  },
  statusBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(16, 185, 129, 0.1)',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: 'rgba(16, 185, 129, 0.2)',
  },
  statusDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    marginRight: 8,
  },
  content: {
    paddingHorizontal: getDevicePadding().horizontal,
  },
  heroSection: {
    alignItems: 'center',
    marginBottom: rs(40),
    marginTop: rs(20),
  },
  logo: {
    width: isTablet ? wp(30) : wp(50),
    height: isTablet ? hp(10) : hp(12),
    marginBottom: rs(16),
    opacity: 0.9,
  },
  title: {
    textAlign: 'center',
    marginBottom: rs(8),
    textShadowColor: 'rgba(0, 240, 255, 0.5)',
    textShadowOffset: { width: 0, height: 0 },
    textShadowRadius: 20,
  },
  subtitle: {
    textAlign: 'center',
    opacity: 0.6,
    letterSpacing: 4,
  },
  gridContainer: {
    width: '100%',
    maxWidth: isTablet ? wp(70) : wp(100),
    alignSelf: 'center',
  },
  sectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: rs(16),
    paddingHorizontal: rs(4),
  },
  divider: {
    flex: 1,
    height: 1,
    marginLeft: rs(12),
    opacity: 0.5,
  },
  actionButtonWrapper: {
    marginBottom: rs(12),
    width: '100%',
  },
  actionButtonWrapperTablet: {
    // On tablet we could do a grid, but full width cards look good too for a menu
  },
  actionButton: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: rs(12),
  },
  actionIconContainer: {
    marginRight: rs(16),
    backgroundColor: 'rgba(255,255,255,0.05)',
    borderRadius: 12,
  },
  actionTextContainer: {
    flex: 1,
  },
});
