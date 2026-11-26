<?php
/**
 * App Repos — AltStore-style IPA source indexer for the portal
 */
if (!defined('IN_MYBB')) {
	die('Direct initialization of this file is not allowed.');
}

function apprepos_info()
{
	return array(
		'name' => 'App Repos',
		'description' => 'IPA app repository discovery on the portal (AltStore-style sources).',
		'website' => 'https://warez.skin',
		'author' => 'warez.skin',
		'version' => '1.0',
		'compatibility' => '18*',
	);
}

function apprepos_install()
{
	apprepos_insert_settings();
	$dir = apprepos_data_dir();
	@mkdir($dir, 0755, true);
	@file_put_contents($dir.'/index.html', '');
	if (!is_file($dir.'/repos.json')) {
		$legacy = '/opt/warez.skin/data/repos.json';
		if (is_file($legacy)) {
			@copy($legacy, $dir.'/repos.json');
		} else {
			file_put_contents($dir.'/repos.json', json_encode(array('repos' => array())));
		}
	}
}

function apprepos_is_installed()
{
	global $mybb;
	return isset($mybb->settings['apprepos_enabled']) || is_file(apprepos_data_dir().'/repos.json');
}

function apprepos_uninstall()
{
	global $db;
	$db->delete_query('settings', "name LIKE 'apprepos_%'");
	$db->delete_query('settinggroups', "name='apprepos'");
	rebuild_settings();
}

function apprepos_activate()
{
	apprepos_insert_settings();
}

function apprepos_deactivate()
{
}

function apprepos_insert_settings()
{
	global $db;

	$query = $db->simple_select('settinggroups', 'gid', "name='apprepos'", array('limit' => 1));
	$gid = (int)$db->fetch_field($query, 'gid');
	if (!$gid) {
		$gid = (int)$db->insert_query('settinggroups', array(
			'name' => 'apprepos',
			'title' => 'App Repos',
			'description' => 'IPA source indexing for the portal.',
			'disporder' => 83,
			'isdefault' => 0,
		));
	}

	$settings = array(
		'apprepos_enabled' => array('Enable app repos portal', 'Show the IPA discovery viewer on portal.php.', 'yesno', '1', 1),
		'apprepos_guest_add' => array('Guests can add sources', 'Allow guests to index new source URLs.', 'yesno', '0', 2),
	);

	foreach ($settings as $name => $meta) {
		$exists = $db->simple_select('settings', 'sid', "name='".$db->escape_string($name)."'", array('limit' => 1));
		if ($db->fetch_array($exists)) {
			continue;
		}
		$db->insert_query('settings', array(
			'name' => $db->escape_string($name),
			'title' => $db->escape_string($meta[0]),
			'description' => $db->escape_string($meta[1]),
			'optionscode' => $db->escape_string($meta[2]),
			'value' => $db->escape_string($meta[3]),
			'disporder' => (int)$meta[4],
			'gid' => $gid,
			'isdefault' => 0,
		));
	}
	rebuild_settings();
}

function apprepos_data_dir()
{
	return MYBB_ROOT.'uploads/apprepos';
}

function apprepos_data_file()
{
	return apprepos_data_dir().'/repos.json';
}

function apprepos_enabled()
{
	global $mybb;
	return !isset($mybb->settings['apprepos_enabled']) || (int)$mybb->settings['apprepos_enabled'] === 1;
}

function apprepos_can_manage()
{
	global $mybb;
	if (!empty($mybb->user['uid'])) {
		return true;
	}
	return !empty($mybb->settings['apprepos_guest_add']) && (int)$mybb->settings['apprepos_guest_add'] === 1;
}

function apprepos_id_from($input)
{
	return substr(sha1((string)$input), 0, 12);
}

function apprepos_read()
{
	$file = apprepos_data_file();
	if (!is_file($file)) {
		return array('repos' => array());
	}
	$raw = @file_get_contents($file);
	$data = json_decode($raw, true);
	if (!is_array($data) || !isset($data['repos']) || !is_array($data['repos'])) {
		return array('repos' => array());
	}
	return $data;
}

