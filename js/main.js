/* ============================================================
   JC Informática — Main JavaScript
   ============================================================ */

'use strict';

/* ============================================================
   1. HEADER SCROLL EFFECT
   ============================================================ */
const header = document.getElementById('header');

function handleHeaderScroll() {
  if (window.scrollY > 40) {
    header.classList.add('scrolled');
  } else {
    header.classList.remove('scrolled');
  }
}

window.addEventListener('scroll', handleHeaderScroll, { passive: true });
handleHeaderScroll();


/* ============================================================
   2. MOBILE MENU
   ============================================================ */
const hamburger = document.getElementById('hamburger');
const mainNav   = document.getElementById('main-nav');

if (hamburger && mainNav) {
  hamburger.addEventListener('click', () => {
    const isOpen = mainNav.classList.toggle('open');
    hamburger.classList.toggle('active', isOpen);
    hamburger.setAttribute('aria-expanded', String(isOpen));
    document.body.style.overflow = isOpen ? 'hidden' : '';
  });

  // Close on nav link click
  mainNav.querySelectorAll('a').forEach(link => {
    link.addEventListener('click', () => {
      mainNav.classList.remove('open');
      hamburger.classList.remove('active');
      hamburger.setAttribute('aria-expanded', 'false');
      document.body.style.overflow = '';
    });
  });

  // Close on outside click
  document.addEventListener('click', (e) => {
    if (mainNav.classList.contains('open') &&
        !mainNav.contains(e.target) &&
        !hamburger.contains(e.target)) {
      mainNav.classList.remove('open');
      hamburger.classList.remove('active');
      hamburger.setAttribute('aria-expanded', 'false');
      document.body.style.overflow = '';
    }
  });
}


/* ============================================================
   3. ACTIVE NAV LINK (scroll spy)
   ============================================================ */
const sections  = document.querySelectorAll('section[id]');
const navLinks  = document.querySelectorAll('#main-nav a[href^="#"], #main-nav a[href^="index.html"]');

function updateActiveLink() {
  let current = '';
  const scrollPos = window.scrollY + 100;

  sections.forEach(sec => {
    if (sec.offsetTop <= scrollPos) current = sec.id;
  });

  navLinks.forEach(link => {
    link.classList.remove('active');
    const href = link.getAttribute('href');
    if (href === `#${current}` || (current === '' && (href === 'index.html' || href === '#hero'))) {
      link.classList.add('active');
    }
  });
}

window.addEventListener('scroll', updateActiveLink, { passive: true });


/* ============================================================
   4. SCROLL REVEAL ANIMATION
   ============================================================ */
function initScrollReveal() {
  // Seleciona elementos para animação reveal — EXCLUINDO tudo dentro de #builds
  const autoRevealEls = document.querySelectorAll(
    '#servicos .service-card, #automacao .automacao-card, .testimonial-card, .stat-item, ' +
    '.gamer-stat-card, .info-card, .value-item, .hex, ' +
    '#servicos .section-header, #automacao .section-header, #sobre .section-header, ' +
    '#depoimentos .section-header, #gamer .section-header, ' +
    '.gamer-text, .sobre-text, .sobre-visual, .contact-form-wrapper'
  );

  autoRevealEls.forEach((el, i) => {
    el.classList.add('reveal');
    const delay = Math.min(i % 6, 5);
    if (delay > 0) el.classList.add(`reveal-delay-${delay}`);
  });

  const observer = new IntersectionObserver((entries) => {
    entries.forEach(entry => {
      if (entry.isIntersecting) {
        entry.target.classList.add('visible');
        observer.unobserve(entry.target);
      }
    });
  }, { threshold: 0.08, rootMargin: '0px 0px -20px 0px' });

  // Garante que elementos dentro de #builds NUNCA recebam reveal
  document.querySelectorAll('#builds *').forEach(el => {
    el.classList.remove('reveal');
  });

  autoRevealEls.forEach(el => observer.observe(el));
}

if ('IntersectionObserver' in window) {
  initScrollReveal();
} else {
  document.querySelectorAll('.reveal').forEach(el => el.classList.add('visible'));
}


