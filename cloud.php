<!doctype html>
<html>
	<head>
		<meta charset="UTF-8">
		<script src="js/graphics.canvas.js"></script>
		<script src="js/system.map.js"></script>
		<style type="text/css">
			body {
				font-family: Arial;
				background: #DDF;
			}

			canvas#cloud,
			canvas#shadow {
				display: inline-block;
				width: 200px;
				height: 200px;
				margin: 0 2px;
				border: 1px solid #000;
			}

			input.size {
				border-top: 2px solid #DDF;
				border-left: 2px solid #DDF;
				border-right: 2px solid #668;
				border-bottom: 2px solid #668;
				background: #BBF;
				color: #FFF;
			}

			input.size:active,
			input.size.selected {
				border-top: 2px solid #668;
				border-left: 2px solid #668;
				border-right: 2px solid #DDF;
				border-bottom: 2px solid #DDF;
			}

			input.type {
				border-top: 2px solid #FDD;
				border-left: 2px solid #FDD;
				border-right: 2px solid #866;
				border-bottom: 2px solid #866;
				background: #FBB;
				color: #FFF;
			}

			input.type:active,
			input.type.selected {
				border-top: 2px solid #866;
				border-left: 2px solid #866;
				border-right: 2px solid #FDD;
				border-bottom: 2px solid #FDD;
			}
		</style>
	</head>
	<body>

		<input type="button" class="size" value="100" data-size="100" />
		<input type="button" class="size selected" value="200" data-size="200" />
		<input type="button" class="size" value="300" data-size="300" />
		<br />
		<input type="button" class="type" value="Cumulus" data-type="cumulus" />
		<input type="button" class="type" value="Altocumulus" data-type="altocumulus" />
		<input type="button" class="type" value="Cirrus" data-type="cirrus" />
		<br />
		<br />
		<canvas id="cloud" width="200" height="200"></canvas>
		<canvas id="shadow" width="200" height="200"></canvas>

		<script src="cloud-generator.js"></script>
	</body>
</html>