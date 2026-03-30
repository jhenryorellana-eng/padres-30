import { useWindowDimensions } from 'react-native';
import { useMemo } from 'react';

const TABLET_BREAKPOINT = 600;

export function useResponsive() {
  const { width, height } = useWindowDimensions();
  const isTablet = width >= TABLET_BREAKPOINT;

  return useMemo(() => {
    // Grid
    const gridColumns = isTablet ? 4 : 3;
    const gridPadding = isTablet ? 32 : 16;
    const gridGapX = isTablet ? 32 : 24;
    const gridGapY = isTablet ? 48 : 40;
    const cardWidth =
      (width - gridPadding * 2 - gridGapX * (gridColumns - 1)) / gridColumns;
    const iconSize = isTablet ? 88 : 72;

    // Typography
    const fontScale = isTablet ? 1.15 : 1;

    // Spacing
    const hp = isTablet ? 32 : 16;
    const hpLg = isTablet ? 40 : 24;

    // Tab bar
    const tabGap = isTablet ? 72 : 48;
    const tabPaddingH = isTablet ? 48 : 32;
    const tabIconSize = isTablet ? 32 : 28;

    return {
      width,
      height,
      isTablet,
      grid: {
        columns: gridColumns,
        padding: gridPadding,
        gapX: gridGapX,
        gapY: gridGapY,
        cardWidth,
        iconSize,
      },
      fontScale,
      spacing: { hp, hpLg },
      tab: { gap: tabGap, paddingH: tabPaddingH, iconSize: tabIconSize },
    };
  }, [width, height, isTablet]);
}
