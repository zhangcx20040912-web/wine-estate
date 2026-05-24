/* ============================================================
   美桦君昱 MEI HUA JUN YU — Interactive JS v6.0
   Enhanced Particle Field + Splash Cursor + Scroll Dynamics
   More particles, larger interaction zones, brighter effects
   ============================================================ */

// ----- Particle Field System (Enhanced) -----
class ParticleField {
  constructor() {
    this.canvas = document.getElementById('particle-canvas');
    if (!this.canvas) {
      this.canvas = document.createElement('canvas');
      this.canvas.id = 'particle-canvas';
      document.body.prepend(this.canvas);
    }
    this.ctx = this.canvas.getContext('2d');
    this.particles = [];
    this.mouse = { x: -1000, y: -1000, tx: -1000, ty: -1000 };
    this.particleCount = 120;
    this.connectionDist = 180;
    this.mouseRadius = 220;
    this.time = 0;
    this.isActive = !window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    if (!this.isActive) { this.canvas.style.display = 'none'; return; }

    this.resize();
    this.initParticles();
    this.bindEvents();
    this.animate();
  }

  resize() {
    this.canvas.width = window.innerWidth;
    this.canvas.height = window.innerHeight;
  }

  initParticles() {
    this.particles = [];
    for (let i = 0; i < this.particleCount; i++) {
      this.particles.push({
        x: Math.random() * this.canvas.width,
        y: Math.random() * this.canvas.height,
        vx: (Math.random() - 0.5) * 0.7,
        vy: (Math.random() - 0.5) * 0.7,
        r: Math.random() * 2 + 0.8,
        baseR: Math.random() * 2 + 0.8,
        glow: Math.random() > 0.6,
        phase: Math.random() * Math.PI * 2,
        speed: Math.random() * 0.3 + 0.2
      });
    }
  }

  bindEvents() {
    window.addEventListener('resize', () => this.resize());
    document.addEventListener('mousemove', (e) => {
      this.mouse.tx = e.clientX;
      this.mouse.ty = e.clientY;
    });
    document.addEventListener('touchmove', (e) => {
      this.mouse.tx = e.touches[0].clientX;
      this.mouse.ty = e.touches[0].clientY;
    }, { passive: true });
    // Add click burst
    document.addEventListener('click', (e) => {
      for (let i = 0; i < 5; i++) {
        const angle = (Math.PI * 2 * i) / 5;
        const dist = 30 + Math.random() * 50;
        this.particles.push({
          x: e.clientX, y: e.clientY,
          vx: Math.cos(angle) * (1 + Math.random() * 2),
          vy: Math.sin(angle) * (1 + Math.random() * 2),
          r: 1.5 + Math.random() * 2.5,
          baseR: 1.5 + Math.random() * 2.5,
          glow: true, phase: 0,
          speed: 0.5 + Math.random()
        });
      }
      if (this.particles.length > 200) {
        this.particles.splice(0, this.particles.length - 200);
      }
    });
  }

  animate() {
    this.ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);
    this.time += 0.016;

    // Smooth mouse follow with more responsiveness
    this.mouse.x += (this.mouse.tx - this.mouse.x) * 0.1;
    this.mouse.y += (this.mouse.ty - this.mouse.y) * 0.1;

    const mx = this.mouse.x;
    const my = this.mouse.y;
    const mouseOnScreen = mx > 0 && my > 0 && mx < this.canvas.width && my < this.canvas.height;

