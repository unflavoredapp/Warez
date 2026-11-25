<?php
/**
 * Bits — balance, earn guide, and recent history
 */
define('IN_MYBB', 1);
define('THIS_SCRIPT', 'bits.php');

require_once './global.php';

if (!function_exists('bits_get')) {
	error('Bits plugin is not active. Enable <strong>Bits Currency</strong> in Admin CP → Plugins.');
}

$lang->load('member');

add_breadcrumb('Bits', 'bits.php');

$uid = 0;
$username = 'Guest';
$balance = 0;
$is_own = false;

if ($mybb->user['uid']) {
	$uid = (int)$mybb->user['uid'];
	$username = htmlspecialchars_uni($mybb->user['username']);
	$balance = isset($mybb->user['bits']) ? (int)$mybb->user['bits'] : bits_get($uid);
	$is_own = true;
}

if ($mybb->get_input('uid', MyBB::INPUT_INT) > 0 && is_moderator()) {
	$uid = $mybb->get_input('uid', MyBB::INPUT_INT);
	$user = get_user($uid);
	if ($user) {
		$username = htmlspecialchars_uni($user['username']);
		$balance = isset($user['bits']) ? (int)$user['bits'] : bits_get($uid);
		$is_own = ((int)$mybb->user['uid'] === $uid);
	}
}

$per_thread = (int)$mybb->settings['bits_per_thread'];
$per_reply = (int)$mybb->settings['bits_per_reply'];
$per_daily = (int)$mybb->settings['bits_daily'];
$per_rep = (int)$mybb->settings['bits_per_rep'];
$per_signup = (int)$mybb->settings['bits_new_member'];
$lucky_chance = (int)$mybb->settings['bits_lucky_chance'];
$lucky_amount = (int)$mybb->settings['bits_lucky_amount'];

$history = '';
if ($uid > 0 && $db->table_exists('bits_log')) {
	$query = $db->simple_select('bits_log', '*', "uid={$uid}", array('order_by' => 'dateline', 'order_dir' => 'DESC', 'limit' => 25));
	$alt = 'trow1';
	while ($row = $db->fetch_array($query)) {
		$amt = (int)$row['amount'];
		$cls = $amt >= 0 ? 'yh-bits-pos' : 'yh-bits-neg';
		$sign = $amt >= 0 ? '+' : '';
		$reason = htmlspecialchars_uni($row['reason']);
		$when = my_date('relative', (int)$row['dateline']);
		$bal = bits_format((int)$row['balance']);
		$history .= '<tr>
			<td class="'.$alt.'"><span class="'.$cls.'">'.$sign.bits_format($amt).'</span></td>
			<td class="'.$alt.'">'.$reason.'</td>
			<td class="'.$alt.'">'.$bal.'</td>
			<td class="'.$alt.'" style="white-space:nowrap">'.$when.'</td>
		</tr>';
		$alt = ($alt === 'trow1') ? 'trow2' : 'trow1';
	}
}
if ($history === '') {
	$history = '<tr><td class="trow1" colspan="4">No Bits activity yet. Post, reply, or come back tomorrow for your daily drop.</td></tr>';
}

$login_note = '';
if (!$mybb->user['uid']) {
	$login_note = '<div class="yh-bits-note">Log in or <a href="'.$mybb->settings['bburl'].'/member.php?action=register">register</a> to start earning Bits.</div>';
}

$balance_fmt = bits_format($balance);

$content = '
<div class="yh-bits-page">
	<div class="yh-bits-hero">
		<div class="yh-bits-label">Bits Balance</div>
		<div class="yh-bits-amount">'.$balance_fmt.'</div>
		<div class="yh-bits-user">'.($uid ? $username : 'Guest').'</div>
	</div>
	'.$login_note.'

	<table border="0" cellspacing="0" cellpadding="0" class="tborder yh-cat" style="margin-top:12px">
		<thead><tr><td class="thead" colspan="2"><strong>How to earn Bits</strong></td></tr></thead>
		<tbody>
			<tr><td class="tcat" width="55%">Action</td><td class="tcat">Reward</td></tr>
			<tr><td class="trow1">Create a new thread</td><td class="trow1 yh-bits-pos">+'.bits_format($per_thread).' Bits</td></tr>
			<tr><td class="trow2">Post a reply</td><td class="trow2 yh-bits-pos">+'.bits_format($per_reply).' Bits</td></tr>
			<tr><td class="trow1">Daily visit (once per day)</td><td class="trow1 yh-bits-pos">+'.bits_format($per_daily).' Bits</td></tr>
			<tr><td class="trow2">Receive +reputation</td><td class="trow2 yh-bits-pos">+'.bits_format($per_rep).' Bits / point</td></tr>
			<tr><td class="trow1">New member signup bonus</td><td class="trow1 yh-bits-pos">+'.bits_format($per_signup).' Bits</td></tr>
			<tr><td class="trow2">Lucky drop on reply ('.$lucky_chance.'% chance)</td><td class="trow2 yh-bits-pos">+'.bits_format($lucky_amount).' Bits</td></tr>
		</tbody>
	</table>

	<table border="0" cellspacing="0" cellpadding="0" class="tborder yh-cat" style="margin-top:14px">
		<thead><tr><td class="thead" colspan="4"><strong>Recent Bits activity</strong></td></tr></thead>
		<tbody>
			<tr>
				<td class="tcat" width="90">Change</td>
				<td class="tcat">Reason</td>
				<td class="tcat" width="90">Balance</td>
				<td class="tcat" width="140">When</td>
			</tr>
			'.$history.'
		</tbody>
	</table>
</div>
';

$page = <<<EOF
<html>
<head>
<title>{$mybb->settings['bbname']} - Bits</title>
{$headerinclude}
</head>
<body>
{$header}
{$content}
{$footer}
</body>
</html>
EOF;

output_page($page);
