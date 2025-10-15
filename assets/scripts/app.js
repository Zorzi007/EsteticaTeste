const prefersDarkScheme = typeof window.matchMedia === 'function' ? window.matchMedia('(prefers-color-scheme: dark)') : null;
const prefersReducedMotion = typeof window.matchMedia === 'function' ? window.matchMedia('(prefers-reduced-motion: reduce)') : null;
const rootElement = document.documentElement;
const siteHeader = document.querySelector('[data-header]');
const navToggle = document.getElementById('navToggle');
const siteNav = document.querySelector('.site-nav');
const navLinks = siteNav ? [...siteNav.querySelectorAll('[data-nav-link]')] : [];

const FALLBACK_IMAGE_DATA_URL = (() => {
    const svgMarkup = `
        <svg xmlns="http://www.w3.org/2000/svg" width="1600" height="900" viewBox="0 0 1600 900">
            <defs>
                <linearGradient id="gradient" x1="0%" y1="0%" x2="100%" y2="100%">
                    <stop offset="0%" stop-color="#141a24" />
                    <stop offset="100%" stop-color="#0a0f17" />
                </linearGradient>
            </defs>
            <rect width="1600" height="900" fill="url(#gradient)" />
            <g fill="#ff3b3f" font-family="'Space Grotesk', 'Manrope', 'Segoe UI', sans-serif" text-anchor="middle">
                <text x="50%" y="45%" font-size="68" opacity="0.9">Imagem indisponível</text>
                <text x="50%" y="58%" font-size="28" opacity="0.6">Verifique sua conexão ou tente novamente</text>
            </g>
        </svg>`;
    return `data:image/svg+xml;charset=UTF-8,${encodeURIComponent(svgMarkup.trim())}`;
})();

// Gracefully replace broken image sources with inline SVG placeholder.
const registerImageFallbacks = () => {
    const images = document.querySelectorAll('img');
    images.forEach(image => {
        image.addEventListener('error', () => {
            if (image.dataset.hasFallback === 'true') {
                return;
            }
            image.dataset.hasFallback = 'true';
            image.srcset = '';
            image.src = FALLBACK_IMAGE_DATA_URL;
            image.classList.add('is-fallback');
        });

        if (image.complete && image.naturalWidth === 0) {
            image.dispatchEvent(new Event('error'));
        }
    });
};

registerImageFallbacks();

const THEME_STORAGE_KEY = 'apexforge-theme';
const dataLayer = window.dataLayer || (window.dataLayer = []);

const setTheme = (theme, persist = true) => {
    rootElement.setAttribute('data-theme', theme);
    if (persist) {
        localStorage.setItem(THEME_STORAGE_KEY, theme);
    } else {
        localStorage.removeItem(THEME_STORAGE_KEY);
    }
};

const storedTheme = localStorage.getItem(THEME_STORAGE_KEY);

if (storedTheme) {
    setTheme(storedTheme, true);
} else if (prefersDarkScheme) {
    setTheme(prefersDarkScheme.matches ? 'dark' : 'light', false);
} else {
    setTheme('dark', false);
}

const handleSystemThemeChange = event => {
    if (!localStorage.getItem(THEME_STORAGE_KEY)) {
        setTheme(event.matches ? 'dark' : 'light', false);
    }
};

if (prefersDarkScheme) {
    if (typeof prefersDarkScheme.addEventListener === 'function') {
        prefersDarkScheme.addEventListener('change', handleSystemThemeChange);
    } else if (typeof prefersDarkScheme.addListener === 'function') {
        prefersDarkScheme.addListener(handleSystemThemeChange);
    }
}

const themeToggle = document.getElementById('themeToggle');
if (themeToggle) {
    themeToggle.addEventListener('click', () => {
        const nextTheme = rootElement.getAttribute('data-theme') === 'dark' ? 'light' : 'dark';
        setTheme(nextTheme, true);
    });
}