/* ============================================================
   5. ANIMATED COUNTER (Stats Bar)
   ============================================================ */
function animateCounter(el, target, duration = 1800) {
  const start     = performance.now();
  const startVal  = 0;

  function step(timestamp) {
    const elapsed  = timestamp - start;
    const progress = Math.min(elapsed / duration, 1);
    // Ease out cubic
    const eased    = 1 - Math.pow(1 - progress, 3);
    const current  = Math.round(startVal + (target - startVal) * eased);
    el.textContent = current.toLocaleString('pt-BR');
    if (progress < 1) requestAnimationFrame(step);
  }

  requestAnimationFrame(step);
}

function initCounters() {
  const counters = document.querySelectorAll('.stat-number[data-target]');
  if (!counters.length) return;

  const observer = new IntersectionObserver((entries) => {
    entries.forEach(entry => {
      if (entry.isIntersecting) {
        const el     = entry.target;
        const target = parseInt(el.dataset.target, 10);
        animateCounter(el, target);
        observer.unobserve(el);
      }
    });
  }, { threshold: 0.5 });

  counters.forEach(el => observer.observe(el));
}

initCounters();


/* ============================================================
   6. BACK TO TOP BUTTON
   ============================================================ */
const backToTop = document.getElementById('back-to-top');

if (backToTop) {
  window.addEventListener('scroll', () => {
    backToTop.classList.toggle('visible', window.scrollY > 400);
  }, { passive: true });

  backToTop.addEventListener('click', () => {
    window.scrollTo({ top: 0, behavior: 'smooth' });
  });
}


/* ============================================================
   7. SMOOTH SCROLL FOR ANCHOR LINKS
   ============================================================ */
document.querySelectorAll('a[href^="#"]').forEach(anchor => {
  anchor.addEventListener('click', function (e) {
    const href = this.getAttribute('href');
    if (href === '#') return;
    const target = document.querySelector(href);
    if (!target) return;
    e.preventDefault();
    const offset = parseInt(getComputedStyle(document.documentElement)
      .getPropertyValue('--nav-height')) || 72;
    const top = target.getBoundingClientRect().top + window.scrollY - offset;
    window.scrollTo({ top, behavior: 'smooth' });
  });
});


/* ============================================================
   8. CONTACT FORM (contato.html)
   ============================================================ */
const contactForm = document.getElementById('contact-form');

if (contactForm) {
  contactForm.addEventListener('submit', async function (e) {
    e.preventDefault();

    const btn     = contactForm.querySelector('.form-submit');
    const msgEl   = document.getElementById('form-message');
    const originalText = btn.innerHTML;

    // Validate
    const name    = contactForm.querySelector('#name').value.trim();
    const email   = contactForm.querySelector('#email').value.trim();
    const message = contactForm.querySelector('#message').value.trim();
    const privacy = contactForm.querySelector('#privacy-consent');

    if (!name || !email || !message) {
      showFormMessage(msgEl, 'error', '<i class="fas fa-exclamation-circle"></i> Por favor, preencha todos os campos obrigatórios.');
      return;
    }

    if (privacy && !privacy.checked) {
      showFormMessage(msgEl, 'error', '<i class="fas fa-exclamation-circle"></i> Você deve aceitar a Política de Privacidade para prosseguir.');
      return;
    }

    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      showFormMessage(msgEl, 'error', '<i class="fas fa-exclamation-circle"></i> Por favor, informe um e-mail válido.');
      return;
    }

    // Loading state
    btn.disabled  = true;
    btn.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Enviando...';

    try {
      const payload = {
        nome:     name,
        email:    email,
        telefone: contactForm.querySelector('#phone').value.trim(),
        servico:  contactForm.querySelector('#service').value,
        mensagem: message,
        aceitou_privacidade: privacy ? privacy.checked : true,
        data:     new Date().toISOString()
      };

      const response = await fetch('/enviar-contato.php', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      });

      if (!response.ok) {
        throw new Error('HTTP ' + response.status);
      }

      showFormMessage(msgEl, 'success',
        '<i class="fas fa-check-circle"></i> Mensagem enviada com sucesso! Entraremos em contato em breve.'
      );
      contactForm.reset();

    } catch (err) {
      console.error('Erro de envio:', err);
      // Exibe mensagem de erro real com detalhes (ex: HTTP 404 ou HTTP 500)
      showFormMessage(msgEl, 'error',
        `<i class="fas fa-exclamation-circle"></i> Ocorreu um erro ao enviar sua mensagem (${err.message}). Por favor, tente novamente ou entre em contato diretamente pelo WhatsApp.`
      );
    } finally {
      btn.disabled  = false;
      btn.innerHTML = originalText;
    }
  });
}

