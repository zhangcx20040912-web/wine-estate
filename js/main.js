/* ============================================================
   美桦君昱 (Mei Hua Jun Yu) — Enhanced JS v3.0
   Apple-Style Scroll Dynamics + Chinese Ink Wash Interactions
   ============================================================ */

// ----- Navbar Scroll Effect -----
(function() {
  const nav = document.querySelector('.nav');
  if (!nav) return;

  let lastScroll = 0;
  window.addEventListener('scroll', () => {
    const y = window.pageYOffset;
    if (y > 60) nav.classList.add('scrolled');
    else nav.classList.remove('scrolled');
    lastScroll = y;
  }, { passive: true });
})();

// ----- Mobile Navigation -----
(function() {
  const toggle = document.querySelector('.nav-toggle');
  const mobileNav = document.querySelector('.mobile-nav');
  const closeBtn = document.querySelector('.mobile-nav-close');
  if (!toggle || !mobileNav) return;

  function open() { mobileNav.classList.add('open'); document.body.style.overflow = 'hidden'; }
  function close() { mobileNav.classList.remove('open'); document.body.style.overflow = ''; }
  toggle.addEventListener('click', open);
  closeBtn.addEventListener('click', close);
  mobileNav.querySelectorAll('a').forEach(a => a.addEventListener('click', close));
  mobileNav.addEventListener('click', e => { if (e.target === mobileNav) close(); });
  document.addEventListener('keydown', e => { if (e.key === 'Escape') close(); });
})();

// ----- Active Nav Link -----
(function() {
  const path = window.location.pathname;
  document.querySelectorAll('.nav-links a, .mobile-nav a').forEach(link => {
    const href = link.getAttribute('href');
    if (!href) return;
    if (href === path || (href !== '/' && href !== '../index.html' && path.includes(href.replace('index.html','')))) {
      link.classList.add('active');
    }
  });
})();

// ----- Scroll Reveal (Intersection Observer) -----
(function() {
  const observer = new IntersectionObserver((entries) => {
    entries.forEach(entry => {
      if (entry.isIntersecting) {
        entry.target.classList.add('visible');
        if (entry.target.classList.contains('stagger-list')) {
          entry.target.classList.add('visible');
        }
      }
    });
  }, { threshold: 0.12, rootMargin: '0px 0px -60px 0px' });

  document.querySelectorAll('.reveal, .reveal-fade, .reveal-scale, .reveal-left, .reveal-right, .stagger-list').forEach(el => {
    observer.observe(el);
  });
})();

// ----- Parallax Effect (Apple-style smooth) -----
(function() {
  const layers = document.querySelectorAll('.parallax-layer');
  if (!layers.length) return;

  let ticking = false;
  window.addEventListener('scroll', () => {
    if (!ticking) {
      requestAnimationFrame(() => {
        const scrolled = window.pageYOffset;
        layers.forEach(layer => {
          const speed = parseFloat(layer.getAttribute('data-speed')) || 0.04;
          const rect = layer.getBoundingClientRect();
          const parentTop = rect.top + scrolled;
          if (scrolled + window.innerHeight > parentTop && scrolled < parentTop + rect.height) {
            layer.style.transform = `translate3d(0, ${(scrolled - parentTop) * speed}px, 0)`;
          }
        });
        ticking = false;
      });
      ticking = true;
    }
  }, { passive: true });
})();

// ----- Counter Animation -----
(function() {
  const observer = new IntersectionObserver((entries) => {
    entries.forEach(entry => {
      if (!entry.isIntersecting) return;
      const el = entry.target;
      const target = parseInt(el.getAttribute('data-count'));
      if (!target) return;
      const duration = 2000;
      const start = performance.now();

      function update(now) {
        const progress = Math.min((now - start) / duration, 1);
        const eased = 1 - Math.pow(1 - progress, 3);
        el.textContent = Math.floor(eased * target);
        if (progress < 1) {
          requestAnimationFrame(update);
        } else {
          el.textContent = target;
        }
      }
      requestAnimationFrame(update);
      observer.unobserve(el);
    });
  }, { threshold: 0.4 });

  document.querySelectorAll('[data-count]').forEach(el => observer.observe(el));
})();

