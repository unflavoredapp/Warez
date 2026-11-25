<?php
/**
 * warez.skin Bits — member currency with earn chances
 */
if (!defined('IN_MYBB')) {
	die('Direct initialization of this file is not allowed.');
}

function bits_info()
{
	return array(
		'name' => 'Bits Currency',
		'description' => 'Members earn Bits from posts, threads, and daily visits. Replaces Credits.',
		'website' => 'https://warez.skin',
		'author' => 'warez.skin',
		'version' => '1.0',
		'compatibility' => '18*',
	);
}

function bits_install()
{
	global $db;

	if (!$db->field_exists('bits', 'users')) {
		$db->add_column('users', 'bits', "INT UNSIGNED NOT NULL DEFAULT 0");
	}

	if (!$db->table_exists('bits_log')) {
		$db->write_query("CREATE TABLE ".TABLE_PREFIX."bits_log (
			lid INT UNSIGNED NOT NULL AUTO_INCREMENT,
			uid INT UNSIGNED NOT NULL DEFAULT 0,
			amount INT NOT NULL DEFAULT 0,
			balance INT UNSIGNED NOT NULL DEFAULT 0,
			reason VARCHAR(120) NOT NULL DEFAULT '',
			dateline INT UNSIGNED NOT NULL DEFAULT 0,
			PRIMARY KEY (lid),
			KEY uid (uid),
			KEY dateline (dateline)
		) ENGINE=MyISAM DEFAULT CHARSET=utf8");
	}

	if (!$db->table_exists('bits_daily')) {
		$db->write_query("CREATE TABLE ".TABLE_PREFIX."bits_daily (
			uid INT UNSIGNED NOT NULL DEFAULT 0,
			daykey CHAR(8) NOT NULL DEFAULT '',
			PRIMARY KEY (uid)
		) ENGINE=MyISAM DEFAULT CHARSET=utf8");
	}

	// Seed existing members from activity so nobody starts empty
	$db->write_query("UPDATE ".TABLE_PREFIX."users SET bits = GREATEST(bits, (postnum * 5) + (threadnum * 15)) WHERE uid > 0");

	bits_insert_settings();
}

function bits_is_installed()
{
	global $db;
	return $db->field_exists('bits', 'users');
}

function bits_uninstall()
{
	global $db;

	$db->delete_query('settings', "name LIKE 'bits_%'");
	$db->delete_query('settinggroups', "name='bits'");
	rebuild_settings();

	// Keep balances/log by default — drop only if tables exist and admin uninstalls fully
	if ($db->table_exists('bits_log')) {
		$db->drop_table('bits_log');
	}
	if ($db->table_exists('bits_daily')) {
		$db->drop_table('bits_daily');
	}
	if ($db->field_exists('bits', 'users')) {
		$db->drop_column('users', 'bits');
	}
}

function bits_activate()
{
	bits_insert_settings();
}

function bits_deactivate()
{
}

function bits_insert_settings()
{
	global $db;

	$query = $db->simple_select('settinggroups', 'gid', "name='bits'", array('limit' => 1));
	$gid = (int)$db->fetch_field($query, 'gid');
	if (!$gid) {
		$gid = (int)$db->insert_query('settinggroups', array(
			'name' => 'bits',
			'title' => 'Bits Currency',
			'description' => 'How members earn Bits on warez.skin.',
			'disporder' => 80,
			'isdefault' => 0,
		));
	}

	$settings = array(
		'bits_enabled' => array('Yes', 'Enable Bits earning', 'yesno', '1', 1),
		'bits_per_thread' => array('Bits per new thread', 'Awarded when a member creates a thread.', 'numeric', '15', 2),
		'bits_per_reply' => array('Bits per reply', 'Awarded when a member posts a reply.', 'numeric', '5', 3),
		'bits_daily' => array('Daily visit Bits', 'Awarded once per day when a member visits while logged in.', 'numeric', '10', 4),
		'bits_per_rep' => array('Bits per +reputation', 'Awarded to the receiver for each positive reputation point.', 'numeric', '3', 5),
		'bits_new_member' => array('Signup bonus', 'Bits given when a new account registers.', 'numeric', '25', 6),
		'bits_lucky_chance' => array('Lucky bonus chance %', 'Percent chance (0-100) to earn a lucky Bits bonus on each reply.', 'numeric', '12', 7),
		'bits_lucky_amount' => array('Lucky bonus amount', 'Extra Bits awarded when the lucky roll succeeds.', 'numeric', '25', 8),
	);

	$disp = 1;
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
		$disp++;
	}
	rebuild_settings();
}

