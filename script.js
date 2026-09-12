const menuButton = document.querySelector('.menu-toggle');
const menu = document.querySelector('.menu');
menuButton.addEventListener('click', () => {
  const open = menu.classList.toggle('open');
  menuButton.setAttribute('aria-expanded', String(open));
});
menu.querySelectorAll('a').forEach(link => link.addEventListener('click', () => {
  menu.classList.remove('open');
  menuButton.setAttribute('aria-expanded', 'false');
}));

// Motion is progressive: content remains visible when JavaScript or observers are unavailable.
const reducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
if (!reducedMotion && 'IntersectionObserver' in window) {
  document.body.classList.add('can-reveal');
  const revealObserver = new IntersectionObserver(entries => {
    entries.forEach(entry => {
      if (entry.isIntersecting) {
        entry.target.classList.add('in-view');
        revealObserver.unobserve(entry.target);
      }
    });
  }, {threshold: 0.08, rootMargin: '0px 0px 45px 0px'});
  document.querySelectorAll('[data-reveal]').forEach(element => revealObserver.observe(element));
}
const progress = document.querySelector('.reading-progress');
let progressScheduled = false;
function updateProgress() {
  const available = document.documentElement.scrollHeight - window.innerHeight;
  progress.style.transform = `scaleX(${available > 0 ? Math.min(1, scrollY / available) : 0})`;
  progressScheduled = false;
}
window.addEventListener('scroll', () => {
  if (!progressScheduled) {
    progressScheduled = true;
    requestAnimationFrame(updateProgress);
  }
}, {passive: true});
updateProgress();
const stepObserver = 'IntersectionObserver' in window ? new IntersectionObserver(entries => {
  entries.forEach(entry => entry.target.classList.toggle('current', entry.isIntersecting));
}, {threshold: 0.7}) : null;
stepObserver?.observe(document.querySelector('.steps li:first-child'));
document.querySelectorAll('.steps li:not(:first-child)').forEach(step => stepObserver?.observe(step));

const form = document.querySelector('#contact-form');
const status = document.querySelector('.form-status');
form.addEventListener('submit', async event => {
  event.preventDefault();
  if (!form.reportValidity()) return;
  const button = form.querySelector('button[type="submit"]');
  button.disabled = true;
  status.textContent = 'Sending…';
  try {
    const response = await fetch(form.action, {
      method: 'POST', body: new FormData(form), headers: {Accept: 'application/json'}
    });
    if (!response.ok) throw new Error('Request failed');
    form.reset();
    status.textContent = 'Thanks! Your inquiry was sent.';
  } catch {
    status.innerHTML = 'Could not send. Please email <a href="mailto:vqshen4@gmail.com">vqshen4@gmail.com</a>.';
  } finally {
    button.disabled = false;
  }
});
