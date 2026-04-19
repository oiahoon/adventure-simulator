# SBTI-Lowpoly Art Style Guide

This guide locks the visual baseline for `The Emperor's Life` (`朕的一生`): a modern personality-test avatar style adapted to a light ancient Chinese court fantasy setting.

## Reference Assets

- Primary style lock: `public/assets/chinese-reigns/reference/style-lock-emperor.png`
- External visual reference: `public/assets/chinese-reigns/reference/sbti-testing-reference.png`
- Prompt source pack: `/Users/johuang/Downloads/sbti_h5_prompt_pack.md`

## Style Lock

Use a low-saturation geometric cutout illustration style with visible low-poly facets. Characters should feel like internet personality-test result avatars, not fantasy splash art.

Required traits:

- Large polygon head, small simple body, slightly awkward humorous posture.
- Face, hair, robe, arms, and legs built from visible faceted planes with subtle tone differences.
- Minimal facial features: tiny dot eyes, small triangular nose, understated short mouth.
- Flat 2D vector-like cutout shapes with light paper texture.
- Generous negative space and clean silhouettes.
- Warm off-white canvas with pale sage or green-gray rounded card shapes.
- Ancient court identity reduced to light symbols: small crown, blocky official hat, robe shape, belt, scroll, sword, tray, spear, or palace silhouette.
- Muted beige, dark gray, dusty red, faded gold, pale sage green, warm off-white.

Avoid:

- Photorealism, realistic anatomy, 3D render, glossy rendering, cinematic lighting.
- Painterly, oil painting, ornate ancient costume, highly detailed patterns.
- Anime, manga, chibi, Disney, Pixar, Popmart, cute toy mascot look.
- Heavy outlines, detailed fingers, muscular anatomy, dramatic expressions.
- Neon or high-saturation colors, busy backgrounds, game splash art.
- Any text, labels, UI words, logo, or watermark baked into images.

## Master Prompt

```text
Create an original visual asset for a mobile H5 ancient-court personality strategy game, in a low-saturation geometric cutout illustration style. Use visible low-poly faceted planes: the face, hair, clothing, limbs, props, and architecture should be built from flat polygon paper-like shapes with subtle muted tone differences. The feeling should be close to a modern internet personality-test result avatar: large polygon head, small simple body, slightly awkward humorous posture, tiny dot eyes, small triangular nose, short understated mouth, clean silhouette, lots of negative space.

The world is a stylized ancient Chinese court fantasy setting, but keep ancient details minimal and graphic rather than ornate: small crowns, blocky official hats, simple robes, belts, scrolls, swords, spears, trays, palace screens, or court silhouettes. Use muted beige, dark gray, dusty red, faded gold, pale sage green, and warm off-white. Keep the image flat, clean, editorial, tasteful, and playful.

Strict constraints: no text, no labels, no UI words, no logo, no watermark. Avoid photorealism, realistic anatomy, glossy 3D, cinematic lighting, painterly texture, anime, chibi, Disney, Pixar, Popmart, ornate costume, detailed patterns, heavy outlines, busy background, strong gradients, and high saturation.
```

## Character Prompt Template

```text
Create one original square personality-test avatar image for a mobile H5 ancient-court strategy game.

Subject: {role description}. Use a very large faceted polygon head, tiny simple body, short angular arms and legs, slightly awkward humorous posture, tiny dot eyes, small triangular nose, short understated mouth. Build the face from 5-7 visible beige polygon facets with subtle tone differences. Hair, hat, robe, props, arms, and legs must also show visible low-poly faceted planes.

Ancient-court cues should be minimal: {costume or prop cues}. No ornate patterns.

Style: ultra minimal low-saturation geometric cutout, flat 2D vector-like paper pieces, visible faceted volume, clean silhouette, lots of negative space, modern personality-test result avatar feeling.

Background: warm off-white canvas with a pale green-gray rounded rectangle behind the character and a very faint floor shadow. Add no scene detail unless requested.

Palette: muted beige, dark gray, dusty red, faded gold, pale sage green, warm off-white.

Strict constraints: no text, no labels, no UI words, no logo, no watermark. Avoid photorealism, 3D, painterly, anime, chibi, ornate costume, detailed fingers, busy background.
```

