# Design System Documentation: Himalayan Property Management

## 1. Overview & Creative North Star
**Creative North Star: "The Elevated Sanctuary"**

This design system moves away from the utilitarian, "grid-locked" nature of traditional property management software. Instead, it adopts an **Editorial Architectural** approach. We are not just managing data; we are curating spaces. The system utilizes intentional asymmetry, generous whitespace (breathing room), and a "layered peak" philosophy where content stacks like mountain ranges rather than sitting in flat boxes. By prioritizing tonal depth over harsh lines, we create an environment that feels both technologically advanced and inherently trustworthy.

---

## 2. Colors & Tonal Architecture
The palette is rooted in deep slate and ethereal violets, moving away from "default blue" to a more sophisticated, custom-blended spectrum.

### The "No-Line" Rule
**Prohibit 1px solid borders for sectioning.** Boundaries must be defined solely through background color shifts or subtle tonal transitions. For example, a `surface-container-low` section sitting on a `surface` background provides all the visual separation required without the "cheapening" effect of a stroke.

### Surface Hierarchy & Nesting
Treat the UI as a series of physical layers—like stacked sheets of frosted glass or fine linen.
*   **Base Layer:** `surface` (#faf9fb)
*   **Secondary Content:** `surface-container-low` (#f5f3f5)
*   **Interactive Cards:** `surface-container-lowest` (#ffffff)
*   **Emphasis/Action Areas:** `surface-container-high` (#e9e8ea)

### The "Glass & Gradient" Rule
To achieve a premium, high-end feel, use Glassmorphism for floating elements (e.g., navigation bars, property filters). Use semi-transparent versions of `surface` with a `backdrop-blur` of 12px–20px. 

For high-impact CTAs, use a **Signature Texture**: a linear gradient from `primary` (#4f17ce) to `primary_container` (#673de6) at a 135-degree angle. This adds a "soul" to the interface that flat colors cannot replicate.

---

## 3. Typography
We utilize **Inter** across all scales to maintain a sharp, technical precision that balances the softer "Glassmorphism" of the UI.

*   **Display & Headline Scale:** Use `display-lg` and `headline-lg` with tight letter-spacing (-0.02em). These are your "Editorial Statements." They should feel authoritative and large, often used in asymmetric layouts where text overlaps a container edge.
*   **Title Scale:** `title-lg` and `title-md` act as the functional anchors. Use these for property names and financial headers.
*   **Body & Label Scale:** `body-md` is the workhorse. Ensure a line-height of 1.5x to maintain readability in dense financial tables or property descriptions.

The contrast between the oversized `display` type and the utilitarian `body` type creates a "High-End Magazine" feel that elevates the brand above standard SaaS templates.

---

## 4. Elevation & Depth
In this system, hierarchy is communicated through **Tonal Layering**, not structural scaffolding.

### The Layering Principle
Depth is achieved by "stacking" surface tiers. Place a `surface-container-lowest` card (Pure White) on a `surface-container-low` section (Soft Grey-Blue) to create a soft, natural lift.

### Ambient Shadows
Shadows must be "Ambient," not "Drop." 
*   **Value:** Blur: 40px | Spread: -10px | Opacity: 6%.
*   **Color:** Use a tinted version of `on-surface` (#1b1c1e) mixed with a hint of `primary` to mimic natural light passing through a high-altitude atmosphere.

### The "Ghost Border" Fallback
If a border is required for accessibility (e.g., in high-contrast modes), use a **Ghost Border**: the `outline-variant` (#cac3d8) token at 15% opacity. **Never use 100% opaque borders.**

---

## 5. Components

### Buttons: The Signature Action
*   **Primary:** Gradient fill (`primary` to `primary_container`), `xl` (0.75rem) roundedness. No border.
*   **Secondary:** `surface-container-highest` background with `on-surface` text.
*   **Tertiary:** Ghost style. No background, `primary` text, underlined only on hover.

### Cards: Property & Financial Units
*   **Rule:** Forbid divider lines. 
*   **Styling:** Use `surface-container-lowest` background. Use vertical whitespace (32px+) from the spacing scale to separate the header from the data body.
*   **Interaction:** On hover, transition the background to `surface-bright` and increase the ambient shadow spread.

### Input Fields: The "Quiet" Input
*   **Style:** Minimalist. Only a bottom-weighted "Ghost Border" or a subtle `surface-container-high` background.
*   **Focus State:** Transition to a `primary` 2px bottom-bar with a soft glow (using the ambient shadow settings).

### Property List Items
*   Avoid the "List with Dividers" look. Instead, use alternating backgrounds or simply large gaps of negative space. Each list item should feel like a standalone "object" rather than a row in a spreadsheet.

### Contextual Financial Tooltips
*   **Visuals:** Glassmorphism (`surface` at 80% opacity + blur). 
*   **Purpose:** Use for explaining complex financial metrics in the administrative dashboard without cluttering the main view.

---

## 6. Do's and Don'ts

### Do
*   **Do** use asymmetrical margins. If the left margin is 80px, try a 120px right margin for hero sections to create visual interest.
*   **Do** use "Tonal Highlighting." Highlight a selected row by changing the background color from `surface` to `surface-container-low`, never by adding a border.
*   **Do** prioritize typography scale. If a screen feels "messy," increase the size of the headline and the whitespace around it.

### Don't
*   **Don't** use 100% black (#000000). Use `on-background` (#1b1c1e) to keep the "slate" sophistication.
*   **Don't** use standard "Material Design" shadows. They are too heavy and muddy for this editorial aesthetic.
*   **Don't** cram data. If a table feels tight, move less important columns into a "Details" glassmorphic drawer.
*   **Don't** use sharp corners. Always stick to the `lg` (0.5rem) or `xl` (0.75rem) roundedness scale to maintain the "Soft Minimalism" feel.