const handleHeaderState = () => {
    if (!siteHeader) {
        return;
    }
    siteHeader.classList.toggle('is-condensed', window.scrollY > 40);
};

let scrollScheduled = false;
window.addEventListener('scroll', () => {
    if (scrollScheduled) {
        return;
    }
    scrollScheduled = true;
    window.requestAnimationFrame(() => {
        handleHeaderState();
        scrollScheduled = false;
    });
});

handleHeaderState();

const setNavVisibility = isOpen => {
    if (!navToggle || !siteNav) {
        return;
    }
    siteNav.setAttribute('data-visible', String(isOpen));
    navToggle.setAttribute('aria-expanded', String(isOpen));
    navToggle.setAttribute('aria-label', isOpen ? 'Fechar menu' : 'Abrir menu');
    navToggle.classList.toggle('is-active', isOpen);
    document.body.classList.toggle('has-open-nav', isOpen);
};

if (navToggle && siteNav) {
    navToggle.addEventListener('click', () => {
        const isOpen = siteNav.getAttribute('data-visible') === 'true';
        setNavVisibility(!isOpen);
    });

    navLinks.forEach(link => {
        link.addEventListener('click', () => setNavVisibility(false));
    });

    window.addEventListener('keydown', event => {
        if (event.key === 'Escape') {
            const isOpen = siteNav.getAttribute('data-visible') === 'true';
            if (isOpen) {
                setNavVisibility(false);
            }
        }
    });

    window.addEventListener('resize', () => {
        if (window.innerWidth > 880) {
            setNavVisibility(false);
        }
    });
}

const revealTargets = document.querySelectorAll('[data-reveal]');
if (revealTargets.length) {
    const observer = new IntersectionObserver(
        entries => {
            entries.forEach(entry => {
                if (entry.isIntersecting) {
                    entry.target.classList.add('is-visible');
                    observer.unobserve(entry.target);
                }
            });
        },
        { threshold: 0.2 }
    );

    revealTargets.forEach(target => observer.observe(target));
}

const galleryTrack = document.querySelector('.gallery__track');
const gallerySlides = galleryTrack ? [...galleryTrack.children] : [];
const prevButton = document.getElementById('galleryPrev');
const nextButton = document.getElementById('galleryNext');
const counter = document.querySelector('.gallery__counter');
let currentIndex = 0;

const updateGallery = newIndex => {
    if (!galleryTrack) {
        return;
    }

    currentIndex = (newIndex + gallerySlides.length) % gallerySlides.length;
    const offset = currentIndex * -100;
    galleryTrack.style.transform = `translate3d(${offset}%, 0, 0)`;

    gallerySlides.forEach((slide, index) => {
        slide.classList.toggle('is-active', index === currentIndex);
    });

    if (counter) {
        counter.textContent = `${currentIndex + 1} / ${gallerySlides.length}`;
    }
};

if (gallerySlides.length) {
    if (galleryTrack && !galleryTrack.hasAttribute('tabindex')) {
        galleryTrack.setAttribute('tabindex', '0');
    }

    updateGallery(0);

    prevButton?.addEventListener('click', () => updateGallery(currentIndex - 1));
    nextButton?.addEventListener('click', () => updateGallery(currentIndex + 1));

    let touchStartX = null;
    let activePointerId = null;

    const concludeGesture = event => {
        if (activePointerId === null || event.pointerId !== activePointerId) {
            return;
        }

        if (touchStartX !== null) {
            const delta = event.clientX - touchStartX;
            const swipeThreshold = 56;

            if (Math.abs(delta) > swipeThreshold) {
                updateGallery(currentIndex + (delta < 0 ? 1 : -1));
            }
        }

        touchStartX = null;
        galleryTrack?.classList.remove('is-grabbing');
        if (galleryTrack?.hasPointerCapture(activePointerId)) {
            galleryTrack.releasePointerCapture(activePointerId);
        }
        activePointerId = null;
    };

    galleryTrack?.addEventListener('pointerdown', event => {
        activePointerId = event.pointerId;
        touchStartX = event.clientX;
        galleryTrack.classList.add('is-grabbing');
        galleryTrack.setPointerCapture(activePointerId);
    });

    galleryTrack?.addEventListener('pointerup', concludeGesture);
    galleryTrack?.addEventListener('pointercancel', concludeGesture);
    galleryTrack?.addEventListener('pointerleave', event => {
        if (activePointerId !== null) {
            concludeGesture(event);
        }
    });

    galleryTrack?.addEventListener('keydown', event => {
        if (event.key === 'ArrowRight') {
            updateGallery(currentIndex + 1);
        }
        if (event.key === 'ArrowLeft') {
            updateGallery(currentIndex - 1);
        }
    });
}