    for (const p of this.particles) {
      // Subtle sinusoidal drift
      p.vx += Math.sin(this.time * p.speed + p.phase) * 0.005;
      p.vy += Math.cos(this.time * p.speed + p.phase) * 0.005;

      // Dampen velocity
      p.vx *= 0.999;
      p.vy *= 0.999;

      p.x += p.vx;
      p.y += p.vy;

      // Wrap around edges
      if (p.x < -30) p.x = this.canvas.width + 30;
      if (p.x > this.canvas.width + 30) p.x = -30;
      if (p.y < -30) p.y = this.canvas.height + 30;
      if (p.y > this.canvas.height + 30) p.y = -30;

      // Mouse interaction — repulsion + orbit
      if (mouseOnScreen) {
        const dx = mx - p.x;
        const dy = my - p.y;
        const dist = Math.sqrt(dx * dx + dy * dy);

        if (dist < this.mouseRadius) {
          const force = (this.mouseRadius - dist) / this.mouseRadius;
          const angle = Math.atan2(dy, dx);
          // Repulsion
          p.x -= Math.cos(angle) * force * 2;
          p.y -= Math.sin(angle) * force * 2;
          // Slight orbit
          p.vx += -Math.sin(angle) * force * 0.08;
          p.vy += Math.cos(angle) * force * 0.08;
          // Grow near mouse
          p.r = p.baseR + force * 2.5;
        } else {
          p.r += (p.baseR - p.r) * 0.08;
        }
      }

      // Draw particle
      this.ctx.beginPath();
      this.ctx.arc(p.x, p.y, p.r, 0, Math.PI * 2);

      if (p.glow) {
        // Gold glowing particles
        const glowOpacity = 0.5 + Math.sin(this.time * 2 + p.phase) * 0.2;
        this.ctx.fillStyle = `rgba(201,169,110,${glowOpacity})`;
        this.ctx.shadowBlur = 12;
        this.ctx.shadowColor = `rgba(201,169,110,${glowOpacity * 0.7})`;
      } else {
        this.ctx.fillStyle = 'rgba(200,195,188,0.4)';
        this.ctx.shadowBlur = 0;
      }
      this.ctx.fill();
    }
    this.ctx.shadowBlur = 0;

    // Draw connections between particles
    for (let i = 0; i < this.particles.length; i++) {
      for (let j = i + 1; j < this.particles.length; j++) {
        const dx = this.particles[i].x - this.particles[j].x;
        const dy = this.particles[i].y - this.particles[j].y;
        const dist = Math.sqrt(dx * dx + dy * dy);

        if (dist < this.connectionDist) {
          const opacity = (1 - dist / this.connectionDist) * 0.15;
          this.ctx.beginPath();
          this.ctx.moveTo(this.particles[i].x, this.particles[i].y);
          this.ctx.lineTo(this.particles[j].x, this.particles[j].y);
          this.ctx.strokeStyle = `rgba(201,169,110,${opacity})`;
          this.ctx.lineWidth = 0.6;
          this.ctx.stroke();
        }
      }
    }

    // Draw connections to mouse
    if (mouseOnScreen) {
      for (const p of this.particles) {
        const dx = mx - p.x;
        const dy = my - p.y;
        const dist = Math.sqrt(dx * dx + dy * dy);
        if (dist < this.mouseRadius) {
          const opacity = (1 - dist / this.mouseRadius) * 0.25;
          this.ctx.beginPath();
          this.ctx.moveTo(p.x, p.y);
          this.ctx.lineTo(mx, my);
          this.ctx.strokeStyle = `rgba(201,169,110,${opacity})`;
          this.ctx.lineWidth = 0.5;
          this.ctx.stroke();
        }
      }
    }

    requestAnimationFrame(() => this.animate());
  }
}

// ----- Splash Cursor System (Enhanced) -----
class SplashCursor {
  constructor() {
    this.canvas = document.getElementById('splash-canvas');
    if (!this.canvas) {
      this.canvas = document.createElement('canvas');
      this.canvas.id = 'splash-canvas';
      document.body.prepend(this.canvas);
    }
    this.ctx = this.canvas.getContext('2d');
    this.drops = [];
    this.trails = [];
    this.mouse = { x: -100, y: -100, px: -100, py: -100 };
    this.isActive = !window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    if (!this.isActive) { this.canvas.style.display = 'none'; return; }

    this.resize();
    this.bindEvents();
    this.animate();
  }

  resize() {
    this.canvas.width = window.innerWidth;
    this.canvas.height = window.innerHeight;
  }

