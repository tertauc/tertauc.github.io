/* =========================================================
   个人主页交互脚本
   1) 主题：auto（跟随系统）/ light / dark 三态切换并持久化
   2) 项目卡片提示
   ========================================================= */
(function () {
  'use strict';

  var root = document.documentElement;
  var STORAGE_KEY = 'theme-preference';
  var MODES = ['auto', 'light', 'dark'];
  var LABELS = { auto: '跟随系统', light: '浅色', dark: '深色' };
  var THEME_COLORS = { light: '#ffffff', dark: '#0b0e14' };
  var media = window.matchMedia('(prefers-color-scheme: dark)');

  /* ---------------- 主题 ---------------- */
  var toggle = document.getElementById('theme-toggle');

  function readMode() {
    try {
      var saved = localStorage.getItem(STORAGE_KEY);
      return MODES.indexOf(saved) !== -1 ? saved : 'auto';
    } catch (e) {
      return 'auto';
    }
  }

  function saveMode(mode) {
    try { localStorage.setItem(STORAGE_KEY, mode); } catch (e) { /* 隐私模式等场景忽略 */ }
  }

  function resolveMode(mode) {
    return mode === 'auto' ? (media.matches ? 'dark' : 'light') : mode;
  }

  function renderTheme(mode) {
    var resolved = resolveMode(mode);
    root.setAttribute('data-theme', resolved);
    root.setAttribute('data-theme-mode', mode);

    var meta = document.getElementById('meta-theme-color');
    if (meta) meta.setAttribute('content', THEME_COLORS[resolved]);

    if (toggle) {
      var label = '主题：' + LABELS[mode] + '（点击切换）';
      toggle.setAttribute('aria-label', label);
      toggle.title = label;
    }
  }

  var mode = readMode();
  renderTheme(mode);

  if (toggle) {
    toggle.addEventListener('click', function () {
      mode = MODES[(MODES.indexOf(mode) + 1) % MODES.length];
      saveMode(mode);
      renderTheme(mode);
    });
  }

  function onSystemChange() {
    if (mode === 'auto') renderTheme(mode);
  }
  if (typeof media.addEventListener === 'function') {
    media.addEventListener('change', onSystemChange);
  } else if (typeof media.addListener === 'function') {
    media.addListener(onSystemChange);
  }

  window.addEventListener('storage', function (event) {
    if (event.key !== STORAGE_KEY) return;
    mode = readMode();
    renderTheme(mode);
  });

  /* ---------------- 项目卡片：暂未完成提示 ---------------- */
  var toastEl = document.getElementById('toast');
  var toastTimer = null;

  function showToast(message) {
    if (!toastEl) return;
    toastEl.textContent = message;
    toastEl.classList.add('is-visible');
    clearTimeout(toastTimer);
    toastTimer = setTimeout(function () {
      toastEl.classList.remove('is-visible');
    }, 2000);
  }

  Array.prototype.forEach.call(document.querySelectorAll('button.project'), function (card) {
    card.addEventListener('click', function () {
      showToast('还没做完');
    });
  });

  /* ---------------- 版本页：按游戏版本过滤 ---------------- */
  var versionFilter = document.getElementById('version-filter');
  if (versionFilter) {
    var filterBtn = document.getElementById('version-filter-btn');
    var filterMenu = document.getElementById('version-filter-menu');
    var filterValue = document.getElementById('version-filter-value');
    var filterOptions = versionFilter.querySelectorAll('.version-filter-option');
    var versionRows = document.querySelectorAll('.versions-row[data-game]');

    function applyFilter(value) {
      Array.prototype.forEach.call(versionRows, function (row) {
        row.hidden = value !== 'all' && row.getAttribute('data-game') !== value;
      });
    }

    function setFilterOpen(open) {
      versionFilter.classList.toggle('is-open', open);
      filterBtn.setAttribute('aria-expanded', open ? 'true' : 'false');
      filterMenu.hidden = !open;
    }

    filterBtn.addEventListener('click', function () {
      setFilterOpen(filterMenu.hidden);
    });

    Array.prototype.forEach.call(filterOptions, function (option) {
      option.addEventListener('click', function () {
        var value = option.getAttribute('data-value');
        Array.prototype.forEach.call(filterOptions, function (item) {
          var selected = item === option;
          item.classList.toggle('is-selected', selected);
          item.setAttribute('aria-selected', selected ? 'true' : 'false');
        });
        filterValue.textContent = option.querySelector('span').textContent;
        applyFilter(value);
        setFilterOpen(false);
        filterBtn.focus();
      });
    });

    document.addEventListener('click', function (event) {
      if (!versionFilter.contains(event.target)) setFilterOpen(false);
    });

    document.addEventListener('keydown', function (event) {
      if (event.key === 'Escape' && !filterMenu.hidden) {
        setFilterOpen(false);
        filterBtn.focus();
      }
    });
  }

  /* ---------------- 滚动显现 ---------------- */
  var revealTargets = document.querySelectorAll('.reveal');
  var reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  if ('IntersectionObserver' in window && !reduceMotion) {
    var revealObserver = new IntersectionObserver(function (entries, observer) {
      entries.forEach(function (entry) {
        if (!entry.isIntersecting) return;
        entry.target.classList.add('is-visible');
        observer.unobserve(entry.target);
      });
    }, { rootMargin: '0px 0px -10% 0px', threshold: 0.1 });

    revealTargets.forEach(function (el) { revealObserver.observe(el); });
  } else {
    revealTargets.forEach(function (el) { el.classList.add('is-visible'); });
  }

  /* ---------------- 页脚年份 ---------------- */
  var yearEl = document.getElementById('year');
  if (yearEl) yearEl.textContent = String(new Date().getFullYear());
})();
