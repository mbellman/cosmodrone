/**
 * RNG between two limits
 */
function random(low, high)
{
	return low + Math.floor(Math.random() * (high - low + 1));
}

/**
 * 50/50 chance of returning true or false
 */
function chance()
{
	return (Math.random() < 0.5);
}

/**
 * Randomly selects and returns an argument
 */
function pick_random()
{
	var pick = random(0, arguments.length-1);
	return arguments[pick];
}

/**
 * Negative-friendly modulus operation
 */
function mod(n, m)
{
	return ((n%m)+m)%m;
}

/**
 * Keep a value within a certain range
 */
function clamp(value, min, max)
{
	return (value > max ? max : (value < min ? min : value));
}

/**
 * Return the smallest of all numerical arguments
 */
function minimum()
{
	var min = Number.POSITIVE_INFINITY;
	var len = arguments.length;

	for (var n = 0 ; n < len ; n++)
	{
		if (arguments[n] < min)
		{
			min = arguments[n];
		}
	}

	return min;
}

/**
 * Determines whether a number is in between two others
 */
function is_in_between(value, low, high)
{
	return (value > low && value < high);
}

/**
 * Returns 0 if 1 and vice versa
 */
function bit_flip(bit)
{
	return !bit ? 1 : 0;
}

/**
 * Cycles a smaller-than-zero value back to max
 */
function cycle_forward(value, max)
{
	return (value < 0 ? max : value);
}

/**
 * Cycles a larger-than-max value back to 0
 */
function cycle_back(value, max)
{
	return (value > max ? 0 : value);
}

/**
 * Return formatted RGB string from three color parts
 */
function rgb(r, g, b)
{
	return 'rgb('+r+','+g+','+b+')';
}

/**
 * Shorthand for element creation + manipulation
 */
function Element(type)
{
	return document.createElement(type);
}