/**
 * List of various station modules and their specifications
 */
var Modules =
{
	MODULE_GENERAL_HORIZONTAL_LARGE: {
		file: 'game/station/modules/general-large.png',
		size: {
			width: 600,
			height: 298
		},
		docking: {
			top: {x: 248, y: 2},
			left: {x: 2, y: 82},
			right: {x: 598, y: 82},
			bottom: {x: 248, y: 298}
		},
		terminals: {
			top1: {x: 60, y: 12},
			top2: {x: 500, y: 12},
			bottom1: {x: 60, y: 286},
			bottom2: {x: 500, y: 286}
		}
	},
	MODULE_GENERAL_VERTICAL_SMALL: {
		file: 'game/station/modules/general-small.png',
		size: {
			width: 242,
			height: 396
		},
		docking: {
			top: {x: 70, y: 0},
			bottom: {x: 70, y: 396}
		},
		terminals: {
			left1: {x: 10, y: 42},
			left2: {x: 10, y: 178},
			left3: {x: 10, y: 314},
			right1: {x: 234, y: 42},
			right2: {x: 234, y: 178},
			right3: {x: 234, y: 314}
		}
	},
	MODULE_POWER: {
		file: 'game/station/modules/power.png',
		size: {
			width: 188,
			height: 180
		},
		docking: {
			top: {x: 42, y: 0},
			bottom: {x: 42, y: 180}
		},
		terminals: {
			left1: {x: 4, y: 70},
			right1: {x: 186, y: 70}
		}
	},
	MODULE_COMMUNICATIONS: {
		file: 'game/station/modules/communications.png',
		size: {
			width: 232,
			height: 240
		},
		docking: {
			top: {x: 64, y: 0},
			bottom: {x: 64, y: 240}
		},
		terminals: {
			left1: {x: 6, y: 100},
			right1: {x: 224, y: 100}
		}
	}
};

/**
 * Shorthand IDs for station modules,
 * used for level layout construction
 * (see: LevelLoader.js -> LevelData)
 */
var ModuleNames = {
	1: 'MODULE_GENERAL_HORIZONTAL_LARGE',
	2: 'MODULE_GENERAL_VERTICAL_SMALL',
	3: 'MODULE_POWER',
	4: 'MODULE_COMMUNICATIONS'
};

/**
 * List of various station hardware parts and
 * their specifications based on the default
 * top-facing graphic. For left/right/bottom
 * ends the specs are automatically adjusted
 * (see: LevelLoader.js -> get_part_specs())
 */
var HardwareParts = {
	REFUELER: {
		listName: 'Refueler',
		listIcon: 1,
		width: 76,
		height: 40,
		x: -18,
		y: 2
	},
	RECHARGER: {
		listName: 'Recharger',
		listIcon: 2,
		width: 76,
		height: 36,
		x: -18,
		y: 2
	},
	COMM_DISH: {
		listName: 'Comm. Dish',
		listIcon: 3,
		width: 112,
		height: 110,
		x: -36,
		y: 2
	},
	SMALL_DISH: {
		listName: 'Sm. Radio Dish',
		listIcon: 4,
		width: 76,
		height: 86,
		x: -18,
		y: 2
	}
};