function apprepos_write($data)
{
	$dir = apprepos_data_dir();
	if (!is_dir($dir)) {
		@mkdir($dir, 0755, true);
	}
	$file = apprepos_data_file();
	$tmp = $file.'.'.getmypid().'.tmp';
	file_put_contents($tmp, json_encode($data));
	rename($tmp, $file);
}

function apprepos_format_bytes($n)
{
	$n = (float)$n;
	if ($n <= 0) {
		return '—';
	}
	$u = array('B', 'KB', 'MB', 'GB');
	$i = 0;
	while ($n >= 1024 && $i < count($u) - 1) {
		$n /= 1024;
		$i++;
	}
	return ($i ? number_format($n, 1) : (string)(int)$n).' '.$u[$i];
}

function apprepos_normalize_app($app)
{
	if (!is_array($app)) {
		$app = array();
	}
	$versions = isset($app['versions']) && is_array($app['versions']) ? $app['versions'] : array();
	$latest = isset($versions[0]) && is_array($versions[0]) ? $versions[0] : array();
	$version = (string)($latest['version'] ?? $app['version'] ?? '');
	$downloadURL = (string)($latest['downloadURL'] ?? $app['downloadURL'] ?? '');
	$size = (int)($latest['size'] ?? $app['size'] ?? 0);
	$versionDate = (string)($latest['date'] ?? $app['versionDate'] ?? '');
	$bundle = (string)($app['bundleIdentifier'] ?? '');
	$shots = array();
	if (!empty($app['screenshotURLs']) && is_array($app['screenshotURLs'])) {
		foreach (array_slice($app['screenshotURLs'], 0, 24) as $u) {
			$u = (string)$u;
			if ($u !== '') {
				$shots[] = $u;
			}
		}
	}
	$id = !empty($app['id']) ? (string)$app['id'] : apprepos_id_from($bundle.'|'.$version.'|'.$downloadURL);

	return array(
		'id' => $id,
		'name' => (string)($app['name'] ?? ($bundle !== '' ? $bundle : 'Untitled')),
		'bundleIdentifier' => $bundle,
		'developerName' => (string)($app['developerName'] ?? $app['developer'] ?? ''),
		'subtitle' => (string)($app['subtitle'] ?? ''),
		'localizedDescription' => substr((string)($app['localizedDescription'] ?? $app['versionDescription'] ?? $app['description'] ?? ''), 0, 8000),
		'versionDescription' => substr((string)($app['versionDescription'] ?? ''), 0, 4000),
		'iconURL' => (string)($app['iconURL'] ?? ''),
		'version' => $version,
		'versionDate' => $versionDate,
		'size' => $size,
		'downloadURL' => $downloadURL,
		'featured' => !empty($app['featured']),
		'screenshotURLs' => $shots,
		'tintColor' => (string)($app['tintColor'] ?? ''),
	);
}

function apprepos_normalize_source($json, $sourceUrl)
{
	$appsIn = isset($json['apps']) && is_array($json['apps']) ? $json['apps'] : array();
	$apps = array();
	foreach ($appsIn as $app) {
		$apps[] = apprepos_normalize_app($app);
	}
	$meta = isset($json['META']) && is_array($json['META']) ? $json['META'] : array();
	return array(
		'name' => (string)($json['name'] ?? $meta['repoName'] ?? 'Untitled source'),
		'identifier' => (string)($json['identifier'] ?? apprepos_id_from($sourceUrl)),
		'sourceURL' => $sourceUrl,
		'website' => (string)($json['website'] ?? ''),
		'subtitle' => (string)($json['subtitle'] ?? ''),
		'description' => substr((string)($json['description'] ?? ''), 0, 4000),
		'iconURL' => (string)($json['iconURL'] ?? $json['sourceicon'] ?? $meta['repoIcon'] ?? ''),
		'appCount' => count($apps),
		'apps' => $apps,
	);
}

