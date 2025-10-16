#!/usr/bin/env node
'use strict';

const fs = require('fs');
const path = require('path');

const ROOT_DIR = path.resolve(__dirname, '..');
const DATA_PATH = path.join(ROOT_DIR, 'data', 'evera_sources.csv');
const PARTIALS_DIR = path.join(ROOT_DIR, 'templates', 'partials');
const BASE_URL = 'https://evera.world/';
const LOGO_VERSION = '20240401';

const LANG_CONFIG = {
  ru: {
    partial: path.join(PARTIALS_DIR, 'sources-logos.ru.html'),
    page: path.join(ROOT_DIR, 'pages', 'methodology.html'),
    h2: 'Академические и технологические источники Evera',
    intro: [
      'Evera объединяет академические источники, культурные архивы и автономный вычислительный контур, чтобы создавать цифровую реконструкцию личности и поддерживать библиотеку «Вечных».',
      'Эти университеты и платформы формируют методологию Evera и тестовую среду OpenAI до переноса моделей в собственный защищённый контур.'
    ],
    categories: {
      academic: {
        id: 'sources-academic',
        heading: 'Академические учреждения',
        description: 'Академические партнёры делятся архивами, корпусами и комментариями, которые подтверждают каждую цифровую реконструкцию личности. Их эксперты помогают сохранять библиотеку «Вечных» проверяемой и этически устойчивой.'
      },
      tech: {
        id: 'sources-tech',
        heading: 'Технологические платформы',
        description: 'Технологические компании поставляют вычислительные мощности, безопасные LLM и инструменты развёртывания. OpenAI служит тестовой средой до переноса моделей в автономный контур Evera.'
      }
    },
    nav: [
      { href: '/pages/eternals.html', label: 'Библиотека «Вечных»' },
      { href: '/pages/about.html#ethics-trilemma', label: 'Этика и безопасность' },
      { href: '/index.html#how', label: 'Как это работает' },
      { href: '/pages/book.html', label: 'Книга Жизни' },
      { href: '/pages/b2b.html', label: 'Для бизнеса' }
    ],
    closing: {
      paragraphs: [
        'Evera благодарит эти университеты, исследовательские институты и технологические компании за открытые архивы, публикации и инструменты, которые делают возможной цифровую реконструкцию человеческого разума.',
        'Evera соединяет академическую строгость и вычислительную точность — чтобы сохранить память, разум и культуру человечества.'
      ],
      small: 'Все логотипы принадлежат их владельцам и приведены исключительно в образовательных целях.'
    }
  },
  en: {
    partial: path.join(PARTIALS_DIR, 'sources-logos.en.html'),
    page: path.join(ROOT_DIR, 'en', 'pages', 'methodology.html'),
    h2: 'Academic and Technological Sources of Evera',
    intro: [
      'Evera aligns digital person reconstruction with the Library of the Eternals, uniting peer-reviewed knowledge and an autonomous compute stack.',
      'These partners anchor the Evera methodology and the OpenAI test environment before every model migrates into our sealed infrastructure.'
    ],
    categories: {
      academic: {
        id: 'sources-academic',
        heading: 'Academic institutions',
        description: 'Universities contribute archives, corpora, and philology that make each digital reconstruction verifiable. Their scholarship keeps the Library of the Eternals accountable and ethically grounded.'
      },
      tech: {
        id: 'sources-tech',
        heading: 'Technological platforms',
        description: 'Technology partners supply compute, safety-first LLMs, and deployment tooling. OpenAI remains the test environment before every model is transferred into Evera’s autonomous stack.'
      }
    },
    nav: [
      { href: '/en/pages/eternals.html', label: 'Library of the Eternals' },
      { href: '/en/pages/about.html#ethics-trilemma', label: 'Ethics & Safety' },
      { href: '/en/index.html#how', label: 'How it works' },
      { href: '/en/pages/book.html', label: 'Book of Life' },
      { href: '/en/pages/b2b.html', label: 'For business' }
    ],
    closing: {
      paragraphs: [
        'Evera acknowledges these institutions and companies for their contribution to open science, cultural preservation, and AI research.',
        'Evera unites academic rigor and computational precision — preserving the memory and mind of humanity.'
      ],
      small: 'All logos are property of their respective owners and displayed for educational purposes only.'
    }
  }
};

function readCsv(filePath) {
  const raw = fs.readFileSync(filePath, 'utf8');
  const lines = raw.split(/\r?\n/).filter((line) => line.trim().length > 0);
  if (lines.length === 0) {
    throw new Error('CSV file is empty.');
  }
  const header = parseCsvLine(lines[0]);
  return lines.slice(1).map((line, index) => {
    const values = parseCsvLine(line);
    if (values.length !== header.length) {
      throw new Error(`CSV row ${index + 2} has ${values.length} columns, expected ${header.length}.`);
    }
    return header.reduce((acc, key, i) => {
      acc[key] = values[i];
      return acc;
    }, {});
  });
}

