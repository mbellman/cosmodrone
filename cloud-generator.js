// Cloud pattern generator
var size = 200;

function write_to_pixel(data, pixel, r, g, b, a) {
	data[pixel] = r;
	data[pixel+1] = g;
	data[pixel+2] = b;
	data[pixel+3] = a;
}

function generate_clouds(type) {
	canvas.clear();
	shadow.clear();

	if (type !== 'cirrus') {
		canvas.setGlobalAlpha(1);

		// Cumulus clouds or cyclones
		var size_half = size/2;
		var composite = new Canvas(document.createElement('canvas')).setSize(size, size);
		var noise_levels = [];
		var noise_data = [];
		var density = Number(document.getElementById('density').value);
		var spokes = Number(document.getElementById('spokes').value);
		var angle_offset = Number(document.getElementById('angle').value);

		if (isNaN(density)) {
			density = 0.4;
			document.getElementById('density').value = '0.4';
		}

		if (isNaN(spokes)) {
			spokes = 7;
			document.getElementById('spokes').value = '7';
		}

		if (isNaN(angle_offset)) {
			angle_offset = 0;
			document.getElementById('angle').value = '0';
		}

		angle_offset *= Math.PI/180;

		// Composite noise
		for (var i = 0 ; i < 6 ; i++) {
			var square_size = Math.pow(2,i);
			var canvas_size = Math.round(size/square_size);
			var cs_half = canvas_size/2;
			var noise_canvas = new Canvas(document.createElement('canvas')).setSize(canvas_size, canvas_size);
			var color = 255 - 30*(5-i);
			noise_canvas.draw.rectangle(0, 0, canvas_size, canvas_size).fill('#000');

			for (var y = 0 ; y < canvas_size ; y++) {
				for (var x = 0 ; x < canvas_size ; x++) {
					if (type === 'cyclone') {
						var dx = x - cs_half;
						var dy = y - cs_half;
						var radius = Math.sqrt(dx*dx + dy*dy);
						var angle = Math.atan2(dx, dy);
						var radius_ratio = radius/cs_half;
						var down_scale = Math.pow(1 - radius_ratio, 3);
						var limit = 6 * density * down_scale + Math.sin(angle_offset + angle * spokes + Math.pow(2+radius_ratio, 2.75));

						if ((radius_ratio > 0.06 || Math.random() < 0.15) && ((Math.random() < limit && Math.random() < 0.9) || Math.random() < 0.6)) {
							noise_canvas.draw.rectangle(x, y, 1, 1).fill('rgb('+color+','+color+','+color+')');
						}
					} else {
						if (Math.random() < density) {
							noise_canvas.draw.rectangle(x, y, 1, 1).fill('rgb('+color+','+color+','+color+')');
						}
					}
				}
			}

			var full_canvas = new Canvas(document.createElement('canvas')).setSize(size, size);
			full_canvas.draw.image(noise_canvas.element(), 0, 0, size, size);
			noise_levels.push(full_canvas);
			noise_data.push(full_canvas.data.get());
		}

		var canvas_image = canvas.data.get();
		var shadow_image = shadow.data.get();
		var noise_count = noise_levels.length;

		// Draw cloud shapes from noise
		for (var y = 0 ; y < size ; y++) {
			for (var x = 0 ; x < size ; x++) {
				var color = 0;
				var alpha = 0;
				var pixel = 4 * (y*size + x);

				for (var n = 0 ; n < noise_count ; n++) {
					color += noise_data[n].data[pixel];
					alpha += noise_data[n].data[pixel+3];
				}

				var dx = x - size/2;
				var dy = y - size/2;
				var radius = Math.sqrt(dx*dx + dy*dy);
				var radius_ratio = radius / size_half;
				var average = Math.round(color/noise_count) - Math.round(100 * Math.pow(radius_ratio, 3));

				if (average > 70) {
					var adj = (average > 90 ? 55 : 0);

					write_to_pixel(canvas_image.data, pixel, 220+adj, 220+adj, 245+adj, 255);
					write_to_pixel(shadow_image.data, pixel, 0, 0, 10, 200);
				}
			}
		}

		// Reduce stray pixel-sized clouds
		for (var i = 0 ; i < 1 ; i++) {
			for (var y = 0 ; y < size ; y++) {
				for (var x = 0 ; x < size ; x++) {
					var pixel = 4 * (y*size + x);

					var top_px = 4 * (clamp(y-1, 0, size)*size + x);
					var left_px = 4 * (y*size + clamp(x-1, 0, size));
					var right_px = 4 * (y*size + clamp(x+1, 0, size));
					var bottom_px = 4 * (clamp(y+1, 0, size)*size + x);

					var empty_surrounding = 0;

					if (canvas_image.data[top_px+3] < 255) empty_surrounding++;
					if (canvas_image.data[left_px+3] < 255) empty_surrounding++;
					if (canvas_image.data[right_px+3] < 255) empty_surrounding++;
					if (canvas_image.data[bottom_px+3] < 255) empty_surrounding++;

					if (empty_surrounding < 3) {
						if (canvas_image.data[pixel+3] === 0) {
							write_to_pixel(canvas_image.data, pixel, 255, 255, 255, 140);
						}
					}
				}
			}
		}

		canvas.data.put(canvas_image);
		shadow.data.put(shadow_image);
	} else {
		canvas.setGlobalAlpha(1);

		// Cirrus clouds
		var group = [];
		var size_q = Math.round(size/4);
		var size_3 = Math.round(size/3);
		var size_32 = Math.round(size/32);
		var points = Number(document.getElementById('points').value);

		if (isNaN(points)) {
			density = 10;
			document.getElementById('points').value = '10';
		}

		// Set up group of points
		for (var p = 0 ; p < points ; p++) {
			var offset_x = random(-size_q, size_q);
			var offset_y = random(-size_32, size_32);

			group.push([offset_x, offset_y, random(0.5, 1), brushes[random(0, brushes.length-1)]]);
		}

		// Trace along the canvas, gradually reducing alpha
		var size_3q = Math.round(0.75*size);
		var position = {x: random(size_q, size_3), y: random(size_q, size_3)};
		var scale = (size/500);

		// Have the clouds move about a little at random
		for (var t = 0 ; t < 1 ; t++) {
			position.x += random(-1, 1);
			position.y += random(-1, 1);

			for (var p = 0 ; p < points ; p++) {
				var brush = group[p];
				var _scale = brush[2];
				canvas.draw.image(brush[3], position.x + brush[0], position.y + brush[1], brush[3].width * _scale * scale, brush[3].height * _scale * scale);
			}
		}

		// Have the clouds wisp away in an arc
		for (var t = 0 ; t < 4*size ; t++) {
			var ratio = 1 - t / (4*size);
			var scale_r = scale * ratio;

			var x_move = 1 - Math.pow(ratio, 1/6) + (Math.random() < 0.01 ? 1 : 0);
			var y_move = Math.pow(1 - ratio, 3) + (Math.random() < 0.01 ? 1 : 0);

			position.x += x_move;
			position.y += y_move;

			canvas.setGlobalAlpha(Math.pow(ratio,3));

			for (var p = 0 ; p < points ; p++) {
				var brush = group[p];
				var _scale = brush[2];
				canvas.draw.image(brush[3], position.x + brush[0], position.y + brush[1], brush[3].width * scale_r * _scale, brush[3].height * scale_r * _scale);
			}
		}

		// Decrease alpha
		var canvas_image = canvas.data.get();

		for (var y = 0 ; y < size ; y++) {
			for (var x = 0 ; x < size ; x++) {
				var pixel = 4 * (y*size + x);
				var alpha = canvas_image.data[pixel+3];

				canvas_image.data[pixel+3] = Math.round(0.8 * alpha);
			}
		}

		canvas.data.put(canvas_image);
	}
}