function apprepos_is_private_ip($ip)
{
	if (!$ip) {
		return true;
	}
	if (filter_var($ip, FILTER_VALIDATE_IP, FILTER_FLAG_IPV4)) {
		$p = array_map('intval', explode('.', $ip));
		if ($p[0] === 10 || $p[0] === 127 || $p[0] === 0) {
			return true;
		}
		if ($p[0] === 169 && $p[1] === 254) {
			return true;
		}
		if ($p[0] === 172 && $p[1] >= 16 && $p[1] <= 31) {
			return true;
		}
		if ($p[0] === 192 && $p[1] === 168) {
			return true;
		}
		if ($p[0] === 100 && $p[1] >= 64 && $p[1] <= 127) {
			return true;
		}
		return false;
	}
	if (filter_var($ip, FILTER_VALIDATE_IP, FILTER_FLAG_IPV6)) {
		$v = strtolower($ip);
		if ($v === '::1' || strpos($v, 'fc') === 0 || strpos($v, 'fd') === 0 || strpos($v, 'fe80') === 0) {
			return true;
		}
		return false;
	}
	return true;
}

function apprepos_assert_public_url($raw)
{
	$raw = trim((string)$raw);
	$parts = @parse_url($raw);
	if (!$parts || empty($parts['scheme']) || empty($parts['host'])) {
		throw new Exception('invalid URL');
	}
	$scheme = strtolower($parts['scheme']);
	if ($scheme !== 'http' && $scheme !== 'https') {
		throw new Exception('only http/https URLs allowed');
	}
	if (!empty($parts['user']) || !empty($parts['pass'])) {
		throw new Exception('URLs with credentials are not allowed');
	}
	$host = $parts['host'];
	if ($host === 'localhost' || preg_match('/\.localhost$/i', $host)) {
		throw new Exception('localhost blocked');
	}
	if (filter_var($host, FILTER_VALIDATE_IP)) {
		if (apprepos_is_private_ip($host)) {
			throw new Exception('private IP blocked');
		}
	} else {
		$records = @dns_get_record($host, DNS_A + DNS_AAAA);
		if (!$records) {
			$ip = @gethostbyname($host);
			if ($ip === $host || apprepos_is_private_ip($ip)) {
				throw new Exception('DNS lookup failed or private');
			}
		} else {
			foreach ($records as $rec) {
				$ip = $rec['ip'] ?? $rec['ipv6'] ?? '';
				if ($ip && apprepos_is_private_ip($ip)) {
					throw new Exception('private IP blocked');
				}
			}
		}
	}
	return $raw;
}

function apprepos_fetch_source($sourceUrl)
{
	$safe = apprepos_assert_public_url($sourceUrl);
	$max = 32 * 1024 * 1024;
	$ch = curl_init($safe);
	curl_setopt_array($ch, array(
		CURLOPT_RETURNTRANSFER => true,
		CURLOPT_FOLLOWLOCATION => true,
		CURLOPT_MAXREDIRS => 5,
		CURLOPT_TIMEOUT => 60,
		CURLOPT_CONNECTTIMEOUT => 15,
		CURLOPT_USERAGENT => 'warez.skin-repo-discovery/1.0',
		CURLOPT_HTTPHEADER => array('Accept: application/json, text/plain, */*'),
		CURLOPT_PROTOCOLS => CURLPROTO_HTTP | CURLPROTO_HTTPS,
		CURLOPT_REDIR_PROTOCOLS => CURLPROTO_HTTP | CURLPROTO_HTTPS,
	));
	$body = curl_exec($ch);
	$code = (int)curl_getinfo($ch, CURLINFO_HTTP_CODE);
	$err = curl_error($ch);
	curl_close($ch);
	if ($body === false) {
		throw new Exception($err !== '' ? $err : 'fetch failed');
	}
	if ($code < 200 || $code >= 300) {
		throw new Exception('fetch failed ('.$code.')');
	}
	if (strlen($body) > $max) {
		throw new Exception('source too large');
	}
	$json = json_decode($body, true);
	if (!is_array($json)) {
		throw new Exception('source is not valid JSON');
	}
	return apprepos_normalize_source($json, $safe);
}

