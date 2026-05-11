---
name: High-End AI Texting Assistant
colors:
  surface: '#15121b'
  surface-dim: '#15121b'
  surface-bright: '#3c3742'
  surface-container-lowest: '#100d16'
  surface-container-low: '#1d1a24'
  surface-container: '#221e28'
  surface-container-high: '#2c2833'
  surface-container-highest: '#37333e'
  on-surface: '#e8e0ee'
  on-surface-variant: '#ccc3d7'
  inverse-surface: '#e8e0ee'
  inverse-on-surface: '#332f39'
  outline: '#958da1'
  outline-variant: '#4a4455'
  surface-tint: '#d3bbff'
  primary: '#d3bbff'
  on-primary: '#3f008d'
  primary-container: '#6d28d9'
  on-primary-container: '#dac5ff'
  inverse-primary: '#7331df'
  secondary: '#adc6ff'
  on-secondary: '#002e6a'
  secondary-container: '#0566d9'
  on-secondary-container: '#e6ecff'
  tertiary: '#ffb2b7'
  on-tertiary: '#67001b'
  tertiary-container: '#b20035'
  on-tertiary-container: '#ffbec1'
  error: '#ffb4ab'
  on-error: '#690005'
  error-container: '#93000a'
  on-error-container: '#ffdad6'
  primary-fixed: '#ebddff'
  primary-fixed-dim: '#d3bbff'
  on-primary-fixed: '#250059'
  on-primary-fixed-variant: '#5b00c5'
  secondary-fixed: '#d8e2ff'
  secondary-fixed-dim: '#adc6ff'
  on-secondary-fixed: '#001a42'
  on-secondary-fixed-variant: '#004395'
  tertiary-fixed: '#ffdadb'
  tertiary-fixed-dim: '#ffb2b7'
  on-tertiary-fixed: '#40000d'
  on-tertiary-fixed-variant: '#92002a'
  background: '#15121b'
  on-background: '#e8e0ee'
  surface-variant: '#37333e'
typography:
  display-lg:
    fontFamily: Inter
    fontSize: 48px
    fontWeight: '700'
    lineHeight: 56px
    letterSpacing: -0.02em
  headline-lg:
    fontFamily: Inter
    fontSize: 32px
    fontWeight: '700'
    lineHeight: 40px
    letterSpacing: -0.02em
  headline-md:
    fontFamily: Inter
    fontSize: 24px
    fontWeight: '600'
    lineHeight: 32px
    letterSpacing: -0.01em
  body-lg:
    fontFamily: Inter
    fontSize: 16px
    fontWeight: '400'
    lineHeight: 24px
    letterSpacing: 0em
  body-md:
    fontFamily: Inter
    fontSize: 14px
    fontWeight: '400'
    lineHeight: 20px
    letterSpacing: 0em
  label-md:
    fontFamily: Inter
    fontSize: 12px
    fontWeight: '600'
    lineHeight: 16px
    letterSpacing: 0.05em
  headline-lg-mobile:
    fontFamily: Inter
    fontSize: 28px
    fontWeight: '700'
    lineHeight: 34px
    letterSpacing: -0.02em
rounded:
  sm: 0.25rem
  DEFAULT: 0.5rem
  md: 0.75rem
  lg: 1rem
  xl: 1.5rem
  full: 9999px
spacing:
  unit: 4px
  xs: 4px
  sm: 8px
  md: 16px
  lg: 24px
  xl: 40px
  gutter: 16px
  margin-mobile: 20px
  margin-desktop: 64px
---

## Brand & Style

This design system is built for a Gen Z audience that values speed, exclusivity, and high-fidelity aesthetics. The brand personality is "Quiet Luxury Tech"—sophisticated and minimalist, yet powered by an underlying electric energy. It moves away from the "soft" roundedness of typical SaaS and leans into a sharper, more deliberate "Minimal Bold" aesthetic inspired by pro-tools like Raycast and Linear.

The style is defined by **Solid Matte Depth**. It rejects gradients and blurs in favor of distinct layered surfaces, high-contrast typography, and vibrant solid-color accents. The emotional response should be one of absolute precision and premium performance. Every interaction feels fast, every surface feels tangible, and every piece of text is hyper-readable.