const telemetryCanvas = document.getElementById('telemetryChart');
const telemetryButtons = document.querySelectorAll('[data-telemetry]');
const telemetryCaption = document.querySelector('.telemetry__caption');
const telemetryDefaultCaption = telemetryCaption?.dataset.default ?? '';
const telemetryVisual = document.querySelector('.telemetry__visual');
const telemetryTooltip = telemetryVisual ? document.createElement('div') : null;

if (telemetryTooltip) {
    telemetryTooltip.className = 'telemetry__tooltip';
    telemetryTooltip.setAttribute('role', 'status');
    telemetryTooltip.setAttribute('aria-live', 'polite');
    telemetryTooltip.textContent = telemetryDefaultCaption;
    telemetryVisual.appendChild(telemetryTooltip);
}

const telemetryLapTimes = [0, 9, 18, 27, 36, 45, 54, 63, 72, 81];
const telemetryProfiles = {
    ferrari: {
        label: 'Ferrari 458 Speciale',
        color: '#ff3b3f',
        speed: [0, 162, 242, 288, 308, 302, 296, 312, 322, 325],
        regen: [0, 8, 16, 14, 12, 18, 22, 20, 16, 12]
    },
    audi: {
        label: 'Audi R8 V10 Performance',
        color: '#ff7f4d',
        speed: [0, 150, 228, 272, 292, 284, 276, 288, 298, 306],
        regen: [0, 12, 20, 18, 16, 19, 17, 15, 14, 12]
    },
    camaro: {
        label: 'Chevrolet Camaro ZL1',
        color: '#ff5f5f',
        speed: [0, 142, 214, 262, 280, 272, 264, 276, 286, 294],
        regen: [0, 6, 12, 10, 8, 12, 15, 13, 10, 7]
    }
};

const telemetryReference = [0, 160, 236, 280, 300, 296, 290, 302, 314, 322];
const telemetryConfig = {
    speedMax: 380,
    regenMax: 40,
    animationDuration: 760
};

const cloneSeries = series => ({
    speed: [...series.speed],
    regen: [...series.regen]
});

const telemetryState = {
    activeKey: 'ferrari',
    fromData: cloneSeries(telemetryProfiles.ferrari),
    toData: cloneSeries(telemetryProfiles.ferrari),
    progress: 1,
    animationStart: null,
    animationFrame: null,
    pointerRatio: null,
    bounds: null
};

const ensureTelemetryResolution = () => {
    if (!telemetryCanvas) {
        return;
    }
    const rect = telemetryCanvas.getBoundingClientRect();
    if (!rect.width || !rect.height) {
        return;
    }
    const dpr = window.devicePixelRatio || 1;
    telemetryCanvas.width = rect.width * dpr;
    telemetryCanvas.height = rect.height * dpr;
    const ctx = telemetryCanvas.getContext('2d');
    if (ctx) {
        ctx.setTransform(1, 0, 0, 1, 0, 0);
        ctx.scale(dpr, dpr);
    }
    telemetryState.bounds = { width: rect.width, height: rect.height };
};

const lerp = (start, end, factor) => start + (end - start) * factor;