## Background Prompt Template

```text
Create one mobile vertical H5 game background in the same SBTI-lowpoly personality-test visual style.

Scene: {scene description}. Build the architecture and objects from large flat polygon paper-like shapes with visible faceted planes and subtle muted tone differences. Keep details minimal, spacious, and graphic. Use lots of negative space for UI overlays.

Style: low-saturation geometric cutout illustration, modern editorial, flat 2D, clean composition, pale off-white atmosphere, muted dusty red, faded gold, sage green, beige, ink gray.

Composition: 9:16 vertical, central area clear for a decision card, top area clear for resource bars, no main character unless requested.

Strict constraints: no text, no labels, no logo, no watermark. Avoid photorealism, painterly, cinematic, ornate, busy, high saturation.
```

## Icon Prompt Template

```text
Create one clean square game resource icon in the same SBTI-lowpoly visual style.

Subject: {resource symbol}. Build the icon from simple flat polygon paper-like shapes with subtle faceted tone differences. Use a highly readable silhouette for small mobile UI sizes. Keep it centered, minimal, and low-saturation.

Style: geometric cutout, muted palette, soft ancient Chinese cue, flat 2D, clean shape language.

Background: transparent for HUD/resource-bar icons. Do not include a card, rounded rectangle, full-canvas background, or baked shadow that assumes a specific UI surface.

Strict constraints: no text, no labels, no logo, no watermark. Avoid detailed texture, ornate decoration, heavy outline, glossy 3D, high saturation.
```

## Transparency Rules

Transparency is a product/UI decision, not a universal rule. Use the asset's intended UI layer to decide whether the PNG should include an alpha channel.

### Must Be Transparent

Use transparent PNGs for assets that need to sit on top of changing UI surfaces, backgrounds, bars, cards, or animated states.

| Asset Type | Path Pattern | Transparency | Reason |
| --- | --- | --- | --- |
| HUD resource icons | `public/assets/chinese-reigns/icons/*-transparent.png` | Required | These sit inside resource pills, top bars, event cards, result stat rows, and warning states. The UI should own the pill/card background. |
| Small inline status glyphs | `public/assets/chinese-reigns/icons/status-*.png` | Required | These may appear on different card colors, alerts, or overlays. |
| Item/prop stickers used inside cards | `public/assets/chinese-reigns/props/*.png` | Required | Props should be composable beside text, portraits, or event choices. |
| Character cutouts for animation | `public/assets/chinese-reigns/cutouts/*.png` | Required | These can float, slide, or layer over backgrounds without a baked square. |

HUD icon subjects should be simpler than full illustration cards:

- `people-transparent.png`: one small commoner head/upper body plus a rice stalk.
- `treasury-transparent.png`: compact chest/coin/ledger symbol.
- `army-transparent.png`: small guard head/upper body plus banner or sword.
- `court-transparent.png`: small official head/upper body plus memorial scroll or seal.

Transparent icons must still preserve the SBTI-lowpoly style:

- Visible faceted planes on faces, props, and clothing.
- Tiny dot eyes, small triangular nose, short understated mouth when a face is present.
- Low-saturation colors and paper-cutout texture.
- No full-canvas background, no rounded card, no baked label, no shadow that looks like a separate card.
- Readable at `24px`, `28px`, and `32px` in a mobile resource bar.

### Should Stay Opaque

Use full-canvas opaque images when the asset is itself the visual surface or needs built-in negative space.

