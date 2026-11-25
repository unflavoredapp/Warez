<?php
/**
 * Admin CP → Tools → Changelog Bot
 * Posts updates into the Changelog forum as WAREZBOT.
 */
if (!defined('IN_MYBB')) {
	die('Direct initialization of this file is not allowed.');
}

$page->add_breadcrumb_item('Changelog Bot', 'index.php?module=tools-changelogbot');

if ($mybb->request_method == 'post') {
	if (!verify_post_check($mybb->get_input('my_post_key'))) {
		flash_message('Invalid post token.', 'error');
		admin_redirect('index.php?module=tools-changelogbot');
	}

	$message = trim($mybb->get_input('message'));
	if ($message === '') {
		flash_message('Write an update message first.', 'error');
		admin_redirect('index.php?module=tools-changelogbot');
	}

	if (!function_exists('changelogbot_post')) {
		require_once MYBB_ROOT.'inc/plugins/changelogbot.php';
	}

	$result = changelogbot_post($message);
	if ($result && !empty($result['pid'])) {
		$tid = (int)$mybb->settings['changelogbot_tid'];
		$link = '../'.get_post_link((int)$result['pid'], $tid).'#pid'.(int)$result['pid'];
		flash_message('WAREZBOT posted the update. <a href="'.htmlspecialchars_uni($link).'" target="_blank">View post</a>', 'success');
	} else {
		flash_message('Bot could not post. Check Settings → Changelog Bot (forum ID / bot account).', 'error');
	}
	admin_redirect('index.php?module=tools-changelogbot');
}

$page->output_header('Changelog Bot');

$bot_uid = (int)$mybb->settings['changelogbot_uid'];
$bot_name = htmlspecialchars_uni($mybb->settings['changelogbot_username']);
$fid = (int)$mybb->settings['changelogbot_fid'];
$tid = (int)$mybb->settings['changelogbot_tid'];
$forum = get_forum($fid);
$forum_name = $forum ? htmlspecialchars_uni($forum['name']) : 'unknown';

$form = new Form('index.php?module=tools-changelogbot', 'post');
$form_container = new FormContainer('Post site update as '.$bot_name);

echo '<div class="success_message" style="margin-bottom:12px">
	<strong>Bot:</strong> '.$bot_name.' (uid '.$bot_uid.') &nbsp;|&nbsp;
	<strong>Forum:</strong> '.$forum_name.' (#'.$fid.') &nbsp;|&nbsp;
	<strong>Thread:</strong> #'.$tid.'
	'.($tid ? ' — <a href="../'.get_thread_link($tid).'" target="_blank">open thread</a>' : '').'
</div>';

$form_container->output_row(
	'Update message',
	'MyCode allowed. WAREZBOT will wrap this with an “Update — date” header and reply in the changelog thread.',
	$form->generate_text_area('message', '', array('rows' => 10, 'style' => 'width:100%')),
	'message'
);

$form_container->end();
$buttons[] = $form->generate_submit_button('Post as WAREZBOT');
$form->output_submit_wrapper($buttons);
$form->end();

echo '<p class="quick_form" style="margin-top:18px;color:#666">
	Tip: you can also post from the VPS with<br>
	<code>php /opt/warez-theme/post-changelog.php "Your update here"</code>
</p>';

$page->output_footer();
