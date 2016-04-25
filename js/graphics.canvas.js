/**
 * A simple vector graphics toolset for the HTML5 Canvas.
 * Instantiate with a target canvas element as the argument.
 */
function Canvas(element) {
	// Private:
	var _ = this;
	var ctx = element.getContext('2d');

	/* Provides chainable fill() and stroke() methods to certain Canvas.draw operations */
	function Shape() {
		var __ = this;

		this.fill = function(color) {
			if (color !== null) ctx.fillStyle = color;
			ctx.fill();
			return __;
		}

		this.stroke = function(color, thickness) {
			if (thickness !== null) ctx.lineWidth = (isNaN(thickness) ? 1 : thickness);
			if (color !== null) ctx.strokeStyle = color;
			ctx.stroke();
			return __;
		}
	}

	// Public:
	this.draw = {
		circle: function(x, y, radius) {
			ctx.beginPath();
			ctx.arc(x, y, radius, 0, 2*Math.PI);
			return new Shape();
		},
		rectangle: function(x, y, width, height) {
			ctx.beginPath();
			ctx.rect(x, y, width, height);
			return new Shape();
		},
		image: function(source, x1, y1, width1, height1, x2, y2, width2, height2) {
			if (arguments.length === 1) {
				ctx.drawImage(source, 0, 0);
			} else
			if (arguments.length === 3) {
				ctx.drawImage(source, x1, y1);
			} else
			if (arguments.length === 5) {
				ctx.drawImage(source, x1, y1, width1, height1);
			} else
			if (arguments.length === 9) {
				ctx.drawImage(source, x1, y1, width1, height1, x2, y2, width2, height2);
			}
		}
	};

	this.data = {
		create: function(width, height) {
			width = width || element.width;
			height = height || element.height;
			return ctx.createImageData(width, height);
		},
		get: function(x, y, width, height) {
			x = x || 0;
			y = y || 0;
			width = width || element.width;
			height = height || element.height;
			return ctx.getImageData(x, y, width, height);
		},
		put: function(data, x, y) {
			x = x || 0;
			y = y || 0;
			ctx.putImageData(data, x, y);
		}
	};

	this.clear = function() {
		ctx.clearRect(0, 0, element.width, element.height);
	}

	this.getSize = function() {
		return {
			width: element.width,
			height: element.height
		};
	}

	this.setSize = function(w, h) {
		element.width = w || element.width;
		element.height = h || element.height;
		return _;
	}

	this.element = function() {
		return element;
	}
}