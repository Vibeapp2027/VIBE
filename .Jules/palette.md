## 2024-10-24 - Dynamic ARIA and Focus Management
**Learning:** Hardcoding aria-current="page" creates bugs in single-page applications. Dynamic toggling along with programmatic focus management significantly improves accessibility.
**Action:** Use JavaScript to dynamically set aria-current="true" on the active navigation link and manage focus when smooth scrolling between sections by setting tabindex="-1" and calling focus().
## 2026-10-24 - Dynamic aria-current synchronization
**Learning:** In single-page scrolling sites, setting aria-current="true" only on click creates an accessibility issue where manual scrolling leaves the navigation state unsynchronized.
**Action:** Use IntersectionObserver to dynamically synchronize the aria-current attribute on navigation anchors as their corresponding sections enter the viewport.
