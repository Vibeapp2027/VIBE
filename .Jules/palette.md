## 2024-10-24 - Dynamic ARIA and Focus Management
**Learning:** Hardcoding aria-current="page" creates bugs in single-page applications. Dynamic toggling along with programmatic focus management significantly improves accessibility.
**Action:** Use JavaScript to dynamically set aria-current="true" on the active navigation link and manage focus when smooth scrolling between sections by setting tabindex="-1" and calling focus().
## 2026-09-02 - Dynamic aria-current synchronization on scroll
**Learning:** For single-page scrolling sites, relying solely on click events to set `aria-current` creates accessibility bugs, as users lose context of their active section when they scroll manually.
**Action:** Use an `IntersectionObserver` to dynamically synchronize the `aria-current="true"` attribute on navigation anchors as their corresponding sections enter the viewport.
