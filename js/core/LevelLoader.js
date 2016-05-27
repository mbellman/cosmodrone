( function( scope ) {
	/**
	 * -----------------
	 * Object: LevelData
	 * -----------------
	 *
	 * Layouts for the various levels
	 */
	var LevelData = {
		1: {
			layout: [
				[0, 1, 0, 1, 0],
				[0, 2, 0, 2, 0],
				[1, 1, 1, 1, 1],
				[0, 2, 0, 2, 0]
			],
			parts: {
				0: {
					1: [
						{side: 'top', index: 1, name: 'SATELLITE_1'},
						{side: 'bottom', index: 2, name: 'SATELLITE_1'}
					]
				},
				1: {
					1: [
						{side: 'left', index: 1, name: 'SATELLITE_1'},
						{side: 'right', index: 2, name: 'SATELLITE_1'},
					]
				}
			},
			moving: false
		}
	};

	/**
	 * ------------------
	 * Class: LevelLoader
	 * ------------------
	 *
	 * Resource for converting level data into game entities
	 */
	function LevelLoader()
	{
		// -- Private: --
		var _ = this;
		var width;                  // Width of the level in station modules
		var height;                 // Height of the level in station modules
		var level;                  // The level to be loaded
		var data = {};              // Level data
		var is_built = [];          // Module build completion flags
		var entities = [];          // List of entities to be created

		// ------------------------------------------- //
		// ------------- STATION MODULES ------------- //
		// ------------------------------------------- //

		/**
		 * Returns module properties based on a number ID
		 */
		function get_module_specs( id )
		{
			var name = ModuleNames[id];
			return Modules[name];
		}

		/**
		 * Returns the opposite docking side based on a string
		 */
		function opposite_side( side )
		{
			if ( side === 'top' ) return 'bottom';
			if ( side === 'left' ) return 'right';
			if ( side === 'right' ) return 'left';
			if ( side === 'bottom' ) return 'top';
			return null;
		}

		/**
		 * Creates and returns a station module as an entity
		 */
		function create_module( specs, positionX, positionY )
		{
			var module = new Entity()
				.add( new Point().setPosition( positionX, positionY ) )
				.add( new Sprite( Assets.getImage( specs.file ) ) );

			entities.push( module );

			return module;
		}

		/**
		 * Returns modules connected to that at
		 * [x, y] which have not yet been built
		 */
		function get_offshoot_modules( y, x )
		{
			var parent = get_module_specs( data.layout[y][x] );
			var offshoots = {}, offshoot = {};

			// Adjacent module index values
			var adjacents = {
				top: {x: x, y: ( y - 1 )},
				left: {x: ( x - 1 ), y: y},
				right: {x: ( x + 1 ), y: y},
				bottom: {x: x, y: ( y + 1 )}
			};

			for ( var side in adjacents ) {
				if ( adjacents.hasOwnProperty( side ) ) {
					offshoot.index = adjacents[side];

					// Make sure adjacent index is within level layout bounds
					if ( offshoot.index.x >= 0 && offshoot.index.y >= 0 && offshoot.index.x < width && offshoot.index.y < height ) {
						offshoot.module = data.layout[offshoot.index.y][offshoot.index.x];
						offshoot.specs = get_module_specs( offshoot.module );

						if (
							offshoot.module !== 0 &&
							parent.docking.hasOwnProperty( side ) &&
							offshoot.specs.docking.hasOwnProperty( opposite_side( side ) ) &&
							!is_built[offshoot.index.y][offshoot.index.x]
						) {
							offshoots[side] = {
								y: offshoot.index.y,
								x: offshoot.index.x,
								width: offshoot.specs.size.width,
								height: offshoot.specs.size.height
							};
						}
					}
				}
			}

			return offshoots;
		}

		/**
		 * Build a station module and its offshoot modules
		 */
		function build_module_recursive( y, x, positionX, positionY )
		{
			if ( is_built[y][x] ) {
				return;
			}

			is_built[y][x] = true;

			var specs = get_module_specs( data.layout[y][x] );
			var module = create_module( specs, positionX, positionY );
			var offshoots = get_offshoot_modules( y, x );
			var offshoot = {}, dock = {};

			if ( !!data.parts[y] && !!data.parts[y][x] ) {
				var parts = create_hardware_parts( y, x );

				for ( var p = 0 ; p < parts.length ; p++ ) {
					module.addChild( parts[p] );
				}
			}
 
			for ( var side in offshoots ) {
				if ( offshoots.hasOwnProperty( side ) ) {
					dock.x = specs.docking[side].x;
					dock.y = specs.docking[side].y;

					offshoot.index = offshoots[side];
					offshoot.specs = get_module_specs( data.layout[offshoot.index.y][offshoot.index.x] );

					// Align docking ports
					switch ( side )
					{
						case 'top':
							dock.x -= offshoot.specs.docking.bottom.x;
							dock.y -= offshoot.specs.size.height;
							break;
						case 'left':
							dock.x -= offshoot.specs.size.width;
							dock.y -= offshoot.specs.docking.right.y;
							break;
						case 'right':
							dock.y -= offshoot.specs.docking[side].y;
							break;
						case 'bottom':
							dock.x -= offshoot.specs.docking[side].x;
							break;
						default:
							break;
					}

					build_module_recursive(
						offshoot.index.y,
						offshoot.index.x,
						positionX + dock.x,
						positionY + dock.y
					);
				}
			}
		}

		/**
		 * By default, set all station modules as not-yet-built
		 */
		function set_initial_build_flags()
		{
			height = data.layout.length;
			width = data.layout[0].length;
			is_built.length = 0;

			for ( var y = 0 ; y < height ; y++ ) {
				is_built[y] = [];

				for ( var x = 0 ; x < width ; x++ ) {
					is_built[y][x] = false;
				}
			}
		}

		// -------------------------------------------- //
		// ------------- STATION HARDWARE ------------- //
		// -------------------------------------------- //

		/**
		 * Returns hardware part specs based on name and
		 * module side, which determines orientation
		 */
		function get_part_specs( part, side )
		{
			side = side || 'top';

			var specs = HardwareParts[part];
			var data = {};

			switch ( side ) {
				case 'top':
					data.file = specs.file + 'top.png';
					data.width = specs.width;
					data.height = specs.height;
					data.x = specs.x;
					data.y = specs.y;
					break;
				case 'right':
					data.file = specs.file + 'right.png';
					data.width = specs.height;
					data.height = specs.width;
					data.x = data.width;
					data.y = specs.x;
					break;
				case 'bottom':
					data.file = specs.file + 'bottom.png';
					data.width = specs.width;
					data.height = specs.height;
					data.x = specs.x;
					data.y = specs.height;
					break;
				case 'left':
					data.file = specs.file + 'left.png';
					data.width = specs.height;
					data.height = specs.width;
					data.x = specs.y;
					data.y = specs.x;
					break;
			}

			return data;
		}

		/**
		 * Determines which hardware parts need to be created
		 * for the station module at index [x, y] in the level
		 * layout, and creates/returns them as an entity list
		 */
		function create_hardware_parts( y, x )
		{
			var module = get_module_specs( data.layout[y][x] );
			var part_list = data.parts[y][x];
			var part, terminal, specs, position = {}, entities = [];

			for ( var p = 0 ; p < part_list.length ; p++ ) {
				part = part_list[p];
				terminal = part.side + part.index;

				if ( module.terminals.hasOwnProperty( terminal ) ) {
					specs = get_part_specs( part.name, part.side );
					specs.orientation = part.side;

					position.x = module.terminals[terminal].x - specs.x;
					position.y = module.terminals[terminal].y - specs.y;

					entities.push(
						new Entity()
							.add(
								new HardwarePart()
									.setSpecs( specs )
									.setMoving( data.moving )
							)
							.add(
								new Sprite( Assets.getImage( specs.file ) )
									.setXY( position.x, position.y )
							)
					);
				}
			}

			return entities;
		}

		// -- Public: --
		/**
		 * Construct a level from its # ID
		 */
		this.buildLevel = function( _level )
		{
			level = _level;
			data = LevelData[level];
			set_initial_build_flags();

			var y = 0;
			var x = 0;
			var can_start = false;

			// Look for a module to start from
			while ( y < height - 1 ) {
				x = 0;

				while ( x < width ) {
					if ( data.layout[y][x] !== 0 ) {
						can_start = true;
						break;
					}

					x++;
				}

				if ( can_start ) break;

				y++;
			}

			build_module_recursive( y, x, 0, 0 );

			return _;
		};

		/**
		 * Retrieve the created entities after level construction
		 */
		this.getEntities = function()
		{
			return entities;
		};
	}

	scope.LevelLoader = LevelLoader;
} )( window );