  bindEvents() {
    window.addEventListener('resize', () => this.resize());
    document.addEventListener('mousemove', (e) => {
      this.mouse.px = this.mouse.x;
      this.mouse.py = this.mouse.y;
      this.mouse.x = e.clientX;
      this.mouse.y = e.clientY;

      const dx = this.mouse.x - this.mouse.px;
      const dy = this.mouse.y - this.mouse.py;
      const speed = Math.sqrt(dx * dx + dy * dy);

      // Spawn drops at higher frequency
      if (speed > 2) {
        const count = Math.min(Math.floor(speed * 0.5), 5);
        for (let i = 0; i < count; i++) {
          const t = i / count;
          this.spawnDrop(
            this.mouse.px + dx * t,
            this.mouse.py + dy * t,
            Math.min(speed * 0.35, 8)
          );
        }
      }

      // Add trail particles at high speed
      if (speed > 8) {
        this.trails.push({
          x: this.mouse.x, y: this.mouse.y,
          life: 1, decay: 0.04 + Math.random() * 0.04,
          size: speed * 0.5
        });
      }
    });

    document.addEventListener('touchmove', (e) => {
      this.mouse.px = this.mouse.x;
      this.mouse.py = this.mouse.y;
      this.mouse.x = e.touches[0].clientX;
      this.mouse.y = e.touches[0].clientY;
      this.spawnDrop(this.mouse.x, this.mouse.y, 5);
    }, { passive: true });

    // Click burst
    document.addEventListener('click', (e) => {
      for (let i = 0; i < 12; i++) {
        const angle = (Math.PI * 2 * i) / 12;
        const r = 15 + Math.random() * 40;
        this.drops.push({
          x: e.clientX + Math.cos(angle) * r * 0.5,
          y: e.clientY + Math.sin(angle) * r * 0.5,
          size: 3 + Math.random() * 6,
          life: 1, decay: 0.015 + Math.random() * 0.025,
          hue: Math.random() > 0.4 ? '201,169,110' : '168,50,90',
          vx: Math.cos(angle) * (1.5 + Math.random() * 3),
          vy: Math.sin(angle) * (1.5 + Math.random() * 3)
        });
      }
    });
  }

  spawnDrop(x, y, size) {
    const hue = Math.random() > 0.55 ? '201,169,110' : '168,50,90';
    this.drops.push({
      x, y, size: size * 2.2, life: 1,
      decay: Math.random() * 0.018 + 0.012,
      hue,
      vx: (Math.random() - 0.5) * 2,
      vy: (Math.random() - 0.5) * 2
    });
    if (this.drops.length > 80) this.drops.shift();
    if (this.trails.length > 40) this.trails.shift();
  }

  animate() {
    this.ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);

    // Draw trails
    this.trails = this.trails.filter(t => t.life > 0);
    for (const t of this.trails) {
      t.life -= t.decay;
      this.ctx.beginPath();
      this.ctx.arc(t.x, t.y, t.size * t.life, 0, Math.PI * 2);
      this.ctx.fillStyle = `rgba(201,169,110,${t.life * 0.2})`;
      this.ctx.shadowBlur = 20;
      this.ctx.shadowColor = `rgba(201,169,110,${t.life * 0.3})`;
      this.ctx.fill();
    }

