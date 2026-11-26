<?php
/**
 * Panel Chat AJAX endpoint
 */
define('IN_MYBB', 1);
define('THIS_SCRIPT', 'panelchat.php');
define('NO_ONLINE', 1);

require_once './global.php';

header('Content-Type: application/json; charset=utf-8');

if (!function_exists('panelchat_enabled') || !panelchat_enabled()) {
	echo json_encode(array('error' => 'Chat is disabled.'));
	exit;
}

if (empty($mybb->user['uid'])) {
	echo json_encode(array('error' => 'Log in to chat.'));
	exit;
}

$action = $mybb->get_input('action');
$limit = isset($mybb->settings['panelchat_limit']) ? (int)$mybb->settings['panelchat_limit'] : 12;

if ($action === 'fetch' || $mybb->request_method === 'get') {
	echo json_encode(array(
		'ok' => 1,
		'html' => panelchat_build_feed($limit),
	));
	exit;
}

if ($action === 'send' && $mybb->request_method === 'post') {
	verify_post_check($mybb->get_input('my_post_key'));
	$result = panelchat_send((int)$mybb->user['uid'], $mybb->user['username'], $mybb->get_input('message'));
	if (!empty($result['error'])) {
		echo json_encode($result);
		exit;
	}
	echo json_encode(array(
		'ok' => 1,
		'mid' => $result['mid'],
		'html' => panelchat_build_feed($limit),
	));
	exit;
}

echo json_encode(array('error' => 'Unknown action.'));
exit;