/**
 * Award (or remove) bits and write a log row.
 */
function bits_award($uid, $amount, $reason = '')
{
	global $db, $mybb;

	$uid = (int)$uid;
	$amount = (int)$amount;
	if ($uid < 1 || $amount === 0) {
		return false;
	}
	if (!empty($mybb->settings['bits_enabled']) && $mybb->settings['bits_enabled'] == 0) {
		return false;
	}

	if (!$db->field_exists('bits', 'users')) {
		return false;
	}

	if ($amount > 0) {
		$db->write_query("UPDATE ".TABLE_PREFIX."users SET bits = bits + {$amount} WHERE uid={$uid}");
	} else {
		$db->write_query("UPDATE ".TABLE_PREFIX."users SET bits = IF(bits >= ".abs($amount).", bits - ".abs($amount).", 0) WHERE uid={$uid}");
	}

	$query = $db->simple_select('users', 'bits', "uid={$uid}", array('limit' => 1));
	$balance = (int)$db->fetch_field($query, 'bits');

	$db->insert_query('bits_log', array(
		'uid' => $uid,
		'amount' => $amount,
		'balance' => $balance,
		'reason' => $db->escape_string(my_substr($reason, 0, 120)),
		'dateline' => TIME_NOW,
	));

	if (!empty($mybb->user['uid']) && (int)$mybb->user['uid'] === $uid) {
		$mybb->user['bits'] = $balance;
	}

	return $balance;
}

function bits_get($uid)
{
	global $db;
	$uid = (int)$uid;
	if ($uid < 1 || !$db->field_exists('bits', 'users')) {
		return 0;
	}
	$query = $db->simple_select('users', 'bits', "uid={$uid}", array('limit' => 1));
	return (int)$db->fetch_field($query, 'bits');
}

function bits_format($n)
{
	return my_number_format((int)$n);
}

/* ---------- hooks ---------- */
$plugins->add_hook('global_start', 'bits_global_start');
$plugins->add_hook('global_intermediate', 'bits_global_show');
$plugins->add_hook('newthread_do_newthread_end', 'bits_on_newthread');
$plugins->add_hook('newreply_do_newreply_end', 'bits_on_newreply');
$plugins->add_hook('member_do_register_end', 'bits_on_register');
$plugins->add_hook('reputation_do_add_process', 'bits_on_reputation');
$plugins->add_hook('postbit', 'bits_postbit');
$plugins->add_hook('member_profile_end', 'bits_profile');
$plugins->add_hook('fetch_user_fields', 'bits_fetch_user_fields');

function bits_fetch_user_fields(&$fields)
{
	// Ensure bits rides along when MyBB loads user rows where applicable
}

function bits_global_start()
{
	global $mybb, $db;
	if (empty($mybb->user['uid']) || !$db->field_exists('bits', 'users')) {
		return;
	}
	if (!isset($mybb->user['bits'])) {
		$mybb->user['bits'] = bits_get((int)$mybb->user['uid']);
	}
}

