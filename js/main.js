/* JS Core Logic for Gigman Media Creative Media Agency */

// --- Global UI State ---
let activeTheme = localStorage.getItem('theme') || 'dark';
let audioMuted = true;
let audioCtx = null;

// --- Web Audio Synth (Micro-Haptics) ---
function initAudio() {
  if (!audioCtx) {
    audioCtx = new (window.AudioContext || window.webkitAudioContext)();
  }
}

function playHapticFeedback(freq = 600, duration = 0.05, type = 'sine', volume = 0.03) {
  if (audioMuted) return;
  try {
    initAudio();
    if (audioCtx.state === 'suspended') {
      audioCtx.resume();
    }
    const osc = audioCtx.createOscillator();
    const gainNode = audioCtx.createGain();
    
    osc.type = type;
    osc.frequency.setValueAtTime(freq, audioCtx.currentTime);
    
    gainNode.gain.setValueAtTime(volume, audioCtx.currentTime);
    gainNode.gain.exponentialRampToValueAtTime(0.0001, audioCtx.currentTime + duration);
    
    osc.connect(gainNode);
    gainNode.connect(audioCtx.destination);
    
    osc.start();
    osc.stop(audioCtx.currentTime + duration);
  } catch (e) {
    console.warn('Audio feedback failed:', e);
  }
}

// --- Theme Switcher Logic ---
function setTheme(theme) {
  document.documentElement.setAttribute('data-theme', theme);
  localStorage.setItem('theme', theme);
  activeTheme = theme;
  
  // Update theme toggle icons if loaded
  const darkIcon = document.getElementById('theme-icon-dark');
  const lightIcon = document.getElementById('theme-icon-light');
  if (darkIcon && lightIcon) {
    if (theme === 'light') {
      darkIcon.style.display = 'none';
      lightIcon.style.display = 'block';
    } else {
      darkIcon.style.display = 'block';
      lightIcon.style.display = 'none';
    }
  }
  
  // Sync canvas particle colors
  if (window.particleEngine) {
    window.particleEngine.updateColors();
  }
}

// --- Context-Aware Morphing Cursor ---
function initCustomCursor() {
  const cursor = document.getElementById('cursor');
  const ring = document.getElementById('cursor-ring');
  if (!cursor || !ring) return;

  let mx = 0, my = 0; // Mouse coords
  let rx = 0, ry = 0; // Ring smooth coords
  let isActive = false;

  document.addEventListener('mousemove', e => {
    mx = e.clientX;
    my = e.clientY;
    
    if (!isActive) {
      document.body.classList.add('cursor-active');
      isActive = true;
    }
    
    cursor.style.transform = `translate(${mx}px, ${my}px) translate(-50%, -50%)`;
  });

  document.addEventListener('mouseleave', () => {
    document.body.classList.remove('cursor-active');
    isActive = false;
  });

  // Smooth follow interpolation (LERP) for cursor ring
  function animateCursorRing() {
    rx += (mx - rx) * 0.15;
    ry += (my - ry) * 0.15;
    ring.style.transform = `translate(${rx}px, ${ry}px) translate(-50%, -50%)`;
    requestAnimationFrame(animateCursorRing);
  }
  animateCursorRing();

  // Custom Cursor Morphing Event Delegation
  document.addEventListener('mouseover', e => {
    const target = e.target.closest('a, button, .icon-btn, .work-card, .service-item, input, textarea, select, .service-card-opt, .range-slider');
    if (!target) {
      // Clear all state modifiers
      document.body.className = document.body.className.replace(/\bcursor-hover-\S+/g, '');
      return;
    }

    // Determine the state modifier
    let cursorClass = 'cursor-hover-link';
    if (target.classList.contains('work-card')) {
      cursorClass = 'cursor-hover-media';
    } else if (target.classList.contains('service-item')) {
      cursorClass = 'cursor-hover-open';
    } else if (target.tagName === 'INPUT' || target.tagName === 'TEXTAREA') {
      cursorClass = 'cursor-hover-type';
    } else if (target.classList.contains('service-card-opt')) {
      cursorClass = 'cursor-hover-link';
    }
    
    // Clear and apply specific class
    document.body.className = document.body.className.replace(/\bcursor-hover-\S+/g, '');
    document.body.classList.add(cursorClass);
  });

  // Haptic feedback hover sound triggers
  document.addEventListener('mouseenter', e => {
    const target = e.target.closest('a, button, .work-card, .service-item, .service-card-opt');
    if (target) {
      playHapticFeedback(580, 0.02, 'sine', 0.015);
    }
  }, true);
}

