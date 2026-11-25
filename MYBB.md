# warez.skin → MyBB

The site at **https://warez.skin** now runs **MyBB 1.8** (Apache + PHP + MariaDB) instead of the Node IPA discovery app.

## Live stack

| Piece | Location |
|--------|----------|
| Document root | `/var/www/warez.skin` |
| Apache vhosts | `warez.skin.conf` + `warez.skin-le-ssl.conf` (Let’s Encrypt kept) |
| Database | `warez_mybb` / user `warez_mybb` |
| Theme | MyBB theme **warez.skin** (`tid=3`) + `cache/themes/theme3/warez.css` |
| Theme source in repo | `mybb-theme/warez.css` |
| Old Node app | `/opt/warez.skin` (PM2 process stopped) |

## Admin

- URL: https://warez.skin/admin/
- Username: `admin`
- Password: stored on the VPS at `/root/.warez_mybb_admin` (rotate after first login)

## Theme notes

See `mybb-theme/README.md`. The live look is a dark orange card UI (Inter, `#0a0a0a` / `#ff7a1a`) with custom templates: sticky header + drawer, General/Market tabs, forum cards with chips, stats grid, and card thread/post layouts. Redeploy with `php /opt/warez-theme/deploy.php`.
