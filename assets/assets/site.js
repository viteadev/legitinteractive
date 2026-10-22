document.addEventListener('DOMContentLoaded', () => {
  const hero = document.querySelector('.hero');
  const showcase = document.querySelector('main > .showcase');
  if (hero && showcase) hero.prepend(showcase);

  const form = document.getElementById('careerForm');
  if (!form) return;
  const application = document.getElementById('application');
  const closeApplication = document.getElementById('closeApplication');
  const submitButton = form.querySelector('.submit');
  const consents = [document.getElementById('ageConsent'), document.getElementById('legalConsent')];
  const updateSubmitState = () => { submitButton.disabled = !consents.every((consent) => consent.checked); };
  consents.forEach((consent) => consent.addEventListener('change', updateSubmitState));
  new MutationObserver(() => {
    if (!application.classList.contains('show')) return;
    consents.forEach((consent) => { consent.checked = false; });
    updateSubmitState();
    closeApplication.focus();
  }).observe(application, { attributes: true, attributeFilter: ['class'] });
  closeApplication.addEventListener('click', () => application.classList.remove('show'));
  application.addEventListener('click', (event) => { if (event.target === application) application.classList.remove('show'); });

  document.addEventListener('keydown', (event) => {
    if (event.key !== 'Escape') return;
    application.classList.remove('show');
  });
});
