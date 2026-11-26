<?php
if (!defined('IN_MYBB')) {
	die('Direct initialization of this file is not allowed.');
}

function warezskin_info()
{
	return array(
		'name' => 'warez.skin Theme Helpers',
		'description' => 'YouHack-style portal blocks and postbit fields.',
		'website' => 'https://warez.skin',
		'author' => 'warez.skin',
		'version' => '2.0',
		'compatibility' => '18*'
	);
}

function warezskin_activate() {}
function warezskin_deactivate() {}

$plugins->add_hook('global_intermediate', 'warezskin_header_avatar');
$plugins->add_hook('portal_end', 'warezskin_portal_blocks');
$plugins->add_hook('postbit', 'warezskin_postbit');
$plugins->add_hook('index_start', 'warezskin_index_stats');
$plugins->add_hook('member_profile_end', 'warezskin_profile');

function warezskin_header_avatar()
{
	global $mybb, $yh_avatar, $yh_panelbg_style, $yh_panelbg_class;
	global $yh_panelchat_feed, $yh_panelchat_js;
	global $sm_recent_activity, $sm_recent_left, $sm_recent_right, $sm_mostonline, $sm_postgoal_today, $sm_postgoal_target, $sm_postgoal_pct, $sm_postgoal_status;
	global $sm_online_note, $sm_online_members, $sm_newest_user;

	$yh_avatar = $mybb->settings['bburl'] . '/images/default_avatar.png';
	if (!isset($yh_panelbg_style)) {
		$yh_panelbg_style = '';
	}
	if (!isset($yh_panelbg_class)) {
		$yh_panelbg_class = '';
	}
	if (!isset($yh_panelchat_feed)) {
		$yh_panelchat_feed = '<li class="yh-act-empty">Say hi — this chat is live.</li>';
	}
	if (!isset($yh_panelchat_js)) {
		$yh_panelchat_js = '';
	}
	if (!isset($sm_recent_activity)) {
		$sm_recent_activity = '';
	}
	if (!isset($sm_recent_left)) {
		$sm_recent_left = '';
	}
	if (!isset($sm_recent_right)) {
		$sm_recent_right = '';
	}
	if (!isset($sm_mostonline)) {
		$sm_mostonline = '0';
	}
	if (!isset($sm_postgoal_today)) {
		$sm_postgoal_today = '0';
	}
	if (!isset($sm_postgoal_target)) {
		$sm_postgoal_target = '250';
	}
	if (!isset($sm_postgoal_pct)) {
		$sm_postgoal_pct = '0';
	}
	if (!isset($sm_postgoal_status)) {
		$sm_postgoal_status = '';
	}
	if (!isset($sm_online_note)) {
		$sm_online_note = '';
	}
	if (!isset($sm_online_members)) {
		$sm_online_members = '';
	}
	if (!isset($sm_newest_user)) {
		$sm_newest_user = '';
	}

	if (!empty($mybb->user['uid'])) {
		$avatar = format_avatar($mybb->user['avatar'], $mybb->user['avatardimensions'], '96x96');
		if (!empty($avatar['image'])) {
			$yh_avatar = $avatar['image'];
		}
	}
}

