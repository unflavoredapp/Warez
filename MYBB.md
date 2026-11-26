# MyBB (retired from public site)

Public traffic for **warez.skin** now goes to the Node IPA discovery app (`/opt/warez.skin`, PM2 `:3000`) with the classic sentry.mba green/black UI.

MyBB 1.8 files remain at `/var/www/warez.skin` and the MariaDB database is untouched, but Apache no longer uses that DocumentRoot for the live site.

## Leftover paths

| Piece | Location |
|--------|----------|
| Old MyBB docroot | `/var/www/warez.skin` |
| Theme sources | repo `mybb-theme/` |
| Admin password file | `/root/.warez_mybb_admin` |
| Node app | `/opt/warez.skin` |

To fully remove MyBB later (optional): stop relying on the DB, then drop `warez_mybb` and delete `/var/www/warez.skin`.
