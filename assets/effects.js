// Hero parallax: based on hero section position (not page scrollY — film sits above)
        const heroCopy = document.getElementById('heroCopy');
        const pageHero = document.querySelector('.page-hero');
        const prefersReducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
        if (heroCopy && pageHero && !prefersReducedMotion) {
            let heroTicking = false;
            const clamp01 = v => Math.min(Math.max(v, 0), 1);
            const updateHero = () => {
                const top = pageHero.getBoundingClientRect().top;
                // 0 while hero is still below/at top; rises as hero scrolls up out of view
                const p = clamp01(-top / 640);
                heroCopy.style.transform = `translateY(${p * 200}px) scale(${1 - p * 0.07})`;
                heroCopy.style.opacity = String(1 - p * 0.9);
                heroTicking = false;
            };
            window.addEventListener('scroll', () => {
                if (!heroTicking) {
                    requestAnimationFrame(updateHero);
                    heroTicking = true;
                }
            }, { passive: true });
            window.addEventListener('resize', updateHero, { passive: true });
            updateHero();
        }

        // Theme reel at top: wheel = film progress (scroll-test proven) + 5 panels
        const themeReel = document.getElementById('themeReel');
        const themeView = document.getElementById('themeReelView');
        const themeVideo = document.getElementById('themeReelVideo');
        const themeHint = document.getElementById('themeReelHint');
        if (themeReel && themeView && themeVideo && !prefersReducedMotion) {
            const panels = Array.from(themeReel.querySelectorAll('.theme-panel'));
            const steps = Array.from(themeReel.querySelectorAll('.theme-reel-steps span'));
            const n = Math.max(panels.length, 1);
            const clamp01 = v => Math.min(Math.max(v, 0), 1);
            // slower full-film travel
            const SENS = 0.0005;

            let p = 0;
            let unlocked = false;
            let released = false;
            let lastIdx = -1;

            // Keep the fixed film behind its own section when visitors follow a
            // deep link or skip straight to the resume before scrubbing the film.
            const updateReelPosition = () => {
                themeView.classList.toggle('is-done', released || window.scrollY > 4);
            };
            window.addEventListener('scroll', updateReelPosition, { passive: true });
            updateReelPosition();

            themeVideo.muted = true;
            themeVideo.defaultMuted = true;
            themeVideo.playsInline = true;
            themeVideo.setAttribute('playsinline', '');
            themeVideo.setAttribute('webkit-playsinline', '');
            themeVideo.loop = false;
            themeVideo.preload = 'auto';
            themeVideo.removeAttribute('autoplay');
            themeVideo.pause();

            const unlock = () => {
                if (unlocked) return Promise.resolve();
                unlocked = true;
                return themeVideo.play().then(() => {
                    themeVideo.pause();
                }).catch(() => {
                    unlocked = false;
                });
            };

            const setPanel = (idx) => {
                if (idx === lastIdx) return;
                lastIdx = idx;
                panels.forEach((el, i) => el.classList.toggle('is-on', i === idx));
                steps.forEach((el, i) => el.classList.toggle('on', i <= idx));
            };

            const applyTime = () => {
                if (!Number.isFinite(themeVideo.duration) || themeVideo.duration <= 0) return;
                if (!themeVideo.paused) themeVideo.pause();
                const t = p * Math.max(themeVideo.duration - 0.05, 0);
                if (Math.abs((themeVideo.currentTime || 0) - t) < 0.01) return;
                try { themeVideo.currentTime = t; } catch (_) {}
            };

            const syncUi = () => {
                setPanel(Math.min(n - 1, Math.floor(p * n + 1e-6)));
                applyTime();
                if (themeHint) themeHint.classList.toggle('is-hide', p > 0.03 || released);
            };

            const onFilmProgress = (delta) => {
                if (p <= 0 && delta < 0) return false;
                if (p >= 1 && delta > 0) {
                    released = true;
                    themeView.classList.add('is-done');
                    if (themeHint) themeHint.classList.add('is-hide');
                    return false;
                }
                if (released && delta < 0 && window.scrollY <= 2) {
                    released = false;
                    themeView.classList.remove('is-done');
                }
                if (released) return false;

                p = clamp01(p + delta * SENS);
                if (p >= 0.999) p = 1;
                syncUi();
                return true;
            };

            const onWheel = (e) => {
                // Anchors and keyboard navigation can skip the reel before it finishes.
                if (window.scrollY > 4) return;
                unlock();
                if (onFilmProgress(e.deltaY)) e.preventDefault();
            };

            let touchY = null;
            window.addEventListener('wheel', onWheel, { passive: false });
            window.addEventListener('touchstart', (e) => {
                touchY = e.touches[0].clientY;
            }, { passive: true });
            window.addEventListener('touchmove', (e) => {
                if (touchY == null) return;
                const y = e.touches[0].clientY;
                const dy = touchY - y;
                touchY = y;
                if (window.scrollY > 4) return;
                unlock();
                if (onFilmProgress(dy * 1.6)) e.preventDefault();
            }, { passive: false });

            themeVideo.addEventListener('loadedmetadata', () => {
                unlock().then(syncUi);
            });
            themeVideo.addEventListener('error', () => {
                console.error('theme video error', themeVideo.error);
            });
            if (themeVideo.readyState >= 1) unlock().then(syncUi);
            else themeVideo.load();
            syncUi();
        }

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
