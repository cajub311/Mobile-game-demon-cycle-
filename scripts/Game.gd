extends Node2D

# ---------------------------------------------------------------------------
# Constants
# ---------------------------------------------------------------------------

const PLAYER_SPEED       := 130.0
const PLAYER_MAX_HP      := 10.0
const PLAYER_RADIUS      := 16.0
const INVINCIBILITY_TIME := 0.9

const WARD_RADIUS   := 48.0
const WARD_DPS      := 22.0
const WARD_DURATION := 50.0
const MAX_WARDS     := 5

const DAY_DURATION   := 30.0
const NIGHT_DURATION := 50.0

const BASE_SPAWN_INTERVAL := 3.2
const MIN_SPAWN_INTERVAL  := 0.7
const NIGHT_SCORE         := 50

# [health, speed, damage, score, color]
const DEMON_STATS := {
	"ground": [30.0,  52.0, 2, 10, Color(0.9,  0.22, 0.21)],
	"flame":  [20.0,  95.0, 1, 15, Color(1.0,  0.56, 0.0 )],
	"rock":   [85.0,  28.0, 3, 25, Color(0.38, 0.49, 0.55)],
}

# Colours
const C_BG_DAY      := Color(0.055, 0.153, 0.267)
const C_BG_NIGHT    := Color(0.024, 0.024, 0.102)
const C_GND_DAY     := Color(0.039, 0.18,  0.039)
const C_GND_NIGHT   := Color(0.039, 0.039, 0.118)
const C_PLAYER      := Color(0.082, 0.396, 0.753)
const C_PLAYER_ACC  := Color(0.31,  0.765, 0.984)
const C_WARD        := Color(1.0,   0.843, 0.0  )
const C_HUD_BG      := Color(0.027, 0.027, 0.102)

# ---------------------------------------------------------------------------
# State
# ---------------------------------------------------------------------------

enum Phase { DAY, NIGHT }

var screen_size : Vector2
var hud_height  : float = 115.0

# Phase
var phase        : int   = Phase.DAY
var phase_timer  : float = DAY_DURATION
var day_count    : int   = 1
var score        : int   = 0
var is_game_over : bool  = false
var is_paused    : bool  = false
var is_ward_mode : bool  = false

# Player
var player_pos    : Vector2
var player_target : Vector2
var player_moving : bool  = false
var player_hp     : float = PLAYER_MAX_HP
var inv_timer     : float = 0.0

# Entities (array of Dictionaries)
var demons : Array = []
var wards  : Array = []
var _demon_id : int = 0
var _ward_id  : int = 0

var spawn_interval : float = BASE_SPAWN_INTERVAL
var spawn_timer    : float = BASE_SPAWN_INTERVAL

# HUD refs
var _phase_lbl    : Label
var _timer_lbl    : Label
var _score_lbl    : Label
var _hp_fill      : ColorRect
var _hp_bar_bg    : ColorRect
var _mode_btn     : Button
var _ward_ct_lbl  : Label
var _pause_btn    : Button
var _pause_layer  : CanvasLayer

# ---------------------------------------------------------------------------
# Initialise
# ---------------------------------------------------------------------------

func _ready() -> void:
	screen_size = get_viewport().get_visible_rect().size
	player_pos  = Vector2(screen_size.x * 0.5,
			(screen_size.y - hud_height) * 0.5)
	player_target = player_pos
	_build_hud()
	_build_pause_overlay()

# ---------------------------------------------------------------------------
# HUD
# ---------------------------------------------------------------------------

