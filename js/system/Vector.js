/**
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
}

/**
 * Set the vector's magnitude to [norm]
 */
Vec2.prototype.normalize = function( norm )
{
	var magnitude = this.magnitude();
	var ratio = magnitude / norm;
	this.x *= r;
	this.y *= r;
	return this;
}

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
}

/**
 * Set the vector to [0, 0]
 */
Vec2.prototype.reset = function()
{
	this.x = 0;
	this.y = 0;
	return this;
}

/**
 * 'Static' method for finding the difference
 * between two [x, y] vector coordinates
 */
Vec2.distance = function( x1, y1, x2, y2 )
{
	var dx = x2 - x1;
	var dy = y2 - y1;
	return Math.sqrt( dx * dx + dy * dy );
}