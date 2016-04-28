/**
 * RNG between two limits
 */
function random(low, high) {
	return low + Math.floor(Math.random() * (high - low + 1));
}

/**
 * Negative-friendly modulus operation
 */
function mod(n, m) {
	return ((n%m)+m)%m;
}

/**
 * Keep a value within a certain range
 */
function clamp(value, min, max) {
	return (value > max ? max : (value < min ? min : value));
}

/**
 * Return the smallest of all numerical arguments
 */
function minimum() {
	var min = Number.POSITIVE_INFINITY;

	for (var n = 0 ; n < arguments.length ; n++) {
		if (arguments[n] < min) {
			min = arguments[n];
		}
	}

	return min;
}

/**
 * Returns 0 if 1 and vice versa
 */
function bit_flip(bit) {
	return !bit ? 1 : 0;
}

/**
 * Cycles a smaller-than-zero value back to max
 */
function cycle_forward(value, max) {
	return (value < 0 ? max : value);
}

/**
 * Cycles a larger-than-max value back to 0
 */
function cycle_back(value, max) {
	return (value > max ? 0 : value);
}

/**
 * Shorthand for element creation + manipulation
 */
function Element(type) {
	return document.createElement(type);
}