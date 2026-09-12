# Game Wiki Template Setup

This project separates reusable site structure from game-specific content.

## 1. Configure the game

Edit `src/config/game-site.ts` first.

- `brand`: public name, mobile abbreviation, wiki name, tagline, and archive ID
- `platform`: platform name and official play URL
- `media`: icon, logo, hero artwork, social image, and trailer video ID
- `paths`: featured internal destinations used by shared calls to action
- `contentModules`: enabled wiki sections, order, icons, and navigation group
- `externalLinks`: official and community destinations shown in the footer
- `liveModule`: optional sidebar data such as active codes or rotating rewards

Set `liveModule.enabled` to `false` for games that do not use redeemable codes.

## 2. Replace localized copy

Edit `src/locales/en.json` and the other locale files. Keep the same JSON shape so page components remain reusable.

Brand and media values belong in `game-site.ts`. Translated descriptions, labels, article titles, and player-facing explanations belong in locale files.

## 3. Configure content modules

Each enabled `contentModules[].slug` should have a matching content directory. The current sample includes:

- `guide`
- `races`
- `bosses`
- `codes`
- `tier-list`
- `maps`
- `skills`

Modules can be renamed, reordered, disabled, or replaced for another game. Add the matching navigation label to every locale file when changing a module key.

## 4. Replace content and assets

- Replace sample MDX articles with real game content.
- Put game artwork in `public/images` and update the media paths in `game-site.ts`.
- Keep meaningful image dimensions and descriptive alt text.
- Update the favicon and app icons together with the site logo.

## 5. Verify a new site

Run:

```bash
npm run build
```

Check the homepage, one category page, one article page, search, mobile navigation, alternate locales, `robots.txt`, and `sitemap.xml` before deployment.