const getInterpolatedSeries = progress => ({
    speed: telemetryState.toData.speed.map((value, index) => lerp(telemetryState.fromData.speed[index], value, progress)),
    regen: telemetryState.toData.regen.map((value, index) => lerp(telemetryState.fromData.regen[index], value, progress))
});

const updateTelemetryCaption = series => {
    if (!telemetryCaption) {
        return;
    }

    if (telemetryState.pointerRatio === null) {
        telemetryCaption.textContent = telemetryDefaultCaption;
        return;
    }

    const totalSegments = series.speed.length - 1;
    const index = Math.min(
        totalSegments,
        Math.max(0, Math.round(telemetryState.pointerRatio * totalSegments))
    );
    const lapTime = telemetryLapTimes[index];
    const speed = Math.round(series.speed[index]);
    const regen = Math.round(series.regen[index]);
    const boost = Math.max(0, Math.round(series.speed[index] - telemetryReference[index]));

    telemetryCaption.textContent = `T${lapTime}s · ${speed} km/h · Recuperação ${regen}%` +
        (boost > 0 ? ` · Boost +${boost} km/h` : '');
};

const drawTelemetry = () => {
    if (!telemetryCanvas) {
        return;
    }

    ensureTelemetryResolution();
    const ctx = telemetryCanvas.getContext('2d');
    if (!ctx || !telemetryState.bounds) {
        return;
    }

    if (telemetryTooltip) {
        telemetryTooltip.classList.remove('is-visible');
    }

    const width = telemetryState.bounds.width;
    const height = telemetryState.bounds.height;
    ctx.clearRect(0, 0, width, height);

    const padding = { top: 36, right: 32, bottom: 52, left: 68 };
    const chartWidth = width - padding.left - padding.right;
    const chartHeight = height - padding.top - padding.bottom;
    const speedHeight = chartHeight * 0.7;
    const regenHeight = chartHeight - speedHeight;
    const totalSegments = telemetryLapTimes.length - 1;

    const series = telemetryState.progress >= 1
        ? cloneSeries(telemetryState.toData)
        : getInterpolatedSeries(telemetryState.progress);

    const xForIndex = index => padding.left + (chartWidth * (index / totalSegments));
    const yForSpeed = speed => padding.top + speedHeight * (1 - Math.min(speed, telemetryConfig.speedMax) / telemetryConfig.speedMax);
    const regenBaseline = padding.top + speedHeight + regenHeight;
    const yForRegen = regen => regenBaseline - regenHeight * (Math.min(regen, telemetryConfig.regenMax) / telemetryConfig.regenMax);

    ctx.save();
    ctx.strokeStyle = 'rgba(255, 255, 255, 0.08)';
    ctx.lineWidth = 1;
    for (let i = 0; i <= totalSegments; i += 1) {
        const x = xForIndex(i);
        ctx.beginPath();
        ctx.moveTo(x, padding.top);
        ctx.lineTo(x, regenBaseline);
        ctx.stroke();
    }

    for (let speed = 80; speed <= telemetryConfig.speedMax; speed += 80) {
        const y = yForSpeed(speed);
        ctx.beginPath();
        ctx.moveTo(padding.left, y);
        ctx.lineTo(padding.left + chartWidth, y);
        ctx.stroke();
    }
    ctx.restore();

    ctx.save();
    ctx.fillStyle = 'rgba(255, 255, 255, 0.45)';
    ctx.font = '12px "Manrope", "Segoe UI", sans-serif';
    ctx.textAlign = 'right';
    ctx.textBaseline = 'middle';
    for (let speed = 80; speed <= telemetryConfig.speedMax; speed += 80) {
        const y = yForSpeed(speed);
        ctx.fillText(`${speed}`, padding.left - 12, y);
    }
    ctx.textAlign = 'center';
    ctx.textBaseline = 'top';
    telemetryLapTimes.forEach((time, index) => {
        const x = xForIndex(index);
        ctx.fillText(`${time}s`, x, regenBaseline + 8);
    });
    ctx.restore();

    ctx.save();
    ctx.setLineDash([6, 6]);
    ctx.strokeStyle = 'rgba(255, 255, 255, 0.4)';
    ctx.lineWidth = 1.2;
    ctx.beginPath();
    telemetryReference.forEach((speed, index) => {
        const x = xForIndex(index);
        const y = yForSpeed(speed);
        if (index === 0) {
            ctx.moveTo(x, y);
        } else {
            ctx.lineTo(x, y);
        }
    });
    ctx.stroke();
    ctx.restore();

    ctx.save();
    const regenGradient = ctx.createLinearGradient(0, yForRegen(telemetryConfig.regenMax), 0, regenBaseline);
    regenGradient.addColorStop(0, 'rgba(255, 179, 71, 0.32)');
    regenGradient.addColorStop(1, 'rgba(255, 59, 63, 0.06)');
    ctx.fillStyle = regenGradient;
    ctx.beginPath();
    ctx.moveTo(padding.left, regenBaseline);
    series.regen.forEach((regen, index) => {
        const x = xForIndex(index);
        const y = yForRegen(regen);
        ctx.lineTo(x, y);
    });
    ctx.lineTo(padding.left + chartWidth, regenBaseline);
    ctx.closePath();
    ctx.fill();

    ctx.strokeStyle = 'rgba(255, 179, 71, 0.65)';
    ctx.lineWidth = 1.2;
    ctx.beginPath();
    series.regen.forEach((regen, index) => {
        const x = xForIndex(index);
        const y = yForRegen(regen);
        if (index === 0) {
            ctx.moveTo(x, y);
        } else {
            ctx.lineTo(x, y);
        }
    });
    ctx.stroke();
    ctx.restore();

    ctx.save();
    const speedGradient = ctx.createLinearGradient(0, padding.top, 0, padding.top + speedHeight);
    speedGradient.addColorStop(0, 'rgba(255, 59, 63, 0.95)');
    speedGradient.addColorStop(1, 'rgba(255, 179, 71, 0.75)');
    ctx.strokeStyle = speedGradient;
    ctx.lineWidth = 3;
    ctx.lineJoin = 'round';
    ctx.beginPath();
    series.speed.forEach((speed, index) => {
        const x = xForIndex(index);
        const y = yForSpeed(speed);
        if (index === 0) {
            ctx.moveTo(x, y);
        } else {
            ctx.lineTo(x, y);
        }
    });
    ctx.stroke();
    ctx.restore();

    if (telemetryState.pointerRatio !== null) {
        const idx = Math.min(totalSegments, Math.max(0, Math.round(telemetryState.pointerRatio * totalSegments)));
        const pointerX = xForIndex(idx);
        const speedY = yForSpeed(series.speed[idx]);
        const regenY = yForRegen(series.regen[idx]);
        const lapTime = telemetryLapTimes[idx];
        const speed = Math.round(series.speed[idx]);
        const regen = Math.round(series.regen[idx]);
        const boost = Math.max(0, Math.round(series.speed[idx] - telemetryReference[idx]));

        ctx.save();
        ctx.strokeStyle = 'rgba(255, 255, 255, 0.3)';
        ctx.setLineDash([4, 6]);
        ctx.beginPath();
        ctx.moveTo(pointerX, padding.top);
        ctx.lineTo(pointerX, regenBaseline);
        ctx.stroke();

        ctx.setLineDash([]);
        ctx.fillStyle = '#0a0d14';
        ctx.strokeStyle = '#ffffff';
        ctx.lineWidth = 1.2;
        ctx.beginPath();
        ctx.arc(pointerX, speedY, 6, 0, Math.PI * 2);
        ctx.fill();
        ctx.stroke();

        ctx.beginPath();
        ctx.arc(pointerX, regenY, 5, 0, Math.PI * 2);
        ctx.fillStyle = 'rgba(255, 179, 71, 0.9)';
        ctx.fill();
        ctx.restore();

        if (telemetryTooltip && telemetryVisual) {
            const visualRect = telemetryVisual.getBoundingClientRect();
            const canvasRect = telemetryCanvas.getBoundingClientRect();
            const tooltipLeft = pointerX + canvasRect.left - visualRect.left;
            const tooltipTop = Math.min(speedY, regenY) + canvasRect.top - visualRect.top - 40;
            const clampedLeft = Math.min(visualRect.width - 32, Math.max(32, tooltipLeft));
            const clampedTop = Math.max(12, tooltipTop);

            telemetryTooltip.textContent = `T${lapTime}s • ${speed} km/h • Recuperação ${regen}%` +
                (boost > 0 ? ` • Boost +${boost} km/h` : '');
            telemetryTooltip.style.left = `${clampedLeft}px`;
            telemetryTooltip.style.top = `${clampedTop}px`;
            telemetryTooltip.classList.add('is-visible');
        }
    }

    updateTelemetryCaption(series);
};

