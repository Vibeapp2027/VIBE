## 2024-10-24 - Dynamic ARIA and Focus Management
**Learning:** Hardcoding aria-current="page" creates bugs in single-page applications. Dynamic toggling along with programmatic focus management significantly improves accessibility.
**Action:** Use JavaScript to dynamically set aria-current="true" on the active navigation link and manage focus when smooth scrolling between sections by setting tabindex="-1" and calling focus().
## 2024-08-28 - Dynamic ARIA Current for Scrolling
**Learning:** In single-page scroll architectures, applying `aria-current="true"` only on link clicks creates an accessibility bug where users who scroll manually lose their navigation context, as the active state falls out of sync with the viewport.
**Action:** Always implement an `IntersectionObserver` to dynamically toggle `aria-current="true"` based on the visible section, ensuring screen readers and visual states accurately reflect the user's location regardless of how they navigate.
