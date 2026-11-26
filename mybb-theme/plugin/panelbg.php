<?php
/**
 * Panel Background — members upload a GIF/image behind the header account box
 */
if (!defined('IN_MYBB')) {
	die('Direct initialization of this file is not allowed.');
}

function panelbg_info()
{
	return array(
		'name' => 'Panel Background',
		'description' => 'Let members upload a GIF/image background for the header account panel.',
		'website' => 'https://warez.skin',
		'author' => 'warez.skin',
		'version' => '1.0',
		'compatibility' => '18*',
	);
}

function panelbg_install()
{
	global $db;

	if (!$db->field_exists('panelbg', 'users')) {
		$db->add_column('users', 'panelbg', "VARCHAR(255) NOT NULL DEFAULT ''");
	}

	panelbg_insert_settings();
	@mkdir(MYBB_ROOT.'uploads/panelbg', 0755, true);
	@file_put_contents(MYBB_ROOT.'uploads/panelbg/index.html', '');
}

function panelbg_is_installed()
{
	global $db;
	return $db->field_exists('panelbg', 'users');
}

function panelbg_uninstall()
{
	global $db;

	$db->delete_query('settings', "name LIKE 'panelbg_%'");
	$db->delete_query('settinggroups', "name='panelbg'");
	rebuild_settings();

	if ($db->field_exists('panelbg', 'users')) {
		$db->drop_column('users', 'panelbg');
	}
}

function panelbg_activate()
{
	panelbg_insert_settings();
}

function panelbg_deactivate()
{
}

