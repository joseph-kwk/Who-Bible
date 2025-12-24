# Redesign Plan: Study & Scenario Modes

## 1. Study Mode Reimagined
**Goal:** Transform the list-based "Bible People Explorer" into a visually engaging, grid-based discovery experience.

### Key Changes:
- **Grid Layout:** Replace the vertical list with a responsive grid of "Person Cards".
- **Person Cards:**
  - **Visuals:** Glassmorphic cards with a subtle gradient border.
  - **Content:** Name, Occupation (icon), Key Event (truncated), and "Read More" button.
  - **Interactivity:** Hover effects (lift up, glow).
- **Enhanced Filtering:**
  - **Search:** Large, centered search bar with real-time filtering.
  - **Chips:** Filter chips (e.g., "Kings", "Prophets", "Women of Bible") for quick access.
- **Detail View:**
  - Instead of expanding in-place, clicking a card opens a detailed **Side Panel** or **Modal** with full information (Relationships, Events, Verses).

### Implementation Steps:
1.  **CSS Grid:** Update `.people-list` to use `display: grid`.
2.  **Card Component:** Create a new HTML structure for person items in `renderPeopleList`.
3.  **Detail View:** Implement a `showPersonDetails(person)` function and corresponding UI container.

## 2. Scenario Mode Reimagined
**Goal:** Create a distinct, immersive "Roleplay" feel for Scenario Mode, separating it from the standard quiz look.

### Key Changes:
- **Immersive Container:**
  - Use a centered, focused "Scenario Card" that dominates the screen.
  - distinct background overlay (e.g., darker, more dramatic).
- **Storytelling UI:**
  - **Context:** Display the scenario context (Who, Where, When) clearly at the top.
  - **Dilemma:** Large, readable text for the moral dilemma.
- **Decision Interface:**
  - **Choice Cards:** Instead of simple buttons, use large clickable areas for each option.
  - **Feedback:** Immediate visual feedback (Green/Red flash) upon selection, followed by the biblical outcome and verse.
- **Progress Tracking:**
  - A "Journey" progress bar or step indicator.

### Implementation Steps:
1.  **Scenario Container:** Create a specific `#scenario-container` in HTML (or modify `#quiz` dynamically).
2.  **Styling:** Add specific CSS classes (e.g., `.mode-scenario`) to the game area to switch styles.
3.  **Interaction:** Update `renderScenarioQuestion` to generate the new card-based layout.

## 3. Theme & Modal Fixes (Completed)
- **Modals:** Fixed duplicate event listeners that caused conflicts and prevented closing.
- **Theme:** Verified logic; ensured persistence works correctly.
