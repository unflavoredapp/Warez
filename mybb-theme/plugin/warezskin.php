<?php
if (!defined('IN_MYBB')) {
	die('Direct initialization of this file is not allowed.');
}

function warezskin_info()
{
	return array(
		'name' => 'warez.skin Theme Helpers',
		'description' => 'Light helpers for the warez.skin YouHack-style theme.',
		'website' => 'https://warez.skin',
		'author' => 'warez.skin',
		'version' => '1.1',
		'compatibility' => '18*'
	);
}

function warezskin_activate() {}
function warezskin_deactivate() {}

// Intentionally no index_end boardstats override — classic table stats are used.
