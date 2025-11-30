function initNavToggle() {
  const toggle = document.querySelector('.nav-toggle');
  const nav = document.querySelector('.global-nav');
  if (!toggle || !nav) return;

  toggle.addEventListener('click', () => {
    const isOpen = nav.classList.toggle('open');
    toggle.setAttribute('aria-expanded', isOpen);
  });
}

function initContactForm() {
  const form = document.querySelector('.contact-form');
  const feedback = document.querySelector('.form-feedback');
  if (!form) return;

  form.addEventListener('submit', (event) => {
    event.preventDefault();
    if (feedback) {
      feedback.textContent = '送信ありがとうございました。担当者よりご連絡いたします。';
    } else {
      alert('送信ありがとうございました。担当者よりご連絡いたします。');
    }
    form.reset();
  });
}

function handleResizeCloseNav() {
  const nav = document.querySelector('.global-nav');
  const toggle = document.querySelector('.nav-toggle');
  if (!nav || !toggle) return;

  window.addEventListener('resize', () => {
    if (window.innerWidth > 900) {
      nav.classList.remove('open');
      toggle.setAttribute('aria-expanded', 'false');
    }
  });
}

document.addEventListener('DOMContentLoaded', () => {
  initNavToggle();
  initContactForm();
  handleResizeCloseNav();
});
