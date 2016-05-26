/**
 * -----------
 * Class: Vec2
 * -----------
 *
 * A simple 2-vector object
 */
function Vec2( x, y )
{
	this.x = x || 0;
	this.y = y || 0;
}

/**
 * Get the magnitude of the vector
 */
Vec2.prototype.magnitude = function()
{
	return Math.sqrt( this.x * this.x + this.y * this.y );
};

/**
 * Set the vector's magnitude to [norm]
 */
Vec2.prototype.normalize = function( norm )
{
	var normalizer = norm / this.magnitude();
	this.x *= r;
	this.y *= r;
	return this;
};

/**
 * Add another 2-vector to this one
 * with an optional [scalar] value
 */
Vec2.prototype.add = function( vec2, scalar )
{
	scalar = scalar || 1;
	this.x += ( vec2.x * scalar );
	this.y += ( vec2.y * scalar );
	return this;
};

/**
 * Set the vector to [0, 0]
 */
Vec2.prototype.reset = function()
{
	this.x = 0;
	this.y = 0;
	return this;
};

/**
 * Static method for finding the difference
 * between two [x, y] vector coordinates
 */
Vec2.distance = function( x1, y1, x2, y2 )
{
	var dx = x2 - x1;
	var dy = y2 - y1;
	return Math.sqrt( dx * dx + dy * dy );
};

/**
 * -------------
 * Class: Vector
 * -------------
 *
 * An n-dimensional vector with extended functionality
 */
function Vector()
{
	/**
	 * The list of components of the vector
	 */
	this.n = [];

	/**
	 * Set [coordinates] based on constructor arguments
	 */
	for ( var i = 0 ; i < arguments.length ; i++ ) {
		this.n.push( arguments[i] );
	}
}

/**
 * Copy another [vector]'s components into this one
 */
Vector.prototype.copy = function( vector )
{
	for ( var v = 0 ; v < vector.length ; v++ ) {
		this.n[v] = vector.n[v];
	}

	return this;
};

/**
 * Get the magnitude of the vector
 */
Vector.prototype.magnitude = function()
{
	var sum = 0;

	for ( var v = 0 ; v < this.n.length ; v++ ) {
		sum += ( this.n[v] * this.n[v] );
	}

	return Math.sqrt( sum );
};

/**
 * Set the vector's magnitude to [norm]
 */
Vector.prototype.normalize = function( norm )
{
	var normalizer = norm / this.magnitude();

	for ( var v = 0 ; v < this.n.length ; v++ ) {
		this.n[v] *= normalizer;
	}

	return this;
};

/**
 * Static method for getting the dot product of two vectors
 */
Vector.dotProduct = function( vector1, vector2 )
{
	var sum = 0;

	if ( vector1.n.length !== vector2.n.length ) {
		return sum;
	}

	for ( var v = 0 ; v < vector1.n.length ; v++ ) {
		sum += ( vector1.n[v] * vector2.n[v] );
	}

	return sum;
};