function showFormMessage(el, type, html) {
  if (!el) return;
  el.className = `form-message ${type}`;
  el.innerHTML = html;
  el.style.display = 'block';
  el.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
  setTimeout(() => { el.style.display = 'none'; }, 6000);
}


/* ============================================================
   9. MARQUEE DUPLICATE (ensure seamless loop)
   ============================================================ */
function initMarquee() {
  const track = document.querySelector('.marquee-track');
  if (!track) return;
  // Clone content for seamless loop
  track.innerHTML += track.innerHTML;
}
initMarquee();


/* ============================================================
   10. GAMER CARDS — stagger entrance
   ============================================================ */
function initGamerCards() {
  const cards = document.querySelectorAll('.gamer-stat-card');
  cards.forEach((card, i) => {
    card.style.transitionDelay = `${i * 80}ms`;
  });
}
initGamerCards();


/* ============================================================
   11. HERO BADGE TYPING EFFECT (subtle)
   ============================================================ */
function initHeroBadge() {
  const badge = document.querySelector('.hero-badge');
  if (!badge) return;
  badge.style.opacity = '0';
  setTimeout(() => {
    badge.style.transition = 'opacity 0.5s ease';
    badge.style.opacity    = '1';
  }, 200);
}
initHeroBadge();


/* ============================================================
   12. SETUP SIMULATOR / PC BUILDER
   ============================================================ */
function initSimulator() {
  const objButtons = document.querySelectorAll('#sim-objective .sim-opt');
  const resButtons = document.querySelectorAll('#sim-resolution .sim-opt');
  const resultText = document.getElementById('sim-result');
  const whatsappBtn = document.getElementById('sim-whatsapp-btn');
  
  if (!objButtons.length || !resButtons.length || !resultText || !whatsappBtn) return;
  
  let currentObjective = 'casual';
  let currentResolution = 'fhd';
  
  // Elements to highlight (build cards inside builds grid)
  const builds = document.querySelectorAll('#builds .build-card');
  const buildCards = {
    entrada: builds[0],
    intermediaria: builds[1],
    highend: builds[2]
  };
  
  const buildsGrid = document.querySelector('.builds-grid');
  
  function updateRecommendation() {
    let recommendation = 'entrada';
    let label = 'PC ENTRADA';
    
    if (currentResolution === '4k') {
      recommendation = 'highend';
      label = 'PC HIGH-END';
    } else if (currentResolution === 'qhd') {
      if (currentObjective === 'casual') {
        recommendation = 'intermediaria';
        label = 'PC INTERMEDIÁRIA';
      } else {
        recommendation = 'highend';
        label = 'PC HIGH-END';
      }
    } else { // fhd
      if (currentObjective === 'casual') {
        recommendation = 'entrada';
        label = 'PC ENTRADA';
      } else {
        recommendation = 'intermediaria';
        label = 'PC INTERMEDIÁRIA';
      }
    }
    
    // Update Text
    resultText.textContent = label;
    if (recommendation === 'highend') {
      resultText.style.color = '#FFB800';
    } else {
      resultText.style.color = 'var(--blue-light)';
    }
    
    // Update WhatsApp Link
    const message = encodeURIComponent(`Olá! Usei o simulador do site e a configuração recomendada para o meu caso (Uso: ${getObjectiveName(currentObjective)}, Resolução: ${getResolutionName(currentResolution)}) foi o ${label}. Gostaria de solicitar um orçamento para esta Build!`);
    whatsappBtn.href = `https://wa.me/555432814464?text=${message}`;
    
    // Highlight Card
    if (buildsGrid) {
      buildsGrid.classList.add('has-highlight');
    }
    
    Object.keys(buildCards).forEach(key => {
      if (buildCards[key]) {
        if (key === recommendation) {
          buildCards[key].classList.add('recommended-highlight');
        } else {
          buildCards[key].classList.remove('recommended-highlight');
        }
      }
    });
  }
  
  function getObjectiveName(val) {
    if (val === 'casual') return 'Jogos Casuais / eSports';
    if (val === 'heavy') return 'Jogos Pesados / Lançamentos AAA';
    return 'Trabalho / Stream / Edição';
  }
  
  function getResolutionName(val) {
    if (val === 'fhd') return 'Full HD (1080p)';
    if (val === 'qhd') return 'Quad HD (1440p)';
    return 'Ultra HD (4K)';
  }
  
  objButtons.forEach(btn => {
    btn.addEventListener('click', () => {
      objButtons.forEach(b => b.classList.remove('active'));
      btn.classList.add('active');
      currentObjective = btn.dataset.value;
      updateRecommendation();
    });
  });
  
  resButtons.forEach(btn => {
    btn.addEventListener('click', () => {
      resButtons.forEach(b => b.classList.remove('active'));
      btn.classList.add('active');
      currentResolution = btn.dataset.value;
      updateRecommendation();
    });
  });
  
  // Run once initially
  updateRecommendation();
}

