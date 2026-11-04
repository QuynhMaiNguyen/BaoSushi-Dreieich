(() => {
  "use strict";

  const root = document.querySelector("[data-menucard]");
  const data = window.BAO_MENU;
  if (!root || !data || !Array.isArray(data.tabs)) return;

  const tabsEl = root.querySelector("[data-menu-tabs]");
  const pagesEl = root.querySelector("[data-menu-pages]");
  const prevButton = root.querySelector("[data-menu-prev]");
  const nextButton = root.querySelector("[data-menu-next]");
  const statusEl = root.querySelector("[data-menu-status]");

  if (!tabsEl || !pagesEl || !prevButton || !nextButton) return;

  /* Flatten the tab/page structure so the arrows can walk every page. */
  const pages = [];
  data.tabs.forEach((tab, tabIndex) => {
    tab.pages.forEach((page, pageIndex) => {
      pages.push({
        title: page.title,
        columns: page.columns,
        tabIndex,
        pageIndex,
        pageCount: tab.pages.length,
      });
    });
  });
  if (!pages.length) return;

  const tabButtons = [];
  const pageNodes = [];
  let current = 0;

  const make = (tag, className, text) => {
    const node = document.createElement(tag);
    if (className) node.className = className;
    if (text !== undefined) node.textContent = text;
    return node;
  };

  /* Allergen and additive codes as a superscript, like in the printed menu. */
  const appendAllergens = (node, codes) => {
    if (!codes) return;
    const sup = make("sup", "menucard__allergens", codes);
    sup.title = `Allergene und Zusatzstoffe: ${codes}`;
    node.append(" ", sup);
  };

  /* Tabs ----------------------------------------------------------------- */
  data.tabs.forEach((tab, tabIndex) => {
    const firstPage = pages.findIndex((page) => page.tabIndex === tabIndex);
    const button = make("button", "menucard__tab", tab.label);
    button.type = "button";
    button.id = `menu-tab-${tabIndex}`;
    button.setAttribute("role", "tab");
    button.setAttribute("aria-selected", "false");
    button.setAttribute("aria-controls", `menu-page-${firstPage}`);
    button.tabIndex = -1;
    button.addEventListener("click", () => activate(firstPage));
    tabsEl.appendChild(button);
    tabButtons.push(button);
  });

  /* Pages ---------------------------------------------------------------- */
  pages.forEach((page, index) => {
    const section = make("section", "menucard__page");
    section.id = `menu-page-${index}`;
    section.setAttribute("role", "tabpanel");
    section.setAttribute("aria-labelledby", `menu-tab-${page.tabIndex}`);
    section.hidden = true;

    const heading = make("h2", "menucard__page-title visually-hidden", page.title);

    const columns = make("div", "menucard__columns");
    page.columns.forEach((groups) => {
      const column = make("div", "menucard__column");
      groups.forEach((group) => {
        const groupEl = make("div", "menucard__group");
        const title = make("h3", "", group.title);
        if (!group.desc) appendAllergens(title, group.allergens);
        groupEl.appendChild(title);
        if (group.desc) {
          const desc = make("p", "menucard__desc", group.desc);
          appendAllergens(desc, group.allergens);
          groupEl.appendChild(desc);
        }

        const list = make("ul", "menucard__list");
        group.items.forEach((item) => {
          const li = make("li", "menucard__item");
          const row = make("div", "menucard__row");
          const name = make("span", "menucard__name", item.name);
          appendAllergens(name, item.allergens);
          row.appendChild(name);
          if (item.price) row.appendChild(make("span", "menucard__price", item.price));
          li.appendChild(row);
          if (item.sub || item.desc) {
            li.appendChild(make("span", "menucard__sub", item.sub || item.desc));
          }
          list.appendChild(li);
        });

        groupEl.appendChild(list);
        column.appendChild(groupEl);
      });
      columns.appendChild(column);
    });

    section.append(heading, columns);
    pagesEl.appendChild(section);
    pageNodes.push(section);
  });

  /* Behaviour ------------------------------------------------------------ */
  function activate(index, options = {}) {
    const next = Math.max(0, Math.min(pages.length - 1, index));
    current = next;
    const page = pages[next];

    pageNodes.forEach((node, nodeIndex) => {
      node.hidden = nodeIndex !== next;
    });

    tabButtons.forEach((button, tabIndex) => {
      const active = tabIndex === page.tabIndex;
      button.setAttribute("aria-selected", String(active));
      button.tabIndex = active ? 0 : -1;
      if (active) button.setAttribute("aria-controls", pageNodes[next].id);
    });

    prevButton.disabled = next === 0;
    nextButton.disabled = next === pages.length - 1;

    if (statusEl) {
      statusEl.textContent = `${page.title}, Seite ${page.pageIndex + 1} von ${page.pageCount}`;
    }

    const activeTab = tabButtons[page.tabIndex];
    if (activeTab) {
      const tabBox = activeTab.getBoundingClientRect();
      const listBox = tabsEl.getBoundingClientRect();
      if (tabBox.left < listBox.left) {
        tabsEl.scrollBy({ left: tabBox.left - listBox.left, behavior: "smooth" });
      } else if (tabBox.right > listBox.right) {
        tabsEl.scrollBy({ left: tabBox.right - listBox.right, behavior: "smooth" });
      }
      if (options.focusTab) activeTab.focus();
    }
  }

  prevButton.addEventListener("click", () => activate(current - 1));
  nextButton.addEventListener("click", () => activate(current + 1));

  /* Touch swipe paging (mobile) ------------------------------------------ */
  const SWIPE_THRESHOLD = 48;
  let swipeStart = null;

  pagesEl.addEventListener("pointerdown", (event) => {
    if (event.pointerType === "mouse") return;
    swipeStart = { x: event.clientX, y: event.clientY };
  });

  pagesEl.addEventListener("pointerup", (event) => {
    if (!swipeStart || event.pointerType === "mouse") return;

    const dx = event.clientX - swipeStart.x;
    const dy = event.clientY - swipeStart.y;
    swipeStart = null;

    if (Math.abs(dx) < SWIPE_THRESHOLD) return;
    if (Math.abs(dx) <= Math.abs(dy) * 1.2) return;

    if (dx < 0) {
      activate(current + 1);
    } else {
      activate(current - 1);
    }
  });

  pagesEl.addEventListener("pointercancel", () => {
    swipeStart = null;
  });

  tabsEl.addEventListener("keydown", (event) => {
    if (!["ArrowLeft", "ArrowRight", "Home", "End"].includes(event.key)) return;
    event.preventDefault();

    const activeTab = pages[current].tabIndex;
    const lastTab = data.tabs.length - 1;
    let targetTab = activeTab;

    if (event.key === "ArrowLeft") targetTab = activeTab === 0 ? lastTab : activeTab - 1;
    if (event.key === "ArrowRight") targetTab = activeTab === lastTab ? 0 : activeTab + 1;
    if (event.key === "Home") targetTab = 0;
    if (event.key === "End") targetTab = lastTab;

    activate(pages.findIndex((page) => page.tabIndex === targetTab), { focusTab: true });
  });

  activate(0);
})();