function apprepos_public_repo($repo, $withApps = false)
{
	$out = array(
		'id' => $repo['id'],
		'name' => $repo['name'],
		'identifier' => $repo['identifier'],
		'sourceURL' => $repo['sourceURL'],
		'website' => $repo['website'] ?? '',
		'subtitle' => $repo['subtitle'] ?? '',
		'description' => $repo['description'] ?? '',
		'iconURL' => $repo['iconURL'] ?? '',
		'appCount' => $repo['appCount'] ?? count($repo['apps'] ?? array()),
		'addedAt' => $repo['addedAt'] ?? null,
		'refreshedAt' => $repo['refreshedAt'] ?? null,
		'lastError' => $repo['lastError'] ?? null,
	);
	if ($withApps) {
		$out['apps'] = array();
		foreach ($repo['apps'] ?? array() as $app) {
			$out['apps'][] = apprepos_normalize_app($app);
		}
	}
	return $out;
}

function apprepos_list_repos($withApps = false)
{
	$data = apprepos_read();
	$out = array();
	foreach ($data['repos'] as $repo) {
		$out[] = apprepos_public_repo($repo, $withApps);
	}
	return $out;
}

function apprepos_get_repo($id)
{
	$data = apprepos_read();
	foreach ($data['repos'] as $repo) {
		if (($repo['id'] ?? '') === $id) {
			return apprepos_public_repo($repo, true);
		}
	}
	return null;
}

function apprepos_get_app($repoId, $appId)
{
	$data = apprepos_read();
	foreach ($data['repos'] as $repo) {
		if (($repo['id'] ?? '') !== $repoId) {
			continue;
		}
		foreach ($repo['apps'] ?? array() as $app) {
			$full = apprepos_normalize_app($app);
			if ($full['id'] === $appId) {
				$full['repoId'] = $repo['id'];
				$full['repoName'] = $repo['name'];
				$full['sourceURL'] = $repo['sourceURL'];
				return $full;
			}
		}
	}
	return null;
}

function apprepos_add_repo($sourceUrl)
{
	$normalized = apprepos_fetch_source($sourceUrl);
	$data = apprepos_read();
	foreach ($data['repos'] as &$repo) {
		if (($repo['sourceURL'] ?? '') === $normalized['sourceURL'] || ($repo['identifier'] ?? '') === $normalized['identifier']) {
			$repo = array_merge($repo, $normalized, array(
				'refreshedAt' => (int)(microtime(true) * 1000),
				'lastError' => null,
			));
			apprepos_write($data);
			return apprepos_public_repo($repo, true);
		}
	}
	unset($repo);
	$repo = array_merge($normalized, array(
		'id' => apprepos_id_from($normalized['sourceURL']),
		'addedAt' => (int)(microtime(true) * 1000),
		'refreshedAt' => (int)(microtime(true) * 1000),
		'lastError' => null,
	));
	array_unshift($data['repos'], $repo);
	apprepos_write($data);
	return apprepos_public_repo($repo, true);
}

function apprepos_refresh_repo($id)
{
	$data = apprepos_read();
	foreach ($data['repos'] as &$repo) {
		if (($repo['id'] ?? '') !== $id) {
			continue;
		}
		try {
			$normalized = apprepos_fetch_source($repo['sourceURL']);
			$repo = array_merge($repo, $normalized, array(
				'refreshedAt' => (int)(microtime(true) * 1000),
				'lastError' => null,
			));
			apprepos_write($data);
			return apprepos_public_repo($repo, true);
		} catch (Exception $e) {
			$repo['lastError'] = $e->getMessage();
			$repo['refreshedAt'] = (int)(microtime(true) * 1000);
			apprepos_write($data);
			throw $e;
		}
	}
	return null;
}

