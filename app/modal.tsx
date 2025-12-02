import { router } from 'expo-router';
import { StyleSheet, View } from 'react-native';
import { Button, IconButton } from 'react-native-paper';

import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import ThemeToggle from '@/components/ThemeToggle';
import { hp, rs, wp } from '../utils/responsive';

export default function ModalScreen() {
  const isPresented = router.canGoBack();

  return (
    <ThemedView style={styles.container}>
      <View style={styles.header}>
        <View style={styles.headerTop}>
          {isPresented && (
            <IconButton
              icon="close"
              size={24}
              onPress={() => router.back()}
              style={styles.closeButton}
            />
          )}
          <ThemedText type="title" style={styles.title}>Modal</ThemedText>
        </View>
        <ThemeToggle />
      </View>
      
      <View style={styles.content}>
        <ThemedText style={styles.text}>This is a modal screen.</ThemedText>
        <Button 
          mode="contained" 
          onPress={() => router.back()}
          style={styles.button}
        >
          Close Modal
        </Button>
      </View>
    </ThemedView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: wp('4%'),
    paddingTop: hp('2%'),
    paddingBottom: hp('2%'),
  },
  headerTop: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  closeButton: {
    margin: 0,
    marginRight: rs(8),
  },
  title: {
    fontSize: 20,
    fontWeight: 'bold',
  },
  content: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    padding: 20,
  },
  text: {
    marginBottom: 20,
    fontSize: 16,
  },
  button: {
    marginTop: 10,
  },
});
