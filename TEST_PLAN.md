# Who-Bible Test Plan

**Date:** December 23, 2025

## 1. Setup
1.  Open a terminal in VS Code.
2.  Run the local server:
    ```powershell
    python -m http.server 8080
    ```
3.  Open your browser to `http://localhost:8080`.

## 2. Core Features Test
-   [ ] **Solo Mode**: Click "Solo Mode", play a round, check if score updates.
-   [ ] **Timed Mode**: Click "Timed Mode", verify timer counts down, pause/resume works.
-   [ ] **Study Mode**: Click "Study Mode", search for "David", verify results.
-   [ ] **Scenarios**: Click "Scenarios", answer a moral dilemma, check explanation.

## 3. Community & Online Test
-   [ ] **Community Page**: Click "Community" in the nav bar.
-   [ ] **Profile**: Go to "Profile" tab, change avatar/bio, save, reload page to verify persistence.
-   [ ] **Locations**: Go to "Places" tab, click a location card, verify map updates.
-   [ ] **Concepts**: Go to "Learn" tab, search for a concept.

## 4. Remote Challenge (Requires 2 Browsers)
1.  Open `http://localhost:5500` in **Browser A** (Host).
2.  Open `http://localhost:5500` in **Browser B** (Guest) (Incognito window recommended).
3.  **Host**: Click "Remote Challenge" -> "Create Room". Enter name. Copy Room Code.
4.  **Guest**: Click "Remote Challenge" -> "Join Room". Enter name and Room Code.
5.  **Both**: Click "Ready".
6.  **Verify**:
    -   Game starts on both screens.
    -   Questions are identical.
    -   When Host answers, Guest sees Host's score update.
    -   When Guest answers, Host sees Guest's score update.

## 5. Aesthetics
-   [ ] **Theme**: Click the Sun/Moon icon. Verify "Day" and "Night" themes toggle correctly.
-   [ ] **Responsiveness**: Resize browser window to mobile size. Verify layout adjusts (hamburger menu, stacked grids).