function apprepos_remove_repo($id)
{
	$data = apprepos_read();
	$before = count($data['repos']);
	$data['repos'] = array_values(array_filter($data['repos'], function ($r) use ($id) {
		return ($r['id'] ?? '') !== $id;
	}));
	apprepos_write($data);
	return count($data['repos']) !== $before;
}

function apprepos_search_apps($query = '', $limit = 200)
{
	$q = strtolower(trim((string)$query));
	$limit = max(1, min(500, (int)$limit));
	$hits = array();
	foreach (apprepos_read()['repos'] as $repo) {
		foreach ($repo['apps'] ?? array() as $app) {
			$full = apprepos_normalize_app($app);
			$hay = strtolower(implode(' ', array(
				$full['name'], $full['bundleIdentifier'], $full['developerName'], $full['subtitle'], $repo['name'] ?? '',
			)));
			if ($q !== '' && strpos($hay, $q) === false) {
				continue;
			}
			$hits[] = array(
				'id' => $full['id'],
				'name' => $full['name'],
				'bundleIdentifier' => $full['bundleIdentifier'],
				'developerName' => $full['developerName'],
				'subtitle' => $full['subtitle'],
				'iconURL' => $full['iconURL'],
				'version' => $full['version'],
				'size' => $full['size'],
				'featured' => $full['featured'],
				'repoId' => $repo['id'],
				'repoName' => $repo['name'],
				'sourceURL' => $repo['sourceURL'],
			);
			if (count($hits) >= $limit) {
				usort($hits, function ($a, $b) {
					return strcasecmp($a['name'], $b['name']);
				});
				return $hits;
			}
		}
	}
	usort($hits, function ($a, $b) {
		return strcasecmp($a['name'], $b['name']);
	});
	return $hits;
}

function apprepos_stats()
{
	$repos = apprepos_read()['repos'];
	$apps = 0;
	$errors = 0;
	foreach ($repos as $r) {
		$apps += count($r['apps'] ?? array());
		if (!empty($r['lastError'])) {
			$errors++;
		}
	}
	return array(
		'repos' => count($repos),
		'apps' => $apps,
		'errors' => $errors,
	);
}

$plugins->add_hook('portal_start', 'apprepos_portal_start');
$plugins->add_hook('portal_end', 'apprepos_portal_end', 50); // after warezskin portal_blocks

function apprepos_portal_start()
{
	global $mybb;
	if (!apprepos_enabled()) {
		return;
	}
	// App details via portal.php?action=app&repo=&app=
	// NOTE: do not use query key "id" — MyBB coerces input[id] to int.
	if ($mybb->get_input('action') === 'app') {
		apprepos_render_app_page();
	}
}

function apprepos_portal_end()
{
	global $mybb, $yh_forum_stats, $yh_apprepos;

	if (!apprepos_enabled()) {
		return;
	}

	$stats = apprepos_stats();
	$bburl = $mybb->settings['bburl'];
	$can = apprepos_can_manage() ? '1' : '0';
	$key = $mybb->post_code;

	$yh_apprepos = apprepos_render_portal_html($stats, $bburl, $can, $key);
	// Prefer app repo viewer over old forum-stats portal block
	$yh_forum_stats = $yh_apprepos;
}