const cancelTelemetryAnimation = () => {
    if (telemetryState.animationFrame) {
        cancelAnimationFrame(telemetryState.animationFrame);
        telemetryState.animationFrame = null;
    }
};

const animateTelemetry = timestamp => {
    if (telemetryState.progress >= 1 || prefersReducedMotion?.matches) {
        telemetryState.progress = 1;
        telemetryState.animationStart = null;
        cancelTelemetryAnimation();
        drawTelemetry();
        return;
    }

    if (!telemetryState.animationStart) {
        telemetryState.animationStart = timestamp;
    }

    const elapsed = timestamp - telemetryState.animationStart;
    telemetryState.progress = Math.min(1, elapsed / telemetryConfig.animationDuration);
    drawTelemetry();

    if (telemetryState.progress < 1) {
        telemetryState.animationFrame = requestAnimationFrame(animateTelemetry);
    } else {
        telemetryState.animationStart = null;
        cancelTelemetryAnimation();
    }
};

const updateTelemetryButtons = key => {
    telemetryButtons.forEach(button => {
        const isActive = button.dataset.telemetry === key;
        button.classList.toggle('is-active', isActive);
        button.setAttribute('aria-pressed', String(isActive));
    });
};

const setTelemetryProfile = key => {
    if (!telemetryProfiles[key] || key === telemetryState.activeKey) {
        return;
    }

    cancelTelemetryAnimation();

    const currentSeries = telemetryState.progress >= 1
        ? cloneSeries(telemetryState.toData)
        : getInterpolatedSeries(telemetryState.progress);

    telemetryState.fromData = currentSeries;
    telemetryState.toData = cloneSeries(telemetryProfiles[key]);
    telemetryState.activeKey = key;
    telemetryState.progress = prefersReducedMotion?.matches ? 1 : 0;
    telemetryState.animationStart = null;

    updateTelemetryButtons(key);

    if (prefersReducedMotion?.matches) {
        drawTelemetry();
    } else {
        telemetryState.animationFrame = requestAnimationFrame(animateTelemetry);
    }
};

