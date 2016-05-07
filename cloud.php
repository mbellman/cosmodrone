<!doctype html>
<html>
	<head>
		<meta charset="UTF-8">
		<script src="js/graphics/canvas.js"></script>
		<script src="js/system/tools.js"></script>
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

			input#alpha {
				background: #F00;
			}
		</style>
	</head>
	<body>

		<input type="button" class="size" value="100" data-size="100" />
		<input type="button" class="size selected" value="200" data-size="200" />
		<input type="button" class="size" value="300" data-size="300" />
		<input type="button" class="size" value="500" data-size="500" />
		<br />
		<input type="button" class="type" value="Cumulus" data-type="cumulus" />
		<input type="button" class="type" value="Cyclone" data-type="cyclone" />
		<input type="button" class="type" value="Cirrus" data-type="cirrus" />
		<br />
		Density: <input type="text" id="density" value="0.4" size="2" />
		<br />
		Cyclone spokes: <input type="text" id="spokes" value="8" size="2" /> | Cyclone angle offset: <input type="text" id="angle" value="0" size="2" />
		<br />
		Cirrus points: <input type="text" id="points" value="10" size="2" />
		<br />
		<br />
		<input type="button" id="alpha" class="type" value="Decrease alpha" />
		<br />
		<br />
		<canvas id="cloud" width="200" height="200"></canvas>
		<canvas id="shadow" width="200" height="200"></canvas>

		<script src="cloud-generator.js"></script>
	</body>
</html>