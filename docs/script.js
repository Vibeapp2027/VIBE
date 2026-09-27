document.addEventListener('DOMContentLoaded', () => {
    const navLinks = document.querySelectorAll('.nav-links a[href^="#"]');

    navLinks.forEach(link => {
        link.addEventListener('click', function(e) {
            e.preventDefault();
            const targetId = this.getAttribute('href');
            if (targetId && targetId.startsWith('#')) {
                const targetElement = document.querySelector(targetId);
                if (targetElement) {
                    targetElement.scrollIntoView({ behavior: 'smooth' });

                    navLinks.forEach(nav => nav.removeAttribute('aria-current'));
                    this.setAttribute('aria-current', 'true');

                    targetElement.setAttribute('tabindex', '-1');
                    targetElement.focus();

                    window.history.pushState(null, '', targetId);
                }
            }
        });
    });
});
