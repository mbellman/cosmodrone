(function(scope){
	/**
	 * Layouts for the various levels
	 */
	var LevelData =
	{
		1:
		{
			layout:
			[
				[0, 1, 0, 1, 0],
				[0, 2, 0, 2, 0],
				[1, 1, 1, 1, 1],
				[0, 2, 0, 2, 0]
			],
			parts:
			{
				0:
				{
					1:
					[
						{side: 'top', index: 1, name: 'SATELLITE_1'},
						{side: 'bottom', index: 2, name: 'SATELLITE_1'}
					]
				},
				1:
				{
					1:
					[
						{side: 'left', index: 1, name: 'SATELLITE_1'},
						{side: 'right', index: 2, name: 'SATELLITE_1'},
					]
				}
			},
			moving: false
		}
	};

	/**
	 * Resource for converting level data into game entities
	 */
	function LevelLoader(assets)
	{
		// Private:
		var _ = this;
		var width;                  // Width of the level in station modules
		var height;                 // Height of the level in station modules
		var level;                  // The level to be loaded
		var is_built = [];          // Module build completion flags
		var entities = [];          // List of entities to be created

		// ------------------------------------------- //
		// ------------- STATION MODULES ------------- //
		// ------------------------------------------- //

		/**
		 * Returns module properties based on a number ID
		 */
		function get_module_specs(id)
		{
			var name = ModuleNames[id];
			return Modules[name];
		}

		/**
		 * Returns the opposite docking side based on a string
		 */
		function opposite_side(side)
		{
			if (side === 'top') return 'bottom';
			if (side === 'left') return 'right';
			if (side === 'right') return 'left';
			if (side === 'bottom') return 'top';
			return null;
		}

		/**
		 * Creates a station module as an entity
		 */
		function add_module(specs, positionX, positionY)
		{
			var module = new Entity()
				.add(new Point().setPosition(positionX, positionY))
				.add(new Sprite(assets.getImage(specs.file)));

			entities.push(module);

			return module;
		}

		/**
		 * Returns modules connected to that at
		 * [x, y] which have not yet been built
		 */
		function get_offshoot_modules(y, x)
		{
			var parent = get_module_specs(LevelData[level].layout[y][x]);
			var offshoots = {}, offshoot = {};

			// Adjacent module index values
			var adjacents =
			{
				top: {x: x, y: (y-1)},
				left: {x: (x-1), y: y},
				right: {x: (x+1), y: y},
				bottom: {x: x, y: (y+1)}
			};

			for (var side in adjacents)
			{
				if (adjacents.hasOwnProperty(side))
				{
					// Get array index for offshoot module
					offshoot.index = adjacents[side];

					// Make sure index is within level layout array bounds
					if (offshoot.index.x >= 0 && offshoot.index.y >= 0 && offshoot.index.x < width && offshoot.index.y < height)
					{
						offshoot.module = LevelData[level].layout[offshoot.index.y][offshoot.index.x];
						offshoot.specs = get_module_specs(offshoot.module);

						// In order for a offshoot module to be returned...
						if (
							// ...it must be stored with a non-zero module ID...
							offshoot.module !== 0 &&
							// ...its parent module must have a docking port on this adjacent end...
							parent.docking.hasOwnProperty(side) &&
							// ...it must have a docking port on the opposite end...
							offshoot.specs.docking.hasOwnProperty(opposite_side(side)) &&
							// ...and it can't have been built already!
							!is_built[offshoot.index.y][offshoot.index.x]
						)
						{
							offshoots[side] =
							{
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
		function build_module_recursive(y, x, positionX, positionY)
		{
			if (is_built[y][x])
			{
				// When a station layout has multiple converging
				// "branches", recursions can cause previously
				// unbuilt offshoot modules to become built. As a
				// precaution we always want to check this flag.
				// If this module is already built, stop here.
				return;
			}

			// Update build flag to avoid recursing back to this module
			is_built[y][x] = true;

			// Get module + offshoot module data
			var parent = get_module_specs(LevelData[level].layout[y][x]);
			var offshoots = get_offshoot_modules(y, x);
			var offshoot = {}, dock = {};

			// Create the module and add it to the entity list
			var module = add_module(parent, positionX, positionY);

			if (!!LevelData[level].parts[y] && !!LevelData[level].parts[y][x])
			{
				// Create module hardware parts
				var parts = create_parts(y, x);

				// Add hardware parts as child entities to the module entity
				for (var p = 0 ; p < parts.length ; p++)
				{
					module.addChild(parts[p]);
				}
			}

			// Build connecting offshoot modules
			for (var side in offshoots)
			{
				if (offshoots.hasOwnProperty(side))
				{
					// Get docking position offsets from parent module
					dock.x = parent.docking[side].x;
					dock.y = parent.docking[side].y;
					// Get offshoot module information
					offshoot.index = offshoots[side];
					offshoot.specs = get_module_specs(LevelData[level].layout[offshoot.index.y][offshoot.index.x]);

					// Adjust docking values to align
					// offshoot and parent docking ports
					switch (side)
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
			height = LevelData[level].layout.length;
			width = LevelData[level].layout[0].length;
			is_built.length = 0;

			for (var y = 0 ; y < height ; y++)
			{
				is_built[y] = [];
				for (var x = 0 ; x < width ; x++)
				{
					is_built[y][x] = false;
				}
			}
		}

		// -------------------------------------------- //
		// ------------- STATION HARDWARE ------------- //
		// -------------------------------------------- //

		/**
		 * Returns hardware part specs based on name and
		 * module side (which determines orientation)
		 */
		function get_part_specs(part, side)
		{
			side = side || 'top';

			var specs = HardwareParts[part];
			var data = {};

			switch (side)
			{
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
		 * layout, and creates/returns them as an entity list.
		 */
		function create_parts(y, x)
		{
			// Get parent module specs
			var module = get_module_specs(LevelData[level].layout[y][x]);
			// Check to see what parts we'll need for this index
			var part_list = LevelData[level].parts[y][x];
			var part, terminal, specs, position = {}, entities = [];

			for (var p = 0 ; p < part_list.length ; p++)
			{
				// Module part determined from the level data
				part = part_list[p];
				// Terminal name to stick the part in on the module
				terminal = part.side + part.index;

				// Ensure hardware terminal is valid
				if (module.terminals.hasOwnProperty(terminal))
				{
					// Ascertain the specs (mostly size/coordinates) for the part
					specs = get_part_specs(part.name, part.side);
					// Establish Sprite position
					position.x = module.terminals[terminal].x - specs.x;
					position.y = module.terminals[terminal].y - specs.y;

					// Save the hardware part as an entity
					entities.push(
						new Entity()
							.add(
								new HardwarePart()
									.moving(LevelData[level].moving)
							)
							.add(
								new Sprite(assets.getImage(specs.file))
									.setXY(position.x, position.y)
							)
					);
				}
			}

			return entities;
		}

		// Public:
		this.buildLevel = function(_level)
		{
			// Save level # for internal methods
			level = _level;
			// Set all modules as unbuilt
			set_initial_build_flags();

			// Loop through layout data and find
			// a station module to start from
			var y = 0, x = 0, can_start = false;

			while (y < height-1)
			{
				x = 0;

				while (x < width)
				{
					if (LevelData[level].layout[y][x] !== 0)
					{
						// Found a suitable starting module
						can_start = true;
						break;
					}

					x++;
				}

				if (can_start) break;

				y++;
			}

			// Build station outward from starting module
			build_module_recursive(y, x, 0, 0);

			return _;
		}

		this.getEntities = function()
		{
			return entities;
		}
	}

	scope.LevelLoader = LevelLoader;
})(window);