document.addEventListener('DOMContentLoaded', () => {
  initSimulator();
  initFaqAccordion();
  initWhatsAppWidget();
  initBeforeAfterSlider();
});
if (document.readyState === 'interactive' || document.readyState === 'complete') {
  initSimulator();
  initFaqAccordion();
  initWhatsAppWidget();
  initBeforeAfterSlider();
}

/* ============================================================
   13. FAQ ACCORDION ANIMATION (contato.html)
   ============================================================ */
function initFaqAccordion() {
  const faqItems = document.querySelectorAll('.faq-item');
  if (!faqItems.length) return;
  
  faqItems.forEach(item => {
    const summary = item.querySelector('summary');
    const answer = item.querySelector('.faq-answer');
    if (!summary || !answer) return;
    
    summary.addEventListener('click', (e) => {
      // Prevent default instant toggle
      e.preventDefault();
      
      // Close other open FAQ items for a clean accordion effect
      faqItems.forEach(otherItem => {
        if (otherItem !== item && otherItem.hasAttribute('open')) {
          const otherAnswer = otherItem.querySelector('.faq-answer');
          otherAnswer.style.height = `${otherAnswer.scrollHeight}px`;
          // Force reflow
          otherAnswer.offsetHeight;
          otherAnswer.style.height = '0px';
          otherAnswer.style.paddingTop = '0px';
          otherAnswer.style.paddingBottom = '0px';
          otherAnswer.style.borderTopColor = 'transparent';
          otherItem.style.borderColor = 'var(--border)';
          
          setTimeout(() => {
            otherItem.removeAttribute('open');
            otherAnswer.style.height = '';
            otherAnswer.style.paddingTop = '';
            otherAnswer.style.paddingBottom = '';
            otherAnswer.style.borderTopColor = '';
          }, 350);
        }
      });
      
      if (item.hasAttribute('open')) {
        // Shrink animation
        answer.style.height = `${answer.scrollHeight}px`;
        // Force reflow
        answer.offsetHeight;
        answer.style.height = '0px';
        answer.style.paddingTop = '0px';
        answer.style.paddingBottom = '0px';
        answer.style.borderTopColor = 'transparent';
        item.style.borderColor = 'var(--border)';
        
        setTimeout(() => {
          item.removeAttribute('open');
          answer.style.height = '';
          answer.style.paddingTop = '';
          answer.style.paddingBottom = '';
          answer.style.borderTopColor = '';
        }, 350);
      } else {
        // Open immediately so scrollHeight is correct, but hide contents
        item.setAttribute('open', '');
        const targetHeight = answer.scrollHeight;
        answer.style.height = '0px';
        answer.style.paddingTop = '0px';
        answer.style.paddingBottom = '0px';
        answer.style.borderTopColor = 'transparent';
        
        // Force reflow
        answer.offsetHeight;
        
        // Restore styles for animation
        answer.style.height = `${targetHeight}px`;
        answer.style.paddingTop = '20px';
        answer.style.paddingBottom = '20px';
        answer.style.borderTopColor = 'var(--border)';
        item.style.borderColor = 'var(--border-glow)';
        
        setTimeout(() => {
          answer.style.height = '';
          answer.style.paddingTop = '';
          answer.style.paddingBottom = '';
          answer.style.borderTopColor = '';
        }, 350);
      }
    });
  });
}

