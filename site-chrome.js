(function () {
  var themeKey = 'rosdorspk:theme';
  var systemTheme = window.matchMedia('(prefers-color-scheme: dark)');
  var reducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)');
  var themePreference = null;
  var themeTransition = null;
  try {
    var savedTheme = localStorage.getItem(themeKey);
    if (savedTheme === 'light' || savedTheme === 'dark') themePreference = savedTheme;
  } catch (error) {
    // The theme control also works when browser storage is unavailable.
  }

  function getActiveTheme() {
    return themePreference || (systemTheme.matches ? 'dark' : 'light');
  }

  function applyTheme() {
    var activeTheme = getActiveTheme();
    document.documentElement.dataset.siteTheme = activeTheme;
    var label = activeTheme === 'dark' ? 'Включить светлую тему' : 'Включить тёмную тему';
    document.querySelectorAll('.edu2-chrome-theme').forEach(function (button) {
      button.setAttribute('aria-label', label);
      button.title = label;
    });
  }

  function animateThemeChange(button) {
    var root = document.documentElement;
    if (themeTransition) {
      themeTransition.skipTransition();
      applyTheme();
      return;
    }
    if (root.dataset.siteTheme === getActiveTheme()) return;
    if (reducedMotion.matches || document.hidden || !document.startViewTransition) {
      applyTheme();
      return;
    }

    root.classList.add('site-theme-transition');
    button.classList.add('is-theme-transitioning');
    var transition = document.startViewTransition(applyTheme);
    themeTransition = transition;
    // A second click can skip the transition before its snapshots are ready.
    transition.ready.catch(function () {});
    function finishTransition() {
      themeTransition = null;
      root.classList.remove('site-theme-transition');
      button.classList.remove('is-theme-transitioning');
    }
    transition.finished.then(finishTransition, finishTransition);
  }

  applyTheme();
  if (systemTheme.addEventListener) systemTheme.addEventListener('change', applyTheme);
  else systemTheme.addListener(applyTheme);
  window.addEventListener('storage', function (event) {
    if (event.key !== themeKey && event.key !== null) return;
    themePreference = event.newValue === 'light' || event.newValue === 'dark' ? event.newValue : null;
    applyTheme();
  });

  function initThemeToggle(menuButton) {
    var button = menuButton.previousElementSibling;
    if (!button || !button.classList.contains('edu2-chrome-theme')) {
      button = document.createElement('button');
      button.type = 'button';
      button.className = 'edu2-chrome-theme';
      menuButton.before(button);
    }
    if (!button.firstElementChild) {
      button.innerHTML = '<span class="edu2-chrome-theme__icon" aria-hidden="true"></span>';
    }
    applyTheme();

    button.addEventListener('click', function () {
      themePreference = getActiveTheme() === 'dark' ? 'light' : 'dark';
      try {
        localStorage.setItem(themeKey, themePreference);
      } catch (error) {
        // The selected mode stays active in this page.
      }
      animateThemeChange(button);
    });
    button.disabled = false;
  }

  function initHeader(header) {
    var button = header.querySelector('[data-edu2-chrome-menu-button]');
    var menu = header.querySelector('.edu2-chrome-mobile-menu');
    var aboutGroup = header.querySelector('[data-edu2-chrome-about]');
    var aboutTrigger = aboutGroup && aboutGroup.querySelector('[data-edu2-chrome-about-trigger]');
    var aboutMenu = aboutGroup && aboutGroup.querySelector('[data-edu2-chrome-about-menu]');
    var mobileAbout = header.querySelector('[data-edu2-chrome-mobile-about]');
    var mobileAboutToggle = mobileAbout && mobileAbout.querySelector('[data-edu2-chrome-mobile-about-toggle]');
    var mobileAboutMenu = mobileAbout && mobileAbout.querySelector('[data-edu2-chrome-mobile-about-menu]');
    var aboutCloseTimer = 0;
    var aboutKeyboardInteraction = false;
    if (!button || !menu) return;
    initThemeToggle(button);
    var backdrop = document.createElement('div');
    backdrop.className = 'edu2-chrome-menu-backdrop';
    backdrop.setAttribute('aria-hidden', 'true');
    document.body.appendChild(backdrop);
    backdrop.addEventListener('click', function () {
      setMenu(false);
      button.focus({ preventScroll: true });
    });

    function setAboutMenu(open) {
      if (!aboutGroup || !aboutTrigger || !aboutMenu) return;
      window.clearTimeout(aboutCloseTimer);
      aboutGroup.classList.toggle('is-open', open);
      aboutTrigger.setAttribute('aria-expanded', String(open));
      aboutMenu.setAttribute('aria-hidden', String(!open));
      aboutMenu.toggleAttribute('inert', !open);
    }

    function scheduleAboutClose() {
      window.clearTimeout(aboutCloseTimer);
      aboutCloseTimer = window.setTimeout(function () {
        var keepKeyboardFocus = aboutGroup && aboutKeyboardInteraction && aboutGroup.contains(document.activeElement);
        if (!aboutGroup || (!aboutGroup.matches(':hover') && !keepKeyboardFocus)) {
          if (aboutMenu && aboutMenu.contains(document.activeElement)) aboutTrigger.focus();
          setAboutMenu(false);
        }
      }, 170);
    }

    function setMobileAbout(open) {
      if (!mobileAbout || !mobileAboutToggle || !mobileAboutMenu) return;
      mobileAbout.classList.toggle('is-open', open);
      mobileAboutToggle.setAttribute('aria-expanded', String(open));
      mobileAboutMenu.setAttribute('aria-hidden', String(!open));
      mobileAboutMenu.toggleAttribute('inert', !open);
    }

    function setMenu(open) {
      backdrop.classList.toggle('is-open', open);
      button.classList.toggle('is-open', open);
      menu.classList.toggle('is-open', open);
      button.setAttribute('aria-expanded', String(open));
      button.setAttribute('aria-label', open ? 'Закрыть меню' : 'Открыть меню');
      menu.setAttribute('aria-hidden', String(!open));
      if (open) {
        menu.removeAttribute('inert');
        setMobileAbout(!!(mobileAboutMenu && mobileAboutMenu.querySelector('[aria-current="page"]')));
      }
      else {
        menu.setAttribute('inert', '');
        // Keep the submenu height stable while the panel fades out.
      }
    }

    if (aboutGroup && aboutTrigger && aboutMenu) {
      aboutGroup.addEventListener('pointerdown', function () {
        aboutKeyboardInteraction = false;
      });

      aboutGroup.addEventListener('keydown', function () {
        aboutKeyboardInteraction = true;
      });

      aboutGroup.addEventListener('pointerenter', function (event) {
        if (event.pointerType === 'mouse') setAboutMenu(true);
      });

      aboutGroup.addEventListener('pointerleave', function (event) {
        if (event.pointerType === 'mouse') scheduleAboutClose();
      });

      aboutGroup.addEventListener('focusout', function () {
        window.setTimeout(scheduleAboutClose, 0);
      });

      aboutTrigger.addEventListener('click', function (event) {
        var mouseClick = event.pointerType === 'mouse' && event.detail > 0;
        setAboutMenu(mouseClick || aboutTrigger.getAttribute('aria-expanded') !== 'true');
      });

      aboutTrigger.addEventListener('keydown', function (event) {
        if (event.key !== 'ArrowDown') return;
        event.preventDefault();
        setAboutMenu(true);
        var firstLink = aboutMenu.querySelector('a');
        if (firstLink) firstLink.focus();
      });

      aboutMenu.addEventListener('click', function (event) {
        if (event.target.closest('a')) setAboutMenu(false);
      });
    }

    if (mobileAboutToggle && mobileAboutMenu) {
      mobileAboutToggle.addEventListener('click', function () {
        setMobileAbout(mobileAboutToggle.getAttribute('aria-expanded') !== 'true');
      });
    }

    button.addEventListener('click', function () {
      setMenu(button.getAttribute('aria-expanded') !== 'true');
    });

    menu.addEventListener('click', function (event) {
      if (event.target.closest('a')) setMenu(false);
    });

    document.addEventListener('click', function (event) {
      if (button.getAttribute('aria-expanded') === 'true' && !header.contains(event.target)) setMenu(false);
      if (aboutGroup && !aboutGroup.contains(event.target)) setAboutMenu(false);
    });

    document.addEventListener('keydown', function (event) {
      if (event.key !== 'Escape') return;
      if (button.getAttribute('aria-expanded') === 'true') {
        setMenu(false);
        button.focus({ preventScroll: true });
        return;
      }
      if (aboutTrigger && aboutTrigger.getAttribute('aria-expanded') === 'true') {
        aboutTrigger.focus();
        setAboutMenu(false);
      } else if (mobileAboutToggle && mobileAboutToggle.getAttribute('aria-expanded') === 'true') {
        setMobileAbout(false);
        mobileAboutToggle.focus();
      }
    });

    document.addEventListener('focusin', function (event) {
      if (button.getAttribute('aria-expanded') === 'true' && !header.contains(event.target)) setMenu(false);
    });

    window.matchMedia('(max-width: 900px)').addEventListener('change', function (event) {
      if (!event.matches) {
        setMenu(false);
        setMobileAbout(false);
      } else {
        setAboutMenu(false);
      }
    });
  }

  function initSectionMenu(menu) {
    var toggle = menu.querySelector('.site-section-menu__toggle');
    var panel = toggle && document.getElementById(toggle.getAttribute('aria-controls'));
    if (!panel || !menu.contains(panel)) return;

    var compact = window.matchMedia('(max-width: 960px)');

    function fitPanel() {
      if (!menu.classList.contains('is-open')) return;
      var available = window.innerHeight - menu.getBoundingClientRect().bottom - 16;
      menu.style.setProperty('--site-section-menu-space', Math.max(80, available) + 'px');
    }

    function setOpen(open) {
      open = open && compact.matches;
      toggle.setAttribute('aria-expanded', String(open));
      panel.toggleAttribute('inert', compact.matches && !open);
      menu.classList.toggle('is-open', open);
      fitPanel();
    }

    toggle.addEventListener('click', function () {
      setOpen(toggle.getAttribute('aria-expanded') !== 'true');
    });

    menu.addEventListener('keydown', function (event) {
      if (event.key !== 'Escape' || !menu.classList.contains('is-open')) return;
      event.preventDefault();
      setOpen(false);
      toggle.focus({ preventScroll: true });
    });

    document.addEventListener('click', function (event) {
      if (!menu.contains(event.target) || event.target.closest('a')) setOpen(false);
    });
    document.addEventListener('focusin', function (event) {
      if (!menu.contains(event.target) && menu.classList.contains('is-open')) setOpen(false);
    });

    compact.addEventListener('change', function () { setOpen(false); });
    window.addEventListener('scroll', fitPanel, { passive: true });
    window.addEventListener('resize', fitPanel, { passive: true });

    menu.classList.add('is-menu-ready');
    setOpen(false);
  }

  function initBackToTop() {
    var page = document.querySelector('[data-site-back-top]');
    if (!page) return;

    var button = document.createElement('button');
    button.type = 'button';
    button.className = 'site-back-top';
    button.title = 'Наверх';
    button.setAttribute('aria-label', 'Наверх');
    button.innerHTML = '<svg viewBox="0 0 24 24" aria-hidden="true" focusable="false"><path d="M12 19V5m-6 6 6-6 6 6"></path></svg>';
    document.body.appendChild(button);

    function updateVisibility() {
      button.classList.toggle('is-visible', window.scrollY > 480);
    }

    button.addEventListener('click', function (event) {
      if (event.detail === 0) {
        var heading = page.querySelector('h1') || page;
        if (!heading.hasAttribute('tabindex')) heading.setAttribute('tabindex', '-1');
        heading.focus({ preventScroll: true });
      }
      window.scrollTo({ top: 0, behavior: reducedMotion.matches ? 'instant' : 'smooth' });
    });
    window.addEventListener('scroll', updateVisibility, { passive: true });
    updateVisibility();
  }

  function init() {
    initBackToTop();
    if (window.location.protocol === 'file:') {
      document.querySelectorAll('.edu2-chrome-footer__policy').forEach(function (link) {
        link.setAttribute('href', 'policy.html#top');
      });
    }
    document.querySelectorAll('.edu2-chrome-header').forEach(initHeader);
    document.querySelectorAll('.site-section-menu').forEach(initSectionMenu);
  }

  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', init);
  else init();
})();