// --- HTML5 Gravitational Particle Canvas ---
class GravitationalCanvas {
  constructor(canvasId) {
    this.canvas = document.getElementById(canvasId);
    if (!this.canvas) return;
    this.ctx = this.canvas.getContext('2d');
    this.particles = [];
    this.mouse = { x: null, y: null, radius: 180 };
    this.particleCount = 75;
    
    this.init();
    this.animate();
    
    window.addEventListener('resize', () => this.resize());
    
    // Track mouse within parent hero-right element
    const container = this.canvas.closest('.hero-right');
    if (container) {
      container.addEventListener('mousemove', e => {
        const rect = container.getBoundingClientRect();
        this.mouse.x = e.clientX - rect.left;
        this.mouse.y = e.clientY - rect.top;
      });
      container.addEventListener('mouseleave', () => {
        this.mouse.x = null;
        this.mouse.y = null;
      });
    }
  }

  init() {
    this.resize();
    this.particles = [];
    this.updateColors();
    
    for (let i = 0; i < this.particleCount; i++) {
      this.particles.push({
        x: Math.random() * this.canvas.width,
        y: Math.random() * this.canvas.height,
        vx: (Math.random() - 0.5) * 0.4,
        vy: (Math.random() - 0.5) * 0.4,
        size: Math.random() * 1.8 + 0.6,
        baseAlpha: Math.random() * 0.4 + 0.2,
        alpha: 0
      });
    }
  }

  resize() {
    const rect = this.canvas.parentElement.getBoundingClientRect();
    this.canvas.width  = rect.width  || window.innerWidth;
    this.canvas.height = rect.height || window.innerHeight;
  }

  updateColors() {
    // Sync colors with CSS theme variable values
    const isLight = activeTheme === 'light';
    this.particleColor = isLight ? '229, 154, 35' : '255, 189, 89'; // Gold color in RGB
    this.ambientColor = isLight ? '0, 0, 0' : '255, 255, 255';
  }

  animate() {
    this.ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);
    
    for (let p of this.particles) {
      // Slow float drift
      p.x += p.vx;
      p.y += p.vy;
      
      // Infinite boundaries wrap
      if (p.x < 0) p.x = this.canvas.width;
      if (p.x > this.canvas.width) p.x = 0;
      if (p.y < 0) p.y = this.canvas.height;
      if (p.y > this.canvas.height) p.y = 0;

      // Gravitational physics pull/push logic
      if (this.mouse.x !== null && this.mouse.y !== null) {
        let dx = this.mouse.x - p.x;
        let dy = this.mouse.y - p.y;
        let distance = Math.sqrt(dx * dx + dy * dy);
        
        if (distance < this.mouse.radius) {
          // Attract particles slightly towards cursor
          let force = (this.mouse.radius - distance) / this.mouse.radius;
          p.x += (dx / distance) * force * 0.85;
          p.y += (dy / distance) * force * 0.85;
          p.alpha = Math.min(1.0, p.baseAlpha + force * 0.45);
        } else {
          p.alpha = p.baseAlpha;
        }
      } else {
        p.alpha = p.baseAlpha;
      }
      
      // Draw particle
      this.ctx.beginPath();
      this.ctx.arc(p.x, p.y, p.size, 0, Math.PI * 2);
      this.ctx.fillStyle = `rgba(${this.particleColor}, ${p.alpha})`;
      this.ctx.fill();
    }
    
