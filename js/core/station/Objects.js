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
			top1: {x: 60, y: 10},
			top2: {x: 500, y: 10},
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
			right1: {x: 184, y: 70}
		}
	}
};

/**
 * Conversions for level layout data loader
 */
var ModuleNames = {
	1: 'MODULE_GENERAL_HORIZONTAL_LARGE',
	2: 'MODULE_GENERAL_VERTICAL_SMALL',
	3: 'MODULE_POWER'
};

/**
 * List of various station hardware parts and their specifications
 */
var HardwareParts = {
	SATELLITE_1: {
		file: 'game/station/parts/satellite1/',
		width: 80,
		height: 76,
		x: -20,
		y: -6
	}
};