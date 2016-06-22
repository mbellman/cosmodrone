/**
 * ----------------
 * Component: Radar
 * ----------------
 *
 * A real-time map of station objects near the player drone
 */
function Radar()
{
	Component.call( this );

	// -- Private: --
	var _ = this;
	var map = new RasterSprite();
	var scale = 0.05;
	var center = {
		x: 0,
		y: 0
	};

	// -- Public: --
	this.onAdded = function()
	{
		_.owner.addChild(
			new Entity().add( map )
		);
	};

	/**
	 * Update the dimensions of the radar map
	 */
	this.setSize = function( width, height )
	{
		map.sprite.setSize( width, height );

		center.x = width / 2;
		center.y = height / 2;
		return _;
	};

	/**
	 * Redraw the local [map] scene from the space [station]
	 * entity hierarchy and the drone [source] Point component
	 */
	this.scan = function( station, source )
	{
		map.sprite.clear();

		var offset = source.getBoundingBox();
		var display;

		station.forDirectChildren( function( module ) {
			display = module.get( Sprite ).getBoundingBox();

			map.sprite
				.draw.rectangle(
					center.x + ( scale * ( display.x - offset.x ) ),
					center.y + ( scale * ( display.y - offset.y ) ),
					( scale * display.width ),
					( scale * display.height )
				)
				.fill( '#fff' );
		} );

		return _;
	};
}