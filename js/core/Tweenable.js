/**
 * ------------
 * Object: Ease
 * ------------
 *
 * Unit easing functions
 *
 * Inputs should be between 0 and 1. Any
 * additional scaling/mapping should be
 * done with the returned value.
 */
var Ease = {
	linear: function(t) {
		return t;
	},
	quad: {
		out: function(t) {
			return t * (2-t);
		},
		in: function(t) {
			return t * t;
		},
	    inOut: function(t) {
	        t *= 2;
	        t -= 1;

	        if(t < 0) return (1 + t * (2+t)) / 2;
	        else return (1 + t * (2-t)) / 2;
	    }
	}
}

/**
 * ----------------
 * Class: Tweenable
 * ----------------
 *
 * A number value with built-in tweening operations
 */
function Tweenable( value )
{
	// -- Private: --
	var _ = this;
	var tween = {
		// Currently tweening?
		on: false,
		// Start tween value
		start: 0,
		// End tween value
		end: 0,
		// Ratio to tween completion
		progress: 0,
		// Tween duration
		duration: 0,
		// Tween completion handler
		onComplete: function() {},
		// Easing type
		ease: null
	};
	var delay = 0;
	var delay_counter = 0;

	// -- Public: --
	this._ = value;

	this.update = function( dt )
	{
		if ( tween.on ) {
			if ( delay_counter < delay ) {
				delay_counter += dt;
				return;
			}

			tween.progress += ( dt / tween.duration );

			if ( tween.progress >= 1 ) {
				_._ = tween.end;
				_.stop();
				tween.onComplete();
				return;
			}

			var ease = tween.easing( tween.progress ) * ( tween.end - tween.start );
			_._ = tween.start + ease;
		}
	};

	/**
	 * Start a tween to [value] over [seconds] using [easing]
	 */
	this.tweenTo = function( value, seconds, easing, callback )
	{
		tween.on = true;
		tween.start = _._;
		tween.end = value;
		tween.progress = 0;
		tween.duration = seconds;
		tween.onComplete = callback || function() {};
		tween.easing = easing;
		return _;
	};

	/**
	 * Delay a specific number of [seconds] before tweening
	 */
	this.delay = function( seconds )
	{
		delay = seconds;
		delay_counter = 0;
		return _;
	};

	/**
	 * Stop tweening
	 */
	this.stop = function()
	{
		tween.on = false;
		return _;
	};

	/**
	 * Get the progress of the active tween
	 */
	this.progress = function()
	{
		return tween.progress;
	};

	/**
	 * Determine whether or not a tween is active
	 */
	this.isTweening = function()
	{
		return tween.on;
	};
}