# LifeOS Project: TODO List

This document outlines the identified issues in the codebase and prioritizes them for fixing.

---

### High Priority (Critical Bugs)

These issues will likely cause the application to fail or behave unexpectedly. They should be addressed first.

1.  **Duplicate `id` Attributes in `index.html`**:
    *   **Problem**: Multiple HTML elements share the same `id` (e.g., `#level`, `#xp`, `#currency`). This is invalid HTML and will cause JavaScript's `getElementById` to work incorrectly, leading to unpredictable behavior in the UI.
    *   **File**: `index.html`
    *   **Recommendation**: Ensure all `id` attributes are unique across the entire document.

2.  **Conflicting `LifePlanner` Modules**:
    *   **Problem**: Both `script.js` and `planner.js` define a `window.LifePlanner` object. This creates a race condition where the last script to load will overwrite the other, leading to missing functions and data corruption.
    *   **Files**: `script.js`, `planner.js`
    *   **Recommendation**: Consolidate all core logic into a single `LifePlanner` module (likely in `planner.js` as it appears more complete) and remove the duplicate definition from `script.js`.

3.  **Duplicate `saveData` Function**:
    *   **Problem**: The `script.js` file contains two separate declarations for the `saveData` function. The second one overwrites the first.
    *   **File**: `script.js`
    *   **Recommendation**: This will be resolved by consolidating the `LifePlanner` modules.

4.  **Calls to Missing/Stubbed Functions**:
    *   **Problem**: `script.js` calls many functions that are either not defined or are just empty "stub" functions that show an alert. This will result in runtime errors and an incomplete application.
    *   **File**: `script.js`
    *   **Recommendation**: Implement the missing functionality or remove the calls if they are obsolete.

---

### Medium Priority (Code Quality & Maintenance)

These issues make the code harder to read, maintain, and debug.

1.  **Inline Styles in `index.html`**:
    *   **Problem**: Many elements use the `style` attribute for styling. This violates the separation of concerns (HTML for structure, CSS for presentation) and makes styling difficult to manage.
    *   **File**: `index.html`
    *   **Recommendation**: Move all inline styles to the `style.css` file.

2.  **Inline JavaScript in `index.html`**:
    *   **Problem**: The HTML contains inline `onclick` attributes and `<script>` blocks.
    *   **File**: `index.html`
    *   **Recommendation**: Replace `onclick` attributes with `addEventListener` in the JavaScript files. Move inline `<script>` blocks to external `.js` files.

3.  **Commented-Out Code**:
    *   **Problem**: `script.js` contains large, commented-out blocks of legacy code. This clutters the file and makes it difficult to understand the current logic.
    *   **File**: `script.js`
    *   **Recommendation**: Remove the dead code.

---

### Low Priority (Readability)

1.  **Mixed Languages**:
    *   **Problem**: The code contains a mix of Russian and English in comments, function names, and UI text.
    *   **Files**: `index.html`, `script.js`, `planner.js`
    *   **Recommendation**: Standardize on a single language for consistency.

