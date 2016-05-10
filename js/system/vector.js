/**
 * A simple 2-vector object
 */
function Vec2(x, y)
{
	this.x = x || 0;
	this.y = y || 0;
}

Vec2.prototype.magnitude = function()
{
	return Math.sqrt(this.x*this.x + this.y*this.y);
}

Vec2.prototype.normalize = function(norm)
{
	var magnitude = this.magnitude();
	var ratio = magnitude / norm;
	this.x *= r;
	this.y *= r;
	return this;
}

Vec2.prototype.add = function(vec2, scalar)
{
	scalar = scalar || 1;
	this.x += (vec2.x * scalar);
	this.y += (vec2.y * scalar);
	return this;
}

Vec2.prototype.reset = function()
{
	this.x = 0;
	this.y = 0;
	return this;
}