function apprepos_render_portal_html($stats, $bburl, $canManage, $postKey)
{
	$api = htmlspecialchars_uni($bburl.'/apprepos.php');
	$sample = htmlspecialchars_uni($bburl.'/sample-source.json');
	$sRepos = (int)$stats['repos'];
	$sApps = (int)$stats['apps'];
	$sErr = (int)$stats['errors'];
	$manageNote = $canManage === '1'
		? 'Logged-in members can index / refresh / remove sources.'
		: 'Browse & search are open. Log in to index new sources.';

	return '
<div class="yh-apprepos" id="yh-apprepos" data-api="'.$api.'" data-can-manage="'.$canManage.'" data-key="'.htmlspecialchars_uni($postKey).'" data-sample="'.$sample.'">
	<div class="yh-ar-hero">
		<h1 class="yh-ar-brand">IPA repo<span class="yh-ar-dot">.</span>discovery</h1>
		<p class="yh-ar-tag">Index AltStore-style IPA sources, search apps across repos, and open each listing. '.$manageNote.'</p>
		<div class="yh-ar-stats" role="group" aria-label="Repository stats">
			<div class="yh-ar-stat"><strong id="yh_ar_stat_repos">'.$sRepos.'</strong><span>'.($sRepos === 1 ? 'repo' : 'repos').'</span></div>
			<div class="yh-ar-stat"><strong id="yh_ar_stat_apps">'.$sApps.'</strong><span>'.($sApps === 1 ? 'app' : 'apps').'</span></div>
			<div class="yh-ar-stat"><strong id="yh_ar_stat_hits">—</strong><span>hits</span></div>
			<div class="yh-ar-stat"><strong id="yh_ar_stat_errors">'.$sErr.'</strong><span>'.($sErr === 1 ? 'error' : 'errors').'</span></div>
		</div>
	</div>

	<div class="yh-ar-grid">
		<section class="yh-ar-panel yh-ar-span-12" id="discover">
			<div class="yh-ar-head"><h2>Discover apps</h2><span class="yh-ar-meta" id="yh_ar_search_meta">tap an app for details</span></div>
			<div class="yh-ar-searchrow">
				<input type="search" id="yh_ar_q" class="yh-ar-input" placeholder="Search name, bundle ID, developer, or repo" autocomplete="off" />
				<button type="button" class="yh-ar-btn yh-ar-btn-primary" id="yh_ar_search">Search</button>
				<button type="button" class="yh-ar-btn" id="yh_ar_clear">Clear</button>
			</div>
			<div id="yh_ar_apps_list" class="yh-ar-apps"></div>
		</section>

		<section class="yh-ar-panel yh-ar-span-8" id="repos">
			<div class="yh-ar-head"><h2>Indexed repos</h2></div>
			<div id="yh_ar_repos_list" class="yh-ar-repos">Loading…</div>
		</section>

		<section class="yh-ar-panel yh-ar-span-4" id="add">
			<div class="yh-ar-head"><h2>Add IPA source</h2></div>
			<label class="yh-ar-label" for="yh_ar_source">Source JSON URL</label>
			<input type="url" id="yh_ar_source" class="yh-ar-input" placeholder="https://example.com/apps.json" />
			<div class="yh-ar-searchrow">
				<button type="button" class="yh-ar-btn yh-ar-btn-primary" id="yh_ar_add">Index source</button>
				<button type="button" class="yh-ar-btn" id="yh_ar_sample">Load sample</button>
			</div>
			<div class="yh-ar-msg" id="yh_ar_msg"></div>
			<p class="yh-ar-hint">Expects AltStore-compatible JSON (<code>name</code>, <code>identifier</code>, <code>apps[]</code>). Private/localhost URLs are blocked.</p>
		</section>
	</div>
</div>
<script src="'.htmlspecialchars_uni($bburl).'/jscripts/apprepos.js?ver=4"></script>';
}