// DOM stuff
var canvas = new Canvas(document.getElementById('cloud'));
var shadow = new Canvas(document.getElementById('shadow'));
var sizeButton = document.getElementsByClassName('size');
var cloudButton = document.getElementsByClassName('type');
var brushes = [
	new Image(),
	new Image(),
	new Image()
];
brushes[0].src = 'cirrus-brush.png';
brushes[1].src = 'cirrus-brush2.png';
brushes[2].src = 'cirrus-brush3.png';

function change_size(button) {
	reset_size_buttons();

	var newSize = button.getAttribute('data-size');
	button.className = 'size selected';

	canvas.element().style.width = newSize + 'px';
	canvas.element().style.height = newSize + 'px';
	canvas.element().width = newSize;
	canvas.element().height = newSize;

	shadow.element().style.width = newSize + 'px';
	shadow.element().style.height = newSize + 'px';
	shadow.element().width = newSize;
	shadow.element().height = newSize;

	size = newSize;
}

function reset_size_buttons() {
	for (var e = 0 ; e < sizeButton.length ; e++) {
		sizeButton[e].className = 'size';
	}
}

function document_click(e) {
	if (e.target.className === 'size') {
		change_size(e.target);
	}

	if (e.target.className === 'type') {
		var cloud_type = e.target.getAttribute('data-type');
		generate_clouds(cloud_type);
	}

	e.stopPropagation();
}

document.body.addEventListener('click', document_click);