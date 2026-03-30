import React, { useCallback } from 'react';
import { View, StyleSheet, Pressable, FlatList } from 'react-native';
import { AppCard } from './AppCard';
import { useResponsive } from '@/hooks/useResponsive';
import type { MiniApp } from '@/constants/miniApps';

interface AppGridProps {
  apps: MiniApp[];
  onAppPress: (app: MiniApp) => void;
  onAppLongPress: (app: MiniApp) => void;
}

export function AppGrid({ apps, onAppPress, onAppLongPress }: AppGridProps) {
  const { grid } = useResponsive();
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
          <AppCard app={item} cardWidth={grid.cardWidth} iconSize={grid.iconSize} />
        </Pressable>
      );
    },
    [onAppPress, onAppLongPress, grid.cardWidth, grid.iconSize]
  );

  return (
    <View style={styles.container}>
      <FlatList
        key={`grid-${grid.columns}`}
        data={apps}
        keyExtractor={keyExtractor}
        renderItem={renderItem}
        numColumns={grid.columns}
        contentContainerStyle={[styles.grid, { paddingHorizontal: grid.padding }]}
        columnWrapperStyle={{ justifyContent: 'flex-start', gap: grid.gapX, marginBottom: grid.gapY }}
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
    paddingBottom: 120,
  },
  appWrapper: {
    opacity: 1,
  },
});

export default AppGrid;
