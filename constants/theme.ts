/**
 * Paleta "de la nona": inspirada en losalfajoresdelanona.com —
 * crema cálida, rosa alfajor y marrones de chocolate/dulce de leche.
 */

import { Platform } from 'react-native';

export const Palette = {
  cream: '#FFF6F0', // fondo cálido
  pinkSoft: '#F6CCD6', // rosa suave (chips, highlights)
  rose: '#D87A8D', // rosa viejo (primario: botones, tabs activas)
  roseDark: '#B85E72', // rosa presionado
  brown: '#7A4B31', // marrón cálido (texto secundario)
  chocolate: '#4A2A18', // chocolate (texto principal)
  chocolateDeep: '#2B1810', // fondo modo oscuro
  cardDark: '#3A241A', // cards en modo oscuro
  success: '#7BA05B', // verde oliva suave (ok/checks)
  danger: '#C94F4F', // rojo ladrillo (eliminar/errores)
};

export const Colors = {
  light: {
    text: Palette.chocolate,
    background: Palette.cream,
    tint: Palette.rose,
    icon: Palette.brown,
    tabIconDefault: Palette.brown,
    tabIconSelected: Palette.rose,
    card: '#FFFFFF',
    border: Palette.pinkSoft,
    muted: Palette.brown,
  },
  dark: {
    text: Palette.cream,
    background: Palette.chocolateDeep,
    tint: Palette.pinkSoft,
    icon: Palette.pinkSoft,
    tabIconDefault: '#B08A76',
    tabIconSelected: Palette.pinkSoft,
    card: Palette.cardDark,
    border: Palette.brown,
    muted: '#D9B8A6',
  },
};

export const Fonts = Platform.select({
  ios: {
    /** iOS `UIFontDescriptorSystemDesignDefault` */
    sans: 'system-ui',
    /** iOS `UIFontDescriptorSystemDesignSerif` */
    serif: 'ui-serif',
    /** iOS `UIFontDescriptorSystemDesignRounded` */
    rounded: 'ui-rounded',
    /** iOS `UIFontDescriptorSystemDesignMonospaced` */
    mono: 'ui-monospace',
  },
  default: {
    sans: 'normal',
    serif: 'serif',
    rounded: 'normal',
    mono: 'monospace',
  },
  web: {
    sans: "system-ui, -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif",
    serif: "Georgia, 'Times New Roman', serif",
    rounded: "'SF Pro Rounded', 'Hiragino Maru Gothic ProN', Meiryo, 'MS PGothic', sans-serif",
    mono: "SFMono-Regular, Menlo, Monaco, Consolas, 'Liberation Mono', 'Courier New', monospace",
  },
});
