# warez.skin MyBB theme

Dark Syne / IBM Plex Mono overrides for MyBB 1.8.x.

## Files

- `warez.css` — global stylesheet (attach last so it wins over Default)

## Install on a board

1. ACP → **Templates & Style** → **Themes** → create theme (or copy Default).
2. **Add Stylesheet** → name `warez.css`, attach to **Global**, paste contents of `warez.css`.
3. Set the theme as **Default**.
4. Rebuild caches / hard-refresh.

On the live VPS the theme is already `tid=3` with cache file:

`/var/www/warez.skin/cache/themes/theme3/warez.css`

## Deploy update

```bash
scp mybb-theme/warez.css root@HOST:/var/www/warez.skin/cache/themes/theme3/warez.css
# then update mybb_themestylesheets.stylesheet for sid=warez and bump lastmodified
```
