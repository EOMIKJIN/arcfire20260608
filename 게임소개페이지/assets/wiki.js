// 아크파이어 위키 — 공용 스크립트: 테마 토글 + 검색
(function () {
  "use strict";

  // ---- 테마 토글 ----
  var root = document.documentElement;
  var STORAGE_KEY = "arcfire-wiki-theme";

  function applyTheme(mode) {
    if (mode === "dark" || mode === "light") {
      root.setAttribute("data-theme", mode);
    } else {
      root.removeAttribute("data-theme");
    }
    updateToggleIcon(mode);
  }

  function currentSystemPrefersDark() {
    return window.matchMedia && window.matchMedia("(prefers-color-scheme: dark)").matches;
  }

  function updateToggleIcon(mode) {
    var btn = document.querySelector(".theme-toggle");
    if (!btn) return;
    var effectiveDark = mode === "dark" || (mode !== "light" && currentSystemPrefersDark());
    btn.innerHTML = effectiveDark
      ? '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="12" cy="12" r="4"/><path d="M12 2v2M12 20v2M4.9 4.9l1.4 1.4M17.7 17.7l1.4 1.4M2 12h2M20 12h2M4.9 19.1l1.4-1.4M17.7 6.3l1.4-1.4"/></svg>'
      : '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M21 12.8A9 9 0 1 1 11.2 3a7 7 0 0 0 9.8 9.8z"/></svg>';
    btn.setAttribute("aria-label", effectiveDark ? "라이트 모드로 전환" : "다크 모드로 전환");
  }

  try {
    var saved = localStorage.getItem(STORAGE_KEY);
    applyTheme(saved);
  } catch (e) {
    applyTheme(null);
  }

  document.addEventListener("click", function (ev) {
    var btn = ev.target.closest(".theme-toggle");
    if (!btn) return;
    var effectiveDark = root.getAttribute("data-theme") === "dark"
      || (!root.getAttribute("data-theme") && currentSystemPrefersDark());
    var next = effectiveDark ? "light" : "dark";
    try { localStorage.setItem(STORAGE_KEY, next); } catch (e) {}
    applyTheme(next);
  });

  // ---- 모바일 사이드바(드로어) ----
  function closeNav() { document.body.classList.remove("nav-open"); }
  document.addEventListener("click", function (ev) {
    if (ev.target.closest(".nav-toggle")) {
      document.body.classList.toggle("nav-open");
      return;
    }
    if (ev.target.closest(".sidebar-scrim")) { closeNav(); return; }
    if (ev.target.closest(".sidebar a")) { closeNav(); }
  });
  document.addEventListener("keydown", function (ev) {
    if (ev.key === "Escape") closeNav();
  });

  // ---- 사이드바 현재 위치 표시 ----
  var here = (document.body.getAttribute("data-page") || "").trim();
  if (here) {
    document.querySelectorAll(".sidebar-group a[data-page]").forEach(function (a) {
      if (a.getAttribute("data-page") === here) a.classList.add("active");
    });
  }

  // ---- 검색 ----
  var input = document.querySelector(".site-search input");
  var hitsBox = document.querySelector(".search-hits");
  if (input && hitsBox && window.WIKI_INDEX) {
    var idx = window.WIKI_INDEX;

    function render(list, q) {
      if (!list.length) {
        hitsBox.innerHTML = '<div class="empty">「' + q + '」에 대한 결과가 없습니다.</div>';
        hitsBox.classList.add("open");
        return;
      }
      hitsBox.innerHTML = list.slice(0, 12).map(function (item) {
        return '<a href="' + item.href + '">' + item.title
          + '<span class="hit-page">' + item.page + '</span></a>';
      }).join("");
      hitsBox.classList.add("open");
    }

    input.addEventListener("input", function () {
      var q = input.value.trim().toLowerCase();
      if (!q) { hitsBox.classList.remove("open"); return; }
      var list = idx.filter(function (item) {
        return item.title.toLowerCase().indexOf(q) !== -1
          || (item.tags && item.tags.toLowerCase().indexOf(q) !== -1);
      });
      render(list, input.value.trim());
    });

    document.addEventListener("click", function (ev) {
      if (!ev.target.closest(".site-search")) hitsBox.classList.remove("open");
    });
    input.addEventListener("keydown", function (ev) {
      if (ev.key === "Escape") { hitsBox.classList.remove("open"); input.blur(); }
    });
  }
})();