    // Draw subtle glowing connections
    for (let i = 0; i < this.particles.length; i++) {
      for (let j = i + 1; j < this.particles.length; j++) {
        let pi = this.particles[i];
        let pj = this.particles[j];
        let dx = pi.x - pj.x;
        let dy = pi.y - pj.y;
        let dist = Math.sqrt(dx * dx + dy * dy);
        
        if (dist < 80) {
          let alpha = (80 - dist) / 80 * 0.08 * Math.min(pi.alpha, pj.alpha);
          this.ctx.beginPath();
          this.ctx.moveTo(pi.x, pi.y);
          this.ctx.lineTo(pj.x, pj.y);
          this.ctx.strokeStyle = `rgba(${this.particleColor}, ${alpha})`;
          this.ctx.lineWidth = 0.5;
          this.ctx.stroke();
        }
      }
    }
    
    requestAnimationFrame(() => this.animate());
  }
}

// --- Case Studies (Behind The Scenes Sheets) Data ---
const caseStudiesData = {
  ascent: {
    title: "Ascent",
    tag: "Concert & Music Campaign · 2024",
    year: "2024",
    duration: "Live Tour Campaign",
    description: "Ascent is an award-winning multi-city live concert and music campaign. Blending high-energy photography, social media management, and immersive promotional teaser videos to capture the raw emotional impact of stadium crowds and mainstage lightshows.",
    specs: {
      "Agency Role": "Content Strategy & Video",
      "Industry": "Concerts / Music",
      "Deliverables": "Promo Videos, Concert Stills",
      "Social Impact": "50M+ Views Across Channels",
      "Creative Lead": "Kabir Mehta",
      "Location": "Mumbai, Delhi & Bangalore Tours"
    }
  },
  redline: {
    title: "Redline",
    tag: "Automotive Ad Film · 2024",
    year: "2024",
    duration: "60 seconds",
    description: "A fast-paced, highly stylized branding and video launch campaign for a premium sports car. Captured using advanced high-speed vehicle tracking, dynamic editorial styling, and a powerful cross-platform content launch strategy.",
    specs: {
      "Agency Role": "Branding & Video Production",
      "Industry": "Automobile",
      "Deliverables": "TV Commercial, Social Cutdowns",
      "Lead Director": "Rohan Malhotra",
      "Colorist": "Elena Vance",
      "Campaign Type": "Integrated Launch"
    }
  },
  pulse: {
    title: "Pulse",
    tag: "Fashion Lookbook & Video · 2023",
    year: "2023",
    duration: "Lookbook Launch",
    description: "An immersive neon concept lookbook and creative brand campaign. Combining cyber-aesthetic street photography, visual design collateral, and social media feed curation to redefine lookbooks for the modern digital era.",
    specs: {
      "Agency Role": "Branding & Social Management",
      "Industry": "Fashion / Branding",
      "Deliverables": "Lookbook Photos, Reels, Teasers",
      "Theme Color": "Cyberpunk Neon Emerald",
      "Art Director": "Simran Johar",
      "Model Talent": "Tanya Bose"
    }
  },
  solitude: {
    title: "Solitude",
    tag: "F&B Launch Campaign · 2023",
    year: "2023",
    duration: "Integrated Launch",
    description: "A sweeping, visual-led campaign launching a high-end natural F&B brand. Relying heavily on content strategy, aesthetic cafe storytelling photography, and custom menu highlight reels capturing nature and flavor harmony.",
    specs: {
      "Agency Role": "Content Strategy & Photography",
      "Industry": "F&B (Food & Beverage)",
      "Deliverables": "Brand Identity, F&B Photos, Reels",
      "Social Reach": "3.5M Targeted Accounts",
      "Lead Strategist": "Devendra Singh",
      "Photographer": "Naman Gupta"
    }
  }
};

