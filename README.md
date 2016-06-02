# cosmodrone
A game about space station maintenance!

### TODO:

##### LEVEL SELECT SCREEN
* / character for MonitorMini font
* Map layout preview below level description
* Loading bar/indicator of some kind (connect level menu with gameplay!!!)

##### GAME
* Print debug text using TextString component
* New drone sprite
* Dynamic dialogue
* More modules and hardware parts (with correct lighting based on orientation)
* Radio signal reception mechanic
* Recharging/refueling terminal
* Collisions/drone damage
* Components with update cycles/architecture for various hardware parts
* Icons next to vulnerable hardware parts
* Alerts screen with ability to select hardware maintenance jobs
* Hardware repair interface - needs various ideas for maintenance 'minigames'
* Handler for drone running out of power/fuel
* Ability to move drone above or below the station
* Moving docking targets (later-stage development) (?)
* Scene zoom-out when speeding up (?)
* Replace jQuery with vanilla JS (?)

##### HUD
* "Autospin" system indicator
* Indicate when docking mode is usable
* Radar/local area map

##### BACKGROUND/TERRAIN
* Additional color formula sets/terrain features (for other planets)
* Rivers

##### CODE
* Consolidate major framework elements (Canvas, WebAudio, AssetLoader, Entity/Component, Sprite, Text, etc.)
* Terrain and HeightMap classes need some tidying
* Child Sprite coordinate system transformations (rotation, scaling, etc.)