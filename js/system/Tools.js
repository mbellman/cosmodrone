// ---------------------------------------- //
// ----------- Static resources ----------- //
// ---------------------------------------- //

Math.DEG_TO_RAD = Math.PI / 180;
Math.RAD_TO_DEG = 180 / Math.PI;
Math.TAU = 2 * Math.PI;

// -------------------------------------- //
// ----------- Handy routines ----------- //
// -------------------------------------- //

/**
 * Return a positive sine-like value oscillating between 0 and 1
 */
Math.wave = function( input )
{
	return ( 1 + Math.sin( input ) ) / 2;
};

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
function pickRandom()
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
	var args = arguments.length;

	for ( var n = 0 ; n < args ; n++ ) {
		min = Math.min( arguments[n], min );
	}

	return min;
}

/**
 * Return the average (mean) of all numerical arguments
 */
function average()
{
	var sum = 0;
	var args = arguments.length;

	for ( var n = 0 ; n < args ; n++ ) {
		sum += arguments[n];
	}

	return sum / args;
}

/**
 * Return a rounded whole number average of all numerical arguments
 */
function roundedAverage()
{
	return Math.round( average.apply( null, arguments ) );
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
function isInBetween( value, low, high )
{
	return ( value > low && value < high );
}

/**
 * Returns 0 if 1 and vice versa
 */
function bitFlip( bit )
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

( function( scope ) {
	/**
	 * A list of 10^x, from x = [0 - 11]
	 */
	var E = [];

	for ( var e = 0 ; e < 12 ; e++ ) {
		E.push( Math.pow( 10, e ) );
	}

	/**
	 * -------------
	 * Object: Round
	 * -------------
	 *
	 * Methods for rounding to a specific decimal
	 */
	var Round = {
		toDecimal: function( number, decimal ) {
			decimal = E[decimal] || 15;
			return Math.round( number * decimal ) / decimal;
		},
		upToDecimal: function( number, decimal ) {
			decimal = E[decimal] || 15;
			return Math.ceil( number * decimal ) / decimal;
		},
		downToDecimal: function( number, decimal ) {
			decimal = E[decimal] || 15;
			return Math.floor( number * decimal ) / decimal;
		}
	};

	scope.Round = Round;
} )( window );

/**
 * ------------
 * Object: Ease
 * ------------
 *
 * Unit easing functions. Inputs should be
 * between 0 and 1. Any additional scaling
 * should be done with the returned value.
 */
var Ease = {
	linear: function( t ) {
		return t;
	},
	quad: {
		out: function( t ) {
			return t * ( 2 - t );
		},
		in: function( t ) {
			return t * t;
		},
	    inOut: function( t ) {
	        t *= 2;
	        t -= 1;

	        if ( t < 0 )
	        	return ( 1 + t * ( 2 + t ) ) / 2;
	        else
	        	return ( 1 + t * ( 2 - t ) ) / 2;
	    }
	}
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