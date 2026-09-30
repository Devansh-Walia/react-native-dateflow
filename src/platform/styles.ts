/** Cross-platform style constants that remove per-OS rendering differences. */
import { Platform, type TextStyle, type ViewStyle } from 'react-native';

/** Android adds font padding and top-aligns text; this makes glyph boxes match iOS/web. */
export const TEXT_RESET: TextStyle =
  Platform.select<TextStyle>({
    android: { includeFontPadding: false, textAlignVertical: 'center' },
    default: {},
  }) ?? {};

/** One shadow definition for every platform (New Architecture boxShadow; never `elevation`). */
export const SHADOW: ViewStyle = { boxShadow: '0px 8px 24px rgba(0, 0, 0, 0.18)' };
