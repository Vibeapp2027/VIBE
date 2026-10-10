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

    // 🎨 Palette: Use IntersectionObserver to update aria-current on scroll
    const observer = new IntersectionObserver((entries) => {
        entries.forEach(entry => {
            if (entry.isIntersecting) {
                const id = entry.target.getAttribute('id');
                navLinks.forEach(nav => {
                    if (nav.getAttribute('href') === `#${id}`) {
                        nav.setAttribute('aria-current', 'true');
                    } else {
                        nav.removeAttribute('aria-current');
                    }
                });
            }
        });
    }, { threshold: 0.5 });

    document.querySelectorAll('main section').forEach(section => {
        observer.observe(section);
    });
});
