        /* ============================================================
           0. 全局常量
           ============================================================ */
        const COPY_SUFFIX = "\n\n来自：我的世界拾光阁服务器 - 服务器地址：mcsgg.top - 版本：Java 26.3 - 离线可进";

        /* ============================================================
           1. 入场虚化（动画结束后移除节点，避免常驻 backdrop-filter）
           ============================================================ */
        (function initEnterVeil() {
            const veil = document.querySelector(".enter-veil");
            if (!veil) return;
            let fallbackTimer = 0;
            let started = false;
            const remove = () => {
                if (fallbackTimer) clearTimeout(fallbackTimer);
                veil.removeEventListener("animationend", onEnd);
                veil.remove();
            };
            const onEnd = (event) => {
                if (event.target === veil && event.animationName === "enterVeil") remove();
            };
            fallbackTimer = window.setTimeout(remove, 1800);
            const start = () => {
                if (started || !veil.isConnected) return;
                clearTimeout(fallbackTimer);
                started = true;
                requestAnimationFrame(() => requestAnimationFrame(() => {
                    if (!veil.isConnected) return;
                    veil.addEventListener("animationend", onEnd);
                    veil.classList.add("is-running");
                    fallbackTimer = window.setTimeout(remove, 1100);
                }));
            };
            if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) {
                remove();
            } else if (document.readyState === "complete") {
                start();
            } else {
                window.addEventListener("load", start, { once: true });
            }
        })();

        /* ============================================================
           2. 全站复制拦截：任何 copy 事件都追加服务器后缀
           ============================================================ */
        (function initGlobalCopySuffix() {
            document.addEventListener("copy", function (e) {
                let text = "";
                try {
                    const sel = document.getSelection();
                    if (sel) text = sel.toString();
                } catch (err) {}
                if (!text) {
                    try {
                        text = (e.clipboardData && e.clipboardData.getData("text/plain")) || "";
                    } catch (err) {}
                }
                if (!text) return;
                if (text.indexOf("来自：我的世界拾光阁服务器") !== -1) return;

                if (e.clipboardData) {
                    e.clipboardData.setData("text/plain", text + COPY_SUFFIX);
                    e.preventDefault();
                } else if (window.clipboardData) {
                    window.clipboardData.setData("Text", text + COPY_SUFFIX);
                    e.returnValue = false;
                }
            });
        })();

        /* ============================================================
           3. 多 Toast 堆叠（3 秒自动消失，动画结束移除节点）
           ============================================================ */
        (function initToast() {
            const stack = document.getElementById("toastStack");
            if (!stack) return;
            const MAX = 4;
            const TOAST_LIFETIME = 2700;

            window.showToast = function (message) {
                const msg = String(message || "").trim();
                if (!msg) return;
                while (stack.children.length >= MAX) {
                    const oldest = stack.firstElementChild;
                    if (!oldest) break;
                    if (oldest._toastTimer) clearTimeout(oldest._toastTimer);
                    oldest.remove();
                }

                const toast = document.createElement("div");
                toast.className = "toast";
                toast.textContent = msg;
                toast.setAttribute("role", "status");
                stack.appendChild(toast);

                let removed = false;
                const cleanup = () => {
                    if (removed) return;
                    removed = true;
                    if (toast._toastTimer) clearTimeout(toast._toastTimer);
                    toast.removeEventListener("animationend", onAnimationEnd);
                    toast.remove();
                };
                const onAnimationEnd = (event) => {
                    if (event.target === toast && event.animationName === "toastCycle") cleanup();
                };
                toast.addEventListener("animationend", onAnimationEnd);
                toast._toastTimer = window.setTimeout(cleanup, TOAST_LIFETIME + 250);
            };
        })();

        /* ============================================================
           4. 流光线高度同步
           ============================================================ */
        (function initFlowHeights() {
            const columns = Array.from(document.querySelectorAll(".columns-wrapper > .column"));
            if (!columns.length) return;

            let syncRaf = 0;
            function sync() {
                for (let i = 0; i < columns.length; i++) {
                    columns[i].style.setProperty("--flow-h", (columns[i].offsetHeight + 96) + "px");
                }
            }
            function scheduleSync() {
                if (syncRaf) return;
                syncRaf = requestAnimationFrame(() => {
                    syncRaf = 0;
                    sync();
                });
            }

            requestAnimationFrame(sync);

            if ("ResizeObserver" in window) {
                const ro = new ResizeObserver(scheduleSync);
                columns.forEach(c => ro.observe(c));
            } else {
                window.addEventListener("resize", scheduleSync);
            }
            if (document.fonts && document.fonts.ready) {
                document.fonts.ready.then(scheduleSync).catch(() => {});
            }
        })();

        /* ============================================================
           5. 三态主题开关（含 Toast 提示）
           ============================================================ */
        (function initThemeSwitcher() {
            const switcher = document.getElementById("themeSwitcher");
            const track = document.getElementById("themeTrack");
            const thumb = document.getElementById("themeThumb");
            const options = track.querySelectorAll(".theme-option");
            const modes = ["light", "system", "dark"];
            const STORAGE_KEY = "huatuo-theme-mode";
            const root = document.documentElement;

            const DRAG_THRESHOLD = 8;

            const toastText = {
                light: "已切换到浅色模式",
                system: "已跟随系统外观",
                dark: "已切换到深色模式"
            };

            let currentMode = "system";
            let dragging = false;
            let moved = false;
            let startX = 0;
            let startOffset = 0;
            let currentOffset = 0;
            let activePointerId = null;
            let cachedSegW = 40;
            let cachedBorderLeft = 0;
            let moveRaf = 0;
            let pendingOffset = 0;

            function measure() {
                const cs = getComputedStyle(track);
                cachedBorderLeft = parseFloat(cs.borderLeftWidth) || 0;
                const innerW = track.clientWidth;
                cachedSegW = innerW > 6 ? (innerW - 6) / 3 : 40;
            }

            function indexFromClientX(clientX) {
                const rect = track.getBoundingClientRect();
                const u = clientX - rect.left - cachedBorderLeft;
                const idx = Math.floor((u - 3) / (cachedSegW || 1));
                return Math.max(0, Math.min(2, idx));
            }

            function setThumb(offset, animate) {
                currentOffset = offset;
                thumb.classList.toggle("no-transition", !animate);
                thumb.style.transform = "translate3d(" + offset + "px,0,0)";
                if (!animate) requestAnimationFrame(() => thumb.classList.remove("no-transition"));
            }

            function systemPrefersDark() {
                try {
                    return window.matchMedia("(prefers-color-scheme: dark)").matches;
                } catch (e) {
                    return false;
                }
            }

            function resolveTheme(mode) {
                if (mode === "system") {
                    return systemPrefersDark() ? "dark" : "light";
                }
                return mode;
            }

            function applyMode(mode, persist) {
                currentMode = mode;

                const animateChange = !!persist;
                if (!animateChange) root.classList.add("theme-anim-off");
                root.setAttribute("data-theme", resolveTheme(mode));
                track.dataset.active = mode;
                setThumb(modes.indexOf(mode) * cachedSegW, animateChange);
                options.forEach(el => {
                    el.setAttribute("aria-checked", el.dataset.mode === mode ? "true" : "false");
                });
                if (!animateChange) requestAnimationFrame(() => root.classList.remove("theme-anim-off"));

                if (persist) {
                    try { localStorage.setItem(STORAGE_KEY, mode); } catch (e) {}
                    if (typeof window.showToast === "function") {
                        window.showToast(toastText[mode] || "已切换主题");
                    }
                }
            }

            let saved = null;
            try { saved = localStorage.getItem(STORAGE_KEY); } catch (e) {}
            if (!saved || !modes.includes(saved)) saved = "system";

            requestAnimationFrame(() => {
                measure();
                applyMode(saved, false);
            });

            const darkMQ = window.matchMedia("(prefers-color-scheme: dark)");
            function onSystemThemeChange() {
                if (currentMode === "system") applyMode("system", false);
            }
            if (typeof darkMQ.addEventListener === "function") {
                darkMQ.addEventListener("change", onSystemThemeChange);
            } else if (typeof darkMQ.addListener === "function") {
                darkMQ.addListener(onSystemThemeChange);
            }

            track.addEventListener("pointerdown", (e) => {
                if (e.button > 0) return;
                e.preventDefault();

                dragging = true;
                moved = false;
                startX = e.clientX;
                measure();
                startOffset = currentOffset;
                activePointerId = e.pointerId;

                try { track.setPointerCapture(e.pointerId); } catch (err) {}
            });

            track.addEventListener("pointermove", (e) => {
                if (!dragging || e.pointerId !== activePointerId) return;

                const dx = e.clientX - startX;
                if (!moved && Math.abs(dx) > DRAG_THRESHOLD) {
                    moved = true;
                    switcher.classList.add("dragging");
                }
                if (!moved) return;

                const offset = Math.max(0, Math.min(cachedSegW * 2, startOffset + dx));
                pendingOffset = offset;

                if (!moveRaf) {
                    moveRaf = requestAnimationFrame(() => {
                        moveRaf = 0;
                        setThumb(pendingOffset, false);
                    });
                }
            });

            function endDrag(e, cancelled) {
                if (!dragging || e.pointerId !== activePointerId) return;

                dragging = false;
                try { track.releasePointerCapture(e.pointerId); } catch (err) {}
                activePointerId = null;
                switcher.classList.remove("dragging");

                if (moveRaf) {
                    cancelAnimationFrame(moveRaf);
                    moveRaf = 0;
                    setThumb(pendingOffset, false);
                }

                let targetIdx;
                if (cancelled) {
                    setThumb(startOffset, true);
                    moved = false;
                    return;
                } else if (moved) {
                    targetIdx = Math.round(currentOffset / (cachedSegW || 1));
                } else {
                    targetIdx = indexFromClientX(e.clientX);
                }

                targetIdx = Math.max(0, Math.min(2, targetIdx));
                applyMode(modes[targetIdx], true);
                moved = false;
            }

            track.addEventListener("pointerup", (e) => endDrag(e, false));
            track.addEventListener("pointercancel", (e) => endDrag(e, true));

            switcher.addEventListener("keydown", (e) => {
                if (e.key === "ArrowLeft" || e.key === "ArrowRight") {
                    e.preventDefault();
                    let idx = modes.indexOf(currentMode);
                    idx += e.key === "ArrowRight" ? 1 : -1;
                    idx = Math.max(0, Math.min(2, idx));
                    applyMode(modes[idx], true);
                }
            });

            let resizeRaf = 0;
            window.addEventListener("resize", () => {
                if (resizeRaf) return;
                resizeRaf = requestAnimationFrame(() => {
                    resizeRaf = 0;
                    measure();
                    setThumb(modes.indexOf(currentMode) * cachedSegW, false);
                });
            });
        })();

        /* ============================================================
           7. 顶部磨砂（滚动越过标题时激活）
           ============================================================ */
        (function initTopScrim() {
            const scrim = document.getElementById("topScrim");
            const header = document.getElementById("boardHeader");
            if (!scrim || !header) return;

            let raf = 0;
            let active = false;

            function update() {
                raf = 0;
                const rect = header.getBoundingClientRect();
                const shouldShow = rect.bottom < 96;
                if (shouldShow !== active) {
                    active = shouldShow;
                    scrim.classList.toggle("active", active);
                }
            }

            function schedule() {
                if (!raf) raf = requestAnimationFrame(update);
            }

            window.addEventListener("scroll", schedule, { passive: true });
            window.addEventListener("resize", schedule, { passive: true });
            update();
        })();

        /* ============================================================
           8. 水波纹 + 弹窗 + 复制按钮
           ============================================================ */
        (function initInteractions() {
            const items = Array.from(document.querySelectorAll(".record-item"));
            const total = items.length;
            const modalOverlay = document.getElementById("modalOverlay");
            const modalContent = document.getElementById("modalContent");
            const closeBtn = document.getElementById("closeBtn");
            const boardWrapper = document.getElementById("boardWrapper");
            const themeSwitcher = document.getElementById("themeSwitcher");

            let reduceMotion = false;
            try {
                reduceMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
            } catch (e) {}

            let lastFocus = null;

            function setBackgroundInert(on) {
                [boardWrapper, themeSwitcher].forEach(el => {
                    if (!el) return;
                    try {
                        if (on) el.setAttribute("inert", "");
                        else el.removeAttribute("inert");
                    } catch (e) {}
                });
            }

            function openModal(sourceEl, index) {
                if (!sourceEl || modalOverlay.classList.contains("active")) return;
                const snapshotHTML = sourceEl.innerHTML;

                const rect = sourceEl.getBoundingClientRect();
                const x = (sourceEl._lastClickX ?? rect.left + rect.width / 2) - rect.left;
                const y = (sourceEl._lastClickY ?? rect.top + rect.height / 2) - rect.top;

                if (!reduceMotion) {
                    const ripple = document.createElement("span");
                    ripple.className = "ripple";
                    const size = Math.max(rect.width, rect.height) * 2;
                    ripple.style.width = ripple.style.height = size + "px";
                    ripple.style.left = (x - size / 2) + "px";
                    ripple.style.top = (y - size / 2) + "px";
                    sourceEl.appendChild(ripple);
                    ripple.addEventListener("animationend", () => {
                        if (ripple.parentNode) ripple.parentNode.removeChild(ripple);
                    }, { once: true });
                }

                modalContent.innerHTML = snapshotHTML;
                if (sourceEl.classList.contains("danger")) {
                    modalContent.classList.add("danger");
                } else {
                    modalContent.classList.remove("danger");
                }

                const actions = document.createElement("div");
                actions.className = "modal-actions";

                const idx = document.createElement("span");
                idx.className = "modal-index";
                idx.textContent = "第 " + index + " 条 / 共 " + total + " 条";

                const copyBtn = document.createElement("button");
                copyBtn.type = "button";
                copyBtn.className = "modal-copy";
                copyBtn.textContent = "复制内容";

                copyBtn.addEventListener("click", () => {
                    if (!reduceMotion && typeof copyBtn.animate === "function") {
                        copyBtn.animate(
                            [
                                { transform: "scale(1)" },
                                { transform: "scale(.96)", offset: .35 },
                                { transform: "scale(1.025)", offset: .68 },
                                { transform: "scale(1)" }
                            ],
                            { duration: 260, easing: "cubic-bezier(.22,.68,0,1)" }
                        );
                    }
                    copyText(sourceEl.innerText, copyBtn);
                });

                actions.appendChild(idx);
                actions.appendChild(copyBtn);
                modalContent.appendChild(actions);

                modalContent.classList.remove("no-scroll");
                modalContent.scrollTop = 0;
                modalContent.scrollLeft = 0;

                lastFocus = document.activeElement;
                modalOverlay.removeAttribute("aria-hidden");
                setBackgroundInert(true);
                document.body.classList.add("modal-open");
                modalOverlay.classList.add("active");
                requestAnimationFrame(() => {
                    if (!modalOverlay.classList.contains("active")) return;
                    modalContent.classList.toggle("no-scroll", modalContent.scrollHeight <= modalContent.clientHeight + 1);
                    closeBtn.focus({ preventScroll: true });
                });
            }

            function closeModal() {
                if (!modalOverlay.classList.contains("active")) return;
                modalOverlay.classList.remove("active");
                modalOverlay.setAttribute("aria-hidden", "true");
                document.body.classList.remove("modal-open");
                setBackgroundInert(false);
                if (lastFocus && typeof lastFocus.focus === "function") {
                    lastFocus.focus({ preventScroll: true });
                }
                lastFocus = null;
            }

            const itemOrder = new Map(items.map((item, index) => [item, index + 1]));
            const interactionRoot = boardWrapper || document;
            interactionRoot.addEventListener("click", (e) => {
                const item = e.target.closest ? e.target.closest(".record-item") : null;
                if (!item || !itemOrder.has(item) || e.button !== 0) return;
                item._lastClickX = e.clientX;
                item._lastClickY = e.clientY;
                openModal(item, itemOrder.get(item));
            });
            interactionRoot.addEventListener("keydown", (e) => {
                if (e.key !== "Enter" && e.key !== " ") return;
                const item = e.target.closest ? e.target.closest(".record-item") : null;
                if (!item || !itemOrder.has(item)) return;
                e.preventDefault();
                openModal(item, itemOrder.get(item));
            });

            modalOverlay.addEventListener("click", (e) => {
                if (e.target === modalOverlay) closeModal();
            });

            closeBtn.addEventListener("click", closeModal);

            document.addEventListener("keydown", (e) => {
                if (e.key === "Escape" && modalOverlay.classList.contains("active")) {
                    closeModal();
                }
            });

            modalOverlay.addEventListener("keydown", (e) => {
                if (e.key !== "Tab" || !modalOverlay.classList.contains("active")) return;
                const focusables = modalOverlay.querySelectorAll("button");
                if (!focusables.length) return;
                const first = focusables[0];
                const last = focusables[focusables.length - 1];
                if (e.shiftKey && document.activeElement === first) {
                    e.preventDefault();
                    last.focus();
                } else if (!e.shiftKey && document.activeElement === last) {
                    e.preventDefault();
                    first.focus();
                }
            });

            async function copyText(text, btn) {
                const payload = text + COPY_SUFFIX;
                let ok = false;
                try {
                    if (navigator.clipboard && navigator.clipboard.writeText) {
                        await navigator.clipboard.writeText(payload);
                        ok = true;
                    } else {
                        ok = fallbackCopySync(payload);
                    }
                } catch (e) {
                    ok = fallbackCopySync(payload);
                }

                btn.textContent = ok ? "已复制 ✓" : "复制失败";
                btn.classList.toggle("copied", ok);
                if (typeof window.showToast === "function") {
                    window.showToast(ok ? "已复制到剪贴板" : "复制失败，请手动选择");
                }
                if (btn._copyResetTimer) clearTimeout(btn._copyResetTimer);
                btn._copyResetTimer = window.setTimeout(() => {
                    btn.textContent = "复制内容";
                    btn.classList.remove("copied");
                    btn._copyResetTimer = 0;
                }, 1400);
            }

            function fallbackCopySync(text) {
                const ta = document.createElement("textarea");
                ta.value = text;
                ta.setAttribute("readonly", "");
                ta.style.position = "fixed";
                ta.style.top = "-999px";
                ta.style.opacity = "0";
                document.body.appendChild(ta);
                ta.select();
                let ok = false;
                try { ok = document.execCommand("copy"); } catch (e) { ok = false; }
                document.body.removeChild(ta);
                return ok;
            }
        })();
    