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

    const observerOptions = {
        root: null,
        rootMargin: '0px',
        threshold: 0.5
    };

    const observer = new IntersectionObserver((entries) => {
        entries.forEach(entry => {
            if (entry.isIntersecting) {
                const id = entry.target.getAttribute('id');
                const activeLink = document.querySelector(`.nav-links a[href="#${id}"]`);

                if (activeLink) {
                    navLinks.forEach(nav => nav.removeAttribute('aria-current'));
                    activeLink.setAttribute('aria-current', 'true');
                }
            }
        });
    }, observerOptions);

    document.querySelectorAll('section[id]').forEach(section => {
        observer.observe(section);
    });
});
