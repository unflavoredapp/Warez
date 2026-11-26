<?php
/**
 * Deploy warez.skin Xferno-style theme to a local MyBB install.
 * Run on the VPS: php /path/to/deploy.php
 */
define('IN_MYBB', 1);
define('MYBB_ROOT', '/var/www/warez.skin/');
chdir(MYBB_ROOT);
require MYBB_ROOT . 'inc/init.php';
require_once MYBB_ROOT . 'admin/inc/functions_themes.php';
require_once MYBB_ROOT . 'inc/functions_rebuild.php';

$src = '/opt/warez-theme';
if (!is_dir($src)) {
	$src = dirname(__FILE__);
}

echo "Source: $src\n";

// 1) CSS
$cssPath = $src . '/warez.css';
if (!is_file($cssPath)) {
	fwrite(STDERR, "Missing warez.css\n");
	exit(1);
}
$css = file_get_contents($cssPath);
@mkdir(MYBB_ROOT . 'cache/themes/theme3', 0755, true);
file_put_contents(MYBB_ROOT . 'cache/themes/theme3/warez.css', $css);
$db->update_query('themestylesheets', array(
	'stylesheet' => $db->escape_string($css),
	'lastmodified' => TIME_NOW,
	'cachefile' => 'warez.css',
	'attachedto' => '',
), "name='warez.css' AND tid=3");

// 2) Plugins
@mkdir(MYBB_ROOT . 'inc/plugins', 0755, true);
@mkdir(MYBB_ROOT . 'admin/modules/tools', 0755, true);
copy($src . '/plugin/warezskin.php', MYBB_ROOT . 'inc/plugins/warezskin.php');
if (is_file($src . '/plugin/bits.php')) {
	copy($src . '/plugin/bits.php', MYBB_ROOT . 'inc/plugins/bits.php');
}
if (is_file($src . '/plugin/changelogbot.php')) {
	copy($src . '/plugin/changelogbot.php', MYBB_ROOT . 'inc/plugins/changelogbot.php');
}
if (is_file($src . '/plugin/template_conditionals.php')) {
	copy($src . '/plugin/template_conditionals.php', MYBB_ROOT . 'inc/plugins/template_conditionals.php');
}
if (is_file($src . '/plugin/panelbg.php')) {
	copy($src . '/plugin/panelbg.php', MYBB_ROOT . 'inc/plugins/panelbg.php');
}
if (is_file($src . '/admin/modules/tools/changelogbot.php')) {
	copy($src . '/admin/modules/tools/changelogbot.php', MYBB_ROOT . 'admin/modules/tools/changelogbot.php');
}
if (is_file($src . '/bits-page.php')) {
	copy($src . '/bits-page.php', MYBB_ROOT . 'bits.php');
	@chmod(MYBB_ROOT . 'bits.php', 0644);
}
if (is_file($src . '/post-changelog.php')) {
	copy($src . '/post-changelog.php', '/opt/warez-theme/post-changelog.php');
	@chmod('/opt/warez-theme/post-changelog.php', 0755);
}

$active = $cache->read('plugins');
if (!is_array($active)) {
	$active = array('active' => array(), 'installed' => array());
}
$active['active']['warezskin'] = 'warezskin';
$active['installed']['warezskin'] = 'warezskin';

// Install + activate Bits currency plugin
require_once MYBB_ROOT . 'inc/plugins/bits.php';
if (!bits_is_installed()) {
	bits_install();
	echo "Bits plugin installed\n";
} else {
	bits_insert_settings();
	echo "Bits plugin already installed (settings refreshed)\n";
}
bits_activate();
$active['active']['bits'] = 'bits';
$active['installed']['bits'] = 'bits';

// Install + activate Changelog Bot
require_once MYBB_ROOT . 'inc/plugins/changelogbot.php';
if (!changelogbot_is_installed()) {
	changelogbot_install();
	echo "Changelog Bot installed\n";
} else {
	changelogbot_insert_settings();
	changelogbot_activate();
	echo "Changelog Bot already installed (settings refreshed)\n";
}
$active['active']['changelogbot'] = 'changelogbot';
$active['installed']['changelogbot'] = 'changelogbot';

