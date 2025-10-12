const ET_I18N = {
  ru: {
    title: "Библиотека вечных",
    subtitle: "Диалоги с великими умами в одном месте",
    search_placeholder: "Поиск по имени и описанию…",
    search_label: "Поиск",
    status_all: "Все",
    status_ready: "Готово",
    status_wip: "В разработке",
    status_label: "Статус",
    era_all: "Все эпохи",
    era_label: "Эпоха",
    domain_all: "Все сферы",
    domain_label: "Сфера",
    found: (n) => `Найдено: ${n}`,
    empty: "Ничего не найдено. Сбросьте фильтры или измените запрос."
  },
  en: {
    title: "Library of the Eternals",
    subtitle: "Dialogues with great minds in one place",
    search_placeholder: "Search by name and description…",
    search_label: "Search",
    status_all: "All",
    status_ready: "Ready",
    status_wip: "In progress",
    status_label: "Status",
    era_all: "All eras",
    era_label: "Era",
    domain_all: "All domains",
    domain_label: "Domain",
    found: (n) => `Found: ${n}`,
    empty: "Nothing found. Reset filters or adjust your query."
  }
};

if (typeof window !== "undefined") {
  window.ET_I18N = ET_I18N;
}

export default ET_I18N;