function initCaseStudies() {
  const overlay = document.getElementById('case-sheet-overlay');
  const sheet = document.getElementById('case-sheet');
  const closeBtn = document.getElementById('case-close');
  
  if (!overlay || !sheet || !closeBtn) return;

  // Open Sheet Click Handler
  document.querySelectorAll('.work-grid .work-card').forEach((card, index) => {
    card.addEventListener('click', () => {
      // Identify key
      const keys = ['ascent', 'redline', 'pulse', 'solitude'];
      const dataKey = keys[index];
      const data = caseStudiesData[dataKey];
      if (!data) return;

      // Populate elements
      document.getElementById('case-title').innerText = data.title;
      document.getElementById('case-tag').innerText = data.tag;
      const colorBlock = document.getElementById('case-color-block');
      if (colorBlock) {
        colorBlock.className = 'case-hero-img';
        const bgClasses = { ascent: 'bg-1', redline: 'bg-2', pulse: 'bg-3', solitude: 'bg-4' };
        if (bgClasses[dataKey]) {
          colorBlock.classList.add(bgClasses[dataKey]);
        }
      }
      document.getElementById('case-desc').innerText = data.description;
      
      // Populate specs list
      const specsList = document.getElementById('case-specs-list');
      specsList.innerHTML = '';
      for (const [key, val] of Object.entries(data.specs)) {
        const li = document.createElement('li');
        li.innerHTML = `<span>${key}</span><span>${val}</span>`;
        specsList.appendChild(li);
      }

      // Slide out active animation
      overlay.classList.add('active');
      sheet.classList.add('active');
      document.body.style.overflow = 'hidden'; // Lock background scroll
      
      playHapticFeedback(850, 0.08, 'triangle', 0.04);
    });
  });

  // Close Sheet function
  function closeSheet() {
    overlay.classList.remove('active');
    sheet.classList.remove('active');
    document.body.style.overflow = ''; // Unlock scroll
    playHapticFeedback(450, 0.05, 'sine', 0.02);
  }

  closeBtn.addEventListener('click', closeSheet);
  overlay.addEventListener('click', closeSheet);
  
  // Close on Escape Key
  document.addEventListener('keydown', e => {
    if (e.key === 'Escape' && sheet.classList.contains('active')) {
      closeSheet();
    }
  });
}

// --- Campaign Brief Submit Handler ---
// Uses Web3Forms (web3forms.com) to send emails silently without opening the user's email client.
// ⚠️  ACTION REQUIRED: Go to https://web3forms.com, enter connect@gigmanmedia.com, and paste your
//     Access Key below to replace 'YOUR_WEB3FORMS_ACCESS_KEY'.
const WEB3FORMS_ACCESS_KEY = '6abb86c9-d562-42df-baaa-c68fb71425c6';

