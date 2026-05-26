# Creating a new page in ut-astro

## Data sources

Pages come from 3 JSON exports in `src/sql_import_sources/`:

| File                            | Description                                 |
| ------------------------------- | ------------------------------------------- |
| `hypercontent__pages.json`      | Page definitions (name, parent, visibility) |
| `hypercontent__pages_lang.json` | Localized slugs and labels per page/lang    |
| `hypercontent__contents.json`   | Block content per language                  |

Language mapping: `lang_id 1 = fr`, `2 = de`, `3 = en`

## Finding a page's content

```python
import json

pages      = # data from hypercontent__pages.json
pages_lang = # data from hypercontent__pages_lang.json
contents   = # data from hypercontent__contents.json

contents_by_id = {c['id']: c for c in contents}

# Find the page
page = next(p for p in pages if p['name'] == 'contact')

# Get slug + blocks per language
for pl in pages_lang:
    if pl['page_id'] == page['id']:
        blocks = json.loads(contents_by_id[pl['content_id']]['blocks'])
        # pl['slug'] = localized slug (e.g. 'kontakt' for de)
        # blocks = list of { type, data } dicts
```

## Block types and available components

| Block type       | Component               | Notes                                  |
| ---------------- | ----------------------- | -------------------------------------- |
| `BlockTitle`     | `ContentBlockTitle.vue` | prop: `text`                           |
| `BlockSpace`     | `ContentBlockSpace.vue` | prop: `size` (`full`/`half`/`quarter`) |
| `AddressBlock`   | `AddressBlock.vue`      | prop: `person` object                  |
| `paragraph`      | inline `<p>`            | HTML content, write directly in Astro  |
| `TextOn2Columns` | `TextOn2Columns.vue`    | props: `column1`, `column2` (HTML)     |
| `Hero`           | `Hero.vue`              | see component for props                |

All components are in `src/components/`. For static content, use `.astro` components and write HTML directly — no `set:html` needed.

## Routing pattern

Pages live in `src/pages/[lang]/[...slug].astro`. The `getStaticPaths` function maps each (lang, slug) pair to a page component:

```astro
---
export function getStaticPaths() {
  return [
    { params: { lang: 'fr', slug: 'contact' },  props: { page: 'contact', lang: 'fr' } },
    { params: { lang: 'de', slug: 'kontakt' },  props: { page: 'contact', lang: 'de' } },
    { params: { lang: 'en', slug: 'contact' },  props: { page: 'contact', lang: 'en' } },
    // add more pages here
  ]
}

const { page, lang } = Astro.props
---

<PageLayout>
  {page === 'contact' && <ContactPage lang={lang} />}
</PageLayout>
```

## Page component pattern

Each page has a dedicated component in `src/components/pages/` (e.g. `ContactPage.astro`). It receives a `lang` prop and renders the appropriate content:

```astro
---
import ContentBlockTitle from '@components/ContentBlockTitle.vue'

const { lang } = Astro.props
---

{lang === 'fr' && (
  <>
    <ContentBlockTitle text="Contactez-nous!" />
    <div class="container superslim">
      <p>Contenu FR...</p>
    </div>
  </>
)}

{lang === 'de' && <ContentBlockTitle text="Kontakt" />}
{lang === 'en' && <ContentBlockTitle text="Contact" />}
```

## Adding a new page — checklist

1. Look up the page in `hypercontent__pages.json` and note its `id`
2. Run the Python snippet above to extract slugs and blocks per language
3. Add 3 entries to `getStaticPaths` in `[lang]/[...slug].astro`
4. Create `src/components/pages/YourPageName.astro`
5. Map each block type to its component (see table above)
6. If a component is missing, check `urban-training/components/content/` and port it

## Translations

Keys come from `src/sql_import_sources/hypercontent__labels.json` and are stored in `src/translations/{fr,de,en}.json`. Keys use the original underscore format: `common_login`, `login_invalid_credentials`, etc.

In Vue components: `const { t } = useI36n()` then `t('common_login')`.
In Astro components: translations are not available (i36n is client-side Vue only) — hardcode the text per language directly.

## Home page

The home page has an empty slug, so it maps to `/fr`, `/de`, `/en`. Handle it separately in `src/pages/[lang]/index.astro` (not via `[...slug].astro`).