func _build_hud() -> void:
	var layer := CanvasLayer.new()
	add_child(layer)

	var top_y := screen_size.y - hud_height

	var bg := ColorRect.new()
	bg.color = C_HUD_BG
	bg.position = Vector2(0.0, top_y)
	bg.size     = Vector2(screen_size.x, hud_height)
	layer.add_child(bg)

	# Border line
	var border := ColorRect.new()
	border.color    = Color(1.0, 1.0, 1.0, 0.07)
	border.position = Vector2(0.0, top_y)
	border.size     = Vector2(screen_size.x, 1.0)
	layer.add_child(border)

	# Row 1  ----------------------------------------------------------------
	_phase_lbl = _make_label("", Vector2(12, top_y + 8), 13, C_PLAYER_ACC)
	layer.add_child(_phase_lbl)

	_timer_lbl = _make_label("", Vector2(screen_size.x * 0.5 - 18, top_y + 5), 22, C_WARD)
	layer.add_child(_timer_lbl)

	_score_lbl = _make_label("", Vector2(screen_size.x - 110, top_y + 8), 14, Color(0.88, 0.88, 0.88))
	layer.add_child(_score_lbl)

	_pause_btn = _make_button("⏸", Vector2(screen_size.x - 44, top_y + 6), Vector2(32, 28))
	_pause_btn.pressed.connect(_on_pause)
	layer.add_child(_pause_btn)

	# Row 2 – health bar  ---------------------------------------------------
	var hp_lbl := _make_label("HP", Vector2(12, top_y + 40), 11, Color(0.94, 0.33, 0.31))
	layer.add_child(hp_lbl)

	_hp_bar_bg = ColorRect.new()
	_hp_bar_bg.color    = Color(0.11, 0.11, 0.18)
	_hp_bar_bg.position = Vector2(36, top_y + 40)
	_hp_bar_bg.size     = Vector2(screen_size.x - 80, 11)
	layer.add_child(_hp_bar_bg)

	_hp_fill = ColorRect.new()
	_hp_fill.color    = Color(0.94, 0.33, 0.31)
	_hp_fill.position = _hp_bar_bg.position
	_hp_fill.size     = _hp_bar_bg.size
	layer.add_child(_hp_fill)

	var hp_val := _make_label("10/10", Vector2(screen_size.x - 42, top_y + 40), 11, Color(0.7, 0.7, 0.7))
	layer.add_child(hp_val)

	# Row 3 – mode toggle  --------------------------------------------------
	var hint := _make_label("👆 Tap to move", Vector2(12, top_y + 74), 11, Color(0.55, 0.55, 0.55))
	layer.add_child(hint)

	_mode_btn = _make_button("MOVE MODE",
			Vector2(screen_size.x * 0.5 - 55, top_y + 70), Vector2(110, 30))
	_mode_btn.pressed.connect(_on_mode_toggle)
	layer.add_child(_mode_btn)

	_ward_ct_lbl = _make_label("0/5 wards",
			Vector2(screen_size.x - 80, top_y + 74), 11, Color(0.4, 0.4, 0.4))
	layer.add_child(_ward_ct_lbl)

func _build_pause_overlay() -> void:
	_pause_layer = CanvasLayer.new()
	_pause_layer.visible = false
	add_child(_pause_layer)

	var bg := ColorRect.new()
	bg.color = Color(0.0, 0.0, 0.0, 0.82)
	bg.position = Vector2.ZERO
	bg.size     = screen_size
	_pause_layer.add_child(bg)

	var title := _make_label("PAUSED",
			Vector2(screen_size.x * 0.5 - 70, screen_size.y * 0.35),
			42, Color(0.808, 0.576, 0.847))
	_pause_layer.add_child(title)

	var resume := _make_button("RESUME",
			Vector2(screen_size.x * 0.5 - 80, screen_size.y * 0.5 - 28),
			Vector2(160, 52))
	resume.pressed.connect(_on_pause)
	_pause_layer.add_child(resume)

	var menu_btn := _make_button("MAIN MENU",
			Vector2(screen_size.x * 0.5 - 70, screen_size.y * 0.5 + 40),
			Vector2(140, 44))
	menu_btn.pressed.connect(func() -> void:
		get_tree().change_scene_to_file("res://scenes/Menu.tscn"))
	_pause_layer.add_child(menu_btn)

# ---------------------------------------------------------------------------
# Input
# ---------------------------------------------------------------------------

func _input(event: InputEvent) -> void:
	if is_game_over or is_paused:
		return
	var game_h := screen_size.y - hud_height
	var pos    : Vector2

	if event is InputEventScreenTouch and event.pressed:
		pos = event.position
	elif event is InputEventMouseButton and (event as InputEventMouseButton).pressed \
			and (event as InputEventMouseButton).button_index == MOUSE_BUTTON_LEFT:
		pos = (event as InputEventMouseButton).position
	else:
		return

	if pos.y >= game_h:
		return

	if is_ward_mode:
		_place_ward(pos)
	else:
		player_target = pos
		player_moving = true

# ---------------------------------------------------------------------------
# Update loop
# ---------------------------------------------------------------------------

func _process(delta: float) -> void:
	if is_game_over or is_paused:
		return
	_tick_phase(delta)
	_tick_player(delta)
	if phase == Phase.NIGHT:
		_tick_spawn(delta)
	_tick_demons(delta)
	_tick_wards(delta)
	_refresh_hud()
	queue_redraw()

