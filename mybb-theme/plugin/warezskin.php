<?php
if (!defined('IN_MYBB')) {
	die('Direct initialization of this file is not allowed.');
}

function warezskin_info()
{
	return array(
		'name' => 'warez.skin Theme Helpers',
		'description' => 'Index stats helpers and light template polish for the warez.skin theme.',
		'website' => 'https://warez.skin',
		'author' => 'warez.skin',
		'version' => '1.0',
		'compatibility' => '18*'
	);
}

function warezskin_activate() {}
function warezskin_deactivate() {}

$plugins->add_hook('index_end', 'warezskin_index_stats');

function warezskin_index_stats()
{
	global $boardstats, $cache, $mybb, $lang;

	$stats = $cache->read('stats');
	if (!is_array($stats)) {
		return;
	}

	$threads = my_number_format((int)$stats['numthreads']);
	$posts = my_number_format((int)$stats['numposts']);
	$members = my_number_format((int)$stats['numusers']);

	$newest = '—';
	if (!empty($stats['lastuid']) && !empty($stats['lastusername'])) {
		$newest = build_profile_link(htmlspecialchars_uni($stats['lastusername']), (int)$stats['lastuid']);
	}

	$boardstats = '
	<div class="wz-stats">
		<div class="wz-stat">
			<div class="wz-stat-ico"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8"><path d="M8 7h13M8 12h13M8 17h13M3 7h.01M3 12h.01M3 17h.01"/></svg></div>
			<div class="wz-stat-text"><div class="wz-stat-value">' . $threads . '</div><div class="wz-stat-label">Threads</div></div>
		</div>
		<div class="wz-stat">
			<div class="wz-stat-ico"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8"><path d="M21 15a4 4 0 0 1-4 4H8l-5 3V7a4 4 0 0 1 4-4h10a4 4 0 0 1 4 4z"/></svg></div>
			<div class="wz-stat-text"><div class="wz-stat-value">' . $posts . '</div><div class="wz-stat-label">Posts</div></div>
		</div>
		<div class="wz-stat">
			<div class="wz-stat-ico"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8"><path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/><path d="M22 21v-2a4 4 0 0 0-3-3.87"/><path d="M16 3.13a4 4 0 0 1 0 7.75"/></svg></div>
			<div class="wz-stat-text"><div class="wz-stat-value">' . $members . '</div><div class="wz-stat-label">Members</div></div>
		</div>
		<div class="wz-stat">
			<div class="wz-stat-ico"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8"><circle cx="12" cy="8" r="4"/><path d="M4 21a8 8 0 0 1 16 0"/></svg></div>
			<div class="wz-stat-text"><div class="wz-stat-value">' . $newest . '</div><div class="wz-stat-label">Newest member</div></div>
		</div>
	</div>';
}
