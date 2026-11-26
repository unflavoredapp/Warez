<?php
/**
 * Panel Chat — live shoutbox + activity in the header account panel
 */
if (!defined('IN_MYBB')) {
	die('Direct initialization of this file is not allowed.');
}

function panelchat_info()
{
	return array(
		'name' => 'Panel Chat',
		'description' => 'Live chat + activity feed inside the header account panel.',
		'website' => 'https://warez.skin',
		'author' => 'warez.skin',
		'version' => '1.0',
		'compatibility' => '18*',
	);
}

function panelchat_install()
{
	global $db;

	if (!$db->table_exists('panelchat')) {
		$db->write_query("CREATE TABLE ".TABLE_PREFIX."panelchat (
			mid INT UNSIGNED NOT NULL AUTO_INCREMENT,
			uid INT UNSIGNED NOT NULL DEFAULT 0,
			username VARCHAR(120) NOT NULL DEFAULT '',
			message VARCHAR(500) NOT NULL DEFAULT '',
			dateline INT UNSIGNED NOT NULL DEFAULT 0,
			PRIMARY KEY (mid),
			KEY dateline (dateline)
		) ENGINE=MyISAM DEFAULT CHARSET=utf8");
	}

	panelchat_insert_settings();
}

function panelchat_is_installed()
{
	global $db;
	return $db->table_exists('panelchat');
}

function panelchat_uninstall()
{
	global $db;
	$db->delete_query('settings', "name LIKE 'panelchat_%'");
	$db->delete_query('settinggroups', "name='panelchat'");
	rebuild_settings();
	if ($db->table_exists('panelchat')) {
		$db->drop_table('panelchat');
	}
}

function panelchat_activate()
{
	panelchat_insert_settings();
}

function panelchat_deactivate()
{
}