function panelbg_insert_settings()
{
	global $db;

	$query = $db->simple_select('settinggroups', 'gid', "name='panelbg'", array('limit' => 1));
	$gid = (int)$db->fetch_field($query, 'gid');
	if (!$gid) {
		$gid = (int)$db->insert_query('settinggroups', array(
			'name' => 'panelbg',
			'title' => 'Panel Background',
			'description' => 'Header account panel GIF/image backgrounds.',
			'disporder' => 81,
			'isdefault' => 0,
		));
	}

	$settings = array(
		'panelbg_enabled' => array('Enable panel backgrounds', 'Allow members to upload a background for the header account box.', 'yesno', '1', 1),
		'panelbg_maxsize' => array('Max upload size (KB)', 'Maximum file size for panel backgrounds.', 'numeric', '2048', 2),
		'panelbg_groups' => array('Allowed groups', 'Comma-separated group IDs that may upload. Leave empty for all registered members.', 'text', '', 3),
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

$plugins->add_hook('global_intermediate', 'panelbg_prepare');
$plugins->add_hook('usercp_menu', 'panelbg_usercp_menu', 40);
$plugins->add_hook('usercp_start', 'panelbg_usercp');

function panelbg_allowed()
{
	global $mybb;

	if (empty($mybb->settings['panelbg_enabled']) || empty($mybb->user['uid'])) {
		return false;
	}
	$groups = trim((string)$mybb->settings['panelbg_groups']);
	if ($groups === '') {
		return true;
	}
	$allowed = array_map('intval', explode(',', $groups));
	$user_groups = array((int)$mybb->user['usergroup']);
	if (!empty($mybb->user['additionalgroups'])) {
		foreach (explode(',', $mybb->user['additionalgroups']) as $g) {
			$user_groups[] = (int)$g;
		}
	}
	return (bool)array_intersect($allowed, $user_groups);
}

function panelbg_url($path)
{
	global $mybb;
	$path = trim((string)$path);
	if ($path === '') {
		return '';
	}
	if (preg_match('#^https?://#i', $path)) {
		return $path;
	}
	return rtrim($mybb->settings['bburl'], '/').'/'.ltrim($path, '/');
}

function panelbg_prepare()
{
	global $mybb, $yh_panelbg_style, $yh_panelbg_class;

	$yh_panelbg_style = '';
	$yh_panelbg_class = '';

	if (empty($mybb->user['uid'])) {
		return;
	}

	$path = '';
	if (!empty($mybb->user['panelbg'])) {
		$path = $mybb->user['panelbg'];
	}

	$url = panelbg_url($path);
	if ($url === '') {
		return;
	}

	$safe = htmlspecialchars_uni($url);
	$yh_panelbg_class = ' yh-has-panelbg';
	$yh_panelbg_style = ' style="--yh-panelbg: url(\''.$safe.'\')"';
}

function panelbg_usercp_menu()
{
	global $mybb, $usercpmenu, $lang;

	if (!panelbg_allowed()) {
		return;
	}

	$usercpmenu .= '<tr><td class="trow1 smalltext"><a href="usercp.php?action=panelbg" class="usercp_nav_item usercp_nav_options">Panel Background</a></td></tr>';
}

function panelbg_usercp()
{
	global $mybb, $db, $lang, $headerinclude, $header, $footer, $usercpnav, $theme, $plugins;

	if ($mybb->input['action'] != 'panelbg') {
		return;
	}

	if (!$mybb->user['uid']) {
		error_no_permission();
	}
	if (!panelbg_allowed()) {
		error('Panel backgrounds are disabled for your account.');
	}

	$lang->load('usercp');
	add_breadcrumb($lang->nav_usercp, 'usercp.php');
	add_breadcrumb('Panel Background', 'usercp.php?action=panelbg');

	$errors = array();
	$success = '';

	if ($mybb->request_method == 'post') {
		verify_post_check($mybb->get_input('my_post_key'));

		if (!empty($mybb->input['remove'])) {
			panelbg_delete_file($mybb->user['panelbg']);
			$db->update_query('users', array('panelbg' => ''), 'uid='.(int)$mybb->user['uid']);
			$mybb->user['panelbg'] = '';
			$success = 'Panel background removed.';
		} else {
			$result = panelbg_handle_upload((int)$mybb->user['uid']);
			if (!empty($result['error'])) {
				$errors[] = $result['error'];
			} else {
				$success = 'Panel background updated. GIFs are supported.';
				$mybb->user['panelbg'] = $result['path'];
			}
		}
	}

	$current = '';
	$url = panelbg_url($mybb->user['panelbg'] ?? '');
	if ($url !== '') {
		$safe = htmlspecialchars_uni($url);
		$current = '<div class="yh-panelbg-preview" style="background-image:url(\''.$safe.'\')"></div>
			<p class="smalltext">Current background preview</p>';
	} else {
		$current = '<p class="smalltext">No custom background set.</p>';
	}

	$error_box = '';
	if ($errors) {
		$error_box = inline_error($errors);
	}
	$success_box = '';
	if ($success !== '') {
		$success_box = '<div class="success">'.htmlspecialchars_uni($success).'</div><br />';
	}

	$maxkb = (int)$mybb->settings['panelbg_maxsize'];
	if ($maxkb < 100) {
		$maxkb = 2048;
	}

	$content = $error_box.$success_box.'
<table border="0" cellspacing="0" cellpadding="0" class="tborder yh-cat">
<tr><td class="thead"><strong>Panel Background</strong></td></tr>
<tr><td class="trow1">
	<p>Upload a GIF, PNG, JPG, or WebP used behind your account box in the site header (the area next to your avatar).</p>
	<p class="smalltext">Max size: '.$maxkb.' KB. Animated GIFs work. A dark overlay keeps your links readable.</p>
	'.$current.'
	<form method="post" action="usercp.php?action=panelbg" enctype="multipart/form-data">
		<input type="hidden" name="my_post_key" value="'.$mybb->post_code.'" />
		<p><input type="file" name="panelbgfile" accept="image/gif,image/png,image/jpeg,image/webp,.gif,.png,.jpg,.jpeg,.webp" /></p>
		<p>
			<input type="submit" class="button" name="submit" value="Upload Background" />
			<input type="submit" class="button" name="remove" value="Remove Background" onclick="return confirm(\'Remove your panel background?\');" />
		</p>
	</form>
</td></tr>
</table>
';

	output_page('<html><head><title>'.$mybb->settings['bbname'].' - Panel Background</title>'.$headerinclude.'</head><body>'.$header.'
<table width="100%" border="0" cellspacing="0" cellpadding="0"><tr>
<td valign="top" width="180">'.$usercpnav.'</td>
<td valign="top">'.$content.'</td>
</tr></table>
'.$footer.'</body></html>');
	exit;
}

function panelbg_delete_file($path)
{
	$path = trim((string)$path);
	if ($path === '' || strpos($path, 'uploads/panelbg/') !== 0) {
		return;
	}
	$full = MYBB_ROOT.$path;
	if (is_file($full)) {
		@unlink($full);
	}
}

function panelbg_handle_upload($uid)
{
	global $mybb, $db;

	if (empty($_FILES['panelbgfile']) || !is_uploaded_file($_FILES['panelbgfile']['tmp_name'])) {
		return array('error' => 'Choose an image file to upload.');
	}

	$file = $_FILES['panelbgfile'];
	if (!empty($file['error'])) {
		return array('error' => 'Upload failed (error '.$file['error'].').');
	}

	$maxkb = (int)$mybb->settings['panelbg_maxsize'];
	if ($maxkb < 100) {
		$maxkb = 2048;
	}
	if ((int)$file['size'] > $maxkb * 1024) {
		return array('error' => 'File is too large. Max '.$maxkb.' KB.');
	}

	$info = @getimagesize($file['tmp_name']);
	if (!$info || empty($info['mime'])) {
		return array('error' => 'That file is not a valid image.');
	}

	$mime_map = array(
		'image/gif' => 'gif',
		'image/png' => 'png',
		'image/jpeg' => 'jpg',
		'image/webp' => 'webp',
	);
	if (!isset($mime_map[$info['mime']])) {
		return array('error' => 'Allowed types: GIF, PNG, JPG, WebP.');
	}
	$ext = $mime_map[$info['mime']];

	$dir = MYBB_ROOT.'uploads/panelbg';
	if (!is_dir($dir)) {
		@mkdir($dir, 0755, true);
	}

	$basename = 'u'.$uid.'_'.TIME_NOW.'.'.$ext;
	$rel = 'uploads/panelbg/'.$basename;
	$dest = MYBB_ROOT.$rel;

	if (!@move_uploaded_file($file['tmp_name'], $dest)) {
		return array('error' => 'Could not save the uploaded file.');
	}
	@chmod($dest, 0644);

	// Remove previous file for this user
	$old = '';
	if (!empty($mybb->user['panelbg'])) {
		$old = $mybb->user['panelbg'];
	}
	panelbg_delete_file($old);

	$db->update_query('users', array('panelbg' => $db->escape_string($rel)), 'uid='.(int)$uid);

	return array('path' => $rel);
}
