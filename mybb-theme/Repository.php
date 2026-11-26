<?php
/**
 * Repository — IPA repo discovery (AltStore-style sources)
 */
define('IN_MYBB', 1);
define('THIS_SCRIPT', 'Repository.php');

require_once './global.php';

if (!function_exists('apprepos_enabled') || !apprepos_enabled()) {
	error('App Repos is not active. Enable <strong>App Repos</strong> in Admin CP → Plugins.');
}

// App details: Repository.php?action=app&repo=&app=
// NOTE: do not use query key "id" — MyBB coerces input[id] to int.
if ($mybb->get_input('action') === 'app') {
	apprepos_render_app_page();
}

add_breadcrumb('Repository', 'Repository.php');

$stats = apprepos_stats();
$bburl = $mybb->settings['bburl'];
$can = apprepos_can_manage() ? '1' : '0';
$key = $mybb->post_code;
$content = apprepos_render_portal_html($stats, $bburl, $can, $key);

output_page('<html><head><title>'.$mybb->settings['bbname'].' · Repository</title>'.$headerinclude.'</head><body class="sm-page-repository">'.$header.$content.$footer.'</body></html>');
