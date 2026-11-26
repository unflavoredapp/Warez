<?php
/**
 * Template Conditionals — Zinga Burga–compatible syntax for MyBB 1.8
 *
 *   <if $mybb->user['uid'] then>…<else>…</if>
 *   <if $mybb->ismobile then>…</if>
 *   <if $mybb->user['bits'] >= 100 then>…<elseif … then>…<else>…</if>
 */
if (!defined('IN_MYBB')) {
	die('Direct initialization of this file is not allowed.');
}

function template_conditionals_info()
{
	return array(
		'name' => 'Template Conditionals',
		'description' => 'Enables &lt;if&gt; / &lt;elseif&gt; / &lt;else&gt; / &lt;/if&gt; logic inside templates.',
		'website' => 'https://warez.skin',
		'author' => 'warez.skin',
		'authorsite' => 'https://warez.skin',
		'version' => '2.2',
		'compatibility' => '18*',
		'codename' => 'template_conditionals',
	);
}

function template_conditionals_activate() {}
function template_conditionals_deactivate() {}

$plugins->add_hook('global_start', 'template_conditionals_run', 0);
$plugins->add_hook('global_intermediate', 'template_conditionals_bake_cache');

if (!function_exists('control_object')) {
	function control_object(&$obj, $code)
	{
		static $cnt = 0;
		$parent = get_class($obj);
		$new = $parent.'_TC'.$cnt++;
		eval('class '.$new.' extends '.$parent.' { '.$code.' }');
		$old = $obj;
		$obj = new $new();
		foreach (get_object_vars($old) as $k => $v) {
			$obj->$k = $v;
		}
	}
}

function template_conditionals_run()
{
	global $templates, $mybb;

	$ua = isset($_SERVER['HTTP_USER_AGENT']) ? $_SERVER['HTTP_USER_AGENT'] : '';
	$mybb->ismobile = (int)(bool)preg_match('/android|webos|iphone|ipad|ipod|blackberry|iemobile|opera mini|mobile/i', $ua);
	$mybb->isguest = empty($mybb->user['uid']) ? 1 : 0;

	if (!is_object($templates) || !empty($templates->tc_patched)) {
		return;
	}

	control_object($templates, '
		public $tc_patched = 1;
		public $tc_compiled = array();

		function get($title, $eslashes = 1, $htmlcomments = 1)
		{
			global $mybb;

			if (!isset($this->cache[$title])) {
				parent::get($title, 0, 0);
			}

			if (empty($this->tc_compiled[$title])) {
				if (isset($this->cache[$title]) && is_string($this->cache[$title]) && stripos($this->cache[$title], "<if") !== false) {
					$this->cache[$title] = template_conditionals_compile($this->cache[$title]);
				}
				$this->tc_compiled[$title] = 1;
			}

			$template = isset($this->cache[$title]) ? $this->cache[$title] : "";

			if ($htmlcomments && $template !== false) {
				if (!empty($mybb->settings["tplhtmlcomments"]) && $mybb->settings["tplhtmlcomments"] == 1) {
					$template = "<!-- start: ".htmlspecialchars_uni($title)." -->\n{$template}\n<!-- end: ".htmlspecialchars_uni($title)." -->";
				} else {
					$template = "\n{$template}\n";
				}
			}

			if ($eslashes && $template !== false) {
				$template = template_conditionals_addslashes($template);
			}

			return $template;
		}
	');
}

function template_conditionals_bake_cache()
{
	global $templates;
	if (!is_object($templates) || empty($templates->cache) || !is_array($templates->cache)) {
		return;
	}
	foreach ($templates->cache as $title => $code) {
		if (!is_string($code) || stripos($code, '<if') === false) {
			continue;
		}
		if (!empty($templates->tc_compiled[$title])) {
			continue;
		}
		$templates->cache[$title] = template_conditionals_compile($code);
		$templates->tc_compiled[$title] = 1;
	}
}

/**
 * addslashes that preserves Template Conditional PHP islands.
 * Islands are wrapped as \x01TC…\x01 during compile.
 */
function template_conditionals_addslashes($template)
{
	$islands = array();
	$template = preg_replace_callback(
		"/\x01TC([A-Za-z0-9+\/=]+)\x01/",
		function ($m) use (&$islands) {
			$key = '___TCISLAND'.count($islands).'___';
			$islands[$key] = base64_decode($m[1]);
			return $key;
		},
		$template
	);

	$template = str_replace("\\'", "'", addslashes($template));

	if ($islands) {
		$template = strtr($template, $islands);
	}

	return $template;
}

function template_conditionals_island($php)
{
	return "\x01TC".base64_encode($php)."\x01";
}

function template_conditionals_compile($template)
{
	$stack = array();

	$template = preg_replace_callback(
		'#<\s*((?:else)?if)\s+(.+?)\s+then\s*>|<\s*else\s*>|<\s*/\s*if\s*>#is',
		function ($m) use (&$stack) {
			$full = $m[0];

			if (preg_match('#^<\s*/\s*if\s*>$#i', $full)) {
				$frame = array_pop($stack);
				if (!empty($frame['else'])) {
					return template_conditionals_island('"))."');
				}
				return template_conditionals_island('"):"")."');
			}

			if (preg_match('#^<\s*else\s*>$#i', $full)) {
				if (!empty($stack)) {
					$i = count($stack) - 1;
					$stack[$i]['else'] = true;
				}
				return template_conditionals_island('"):("');
			}

			$type = strtolower($m[1]);
			$cond = trim($m[2]);
			// Condition sits inside PHP island — no need to escape quotes for HTML
			if ($type === 'elseif') {
				return template_conditionals_island('"):(('.$cond.')?("');
			}

			$stack[] = array('else' => false);
			return template_conditionals_island('".(('.$cond.')?("');
		},
		$template
	);

	return $template;
}
