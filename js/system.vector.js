function Vec2(x, y) {
	// Private:
	var _ = this;

	// Public:
	this.x = x || 0;
	this.y = y || 0;

	this.magnitude = function() {
		return Math.sqrt(_.x*_.x + _.y*_.y);
	}

	this.normalize = function(magnitude) {
		var mag = _.magnitude();
		var ratio = mag / magnitude;
		_.x *= ratio;
		_.y *= ratio;
	}

	this.add = function(vec2, scalar) {
		scalar = scalar || 1;
		_.x += (vec2.x * scalar);
		_.y += (vec2.y * scalar);
	}

	this.reset = function() {
		_.x = 0;
		_.y = 0;
	}
}