## Colors

The palette is rooted in a "True Dark" foundation. By using `#080808` as the base, we achieve a deeper-than-standard black that makes content pop with high-end intensity.

- **Foundations:** We use a monochromatic stack of matte blacks and charcoals to create hierarchy without needing shadows. Surfaces are solid, non-transparent blocks.
- **Accents:** Accents are strictly solid. Deep Purple (#6D28D9) serves as the primary AI-interaction color. Electric Blue and Rose Pink are used for secondary functional states or user-specific threading.
- **Contrast:** Soft White (#F5F5F5) is used for primary content to reduce eye strain compared to pure white, while maintaining high contrast against the matte background.

## Typography

This design system utilizes **Inter** for its systematic, neutral, and highly legible characteristics. The typographic hierarchy is designed to be "compact but loud."

- **Headings:** Bold and tight. Large display sizes use negative letter-spacing to feel more cohesive and "engineered."
- **Body:** Optimized for rapid reading in a texting context. Line heights are kept tight (1.4x - 1.5x) to maximize information density.
- **Labels:** Small caps and increased letter-spacing are used for metadata to distinguish it from the conversational flow.
- **High Contrast:** All primary text must be `#F5F5F5`. Secondary text should never drop below a 4.5:1 contrast ratio against its specific surface color.

## Layout & Spacing

The layout philosophy is a **Structured Fluid Grid**. While the layout adapts to the screen width, it follows a strict 4px baseline shift to maintain mathematical harmony.

- **Mobile:** A single column layout with 20px side margins. Message bubbles and cards span the full width minus margins.
- **Desktop/Web:** A multi-pane approach inspired by IDEs. Left-hand navigation is fixed width (240px), the chat list is fixed (320px), and the primary interaction area is fluid.
- **Rhythm:** We use a "Tight-Wide" spacing logic. Elements within a component (like an avatar and a name) are tightly packed (8px), while distinct sections or cards are widely separated (24px).

## Elevation & Depth

This design system avoids traditional realistic lighting. Depth is conveyed through **Tonal Layering** and **Deep Borders**.

1. **Level 0 (Background):** #080808 — The "void" where the application starts.
2. **Level 1 (Surfaces):** #121212 — Used for primary navigation bars, sidebars, and chat containers.
3. **Level 2 (Plates/Cards):** #1C1C1C — Used for message bubbles, input fields, and elevated cards.
4. **Borders:** Every elevated surface (Level 1 or 2) must have a solid 1px border of `#1C1C1C` or a slightly lighter `#262626` to define its edge against the background.
5. **Shadows:** Use only one type of shadow: a "Natural Matte" shadow. It is a large-spread, low-opacity (#000000, 40% opacity) shadow used only on the highest-level floating elements like context menus or modals.

## Shapes

The shape language is "Squircle-Modern." We use generous corner radii to offset the "coldness" of the dark matte palette, creating a UI that feels high-tech yet tactile.

- **Base Radius:** 12px for small components like buttons and input fields.
- **Container Radius (rounded-lg):** 16px for message bubbles and standard cards.
- **Feature Radius (rounded-xl):** 24px for large dashboard containers or the primary chat input area.
- **Pill:** Used exclusively for status chips or notification badges.

## Components

- **Buttons:** Solid fills only. Primary buttons use the Accent colors (#6D28D9) with Soft White text. No shadows. On hover, the color should lighten by 10% (solid).
- **Message Bubbles:** AI responses use the Surface color (#121212) with a Deep Graphite (#1C1C1C) border. User messages use a "Muted Indigo" (a darker variant of the primary accent) to maintain focus on the AI's assistance.
- **Input Fields:** Thick 1px borders of #1C1C1C. On focus, the border changes to the Electric Blue accent (#3B82F6). The background remains #121212.
- **Chips:** Small, 12px font size, high-contrast labels. Used for "Suggested Replies" or "AI Modes." Background is #1C1C1C with no border.
- **Status Indicators:** Success is shown via a solid #10B981 circle. Processing/AI Thinking states use a subtle pulsing solid #6D28D9 circle.
- **Cards:** Layered #1C1C1C surfaces with 16px padding. Titles are always Bold (Weight 700).