func _tick_phase(delta: float) -> void:
	phase_timer -= delta
	if phase_timer > 0.0:
		return

	if phase == Phase.DAY:
		phase         = Phase.NIGHT
		phase_timer   = NIGHT_DURATION
		spawn_interval = maxf(MIN_SPAWN_INTERVAL,
				BASE_SPAWN_INTERVAL - (day_count - 1) * 0.25)
		spawn_timer   = 1.0
	else:
		phase       = Phase.DAY
		phase_timer = DAY_DURATION
		day_count  += 1
		score      += NIGHT_SCORE
		demons.clear()
		wards.clear()

func _tick_player(delta: float) -> void:
	inv_timer = maxf(0.0, inv_timer - delta)
	if not player_moving:
		return
	var diff  := player_target - player_pos
	var dist  := diff.length()
	var step  := PLAYER_SPEED * delta
	if dist <= step:
		player_pos    = player_target
		player_moving = false
	else:
		player_pos += diff.normalized() * step
	var gw := screen_size.x
	var gh := screen_size.y - hud_height
	player_pos.x = clampf(player_pos.x, PLAYER_RADIUS, gw - PLAYER_RADIUS)
	player_pos.y = clampf(player_pos.y, PLAYER_RADIUS, gh - PLAYER_RADIUS)

func _tick_spawn(delta: float) -> void:
	spawn_timer -= delta
	if spawn_timer <= 0.0:
		_spawn_demon()
		spawn_timer = spawn_interval

func _spawn_demon() -> void:
	var types := ["ground"]
	if day_count >= 2: types.append("flame")
	if day_count >= 4: types.append("rock")

	var type      : String = types[randi() % types.size()]
	var stats     : Array  = DEMON_STATS[type]
	var diff_mult : float  = 1.0 + (day_count - 1) * 0.12
	var gh        : float  = screen_size.y - hud_height

	var edge := randi() % 4
	var pos  : Vector2
	match edge:
		0: pos = Vector2(randf() * screen_size.x, -28.0)
		1: pos = Vector2(screen_size.x + 28.0, randf() * gh)
		2: pos = Vector2(randf() * screen_size.x, gh + 28.0)
		_: pos = Vector2(-28.0, randf() * gh)

	demons.append({
		"id"          : _demon_id,
		"pos"         : pos,
		"health"      : stats[0] * diff_mult,
		"max_health"  : stats[0] * diff_mult,
		"speed"       : (stats[1] as float) * (1.0 + (day_count - 1) * 0.06),
		"damage"      : stats[2] as int,
		"score_val"   : stats[3] as int,
		"color"       : stats[4] as Color,
		"type"        : type,
		"atk_cd"      : 0.0,
	})
	_demon_id += 1

func _tick_demons(delta: float) -> void:
	var to_kill : Array = []

	for i in demons.size():
		var d : Dictionary = demons[i]

		# Move toward player
		var dir := (player_pos - d["pos"] as Vector2).normalized()
		d["pos"] = (d["pos"] as Vector2) + dir * (d["speed"] as float) * delta

		# Ward damage
		for w in wards:
			if (d["pos"] as Vector2).distance_to(w["pos"] as Vector2) < (w["radius"] as float):
				d["health"] = (d["health"] as float) - WARD_DPS * delta

		# Attack player
		d["atk_cd"] = maxf(0.0, d["atk_cd"] as float - delta)
		var dist_to_player := (d["pos"] as Vector2).distance_to(player_pos)
		if dist_to_player < PLAYER_RADIUS + 12.0 \
				and (d["atk_cd"] as float) == 0.0 \
				and inv_timer == 0.0:
			player_hp  -= d["damage"] as int
			inv_timer   = INVINCIBILITY_TIME
			d["atk_cd"] = 1.0

		if (d["health"] as float) <= 0.0:
			score += d["score_val"] as int
			to_kill.append(i)

	# Remove in reverse order to keep indices valid
	for i in range(to_kill.size() - 1, -1, -1):
		demons.remove_at(to_kill[i])

	if player_hp <= 0.0:
		player_hp    = 0.0
		is_game_over = true
		_handle_game_over()

func _tick_wards(delta: float) -> void:
	var to_remove : Array = []
	for i in wards.size():
		wards[i]["duration"] = (wards[i]["duration"] as float) - delta
		if (wards[i]["duration"] as float) <= 0.0:
			to_remove.append(i)
	for i in range(to_remove.size() - 1, -1, -1):
		wards.remove_at(to_remove[i])

