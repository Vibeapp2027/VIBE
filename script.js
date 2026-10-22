document.addEventListener('DOMContentLoaded', () => {
    const navLinks = document.querySelectorAll('.nav-links a[href^="#"]');

    // 🎨 Palette: Synchronize aria-current with scroll using IntersectionObserver
    const observer = new IntersectionObserver((entries) => {
        entries.forEach(entry => {
            if (entry.isIntersecting) {
                const id = entry.target.getAttribute('id');
                navLinks.forEach(link => {
                    link.removeAttribute('aria-current');
                    if (link.getAttribute('href') === `#${id}`) {
                        link.setAttribute('aria-current', 'true');
                    }
                });
            }
        });
    }, { threshold: 0.5 });

    document.querySelectorAll('section[id]').forEach((section) => {
        observer.observe(section);
    });

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
