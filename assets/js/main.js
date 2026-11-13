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

  /* ---------------- 版本页：可输入 + 可选下拉筛选 ---------------- */
  var versionFilter = document.getElementById('version-filter');
  if (versionFilter) {
    var filterBtn = document.getElementById('version-filter-btn');
    var filterMenu = document.getElementById('version-filter-menu');
    var filterValue = document.getElementById('version-filter-value');
    var filterOptions = versionFilter.querySelectorAll('.version-filter-option');
    var versionRows = document.querySelectorAll('.versions-row[data-game]');
    var currentValue = 'all';
    var currentLabel = filterValue.value || '全部版本';
    var activeIndex = -1;

    function optionLabel(option) {
      var span = option.querySelector('span');
      return span ? span.textContent : option.getAttribute('data-value');
    }

    function applyFilter(value) {
      Array.prototype.forEach.call(versionRows, function (row) {
        var games = (row.getAttribute('data-game') || '').split(/\s+/);
        row.hidden = value !== 'all' && games.indexOf(value) === -1;
      });
    }

    function setFilterOpen(open) {
      versionFilter.classList.toggle('is-open', open);
      filterBtn.setAttribute('aria-expanded', open ? 'true' : 'false');
      filterValue.setAttribute('aria-expanded', open ? 'true' : 'false');
      filterMenu.hidden = !open;
    }

    function visibleOptions() {
      return Array.prototype.filter.call(filterOptions, function (option) {
        return !option.hidden;
      });
    }

    function selectOption(option) {
      Array.prototype.forEach.call(filterOptions, function (item) {
        var selected = item === option;
        item.classList.toggle('is-selected', selected);
        item.setAttribute('aria-selected', selected ? 'true' : 'false');
        item.classList.remove('is-active');
        item.hidden = false;
      });
      currentValue = option.getAttribute('data-value');
      currentLabel = optionLabel(option);
      filterValue.value = currentLabel;
      applyFilter(currentValue);
      activeIndex = -1;
      setFilterOpen(false);
    }

    /* 关闭时恢复当前已选版本，不保留临时输入 */
    function resetFilterLabel() {
      filterValue.value = currentLabel;
      Array.prototype.forEach.call(filterOptions, function (option) {
        option.hidden = false;
        option.classList.remove('is-active');
      });
      activeIndex = -1;
      applyFilter(currentValue);
    }

    function filterOptionsBy(query) {
      Array.prototype.forEach.call(filterOptions, function (option) {
        option.hidden = query !== '' && optionLabel(option).toLowerCase().indexOf(query) === -1;
        option.classList.remove('is-active');
      });
      activeIndex = -1;
    }

    filterBtn.addEventListener('click', function (event) {
      if (event.target === filterValue) {
        if (filterMenu.hidden) setFilterOpen(true);
        filterValue.select();
        return;
      }
      if (filterMenu.hidden) {
        setFilterOpen(true);
        filterValue.focus();
        filterValue.select();
      } else {
        setFilterOpen(false);
        resetFilterLabel();
      }
    });

    filterValue.addEventListener('focus', function () {
      setFilterOpen(true);
      filterValue.select();
    });

    filterValue.addEventListener('input', function () {
      var query = filterValue.value.trim().toLowerCase();
      filterOptionsBy(query);
      setFilterOpen(true);
    });

    filterValue.addEventListener('blur', function () {
      window.setTimeout(function () {
        if (!versionFilter.contains(document.activeElement)) {
          setFilterOpen(false);
          resetFilterLabel();
        }
      }, 0);
    });

    filterValue.addEventListener('keydown', function (event) {
      var list = visibleOptions();

      if (event.key === 'ArrowDown' || event.key === 'ArrowUp') {
        if (!list.length) return;
        event.preventDefault();
        if (event.key === 'ArrowDown') {
          activeIndex = Math.min(activeIndex + 1, list.length - 1);
        } else {
          activeIndex = Math.max(activeIndex - 1, 0);
        }
        Array.prototype.forEach.call(list, function (option, index) {
          option.classList.toggle('is-active', index === activeIndex);
        });
        list[activeIndex].scrollIntoView({ block: 'nearest' });
      } else if (event.key === 'Enter') {
        event.preventDefault();
        var pick = list[activeIndex >= 0 ? activeIndex : 0];
        if (pick) selectOption(pick);
      } else if (event.key === 'Escape') {
        setFilterOpen(false);
        resetFilterLabel();
        filterValue.blur();
      }
    });

    Array.prototype.forEach.call(filterOptions, function (option) {
      option.addEventListener('click', function () {
        selectOption(option);
      });
    });

    document.addEventListener('click', function (event) {
      if (!versionFilter.contains(event.target)) {
        setFilterOpen(false);
        resetFilterLabel();
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
