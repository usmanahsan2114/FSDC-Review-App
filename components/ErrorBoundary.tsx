import React, { Component, ErrorInfo, ReactNode } from 'react';
import { View, StyleSheet } from 'react-native';
import { Button, Card } from 'react-native-paper';
import { ThemedText } from './themed-text';
import { ThemedView } from './themed-view';
import { useThemeColor } from '@/hooks/use-theme-color';
import { wp, hp, rf, rs } from '../utils/responsive';

interface Props {
  children: ReactNode;
  fallback?: ReactNode;
  onError?: (error: Error, errorInfo: ErrorInfo) => void;
}

interface State {
  hasError: boolean;
  error?: Error;
}

class ErrorBoundary extends Component<Props, State> {
  constructor(props: Props) {
    super(props);
    this.state = { hasError: false };
  }

  static getDerivedStateFromError(error: Error): State {
    // Update state so the next render will show the fallback UI
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    // Log the error to console or error reporting service
    console.error('ErrorBoundary caught an error:', error, errorInfo);
    
    // Call the onError callback if provided
    if (this.props.onError) {
      this.props.onError(error, errorInfo);
    }
  }

  handleRetry = () => {
    this.setState({ hasError: false, error: undefined });
  };

  render() {
    if (this.state.hasError) {
      // Custom fallback UI
      if (this.props.fallback) {
        return this.props.fallback;
      }

      // Default fallback UI
      return (
        <ErrorFallback 
          error={this.state.error} 
          onRetry={this.handleRetry}
        />
      );
    }

    return this.props.children;
  }
}

interface ErrorFallbackProps {
  error?: Error;
  onRetry: () => void;
}

function ErrorFallback({ error, onRetry }: ErrorFallbackProps) {
  const backgroundColor = useThemeColor({}, 'background');
  const textColor = useThemeColor({}, 'text');
  const cardBackgroundColor = useThemeColor({}, 'card');

  const styles = createStyles(backgroundColor, textColor, cardBackgroundColor);

  return (
    <ThemedView style={styles.container}>
      <Card style={styles.errorCard}>
        <Card.Content style={styles.cardContent}>
          <ThemedText type="title" style={styles.title}>
            Oops! Something went wrong
          </ThemedText>
          
          <ThemedText style={styles.message}>
            We're sorry, but something unexpected happened. Please try again.
          </ThemedText>

          {__DEV__ && error && (
            <View style={styles.errorDetails}>
              <ThemedText style={styles.errorTitle}>
                Error Details (Development Mode):
              </ThemedText>
              <ThemedText style={styles.errorText}>
                {error.message}
              </ThemedText>
              {error.stack && (
                <ThemedText style={styles.stackTrace}>
                  {error.stack}
                </ThemedText>
              )}
            </View>
          )}

          <Button
            mode="contained"
            onPress={onRetry}
            style={styles.retryButton}
            contentStyle={styles.buttonContent}
          >
            Try Again
          </Button>
        </Card.Content>
      </Card>
    </ThemedView>
  );
}

const createStyles = (backgroundColor: string, textColor: string, cardBackgroundColor: string) =>
  StyleSheet.create({
    container: {
      flex: 1,
      justifyContent: 'center',
      alignItems: 'center',
      padding: wp('5%'),
    },
    errorCard: {
      width: '100%',
      maxWidth: wp('90%'),
      elevation: 4,
      shadowColor: '#000',
      shadowOffset: { width: 0, height: 2 },
      shadowOpacity: 0.25,
      shadowRadius: 4,
    },
    cardContent: {
      alignItems: 'center',
      padding: wp('5%'),
    },
    title: {
      fontSize: rf(24),
      fontWeight: 'bold',
      textAlign: 'center',
      marginBottom: hp('2%'),
      color: '#d32f2f',
    },
    message: {
      fontSize: rf(16),
      textAlign: 'center',
      marginBottom: hp('3%'),
      lineHeight: rf(24),
    },
    errorDetails: {
      width: '100%',
      marginBottom: hp('3%'),
      padding: wp('3%'),
      backgroundColor: '#f5f5f5',
      borderRadius: 8,
      borderLeftWidth: 4,
      borderLeftColor: '#d32f2f',
    },
    errorTitle: {
      fontSize: rf(14),
      fontWeight: 'bold',
      marginBottom: hp('1%'),
      color: '#d32f2f',
    },
    errorText: {
      fontSize: rf(12),
      marginBottom: hp('1%'),
      color: '#333',
      fontFamily: 'monospace',
    },
    stackTrace: {
      fontSize: rf(10),
      color: '#666',
      fontFamily: 'monospace',
    },
    retryButton: {
      minWidth: wp('40%'),
    },
    buttonContent: {
      paddingVertical: rs(12),
      paddingHorizontal: rs(24),
    },
  });

export default ErrorBoundary;