function parseCsvLine(line) {
  const result = [];
  let current = '';
  let inQuotes = false;
  for (let i = 0; i < line.length; i += 1) {
    const char = line[i];
    if (char === '"') {
      if (inQuotes && line[i + 1] === '"') {
        current += '"';
        i += 1;
      } else {
        inQuotes = !inQuotes;
      }
    } else if (char === ',' && !inQuotes) {
      result.push(current);
      current = '';
    } else {
      current += char;
    }
  }
  result.push(current);
  return result.map((value) => value.replace(/\r/g, '').trim());
}

function escapeHtml(value) {
  return value
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;');
}

function escapeRegExp(value) {
  return value.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}

function escapeAttribute(value) {
  return escapeHtml(value).replace(/"/g, '&quot;');
}

function assertLogoAsset(record) {
  const logoPath = record.logo_path.replace(/^\//, '');
  const destination = path.join(ROOT_DIR, logoPath);
  if (!fs.existsSync(destination)) {
    throw new Error(`Logo asset missing for slug \"${record.slug}\" at ${destination}`);
  }
}

function buildInlineStyles() {
  return `<style data-critical="methodology-sources-grid">
  #sources .methodology-sources__grid {
    display: grid;
    grid-template-columns: repeat(6, minmax(0, 1fr));
    gap: clamp(16px, 2.5vw, 24px);
  }
  @media (max-width: 1024px) {
    #sources .methodology-sources__grid {
      grid-template-columns: repeat(3, minmax(0, 1fr));
    }
  }
  @media (max-width: 640px) {
    #sources .methodology-sources__grid {
      grid-template-columns: repeat(2, minmax(0, 1fr));
    }
  }
</style>`;
}

function buildNavHtml(nav, langKey) {
  if (!nav || !nav.length) {
    return '';
  }
  const label = langKey === 'en' ? 'Related Evera sections' : 'Связанные разделы методологии';
  const links = nav.map((item) => `          <a href="${item.href}">${escapeHtml(item.label)}</a>`).join('\n');
  return [
    `        <nav class="methodology-sources__links" aria-label="${escapeHtml(label)}">`,
    links,
    '        </nav>'
  ].join('\n');
}

function buildCategorySection(langKey, records, config) {
  const catConfig = config.categories;
  return ['academic', 'tech'].map((categoryKey) => {
    const cat = catConfig[categoryKey];
    const items = records.filter((item) => item.category === categoryKey);
    const listItems = items.map((item, index) => buildListItem(item, langKey, index + 1)).join('\n');
    return [
      `    <section class="methodology-sources__category" aria-labelledby="${cat.id}-${langKey}">`,
      '      <div class="methodology-sources__category-header">',
      `        <h3 id="${cat.id}-${langKey}">${escapeHtml(cat.heading)}</h3>`,
      '        <span class="methodology-sources__divider" aria-hidden="true"></span>',
      '      </div>',
      `      <p>${escapeHtml(cat.description)}</p>`,
      '      <ul class="methodology-sources__grid" role="list">',
      listItems,
      '      </ul>',
      '    </section>'
    ].join('\n');
  }).join('\n');
}

function buildListItem(record, langKey, position) {
  const titleKey = `title_${langKey}`;
  const altKey = `alt_${langKey}`;
  const metaKey = `meta_${langKey}`;
  const title = record[titleKey] || record[altKey] || record.official_name;
  const metaId = `source-${record.slug}-${langKey}-meta`;
  const logoPath = '/' + record.logo_path.replace(/^\//, '');
  return [
    '        <li class="methodology-sources__item" role="listitem">',
    `          <a class="methodology-sources__link" href="${record.url}" target="_blank" rel="noopener noreferrer" title="${escapeAttribute(title)}" aria-label="${escapeAttribute(title)}" aria-describedby="${metaId}" data-source-slug="${record.slug}" data-source-category="${record.category}" data-source-license="${escapeAttribute(record.license)}" data-source-origin="${escapeAttribute(record.source_logo_url)}" data-source-position="${position}">`,
    `            <img class="methodology-sources__image" src="${logoPath}?v=${LOGO_VERSION}" alt="${escapeAttribute(record[altKey] || record.name)}" loading="lazy" decoding="async" width="160" height="80" data-format="${record.logo_format}">`,
    `            <span id="${metaId}" class="sr-only">${escapeHtml(record[metaKey] || '')}</span>`,
    '          </a>',
    '        </li>'
  ].join('\n');
}

function buildJsonLd(langKey, records, config) {
  const graph = ['academic', 'tech'].map((categoryKey) => {
    const categoryRecords = records.filter((item) => item.category === categoryKey);
    const catConfig = config.categories[categoryKey];
    const itemList = {
      '@type': 'ItemList',
      '@id': `${BASE_URL}#sources-${categoryKey}-${langKey}`,
      name: `${config.h2} — ${catConfig.heading}`,
      inLanguage: langKey,
      numberOfItems: categoryRecords.length,
      itemListElement: categoryRecords.map((record, index) => ({
        '@type': 'ListItem',
        position: index + 1,
        item: {
          '@type': 'Organization',
          '@id': `${BASE_URL}#organization-${record.slug}`,
          name: record.official_name,
          alternateName: record.name,
          url: record.url,
          sameAs: [record.url],
          logo: new URL(`${record.logo_path.replace(/^\//, '')}?v=${LOGO_VERSION}`, BASE_URL).toString(),
          description: record[`meta_${langKey}`] || ''
        }
      }))
    };
    return itemList;
  });

  return JSON.stringify({
    '@context': 'https://schema.org',
    '@graph': graph
  }, null, 2);
}

function buildSection(langKey, records) {
  const config = LANG_CONFIG[langKey];
  const inlineStyles = buildInlineStyles();
  const navHtml = buildNavHtml(config.nav, langKey);
  const categoriesHtml = buildCategorySection(langKey, records, config);
  const closingParagraphs = config.closing.paragraphs.map((text) => `    <p>${escapeHtml(text)}</p>`).join('\n');
  const jsonLd = buildJsonLd(langKey, records, config);

  const introBlock = [
    '      <div class="methodology-sources__intro">',
    `        <h2 id="methodology-sources-title-${langKey}">${escapeHtml(config.h2)}</h2>`,
    `        <p>${escapeHtml(config.intro[0])}</p>`,
    `        <p>${escapeHtml(config.intro[1])}</p>`
  ];
  if (navHtml) {
    introBlock.push(navHtml);
  }
  introBlock.push('      </div>');

  return [
    '<!-- Auto-generated by scripts/build-sources.js. Do not edit directly. -->',
    `<section id="sources" class="methodology-sources" aria-labelledby="methodology-sources-title-${langKey}">`,
    inlineStyles,
    '  <div class="container">',
    '    <div class="methodology-sources__panel">',
    introBlock.join('\n'),
    '      <div class="methodology-sources__body">',
    categoriesHtml,
    '      </div>',
    '      <div class="methodology-sources__footer">',
    closingParagraphs,
    `        <small>${escapeHtml(config.closing.small)}</small>`,
    '      </div>',
    '    </div>',
    '  </div>',
    `  <script type="application/ld+json">\n${jsonLd}\n  </script>`,
    '</section>'
  ].join('\n');
}

function writePartial(langKey, content) {
  const filePath = LANG_CONFIG[langKey].partial;
  fs.mkdirSync(path.dirname(filePath), { recursive: true });
  fs.writeFileSync(filePath, `${content}\n`, 'utf8');
}

function updatePage(langKey, content) {
  const pagePath = LANG_CONFIG[langKey].page;
  let page = fs.readFileSync(pagePath, 'utf8');
  const startMarker = '<!-- SOURCES:START -->';
  const endMarker = '<!-- SOURCES:END -->';
  const block = `${startMarker}\n${content}\n${endMarker}`;

  if (page.includes(startMarker) && page.includes(endMarker)) {
    const escapedStart = escapeRegExp(startMarker);
    const escapedEnd = escapeRegExp(endMarker);
    const pattern = new RegExp(`${escapedStart}[\\s\\S]*?${escapedEnd}`);
    page = page.replace(pattern, block);
  } else if (page.includes('<section id="sources"')) {
    const pattern = /<section id="sources"[\s\S]*?<\/section>/;
    page = page.replace(pattern, block);
  } else if (page.includes('</main>')) {
    page = page.replace('</main>', `${block}\n</main>`);
  } else {
    page += `\n${block}\n`;
  }

  fs.writeFileSync(pagePath, page, 'utf8');
}

function main() {
  const rows = readCsv(DATA_PATH);
  const records = rows.map((row) => ({
    ...row,
    id: Number.parseInt(row.id, 10),
    logo_format: (row.logo_format || '').toLowerCase(),
    category: (row.category || '').toLowerCase()
  })).sort((a, b) => a.id - b.id);

  records.forEach(assertLogoAsset);

  Object.keys(LANG_CONFIG).forEach((langKey) => {
    const sectionHtml = buildSection(langKey, records);
    writePartial(langKey, sectionHtml);
    updatePage(langKey, sectionHtml);
  });
}

main();
