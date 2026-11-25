<?php
/**
 * CLI: post a changelog update as WAREZBOT
 * Usage: php post-changelog.php "Message here"
 *        php post-changelog.php --file=/path/to/message.txt
 */
define('IN_MYBB', 1);
define('MYBB_ROOT', '/var/www/warez.skin/');
chdir(MYBB_ROOT);
require MYBB_ROOT.'inc/init.php';
require_once MYBB_ROOT.'inc/plugins/changelogbot.php';

$message = '';
foreach (array_slice($argv, 1) as $arg) {
	if (strpos($arg, '--file=') === 0) {
		$path = substr($arg, 7);
		if (is_file($path)) {
			$message = file_get_contents($path);
		}
	} else {
		$message .= ($message === '' ? '' : ' ').$arg;
	}
}

$message = trim($message);
if ($message === '') {
	fwrite(STDERR, "Usage: php post-changelog.php \"Your update\"\n");
	exit(1);
}

if (!changelogbot_is_installed()) {
	changelogbot_install();
}
changelogbot_activate();

$result = changelogbot_post($message);
if ($result && !empty($result['pid'])) {
	$tid = (int)$mybb->settings['changelogbot_tid'];
	echo "Posted pid={$result['pid']} tid={$tid}\n";
	echo $mybb->settings['bburl'].'/'.get_post_link((int)$result['pid'], $tid)."#pid{$result['pid']}\n";
	exit(0);
}

fwrite(STDERR, "Failed to post changelog.\n");
exit(2);
