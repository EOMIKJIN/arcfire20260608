// 아크파이어 위키 — 전체 데이터 테이블 렌더러 (필터링 가능)
(function () {
  "use strict";

  function escapeHtml(s) {
    return String(s == null ? "" : s).replace(/[&<>"']/g, function (c) {
      return { "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c];
    });
  }

  function renderRow(row, columns) {
    return "<tr>" + columns.map(function (col) {
      var v = row[col.key];
      if (col.render) v = col.render(row);
      else v = escapeHtml(v);
      var cls = col.num ? ' class="num"' : "";
      return "<td" + cls + ">" + v + "</td>";
    }).join("") + "</tr>";
  }

  /**
   * opts: { mount: HTMLElement, data: array, columns: [{key,label,num,render}], searchKeys: [key,...], pageSize?: number, label?: string }
   */
  window.mountWikiDataTable = function (opts) {
    var mount = opts.mount;
    var data = opts.data || [];
    var columns = opts.columns;
    var searchKeys = opts.searchKeys || columns.map(function (c) { return c.key; });
    var pageSize = opts.pageSize || 40;
    var state = { q: "", page: 0 };

    var wrap = document.createElement("div");
    wrap.className = "dt-wrap";
    wrap.innerHTML =
      '<div class="dt-toolbar">' +
        '<div class="dt-search"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="11" cy="11" r="7"/><path d="m21 21-4.3-4.3"/></svg>' +
        '<input type="text" placeholder="이 표 안에서 검색…" /></div>' +
        '<div class="dt-count"></div>' +
      '</div>' +
      '<div class="table-wrap"><table><thead><tr>' +
        columns.map(function (c) { return '<th' + (c.num ? ' class="num"' : '') + '>' + escapeHtml(c.label) + '</th>'; }).join("") +
      '</tr></thead><tbody></tbody></table></div>' +
      '<div class="dt-pager"></div>';
    mount.appendChild(wrap);

    var input = wrap.querySelector(".dt-search input");
    var tbody = wrap.querySelector("tbody");
    var countEl = wrap.querySelector(".dt-count");
    var pagerEl = wrap.querySelector(".dt-pager");

    function filtered() {
      if (!state.q) return data;
      var q = state.q.toLowerCase();
      return data.filter(function (row) {
        return searchKeys.some(function (k) {
          var v = row[k];
          return v != null && String(v).toLowerCase().indexOf(q) !== -1;
        });
      });
    }

    function render() {
      var list = filtered();
      var totalPages = Math.max(1, Math.ceil(list.length / pageSize));
      if (state.page >= totalPages) state.page = totalPages - 1;
      if (state.page < 0) state.page = 0;
      var start = state.page * pageSize;
      var pageRows = list.slice(start, start + pageSize);

      tbody.innerHTML = pageRows.length
        ? pageRows.map(function (row) { return renderRow(row, columns); }).join("")
        : '<tr><td colspan="' + columns.length + '" style="color:var(--text-faint);text-align:center;padding:20px;">결과 없음</td></tr>';

      countEl.textContent = (opts.label || "행") + " " + list.length + "개" + (data.length !== list.length ? " (전체 " + data.length + "개 중)" : "");

      if (totalPages > 1) {
        var parts = [];
        parts.push('<button type="button" data-act="prev"' + (state.page === 0 ? " disabled" : "") + '>이전</button>');
        parts.push('<span class="dt-page-label">' + (state.page + 1) + ' / ' + totalPages + '</span>');
        parts.push('<button type="button" data-act="next"' + (state.page >= totalPages - 1 ? " disabled" : "") + '>다음</button>');
        pagerEl.innerHTML = parts.join("");
        pagerEl.style.display = "flex";
      } else {
        pagerEl.innerHTML = "";
        pagerEl.style.display = "none";
      }
    }

    input.addEventListener("input", function () {
      state.q = input.value.trim();
      state.page = 0;
      render();
    });
    pagerEl.addEventListener("click", function (ev) {
      var btn = ev.target.closest("button[data-act]");
      if (!btn) return;
      if (btn.dataset.act === "prev") state.page -= 1;
      if (btn.dataset.act === "next") state.page += 1;
      render();
    });

    render();
  };
})();