func _place_ward(pos: Vector2) -> void:
	if wards.size() >= MAX_WARDS:
		wards.remove_at(0)
	wards.append({
		"id"      : _ward_id,
		"pos"     : pos,
		"radius"  : WARD_RADIUS,
		"dps"     : WARD_DPS,
		"duration": WARD_DURATION,
	})
	_ward_id += 1

# ---------------------------------------------------------------------------
# HUD refresh
# ---------------------------------------------------------------------------

func _refresh_hud() -> void:
	var is_night := phase == Phase.NIGHT
	var secs     := int(ceilf(phase_timer))

	_phase_lbl.text = ("🌙 NIGHT " if is_night else "☀ DAY ") + str(day_count)
	_phase_lbl.add_theme_color_override("font_color",
			Color(0.808, 0.576, 0.847) if is_night else C_PLAYER_ACC)

	_timer_lbl.text = str(secs) + "s"
	_timer_lbl.add_theme_color_override("font_color",
			Color(0.94, 0.25, 0.25) if secs <= 10 else C_WARD)

	_score_lbl.text = "⭐ " + str(score)

	var hp_pct := player_hp / PLAYER_MAX_HP
	_hp_fill.size.x = _hp_bar_bg.size.x * hp_pct
	if hp_pct > 0.5:
		_hp_fill.color = Color(0.94, 0.33, 0.31)
	elif hp_pct > 0.25:
		_hp_fill.color = Color(1.0, 0.56, 0.0)
	else:
		_hp_fill.color = Color(0.94, 0.60, 0.60)

	_ward_ct_lbl.text = str(wards.size()) + "/5 wards"
	_mode_btn.text    = "WARD MODE" if is_ward_mode else "MOVE MODE"

# ---------------------------------------------------------------------------
# Drawing
# ---------------------------------------------------------------------------

func _draw() -> void:
	var is_night := phase == Phase.NIGHT
	var game_h   := screen_size.y - hud_height

	# ---- Background ----
	draw_rect(Rect2(0, 0, screen_size.x, game_h),
			C_BG_NIGHT if is_night else C_BG_DAY)

	# Ground strip
	draw_rect(Rect2(0, game_h * 0.87, screen_size.x, game_h * 0.13),
			C_GND_NIGHT if is_night else C_GND_DAY)

	# Stars
	if is_night:
		for i in 30:
			var sx := fmod(i * 137.508, screen_size.x)
			var sy := fmod(i * 97.31, game_h * 0.85)
			draw_circle(Vector2(sx, sy), 1.5,
					Color(1, 1, 1, 0.38 + (i % 4) * 0.12))

	# Sun / Moon
	if not is_night:
		draw_circle(Vector2(screen_size.x * 0.85, game_h * 0.11), 28.0,
				Color(0.992, 0.847, 0.204, 0.72))
	else:
		draw_circle(Vector2(screen_size.x * 0.80, game_h * 0.10), 20.0,
				Color(0.929, 0.937, 0.945, 0.62))
		draw_circle(Vector2(screen_size.x * 0.82, game_h * 0.08), 14.0,
				C_BG_NIGHT)

	# Wards
	for ward in wards:
		_draw_ward(ward)

	# Demons
	for demon in demons:
		_draw_demon(demon)

	# Player glow halo
	draw_circle(player_pos, 38.0, Color(C_PLAYER_ACC.r, C_PLAYER_ACC.g, C_PLAYER_ACC.b, 0.14))

	# Player
	_draw_player()

	# Move-target indicator
	if player_moving:
		draw_arc(player_target, 8.0, 0.0, TAU, 32,
				Color(C_PLAYER_ACC.r, C_PLAYER_ACC.g, C_PLAYER_ACC.b, 0.6), 1.5)
		draw_circle(player_target, 2.5,
				Color(C_PLAYER_ACC.r, C_PLAYER_ACC.g, C_PLAYER_ACC.b, 0.8))

func _draw_ward(w: Dictionary) -> void:
	var pos : Vector2 = w["pos"]
	var r   : float   = w["radius"]

	# Soft glow fill
	draw_circle(pos, r, Color(C_WARD.r, C_WARD.g, C_WARD.b, 0.09))

	# Dashed circle: draw alternating arcs
	for i in 16:
		if i % 2 == 0:
			var a1 := (float(i) / 16.0) * TAU
			var a2 := (float(i + 1) / 16.0) * TAU
			draw_arc(pos, r, a1, a2, 6, Color(C_WARD.r, C_WARD.g, C_WARD.b, 0.8), 2.0)

	# 10-point star (Star of Solomon)
	var pts := PackedVector2Array()
	for i in 10:
		var angle := (float(i) / 10.0) * TAU - PI / 2.0
		var rad   := 13.0 if i % 2 == 0 else 5.5
		pts.append(pos + Vector2(cos(angle), sin(angle)) * rad)
	draw_colored_polygon(pts, Color(C_WARD.r, C_WARD.g, C_WARD.b, 0.92))

