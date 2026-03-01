extends Node
## PlayerSave — handles saving and loading game state to disk.
## Tracks playtime each session.

const SAVE_PATH := "user://warded_cycle_save.tres"

var _session_start : float = 0.0
var _saved_playtime: float = 0.0

func _ready() -> void:
	_session_start = Time.get_ticks_msec() / 1000.0

func _process(_delta: float) -> void:
	pass  # Playtime accumulated at save time

# ---------------------------------------------------------------------------
# Public API
# ---------------------------------------------------------------------------

func save_game() -> void:
	var data := SaveData.new()
	data.corruption         = CorruptionManager.corruption
	data.day_count          = GameData.day_count
	data.score              = GameData.final_score
	data.player_pos_x       = GameData.player_pos_x
	data.player_pos_y       = GameData.player_pos_y
	data.playtime_seconds   = _saved_playtime + _session_elapsed()
	ResourceSaver.save(data, SAVE_PATH)
	print("[PlayerSave] Game saved.")

func load_game() -> bool:
	if not has_save():
		return false
	var res := ResourceLoader.load(SAVE_PATH)
	if not (res is SaveData):
		push_warning("[PlayerSave] Save file corrupt or wrong type.")
		return false
	var data := res as SaveData
	CorruptionManager.set_corruption(data.corruption)
	GameData.day_count    = data.day_count
	GameData.final_score  = data.score
	GameData.player_pos_x = data.player_pos_x
	GameData.player_pos_y = data.player_pos_y
	_saved_playtime       = data.playtime_seconds
	_session_start        = Time.get_ticks_msec() / 1000.0
	print("[PlayerSave] Game loaded. Day %d | Score %d | Corruption %.2f" % [
		data.day_count, data.score, data.corruption])
	return true

func has_save() -> bool:
	return FileAccess.file_exists(SAVE_PATH)

func delete_save() -> void:
	if has_save():
		DirAccess.remove_absolute(SAVE_PATH)
		_saved_playtime = 0.0
		print("[PlayerSave] Save deleted.")

func get_total_playtime() -> float:
	return _saved_playtime + _session_elapsed()

# ---------------------------------------------------------------------------

func _session_elapsed() -> float:
	return (Time.get_ticks_msec() / 1000.0) - _session_start
