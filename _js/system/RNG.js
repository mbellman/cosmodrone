/**
 * A seedable, deterministic pseudo-random number generator
 */
function RNG()
{
	// Private:
	var _ = this;
	var seed = hash_code(Date.now());

	/**
	 * Converts any string or number into a pseudo-random
	 * value from the interval [0, 9007199254740991)
	 */
	function hash_code(value)
	{
		value = value.toString();

		var len = value.length;
		var code = [];
		var sum = 0;
		var output = '';

		// Build a list of the input's character codes
		// and sum up the values with a minimum of 1
		for (var c = 0 ; c < len; c++)
		{
			var v = value.charCodeAt(c);
			code[c] = v;
			sum += (v+1);
		}

		// Square the character code sum for obfuscation
		sum *= sum;
		
		// Crunch numbers on the sum a little bit and
		// append the value, as a string, to [output]
		for (var c = 0 ; c < len ; c++)
		{
			var v = code[c];
			output += ((sum % v) ^ v) % v;
		}

		return output % Number.MAX_SAFE_INTEGER;
	}

	/**
	 * Takes any number as input and 're-hashes' it as a
	 * pseudo-random number within [0, 9007199254740991).
	 * This scheme does NOT yield a consequential degree
	 * of uncertainty or unpredictability about the result,
	 * but when run repeatedly on larger numbers on the
	 * order of 10^13 - 10^15 the distribution is uniform
	 * and chaotic enough that it can be used to facilitate
	 * a convincing range of outcomes and variations.
	 */
	function rehash_number(value)
	{
		return (value * 9999) % Number.MAX_SAFE_INTEGER;
	}

	/**
	 * Re-hashes [seed] and uses the result to
	 * yield a traditional [0, 1) decimal figure
	 */
	function prng()
	{
		seed = rehash_number(seed);
		return seed / Number.MAX_SAFE_INTEGER;
	}

	// Public:
	this.seed = function(_seed)
	{
		seed = hash_code(_seed);
		return _;
	}

	this.random = function(low, high)
	{
		if (arguments.length < 2)
		{
			return prng();
		}

		return low + Math.floor(prng() * (high - low + 1));
	}
}