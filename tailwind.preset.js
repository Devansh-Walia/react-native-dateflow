/**
 * Tailwind preset for react-native-dateflow.
 * Maps the semantic tokens the components use onto CSS variables that hold
 * HSL channels (shadcn convention). It only uses `extend`, so a host that
 * already defines these colours keeps its own values.
 */
const hsl = (token) => `hsl(var(--${token}) / <alpha-value>)`;

module.exports = {
  theme: {
    extend: {
      colors: {
        background: hsl('background'),
        foreground: hsl('foreground'),
        border: hsl('border'),
        primary: { DEFAULT: hsl('primary'), foreground: hsl('primary-foreground') },
        muted: { DEFAULT: hsl('muted'), foreground: hsl('muted-foreground') },
        accent: { DEFAULT: hsl('accent'), foreground: hsl('accent-foreground') },
      },
      borderRadius: {
        lg: 'var(--radius)',
      },
    },
  },
};