func _draw_demon(d: Dictionary) -> void:
	var pos    : Vector2 = d["pos"]
	var col    : Color   = d["color"]
	var hp_pct : float   = (d["health"] as float) / (d["max_health"] as float)

	match d["type"] as String:
		"ground":
			draw_colored_polygon(PackedVector2Array([
				pos + Vector2(0, -18),
				pos + Vector2(14,  12),
				pos + Vector2(-14, 12),
			]), col)
		"flame":
			draw_colored_polygon(PackedVector2Array([
				pos + Vector2(0, -18),
				pos + Vector2(10,   8),
				pos + Vector2(0,    1),
				pos + Vector2(-10,  8),
			]), col)
			draw_circle(pos + Vector2(0, -10), 6.0, Color(1.0, 0.80, 0.16))
			draw_circle(pos + Vector2(0, -10), 3.0, Color(1.0, 0.44, 0.0))
		"rock":
			draw_colored_polygon(PackedVector2Array([
				pos + Vector2(-14, -8),
				pos + Vector2(0,  -18),
				pos + Vector2(14,  -8),
				pos + Vector2(14,   8),
				pos + Vector2(0,   16),
				pos + Vector2(-14,  8),
			]), col)

	# HP bar
	draw_rect(Rect2(pos.x - 16, pos.y + 20, 32, 4),  Color(0.1, 0.1, 0.1))
	draw_rect(Rect2(pos.x - 16, pos.y + 20, 32 * hp_pct, 4), col)

func _draw_player() -> void:
	var alpha := 0.42 if inv_timer > 0.0 else 1.0
	draw_circle(player_pos, PLAYER_RADIUS,
			Color(C_PLAYER.r, C_PLAYER.g, C_PLAYER.b, alpha))
	draw_arc(player_pos, PLAYER_RADIUS, 0.0, TAU, 64,
			Color(C_PLAYER_ACC.r, C_PLAYER_ACC.g, C_PLAYER_ACC.b, alpha), 2.5)
	# Ward-cross rune
	draw_line(player_pos + Vector2(-9, 0), player_pos + Vector2(9, 0),
			Color(C_PLAYER_ACC.r, C_PLAYER_ACC.g, C_PLAYER_ACC.b, alpha), 2.5)
	draw_line(player_pos + Vector2(0, -9), player_pos + Vector2(0, 9),
			Color(C_PLAYER_ACC.r, C_PLAYER_ACC.g, C_PLAYER_ACC.b, alpha), 2.5)
	draw_line(player_pos + Vector2(-6, -6), player_pos + Vector2(6, 6),
			Color(0.506, 0.831, 0.980, alpha), 1.5)
	draw_line(player_pos + Vector2(6, -6), player_pos + Vector2(-6, 6),
			Color(0.506, 0.831, 0.980, alpha), 1.5)

# ---------------------------------------------------------------------------
# Events
# ---------------------------------------------------------------------------

func _on_mode_toggle() -> void:
	is_ward_mode = not is_ward_mode

func _on_pause() -> void:
	is_paused              = not is_paused
	_pause_layer.visible   = is_paused
	_pause_btn.text        = "▶" if is_paused else "⏸"

func _handle_game_over() -> void:
	GameData.final_score     = score
	GameData.nights_survived = day_count - 1
	await get_tree().create_timer(0.75).timeout
	get_tree().change_scene_to_file("res://scenes/GameOver.tscn")

# ---------------------------------------------------------------------------
# Helpers
# ---------------------------------------------------------------------------

func _make_label(txt: String, pos: Vector2, sz: int, col: Color) -> Label:
	var lbl := Label.new()
	lbl.text     = txt
	lbl.position = pos
	lbl.add_theme_font_size_override("font_size", sz)
	lbl.add_theme_color_override("font_color", col)
	return lbl

func _make_button(txt: String, pos: Vector2, sz: Vector2) -> Button:
	var btn := Button.new()
	btn.text     = txt
	btn.position = pos
	btn.size     = sz
	return btn
