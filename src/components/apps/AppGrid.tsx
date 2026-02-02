import React, { useCallback } from 'react';
import { View, StyleSheet, Pressable, FlatList } from 'react-native';
import { AppCard, CARD_DIMENSIONS } from './AppCard';
import type { MiniApp } from '@/constants/miniApps';

interface AppGridProps {
  apps: MiniApp[];
  onAppPress: (app: MiniApp) => void;
  onAppLongPress: (app: MiniApp) => void;
}

export function AppGrid({ apps, onAppPress, onAppLongPress }: AppGridProps) {
  const keyExtractor = useCallback((item: MiniApp) => item.id, []);

  const renderItem = useCallback(
    ({ item }: { item: MiniApp }) => {
      return (
        <Pressable
          style={styles.appWrapper}
          onPress={() => onAppPress(item)}
          onLongPress={() => onAppLongPress(item)}
          delayLongPress={400}
        >
          <AppCard app={item} />
        </Pressable>
      );
    },
    [onAppPress, onAppLongPress]
  );

  return (
    <View style={styles.container}>
      <FlatList
        data={apps}
        keyExtractor={keyExtractor}
        renderItem={renderItem}
        numColumns={CARD_DIMENSIONS.columns}
        contentContainerStyle={styles.grid}
        columnWrapperStyle={styles.row}
        showsVerticalScrollIndicator={false}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  grid: {
    paddingHorizontal: CARD_DIMENSIONS.padding,
    paddingBottom: 120,
  },
  row: {
    justifyContent: 'flex-start',
    gap: CARD_DIMENSIONS.gapX,
    marginBottom: CARD_DIMENSIONS.gapY,
  },
  appWrapper: {
    opacity: 1,
  },
});

export default AppGrid;
