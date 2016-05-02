// Cloud pattern generator
var size = 200;

function generate_clouds(type) {
	canvas.clear();

	var step = 20;
	var step_size = Math.round(size/step);
	var step_canvas = new Canvas(document.createElement('canvas')).setSize(step_size, step_size);

	for (var y = 0 ; y < step_size ; y++) {
		for (var x = 0 ; x < step_size ; x++) {
			if (Math.random() < 0.5) {
				step_canvas.draw.rectangle(x, y, 1, 1).fill('#FFF');
			}
		}
	}

	canvas.draw.image(step_canvas.element(), 0, 0, size, size);
}

// DOM stuff
var canvas = new Canvas(document.getElementById('cloud'));
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