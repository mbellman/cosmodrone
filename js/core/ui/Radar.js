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
	var display = {};                                 // Reusable bounding box object for surrounding Sprites

	/**
	 * Check to see if the current [display] bounding box is in view
	 */
	function is_in_view()
	{
		return (
			( display.x + display.width ) > 0 &&
			( display.y + display.height ) > 0 &&
			display.x < map.width() &&
			display.y < map.height()
		);
	}

	/**
	 * Receives a [bounds] bounding box and updates the internal
	 * [display] bounds based on centering/scaling/etc. variables
	 */
	function transform( bounds )
	{
		var offset = source.getBoundingBox();

		display.x = center.x + ( scale * ( bounds.x - offset.x ) );
		display.y = center.y + ( scale * ( bounds.y - offset.y ) );
		display.width = scale * bounds.width;
		display.height = scale * bounds.height;
	}

	/**
	 * Renders a single hardware part to the radar map
	 */
	function draw_hardware( hardware ) {
		transform( hardware.get( Sprite ).getBoundingBox() );

		if ( !is_in_view() ) {
			return;
		}

		map.sprite
			.draw.circle( display.x, display.y, 3 )
			.fill( '#ff0' );
	}

	/**
	 * Renders a station module and its
	 * hardware parts to the radar map
	 */
	function draw_module( module )
	{
		transform( module.get( Sprite ).getBoundingBox() );

		if ( !is_in_view() ) {
			return;
		}

		map.sprite
			.setAlpha( 1 )
			.draw.rectangle( display.x, display.y, display.width, display.height )
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