// ----- Back to Top -----
(function() {
  const btn = document.querySelector('.back-to-top');
  if (!btn) return;
  window.addEventListener('scroll', () => {
    btn.classList.toggle('visible', window.pageYOffset > 600);
  }, { passive: true });
  btn.addEventListener('click', () => window.scrollTo({ top: 0, behavior: 'smooth' }));
})();

// ----- Tabs -----
(function() {
  document.querySelectorAll('[data-tabs]').forEach(container => {
    const buttons = container.querySelectorAll('.tab-btn');
    const panels = container.querySelectorAll('.tab-panel');
    buttons.forEach(btn => {
      btn.addEventListener('click', () => {
        const target = btn.getAttribute('data-tab');
        buttons.forEach(b => b.classList.remove('active'));
        panels.forEach(p => p.classList.remove('active'));
        btn.classList.add('active');
        const panel = container.querySelector(`#${target}`);
        if (panel) panel.classList.add('active');
      });
    });
  });
})();

// ----- Filter Chips -----
(function() {
  document.querySelectorAll('.filter-chip').forEach(chip => {
    chip.addEventListener('click', function() {
      const group = this.parentElement;
      if (group && group.classList.contains('filter-single')) {
        group.querySelectorAll('.filter-chip').forEach(c => c.classList.remove('active'));
      }
      this.classList.toggle('active');
    });
  });
})();

// ----- Modal -----
window.openModal = function(id) {
  const overlay = document.getElementById(id);
  if (!overlay) return;
  overlay.classList.add('open');
  document.body.style.overflow = 'hidden';
  const firstInput = overlay.querySelector('input, button, textarea, select');
  if (firstInput) setTimeout(() => firstInput.focus(), 100);
};

window.closeModal = function(id) {
  const overlay = document.getElementById(id);
  if (!overlay) return;
  overlay.classList.remove('open');
  document.body.style.overflow = '';
};

document.addEventListener('click', (e) => {
  if (e.target.classList.contains('modal-overlay') && e.target.classList.contains('open')) {
    window.closeModal(e.target.id);
  }
});
document.addEventListener('keydown', (e) => {
  if (e.key === 'Escape') {
    document.querySelectorAll('.modal-overlay.open').forEach(o => window.closeModal(o.id));
  }
});

// ----- Toast -----
window.showToast = function(message, type, duration) {
  type = type || 'success';
  duration = duration || 3500;
  const toast = document.createElement('div');
  toast.className = `toast ${type}`;
  toast.textContent = message;
  toast.setAttribute('role', 'status');
  toast.setAttribute('aria-live', 'polite');
  document.body.appendChild(toast);
  requestAnimationFrame(() => toast.classList.add('show'));
  setTimeout(() => {
    toast.classList.remove('show');
    setTimeout(() => toast.remove(), 400);
  }, duration);
};

// ----- Form Validation -----
function validateForm(formEl) {
  const inputs = formEl.querySelectorAll('[required]');
  let valid = true;
  inputs.forEach(input => {
    const errorEl = input.parentElement.querySelector('.form-error');
    if (!input.value.trim()) {
      valid = false;
      input.style.borderColor = '#C41E1A';
      if (errorEl) errorEl.textContent = '此项为必填';
    } else {
      input.style.borderColor = '';
      if (errorEl) errorEl.textContent = '';
    }
    if (input.type === 'email' && input.value.trim()) {
      const re = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
      if (!re.test(input.value.trim())) {
        valid = false;
        input.style.borderColor = '#C41E1A';
        if (errorEl) errorEl.textContent = '请输入有效的邮箱地址';
      }
    }
  });
  return valid;
}

document.addEventListener('submit', (e) => {
  const form = e.target.closest('form');
  if (form && form.hasAttribute('data-validate')) {
    if (!validateForm(form)) {
      e.preventDefault();
      window.showToast('请检查表单中的错误', 'error');
    }
  }
});

// ----- Smooth Anchor Scroll -----
document.querySelectorAll('a[href^="#"]').forEach(anchor => {
  anchor.addEventListener('click', function(e) {
    const target = document.querySelector(this.getAttribute('href'));
    if (target) {
      e.preventDefault();
      const offset = 80;
      const pos = target.getBoundingClientRect().top + window.pageYOffset - offset;
      window.scrollTo({ top: pos, behavior: 'smooth' });
    }
  });
});