const handleTelemetryPointer = event => {
    if (!telemetryCanvas) {
        return;
    }
    if (event.pointerType === 'touch') {
        event.preventDefault();
    }
    const rect = telemetryCanvas.getBoundingClientRect();
    const ratio = (event.clientX - rect.left) / rect.width;
    telemetryState.pointerRatio = Math.min(1, Math.max(0, ratio));
    drawTelemetry();
};

if (telemetryCanvas) {
    ensureTelemetryResolution();
    drawTelemetry();
    updateTelemetryButtons(telemetryState.activeKey);

    telemetryButtons.forEach(button => {
        button.addEventListener('click', () => setTelemetryProfile(button.dataset.telemetry));
    });

    telemetryCanvas.addEventListener('pointermove', handleTelemetryPointer);
    telemetryCanvas.addEventListener('pointerdown', handleTelemetryPointer);
    telemetryCanvas.addEventListener('pointerleave', () => {
        telemetryState.pointerRatio = null;
        updateTelemetryCaption(telemetryState.toData);
        drawTelemetry();
        if (telemetryTooltip) {
            telemetryTooltip.classList.remove('is-visible');
        }
    });

    window.addEventListener('resize', () => {
        ensureTelemetryResolution();
        drawTelemetry();
    });

    const handleMotionPreference = () => {
        cancelTelemetryAnimation();
        telemetryState.progress = 1;
        telemetryState.animationStart = null;
        drawTelemetry();
    };

    if (prefersReducedMotion) {
        if (typeof prefersReducedMotion.addEventListener === 'function') {
            prefersReducedMotion.addEventListener('change', handleMotionPreference);
        } else if (typeof prefersReducedMotion.addListener === 'function') {
            prefersReducedMotion.addListener(handleMotionPreference);
        }
    }
}