// Template Conditionals (must be active for <if> in templates)
$active['active']['template_conditionals'] = 'template_conditionals';
$active['installed']['template_conditionals'] = 'template_conditionals';

// Panel Background (GIF/image behind header account box)
require_once MYBB_ROOT . 'inc/plugins/panelbg.php';
if (!panelbg_is_installed()) {
	panelbg_install();
	echo "Panel Background plugin installed\n";
} else {
	panelbg_insert_settings();
	echo "Panel Background plugin already installed (settings refreshed)\n";
}
panelbg_activate();
$active['active']['panelbg'] = 'panelbg';
$active['installed']['panelbg'] = 'panelbg';
@mkdir(MYBB_ROOT . 'uploads/panelbg', 0755, true);

$cache->update('plugins', $active);
echo "Plugins enabled (warezskin + bits + changelogbot + template_conditionals + panelbg)\n";

// 3) Template set
$query = $db->simple_select('templatesets', 'sid', "title='warez.skin'");
$sid = (int)$db->fetch_field($query, 'sid');
if (!$sid) {
	$db->insert_query('templatesets', array('title' => 'warez.skin'));
	$sid = (int)$db->insert_id();
	echo "Created templateset sid=$sid\n";
} else {
	echo "Using templateset sid=$sid\n";
}

$templatesDir = $src . '/templates';
$files = glob($templatesDir . '/*.html');
foreach ($files as $file) {
	$title = basename($file, '.html');
	$template = file_get_contents($file);
	$template = str_replace("\r\n", "\n", $template);
	$exists = $db->simple_select('templates', 'tid', "title='" . $db->escape_string($title) . "' AND sid={$sid}");
	$tidrow = $db->fetch_array($exists);
	$data = array(
		'title' => $db->escape_string($title),
		'template' => $db->escape_string($template),
		'sid' => $sid,
		'version' => '1821',
		'dateline' => TIME_NOW,
	);
	if ($tidrow) {
		$db->update_query('templates', $data, 'tid=' . (int)$tidrow['tid']);
		echo "Updated template $title\n";
	} else {
		$db->insert_query('templates', $data);
		echo "Inserted template $title\n";
	}
}

// Point theme 3 at this templateset
$theme = $db->fetch_array($db->simple_select('themes', '*', 'tid=3'));
$props = my_unserialize($theme['properties']);
if (!is_array($props)) {
	$props = array();
}
$props['templateset'] = $sid;
unset($props['inherited']['templateset']);
$db->update_query('themes', array(
	'properties' => $db->escape_string(my_serialize($props)),
	'def' => 1,
	'allowedgroups' => 'all',
	'name' => 'warez.skin',
), 'tid=3');
$db->update_query('themes', array('def' => 0), 'tid<>3');

update_theme_stylesheet_list(3, false, true);
$cache->update_default_theme();

// 4) Forum structure (only when --reset-forums is passed)
$resetForums = in_array('--reset-forums', $argv ?? array(), true);
$forumCount = (int)$db->fetch_field($db->simple_select('forums', 'COUNT(*) AS c'), 'c');
if (!$resetForums && $forumCount > 0) {
	echo "Keeping existing forums ($forumCount). Pass --reset-forums to rebuild.\n";
	$cache->update_forums();
	$cache->update_forumpermissions();
	$cache->update_stats();
	$cache->update_default_theme();
	echo "DONE\n";
	exit(0);
}

echo "Rebuilding forums...\n";
$db->write_query("DELETE FROM mybb_forums");
$db->write_query("ALTER TABLE mybb_forums AUTO_INCREMENT=1");

