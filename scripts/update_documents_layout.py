from __future__ import annotations

from pathlib import Path
import re
from typing import Dict

from bs4 import BeautifulSoup, Tag

DOC_SLUGS = [
    "terms-of-use",
    "privacy-policy",
    "cookies-policy",
    "ethics-charter",
    "ai-disclosure",
    "open-knowledge-license",
    "accessibility",
]

DOC_LABELS = {
    "en": {
        "terms-of-use": "Terms of Use",
        "privacy-policy": "Privacy Policy",
        "cookies-policy": "Cookies Policy",
        "ethics-charter": "Ethics Charter",
        "ai-disclosure": "AI Transparency",
        "open-knowledge-license": "Open Knowledge License",
        "accessibility": "Accessibility Statement",
    },
    "ru": {
        "terms-of-use": "Пользовательское соглашение",
        "privacy-policy": "Политика конфиденциальности",
        "cookies-policy": "Политика файлов cookie",
        "ethics-charter": "Этическая хартия",
        "ai-disclosure": "Прозрачность ИИ",
        "open-knowledge-license": "Лицензия открытого знания",
        "accessibility": "Заявление о доступности",
    },
}


def slugify(text: str) -> str:
    text = text.strip().lower()
    text = re.sub(r"[\s\xa0]+", "-", text)
    text = re.sub(r"[^\w\-]", "", text)
    text = re.sub(r"-+", "-", text)
    return text.strip('-')


def indent_html(html: str, indent: str) -> str:
    lines = html.splitlines()
    return "\n".join(f"{indent}{line}" if line else indent for line in lines)


def ensure_head_links(head: Tag, soup: BeautifulSoup) -> None:
    if not head:
        return
    existing = {(tag.name, tuple(sorted((k, tuple(v) if isinstance(v, list) else v) for k, v in tag.attrs.items()))) for tag in head.find_all('link')}

    def add_link(**attrs):
        key = ('link', tuple(sorted(attrs.items())))
        if key in existing:
            return
        head.append(soup.new_tag('link', **attrs))
        existing.add(key)

    add_link(rel='icon', type='image/svg+xml', href='/assets/icons/favicon.svg')
    add_link(rel='alternate icon', type='image/png', href='/evera-logo-white.png')
    add_link(rel='apple-touch-icon', href='/evera-logo-white.png')
    add_link(rel='manifest', href='/manifest.json')

    if not head.find('link', rel='stylesheet', href='/css/styles.css'):
        head.append(soup.new_tag('link', rel='stylesheet', href='/css/styles.css'))


def load_layout(language: str) -> Dict[str, str]:
    source = Path('en/pages/about.html') if language == 'en' else Path('pages/about.html')
    soup = BeautifulSoup(source.read_text(encoding='utf-8'), 'html.parser')
    body = soup.body
    assert body is not None

    layout: Dict[str, str] = {}
    # Analytics script and noscript
    analytics_parts = []
    script_tag = body.find('script', type='text/javascript')
    if script_tag:
        analytics_parts.append(str(script_tag))
    noscript_tag = body.find('noscript')
    if noscript_tag:
        analytics_parts.append(str(noscript_tag))
    layout['analytics'] = "\n".join(analytics_parts)

    for element_id in ('readProgress', 'nebula', 'stars'):
        elem = body.find(id=element_id)
        if elem:
            layout[element_id] = str(elem)

    header = body.find('header', class_='header')
    overlay = body.find('div', id='navOverlay')
    drawer = body.find('aside', id='navDrawer')
    footer = body.find('footer', class_='footer')
    scroll_button = body.find('button', id='scrollTopButton')

    layout['header'] = str(header)
    layout['overlay'] = str(overlay)
    layout['drawer'] = str(drawer)
    layout['footer'] = str(footer)
    layout['scroll_button'] = str(scroll_button)

    return layout


def build_doc_nav(language: str, current_slug: str) -> str:
    base = '/en/pages/terms' if language == 'en' else '/pages/terms'
    items = []
    for slug in DOC_SLUGS:
        label = DOC_LABELS[language][slug]
        href = f"{base}/{slug}.html"
        current_attr = ' aria-current="page"' if slug == current_slug else ''
        items.append(f"                <li><a href=\"{href}\"{current_attr}>{label}</a></li>")
    return "\n".join([
        "            <nav class=\"legal-nav\" aria-label=\"Documents navigation\">",
        "              <ul class=\"legal-nav__list\">",
        *items,
        "              </ul>",
        "            </nav>",
    ])


def adjust_language_links(fragment: str, language: str, slug: str) -> str:
    soup = BeautifulSoup(fragment, 'html.parser')
    current_path = f"/en/pages/terms/{slug}.html" if language == 'en' else f"/pages/terms/{slug}.html"
    counterpart_path = f"/pages/terms/{slug}.html" if language == 'en' else f"/en/pages/terms/{slug}.html"

    select = soup.find('select', class_='lang-switch')
    if select:
        for option in select.find_all('option'):
            value = option.get('value')
            if value == 'en':
                option['data-url'] = f"/en/pages/terms/{slug}.html"
                option.attrs.pop('selected', None)
                if language == 'en':
                    option['selected'] = ''
            elif value == 'ru':
                option['data-url'] = f"/pages/terms/{slug}.html"
                option.attrs.pop('selected', None)
                if language == 'ru':
                    option['selected'] = ''

    for link in soup.find_all('a'):
        if link.get('lang') == 'en':
            link['href'] = f"/en/pages/terms/{slug}.html"
        elif link.get('lang') == 'ru':
            link['href'] = f"/pages/terms/{slug}.html"

    return str(soup.find()) if soup.find() else fragment