// ----- Product Gallery -----
(function() {
  const mainImg = document.querySelector('.product-gallery-main img');
  const thumbs = document.querySelectorAll('.product-gallery-thumbs button');
  if (!mainImg || !thumbs.length) return;
  mainImg.style.transition = 'opacity 0.2s ease';

  thumbs.forEach(btn => {
    btn.addEventListener('click', () => {
      thumbs.forEach(b => b.classList.remove('active'));
      btn.classList.add('active');
      const src = btn.querySelector('img')?.src;
      if (src) {
        mainImg.style.opacity = '0';
        setTimeout(() => { mainImg.src = src; mainImg.style.opacity = '1'; }, 200);
      }
    });
  });
})();

// ----- Page Load Transition -----
window.addEventListener('load', () => {
  const transition = document.querySelector('.page-transition');
  if (transition) {
    transition.classList.add('active');
    setTimeout(() => transition.classList.remove('active'), 1000);
  }
});

// ----- Cookie Consent -----
// ----- Ink River Scroll Animation (鸭绿江墨流) — Enhanced Dual River -----
(function() {
  const riverR = document.querySelector('.ink-river:not(.ink-river-left)');
  const riverL = document.querySelector('.ink-river-left');
  if (!riverR && !riverL) return;

  // Collect all river paths
  function setupRiver(river) {
    if (!river) return null;
    const paths = {
      main: river.querySelector('.river-main'),
      wash: river.querySelector('.river-wash'),
      washWide: river.querySelector('.river-wash-wide'),
      branches: river.querySelectorAll('.river-branch'),
      drops: river.querySelectorAll('.river-drop'),
      deepBranches: river.querySelectorAll('.river-branch-deep'),
      mistDrops: river.querySelectorAll('.river-mist'),
    };
    // Init dash arrays
    [paths.main, paths.wash, paths.washWide].forEach(p => {
      if (!p) return;
      const len = p.getTotalLength();
      p.style.strokeDasharray = len;
      p.style.strokeDashoffset = len;
    });
    paths.branches.forEach(b => {
      const len = b.getTotalLength();
      b.style.strokeDasharray = len;
      b.style.strokeDashoffset = len;
    });
    paths.deepBranches.forEach(b => {
      const len = b.getTotalLength();
      b.style.strokeDasharray = len;
      b.style.strokeDashoffset = len;
    });
    paths.mainLen = paths.main ? paths.main.getTotalLength() : 0;
    paths.washLen = paths.wash ? paths.wash.getTotalLength() : paths.mainLen;
    paths.washWideLen = paths.washWide ? paths.washWide.getTotalLength() : paths.mainLen;
    return paths;
  }

  const R = setupRiver(riverR);
  const L = setupRiver(riverL);

  // Connectors
  const connectors = document.querySelectorAll('.ink-connector-line');
  const connectorContainer = document.querySelector('.ink-connectors');

  // Splashes
  const splashes = document.querySelectorAll('.ink-splash');

  let lastScroll = window.pageYOffset;
  let scrollVelocity = 0;
  let smoothVelocity = 0;
  let ticking = false;

  function animateRiver(paths, progress, direction) {
    if (!paths || !paths.main) return;

    const offsetMult = direction === 'left' ? 1.02 : 1; // Left slightly delayed

    // Main river draws down
    const mainOffset = paths.mainLen * (1 - Math.min(progress * offsetMult, 1));
    paths.main.style.strokeDashoffset = mainOffset;

    // Wash layers lead slightly
    if (paths.wash) paths.wash.style.strokeDashoffset = paths.washLen * (1 - Math.min(progress + 0.06, 1));
    if (paths.washWide) paths.washWide.style.strokeDashoffset = paths.washWideLen * (1 - Math.min(progress + 0.12, 1));

    // Regular branches
    paths.branches.forEach((b, i) => {
      const branchProgress = progress * (1.25 + i * 0.18);
      const len = b.getTotalLength();
      b.style.strokeDashoffset = len * (1 - Math.min(branchProgress, 1));
    });

    // Deep branches — only active after 70% scroll
    paths.deepBranches.forEach((b, i) => {
      const deepProgress = (progress - 0.7) / 0.3;
      if (deepProgress > 0) {
        const len = b.getTotalLength();
        b.style.strokeDashoffset = len * (1 - Math.min(deepProgress * (1.5 + i * 0.3), 1));
        b.classList.add('active');
      } else {
        const len = b.getTotalLength();
        b.style.strokeDashoffset = len;
        b.classList.remove('active');
      }
    });

    // Drops
    paths.drops.forEach((d, i) => {
      const threshold = 0.08 + i * 0.11;
      if (progress > threshold) {
        d.classList.add('active');
      } else {
        d.classList.remove('active');
      }
      if (d.classList.contains('active')) {
        const swayDir = direction === 'left' ? -1 : 1;
        const sway = Math.sin(window.pageYOffset * 0.004 + i * 1.2) * 3.5 * swayDir * (1 + Math.abs(smoothVelocity) * 0.015);
        d.style.transform = `translateX(${sway}px)`;
      }
    });

    // Mist drops — only near bottom (85%+)
    paths.mistDrops.forEach((d, i) => {
      const mistThreshold = 0.85 + i * 0.04;
      if (progress > mistThreshold) {
        d.classList.add('active');
      } else {
        d.classList.remove('active');
      }
    });
  }

  window.addEventListener('scroll', () => {
    if (!ticking) {
      requestAnimationFrame(() => {
        const y = window.pageYOffset;
        const docH = document.documentElement.scrollHeight - window.innerHeight;
        const progress = docH > 0 ? y / docH : 0;

        // Smooth velocity for organic feel
        const rawVelocity = y - lastScroll;
        smoothVelocity = smoothVelocity * 0.7 + rawVelocity * 0.3;
        lastScroll = y;
        scrollVelocity = rawVelocity;

        // Animate both rivers
        animateRiver(R, progress, 'right');
        animateRiver(L, progress, 'left');

        // Connectors — appear at specific progress thresholds
        if (connectorContainer) {
          const shouldShow = progress > 0.1;
          connectorContainer.style.opacity = shouldShow ? (0.3 + Math.min(Math.abs(smoothVelocity) * 0.006, 0.3)) : '0';
        }
        connectors.forEach((c, i) => {
          const threshold = 0.15 + i * 0.18;
          if (progress > threshold) {
            c.classList.add('active');
            // Subtle width pulse
            const pulse = 1 + Math.sin(y * 0.003 + i) * 0.15;
            c.style.strokeWidth = (1 * pulse).toString();
          } else {
            c.classList.remove('active');
          }
        });

        // Splashes — appear at section boundaries
        splashes.forEach((s, i) => {
          const thresholds = [0.22, 0.44, 0.66, 0.88];
          const threshold = thresholds[i] || 0.5;
          const dist = Math.abs(progress - threshold);
          if (dist < 0.08) {
            const intensity = (1 - dist / 0.08) * 0.1;
            s.classList.add('active');
            s.style.opacity = intensity.toString();
            s.style.transform = `scale(${0.6 + intensity * 2})`;
          } else if (dist < 0.15) {
            s.classList.add('active');
            const fadeIntensity = (1 - (dist - 0.08) / 0.07) * 0.1;
            s.style.opacity = Math.max(0, fadeIntensity).toString();
          } else {
            s.classList.remove('active');
            s.style.opacity = '0';
          }
        });

        // Velocity-based opacity for rivers
        const baseOpacity = 0.32;
        const velocityBoost = Math.min(Math.abs(smoothVelocity) * 0.004, 0.18);
        const targetOpacity = baseOpacity + velocityBoost;
        if (riverR) riverR.style.opacity = targetOpacity;
        if (riverL) riverL.style.opacity = targetOpacity * 0.85;

        ticking = false;
      });
      ticking = true;
    }
  }, { passive: true });

  // Slow reset
  setInterval(() => {
    if (Math.abs(smoothVelocity) < 0.3) {
      if (riverR) riverR.style.opacity = '0.32';
      if (riverL) riverL.style.opacity = '0.27';
    }
  }, 800);
})();

// ----- Cookie Consent -----
(function() {
  if (localStorage.getItem('cookie-consent')) return;
  const banner = document.createElement('div');
  banner.className = 'cookie-banner';
  banner.innerHTML = `
    <span>本网站使用 Cookie 以提升您的浏览体验。</span>
    <button class="btn btn-sm btn-primary" id="accept-cookies">接受</button>
  `;
  document.body.appendChild(banner);
  banner.querySelector('#accept-cookies').addEventListener('click', () => {
    localStorage.setItem('cookie-consent', 'true');
    banner.style.opacity = '0';
    banner.style.transition = 'opacity 0.4s';
    setTimeout(() => banner.remove(), 400);
  });
})();
