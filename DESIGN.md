# Design System Strategy: The Sovereign Sentinel

*This design system aims to capture the "High-Security Sentinel" aesthetic, extracted from the Awaaz project configuration.*

## 1. Overview & Creative North Star
**Creative North Star: The Sovereign Sentinel**

This design system is engineered to convey absolute authority, surgical precision, and ironclad security. Moving away from the approachable "SaaS-blue" tropes, this system adopts a "Sovereign" aesthetic—reminiscent of high-level intelligence tools like Palantir or AWS Security Hub. 

The experience is defined by **intentional austerity**. By utilizing a hyper-disciplined grid, monochromatic depth, and razor-sharp components, we create an environment where data is the protagonist. We break the standard template look through **asymmetric data density**: grouping complex information into Bento-style clusters that prioritize rapid scanning and high "data-ink" efficiency. The interface doesn't just show data; it "archives" it with the weight of a blockchain-backed record.

## 2. Colors
The palette is a study in high-contrast functionality. We use deep, obsidian-like foundations to let critical status accents command immediate attention.

### Surface Hierarchy & Nesting
Traditional borders are a visual distraction. We utilize a **Tonal Layering** approach:
*   **Base Layer:** `background` (#0a0e14) — The infinite void.
*   **Secondary Sectioning:** `surface-container-low` (#0e141c) — Used for large structural zones.
*   **Primary Containers:** `surface-container` (#121a25) — The standard Bento card background.
*   **Elevated Details:** `surface-container-high` (#16202e) — For nested elements within cards.

### The Rules of Engagement
*   **The "No-Line" Rule:** Do not use 1px solid borders to separate sections. Use the shift from `surface` to `surface-container-low` to define boundaries.
*   **The "Glass & Gradient" Rule:** For floating modals or "live" status cards, apply a backdrop-blur (12px–20px) using a semi-transparent `surface-variant`. Main CTAs (Actionable items) should use a subtle linear gradient from `primary` (#ffba3b) to `primary_container` (#604100) to provide a "metallic" luster rather than a flat, toy-like appearance.
*   **Status Precision:** Use `secondary` (#21b375) for verified blockchain states, `primary` (#ffba3b) for warnings, and `tertiary` (#ff7162) for critical violations.

## 3. Typography
The system uses a dual-font approach to balance editorial authority with technical clarity.

*   **Display & Headlines (Space Grotesk):** Chosen for its slightly "tech-brutalist" character. Use `display-lg` for heroic entry points. The wide tracking and geometric forms suggest a modern, encrypted architecture.
*   **Body & UI (Inter):** The workhorse. Inter’s tall x-height ensures that long strings of cryptographic hashes (`body-sm`) remain legible at small scales. 
*   **Identity through Hierarchy:** By pairing a `display-md` headline in high-contrast `on_surface` with a `label-sm` in `on_surface_variant` (all caps, +5% letter spacing), the UI adopts a "Government Dossier" feel.

## 4. Elevation & Depth
In a "Sentinel" aesthetic, shadows must be felt, not seen.

*   **The Layering Principle:** Stacking tiers (e.g., a `surface-container-highest` card sitting on a `surface-container` background) creates a physical sense of "nesting" without visual clutter.
*   **Ambient Shadows:** For floating elements, use a highly diffused shadow: `0px 24px 48px rgba(0, 0, 0, 0.5)`. Never use pure black shadows on navy backgrounds; instead, use a darker tint of the background color to maintain tonal richness.
*   **The "Ghost Border" Fallback:** If a container requires a perimeter for accessibility, use `outline_variant` at 15% opacity. This creates a "hairline" effect that appears only as a catch-light on an edge.
*   **Surgical Precision:** All containers must maintain a radius between **0px and 4px**. Avoid rounded "pill" shapes for anything other than specific status tags.

## 5. Components

### Buttons (The "Surgical" Trigger)
*   **Primary:** Sharp corners (2px). Gradient fill from `primary` to `primary_dim`. Text in `on_primary` (semi-bold).
*   **Secondary:** `outline` stroke (1px, 20% opacity). No fill. High-contrast `on_surface` text.
*   **States:** On hover, primary buttons should "glow" subtly using a `surface_tint` outer shadow (4px blur).

### Bento-Style Cards
Cards are the core of this system. Use `surface-container` with a 2px radius. Internal padding should be a generous 24px to allow data to breathe. Group related blockchain metadata into nested `surface-container-highest` sub-blocks.

### Input Fields
*   **Architecture:** Use `surface_container_lowest` for the field fill. 
*   **Focus:** Instead of a thick border, use a 1px `primary` underline or a subtle `primary` outer "glow" on the container edge.
*   **Monospace Data:** Any blockchain hash or Case ID must use a monospace font (or Inter with tabular num features) for alignment.

### Blockchain Status Chips
Thin-line (1pt) borders. Use `secondary_container` backgrounds with `on_secondary_container` text for "Confirmed" transactions. Use a pulsing 4px dot icon to indicate "Live" syncing.

## 6. Do's and Don'ts

### Do
*   **Do** prioritize "Data-Ink" efficiency. Every line and color must serve a functional purpose.
*   **Do** use asymmetrical layouts. A heavy left-hand column for "Primary Evidence" balanced by a "Bento" grid of metadata on the right creates a sophisticated, custom feel.
*   **Do** use 2pt thin-line iconography. Icons should be functional "glyphs," not illustrations.

### Don't
*   **Don't** use standard "Material Design" rounded buttons (8px+). It breaks the "Sovereign" feel.
*   **Don't** use dividers or horizontal rules. Use vertical white space and background tone shifts to separate content.
*   **Don't** use neon or vibrant "glow" effects unless it signifies a critical, system-wide error. This is a tool for professionals, not a gaming dashboard.
*   **Don't** hide critical data behind tooltips. In a reporting system, visibility is synonymous with trust.

---

## Technical Token Specifications

### Typography Scale
- **Headline Font:** SPACE_GROTESK
- **Body Font:** INTER
- **Label Font:** INTER

### Core Color Overrides
- **Color Mode:** Dark
- **Base Custom Variant:** `NEUTRAL` (`#0D1117`)
- **Primary:** `#F2A900`
- **Secondary:** `#00A86B`
- **Tertiary:** `#FF3B30`
- **Neutral:** `#0D1117`

### Full Named Color Palette
| Token | Hex Value | Purpose |
|-------|-----------|---------|
| `background` | `#0a0e14` | The infinite void base layer |
| `surface_container_lowest` | `#000000` | Input field fill |
| `surface_container_low` | `#0e141c` | Secondary Sectioning |
| `surface_container` | `#121a25` | Primary Bento Card Background |
| `surface_container_high` | `#16202e` | Elevated details/nested elements |
| `surface_container_highest`| `#1a2637` | Highly nested data blocks |
| `surface_variant` | `#1a2637` | Modals/Live status cards (with blur) |
| `primary` | `#ffba3b` | Main CTAs, glowing elements, warnings |
| `primary_container` | `#604100` | Gradient endings for CTAs |
| `primary_dim` | `#f4ab04` | Secondary states for primary elements |
| `on_primary` | `#573b00` | Text on top of primary button |
| `secondary` | `#21b375` | Verified blockchain states |
| `secondary_container` | `#004529` | Backgrounds for confirmed chips |
| `on_secondary_container` | `#51d695` | Text for confirmed chips |
| `tertiary` | `#ff7162` | Critical violations |
| `error` | `#ee7d77` | Error states |
| `on_surface` | `#d9e6fd` | Primary text |
| `on_surface_variant` | `#9facc1` | Secondary text ("Government Dossier" style) |
| `outline` | `#6a768a` | Standard disabled boundaries |
| `outline_variant` | `#3c495b` | 15% opacity "Ghost borders" |

### Layout & Sizing
- **Spacing Scale:** 1
- **Device Orientation Designed:** Desktop
