(function () {
  const librarySection = document.getElementById("eternalsLibrary");
  if (!librarySection) {
    return;
  }

  const locale = location.pathname.startsWith("/en/") ? "en" : "ru";
  const fallbackLocale = "ru";
  const dictionaries = window.ET_I18N || {};
  const i18n = dictionaries[locale] || dictionaries[fallbackLocale] || {};
  const localeForSort = locale === "en" ? "en" : "ru";

  const titleEl = document.getElementById("et-title");
  const subtitleEl = document.getElementById("et-subtitle");
  const searchInput = document.getElementById("et-q");
  const statusSelect = document.getElementById("et-status");
  const eraSelect = document.getElementById("et-era");
  const domainSelect = document.getElementById("et-domain");
  const countEl = document.getElementById("et-count");
  const gridEl = document.getElementById("et-grid");
  const emptyEl = document.getElementById("et-empty");

  const foundFormatter = typeof i18n.found === "function" ? i18n.found : (n) => `${n}`;

  const setText = (el, value) => {
    if (el) {
      el.textContent = value;
    }
  };

  const updateCount = (n) => {
    setText(countEl, foundFormatter(n));
  };

  setText(titleEl, i18n.title || "");
  setText(subtitleEl, i18n.subtitle || "");
  if (librarySection && i18n.title) {
    librarySection.setAttribute("aria-label", i18n.title);
  }
  if (searchInput && i18n.search_placeholder) {
    searchInput.placeholder = i18n.search_placeholder;
  }
  if (searchInput && i18n.search_label) {
    searchInput.setAttribute("aria-label", i18n.search_label);
  }
  if (statusSelect) {
    const options = statusSelect.querySelectorAll("option");
    if (options.length >= 3) {
      setText(options[0], i18n.status_all || "");
      setText(options[1], i18n.status_ready || "");
      setText(options[2], i18n.status_wip || "");
    }
    if (i18n.status_label) {
      statusSelect.setAttribute("aria-label", i18n.status_label);
    }
    statusSelect.value = "ready";
  }
  if (eraSelect) {
    const option = eraSelect.querySelector("option");
    if (option) {
      setText(option, i18n.era_all || "");
    }
    if (i18n.era_label) {
      eraSelect.setAttribute("aria-label", i18n.era_label);
    }
  }
  if (domainSelect) {
    const option = domainSelect.querySelector("option");
    if (option) {
      setText(option, i18n.domain_all || "");
    }
    if (i18n.domain_label) {
      domainSelect.setAttribute("aria-label", i18n.domain_label);
    }
  }
  if (emptyEl) {
    setText(emptyEl, i18n.empty || "");
  }
  updateCount(0);

  let records = [];

  const getLocalized = (value) => {
    if (value == null) {
      return "";
    }

    if (typeof value === "string") {
      return value;
    }

    if (typeof value === "object") {
      return value[locale] ?? value[fallbackLocale] ?? value.en ?? value.ru ?? "";
    }

    return String(value);
  };

  const normalizeTags = (input) => {
    if (!Array.isArray(input)) {
      return [];
    }

    return input
      .map((tag) => {
        if (typeof tag === "string") {
          return tag;
        }

        if (tag && typeof tag === "object") {
          return tag[locale] ?? tag[fallbackLocale] ?? tag.en ?? tag.ru ?? "";
        }

        return "";
      })
      .filter((tag) => tag && typeof tag === "string");
  };

  const normalizeRecord = (rec) => {
    const name = getLocalized(rec.name);
    const desc = getLocalized(rec.desc);
    const era = getLocalized(rec.era);
    const domain = getLocalized(rec.domain);
    const rawUrl = rec.url && typeof rec.url === "object"
      ? rec.url[locale] ?? rec.url[fallbackLocale] ?? rec.url.en ?? rec.url.ru ?? null
      : null;
    const urlValue = typeof rawUrl === "string" && rawUrl.trim() === "" ? null : rawUrl;
    const tags = normalizeTags(rec.tags);
    const status = rec.status === "ready" ? "ready" : "wip";

    return {
      name,
      desc,
      era,
      domain,
      url: urlValue,
      tags,
      status,
      slug: rec.slug || "",
      cover: typeof rec.cover === "string" ? rec.cover : "",
      searchText: `${name} ${desc}`.toLowerCase()
    };
  };

  const renderSelectOptions = (selectEl, values) => {
    if (!selectEl) {
      return;
    }

    while (selectEl.options.length > 1) {
      selectEl.remove(1);
    }

    values.forEach((value) => {
      const option = document.createElement("option");
      option.value = value;
      option.textContent = value;
      selectEl.appendChild(option);
    });
  };

  const statusSortWeight = { ready: 0, wip: 1 };

  const renderCards = (items) => {
    if (!gridEl) {
      return;
    }

    gridEl.innerHTML = "";

    items.forEach((item) => {
      const isReady = item.status === "ready" && item.url;
      const card = document.createElement(isReady ? "a" : "article");
      card.className = "et-card";
      card.dataset.status = item.status;
      if (isReady) {
        card.classList.add("et-card--ready");
      }
      card.setAttribute("role", "listitem");
      if (item.slug) {
        card.id = item.slug;
      }

      if (isReady) {
        card.href = item.url;
        card.target = "_blank";
        card.rel = "noopener noreferrer";
      } else {
        card.classList.add("et-card--inactive");
        card.setAttribute("aria-disabled", "true");
      }

      const media = document.createElement("div");
      media.className = "et-card__media";
      if (item.cover) {
        const img = document.createElement("img");
        img.src = item.cover;
        img.alt = item.name || "";
        img.loading = "lazy";
        media.appendChild(img);
      }
      card.appendChild(media);

      const body = document.createElement("div");
      body.className = "et-card__body";

      const badge = document.createElement("span");
      badge.className = `et-badge et-badge--${item.status}`;
      badge.textContent = item.status === "ready" ? (i18n.status_ready || "") : (i18n.status_wip || "");
      body.appendChild(badge);

      const heading = document.createElement("h3");
      heading.textContent = item.name;
      body.appendChild(heading);

      if (item.era || item.domain) {
        const meta = document.createElement("p");
        meta.className = "et-card__meta";
        meta.textContent = [item.era, item.domain].filter(Boolean).join(" · ");
        body.appendChild(meta);
      }

      if (item.desc) {
        const desc = document.createElement("p");
        desc.className = "et-card__desc";
        desc.textContent = item.desc;
        body.appendChild(desc);
      }

      if (item.tags.length > 0) {
        const tagsList = document.createElement("ul");
        tagsList.className = "et-card__tags";
        item.tags.forEach((tag) => {
          const li = document.createElement("li");
          li.textContent = tag;
          tagsList.appendChild(li);
        });
        body.appendChild(tagsList);
      }

      card.appendChild(body);
      gridEl.appendChild(card);
    });
  };

  const updateEmptyState = (isEmpty) => {
    if (!emptyEl) {
      return;
    }

    emptyEl.hidden = !isEmpty;
  };

  const applyFilters = () => {
    const query = searchInput ? searchInput.value.trim().toLowerCase() : "";
    const statusValue = statusSelect ? statusSelect.value : "__all__";
    const eraValue = eraSelect ? eraSelect.value : "";
    const domainValue = domainSelect ? domainSelect.value : "";

    const filtered = records.filter((item) => {
      if (statusValue !== "__all__" && item.status !== statusValue) {
        return false;
      }

      if (statusValue === "ready" && !item.url) {
        return false;
      }

      if (eraValue && item.era !== eraValue) {
        return false;
      }

      if (domainValue && item.domain !== domainValue) {
        return false;
      }

      if (query && !item.searchText.includes(query)) {
        return false;
      }

      return true;
    });

    renderCards(filtered);
    updateCount(filtered.length);
    updateEmptyState(filtered.length === 0);
  };

  const onFilterChange = () => {
    applyFilters();
  };

  if (searchInput) {
    searchInput.addEventListener("input", onFilterChange);
  }
  if (statusSelect) {
    statusSelect.addEventListener("change", onFilterChange);
  }
  if (eraSelect) {
    eraSelect.addEventListener("change", onFilterChange);
  }
  if (domainSelect) {
    domainSelect.addEventListener("change", onFilterChange);
  }

  const hydrateFilters = () => {
    const eras = Array.from(
      new Set(records.filter((item) => item.era).map((item) => item.era))
    ).sort((a, b) => a.localeCompare(b, localeForSort, { sensitivity: "base" }));

    const domains = Array.from(
      new Set(records.filter((item) => item.domain).map((item) => item.domain))
    ).sort((a, b) => a.localeCompare(b, localeForSort, { sensitivity: "base" }));

    renderSelectOptions(eraSelect, eras);
    renderSelectOptions(domainSelect, domains);
  };

  const loadData = async () => {
    try {
      const response = await fetch("/assets/data/evera_eternals.json", { credentials: "same-origin" });
      if (!response.ok) {
        throw new Error(`Failed to load eternals dataset: ${response.status}`);
      }

      const payload = await response.json();
      const list = Array.isArray(payload) ? payload : [];

      records = list.map(normalizeRecord).sort((a, b) => {
        const statusDiff = (statusSortWeight[a.status] ?? 1) - (statusSortWeight[b.status] ?? 1);
        if (statusDiff !== 0) {
          return statusDiff;
        }

        return a.name.localeCompare(b.name, localeForSort, { sensitivity: "base" });
      });

      hydrateFilters();
      applyFilters();
    } catch (error) {
      console.error(error);
      records = [];
      renderCards(records);
      updateCount(0);
      updateEmptyState(true);
    }
  };

  loadData();
})();
