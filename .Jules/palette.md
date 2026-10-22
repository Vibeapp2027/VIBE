## 2025-01-24 - Dynamic aria-current synchronization on scroll
**Learning:** For single-page scrolling sites, relying only on click events to set aria-current creates accessibility bugs when users scroll manually.
**Action:** Use an IntersectionObserver to dynamically synchronize the aria-current="true" attribute on navigation anchors as their corresponding sections enter the viewport.