    // Draw drops
    this.drops = this.drops.filter(d => d.life > 0);
    for (const d of this.drops) {
      d.x += d.vx;
      d.y += d.vy;
      d.vx *= 0.98;
      d.vy *= 0.98;
      d.life -= d.decay;

      // Outer glow ring
      this.ctx.beginPath();
      this.ctx.arc(d.x, d.y, d.size * d.life * 1.6, 0, Math.PI * 2);
      const outerAlpha = d.life * 0.12;
      this.ctx.fillStyle = `rgba(${d.hue},${outerAlpha})`;
      this.ctx.fill();

      // Core
      this.ctx.beginPath();
      this.ctx.arc(d.x, d.y, d.size * d.life, 0, Math.PI * 2);
      const alpha = d.life * 0.5;
      this.ctx.fillStyle = `rgba(${d.hue},${alpha})`;
      this.ctx.shadowBlur = 20;
      this.ctx.shadowColor = `rgba(${d.hue},${alpha * 0.8})`;
      this.ctx.fill();

      // Bright center
      if (d.life > 0.3) {
        this.ctx.beginPath();
        this.ctx.arc(d.x, d.y, d.size * d.life * 0.4, 0, Math.PI * 2);
        this.ctx.fillStyle = `rgba(${d.hue},${d.life * 0.7})`;
        this.ctx.fill();
      }
    }
    this.ctx.shadowBlur = 0;

    requestAnimationFrame(() => this.animate());
  }
}

// ----- Scroll Reveal -----
class ScrollReveal {
  constructor() {
    this.observer = new IntersectionObserver((entries) => {
      entries.forEach(entry => {
        if (entry.isIntersecting) {
          entry.target.classList.add('visible');
          this.observer.unobserve(entry.target);
        }
      });
    }, { threshold: 0.1, rootMargin: '0px 0px -60px 0px' });

    document.querySelectorAll('.reveal, .reveal-left, .reveal-right, .reveal-scale').forEach(el => {
      this.observer.observe(el);
    });
  }
}

// ----- Navbar -----
function initNavbar() {
  const nav = document.querySelector('.nav');
  if (!nav) return;

  window.addEventListener('scroll', () => {
    nav.classList.toggle('scrolled', window.scrollY > 40);
  }, { passive: true });

  const toggle = document.querySelector('.nav-toggle');
  const mobileNav = document.querySelector('.mobile-nav');
  const closeBtn = document.querySelector('.mobile-nav-close');
  if (!toggle || !mobileNav) return;

  toggle.addEventListener('click', () => {
    toggle.classList.toggle('active');
    mobileNav.classList.toggle('open');
    toggle.setAttribute('aria-expanded', mobileNav.classList.contains('open'));
  });
  closeBtn?.addEventListener('click', () => {
    toggle.classList.remove('active');
    mobileNav.classList.remove('open');
  });
  mobileNav.querySelectorAll('a').forEach(link => {
    link.addEventListener('click', () => {
      toggle.classList.remove('active');
      mobileNav.classList.remove('open');
    });
  });
}

// ----- Count Up -----
function initCountUp() {
  document.querySelectorAll('.stat-number[data-count]').forEach(el => {
    const observer = new IntersectionObserver((entries) => {
      entries.forEach(entry => {
        if (entry.isIntersecting) {
          const target = parseInt(el.dataset.count);
          const dur = 2200;
          const start = performance.now();
          const update = (now) => {
            const p = Math.min((now - start) / dur, 1);
            const ease = 1 - Math.pow(1 - p, 4); // Stronger easing
            const v = Math.floor(target * ease);
            const span = el.querySelector('span');
            el.innerHTML = v + (span ? '<span>' + span.textContent + '</span>' : '');
            if (p < 1) requestAnimationFrame(update);
          };
          requestAnimationFrame(update);
          observer.unobserve(el);
        }
      });
    }, { threshold: 0.3 });
    observer.observe(el);
  });
}

// ----- Back to Top -----
function initBackToTop() {
  const btn = document.querySelector('.back-to-top');
  if (!btn) return;
  window.addEventListener('scroll', () => {
    btn.classList.toggle('visible', window.scrollY > 600);
  }, { passive: true });
  btn.addEventListener('click', () => window.scrollTo({ top: 0, behavior: 'smooth' }));
}

// ----- Page Transition -----
function initPageTransition() {
  const trans = document.querySelector('.page-transition');
  if (!trans) return;

  document.querySelectorAll('a[href$=".html"]').forEach(link => {
    if (link.target === '_blank' || link.hostname !== location.hostname) return;
    const href = link.getAttribute('href');
    if (!href || href.startsWith('#')) return;

    link.addEventListener('click', (e) => {
      e.preventDefault();
      trans.classList.add('active');
      setTimeout(() => { location.href = href; }, 500);
    });
  });

  window.addEventListener('pageshow', () => trans.classList.remove('active'));
}

