// Seamless Infinite Scroll Setup
        const techIcons = document.querySelector('#techIcons');
        const originalIcons = Array.from(techIcons.children).map(icon => icon.cloneNode(true));
        const createIconGroup = () => {
            const group = document.createElement('div');
            group.className = 'tech-icons-group';
            originalIcons.forEach(icon => group.appendChild(icon.cloneNode(true)));
            return group;
        };
        techIcons.replaceChildren(createIconGroup(), createIconGroup());
        const updateTechIconsDistance = () => {
            const firstGroup = techIcons.querySelector('.tech-icons-group');
            if (!firstGroup) return;
            techIcons.style.setProperty('--marquee-distance', `${firstGroup.getBoundingClientRect().width}px`);
        };
        const techImages = techIcons.querySelectorAll('img');
        let pendingImages = 0;
        techImages.forEach(image => {
            if (image.complete) return;
            pendingImages += 1;
            const onImageReady = () => { pendingImages -= 1; if (pendingImages === 0) updateTechIconsDistance(); };
            image.addEventListener('load', onImageReady, { once: true });
            image.addEventListener('error', onImageReady, { once: true });
        });
        if (pendingImages === 0) updateTechIconsDistance();
        window.addEventListener('resize', updateTechIconsDistance);

        // Scroll Reveal
        const revealObserver = new IntersectionObserver((entries) => {
            entries.forEach(entry => {
                if (entry.isIntersecting) {
                    entry.target.classList.add('is-visible');
                    revealObserver.unobserve(entry.target);
                }
            });
        }, { threshold: 0.08 });
        document.querySelectorAll('.reveal').forEach(el => revealObserver.observe(el));
