/**
 * ============================================================
 * GLASS BLUR ADAPTER
 * ============================================================
 *
 * Every glass component in this app was written against the
 * `@react-native-community/blur` API — `blurType`, `blurAmount`,
 * `reducedTransparencyFallbackColor` — but imports `BlurView` from
 * **expo-blur**, whose props are `tint`, `intensity` and
 * `experimentalBlurMethod`.
 *
 * React Native silently drops unknown props, so the result was not an error:
 * the blur simply never rendered. Every GlassCard / GlassButton / GlassModal in
 * the app fell back to its `rgba(255,255,255,0.05)` background, which is why
 * the "glassmorphism design system" looked flat compared to the mockups.
 * TypeScript caught it; runtime did not.
 *
 * This adapter translates the legacy prop names the components (and dozens of
 * screens) already use into the props expo-blur actually understands, so the
 * public API of the glass components does not change.
 */

import { Platform } from 'react-native';

/** Legacy @react-native-community/blur values still used across the app. */
export type LegacyBlurType = 'light' | 'dark' | 'extraDark' | 'regular' | 'prominent' | 'default';

/** expo-blur's own tint union (kept as a string type to avoid a hard dep on its exports). */
export type ExpoBlurTint = 'extraLight' | 'light' | 'dark' | 'regular' | 'prominent' | 'systemChromeMaterial' | 'default';

const TINT_MAP: Record<string, ExpoBlurTint> = {
  light: 'light',
  dark: 'dark',
  // expo-blur has no 'extraDark'; 'dark' is the strongest available tint.
  extraDark: 'dark',
  regular: 'regular',
  prominent: 'prominent',
  default: 'default',
};

export interface GlassBlurProps {
  /** Legacy name, accepted for backwards compatibility. */
  blurType?: LegacyBlurType;
  /** Legacy name (0–100 on iOS), accepted for backwards compatibility. */
  blurAmount?: number;
  /** expo-blur's own prop. Wins over blurAmount when both are given. */
  intensity?: number;
  /** expo-blur's own prop. Wins over blurType when both are given. */
  tint?: ExpoBlurTint;
}

/**
 * Map any combination of legacy and modern props onto valid expo-blur props.
 *
 * `intensity` is clamped to expo-blur's documented 1–100 range — an intensity
 * of 0 disables the blur entirely on some platforms, which is how a "subtle"
 * glass setting would otherwise render as nothing.
 */
export function resolveGlassBlur(props: GlassBlurProps = {}) {
  const { blurType, blurAmount, intensity, tint } = props;

  const resolvedTint: ExpoBlurTint = tint ?? TINT_MAP[blurType ?? 'dark'] ?? 'dark';

  const rawIntensity = intensity ?? blurAmount ?? 50;
  const resolvedIntensity = Math.min(100, Math.max(1, Math.round(rawIntensity)));

  return {
    tint: resolvedTint,
    intensity: resolvedIntensity,
    // On Android the native blur is experimental; without this the view falls
    // back to a plain translucent rectangle. 'dimezisBlurView' gives a real
    // blur at a measurable performance cost, which is the right trade for the
    // handful of glass surfaces on screen at once.
    experimentalBlurMethod: Platform.OS === 'android' ? ('dimezisBlurView' as const) : ('none' as const),
  };
}

export default resolveGlassBlur;