function bits_global_show()
{
	global $mybb, $db, $yh_bits, $yh_bits_fmt;

	$yh_bits = 0;
	$yh_bits_fmt = '0';

	if (empty($mybb->user['uid']) || !$db->field_exists('bits', 'users')) {
		return;
	}

	$uid = (int)$mybb->user['uid'];
	$yh_bits = isset($mybb->user['bits']) ? (int)$mybb->user['bits'] : bits_get($uid);
	$yh_bits_fmt = bits_format($yh_bits);

	// Daily visit chance
	if (!empty($mybb->settings['bits_enabled']) && (int)$mybb->settings['bits_enabled'] === 1) {
		$daily = (int)$mybb->settings['bits_daily'];
		if ($daily > 0 && $db->table_exists('bits_daily')) {
			$daykey = gmdate('Ymd', TIME_NOW);
			$query = $db->simple_select('bits_daily', 'daykey', "uid={$uid}", array('limit' => 1));
			$row = $db->fetch_array($query);
			if (!$row) {
				$db->insert_query('bits_daily', array('uid' => $uid, 'daykey' => $db->escape_string($daykey)));
				bits_award($uid, $daily, 'Daily visit');
				$yh_bits = (int)$mybb->user['bits'];
				$yh_bits_fmt = bits_format($yh_bits);
			} elseif ($row['daykey'] !== $daykey) {
				$db->update_query('bits_daily', array('daykey' => $db->escape_string($daykey)), "uid={$uid}");
				bits_award($uid, $daily, 'Daily visit');
				$yh_bits = (int)$mybb->user['bits'];
				$yh_bits_fmt = bits_format($yh_bits);
			}
		}
	}
}

function bits_on_newthread()
{
	global $mybb, $tid;
	if (empty($mybb->user['uid'])) {
		return;
	}
	$amount = isset($mybb->settings['bits_per_thread']) ? (int)$mybb->settings['bits_per_thread'] : 15;
	if ($amount > 0) {
		bits_award((int)$mybb->user['uid'], $amount, 'New thread #'.(int)$tid);
	}
}

function bits_on_newreply()
{
	global $mybb, $pid, $thread;
	if (empty($mybb->user['uid'])) {
		return;
	}
	// Avoid double-paying the thread starter's first post (newthread already paid)
	if (!empty($thread['firstpost']) && !empty($pid) && (int)$thread['firstpost'] === (int)$pid) {
		return;
	}
	$uid = (int)$mybb->user['uid'];
	$amount = isset($mybb->settings['bits_per_reply']) ? (int)$mybb->settings['bits_per_reply'] : 5;
	if ($amount > 0) {
		bits_award($uid, $amount, 'New reply #'.(int)$pid);
	}

	// Random lucky drop — every reply has a chance
	$chance = isset($mybb->settings['bits_lucky_chance']) ? (int)$mybb->settings['bits_lucky_chance'] : 12;
	$bonus = isset($mybb->settings['bits_lucky_amount']) ? (int)$mybb->settings['bits_lucky_amount'] : 25;
	if ($chance > 0 && $bonus > 0) {
		$chance = min(100, max(0, $chance));
		if (mt_rand(1, 100) <= $chance) {
			bits_award($uid, $bonus, 'Lucky Bits drop!');
		}
	}
}

function bits_on_register()
{
	global $mybb, $user_info, $uid;
	$newuid = 0;
	if (!empty($uid)) {
		$newuid = (int)$uid;
	} elseif (!empty($user_info['uid'])) {
		$newuid = (int)$user_info['uid'];
	}
	if ($newuid < 1) {
		return;
	}
	$amount = isset($mybb->settings['bits_new_member']) ? (int)$mybb->settings['bits_new_member'] : 25;
	if ($amount > 0) {
		bits_award($newuid, $amount, 'Welcome bonus');
	}
}

function bits_on_reputation()
{
	global $mybb, $reputation;
	if (empty($reputation) || !is_array($reputation)) {
		return;
	}
	$target = isset($reputation['uid']) ? (int)$reputation['uid'] : 0;
	$rep = isset($reputation['reputation']) ? (int)$reputation['reputation'] : 0;
	if ($target < 1 || $rep <= 0) {
		return;
	}
	$per = isset($mybb->settings['bits_per_rep']) ? (int)$mybb->settings['bits_per_rep'] : 3;
	if ($per > 0) {
		bits_award($target, $per * $rep, 'Reputation received');
	}
}

function bits_postbit(&$post)
{
	$bits = isset($post['bits']) ? (int)$post['bits'] : 0;
	if ($bits === 0 && !empty($post['uid'])) {
		$bits = bits_get((int)$post['uid']);
	}
	$post['yh_bits'] = bits_format($bits);
	$post['yh_credits'] = $post['yh_bits']; // back-compat
}

function bits_profile()
{
	global $memprofile, $bits_display;
	$bits = isset($memprofile['bits']) ? (int)$memprofile['bits'] : 0;
	$bits_display = bits_format($bits);
}
