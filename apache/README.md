# Apache vhosts (VPS)

Live box: `146.71.100.41` (hostname `Msign`).

| Host | Front door | Path / process |
|------|------------|----------------|
| `warez.skin` / `www` | **MyBB 1.8** | `/var/www/warez.skin` |
| `sentry.mba` / `www` | Node (PM2 `warez-skin`) | `/opt/warez.skin` → `:3000` |

## Restore MyBB on warez.skin

If Apache is proxying warez.skin to Node again:

```bash
cp apache/warez.skin.conf /etc/apache2/sites-available/
cp apache/warez.skin-le-ssl.conf /etc/apache2/sites-available/
apache2ctl configtest && systemctl reload apache2
```

Proxy-era copies are kept on the VPS under `/root/apache-backups/`.

## Notes

- MyBB DB: `warez_mybb` (creds in `/root/.warez_mybb_dbpass`)
- Theme: `warez.skin` (tid=3), portal is `DirectoryIndex`
- ACP: `https://warez.skin/admin/`
- Do not put passwords in this repo
