/**
 * List of various station modules and their specifications
 */
var Modules =
{
	MODULE_GENERAL_HORIZONTAL_LARGE: {
		file: 'game/station/modules/horizontal/general-large.png',
		orientation: 'horizontal',
		size: {
			width: 600,
			height: 300
		},
		docking: {
			top: {x: 248, y: 2},
			left: {x: 2, y: 82},
			right: {x: 598, y: 82},
			bottom: {x: 248, y: 298}
		},
		terminals: {
			top1: {x: 60, y: 6},
			top2: {x: 500, y: 6},
			bottom1: {x: 60, y: 294},
			bottom2: {x: 500, y: 294}
		}
	},
	MODULE_GENERAL_VERTICAL_SMALL: {
		file: 'game/station/modules/vertical/general-small.png',
		orientation: 'vertical',
		size: {
			width: 242,
			height: 396
		},
		docking: {
			top: {x: 70, y: 2},
			bottom: {x: 70, y: 394}
		},
		terminals: {
			left1: {x: 4, y: 42},
			left2: {x: 4, y: 178},
			left3: {x: 4, y: 314},
			right1: {x: 240, y: 42},
			right2: {x: 240, y: 178},
			right3: {x: 240, y: 314}
		}
	}
};

/**
 * Conversions for level layout data loader
 */
var ModuleNames = {
	1: 'MODULE_GENERAL_HORIZONTAL_LARGE',
	2: 'MODULE_GENERAL_VERTICAL_SMALL'
};

/**
 * List of various station hardware parts and their specifications
 */
var HardwareParts = {
	SATELLITE_1: {
		file: 'game/station/parts/satellite1/',
		width: 80,
		height: 76,
		x: 20,
		y: 0
	}
};