document.addEventListener('DOMContentLoaded', () => {
    const navContainer = document.querySelector('.nav-links');
    if (!navContainer) return;

    // ⚡ Bolt: Use event delegation to reduce memory overhead from multiple event listeners
    navContainer.addEventListener('click', function(e) {
        const link = e.target.closest('a[href^="#"]');
        if (!link) return;

        e.preventDefault();
        const targetId = link.getAttribute('href');
        if (targetId && targetId.startsWith('#')) {
            const targetElement = document.querySelector(targetId);
            if (targetElement) {
                targetElement.scrollIntoView({ behavior: 'smooth' });

                const navLinks = navContainer.querySelectorAll('a[href^="#"]');
                navLinks.forEach(nav => nav.removeAttribute('aria-current'));
                link.setAttribute('aria-current', 'true');

                targetElement.setAttribute('tabindex', '-1');
                targetElement.focus();

                window.history.pushState(null, '', targetId);
            }
        }
    });
});