function apprepos_render_app_page()
{
	global $mybb, $headerinclude, $header, $footer, $templates;

	$repoId = $mybb->get_input('repo');
	$appId = $mybb->get_input('app');
	if ($appId === '' || $appId === '0') {
		// back-compat if anything still passes appid=
		$appId = $mybb->get_input('appid');
	}
	$app = apprepos_get_app($repoId, $appId);
	if (!$app) {
		error('That app listing is missing or the repo was removed.');
	}

	add_breadcrumb('Portal', 'portal.php');
	add_breadcrumb($app['name']);

	$name = htmlspecialchars_uni($app['name']);
	$bundle = htmlspecialchars_uni($app['bundleIdentifier'] ?: '—');
	$ver = htmlspecialchars_uni($app['version'] ? 'v'.$app['version'] : '—');
	$size = htmlspecialchars_uni(apprepos_format_bytes($app['size']));
	$updated = htmlspecialchars_uni($app['versionDate'] ?: '—');
	$dev = htmlspecialchars_uni($app['developerName'] ?: '—');
	$repoName = htmlspecialchars_uni($app['repoName'] ?: 'Source');
	$source = htmlspecialchars_uni($app['sourceURL'] ?: '#');
	$desc = nl2br(htmlspecialchars_uni($app['localizedDescription'] ?: 'No description.'));
	$icon = $app['iconURL']
		? '<img class="yh-ar-detail-icon" src="'.htmlspecialchars_uni($app['iconURL']).'" alt="" referrerpolicy="no-referrer" />'
		: '<div class="yh-ar-detail-icon yh-ar-detail-icon-empty" aria-hidden="true"></div>';
	$dl = '';
	if (!empty($app['downloadURL'])) {
		$dl = '<a class="yh-ar-btn yh-ar-btn-primary yh-ar-btn-lg" href="'.htmlspecialchars_uni($app['downloadURL']).'" target="_blank" rel="noopener noreferrer">Open IPA URL</a>';
	}
	$shots = '';
	if (!empty($app['screenshotURLs'])) {
		foreach ($app['screenshotURLs'] as $u) {
			$u = htmlspecialchars_uni($u);
			$shots .= '<a class="yh-ar-shot" href="'.$u.'" target="_blank" rel="noopener noreferrer"><img src="'.$u.'" alt="" loading="lazy" referrerpolicy="no-referrer" /></a>';
		}
		$shots = '<div class="yh-ar-panel"><div class="yh-ar-head"><h2>Screenshots</h2></div><div class="yh-ar-shots">'.$shots.'</div></div>';
	}

	$content = '
<div class="yh-apprepos yh-ar-detail">
	<a class="yh-ar-back" href="'.$mybb->settings['bburl'].'/portal.php#discover">← Back to discovery</a>
	<div class="yh-ar-panel yh-ar-detail-hero">
		<div class="yh-ar-detail-top">
			'.$icon.'
			<div class="yh-ar-detail-copy">
				<h1>'.$name.'</h1>
				<div class="yh-ar-meta">'.$bundle.'</div>
				<div class="yh-ar-detail-actions">'.$dl.'
					<a class="yh-ar-btn yh-ar-btn-lg" href="'.$mybb->settings['bburl'].'/portal.php#discover">All apps</a>
				</div>
			</div>
		</div>
	</div>
	<div class="yh-ar-chips">
		<div class="yh-ar-chip"><span>Version</span><strong>'.$ver.'</strong></div>
		<div class="yh-ar-chip"><span>Size</span><strong>'.$size.'</strong></div>
		<div class="yh-ar-chip"><span>Updated</span><strong>'.$updated.'</strong></div>
		<div class="yh-ar-chip"><span>Developer</span><strong>'.$dev.'</strong></div>
	</div>
	'.$shots.'
	<div class="yh-ar-detail-grid">
		<div class="yh-ar-panel"><div class="yh-ar-head"><h2>About</h2></div><div class="yh-ar-desc">'.$desc.'</div></div>
		<div class="yh-ar-panel"><div class="yh-ar-head"><h2>Source</h2></div>
			<div class="yh-ar-source-name">'.$repoName.'</div>
			<a class="yh-ar-source-url" href="'.$source.'" target="_blank" rel="noopener noreferrer">'.$source.'</a>
		</div>
	</div>
</div>';

	output_page('<html><head><title>'.$name.' · '.$mybb->settings['bbname'].'</title>'.$headerinclude.'</head><body>'.$header.$content.$footer.'</body></html>');
	exit;
}
