<?php
/**
 * App Repos JSON API (used by portal discovery UI)
 */
define('IN_MYBB', 1);
define('THIS_SCRIPT', 'apprepos.php');
define('NO_ONLINE', 1);

require_once './global.php';

header('Content-Type: application/json; charset=utf-8');
header('Cache-Control: no-store');

if (!function_exists('apprepos_enabled') || !apprepos_enabled()) {
	echo json_encode(array('ok' => false, 'error' => 'App repos disabled.'));
	exit;
}

$method = $_SERVER['REQUEST_METHOD'] ?? 'GET';
$action = $mybb->get_input('action');
$id = $mybb->get_input('id');

try {
	if ($method === 'GET') {
		if ($action === 'repos') {
			$withApps = $mybb->get_input('apps') === '1' || $mybb->get_input('apps') === 'true';
			echo json_encode(array('ok' => true, 'repos' => apprepos_list_repos($withApps), 'stats' => apprepos_stats()));
			exit;
		}
		if ($action === 'apps') {
			$q = $mybb->get_input('q');
			$limit = (int)$mybb->get_input('limit');
			if ($limit <= 0) {
				$limit = 200;
			}
			$apps = apprepos_search_apps($q, $limit);
			echo json_encode(array('ok' => true, 'q' => $q, 'count' => count($apps), 'apps' => $apps));
			exit;
		}
		if ($action === 'app') {
			$app = apprepos_get_app($mybb->get_input('repo'), $mybb->get_input('id'));
			if (!$app) {
				http_response_code(404);
				echo json_encode(array('ok' => false, 'error' => 'app not found'));
				exit;
			}
			echo json_encode(array('ok' => true, 'app' => $app));
			exit;
		}
		// default / status
		echo json_encode(array_merge(array('ok' => true, 'service' => 'warez.skin', 'focus' => 'ipa-app-repo-discovery'), apprepos_stats()));
		exit;
	}

	if ($method === 'POST' && ($action === 'add' || $action === 'repos')) {
		if (!apprepos_can_manage()) {
			http_response_code(403);
			echo json_encode(array('ok' => false, 'error' => 'Log in to index sources.'));
			exit;
		}
		verify_post_check($mybb->get_input('my_post_key'));
		$body = json_decode(file_get_contents('php://input'), true);
		$sourceURL = '';
		if (is_array($body)) {
			$sourceURL = trim((string)($body['sourceURL'] ?? $body['url'] ?? ''));
		}
		if ($sourceURL === '') {
			$sourceURL = trim($mybb->get_input('sourceURL'));
		}
		if ($sourceURL === '') {
			http_response_code(400);
			echo json_encode(array('ok' => false, 'error' => 'sourceURL required'));
			exit;
		}
		$repo = apprepos_add_repo($sourceURL);
		echo json_encode(array('ok' => true, 'repo' => $repo));
		exit;
	}

	if ($method === 'POST' && $action === 'refresh') {
		if (!apprepos_can_manage()) {
			http_response_code(403);
			echo json_encode(array('ok' => false, 'error' => 'Log in to refresh sources.'));
			exit;
		}
		verify_post_check($mybb->get_input('my_post_key'));
		$repo = apprepos_refresh_repo($id);
		if (!$repo) {
			http_response_code(404);
			echo json_encode(array('ok' => false, 'error' => 'repo not found'));
			exit;
		}
		echo json_encode(array('ok' => true, 'repo' => $repo));
		exit;
	}

	if (($method === 'POST' || $method === 'DELETE') && $action === 'remove') {
		if (!apprepos_can_manage()) {
			http_response_code(403);
			echo json_encode(array('ok' => false, 'error' => 'Log in to remove sources.'));
			exit;
		}
		verify_post_check($mybb->get_input('my_post_key'));
		$ok = apprepos_remove_repo($id);
		if (!$ok) {
			http_response_code(404);
			echo json_encode(array('ok' => false, 'error' => 'repo not found'));
			exit;
		}
		echo json_encode(array('ok' => true));
		exit;
	}

	http_response_code(400);
	echo json_encode(array('ok' => false, 'error' => 'Unknown action'));
} catch (Exception $e) {
	http_response_code(400);
	echo json_encode(array('ok' => false, 'error' => $e->getMessage()));
}
exit;
