## 2024-10-24 - Dynamic ARIA and Focus Management
**Learning:** Hardcoding aria-current="page" creates bugs in single-page applications. Dynamic toggling along with programmatic focus management significantly improves accessibility.
**Action:** Use JavaScript to dynamically set aria-current="true" on the active navigation link and manage focus when smooth scrolling between sections by setting tabindex="-1" and calling focus().
## 2024-05-24 - Dynamic Navigation State on Scroll
**Learning:** Hardcoding or only updating `aria-current` on click for single-page scrolling sites creates an accessibility bug, as the user's viewport context becomes unsynchronized with the navigation context when they scroll manually.
**Action:** Always use an IntersectionObserver to dynamically toggle `aria-current="true"` on the matching navigation anchor when its corresponding section enters the viewport.
