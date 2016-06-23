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
	var map = new RasterSprite();                     // Radar image
	var scale = 0.05;                                 // Map scale
	var blip_alpha = 1;                               // Alpha level for radar blips (drone, hardware parts, etc.)
	var center = {x: 0, y: 0};                        // Map center coordinates (updated automatically in [setSize()])
	var source;                                       // Radar signal source Sprite for distance comparisons with surrounding Sprites

	/**
	 * Renders a single hardware part to the radar map
	 */
	function draw_hardware( hardware ) {
		var display = hardware.get( Sprite ).getBoundingBox();
		var offset = source.getBoundingBox();

		map.sprite
			.draw.circle(
				center.x + ( scale * ( display.x - offset.x ) ),
				center.y + ( scale * ( display.y - offset.y ) ),
				3
			)
			.fill( '#ff0' );
	}

	/**
	 * Renders a station module and its
	 * hardware parts to the radar map
	 */
	function draw_module( module )
	{
		var display = module.get( Sprite ).getBoundingBox();
		var offset = source.getBoundingBox();

		map.sprite
			.setAlpha( 1 )
			.draw.rectangle(
				center.x + ( scale * ( display.x - offset.x ) ),
				center.y + ( scale * ( display.y - offset.y ) ),
				( scale * display.width ),
				( scale * display.height )
			)
			.stroke( '#fff' );

		map.sprite.setAlpha( blip_alpha );
		module.forDirectChildren( draw_hardware );
	}

	// -- Public: --
	this.update = function( dt )
	{
		blip_alpha -= dt;

		if ( blip_alpha < 0 ) {
			blip_alpha = 1;
		}
	};

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
	 * Update the 'clarity' of the radar image via [alpha]
	 */
	this.setClarity = function( alpha )
	{
		map.setAlpha( alpha );
		return _;
	};

	/**
	 * Use a specific radar signal [source] Sprite
	 * to compare against surrounding objects
	 */
	this.setSignalSource = function( _source )
	{
		source = _source;
		return _;
	};

	/**
	 * Redraw the local [map] scene from
	 * the space [station] entity hierarchy
	 */
	this.scan = function( station )
	{
		map.sprite
			.clear()
			.setAlpha( 0.5 )
			.draw.rectangle( 0, 0, map.width(), map.height() )
			.fill( '#000' );

		station.forDirectChildren( draw_module );

		map.sprite
			.setAlpha( blip_alpha )
			.draw.circle( center.x, center.y, 2 )
			.fill( '#0f0' );

		return _;
	};
}