// ----- Product Filter -----
function initProductFilter() {
  const btns = document.querySelectorAll('.filter-btn');
  const items = document.querySelectorAll('[data-category]');
  if (!btns.length || !items.length) return;

  btns.forEach(btn => {
    btn.addEventListener('click', () => {
      btns.forEach(b => b.classList.remove('active'));
      btn.classList.add('active');
      const filter = btn.dataset.filter;
      items.forEach(item => {
        if (filter === 'all' || item.dataset.category === filter) {
          item.style.display = '';
          requestAnimationFrame(() => {
            item.style.opacity = '1';
            item.style.transform = 'translateY(0)';
          });
        } else {
          item.style.opacity = '0';
          item.style.transform = 'translateY(24px)';
          setTimeout(() => { item.style.display = 'none'; }, 350);
        }
      });
    });
  });
}

// ----- Contact Form -----
function initContactForm() {
  const form = document.getElementById('contact-form');
  if (!form) return;
  form.addEventListener('submit', (e) => {
    e.preventDefault();
    const success = document.querySelector('.form-success');
    if (success) { form.style.display = 'none'; success.style.display = 'block'; }
  });
}

// ----- Active Nav -----
function initActiveNav() {
  const path = location.pathname;
  document.querySelectorAll('.nav-links a').forEach(link => {
    const href = link.getAttribute('href');
    if (!href) return;
    if ((href === 'index.html' && (path.endsWith('/') || path.endsWith('index.html'))) ||
        (href !== 'index.html' && path.includes(href.replace('index.html', '')))) {
      link.classList.add('active');
    }
  });
}

// ----- Ambient Glow on Hover -----
function initAmbientGlow() {
  const glow = document.createElement('div');
  glow.className = 'ambient-glow';
  glow.style.cssText = `
    position: fixed; pointer-events: none; z-index: 0;
    width: 600px; height: 600px; border-radius: 50%;
    background: radial-gradient(circle, rgba(201,169,110,0.04) 0%, transparent 70%);
    transform: translate(-50%, -50%); opacity: 0;
    transition: opacity 0.6s;
  `;
  document.body.prepend(glow);

  let glowTimeout;
  document.addEventListener('mousemove', (e) => {
    glow.style.left = e.clientX + 'px';
    glow.style.top = e.clientY + 'px';
    glow.style.opacity = '1';
    clearTimeout(glowTimeout);
    glowTimeout = setTimeout(() => { glow.style.opacity = '0'; }, 1500);
  }, { passive: true });
}

// ----- Hero Parallax -----
function initHeroParallax() {
  const heroBg = document.querySelector('.page-hero-bg img');
  if (!heroBg) return;

  window.addEventListener('scroll', () => {
    const scrollY = window.scrollY;
    if (scrollY < window.innerHeight) {
      heroBg.style.transform = `translateY(${scrollY * 0.3}px) scale(1.05)`;
    }
  }, { passive: true });
}

// ----- Initialize -----
document.addEventListener('DOMContentLoaded', () => {
  const particleField = new ParticleField();
  const splashCursor = new SplashCursor();
  new ScrollReveal();

  window.__particles = particleField;
  window.__splash = splashCursor;

  initNavbar();
  initCountUp();
  initBackToTop();
  initPageTransition();
  initProductFilter();
  initContactForm();
  initActiveNav();
  initAmbientGlow();
  initHeroParallax();

  // Hero splash on click
  const hero = document.querySelector('.hero, .page-hero');
  if (hero && window.__splash) {
    hero.addEventListener('click', (e) => {
      for (let i = 0; i < 10; i++) {
        window.__splash.spawnDrop(e.clientX, e.clientY, Math.random() * 10 + 6);
      }
    });
  }
});
