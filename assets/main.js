/* =========================================================
   个人主页交互脚本
   1) 主题：auto（跟随系统）/ light / dark 三态切换并持久化
   2) 神秘服务器神人语录：全屏面板 + 单条放大
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

  /* ---------------- 语录数据 ---------------- */
  var QUOTES = [
    '华佗，你几个意思？我改一个据点的名字，就花我 1000',
    '早知道不改了',
    '还不如去买 2 块地',
    '我要退钱',
    '别给我发神秘表情包，我要退钱',
    '就压力怎么滴',
    '神秘华佗又不回我退钱',
    '别天天给我发神秘表情包',
    '到底退不退钱',
    '我要建世吞',
    '世吞也不退',
    '@A 机器傻子 神的审美你不懂',
    '这华佗要是给我发 1000，我直接在主城发不死图腾',
    '@A 机器傻子 @接代打服主工作 我现在不缺这点钱好吧，我现在在卖不祥之瓶和不死图腾',
    '神秘华佗扣我 1000',
    '合着我成无能的丈夫了',
    '我就在这里刷屏了，我看是我手速快还是他手速快',
    '有本事来打个决斗😡',
    '神秘话筒刚才给我禁言了',
    '我靠，神秘卡加载页面',
    '做的什么勾八服务器？',
    '什么勾八客户端',
    '我明明都打死他了，然后他用图腾',
    '神秘华佗和我打决斗犯规',
    '神秘华佗直接退',
    '@接代打服主工作 你头像居然是肥美小正太',
    '@A 机器傻子 长这个屎样',
    '@A 机器傻子 我是三逼',
    '我是曹操专克',
    '华佗依旧隐身搞鬼',
    '我看到了华佗在线',
    '@接删端跑路工作 我绝对不会叫妈妈的',
    '神人华佗在我家里放一大堆猫',
    '放了几百个坚守者',
    '@接压力服主工作 你一直设也一样',
    '不是不是 肯定是你服务器问题 我现在都进去了',
    '不是又崩了',
    '别血口喷人，明明是你服务器不行',
    '我现在已经是富豪了好吧',
    '直接展示财富',
    '我去我去，还好这机器人不会真执行命令',
    '1 分没少',
    '不用了，智障永远教不会',
    '(?我为啥不能领新手礼包)',
    '21ove_[附魔书 x1]',
    'kskbl 玩了附魔冲突了',
    '21ove 这种附魔要重新打的 kskbl 能退吗',
    '21ove_要重新打一套',
    '21ove_附魔书给我',
    '21ove_退你 1 块钱',
    '21ove_这几个附魔都需要重新打附魔',
    '21ove_[锋利 x1]',
    'kskbl 我去不早说',
    '21ove_利刃跟锋利冲突好像',
    '21ove_你没问啊',
    '21ove_我以为你知道'
  ];

  /* 经典总结：按钮展示，点开后放大并模糊背景 */
  var CLASSICS = [
    {
      label: '经典 1',
      text: '改名消费 1000 块钱，不如圈两块地；找华佗退钱不退，扬言造世吞炸服。'
    },
    {
      label: '经典 2',
      text: '5000 块钱买了一本附魔书，结果冲突无法附魔。'
    }
  ];

  var CLASSIC_ICON =
    '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" ' +
    'stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">' +
    '<path d="M12 3.5l1.9 4.6 4.6 1.9-4.6 1.9L12 16.5l-1.9-4.6L5.5 10l4.6-1.9L12 3.5Z"/>' +
    '<path d="M18.5 16l.9 2.1 2.1.9-2.1.9-.9 2.1-.9-2.1-2.1-.9 2.1-.9.9-2.1Z"/>' +
    '</svg>';

  var CLASSIC_ARROW =
    '<svg class="classic-arrow" viewBox="0 0 24 24" fill="none" stroke="currentColor" ' +
    'stroke-width="1.7" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">' +
    '<path d="M7 17 17 7M9 7h8v8"/></svg>';

  /* ---------------- 语录界面 ---------------- */
  var entry = document.getElementById('quotes-entry');
  var view = document.getElementById('quotes-view');
  var grid = document.getElementById('quotes-grid');
  var classicsGrid = document.getElementById('classics-grid');
  var closeBtn = document.getElementById('quotes-close');
  var bodyEl = document.getElementById('quotes-body');

  var detail = document.getElementById('quote-detail');
  var detailText = document.getElementById('quote-detail-text');
  var detailLabel = document.getElementById('quote-detail-label');
  var detailClose = document.getElementById('quote-detail-close');

  var backgroundRegions = document.querySelectorAll('.site-header, main, .site-footer');
  var lastFocus = null;
  var lastQuoteButton = null;
  var detailOpen = false;

  function setBackgroundInert(on) {
    Array.prototype.forEach.call(backgroundRegions, function (el) {
      el.inert = on;
    });
  }

  function renderQuotes() {
    if (!grid) return;

    var fragment = document.createDocumentFragment();
    QUOTES.forEach(function (text) {
      var card = document.createElement('button');
      card.type = 'button';
      card.className = 'quote-card';

      var span = document.createElement('span');
      span.className = 'quote-card-text';
      span.textContent = text;
      card.appendChild(span);

      card.addEventListener('click', function () {
        openDetail(text, card);
      });

      fragment.appendChild(card);
    });

    grid.appendChild(fragment);
  }

  function renderClassics() {
    if (!classicsGrid) return;

    var fragment = document.createDocumentFragment();
    CLASSICS.forEach(function (item) {
      var card = document.createElement('button');
      card.type = 'button';
      card.className = 'classic';
      card.innerHTML =
        '<span class="classic-icon" aria-hidden="true">' + CLASSIC_ICON + '</span>' +
        '<span class="classic-body">' +
          '<span class="classic-label">' + item.label + '</span>' +
        '</span>' +
        CLASSIC_ARROW;

      var text = document.createElement('span');
      text.className = 'classic-text';
      text.textContent = item.text;
      card.querySelector('.classic-body').appendChild(text);

      card.addEventListener('click', function () {
        openDetail(item.text, card, item.label);
      });

      fragment.appendChild(card);
    });

    classicsGrid.appendChild(fragment);
  }

  function openQuotes() {
    if (!view) return;
    lastFocus = document.activeElement;
    view.classList.add('is-open');
    view.setAttribute('aria-hidden', 'false');
    document.body.classList.add('is-locked');
    setBackgroundInert(true);
    if (bodyEl) bodyEl.scrollTop = 0;
    if (closeBtn) closeBtn.focus();
  }

  function closeQuotes(restoreFocus) {
    if (!view) return;
    view.classList.remove('is-open');
    view.setAttribute('aria-hidden', 'true');
    document.body.classList.remove('is-locked');
    setBackgroundInert(false);

    /* 鼠标关闭不还原焦点，避免触发按钮的蓝色焦点边框；键盘关闭则还原焦点 */
    if (restoreFocus && lastFocus && typeof lastFocus.focus === 'function') {
      lastFocus.focus();
    } else if (document.activeElement && typeof document.activeElement.blur === 'function') {
      document.activeElement.blur();
    }
  }

  function openDetail(text, trigger, label) {
    if (!detail) return;
    detailOpen = true;
    lastQuoteButton = trigger || null;
    detailText.textContent = text;

    if (label) {
      detailLabel.textContent = label;
      detailLabel.hidden = false;
      detail.classList.add('is-summary');
      detail.setAttribute('aria-label', label + ' 经典总结');
    } else {
      detailLabel.textContent = '';
      detailLabel.hidden = true;
      detail.classList.remove('is-summary');
      detail.setAttribute('aria-label', '语录详情');
    }

    detail.classList.add('is-open');
    detail.setAttribute('aria-hidden', 'false');
    if (view) view.inert = true;
    if (detailClose) detailClose.focus();
  }

  function closeDetail(restoreFocus) {
    if (!detail) return;
    detailOpen = false;
    detail.classList.remove('is-open');
    detail.setAttribute('aria-hidden', 'true');
    if (view) view.inert = false;

    if (restoreFocus && lastQuoteButton && typeof lastQuoteButton.focus === 'function') {
      lastQuoteButton.focus();
    } else if (document.activeElement && typeof document.activeElement.blur === 'function') {
      document.activeElement.blur();
    }
  }

  if (entry) entry.addEventListener('click', openQuotes);
  if (closeBtn) {
    closeBtn.addEventListener('click', function (event) {
      closeQuotes(event.detail === 0);
    });
  }
  if (detailClose) {
    detailClose.addEventListener('click', function (event) {
      closeDetail(event.detail === 0);
    });
  }

  if (detail) {
    detail.addEventListener('click', function (event) {
      if (event.target === detail) closeDetail(false);
    });
  }

  document.addEventListener('keydown', function (event) {
    if (event.key !== 'Escape') return;
    if (detailOpen) {
      closeDetail(true);
    } else if (view && view.classList.contains('is-open')) {
      closeQuotes(true);
    }
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

  Array.prototype.forEach.call(document.querySelectorAll('.project'), function (card) {
    card.addEventListener('click', function () {
      showToast('还没做完');
    });
  });

  /* 桌面端无法唤起 QQ 时，提示群号 */
  var qqJoin = document.querySelector('.qq-join');
  if (qqJoin) {
    qqJoin.addEventListener('click', function () {
      setTimeout(function () {
        if (document.visibilityState === 'visible') {
          showToast('群号 779100915，请在 QQ 中搜索加入');
        }
      }, 1200);
    });
  }

  renderQuotes();
  renderClassics();

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
