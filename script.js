const menuButton = document.querySelector('.menu-toggle');
const navigation = document.querySelector('.site-nav');
const menuLabel = menuButton?.querySelector('.sr-only');

if (menuButton && navigation) {
  menuButton.addEventListener('click', () => {
    const nextState = menuButton.getAttribute('aria-expanded') !== 'true';
    menuButton.setAttribute('aria-expanded', String(nextState));
    navigation.classList.toggle('is-open', nextState);
    if (menuLabel) menuLabel.textContent = nextState ? 'Закрыть меню' : 'Открыть меню';
  });

  navigation.querySelectorAll('a').forEach((link) => {
    link.addEventListener('click', () => {
      menuButton.setAttribute('aria-expanded', 'false');
      navigation.classList.remove('is-open');
      if (menuLabel) menuLabel.textContent = 'Открыть меню';
    });
  });
}

const symptomButtons = document.querySelectorAll('[data-symptom]');
const symptomOutput = document.querySelector('#selected-symptom');
const diagnosticLink = document.querySelector('#diagnostic-whatsapp');
const mobileSymptomLinks = document.querySelectorAll('[data-symptom-link]');

symptomButtons.forEach((button) => {
  button.addEventListener('click', () => {
    const symptom = button.dataset.symptom;

    symptomButtons.forEach((item) => {
      const selected = item === button;
      item.classList.toggle('is-selected', selected);
      item.setAttribute('aria-pressed', String(selected));
    });

    if (symptomOutput) symptomOutput.textContent = symptom;
    const message = `Здравствуйте! Обращаюсь с сайта АРАНА. ${symptom}. Подскажите, пожалуйста, как лучше поступить.`;
    const href = `https://wa.me/79154276111?text=${encodeURIComponent(message)}`;
    if (diagnosticLink) diagnosticLink.href = href;
    mobileSymptomLinks.forEach((link) => { link.href = href; });
  });
});

const revealItems = document.querySelectorAll('.reveal');
const reducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

if (reducedMotion || !('IntersectionObserver' in window)) {
  revealItems.forEach((item) => item.classList.add('is-visible'));
} else {
  const revealObserver = new IntersectionObserver(
    (entries, observer) => {
      entries.forEach((entry) => {
        if (!entry.isIntersecting) return;
        entry.target.classList.add('is-visible');
        observer.unobserve(entry.target);
      });
    },
    { threshold: 0.12 },
  );

  revealItems.forEach((item) => revealObserver.observe(item));
}

const year = document.querySelector('#year');
if (year) year.textContent = String(new Date().getFullYear());
