// Cloud pattern generator
var size = 200;
var type;

function write_to_pixel(data, pixel, r, g, b, a) {
	data[pixel] = r;
	data[pixel+1] = g;
	data[pixel+2] = b;
	data[pixel+3] = a;
}

function decrease_alpha() {
	var canvas_image = canvas.data.get();
	var w = canvas.getSize().width;

	for (var y = 0 ; y < w ; y++) {
		for (var x = 0 ; x < w ; x++) {
			var pixel = 4 * (y*w + x);
			var alpha = canvas_image.data[pixel+3];
			var alpha_ratio = alpha/255;

			canvas_image.data[pixel+3] = Math.round(alpha * Math.pow(alpha_ratio, 2));
		}
	}

	canvas.data.put(canvas_image);
}

function anti_alias() {
	var canvas_image = canvas.data.get();
	var c_w = canvas.getSize().width;

	for (var i = 0 ; i < 1 ; i++) {
		for (var y = 0 ; y < c_w ; y++) {
			for (var x = 0 ; x < c_w ; x++) {
				var pixel = 4 * (y*c_w + x);

				var top_px = 4 * (clamp(y-1, 0, c_w)*c_w + x);
				var left_px = 4 * (y*c_w + clamp(x-1, 0, c_w));
				var right_px = 4 * (y*c_w + clamp(x+1, 0, c_w));
				var bottom_px = 4 * (clamp(y+1, 0, c_w)*c_w + x);

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
}

function generate_cirrus_clouds(x, y) {
	var start_alpha = 1;

	canvas.alpha(start_alpha);

	// Cirrus clouds
	var group = [];
	var size_q = Math.round(size/4);
	var size_8 = Math.round(size/8);
	var size_3 = Math.round(size/3);
	var size_24 = Math.round(size/24);
	var points = Number(document.getElementById('points').value);

	if (isNaN(points)) {
		density = 10;
		document.getElementById('points').value = '10';
	}

	// Set up group of points
	var max = 0;
	for (var p = 0 ; p < points ; p++) {
		var offset_x = random(-20, 20);
		var offset_y = random(-10, 10);

		if (offset_x > max) max = offset_x;

		group.push([offset_x, offset_y, random(0.5, 1), brushes[random(0, brushes.length-1)], Math.random()*0.75]);
	}

	// Trace along the canvas, gradually reducing alpha
	var size_3q = Math.round(0.75*size);
	var position = {x: x, y: y};
	var scale = 0.1;

	// Have the clouds move about a little at random
	for (var t = 0 ; t < 25 ; t++) {
		position.x += random(-1, 1);
		position.y += random(-1, 1);

		for (var p = 0 ; p < points ; p++) {
			var brush = group[p];
			var _scale = brush[2] * (5 * t/25);
			canvas.alpha(start_alpha * Math.random());
			canvas.draw.image(brush[3], position.x + brush[0], position.y + brush[1], brush[3].width * _scale * scale, brush[3].height * _scale * scale);
		}
	}

	// Have the clouds wisp away in an arc
	var dist = Math.round(35 * size * random(1, 1.25) * scale);
	for (var t = 0 ; t < dist ; t++) {
		var ratio = 1 - t / dist;
		var scale_r = scale * ratio;

		var x_move = 1 - Math.pow(ratio, 1/9);
		var y_move = Math.pow(1 - ratio, 2);

		var rand_limit = 0.02 * Math.pow(ratio, 2);
		var rand_x = (Math.random() < rand_limit ? random(-1, 1) : 0);
		var rand_y = (Math.random() < rand_limit ? random(-1, 1) : 0);

		position.x += x_move + rand_x;
		position.y += y_move + rand_y;

		for (var p = 0 ; p < points ; p++) {
			var brush = group[p];
			var _scale = brush[2];
			var wisp_limit = brush[4];
			var inv_scale = (ratio < wisp_limit ? 100 * Math.pow(wisp_limit - ratio, 2) : 0);
			var spread_w = spread.width * inv_scale * scale * 8;
			var spread_h = spread.height * inv_scale * scale * 8;

			var pos_x = position.x + brush[0] + Math.pow((1 - ratio), 1/3) * (max - brush[0]);

			canvas.alpha(start_alpha * Math.pow(ratio,2));
			canvas.draw.image(brush[3], pos_x, position.y + brush[1], brush[3].width * scale_r * _scale, brush[3].height * scale_r * _scale);
			canvas.alpha(0.1 * start_alpha * Math.pow(ratio,2));
			canvas.draw.image(brush[3], pos_x - spread_w, position.y + brush[1], spread_w, spread_h);
		}
	}
}

function generate_clouds() {
	canvas.clear();
	shadow.clear();

	if (type !== 'cirrus') {
		canvas.alpha(1);

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

					write_to_pixel(canvas_image.data, pixel, 200+adj, 200+adj, 225+adj, 255);
					write_to_pixel(shadow_image.data, pixel, 0, 0, 10, 200);
				}
			}
		}

		canvas.data.put(canvas_image);
		shadow.data.put(shadow_image);

		anti_alias();
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
var spread = new Image();
spread.src = 'cirrus-spread.png';

function cirrus_canvas() {
	canvas.element().style.width = 700 + 'px';
	canvas.element().style.height = 700 + 'px';
	canvas.element().width = 700;
	canvas.element().height = 700;
}

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
	if (e.target.getAttribute('id') === 'alpha') {
		decrease_alpha();
		anti_alias();
		return;
	}

	if (e.target.className === 'size') {
		change_size(e.target);
	}

	if (e.target.className === 'type') {
		var cloud_type = e.target.getAttribute('data-type');
		type = cloud_type;

		if (type === 'cirrus') {
			cirrus_canvas();
			return;
		}

		change_size(document.querySelector('.size.selected'));
		generate_clouds(cloud_type);
	}

	if (e.target.getAttribute('id') === 'cloud') {
		var offset = document.getElementById('cloud').getBoundingClientRect();
		generate_cirrus_clouds(e.clientX - offset.x, e.clientY - offset.y);
	}

	e.stopPropagation();
}

document.body.addEventListener('click', document_click);