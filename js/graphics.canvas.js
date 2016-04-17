/**
 * A simple premade vector graphics toolset for HTML5 Canvas.
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
			ctx.fillStyle = color || '#000';
			ctx.fill();
			return __;
		}

		this.stroke = function(color, thickness) {
			ctx.lineWidth = (isNaN(thickness) ? 1 : thickness);
			ctx.strokeStyle = color || '#000';
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
		image: function(source, x, y) {
			ctx.drawImage(source, x, y);
		}
	};

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

	return _;
}