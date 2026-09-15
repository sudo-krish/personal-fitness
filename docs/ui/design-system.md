# Porcelain & Slate Design System

The **Porcelain & Slate Design System** is an ultra-crisp, light-minimalist aesthetic engineered specifically for fitness tracking on mobile devices under harsh, high-glare gym lighting.

---

## 🎨 1. Color Tokens & Semantic Roles

All tokens are defined as CSS Custom Properties in [`src/index.css`](../../src/index.css#L7-L67).

### Surface & Canvas Architecture
Unlike standard dark-mode gym apps that suffer from severe reflections under overhead fluorescents, Pulse uses a porcelain surface hierarchy:

```css
:root {
  --bg-canvas: #F8FAFC;            /* Slate 50 Porcelain Canvas */
  --bg-surface: #FFFFFF;           /* Pure White Surface Cards */
  --bg-surface-subtle: #F1F5F9;    /* Slate 100 Inset / Form Backdrops */
  --bg-scrim: rgba(15, 23, 42, 0.45); /* Modal Backdrop */
  
  --border-subtle: #E2E8F0;        /* Slate 200 Hairline Card Borders */
  --border-medium: #CBD5E1;        /* Slate 300 Focused Inputs */
  --border-focus: #0284C7;         /* Azure Focus Ring */
}
```

### High-Contrast Slate Typography
Designed for maximum legibility (WCAG AAA 12:1 contrast ratio):

```css
:root {
  --text-primary: #0F172A;         /* Slate 900: Titles & Key Metrics */
  --text-secondary: #475569;       /* Slate 600: Body & Rep Targets */
  --text-muted: #64748B;           /* Slate 500: Hints & Timestamps */
  --text-dim: #94A3B8;             /* Slate 400: Inactive Placeholders */
}
```

---

## 👥 2. Partner Dual-Color System

Pulse visually distinguishes between both training partners across every station:

```
┌──────────────────────────────────────┬──────────────────────────────────────┐
│        Krish (Person 1)              │        Theju (Person 2)              │
│        Electric Azure                │        Rose Coral                    │
│        #0284C7                       │        #E11D48                       │
├──────────────────────────────────────┼──────────────────────────────────────┤
│ Background Tint: #F0F9FF (Sky 50)    │ Background Tint: #FFF1F2 (Rose 50)   │
│ Border Accent:   #BAE6FD (Sky 200)   │ Border Accent:   #FECDD3 (Rose 200)  │
│ Glow Drop: rgba(2, 132, 199, 0.25)   │ Glow Drop: rgba(225, 29, 72, 0.25)   │
└──────────────────────────────────────┴──────────────────────────────────────┘
```

### Functional Status Tokens
- **Set Completion**: Emerald (`#10B981`, `--emerald`, `--emerald-light`, `--emerald-border`)
- **Rest Interval Countdown**: Amber (`#D97706`, `--amber`, `--amber-light`, `--amber-border`)

---

## 🫧 3. Liquid Glass & Specular Reflections

Pulse implements a tactile, glassy layer using hardware-accelerated CSS filters:

```css
:root {
  --glass-bg: rgba(255, 255, 255, 0.78);
  --glass-bg-subtle: rgba(248, 250, 252, 0.68);
  --glass-border: rgba(255, 255, 255, 0.92);
  --glass-border-subtle: rgba(226, 232, 240, 0.7);
  --glass-specular: inset 0 1.5px 1.5px rgba(255, 255, 255, 0.95), 
                    inset 0 -1px 1px rgba(15, 23, 42, 0.02);
  --glass-shadow: 0 20px 45px -12px rgba(15, 23, 42, 0.08), 
                  0 4px 16px -2px rgba(15, 23, 42, 0.03);
  --glass-blur: blur(30px) saturate(195%);
}
```

### Applying Liquid Glass in Components
To apply the liquid glass aesthetic to a floating bar, card, or modal drawer:

```tsx
<div className="bg-white/80 backdrop-blur-xl border border-white/90 shadow-glass rounded-2xl">
  {/* Specular highlight border + diffused soft shadow */}
</div>
```

---

## 📱 4. Mobile Ergonomics & Viewport Physics

1. **Safe Area Insets**:
   Always reference native browser insets so that notch geometry (Dynamic Island, navigation pill) does not obscure content:
   - Header safe spacing: `padding-top: max(env(safe-area-inset-top), 12px);`
   - Dock safe spacing: `padding-bottom: max(env(safe-area-inset-bottom), 16px);`

2. **Touch Target Dimensions**:
   - Minimum tap target: **44px × 44px** (Apple HIG & Android Material standards).
   - Numeric inputs for weight and reps have built-in increment/decrement steppers to allow one-tap micro-adjustments with sweaty fingers.

3. **Motion Physics**:
   Transitions utilize snappy spring physics to maintain a physical, athletic feel:
   ```typescript
   transition={{ type: "spring", stiffness: 450, damping: 32 }}
   ```