/* ============================================================
   14. WHATSAPP PREMIUM WIDGET LOGIC
   ============================================================ */
function initWhatsAppWidget() {
  const toggleBtn = document.getElementById('wa-widget-toggle');
  const chatbox = document.getElementById('wa-chatbox');
  const closeBtn = document.getElementById('wa-chatbox-close');
  
  if (!toggleBtn || !chatbox) return;
  
  toggleBtn.addEventListener('click', (e) => {
    e.stopPropagation();
    chatbox.classList.toggle('wa-chatbox-hidden');
  });
  
  if (closeBtn) {
    closeBtn.addEventListener('click', (e) => {
      e.stopPropagation();
      chatbox.classList.add('wa-chatbox-hidden');
    });
  }
  
  // Close chatbox on click outside
  document.addEventListener('click', (e) => {
    if (!chatbox.classList.contains('wa-chatbox-hidden') && 
        !chatbox.contains(e.target) && 
        !toggleBtn.contains(e.target)) {
      chatbox.classList.add('wa-chatbox-hidden');
    }
  });
}

/* ============================================================
   15. BEFORE/AFTER SLIDER LOGIC
   ============================================================ */
function initBeforeAfterSlider() {
  const container = document.querySelector('.slider-comparison-container');
  const beforeWrapper = document.getElementById('before-img-wrapper');
  const handle = document.getElementById('slider-drag-handle');
  
  if (!container || !beforeWrapper || !handle) return;
  
  let isDragging = false;
  
  function setSliderPosition(clientX) {
    const rect = container.getBoundingClientRect();
    let positionX = clientX - rect.left;
    
    // Boundary check
    if (positionX < 0) positionX = 0;
    if (positionX > rect.width) positionX = rect.width;
    
    const percentage = (positionX / rect.width) * 100;
    beforeWrapper.style.width = `${percentage}%`;
    handle.style.left = `${percentage}%`;
  }
  
  // Mouse & Touch events
  function startDragging(e) {
    isDragging = true;
    // Evita scroll da tela em touch screens ao arrastar
    if (e.cancelable) e.preventDefault();
  }
  
  function stopDragging() {
    isDragging = false;
  }
  
  function drag(e) {
    if (!isDragging) return;
    
    let clientX;
    if (e.type === 'touchmove' || e.type === 'touchstart') {
      clientX = e.touches[0].clientX;
    } else {
      clientX = e.clientX;
    }
    
    // Smooth update via requestAnimationFrame
    requestAnimationFrame(() => setSliderPosition(clientX));
  }
  
  // Handle event listeners
  handle.addEventListener('mousedown', startDragging);
  handle.addEventListener('touchstart', startDragging, { passive: true });
  
  // Window listeners for smooth execution when moving off-handle
  window.addEventListener('mouseup', stopDragging);
  window.addEventListener('touchend', stopDragging);
  window.addEventListener('mousemove', drag);
  window.addEventListener('touchmove', drag, { passive: false });
  
  // Also support click directly on container to jump to that position
  container.addEventListener('click', (e) => {
    // Only jump if we are not dragging and didn't click the handle directly
    if (!isDragging && e.target !== handle && !handle.contains(e.target)) {
      setSliderPosition(e.clientX);
    }
  });
}
