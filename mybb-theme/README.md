# warez.skin MyBB theme

Classic dark **YouHack-style** MyBB theme: black panels, red accents, lime status highlights, traditional table layout.

## Package

| Path | Purpose |
|------|---------|
| `warez.css` | Global stylesheet |
| `templates/*.html` | Header/nav, forumbit, thread, postbit |
| `plugin/warezskin.php` | Theme helper plugin (optional) |
| `deploy.php` | Deploy to `/var/www/warez.skin` |

## Deploy

```bash
scp -r mybb-theme/* root@HOST:/opt/warez-theme/
ssh root@HOST 'php /opt/warez-theme/deploy.php'
```