function initCampaignBriefSubmit() {
  const submitBtn = document.getElementById('brief-submit-btn');
  if (!submitBtn) return;

  // Service card toggle
  document.querySelectorAll('.service-card-opt').forEach(opt => {
    opt.addEventListener('click', () => {
      opt.classList.toggle('selected');
      playHapticFeedback(750, 0.03, 'sine', 0.02);
    });
  });

  submitBtn.addEventListener('click', async () => {
    // --- Collect & Validate ---
    const name    = document.getElementById('brief-name').value.trim();
    const company = document.getElementById('brief-company').value.trim();
    const email   = document.getElementById('brief-email').value.trim();
    const phone   = document.getElementById('brief-phone').value.trim();
    const details = document.getElementById('brief-details').value.trim();

    const selectedServices = [...document.querySelectorAll('.service-card-opt.selected')]
      .map(el => el.dataset.service || el.querySelector('.service-card-title')?.innerText || '');

    // Validate mandatory fields
    if (!name || !company || !email || !phone || !details) {
      ['brief-name','brief-company','brief-email','brief-phone','brief-details'].forEach(id => {
        const el = document.getElementById(id);
        if (el && !el.value.trim()) {
          el.style.borderColor = '#ff6b6b';
          el.addEventListener('input', () => { el.style.borderColor = ''; }, { once: true });
        }
      });
      playHapticFeedback(200, 0.12, 'square', 0.04);
      return;
    }

    const servicesLine = selectedServices.length > 0
      ? selectedServices.join(', ')
      : 'No specific services selected';

    const now = new Date().toLocaleString('en-IN', {
      day: '2-digit', month: 'long', year: 'numeric',
      hour: '2-digit', minute: '2-digit'
    });

    // --- Loading State ---
    submitBtn.disabled = true;
    submitBtn.innerHTML = '<span style="opacity:0.7;">Sending…</span>';

    // Build a clean plain-text message — Web3Forms displays this in their own template
    const plainMessage = [
      `Submitted On: ${now}`,
      '',
      '--- CONTACT DETAILS ---',
      `Name:          ${name}`,
      `Company/Brand: ${company}`,
      `Email:         ${email}`,
      `Phone:         ${phone}`,
      '',
      '--- SERVICES REQUIRED ---',
      servicesLine,
      '',
      '--- CAMPAIGN DETAILS ---',
      details,
    ].join('\n');

    try {
      const response = await fetch('https://api.web3forms.com/submit', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'Accept': 'application/json' },
        body: JSON.stringify({
          access_key: WEB3FORMS_ACCESS_KEY,
          subject:    `Campaign Brief — ${company} | Gigman Media`,
          from_name:  name,
          replyto:    email,
          message:    plainMessage,
        })
      });

      const result = await response.json();

      if (result.success) {
        // Success state
        playHapticFeedback(900, 0.08, 'sine', 0.04);
        submitBtn.innerHTML = '✓ Brief Sent Successfully!';
        submitBtn.style.background = '#2a7a4b';
        submitBtn.style.cursor = 'default';

        // Clear the form
        ['brief-name','brief-company','brief-email','brief-phone','brief-details'].forEach(id => {
          const el = document.getElementById(id);
          if (el) el.value = '';
        });
        document.querySelectorAll('.service-card-opt.selected').forEach(el => el.classList.remove('selected'));

        setTimeout(() => {
          submitBtn.innerHTML = 'Send Enquiry <span class="arrow">→</span>';
          submitBtn.style.background = '';
          submitBtn.style.cursor = '';
          submitBtn.disabled = false;
        }, 5000);

      } else {
        throw new Error(result.message || 'Submission failed');
      }

    } catch (err) {
      // Error state
      playHapticFeedback(200, 0.12, 'square', 0.04);
      submitBtn.innerHTML = '✕ Failed — Please Try Again';
      submitBtn.style.background = '#a83232';
      setTimeout(() => {
        submitBtn.innerHTML = 'Send Enquiry <span class="arrow">→</span>';
        submitBtn.style.background = '';
        submitBtn.disabled = false;
      }, 4000);
      console.error('Brief submission error:', err);
    }
  });
}

