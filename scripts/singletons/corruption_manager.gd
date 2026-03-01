extends Node
## CorruptionManager — tracks the player's corruption level (0.0 – 1.0) and
## broadcasts signals when it changes or crosses key thresholds.

signal corruption_changed(value: float)
signal threshold_crossed(value: float, label: String)
signal path_changed(path_name: String)

const THRESHOLDS : Array = [0.0, 0.25, 0.5, 0.75, 0.9, 1.0]

var corruption : float = 0.0

var _last_path : String = ""

func _ready() -> void:
	_last_path = get_path_name()

# ---------------------------------------------------------------------------
# Public API
# ---------------------------------------------------------------------------

func add_corruption(amount: float) -> void:
	_set_corruption(corruption + amount)

func reduce_corruption(amount: float) -> void:
	_set_corruption(corruption - amount)

## Set corruption directly (e.g. when loading a save).
func set_corruption(value: float) -> void:
	_set_corruption(value)

# ---------------------------------------------------------------------------
# Internal
# ---------------------------------------------------------------------------

func _set_corruption(new_val: float) -> void:
	var old_val := corruption
	corruption = clampf(new_val, 0.0, 1.0)

	if absf(corruption - old_val) < 0.0001:
		return

	corruption_changed.emit(corruption)

	# Threshold crossings (both rising and falling)
	for t in THRESHOLDS:
		var t_f := t as float
		if (old_val < t_f and corruption >= t_f) or (old_val > t_f and corruption <= t_f):
			threshold_crossed.emit(t_f, _threshold_label(t_f))

	# Path name change
	var new_path := get_path_name()
	if new_path != _last_path:
		_last_path = new_path
		path_changed.emit(new_path)

func _threshold_label(t: float) -> String:
	if is_equal_approx(t, 0.25): return "tainted"
	if is_equal_approx(t, 0.50): return "half_turned"
	if is_equal_approx(t, 0.75): return "demon_marked"
	if is_equal_approx(t, 0.90): return "near_lost"
	if is_equal_approx(t, 1.00): return "consumed"
	return "pure"

# ---------------------------------------------------------------------------
# Computed properties
# ---------------------------------------------------------------------------

## "Ward-Bearer" | "Gray Walker" | "Demon-Eater"
func get_path_name() -> String:
	if corruption < 0.3:   return "Ward-Bearer"
	if corruption <= 0.7:  return "Gray Walker"
	return "Demon-Eater"

## Price multiplier for shops: 0.8 at 0, 1.0 at 0.5, 1.5 at 1.0
func get_shop_price_modifier() -> float:
	return lerpf(0.8, 1.5, corruption)

## Shader visual parameters for player corruption effects.
func get_shader_params() -> Dictionary:
	return {
		"crack_intensity" : corruption,
		"glow_color"      : Color(0.0, 0.5, 1.0).lerp(Color(1.0, 0.0, 0.0), corruption),
		"horn_scale"      : clampf((corruption - 0.5) * 2.0, 0.0, 1.0),
	}

## Ward zones become hostile to the player above 0.7 corruption.
func is_ward_zone_hostile() -> bool:
	return corruption > 0.7

## Player can consume demon flesh/hora above 0.2 corruption.
func can_consume_demon() -> bool:
	return corruption > 0.2

## Movement speed modifier: faster at high corruption, slower at low.
func get_night_speed_modifier() -> float:
	if corruption < 0.3:   return 0.75
	if corruption <= 0.7:  return 1.0
	return 1.25

## Demon spawn rate multiplier: increases with corruption.
func get_demon_spawn_multiplier() -> float:
	if corruption < 0.5:   return 1.0
	if corruption <= 0.8:  return 1.2
	return 1.5