function warezskin_build_activity_log($limit = 8)
{
	global $db, $mybb;

	$limit = max(3, min(20, (int)$limit));
	$items = array();

	$unviewable = get_unviewable_forums(true);
	$inactive = get_inactive_forums();
	$forum_where = "p.visible='1' AND t.visible='1'";
	if ($unviewable) {
		$forum_where .= " AND t.fid NOT IN ($unviewable)";
	}
	if ($inactive) {
		$forum_where .= " AND t.fid NOT IN ($inactive)";
	}

	// Recent posts (includes first posts / new threads and bot posts)
	$query = $db->query("
		SELECT p.pid, p.tid, p.uid, p.username, p.dateline, p.replyto,
			t.subject AS threadsubject, t.firstpost
		FROM ".TABLE_PREFIX."posts p
		INNER JOIN ".TABLE_PREFIX."threads t ON (t.tid=p.tid)
		WHERE {$forum_where}
		ORDER BY p.dateline DESC
		LIMIT {$limit}
	");
	while ($row = $db->fetch_array($query)) {
		$who = htmlspecialchars_uni($row['username']);
		$who_link = build_profile_link($who, (int)$row['uid']);
		$subject = htmlspecialchars_uni($row['threadsubject']);
		$thread_url = $mybb->settings['bburl'].'/'.get_thread_link((int)$row['tid']).'#pid'.(int)$row['pid'];
		$when = my_date('relative', (int)$row['dateline']);
		$is_thread = ((int)$row['pid'] === (int)$row['firstpost']) || empty($row['replyto']);
		$verb = $is_thread ? 'created' : 'replied in';
		$items[] = array(
			'ts' => (int)$row['dateline'],
			'html' => '<li><span class="yh-act-who">'.$who_link.'</span> <span class="yh-act-verb">'.$verb.'</span> <a class="yh-act-subj" href="'.$thread_url.'">'.$subject.'</a> <span class="yh-act-when">'.$when.'</span></li>',
		);
	}

	// Recent registrations (bots + humans)
	$query = $db->simple_select(
		'users',
		'uid, username, regdate',
		'uid>0',
		array('order_by' => 'regdate', 'order_dir' => 'DESC', 'limit' => 4)
	);
	while ($row = $db->fetch_array($query)) {
		$who = htmlspecialchars_uni($row['username']);
		$who_link = build_profile_link($who, (int)$row['uid']);
		$when = my_date('relative', (int)$row['regdate']);
		$items[] = array(
			'ts' => (int)$row['regdate'],
			'html' => '<li><span class="yh-act-who">'.$who_link.'</span> <span class="yh-act-verb">joined</span> <span class="yh-act-when">'.$when.'</span></li>',
		);
	}

	if (!$items) {
		return '<li class="yh-act-empty">No recent activity yet.</li>';
	}

	usort($items, function ($a, $b) {
		return $b['ts'] <=> $a['ts'];
	});
	$items = array_slice($items, 0, $limit);

	$html = '';
	foreach ($items as $item) {
		$html .= $item['html'];
	}
	return $html;
}

function warezskin_portal_blocks()
{
	global $db, $mybb, $yh_forum_stats;

	// Portal is the IPA app-repo viewer when App Repos plugin is enabled
	if (function_exists('apprepos_enabled') && apprepos_enabled()) {
		return;
	}

	$unviewable = get_unviewable_forums(true);
	$inactive = get_inactive_forums();
	$where = "t.visible='1' AND t.closed NOT LIKE 'moved|%'";
	if ($unviewable) {
		$where .= " AND t.fid NOT IN ($unviewable)";
	}
	if ($inactive) {
		$where .= " AND t.fid NOT IN ($inactive)";
	}

	$rows = '';
	$query = $db->query("
		SELECT t.tid, t.fid, t.subject, t.uid, t.username, t.dateline, t.lastpost, t.lastposter, t.lastposteruid, f.name AS forumname
		FROM ".TABLE_PREFIX."threads t
		LEFT JOIN ".TABLE_PREFIX."forums f ON (f.fid=t.fid)
		WHERE $where
		ORDER BY t.lastpost DESC
		LIMIT 12
	");
	$alt = 'trow1';
	while ($thread = $db->fetch_array($query)) {
		$subject = htmlspecialchars_uni($thread['subject']);
		$forum = htmlspecialchars_uni($thread['forumname']);
		$author = build_profile_link(htmlspecialchars_uni($thread['username']), (int)$thread['uid']);
		$last = build_profile_link(htmlspecialchars_uni($thread['lastposter']), (int)$thread['lastposteruid']);
		$last_date = my_date('relative', $thread['lastpost']);
		$link = get_thread_link($thread['tid']);
		$flink = get_forum_link($thread['fid']);
		$rows .= '<tr>
			<td class="'.$alt.' yh-topic"><span class="yh-dot"></span><a href="'.$mybb->settings['bburl'].'/'.$link.'">'.$subject.'</a></td>
			<td class="'.$alt.' yh-muted" style="white-space:nowrap">'.$last_date.'</td>
			<td class="'.$alt.'">'.$author.'</td>
			<td class="'.$alt.'">'.$last.'</td>
			<td class="'.$alt.'"><a href="'.$mybb->settings['bburl'].'/'.$flink.'">'.$forum.'</a></td>
		</tr>';
		$alt = ($alt === 'trow1') ? 'trow2' : 'trow1';
	}
	if ($rows === '') {
		$rows = '<tr><td class="trow1" colspan="5">No posts yet.</td></tr>';
	}

	$views = '';
	$query = $db->query("
		SELECT tid, subject, views FROM ".TABLE_PREFIX."threads t
		WHERE $where
		ORDER BY t.views DESC, t.dateline DESC
		LIMIT 8
	");
	while ($thread = $db->fetch_array($query)) {
		$views .= '<li><a href="'.$mybb->settings['bburl'].'/'.get_thread_link($thread['tid']).'">'.htmlspecialchars_uni($thread['subject']).'</a><span>'.my_number_format((int)$thread['views']).'</span></li>';
	}
	if ($views === '') {
		$views = '<li><span class="yh-muted">Nothing yet</span></li>';
	}

	$reps = '';
	$query = $db->query("
		SELECT uid, username, reputation FROM ".TABLE_PREFIX."users
		WHERE uid > 0
		ORDER BY reputation DESC, postnum DESC
		LIMIT 8
	");
	while ($user = $db->fetch_array($query)) {
		$reps .= '<li>'.build_profile_link(htmlspecialchars_uni($user['username']), (int)$user['uid']).'<span>'.my_number_format((int)$user['reputation']).'</span></li>';
	}

	$yh_forum_stats = '
	<table border="0" cellspacing="0" cellpadding="0" class="tborder yh-statsbox">
		<tr><td class="thead" colspan="2"><strong>Forum stats</strong></td></tr>
		<tr>
			<td class="trow1 yh-stats-main" valign="top">
				<div class="yh-section-label">Latest posts</div>
				<table class="yh-latest" width="100%" cellspacing="0" cellpadding="6" border="0">
					<tr>
						<td class="tcat">Topic</td>
						<td class="tcat">Date, time</td>
						<td class="tcat">Author</td>
						<td class="tcat">Last Sender</td>
						<td class="tcat">Forum</td>
					</tr>
					'.$rows.'
				</table>
			</td>
			<td class="trow1 yh-stats-side" valign="top" width="250">
				<div class="yh-sideblock">
					<div class="yh-section-label">Most views</div>
					<ul class="yh-side-list">'.$views.'</ul>
				</div>
				<div class="yh-sideblock">
					<div class="yh-section-label">Most reputations</div>
					<ul class="yh-side-list">'.$reps.'</ul>
				</div>
			</td>
		</tr>
	</table>';
}

function warezskin_profile()
{
	global $mybb, $db, $cache, $memprofile, $usertitle, $profilefields;
	global $yh_profile_banner, $yh_additional_groups, $yh_warning_count, $yh_warning_percent, $yh_profile_referrals;

	$banner = trim(strip_tags((string)$usertitle));
	if ($banner === '') {
		$banner = 'WAREZ.SKIN MEMBER';
	}
	$yh_profile_banner = htmlspecialchars_uni(my_strtoupper($banner));

	$maxw = max(1, (int)$mybb->settings['maxwarningpoints']);
	$points = isset($memprofile['warningpoints']) ? (int)$memprofile['warningpoints'] : 0;
	$yh_warning_percent = (int)round(($points / $maxw) * 100);
	if ($yh_warning_percent > 100) {
		$yh_warning_percent = 100;
	}

	$yh_warning_count = 0;
	if (!empty($memprofile['uid']) && $db->table_exists('warnings')) {
		$yh_warning_count = (int)$db->fetch_field(
			$db->simple_select('warnings', 'COUNT(wid) AS c', "uid=".(int)$memprofile['uid']." AND expired=0"),
			'c'
		);
	}

	$yh_additional_groups = '<span class="yh-muted">None</span>';
	if (!empty($memprofile['additionalgroups'])) {
		$groups = $cache->read('usergroups');
		$parts = array();
		foreach (explode(',', $memprofile['additionalgroups']) as $gid) {
			$gid = (int)$gid;
			if ($gid && isset($groups[$gid]['title'])) {
				$parts[] = htmlspecialchars_uni($groups[$gid]['title']);
			}
		}
		if ($parts) {
			$yh_additional_groups = implode(', ', $parts);
		}
	}

	$yh_profile_referrals = '';
	if (!empty($memprofile['referrals'])) {
		$yh_profile_referrals = '<div class="yh-profile-row"><span class="yh-k">Members Referred</span><span class="yh-v">'.(int)$memprofile['referrals'].'</span></div>';
	}

	// Always show Sex / Location / Bio rows (YouHack-style), even when empty
	$sex = '';
	$location = '';
	$bio = '';
	if (!empty($memprofile['uid'])) {
		$uf = $db->fetch_array($db->simple_select('userfields', '*', 'ufid='.(int)$memprofile['uid'], array('limit' => 1)));
		if (is_array($uf)) {
			$location = isset($uf['fid1']) ? trim($uf['fid1']) : '';
			$bio = isset($uf['fid2']) ? trim($uf['fid2']) : '';
			$sex = isset($uf['fid3']) ? trim($uf['fid3']) : '';
		}
	}
	$profilefields =
		'<div class="yh-profile-row"><span class="yh-k">Sex:</span><span class="yh-v">'.($sex !== '' ? htmlspecialchars_uni($sex) : '').'</span></div>'.
		'<div class="yh-profile-row"><span class="yh-k">Location:</span><span class="yh-v">'.($location !== '' ? htmlspecialchars_uni($location) : '').'</span></div>'.
		'<div class="yh-profile-row"><span class="yh-k">bio:</span><span class="yh-v">'.($bio !== '' ? nl2br(htmlspecialchars_uni($bio)) : '').'</span></div>';
}

function warezskin_postbit(&$post)
{
	global $db, $mybb;

	$rep = isset($post['reputation']) ? (int)$post['reputation'] : 0;
	$post['yh_rep'] = my_number_format($rep);
	if (!isset($post['yh_bits'])) {
		$post['yh_bits'] = isset($post['bits']) ? my_number_format((int)$post['bits']) : '0';
	}

	$online = false;
	if (!empty($post['uid'])) {
		$timesearch = TIME_NOW - (int)$mybb->settings['wolcutoffmins'] * 60;
		$query = $db->simple_select('sessions', 'sid', "uid='".(int)$post['uid']."' AND time > '{$timesearch}'", array('limit' => 1));
		$online = (bool)$db->fetch_field($query, 'sid');
	}
	$post['yh_status'] = $online ? 'Online' : 'Offline';
}

function warezskin_index_stats()
{
	global $db, $mybb, $cache, $sm_recent_activity, $sm_recent_left, $sm_recent_right, $sm_mostonline;
	global $sm_postgoal_today, $sm_postgoal_target, $sm_postgoal_pct, $sm_postgoal_status;
	global $sm_online_note, $sm_online_members, $sm_newest_user;

	$most = $cache->read('mostonline');
	$sm_mostonline = my_number_format(is_array($most) && isset($most['numusers']) ? (int)$most['numusers'] : 0);

	$target = 250;
	$today_start = TIME_NOW - (int)date('G') * 3600 - (int)date('i') * 60 - (int)date('s');
	$query = $db->simple_select('posts', 'COUNT(*) AS c', "visible='1' AND dateline>='".(int)$today_start."'");
	$today = (int)$db->fetch_field($query, 'c');
	$sm_postgoal_today = my_number_format($today);
	$sm_postgoal_target = my_number_format($target);
	$pct = $target > 0 ? (int)min(100, round(($today / $target) * 100)) : 0;
	$sm_postgoal_pct = $pct;
	$sm_postgoal_status = $today >= $target
		? '<span class="sm-goal-ok">Reached</span>'
		: '<span class="sm-goal-no">Not Reached</span>';

	warezskin_build_recent_feed(24);
	warezskin_build_fake_online();
}

function warezskin_build_fake_online()
{
	global $mybb, $cache, $lang, $sm_online_note, $sm_online_members, $sm_mostonline, $sm_newest_user;

	$names = array(
		array('nexusvoid', '#3dbdad'),
		array('darkpacket', '#7ee0d4'),
		array('skidbyte', '#e0a86e'),
		array('rootmirror', '#c9a0ff'),
		array('payloadfox', '#f0a0a0'),
		array('nullsector', '#8ec8ff'),
		array('warezwolf', '#3dbdad'),
		array('bitrunner', '#ffcc66'),
		array('ghostlease', '#a8d8a8'),
		array('cryptokitten', '#f5a3c7'),
		array('zerodayzen', '#7ee0d4'),
		array('mirrorfish', '#e0a86e'),
		array('softshell', '#8ec8ff'),
		array('hexharbor', '#c9a0ff'),
		array('packetpony', '#f0a0a0'),
		array('dlvault', '#3dbdad'),
		array('nightseed', '#ffcc66'),
	);

	$parts = array();
	foreach ($names as $row) {
		$name = htmlspecialchars_uni($row[0]);
		$color = $row[1];
		$parts[] = '<span class="sm-online-fake" style="color: '.$color.';"><strong>'.$name.'</strong></span>';
	}
	$sm_online_members = implode(', ', $parts);

	$count = count($names);
	$sm_online_note = $count.' users active in the past 15 minutes ('.$count.' members, 0 of whom are invisible, and 0 guests).';

	// Keep "Most Online" at least as high as the fake crowd.
	$most_num = (int)str_replace(',', '', (string)$sm_mostonline);
	if ($most_num < $count) {
		$sm_mostonline = my_number_format($count);
	}

	$stats = $cache->read('stats');
	if (!empty($stats['lastusername']) && !empty($stats['lastuid'])) {
		$newest = build_profile_link($stats['lastusername'], (int)$stats['lastuid']);
		$sm_newest_user = 'Please welcome our newest member, '.$newest.'.';
	} else {
		$sm_newest_user = 'Please welcome our newest member, nobody.';
	}
}

function warezskin_build_recent_feed($limit = 24)
{
	global $db, $mybb, $sm_recent_activity, $sm_recent_left, $sm_recent_right;

	$limit = max(8, min(40, (int)$limit));
	$unviewable = get_unviewable_forums(true);
	$inactive = get_inactive_forums();
	$forum_where = "p.visible='1' AND t.visible='1'";
	if ($unviewable) {
		$forum_where .= " AND t.fid NOT IN ($unviewable)";
	}
	if ($inactive) {
		$forum_where .= " AND t.fid NOT IN ($inactive)";
	}

	$items = array();

	$query = $db->query("
		SELECT p.pid, p.tid, p.uid, p.username, p.dateline, p.replyto, p.message,
			t.subject AS threadsubject, t.firstpost
		FROM ".TABLE_PREFIX."posts p
		INNER JOIN ".TABLE_PREFIX."threads t ON (t.tid=p.tid)
		WHERE {$forum_where}
		ORDER BY p.dateline DESC
		LIMIT {$limit}
	");
	while ($row = $db->fetch_array($query)) {
		$who = htmlspecialchars_uni($row['username']);
		$who_link = build_profile_link($who, (int)$row['uid']);
		$subject = htmlspecialchars_uni($row['threadsubject']);
		$thread_url = $mybb->settings['bburl'].'/'.get_thread_link((int)$row['tid']).'#pid'.(int)$row['pid'];
		$when = my_date('relative', (int)$row['dateline']);
		$is_thread = ((int)$row['pid'] === (int)$row['firstpost']) || empty($row['replyto']);
		$verb = $is_thread ? 'created' : 'replied in';

		$snippet = warezskin_activity_snippet($row['message']);
		$items[] = array(
			'ts' => (int)$row['dateline'],
			'html' => '<li class="sm-act-item">'
				.'<div class="sm-act-line">'
				.'<strong class="sm-act-who">'.$who_link.'</strong> '
				.'<span class="sm-act-verb">'.$verb.'</span> '
				.'<a class="sm-act-subj" href="'.$thread_url.'">'.$subject.'</a>'
				.'<span class="sm-act-when"> · '.$when.'</span>'
				.'</div>'
				.($snippet !== '' ? '<div class="sm-act-snippet">'.$snippet.'</div>' : '')
				.'</li>',
		);
	}

	$query = $db->simple_select(
		'users',
		'uid, username, regdate',
		'uid>0',
		array('order_by' => 'regdate', 'order_dir' => 'DESC', 'limit' => 4)
	);
	while ($row = $db->fetch_array($query)) {
		$who = htmlspecialchars_uni($row['username']);
		$who_link = build_profile_link($who, (int)$row['uid']);
		$when = my_date('relative', (int)$row['regdate']);
		$items[] = array(
			'ts' => (int)$row['regdate'],
			'html' => '<li class="sm-act-item sm-act-join">'
				.'<div class="sm-act-line">'
				.'<strong class="sm-act-who">'.$who_link.'</strong> '
				.'<span class="sm-act-verb">joined the board</span>'
				.'<span class="sm-act-when"> · '.$when.'</span>'
				.'</div>'
				.'</li>',
		);
	}

	if (!$items) {
		$empty = '<li class="sm-act-empty">No recent activity yet.</li>';
		$sm_recent_left = $empty;
		$sm_recent_right = '';
		$sm_recent_activity = $empty;
		return;
	}

	usort($items, function ($a, $b) {
		return $b['ts'] <=> $a['ts'];
	});
	$items = array_slice($items, 0, $limit);

	$left = '';
	$right = '';
	foreach ($items as $i => $item) {
		if ($i % 2 === 0) {
			$left .= $item['html'];
		} else {
			$right .= $item['html'];
		}
	}

	$sm_recent_left = $left;
	$sm_recent_right = $right !== '' ? $right : '<li class="sm-act-empty"> </li>';
	$sm_recent_activity = $left.$right;
}

function warezskin_activity_snippet($message)
{
	$message = (string)$message;
	// Strip MyBB mycode / HTML down to plain readable text
	$message = preg_replace('#\[quote(?:=[^\]]*)?\](.*?)\[/quote\]#is', ' ', $message);
	$message = preg_replace('#\[code\](.*?)\[/code\]#is', ' ', $message);
	$message = preg_replace('#\[php\](.*?)\[/php\]#is', ' ', $message);
	$message = preg_replace('#\[img[^\]]*\](.*?)\[/img\]#is', ' ', $message);
	$message = preg_replace('#\[url(?:=[^\]]*)?\](.*?)\[/url\]#is', '$1', $message);
	$message = preg_replace('#\[/?[a-z0-9*=_\-]+[^\]]*\]#i', '', $message);
	$message = strip_tags($message);
	$message = html_entity_decode($message, ENT_QUOTES, 'UTF-8');
	$message = str_replace(array("\r\n", "\n", "\r"), ' ', $message);
	$message = str_replace(array('\\r\\n', '\\n', '\\r'), ' ', $message);
	$message = preg_replace('/\s+/', ' ', trim($message));
	if ($message === '') {
		return '';
	}
	if (my_strlen($message) > 140) {
		$message = my_substr($message, 0, 137).'…';
	}
	return htmlspecialchars_uni($message);
}
