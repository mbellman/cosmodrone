<?php
	$root_directory = "assets";
	$images_directory = "images";
	$audio_directory = "audio";
	$to_erase = array("assets/".$images_directory."/", "assets/".$audio_directory."/");

	function is_system_folder($file) {
		$system_folders = array('.', '..');

		foreach ($system_folders as $folder) {
			if (strcmp($file, $folder) === 0) {
				return true;
			}
		}

		return false;
	}

	function list_directory_contents($path, $prefix) {
		global $to_erase;

		$list = '';
		$directory_list = scandir($path);

		foreach ($directory_list as $file) {
			if (!is_system_folder($file)) {
				$full_path = $path.'/'.$file;

				if (is_dir($full_path)) {
					$list .= list_directory_contents($full_path, $prefix);
					continue;
				}

				$written_path = str_replace($to_erase, "", $full_path);
				$list .= $prefix."'".$written_path."',\n";
			}
		}

		return $list;
	}

	$manifest = '';

	$manifest .= "var AssetManifest =\n";
	$manifest .= "{\n";
	$manifest .= "\timages:\n";
	$manifest .= "\t{\n";
	$manifest .= "\t\tfolder: '".$images_directory."',\n";
	$manifest .= "\t\tfiles:\n";
	$manifest .= "\t\t[\n";
	$manifest .= list_directory_contents($root_directory.'/'.$images_directory, "\t\t\t");
	$manifest .= "\t\t],\n";
	$manifest .= "\t},\n";
	$manifest .= "\taudio:\n";
	$manifest .= "\t{\n";
	$manifest .= "\t\tfolder: '".$audio_directory."',\n";
	$manifest .= "\t\tfiles:\n";
	$manifest .= "\t\t[\n";
	$manifest .= list_directory_contents($root_directory.'/'.$audio_directory, "\t\t\t");
	$manifest .= "\t\t],\n";
	$manifest .= "\t}\n";
	$manifest .= "};";

	file_put_contents('js/assets/manifest.js', $manifest);
?>

<!doctype html>
<head>
</head>
<body>
	<script>
		setTimeout(function(){
			document.location.href = document.location.href;
		}, 10000);
	</script>
</body>
</html>