# warez.skin MyBB theme

Dark, mobile-first card UI inspired by modern orange-accent forum themes (Xferno-style).

## Package

| Path | Purpose |
|------|---------|
| `warez.css` | Global stylesheet (attach last) |
| `templates/*.html` | Custom MyBB templates |
| `plugin/warezskin.php` | Index stats grid helper |
| `deploy.php` | Push everything to a MyBB tree |

## Live board

- Theme: **warez.skin** (`tid=3`)
- Template set: **warez.skin** (`sid=2`)
- CSS cache: `/var/www/warez.skin/cache/themes/theme3/warez.css`

## Deploy

```bash
scp -r mybb-theme/* root@HOST:/opt/warez-theme/
ssh root@HOST 'php /opt/warez-theme/deploy.php'
# optional full forum rebuild:
ssh root@HOST 'php /opt/warez-theme/deploy.php --reset-forums'
```

## Features

- Sticky top bar with drawer menu, logo, Log in / Register
- Category tabs (General / Market)
- Forum cards with subforum chips
- 2×2 stats grid
- Card thread rows + dark postbits
