// Cloud pattern generator
var size = 200;

function generate_clouds(type) {
	canvas.clear();
	shadow.clear();

	var composite = new Canvas(document.createElement('canvas')).setSize(size, size);
	var noise_levels = [];
	var noise_data = [];

	var t = Date.now();

	for (var i = 0 ; i < 6 ; i++) {
		var square_size = Math.pow(2,i);
		var canvas_size = Math.round(size/square_size);
		var noise_canvas = new Canvas(document.createElement('canvas')).setSize(canvas_size, canvas_size);
		var color = 255 - 30*(5-i);
		noise_canvas.draw.rectangle(0, 0, canvas_size, canvas_size).fill('#000');

		for (var y = 0 ; y < canvas_size ; y++) {
			for (var x = 0 ; x < canvas_size ; x++) {
				if (Math.random() < 0.4) {
					noise_canvas.draw.rectangle(x, y, 1, 1).fill('rgb('+color+','+color+','+color+')');
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

	for (var y = 0 ; y < size ; y++) {
		for (var x = 0 ; x < size ; x++) {
			var color = 0;
			var alpha = 0;
			var pixel = 4 * (y*size + x);

			for (var n = 0 ; n < noise_count ; n++) {
				color += noise_data[n].data[pixel];
				alpha += noise_data[n].data[pixel+3];
			}

			var dx = (size/2) - x;
			var dy = (size/2) - y;
			var center_dist = Math.round(Math.sqrt(dx*dx + dy*dy));
			var average = Math.round(color/noise_count) - Math.round(300/size) * Math.round(0.4*center_dist);

			if (average > 70) {
				var adj = Math.round(2 * average);

				canvas_image.data[pixel] = 30 + adj;
				canvas_image.data[pixel+1] = 30 + adj;
				canvas_image.data[pixel+2] = 60 + adj;
				canvas_image.data[pixel+3] = 255;

				shadow_image.data[pixel] = 0;
				shadow_image.data[pixel+1] = 0;
				shadow_image.data[pixel+2] = 20;
				shadow_image.data[pixel+3] = 190;
			}
		}
	}

	console.log((Date.now()-t) + 'ms');

	canvas.data.put(canvas_image);
	shadow.data.put(shadow_image);
}

// DOM stuff
var canvas = new Canvas(document.getElementById('cloud'));
var shadow = new Canvas(document.getElementById('shadow'));
var sizeButton = document.getElementsByClassName('size');
var cloudButton = document.getElementsByClassName('type');

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