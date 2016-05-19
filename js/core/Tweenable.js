/**
 * "Unit" easing functions
 *
 * Inputs should be between 0 and 1. Any
 * additional scaling/mapping should be
 * done with the returned value.
 */
var Ease =
{
	linear: function(t)
	{
		return t;
	},
    quad:
    {
        out: function(t)
        {
            return t * (2-t);
        },
        in: function(t)
        {
            t -= 1;
            return 1 + t * (2+t);
        },
        inOut: function(t)
        {
            t *= 2;
            t -= 1;

            if(t < 0)
                return  (1 + t * (2+t)) / 2;
            else
                return  (1 + t * (2-t)) / 2;
        }
    }
}

/**
 * A number value with built-in tweening operations
 */
function Tweenable(value)
{
	// Private:
	var _ = this;
	var tween =
	{
		on: false,
		start: 0,
		end: 0,
		running_time: 0,
		complete_time: 0,
		ease: null
	};
	var delay = 0;
	var delay_counter = 0;

	// Public:
	this._ = value;

	this.update = function(dt)
	{
		if (tween.on)
		{
			if (delay_counter < delay)
			{
				delay_counter += dt;
				return;
			}

			tween.running_time += (dt * 1000);

			if (tween.running_time >= tween.complete_time)
			{
				_._ = tween.end;
				_.stop();
				return;
			}

			var t = tween.running_time / tween.complete_time;
			var ease = tween.ease(t) * (tween.end - tween.start);
			_._ = tween.start + ease;
		}
	}

	this.tweenTo = function(value, seconds, easing)
	{
		tween.on = true;
		tween.start = _._;
		tween.end = value;
		tween.running_time = 0;
		tween.complete_time = seconds * 1000;
		tween.ease = easing;
	}

	this.delay = function(seconds)
	{
		delay = seconds;
		delay_counter = 0;
		return _;
	}

	this.stop = function()
	{
		tween.on = false;
	}

	this.isTweening = function()
	{
		return tween.on;
	}
}