// --- Live Testimonials Carousel Slider ---
function initTestimonialsCarousel() {
  const slides = document.querySelectorAll('.testimonial-slide');
  const dotsContainer = document.querySelector('.testimonials-nav');
  if (!slides.length || !dotsContainer) return;
  
  let currentSlide = 0;
  let timer = null;

  // Build pagination dots
  dotsContainer.innerHTML = '';
  slides.forEach((_, idx) => {
    const btn = document.createElement('button');
    btn.className = `icon-btn ${idx === 0 ? 'active' : ''}`;
    btn.style.width = '10px'; btn.style.height = '10px'; btn.style.padding = '0';
    btn.style.borderColor = idx === 0 ? 'var(--gold)' : 'var(--surface-border)';
    btn.style.background = idx === 0 ? 'var(--gold)' : 'transparent';
    btn.addEventListener('click', () => {
      goToSlide(idx);
      resetAutoPlay();
      playHapticFeedback(650, 0.02, 'sine', 0.01);
    });
    dotsContainer.appendChild(btn);
  });

  const dots = dotsContainer.querySelectorAll('button');

  function goToSlide(index) {
    slides[currentSlide].classList.remove('active');
    dots[currentSlide].style.borderColor = 'var(--surface-border)';
    dots[currentSlide].style.background = 'transparent';
    
    currentSlide = (index + slides.length) % slides.length;
    
    slides[currentSlide].classList.add('active');
    dots[currentSlide].style.borderColor = 'var(--gold)';
    dots[currentSlide].style.background = 'var(--gold)';
  }

  function nextSlide() {
    goToSlide(currentSlide + 1);
  }

  function resetAutoPlay() {
    clearInterval(timer);
    timer = setInterval(nextSlide, 7000); // Auto transition every 7 seconds
  }

  resetAutoPlay();
}

// --- Smooth Collapsible Accordion (Services) ---
function toggleService(el) {
  const isOpen = el.classList.contains('open');
  
  // Close all other accordions
  document.querySelectorAll('.service-item').forEach(i => {
    i.classList.remove('open');
  });
  
  if (!isOpen) {
    el.classList.add('open');
    playHapticFeedback(500, 0.05, 'sine', 0.02);
  } else {
    playHapticFeedback(450, 0.03, 'sine', 0.015);
  }
}
window.toggleService = toggleService; // Expose globally for HTML inline onclick event

// --- Page Setup / Dom Loaded ---
document.addEventListener('DOMContentLoaded', () => {
  // 1. Initialize Theme from localstorage
  setTheme(activeTheme);
  
  // 2. Setup theme toggle click trigger
  const themeToggle = document.getElementById('theme-toggle');
  if (themeToggle) {
    themeToggle.addEventListener('click', () => {
      const nextTheme = activeTheme === 'dark' ? 'light' : 'dark';
      setTheme(nextTheme);
      playHapticFeedback(900, 0.06, 'sine', 0.03);
    });
  }

  // 3. Audio Mute control button toggle
  const soundToggle = document.getElementById('sound-toggle');
  const soundOnSvg = document.getElementById('sound-on');
  const soundOffSvg = document.getElementById('sound-off');
  if (soundToggle && soundOnSvg && soundOffSvg) {
    soundToggle.addEventListener('click', () => {
      audioMuted = !audioMuted;
      if (audioMuted) {
        soundOnSvg.style.display = 'none';
        soundOffSvg.style.display = 'block';
      } else {
        soundOnSvg.style.display = 'block';
        soundOffSvg.style.display = 'none';
        // Fire initialization sound trigger
        initAudio();
        playHapticFeedback(600, 0.1, 'sine', 0.04);
      }
    });
  }

  // 4. Shrinking Nav on scroll
  window.addEventListener('scroll', () => {
    const nav = document.querySelector('nav');
    if (nav) {
      if (window.scrollY > 50) {
        nav.classList.add('scrolled');
      } else {
        nav.classList.remove('scrolled');
      }
    }
  });

  // 5. Scroll Reveals setup
  const revealObserver = new IntersectionObserver(entries => {
    entries.forEach(e => {
      if (e.isIntersecting) {
        e.target.classList.add('visible');
      }
    });
  }, { threshold: 0.08 });
  
  document.querySelectorAll('.reveal').forEach(el => revealObserver.observe(el));

  // 6. Initialize Canvas Star engine
  window.particleEngine = new GravitationalCanvas('hero-canvas');

  // 7. Initialize morphing cursor tracking
  initCustomCursor();

  // 8. Initialize popup details case sheet
  initCaseStudies();

  // 9. Initialize campaign brief submit handler
  initCampaignBriefSubmit();

  // 10. Start reviews sliders
  initTestimonialsCarousel();

  // 11. Start Hero Rotators
  initHeroRotators();

  // 12. Clean anchor scroll — prevent hash from appearing in URL
  document.querySelectorAll('a[href^="#"]').forEach(link => {
    const hash = link.getAttribute('href');
    if (!hash || hash === '#') return;
    link.addEventListener('click', e => {
      e.preventDefault();
      const target = document.querySelector(hash);
      if (target) {
        target.scrollIntoView({ behavior: 'smooth', block: 'start' });
        // Keep URL clean — no hash appended
        history.replaceState(null, '', window.location.pathname);
      }
    });
  });

  // 13. Initialize nav logo dropdown interaction & scroll-to-top
  initNavLogoInteraction();
});

