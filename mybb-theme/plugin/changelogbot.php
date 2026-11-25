<?php
/**
 * Changelog Bot — bot account posts site updates into the Changelog forum
 */
if (!defined('IN_MYBB')) {
	die('Direct initialization of this file is not allowed.');
}

function changelogbot_info()
{
	return array(
		'name' => 'Changelog Bot',
		'description' => 'Bot account that posts warez.skin changes into the Changelog forum thread.',
		'website' => 'https://warez.skin',
		'author' => 'warez.skin',
		'version' => '1.0',
		'compatibility' => '18*',
	);
}

function changelogbot_install()
{
	global $db, $cache;

	changelogbot_insert_settings();

	$bot = changelogbot_ensure_bot();
	$thread = changelogbot_ensure_thread($bot);

	if ($bot && $thread) {
		changelogbot_post(
			"[b]WAREZBOT online.[/b]\n\nI will post every site change into this thread.\n\nStaff can publish updates from [b]Admin CP → Tools → Changelog Bot[/b], or via deploy.",
			array(
				'uid' => (int)$bot['uid'],
				'username' => $bot['username'],
				'tid' => (int)$thread['tid'],
				'fid' => (int)$thread['fid'],
			)
		);
	}

	$cache->update_forums();
	$cache->update_stats();
}

function changelogbot_is_installed()
{
	global $db;
	$query = $db->simple_select('settings', 'sid', "name='changelogbot_enabled'", array('limit' => 1));
	return (bool)$db->fetch_field($query, 'sid');
}

function changelogbot_uninstall()
{
	global $db;
	$db->delete_query('settings', "name LIKE 'changelogbot_%'");
	$db->delete_query('settinggroups', "name='changelogbot'");
	rebuild_settings();
}

function changelogbot_activate()
{
	changelogbot_insert_settings();
	changelogbot_ensure_bot();
	changelogbot_ensure_thread();
}

function changelogbot_deactivate()
{
}