def transform_document(path: Path, language: str, layout: Dict[str, str]) -> None:
    original = path.read_text(encoding='utf-8')
    idx = original.lower().find('<!doctype')
    license_block = original[:idx]
    soup = BeautifulSoup(original[idx:], 'html.parser')
    head = soup.head
    body = soup.body
    if not head or not body:
        raise RuntimeError(f"Unexpected structure in {path}")

    if soup.select_one('.legal-page'):
        for section in soup.select('.legal-content'):
            for heading in section.find_all(['h2', 'h3']):
                if not heading.get('id'):
                    heading['id'] = slugify(heading.get_text())
        final_html = f"{license_block}{soup}"
        path.write_text(final_html, encoding='utf-8')
        return

    for style in head.find_all('style'):
        style.decompose()
    ensure_head_links(head, soup)

    main = body.find('main')
    if not main:
        raise RuntimeError(f"main not found in {path}")
    elements = [child for child in main.children if getattr(child, 'name', None)]
    if not elements or elements[0].name != 'h1':
        raise RuntimeError(f"Unexpected main structure in {path}")

    h1 = elements[0]
    page_title = ''.join(str(c) for c in h1.contents)
    rest = elements[1:]

    lead_tag = None
    content_tags = []
    for tag in rest:
        if lead_tag is None and tag.name == 'p':
            lead_tag = tag
        else:
            content_tags.append(tag)

    lead_html = ''.join(str(c) for c in lead_tag.contents) if lead_tag else ''

    for tag in content_tags:
        if tag.name in ('h2', 'h3') and not tag.get('id'):
            tag['id'] = slugify(tag.get_text())
        for heading in tag.find_all(['h2', 'h3']):
            if not heading.get('id'):
                heading['id'] = slugify(heading.get_text())

    content_html = '\n'.join(
        '            ' + str(tag).replace('\n', '\n            ') for tag in content_tags
    )

    provenance_tag = soup.find('section', id='provenance')
    provenance_html = None
    if provenance_tag:
        provenance_html = '\n'.join(
            '            ' + str(child).replace('\n', '\n            ')
            for child in provenance_tag.contents
            if getattr(child, 'name', None) or str(child).strip()
        )

    slug = path.stem

    header = adjust_language_links(layout['header'], language, slug)
    drawer = adjust_language_links(layout['drawer'], language, slug)

    body_open = f"<body data-nebula=\"documents\">"
    scroll_label = 'Back to top' if language == 'en' else 'Вернуться к началу страницы'
    scroll_button = layout['scroll_button']
    if language == 'en':
        scroll_button = scroll_button.replace('aria-label="Back to top"', f'aria-label="{scroll_label}"')
    else:
        scroll_button = scroll_button.replace('aria-label="Вернуться к началу страницы"', f'aria-label="{scroll_label}"')

    body_lines = [
        body_open,
        indent_html(layout['analytics'], '    '),
        '',
        f"    {layout['readProgress']}",
        f"    {layout['nebula']}",
        f"    {layout['stars']}",
        indent_html(header, '    '),
        f"    {layout['overlay']}",
        indent_html(drawer, '    '),
        "    <main>",
        f"      <article class=\"legal-page\" lang=\"{language}\">",
        "        <section id=\"legal-hero\" class=\"section\">",
        "          <div class=\"container section-surface stack\">",
        f"            <h1>{page_title}</h1>",
        f"            <p class=\"lead\">{lead_html}</p>",
        build_doc_nav(language, slug),
        "          </div>",
        "        </section>",
        "",
        "        <section class=\"section\">",
        "          <div class=\"container section-surface stack legal-content\">",
        content_html,
        "          </div>",
        "        </section>",
    ]

    if provenance_html:
        body_lines.extend(
            [
                "",
                "        <section id=\"provenance\" class=\"section\">",
                "          <div class=\"container section-surface stack legal-provenance\">",
                provenance_html,
                "          </div>",
                "        </section>",
            ]
        )

    body_lines.extend(
        [
            "      </article>",
            "    </main>",
            indent_html(layout['footer'], '    '),
            f"    {scroll_button}",
            "    <script src=\"/js/app.js\"></script>",
            "  </body>",
        ]
    )

    assembled_body = "\n".join(body_lines)

    final_html = (
        f"{license_block}<!doctype html>\n"
        f"<html lang=\"{language}\">\n"
        f"{head}\n"
        f"{assembled_body}\n"
        "</html>\n"
    )
    path.write_text(final_html, encoding='utf-8')


def main() -> None:
    layouts = {
        'en': load_layout('en'),
        'ru': load_layout('ru'),
    }
    for language, base in [('en', Path('en/pages/terms')), ('ru', Path('pages/terms'))]:
        for slug in DOC_SLUGS:
            transform_document(base / f"{slug}.html", language, layouts[language])


if __name__ == '__main__':
    main()
