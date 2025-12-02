import { DarkTheme, DefaultTheme, ThemeProvider } from '@react-navigation/native';
import { Stack } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { useEffect } from 'react';
import { MD3DarkTheme, MD3LightTheme, Provider as PaperProvider } from 'react-native-paper';
import 'react-native-reanimated';

import ErrorBoundary from '@/components/ErrorBoundary';
import { ThemeProvider as CustomThemeProvider, useTheme } from '@/contexts/ThemeContext';
import { isMigrationNeeded, migrateExistingData } from '@/utils/dataMigration';

export const unstable_settings = {
  anchor: '(tabs)',
};

function AppContent() {
  const { isDark, colors } = useTheme();

  // Run data migration on app startup
  useEffect(() => {
    const runMigration = async () => {
      try {
        const needsMigration = await isMigrationNeeded();
        if (needsMigration) {
          console.log('Starting data migration...');
          const result = await migrateExistingData();
          if (result.success) {
            console.log(`Migration completed successfully: ${result.migratedReviews} reviews migrated`);
            if (result.failedReviews > 0) {
              console.warn(`${result.failedReviews} reviews failed to migrate:`, result.errors);
            }
          } else {
            console.error('Migration failed:', result.errors);
          }
        } else {
          console.log('No migration needed');
        }
      } catch (error) {
        console.error('Error during migration check:', error);
      }
    };

    runMigration();
  }, []);

  const paperTheme = {
    ...(isDark ? MD3DarkTheme : MD3LightTheme),
    colors: {
      ...(isDark ? MD3DarkTheme.colors : MD3LightTheme.colors),
      primary: colors.tint,
      background: colors.background,
      surface: colors.card,
      onBackground: colors.text,
      onSurface: colors.text,
    },
  };

  const navigationTheme = {
    ...(isDark ? DarkTheme : DefaultTheme),
    colors: {
      ...(isDark ? DarkTheme.colors : DefaultTheme.colors),
      primary: colors.tint,
      background: colors.background,
      card: colors.card,
      text: colors.text,
      border: colors.border,
      notification: colors.notification,
    },
  };

  return (
    <PaperProvider theme={paperTheme}>
      <ThemeProvider value={navigationTheme}>
        <ErrorBoundary>
          <Stack>
            <Stack.Screen name="(tabs)" options={{ headerShown: false }} />
            <Stack.Screen name="modal" options={{ presentation: 'modal', title: 'Modal' }} />
          </Stack>
        </ErrorBoundary>
        <StatusBar style={isDark ? 'light' : 'dark'} />
      </ThemeProvider>
    </PaperProvider>
  );
}

export default function RootLayout() {
  return (
    <CustomThemeProvider>
      <AppContent />
    </CustomThemeProvider>
  );
}
