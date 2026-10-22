document.addEventListener('DOMContentLoaded', () => {
    const allInternalLinks = document.querySelectorAll('a[href^="#"]');
    const navLinks = document.querySelectorAll('.nav-links a[href^="#"]');
    const sections = document.querySelectorAll('main section[id]');

    allInternalLinks.forEach(link => {
        link.addEventListener('click', function(e) {
            const targetId = this.getAttribute('href');
            if (targetId && targetId.startsWith('#') && targetId.length > 1) {
                const targetElement = document.querySelector(targetId);
                if (targetElement) {
                    e.preventDefault();
                    targetElement.scrollIntoView({ behavior: 'smooth' });

                    targetElement.setAttribute('tabindex', '-1');
                    targetElement.focus();

                    window.history.pushState(null, '', targetId);
                }
            }
        });
    });

    const observerOptions = {
        root: null,
        rootMargin: '-50% 0px -50% 0px',
        threshold: 0
    };

    const observer = new IntersectionObserver((entries) => {
        entries.forEach(entry => {
            if (entry.isIntersecting) {
                navLinks.forEach(nav => {
                    if (nav.getAttribute('href') === `#${entry.target.id}`) {
                        nav.setAttribute('aria-current', 'true');
                    } else {
                        nav.removeAttribute('aria-current');
                    }
                });
            }
        });
    }, observerOptions);

    sections.forEach(section => observer.observe(section));
});
