# cosmodrone
A game about space station maintenance!

### TODO:

##### GAME
* Title/menus
* Loading bar/indicator of some kind
* New drone sprite
* Make sure hardware asset "light source" is adjusted based on the side of the module
* Collisions/drone damage
* Hardware/part maintenance interface
* Text boxes/string printing
* Components with update cycles/architecture for various hardware parts
* Alerts screen with ability to select hardware maintenance jobs
* Handler for drone running out of power/fuel
* Ability to move drone above or below the station
* Moving docking targets (later-stage development) (?)
* Scene zoom-out when speeding up (?)
* Replace jQuery with vanilla JS (?)

##### HUD
* "Autospin" system indicator
* Radio signal reception mechanic
* Indicate when docking mode is usable
* Radar/local area map

##### BACKGROUND
* Try drawing both times to one canvas using globalAlpha for transitions
* Rivers

##### CODE
* Handy routine for checking on-screen condition
* Handy routine for converting to/from Canvas pixel data index and [x, y] pixel coordinate
* Base "Component" class inherited by all components
* Why don't public functions have descriptions?
* Continue skimming through and clarifying variable names/comments
* Background, Terrain, and HeightMap classes need some tidying