| Asset Type | Path Pattern | Transparency | Reason |
| --- | --- | --- | --- |
| Character portraits | `public/assets/chinese-reigns/portraits/*.png` | No | The pale rounded card, floor shadow, and whitespace are part of the SBTI result-avatar feel. |
| Gameplay backgrounds | `public/assets/chinese-reigns/backgrounds/*.png` | No | These are screen-level scene backdrops and should provide their own atmosphere and UI-safe empty zones. |
| Ending backgrounds | `public/assets/chinese-reigns/endings/*.png` | No | These serve as result-page canvases with built-in narrative space. |
| Share/result backgrounds | `public/assets/chinese-reigns/share/*.png` | No | These define the whole share-card layout and should include blank text zones. |
| Reference images | `public/assets/chinese-reigns/reference/*.png` | No requirement | These are not runtime UI layers. Preserve them as-is. |

### Optional Opaque Illustration Icons

The project may also keep non-transparent square illustration icons in `public/assets/chinese-reigns/icons/*.png` for places where the icon should read as a tiny SBTI result card rather than a composable HUD glyph.

Use these opaque versions for:

- Resource explanation panels.
- Tutorial cards.
- Result-detail sections.
- Asset mood boards and art-direction previews.

Do not use opaque illustration icons directly in the top resource HUD unless the UI intentionally wants a visible square/card image.

## HUD Icon Prompt Template

```text
Create one transparent-background PNG HUD resource icon for a mobile H5 ancient-court personality strategy game.

Subject: {compact resource symbol}. Use a simple readable silhouette that works at 24-32px: {one small mascot head/upper body or prop combination}. Build every visible element from flat polygon paper-like shapes with subtle low-poly faceted planes. If a face is present, include tiny dot eyes, a small triangular nose, and a short understated mouth.

Style: SBTI testing inspired low-saturation geometric cutout illustration, flat 2D paper pieces, visible faceted volume, minimal ancient Chinese court cues, clean silhouette.

Background: fully transparent alpha background. No card, no rounded rectangle, no full-canvas color, no baked UI container, no label.

Palette: muted beige, ink gray, dusty red, faded gold, pale sage green, warm off-white accents.

Strict constraints: no text, no labels, no UI words, no logo, no watermark. Avoid photorealism, glossy 3D, painterly texture, anime, chibi, Popmart, ornate detail, heavy outline, high saturation, busy shape clusters.
```

## Sizes

- Character portraits: `1024x1024`
- Opaque illustration resource icons: `1024x1024`
- Transparent HUD resource icons: `1024x1024` source PNG with alpha; UI should display them at `24px`, `28px`, or `32px`
- Gameplay backgrounds: `1024x1536`
- Ending and share backgrounds: `1024x1536`

## Naming

Use lowercase kebab-case names grouped by purpose:

- `public/assets/chinese-reigns/portraits/*.png`
- `public/assets/chinese-reigns/backgrounds/*.png`
- `public/assets/chinese-reigns/icons/*.png`
- `public/assets/chinese-reigns/icons/*-transparent.png`
- `public/assets/chinese-reigns/endings/*.png`
- `public/assets/chinese-reigns/share/*.png`

## Quality Gate

Accept an image only if:

- Low-poly faceted construction is visible.
- Palette is muted and low-saturation.
- The result feels like a modern personality-test avatar or card, not a traditional game splash illustration.
- Ancient-court details are readable but minimal.
- No text, watermarks, or logos appear.
- Character portraits work as square avatars.
- Backgrounds leave enough negative space for UI overlays.
- HUD icons have a real alpha channel and no baked card/background.
- HUD icons remain readable when scaled to `24px`, `28px`, and `32px`.

Common fixes:

- Too painterly or ancient-fantasy: add `personality-test avatar, flat low-poly cutout, no painterly`.
- Too flat with no volume: add `visible polygon facets, faceted planes on face and robe`.
- Too cute or chibi: add `awkward internet-test mascot, not chibi, not cute toy`.
- Too busy: add `large negative space, minimal details, no ornate patterns`.
