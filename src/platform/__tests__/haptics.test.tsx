import * as Haptics from 'expo-haptics';
import { Platform } from 'react-native';
import { triggerHaptic } from '../haptics';

describe('triggerHaptic', () => {
  beforeEach(() => jest.clearAllMocks());

  it('fires selection and impact feedback on native', () => {
    triggerHaptic('selection', true);
    triggerHaptic('impact', true);
    expect(Haptics.selectionAsync).toHaveBeenCalledTimes(1);
    expect(Haptics.impactAsync).toHaveBeenCalledWith(Haptics.ImpactFeedbackStyle.Light);
  });

  it('does nothing when disabled', () => {
    triggerHaptic('selection', false);
    expect(Haptics.selectionAsync).not.toHaveBeenCalled();
  });

  it('does nothing on web', () => {
    const original = Platform.OS;
    Object.defineProperty(Platform, 'OS', { value: 'web', configurable: true });
    triggerHaptic('selection', true);
    Object.defineProperty(Platform, 'OS', { value: original, configurable: true });
    expect(Haptics.selectionAsync).not.toHaveBeenCalled();
  });
});
