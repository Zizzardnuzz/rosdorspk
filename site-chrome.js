(function () {
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
      } else if (button.getAttribute('aria-expanded') === 'true') {
        setMenu(false);
        button.focus();
      }
    });

    document.addEventListener('focusin', function (event) {
      if (button.getAttribute('aria-expanded') === 'true' && !header.contains(event.target)) setMenu(false);
    });

    window.addEventListener('resize', function () {
      if (window.innerWidth > 900) {
        setMenu(false);
        setMobileAbout(false);
      } else {
        setAboutMenu(false);
      }
    }, { passive: true });
  }

  function init() {
    if (window.location.protocol === 'file:') {
      document.querySelectorAll('.edu2-chrome-footer__policy').forEach(function (link) {
        link.setAttribute('href', 'policy.html#top');
      });
    }
    document.querySelectorAll('.edu2-chrome-header').forEach(initHeader);
  }

  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', init);
  else init();
})();
