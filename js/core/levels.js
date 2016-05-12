/**
 * List of various station modules and their specification
 */
var Modules =
{
	MODULE_GENERAL_HORIZONTAL_LARGE: {
		file: 'station/modules/horizontal/general-large.png',
		orientation: 'horizontal',
		size:
		{
			width: 600,
			height: 300
		},
		docking:
		{
			top: {x: 248, y: 2},
			left: {x: 2, y: 82},
			right: {x: 598, y: 82},
			bottom: {x: 248, y: 298}
		}
	},
	MODULE_GENERAL_VERTICAL_SMALL: {
		file: 'station/modules/vertical/general-small.png',
		orientation: 'vertical',
		size:
		{
			width: 242,
			height: 396
		},
		docking:
		{
			top: {x: 70, y: 2},
			bottom: {x: 70, y: 394}
		}
	}
};

/**
 * Conversions for level layout data loader
 */
var ModuleNames =
{
	1: 'MODULE_GENERAL_HORIZONTAL_LARGE',
	2: 'MODULE_GENERAL_VERTICAL_SMALL'
};

/**
 * Layouts for the various levels
 */
var LevelData =
{
	1:
	{
		layout: [
			[0, 1, 1, 1, 1],
			[0, 2, 0, 2, 0],
			[1, 1, 1, 1, 1],
			[0, 2, 0, 2, 0]
		]
	}
};

/**
 * Resource for converting level data into game entities
 */
function LevelLoader(assets)
{
	// Private:
	var _ = this;
	var width;
	var height;
	var layout = [];
	var is_built = [];
	var entities = [];

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
		entities.push(
			new Entity()
				.add(new Point().setPosition(positionX, positionY))
				.add(new Sprite(assets.getImage(specs.file)))
		);
	}

	/**
	 * Returns modules connected to that at
	 * [x, y] which have not yet been built
	 */
	function get_child_modules(y, x)
	{
		var parent = get_module_specs(layout[y][x]);
		var children = {}, child = {};

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
				// Get array index for child module
				child.index = adjacents[side];

				// Make sure index is within [layout] bounds
				if (child.index.x >= 0 && child.index.y >= 0 && child.index.x < width && child.index.y < height)
				{
					child.module = layout[child.index.y][child.index.x];
					child.specs = get_module_specs(child.module);

					// In order for a child module to be returned...
					if (
						// ...it must be stored with a non-zero module ID...
						child.module !== 0 &&
						// ...its parent module must have a docking port on this adjacent end...
						parent.docking.hasOwnProperty(side) &&
						// ...it must have a docking port on the opposite end...
						child.specs.docking.hasOwnProperty(opposite_side(side)) &&
						// ...and it can't have been built already!
						!is_built[child.index.y][child.index.x]
					)
					{
						children[side] =
						{
							y: child.index.y,
							x: child.index.x,
							width: child.specs.size.width,
							height: child.specs.size.height
						};
					}
				}
			}
		}

		return children;
	}

	/**
	 * Build a module and its child modules
	 */
	function build_module_recursive(y, x, positionX, positionY)
	{
		if (is_built[y][x])
		{
			// When a station layout has multiple converging
			// "branches", recursions can cause previously
			// unbuilt child modules to become built. As a
			// precaution we always want to check this flag.
			// If this module is already built, stop here.
			return;
		}

		// Update build flag to avoid recursing back to this module
		is_built[y][x] = true;

		// Get module + child module data
		var parent = get_module_specs(layout[y][x]);
		var children = get_child_modules(y, x);
		var child = {}, dock = {};

		// Create the module and add it to the entity list
		add_module(parent, positionX, positionY);

		for (var side in children)
		{
			if (children.hasOwnProperty(side))
			{
				// Get docking position offsets from parent module
				dock.x = parent.docking[side].x;
				dock.y = parent.docking[side].y;
				// Get child module information
				child.index = children[side];
				child.specs = get_module_specs(layout[child.index.y][child.index.x]);

				// Adjust docking values to align
				// child and parent docking ports
				switch (side)
				{
					case 'top':
						dock.x -= child.specs.docking.bottom.x;
						dock.y -= child.specs.size.height;
						break;
					case 'left':
						dock.x -= child.specs.size.width;
						dock.y -= child.specs.docking.right.y;
						break;
					case 'right':
						dock.y -= child.specs.docking[side].y;
						break;
					case 'bottom':
						dock.x -= child.specs.docking[side].x;
						break;
					default:
						break;
				}

				// Build connecting child modules
				build_module_recursive(
					child.index.y,
					child.index.x,
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
		height = layout.length;
		width = layout[0].length;
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

	// Public:
	this.setLayout = function(_layout)
	{
		// Save layout data
		layout = _layout;
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
				if (layout[y][x] !== 0)
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

	this.setParts = function(_parts)
	{
		// TODO: Add hardware parts to modules
		return _;
	}

	this.getEntities = function()
	{
		return entities;
	}
}