// --- Hero Word Rotators ---
function initHeroRotators() {
  const rotatorTextEl = document.getElementById('rotator-text');
  const industryRotator = document.getElementById('industry-rotator');

  // ── Typewriter Engine ──
  if (rotatorTextEl) {
    const words = [
      'create content.',
      'shoot videos.',
      'snap photos.',
      'run your pages.',
      'design brands.',
      'build content.'
    ];
    let wordIndex = 0;
    let charIndex = 0;
    let isDeleting = false;

    const TYPE_SPEED   = 85;   // ms per character typed
    const DELETE_SPEED = 45;   // ms per character deleted
    const HOLD_TIME    = 1800; // ms to hold the completed word
    const PAUSE_TIME   = 400;  // ms pause before typing next word

    function tick() {
      const currentWord = words[wordIndex];

      if (!isDeleting) {
        // Typing forward
        charIndex++;
        rotatorTextEl.textContent = currentWord.slice(0, charIndex);

        if (charIndex === currentWord.length) {
          // Word complete — hold then start deleting
          isDeleting = true;
          setTimeout(tick, HOLD_TIME);
          return;
        }
        setTimeout(tick, TYPE_SPEED + Math.random() * 30); // slight jitter = natural feel
      } else {
        // Deleting backward
        charIndex--;
        rotatorTextEl.textContent = currentWord.slice(0, charIndex);

        if (charIndex === 0) {
          // Word erased — move to next word
          isDeleting = false;
          wordIndex = (wordIndex + 1) % words.length;
          setTimeout(tick, PAUSE_TIME);
          return;
        }
        setTimeout(tick, DELETE_SPEED);
      }
    }

    // Start immediately
    rotatorTextEl.textContent = '';
    tick();
  }

  // ── Industry Rotator (slide-up) ──
  if (industryRotator) {
    const indWords = ['Concerts', 'Automobile', 'F&B', 'Fashion', 'Art', 'Music'];
    let iIdx = 0;
    setInterval(() => {
      const oldWord = industryRotator.querySelector('.is-active');
      if (oldWord) {
        oldWord.classList.remove('is-active');
        oldWord.classList.add('is-exiting');
        setTimeout(() => oldWord.remove(), 400);
      }

      iIdx = (iIdx + 1) % indWords.length;
      const newWord = document.createElement('em');
      newWord.className = 'industry-word';
      newWord.innerText = indWords[iIdx];
      industryRotator.appendChild(newWord);

      void newWord.offsetWidth;
      newWord.classList.add('is-active');
    }, 3000);
  }
}

// --- Brand Logo Interaction & Scroll-to-Top Behavior ---
function initNavLogoInteraction() {
  const logo = document.querySelector('.logo-wrapper a.logo');
  if (!logo) return;

  logo.addEventListener('click', e => {
    // Desktop Only: Override default navigation click
    if (window.innerWidth > 768) {
      e.preventDefault();
      
      const nav = document.querySelector('nav');
      if (nav && nav.classList.contains('scrolled')) {
        window.scrollTo({ top: 0, behavior: 'smooth' });
      }
    }
  });
}
