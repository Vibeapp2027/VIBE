## 2024-10-24 - Dynamic ARIA and Focus Management
**Learning:** Hardcoding aria-current="page" creates bugs in single-page applications. Dynamic toggling along with programmatic focus management significantly improves accessibility.
**Action:** Use JavaScript to dynamically set aria-current="true" on the active navigation link and manage focus when smooth scrolling between sections by setting tabindex="-1" and calling focus().
