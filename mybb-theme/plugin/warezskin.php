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
$plugins->add_hook('index_end', 'warezskin_index_stats');

function warezskin_header_avatar()
{
	global $mybb, $yh_avatar;

	$yh_avatar = $mybb->settings['bburl'] . '/images/default_avatar.png';
	if (!empty($mybb->user['uid'])) {
		$avatar = format_avatar($mybb->user['avatar'], $mybb->user['avatardimensions'], '64x64');
		if (!empty($avatar['image'])) {
			$yh_avatar = $avatar['image'];
		}
	}
}

function warezskin_portal_blocks()
{
	global $db, $mybb, $yh_forum_stats;

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

function warezskin_postbit(&$post)
{
	global $db, $mybb;

	$rep = isset($post['reputation']) ? (int)$post['reputation'] : 0;
	$post['yh_rep'] = my_number_format($rep);
	$post['yh_credits'] = number_format(max(0, $rep) * 10 + (int)$post['postnum'], 2);

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
	global $boardstats, $cache, $lang, $theme, $db, $mybb, $templates, $collapsed, $collapsedthead, $collapsedimg, $expaltext, $whosonline, $birthdays, $logoutlink, $statspage;

	$stats = $cache->read('stats');
	if (!is_array($stats)) {
		return;
	}

	$most = $cache->read('mostonline');
	$mostnum = is_array($most) && isset($most['numusers']) ? my_number_format((int)$most['numusers']) : '0';

	$newest = '—';
	if (!empty($stats['lastuid']) && !empty($stats['lastusername'])) {
		$newest = build_profile_link(htmlspecialchars_uni($stats['lastusername']), (int)$stats['lastuid']);
	}

	$forumstats = '
	<tr><td class="tcat"><span class="smalltext"><strong>Board Statistics</strong></span></td></tr>
	<tr>
	<td class="trow1">
	<div class="yh-boardnums">
		<span><strong>Posts:</strong> '.my_number_format((int)$stats['numposts']).'</span>
		<span><strong>Threads:</strong> '.my_number_format((int)$stats['numthreads']).'</span>
		<span><strong>Members:</strong> '.my_number_format((int)$stats['numusers']).'</span>
		<span><strong>Most Users Online:</strong> '.$mostnum.'</span>
	</div>
	<div class="smalltext yh-boardfoot">Newest Member: '.$newest.'</div>
	</td>
	</tr>';

	$boardstats = '
	<table border="0" cellspacing="0" cellpadding="0" class="tborder yh-cat">
	<thead>
	<tr>
	<td class="thead">
	<div><strong>Board Statistics</strong></div>
	</td>
	</tr>
	</thead>
	<tbody>
	'.$whosonline.'
	'.$birthdays.'
	'.$forumstats.'
	<tr>
		<td class="tfoot"><span class="smalltext">'.$logoutlink.' '.$statspage.'</span></td>
	</tr>
	</tbody>
	</table>
	<br />';
}
