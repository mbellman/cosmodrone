// --------------------------------- //
// ----------- Constants ----------- //
// --------------------------------- //

Math.PI_RAD = Math.PI / 180;
Math.RAD_PI = 180 / Math.PI;

// -------------------------------------- //
// ----------- Handy routines ----------- //
// -------------------------------------- //

/**
 * Return a pseudo-random integer between two limits
 */
function random( low, high )
{
	return low + Math.floor( Math.random() * ( high - low + 1 ) );
}

/**
 * Return a pseudo-random floating point value between two limits
 */
function randomFloat( low, high )
{
	return low + Math.random() * ( high - low );
}

/**
 * ~50/50 chance of returning true or false
 */
function chance()
{
	return ( Math.random() < 0.5 );
}

/**
 * Randomly selects and returns one of the arguments
 */
function pick_random()
{
	var pick = random( 0, arguments.length - 1 );
	return arguments[pick];
}

/**
 * Negative-friendly modulus operation
 */
function mod( n, m )
{
	return ( ( n % m ) + m ) % m;
}

/**
 * Keep a value within a certain range
 */
function clamp( value, min, max )
{
	return ( value > max ? max : ( value < min ? min : value ) );
}

/**
 * Return the smallest of all numerical arguments
 */
function minimum()
{
	var min = Number.POSITIVE_INFINITY;
	var len = arguments.length;

	for ( var n = 0 ; n < len ; n++ ) {
		min = Math.min( arguments[n], min );
	}

	return min;
}

/**
 * Linear interpolation between two values
 */
function lerp( value1, value2, factor )
{
	return value1 + ( value2 - value1 ) * factor;
}

/**
 * Determines whether a number is in between two others
 */
function is_in_between( value, low, high )
{
	return ( value > low && value < high );
}

/**
 * Returns 0 if 1 and vice versa
 */
function bit_flip( bit )
{
	return !bit ? 1 : 0;
}

/**
 * Return formatted RGB string from three color parts
 */
function rgb( r, g, b )
{
	return 'rgb(' + r + ',' + g + ',' + b + ')';
}


// --------------------------------------------- //
// ----------- Miscellaneous classes ----------- //
// --------------------------------------------- //

/**
 * ------------
 * Class: Cycle
 * ------------
 *
 * Stores and cycles through an array of values
 */
function Cycle()
{
	// -- Private: --
	var _ = this;
	var values = [];
	var step = 0;

	// -- Public: --
	/**
	 * Add a value to the internal [values] array
	 */
	this.append = function( value )
	{
		values.push( value );
		return _;
	};

	/**
	 * Add a new array of values to the pre-existing one
	 */
	this.merge = function( array )
	{
		for ( var i = 0 ; i < array.length ; i++ ) {
			values.push( array[i] );
		}

		return _;
	};

	/**
	 * Get current cycle value
	 */
	this.current = function()
	{
		return values[step];
	};

	/**
	 * Get the next cycle value
	 */
	this.next = function()
	{
		return values[_.nextStep()];
	};

	/**
	 * Get the previous cycle value
	 */
	this.previous = function()
	{
		return values[_.previousStep()];
	};

	/**
	 * Get current step value
	 */
	this.step = function()
	{
		return step;
	};

	/**
	 * Get the step after the current one
	 */
	this.nextStep = function()
	{
		return mod( step + 1, values.length );
	};

	/**
	 * Get the step before the current one
	 */
	this.previousStep = function()
	{
		return mod( step - 1, values.length );
	};

	/**
	 * Advance the [step] by [amount] (positive or negative)
	 */
	this.advance = function( amount )
	{
		step = mod( step + amount, values.length );
		return _;
	};
}