function wz_forum($db, $name, $desc, $type, $pid, $order, $extra = array())
{
	$row = array_merge(array(
		'name' => $db->escape_string($name),
		'description' => $db->escape_string($desc),
		'linkto' => '',
		'type' => $type,
		'pid' => (int)$pid,
		'parentlist' => '',
		'disporder' => (int)$order,
		'active' => 1,
		'open' => 1,
		'allowhtml' => 0,
		'allowmycode' => 1,
		'allowsmilies' => 1,
		'allowimgcode' => 1,
		'allowvideocode' => 1,
		'allowpicons' => 1,
		'allowtratings' => 0,
		'usepostcounts' => 1,
		'usethreadcounts' => 1,
		'requireprefix' => 0,
		'password' => '',
		'showinjump' => 1,
		'style' => 0,
		'overridestyle' => 0,
		'rulestype' => 0,
		'rulestitle' => '',
		'rules' => '',
		'unapprovedthreads' => 0,
		'unapprovedposts' => 0,
		'deletedthreads' => 0,
		'deletedposts' => 0,
		'threads' => 0,
		'posts' => 0,
		'lastpost' => 0,
		'lastposter' => '',
		'lastposteruid' => 0,
		'lastposttid' => 0,
		'lastpostsubject' => '',
		'defaultdatecut' => 0,
		'defaultsortby' => '',
		'defaultsortorder' => '',
	), $extra);
	$db->insert_query('forums', $row);
	return (int)$db->insert_id();
}

$general = wz_forum($db, 'General', 'Main community boards', 'c', 0, 1);
$market = wz_forum($db, 'Market', 'Buys, sells, and requests', 'c', 0, 2);

$ann = wz_forum($db, 'Announcements', 'News, rules, and official updates', 'f', $general, 1);
wz_forum($db, 'Changelog', '', 'f', $ann, 1);
wz_forum($db, 'Support', '', 'f', $ann, 2);
wz_forum($db, 'Suggestions', '', 'f', $ann, 3);

wz_forum($db, 'General Chat', 'Hang out and talk about anything', 'f', $general, 2);
$money = wz_forum($db, 'Releases', 'Share and discuss releases', 'f', $general, 3);
wz_forum($db, 'iOS', '', 'f', $money, 1);
wz_forum($db, 'Android', '', 'f', $money, 2);
wz_forum($db, 'Tools', '', 'f', $money, 3);

wz_forum($db, 'Introductions', 'New here? Say hi', 'f', $general, 4);
$free = wz_forum($db, 'Freebies', 'Giveaways and free drops', 'f', $general, 5);
wz_forum($db, 'Giveaways', '', 'f', $free, 1);
wz_forum($db, 'Requests', '', 'f', $free, 2);
wz_forum($db, 'Off-topic', 'Memes, chaos, and nonsense', 'f', $general, 6);

$mp = wz_forum($db, 'Marketplace', 'Trades and listings', 'f', $market, 1);
wz_forum($db, 'Selling', '', 'f', $mp, 1);
wz_forum($db, 'Buying', '', 'f', $mp, 2);
wz_forum($db, 'Price Checks', '', 'f', $mp, 3);
wz_forum($db, 'Wants', 'Looking for something specific', 'f', $market, 2);

// Fix parentlist for all forums
$query = $db->simple_select('forums', 'fid,pid', '', array('order_by' => 'fid', 'order_dir' => 'ASC'));
$parents = array();
while ($f = $db->fetch_array($query)) {
	$parents[(int)$f['fid']] = (int)$f['pid'];
}
foreach ($parents as $fid => $pid) {
	$list = array($fid);
	$walk = $pid;
	$guard = 0;
	while ($walk && $guard++ < 20) {
		array_unshift($list, $walk);
		$walk = isset($parents[$walk]) ? $parents[$walk] : 0;
	}
	$db->update_query('forums', array('parentlist' => implode(',', $list)), 'fid=' . $fid);
}

// Default permissions for all registered + guests view
$db->write_query("DELETE FROM mybb_forumpermissions");
// MyBB uses canview etc. - rely on default usergroup perms when no forum overrides

$cache->update_forums();
$cache->update_forumpermissions();
$cache->update_stats();
$cache->update_default_theme();

// Clear template cache files
foreach (glob(MYBB_ROOT . 'cache/themes/theme3/*.php') ?: array() as $f) {
	@unlink($f);
}
@unlink(MYBB_ROOT . 'cache/datacache.php');

echo "DONE\n";
