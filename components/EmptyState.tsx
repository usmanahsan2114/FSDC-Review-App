import React from 'react';
import { StyleSheet, View } from 'react-native';
import { Button } from 'react-native-paper';
import { hp, isTablet, rf, rs, wp } from '../utils/responsive';
import { ThemedText } from './themed-text';

interface EmptyStateProps {
  icon?: string;
  title: string;
  description: string;
  actionLabel?: string;
  onActionPress?: () => void;
}

export const EmptyState: React.FC<EmptyStateProps> = ({
  icon = '📋',
  title,
  description,
  actionLabel,
  onActionPress,
}) => {
  return (
    <View style={styles.container}>
      <View style={styles.content}>
        <View style={styles.iconContainer}>
          <ThemedText style={styles.icon}>{icon}</ThemedText>
        </View>
        
        <ThemedText style={styles.title}>{title}</ThemedText>
        <ThemedText style={styles.description}>{description}</ThemedText>
        
        {actionLabel && onActionPress && (
          <Button
            mode="contained"
            onPress={onActionPress}
            style={styles.button}
            contentStyle={styles.buttonContent}
            labelStyle={styles.buttonLabel}
          >
            {actionLabel}
          </Button>
        )}
      </View>
    </View>
  );
};

// Specific empty state variants for common scenarios
export const NoReviewsEmptyState: React.FC<{ onAddReview: () => void }> = ({ onAddReview }) => (
  <EmptyState
    icon="✈️"
    title="No Reviews Yet"
    description="Start by adding your first flight simulator review to track your experiences."
    actionLabel="Add Your First Review"
    onActionPress={onAddReview}
  />
);

export const NoSearchResultsEmptyState: React.FC<{ onClearFilters: () => void }> = ({ onClearFilters }) => (
  <EmptyState
    icon="🔍"
    title="No Results Found"
    description="We couldn't find any reviews matching your search criteria. Try adjusting your filters or search terms."
    actionLabel="Clear All Filters"
    onActionPress={onClearFilters}
  />
);

export const NoPhotosEmptyState: React.FC = () => (
  <EmptyState
    icon="📸"
    title="No Photos Attached"
    description="Add photos to remember this experience and make your review more vivid."
  />
);

export const NoHandwritingEmptyState: React.FC = () => (
  <EmptyState
    icon="✍️"
    title="No Handwritten Notes"
    description="Add a personal touch with handwritten comments to make your review unique."
  />
);

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: wp('5%'),
    paddingVertical: hp('10%'),
  },
  content: {
    alignItems: 'center',
    maxWidth: isTablet ? wp('60%') : wp('80%'),
  },
  iconContainer: {
    width: isTablet ? rs(120) : rs(100),
    height: isTablet ? rs(120) : rs(100),
    borderRadius: isTablet ? rs(60) : rs(50),
    backgroundColor: 'rgba(33, 150, 243, 0.1)',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: rs(24),
  },
  icon: {
    fontSize: rf(isTablet ? 56 : 48),
  },
  title: {
    fontSize: rf(isTablet ? 28 : 24),
    fontWeight: 'bold',
    textAlign: 'center',
    marginBottom: rs(12),
  },
  description: {
    fontSize: rf(16),
    textAlign: 'center',
    opacity: 0.7,
    lineHeight: rf(24),
    marginBottom: rs(32),
  },
  button: {
    minWidth: isTablet ? wp('30%') : wp('60%'),
    borderRadius: rs(12),
  },
  buttonContent: {
    paddingVertical: rs(12),
    paddingHorizontal: rs(24),
  },
  buttonLabel: {
    fontSize: rf(16),
  },
});

