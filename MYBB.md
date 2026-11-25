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

See `mybb-theme/README.md`. The live look is a classic **YouHack-style** dark board: black panels, red accents, lime status text, magenta welcome, top colored nav, skull forum icons, and traditional table forumbit/postbit. Redeploy with `php /opt/warez-theme/deploy.php`.
