document.addEventListener('DOMContentLoaded', () => {
  setupHamburger();
  setupContactForm();
});

function setupHamburger() {
  const hamburger = document.getElementById('hamburger');
  const nav = document.getElementById('global-nav');
  if (!hamburger || !nav) return;
  hamburger.addEventListener('click', () => {
    nav.classList.toggle('open');
  });
}

function setupContactForm() {
  const form = document.getElementById('contactForm');
  const thanks = document.getElementById('formThanks');
  if (!form) return;
  form.addEventListener('submit', (event) => {
    event.preventDefault();
    form.reset();
    if (thanks) {
      thanks.textContent = '送信ありがとうございました。担当者よりご連絡いたします。';
    }
    alert('送信ありがとうございました。担当者よりご連絡いたします。');
  });
}
