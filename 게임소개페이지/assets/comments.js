// 아크파이어 위키 — 커뮤니티 댓글/게시판 (giscus · GitHub Discussions 기반, 무료)
// 페이지 안의 .giscus-thread 마다 giscus 를 붙인다.
//   data-term 이 있으면 그 제목의 토론 1개에 고정(specific), 없으면 페이지 경로별 스레드(pathname).
//   data-category: Announcements | General | Ideas | Q&A | Polls | Show and tell (기본 General)
(function () {
  "use strict";

  var REPO = "EOMIKJIN/arcfire-wiki";
  var REPO_ID = "R_kgDOU76Y0w";
  var CATEGORY_IDS = {
    "Announcements": "DIC_kwDOU76Y084DHDlq",
    "General": "DIC_kwDOU76Y084DHDlr",
    "Ideas": "DIC_kwDOU76Y084DHDlt",
    "Polls": "DIC_kwDOU76Y084DHDlv",
    "Q&A": "DIC_kwDOU76Y084DHDls",
    "Show and tell": "DIC_kwDOU76Y084DHDlu",
  };

  function siteTheme() {
    var t = document.documentElement.getAttribute("data-theme");
    if (t === "dark" || t === "light") return t;
    return "preferred_color_scheme";
  }

  function mount(host) {
    if (location.protocol === "file:") {
      host.innerHTML = '<p class="comments-offline">댓글은 웹 주소(https://eomikjin.github.io/arcfire-wiki/)에서 열 때 보입니다.</p>';
      return;
    }
    var category = host.getAttribute("data-category") || "General";
    var term = host.getAttribute("data-term");
    var attrs = {
      "data-repo": REPO,
      "data-repo-id": REPO_ID,
      "data-category": category,
      "data-category-id": CATEGORY_IDS[category] || CATEGORY_IDS.General,
      "data-mapping": term ? "specific" : "pathname",
      "data-strict": "0",
      "data-reactions-enabled": "1",
      "data-emit-metadata": "0",
      "data-input-position": "top",
      "data-theme": siteTheme(),
      "data-lang": "ko",
      "data-loading": "lazy",
      "crossorigin": "anonymous",
    };
    if (term) attrs["data-term"] = term;
    var s = document.createElement("script");
    s.src = "https://giscus.app/client.js";
    s.async = true;
    for (var k in attrs) s.setAttribute(k, attrs[k]);
    host.appendChild(s);
  }

  var hosts = document.querySelectorAll(".giscus-thread");
  for (var i = 0; i < hosts.length; i += 1) mount(hosts[i]);

  // 위키 테마 토글 → giscus 테마 동기화
  if (window.MutationObserver) {
    new MutationObserver(function () {
      var frames = document.querySelectorAll("iframe.giscus-frame");
      for (var j = 0; j < frames.length; j += 1) {
        frames[j].contentWindow.postMessage({ giscus: { setConfig: { theme: siteTheme() } } }, "https://giscus.app");
      }
    }).observe(document.documentElement, { attributes: true, attributeFilter: ["data-theme"] });
  }
})();
