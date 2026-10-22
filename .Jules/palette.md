## 2023-10-25 - Internal Link Focus Management
**Learning:** Hardcoding anchor link scripts to only target navigation elements (e.g., .nav-links a) excludes standalone buttons that link to internal sections, causing them to break smooth scrolling and fail to shift keyboard focus.
**Action:** Apply focus management and smooth scrolling universally to all internal hash links (a[href^="#"]) to ensure consistent accessibility. Also use IntersectionObserver to dynamically manage active states rather than hardcoding them on click.