function panelchat_insert_settings()
{
	global $db;

	$query = $db->simple_select('settinggroups', 'gid', "name='panelchat'", array('limit' => 1));
	$gid = (int)$db->fetch_field($query, 'gid');
	if (!$gid) {
		$gid = (int)$db->insert_query('settinggroups', array(
			'name' => 'panelchat',
			'title' => 'Panel Chat',
			'description' => 'Live chat in the header account panel.',
			'disporder' => 82,
			'isdefault' => 0,
		));
	}

	$settings = array(
		'panelchat_enabled' => array('Enable panel chat', 'Show the live chat box for logged-in members.', 'yesno', '1', 1),
		'panelchat_limit' => array('Messages shown', 'How many chat/activity lines to show.', 'numeric', '12', 2),
		'panelchat_maxlen' => array('Max message length', 'Characters allowed per chat message.', 'numeric', '200', 3),
		'panelchat_flood' => array('Flood seconds', 'Minimum seconds between messages.', 'numeric', '3', 4),
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

$plugins->add_hook('global_intermediate', 'panelchat_prepare');

function panelchat_enabled()
{
	global $mybb;
	return !empty($mybb->settings['panelchat_enabled']) && (int)$mybb->settings['panelchat_enabled'] === 1;
}

function panelchat_prepare()
{
	global $mybb, $yh_panelchat_feed, $yh_panelchat_js;

	$yh_panelchat_feed = '<li class="yh-act-empty">Say hi — this chat is live.</li>';
	$yh_panelchat_js = '';

	if (!panelchat_enabled()) {
		return;
	}

	$limit = isset($mybb->settings['panelchat_limit']) ? (int)$mybb->settings['panelchat_limit'] : 12;
	$yh_panelchat_feed = panelchat_build_feed($limit);
	// Guests can read the shoutbox; only members get the live JS form.
	if (!empty($mybb->user['uid'])) {
		$yh_panelchat_js = panelchat_inline_js();
	}
}

function panelchat_escape_msg($text)
{
	$text = trim(preg_replace('/\s+/', ' ', (string)$text));
	return htmlspecialchars_uni($text);
}

function panelchat_build_feed($limit = 12)
{
	global $db, $mybb;

	if (!function_exists('panelchat_is_installed') || !panelchat_is_installed()) {
		return '<li class="yh-act-empty">Chat is installing…</li>';
	}

	$limit = max(5, min(30, (int)$limit));
	$items = array();

	// Chat messages
	$query = $db->simple_select('panelchat', '*', '', array('order_by' => 'dateline', 'order_dir' => 'DESC', 'limit' => $limit));
	while ($row = $db->fetch_array($query)) {
		$who = htmlspecialchars_uni($row['username']);
		$who_link = build_profile_link($who, (int)$row['uid']);
		$msg = panelchat_escape_msg($row['message']);
		$when = my_date('relative', (int)$row['dateline']);
		$items[] = array(
			'ts' => (int)$row['dateline'],
			'html' => '<li class="yh-chat-msg" data-mid="'.(int)$row['mid'].'"><span class="yh-act-who">'.$who_link.'</span><span class="yh-chat-sep">:</span> <span class="yh-chat-text">'.$msg.'</span> <span class="yh-act-when">'.$when.'</span></li>',
		);
	}

	// Mix in forum activity (posts/threads/joins) so it feels live
	if (function_exists('warezskin_build_activity_log')) {
		// Reuse activity builder pieces inline for typed activity rows
		$unviewable = get_unviewable_forums(true);
		$inactive = get_inactive_forums();
		$forum_where = "p.visible='1' AND t.visible='1'";
		if ($unviewable) {
			$forum_where .= " AND t.fid NOT IN ($unviewable)";
		}
		if ($inactive) {
			$forum_where .= " AND t.fid NOT IN ($inactive)";
		}
		$aq = $db->query("
			SELECT p.pid, p.tid, p.uid, p.username, p.dateline, p.replyto, t.subject AS threadsubject, t.firstpost
			FROM ".TABLE_PREFIX."posts p
			INNER JOIN ".TABLE_PREFIX."threads t ON (t.tid=p.tid)
			WHERE {$forum_where}
			ORDER BY p.dateline DESC
			LIMIT 6
		");
		while ($row = $db->fetch_array($aq)) {
			$who = htmlspecialchars_uni($row['username']);
			$who_link = build_profile_link($who, (int)$row['uid']);
			$subject = htmlspecialchars_uni($row['threadsubject']);
			$thread_url = $mybb->settings['bburl'].'/'.get_thread_link((int)$row['tid']).'#pid'.(int)$row['pid'];
			$when = my_date('relative', (int)$row['dateline']);
			$is_thread = ((int)$row['pid'] === (int)$row['firstpost']) || empty($row['replyto']);
			$verb = $is_thread ? 'created' : 'replied in';
			$items[] = array(
				'ts' => (int)$row['dateline'],
				'html' => '<li class="yh-chat-act"><span class="yh-act-who">'.$who_link.'</span> <span class="yh-act-verb">'.$verb.'</span> <a class="yh-act-subj" href="'.$thread_url.'">'.$subject.'</a> <span class="yh-act-when">'.$when.'</span></li>',
			);
		}
	}

	if (!$items) {
		return '<li class="yh-act-empty">No messages yet — be the first.</li>';
	}

	usort($items, function ($a, $b) {
		return $b['ts'] <=> $a['ts'];
	});
	$items = array_slice($items, 0, $limit);

	// Show oldest→newest in the box (chat style), CSS will flex-end scroll
	$items = array_reverse($items);
	$html = '';
	foreach ($items as $item) {
		$html .= $item['html'];
	}
	return $html;
}

function panelchat_send($uid, $username, $message)
{
	global $db, $mybb;

	if (!panelchat_enabled() || !panelchat_is_installed()) {
		return array('error' => 'Chat is disabled.');
	}

	$uid = (int)$uid;
	if ($uid < 1) {
		return array('error' => 'Log in to chat.');
	}

	$message = trim(preg_replace('/\s+/', ' ', (string)$message));
	$maxlen = isset($mybb->settings['panelchat_maxlen']) ? (int)$mybb->settings['panelchat_maxlen'] : 200;
	if ($maxlen < 20) {
		$maxlen = 200;
	}
	if ($message === '') {
		return array('error' => 'Type a message first.');
	}
	if (my_strlen($message) > $maxlen) {
		return array('error' => 'Message too long (max '.$maxlen.').');
	}

	$flood = isset($mybb->settings['panelchat_flood']) ? (int)$mybb->settings['panelchat_flood'] : 3;
	if ($flood > 0) {
		$last = $db->fetch_array($db->simple_select('panelchat', 'dateline', 'uid='.$uid, array('order_by' => 'dateline', 'order_dir' => 'DESC', 'limit' => 1)));
		if ($last && ((int)$last['dateline'] + $flood) > TIME_NOW) {
			return array('error' => 'Slow down — wait a second.');
		}
	}

	$mid = (int)$db->insert_query('panelchat', array(
		'uid' => $uid,
		'username' => $db->escape_string($username),
		'message' => $db->escape_string($message),
		'dateline' => TIME_NOW,
	));

	// Keep table tidy
	$count = (int)$db->fetch_field($db->simple_select('panelchat', 'COUNT(*) AS c'), 'c');
	if ($count > 300) {
		$cut = $db->fetch_field($db->simple_select('panelchat', 'mid', '', array('order_by' => 'dateline', 'order_dir' => 'DESC', 'limit' => 1, 'limit_start' => 250)), 'mid');
		if ($cut) {
			$db->delete_query('panelchat', 'mid < '.(int)$cut);
		}
	}

	return array('ok' => 1, 'mid' => $mid);
}

function panelchat_inline_js()
{
	global $mybb;
	$url = $mybb->settings['bburl'].'/panelchat.php';
	$token = $mybb->post_code;
	return '<script type="text/javascript">
(function(){
  var box = document.getElementById("yh_panelchat_feed");
  var form = document.getElementById("yh_panelchat_form");
  var input = document.getElementById("yh_panelchat_input");
  if (!box || !form || !input) return;
  var endpoint = '.json_encode($url).';
  var key = '.json_encode($token).';
  var busy = false;

  function scrollBottom(){ box.scrollTop = box.scrollHeight; }
  scrollBottom();

  function refresh(){
    fetch(endpoint + "?action=fetch", {credentials:"same-origin", headers:{"X-Requested-With":"XMLHttpRequest"}})
      .then(function(r){ return r.json(); })
      .then(function(data){
        if (!data || !data.html) return;
        var atBottom = (box.scrollHeight - box.scrollTop - box.clientHeight) < 28;
        box.innerHTML = data.html;
        if (atBottom) scrollBottom();
      }).catch(function(){});
  }

  form.addEventListener("submit", function(e){
    e.preventDefault();
    if (busy) return;
    var msg = (input.value || "").trim();
    if (!msg) return;
    busy = true;
    var body = new FormData();
    body.append("action", "send");
    body.append("message", msg);
    body.append("my_post_key", key);
    fetch(endpoint, {method:"POST", body:body, credentials:"same-origin", headers:{"X-Requested-With":"XMLHttpRequest"}})
      .then(function(r){ return r.json(); })
      .then(function(data){
        busy = false;
        if (data && data.error) { input.placeholder = data.error; return; }
        input.value = "";
        input.placeholder = "Say something…";
        if (data && data.html) { box.innerHTML = data.html; scrollBottom(); }
        else refresh();
      }).catch(function(){ busy = false; });
  });

  setInterval(refresh, 8000);
})();
</script>';
}
