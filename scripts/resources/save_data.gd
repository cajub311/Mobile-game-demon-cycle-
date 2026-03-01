extends Resource
class_name SaveData
## SaveData — persisted resource written to user://warded_cycle_save.tres

@export var corruption            : float            = 0.0
@export var day_count             : int              = 1
@export var score                 : int              = 0
@export var player_pos_x          : float            = 195.0
@export var player_pos_y          : float            = 364.5
@export var unlocked_wards        : PackedStringArray = PackedStringArray()
@export var inventory             : Dictionary       = {}
@export var total_demons_killed   : int              = 0
@export var total_demons_consumed : int              = 0
@export var playtime_seconds      : float            = 0.0