function changelogbot_insert_settings()
{
	global $db;

	$query = $db->simple_select('settinggroups', 'gid', "name='changelogbot'", array('limit' => 1));
	$gid = (int)$db->fetch_field($query, 'gid');
	if (!$gid) {
		$gid = (int)$db->insert_query('settinggroups', array(
			'name' => 'changelogbot',
			'title' => 'Changelog Bot',
			'description' => 'Bot that posts site changes into the Changelog forum.',
			'disporder' => 81,
			'isdefault' => 0,
		));
	}

	$settings = array(
		'changelogbot_enabled' => array('Enable Changelog Bot', 'Master switch for bot posts.', 'yesno', '1', 1),
		'changelogbot_username' => array('Bot username', 'Account name used for changelog posts.', 'text', 'WAREZBOT', 2),
		'changelogbot_uid' => array('Bot UID', 'Filled automatically. Leave 0 to auto-create.', 'numeric', '0', 3),
		'changelogbot_fid' => array('Changelog forum ID', 'Forum where the bot posts (default Changelog = 4).', 'numeric', '4', 4),
		'changelogbot_tid' => array('Changelog thread ID', 'Filled automatically with the master changelog thread.', 'numeric', '0', 5),
		'changelogbot_title' => array('Master thread title', 'Created once if no thread ID is set.', 'text', 'Site Changelog', 6),
	);

	foreach ($settings as $name => $meta) {
		$exists = $db->simple_select('settings', 'sid', "name='".$db->escape_string($name)."'", array('limit' => 1));
		if ($db->num_rows($exists)) {
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

function changelogbot_setting($key, $default = '')
{
	global $mybb;
	$name = 'changelogbot_'.$key;
	if (isset($mybb->settings[$name]) && $mybb->settings[$name] !== '') {
		return $mybb->settings[$name];
	}
	return $default;
}

function changelogbot_update_setting($name, $value)
{
	global $db, $mybb;
	$db->update_query('settings', array('value' => $db->escape_string((string)$value)), "name='".$db->escape_string($name)."'");
	$mybb->settings[$name] = (string)$value;
	rebuild_settings();
}

/**
 * Create the bot member if missing. Returns user row.
 */
function changelogbot_ensure_bot()
{
	global $db, $mybb, $cache;

	$uid = (int)changelogbot_setting('uid', 0);
	if ($uid > 0) {
		$user = get_user($uid);
		if ($user) {
			return $user;
		}
	}

	$username = trim((string)changelogbot_setting('username', 'WAREZBOT'));
	if ($username === '') {
		$username = 'WAREZBOT';
	}

	$query = $db->simple_select('users', '*', "username='".$db->escape_string($username)."'", array('limit' => 1));
	$user = $db->fetch_array($query);
	if ($user) {
		changelogbot_update_setting('changelogbot_uid', (int)$user['uid']);
		changelogbot_update_setting('changelogbot_username', $user['username']);
		return $user;
	}

	require_once MYBB_ROOT.'inc/datahandlers/user.php';
	$userhandler = new UserDataHandler('insert');

	$password = random_str(24);
	$email_local = strtolower(preg_replace('/[^a-z0-9]+/i', '', $username));
	if ($email_local === '') {
		$email_local = 'warezbot';
	}

	$new = array(
		'username' => $username,
		'password' => $password,
		'password2' => $password,
		'email' => $email_local.'@warez.skin',
		'email2' => $email_local.'@warez.skin',
		'usergroup' => 6, // Moderators — can post in locked/announcement-style boards if needed
		'displaygroup' => 6,
		'regdate' => TIME_NOW,
		'lastactive' => TIME_NOW,
		'lastvisit' => TIME_NOW,
		'website' => $mybb->settings['bburl'],
		'usertitle' => 'Site Changelog Bot',
		'signature' => 'Automated changelog bot for warez.skin',
		'allownotices' => 0,
		'hideemail' => 1,
		'receivepms' => 0,
		'pmnotice' => 0,
	);

	$userhandler->set_data($new);
	if (!$userhandler->validate_user()) {
		// Fall back to admin group if moderator validation fails for any reason
		$new['usergroup'] = 4;
		$new['displaygroup'] = 4;
		$userhandler = new UserDataHandler('insert');
		$userhandler->set_data($new);
		if (!$userhandler->validate_user()) {
			return false;
		}
	}

	$user = $userhandler->insert_user();
	if (empty($user['uid'])) {
		return false;
	}

	// Make sure bot looks staff-ish
	$db->update_query('users', array(
		'usertitle' => $db->escape_string('Site Changelog Bot'),
		'additionalgroups' => '',
	), 'uid='.(int)$user['uid']);

	changelogbot_update_setting('changelogbot_uid', (int)$user['uid']);
	changelogbot_update_setting('changelogbot_username', $user['username']);

	$cache->update_stats();
	return get_user((int)$user['uid']);
}

/**
 * Ensure the master changelog thread exists in the Changelog forum.
 */
function changelogbot_ensure_thread($bot = null)
{
	global $db, $mybb;

	$tid = (int)changelogbot_setting('tid', 0);
	if ($tid > 0) {
		$query = $db->simple_select('threads', '*', 'tid='.$tid, array('limit' => 1));
		$thread = $db->fetch_array($query);
		if ($thread) {
			return $thread;
		}
	}

	$fid = (int)changelogbot_setting('fid', 4);
	$forum = get_forum($fid);
	if (!$forum || $forum['type'] !== 'f') {
		return false;
	}

	if (!$bot) {
		$bot = changelogbot_ensure_bot();
	}
	if (!$bot) {
		return false;
	}

	$title = trim((string)changelogbot_setting('title', 'Site Changelog'));
	if ($title === '') {
		$title = 'Site Changelog';
	}

	// Reuse an existing matching thread if present
	$query = $db->simple_select(
		'threads',
		'*',
		"fid={$fid} AND subject='".$db->escape_string($title)."' AND visible=1",
		array('order_by' => 'tid', 'order_dir' => 'ASC', 'limit' => 1)
	);
	$existing = $db->fetch_array($query);
	if ($existing) {
		changelogbot_update_setting('changelogbot_tid', (int)$existing['tid']);
		return $existing;
	}

	require_once MYBB_ROOT.'inc/datahandlers/post.php';
	$posthandler = new PostDataHandler('insert');
	$posthandler->action = 'thread';

	$thread = array(
		'fid' => $fid,
		'subject' => $title,
		'prefix' => 0,
		'icon' => 0,
		'uid' => (int)$bot['uid'],
		'username' => $bot['username'],
		'message' => "[b]{$title}[/b]\n\nAll warez.skin updates are posted here by [b]{$bot['username']}[/b].\n\nNewest changes are at the bottom of this thread.",
		'ipaddress' => $db->escape_binary(my_inet_pton('127.0.0.1')),
		'dateline' => TIME_NOW,
		'savedraft' => 0,
		'options' => array(
			'signature' => 0,
			'subscriptionmethod' => 0,
			'disablesmilies' => 0,
		),
	);

	$posthandler->set_data($thread);
	if (!$posthandler->validate_thread()) {
		return false;
	}

	$details = $posthandler->insert_thread();
	if (empty($details['tid'])) {
		return false;
	}

	// Sticky + lock optional? Keep unlocked so bot can keep replying; sticky yes.
	$db->update_query('threads', array(
		'sticky' => 1,
		'closed' => 0,
	), 'tid='.(int)$details['tid']);

	changelogbot_update_setting('changelogbot_tid', (int)$details['tid']);
	changelogbot_update_setting('changelogbot_fid', $fid);

	$query = $db->simple_select('threads', '*', 'tid='.(int)$details['tid'], array('limit' => 1));
	return $db->fetch_array($query);
}

/**
 * Post a changelog reply as the bot.
 *
 * @param string $message MyCode message body
 * @param array $opts Optional overrides: uid, username, tid, fid, subject
 * @return array|false insert_post details
 */
function changelogbot_post($message, $opts = array())
{
	global $db, $mybb;

	if ((string)changelogbot_setting('enabled', '1') === '0') {
		return false;
	}

	$message = trim((string)$message);
	if ($message === '') {
		return false;
	}

	$bot = changelogbot_ensure_bot();
	$thread = changelogbot_ensure_thread($bot);
	if (!$bot || !$thread) {
		return false;
	}

	$uid = !empty($opts['uid']) ? (int)$opts['uid'] : (int)$bot['uid'];
	$username = !empty($opts['username']) ? $opts['username'] : $bot['username'];
	$tid = !empty($opts['tid']) ? (int)$opts['tid'] : (int)$thread['tid'];
	$fid = !empty($opts['fid']) ? (int)$opts['fid'] : (int)$thread['fid'];

	$date = my_date('j M Y, g:i A', TIME_NOW);
	$body = "[b]Update — {$date}[/b]\n\n".$message;

	require_once MYBB_ROOT.'inc/datahandlers/post.php';
	$posthandler = new PostDataHandler('insert');
	$posthandler->action = 'post';

	$post = array(
		'tid' => $tid,
		'replyto' => 0,
		'fid' => $fid,
		'subject' => !empty($opts['subject']) ? $opts['subject'] : 'RE: '.changelogbot_setting('title', 'Site Changelog'),
		'uid' => $uid,
		'username' => $username,
		'message' => $body,
		'ipaddress' => $db->escape_binary(my_inet_pton('127.0.0.1')),
		'dateline' => TIME_NOW,
		'savedraft' => 0,
		'options' => array(
			'signature' => 0,
			'subscriptionmethod' => 0,
			'disablesmilies' => 0,
		),
	);

	// Prevent MyBB "post merge" from appending into the previous bot post
	$old_merge = isset($mybb->settings['postmergemins']) ? $mybb->settings['postmergemins'] : 0;
	$mybb->settings['postmergemins'] = 0;

	$posthandler->set_data($post);
	if (!$posthandler->validate_post()) {
		$mybb->settings['postmergemins'] = $old_merge;
		return false;
	}

	$result = $posthandler->insert_post();
	$mybb->settings['postmergemins'] = $old_merge;
	return $result;
}

/* ---------- Admin CP hooks ---------- */
$plugins->add_hook('admin_tools_menu', 'changelogbot_admin_tools_menu');
$plugins->add_hook('admin_tools_action_handler', 'changelogbot_admin_tools_action_handler');
$plugins->add_hook('admin_tools_permissions', 'changelogbot_admin_tools_permissions');

function changelogbot_admin_tools_menu(&$sub_menu)
{
	$sub_menu['920'] = array(
		'id' => 'changelogbot',
		'title' => 'Changelog Bot',
		'link' => 'index.php?module=tools-changelogbot',
	);
}

function changelogbot_admin_tools_action_handler(&$actions)
{
	$actions['changelogbot'] = array(
		'active' => 'changelogbot',
		'file' => 'changelogbot.php',
	);
}

function changelogbot_admin_tools_permissions(&$auth)
{
	$auth['changelogbot'] = 'Can post changelog updates via WAREZBOT';
}