const submitLead = payload =>
    new Promise((resolve, reject) => {
        setTimeout(() => {
            if (payload?.nome?.toLowerCase().includes('teste-falha')) {
                reject(new Error('Simulação de falha'));
                return;
            }
            resolve({ ok: true });
        }, 900);
    });

const contactForm = document.querySelector('.contact__form');

if (contactForm) {
    contactForm.addEventListener('submit', async event => {
        event.preventDefault();

        const formData = new FormData(contactForm);
        const entries = Object.fromEntries(formData.entries());
        const hasEmpty = Object.entries(entries).some(([key, value]) => key !== 'optin' && !value);

        if (hasEmpty) {
            showToast('Preencha todos os campos obrigatórios antes de enviar.', 'warning');
            return;
        }

        contactForm.classList.add('is-loading');

        try {
            const response = await submitLead(entries);
            if (!response?.ok) {
                throw new Error('Falha ao enviar lead');
            }

            dataLayer.push({
                event: 'lead_submitted',
                leadCategory: entries.interesse,
                leadOptin: Boolean(entries.optin),
                leadSource: 'apex-forge-portfolio'
            });

            contactForm.reset();
            showToast('Mensagem recebida. Equipe Apex Forge retornará em breve.', 'success');
        } catch (error) {
            console.error('Erro ao enviar form', error);
            showToast('Não foi possível enviar agora. Tente novamente em instantes.', 'warning');
        } finally {
            contactForm.classList.remove('is-loading');
        }
    });
}

const toastContainer = document.createElement('div');
toastContainer.className = 'toast-container';
toastContainer.setAttribute('aria-live', 'polite');
toastContainer.setAttribute('aria-atomic', 'true');
document.body.appendChild(toastContainer);

function showToast(message, variant = 'neutral') {
    const toast = document.createElement('div');
    toast.className = `toast toast--${variant}`;
    toast.textContent = message;
    toast.setAttribute('role', 'status');

    toastContainer.appendChild(toast);

    requestAnimationFrame(() => {
        toast.classList.add('is-visible');
    });

    setTimeout(() => {
        toast.classList.remove('is-visible');
        toast.addEventListener('transitionend', () => toast.remove(), { once: true });
    }, 3800);
}

if (window.IntersectionObserver) {
    const sectionObserver = new IntersectionObserver(
        entries => {
            entries.forEach(entry => {
                if (!entry.isIntersecting) {
                    return;
                }
                const id = entry.target.getAttribute('id');
                navLinks.forEach(link => {
                    const isActive = link.getAttribute('href') === `#${id}`;
                    link.classList.toggle('is-active', isActive);
                    if (isActive) {
                        link.setAttribute('aria-current', 'page');
                    } else {
                        link.removeAttribute('aria-current');
                    }
                });
            });
        },
        {
            rootMargin: '-52% 0px -38% 0px',
            threshold: 0.12
        }
    );

    document.querySelectorAll('main section[id]').forEach(section => sectionObserver.observe(section));
} else if (navLinks.length) {
    navLinks[0].classList.add('is-active');
    navLinks[0].setAttribute('aria-current', 'page');
}
