extends Control

const C_BG       := Color(0.027, 0.027, 0.102)
const C_GOLD     := Color(1.0,   0.843, 0.0)
const C_PURPLE   := Color(0.612, 0.153, 0.690)
const C_TEXT     := Color(0.741, 0.741, 0.741)
const C_CARD     := Color(1.0,   1.0,   1.0,   0.04)

func _ready() -> void:
	set_anchors_and_offsets_preset(Control.PRESET_FULL_RECT)
	_build_ui()

func _build_ui() -> void:
	var sw := get_viewport().get_visible_rect().size.x
	var sh := get_viewport().get_visible_rect().size.y

	# Background
	var bg := ColorRect.new()
	bg.color = C_BG
	bg.set_anchors_and_offsets_preset(Control.PRESET_FULL_RECT)
	add_child(bg)

	# Decorative canvas (ward glow + demon silhouettes)
	var canvas := _make_deco_canvas(sw, sh)
	add_child(canvas)

	# Subtitle
	_add_label("⚔  SURVIVE THE NIGHT  ⚔", Vector2(sw * 0.5, sh * 0.10),
			12, C_PURPLE, HORIZONTAL_ALIGNMENT_CENTER)

	# Title
	_add_label("DEMON\nCYCLE", Vector2(sw * 0.5, sh * 0.14),
			58, Color.WHITE, HORIZONTAL_ALIGNMENT_CENTER)

	# Ward icon (drawn on a sub-canvas)
	var ward_canvas := SubViewportContainer.new()
	# Use a simple Node2D draw instead
	var ward_node := _WardDraw.new()
	ward_node.position = Vector2(sw * 0.5, sh * 0.37)
	add_child(ward_node)

	# Play button
	var play_btn := _make_button("ENTER THE CYCLE",
			Vector2(sw * 0.5 - 120, sh * 0.42), Vector2(240, 58))
	play_btn.pressed.connect(func() -> void:
		get_tree().change_scene_to_file("res://scenes/Game.tscn"))
	add_child(play_btn)

	# How-to-play card
	var card := ColorRect.new()
	card.color = C_CARD
	card.position = Vector2(20.0, sh * 0.52)
	card.size = Vector2(sw - 40.0, 168.0)
	add_child(card)

	_add_label("HOW TO PLAY", Vector2(34, sh * 0.52 + 12), 12, C_GOLD)
	var tips := [
		"👆  Tap to move your ward painter",
		"🔶  Switch to WARD MODE then tap to place protective runes",
		"🌙  Survive each night — demons grow stronger each cycle",
		"⭐  +50 pts per night survived  |  +10–25 pts per demon",
	]
	for i in tips.size():
		var lbl := _add_label(tips[i],
				Vector2(34, sh * 0.52 + 38 + i * 30), 13, C_TEXT)
		lbl.autowrap_mode = TextServer.AUTOWRAP_WORD_SMART
		lbl.custom_minimum_size.x = sw - 68.0

	# Demon legend
	_add_label("CORELING TYPES", Vector2(34, sh * 0.52 + 168 + 18), 11, C_GOLD)
	var legend := [
		["Ground  HP 30  Normal", Color(0.9, 0.22, 0.21)],
		["Flame   HP 20  Fast  (Day 2+)", Color(1.0, 0.56, 0.0)],
		["Rock    HP 85  Slow  (Day 4+)", Color(0.38, 0.49, 0.55)],
	]
	for i in legend.size():
		_add_label(legend[i][0] as String,
				Vector2(34, sh * 0.52 + 168 + 42 + i * 22),
				12, legend[i][1] as Color)

# ---------------------------------------------------------------------------
# Helpers
# ---------------------------------------------------------------------------

func _add_label(txt: String, pos: Vector2, size: int,
		col: Color, align: int = HORIZONTAL_ALIGNMENT_LEFT) -> Label:
	var lbl := Label.new()
	lbl.text = txt
	lbl.position = pos
	lbl.add_theme_font_size_override("font_size", size)
	lbl.add_theme_color_override("font_color", col)
	lbl.horizontal_alignment = align as HorizontalAlignment
	add_child(lbl)
	return lbl

func _make_button(txt: String, pos: Vector2, sz: Vector2) -> Button:
	var btn := Button.new()
	btn.text = txt
	btn.position = pos
	btn.size = sz
	return btn

func _make_deco_canvas(sw: float, sh: float) -> Node2D:
	var node := _DecoCanvas.new()
	node.sw = sw
	node.sh = sh
	return node

# ---------------------------------------------------------------------------
# Inner classes for procedural drawing
# ---------------------------------------------------------------------------

class _WardDraw extends Node2D:
	func _draw() -> void:
		var r := 34.0
		draw_arc(Vector2.ZERO, r, 0.0, TAU, 64, Color(1.0, 0.843, 0.0, 0.6), 2.0)
		var pts := PackedVector2Array()
		for i in 10:
			var angle := (float(i) / 10.0) * TAU - PI / 2.0
			var rad := 28.0 if i % 2 == 0 else 11.0
			pts.append(Vector2(cos(angle), sin(angle)) * rad)
		draw_colored_polygon(pts, Color(1.0, 0.843, 0.0, 0.85))

class _DecoCanvas extends Node2D:
	var sw: float = 390.0
	var sh: float = 844.0

	func _draw() -> void:
		# Purple radial glow behind title
		for i in range(6, 0, -1):
			var alpha := 0.035 * i
			draw_circle(Vector2(sw * 0.5, sh * 0.28), 80.0 + i * 18.0,
					Color(0.612, 0.153, 0.690, alpha))
		# Demon silhouettes
		_draw_demon_sil(Vector2(sw * 0.12, sh * 0.22), 1.4, "ground")
		_draw_demon_sil(Vector2(sw * 0.88, sh * 0.18), 1.0, "flame")
		_draw_demon_sil(Vector2(sw * 0.07, sh * 0.65), 0.9, "ground")
		_draw_demon_sil(Vector2(sw * 0.91, sh * 0.60), 1.1, "rock")

	func _draw_demon_sil(pos: Vector2, scale: float, type: String) -> void:
		var col := Color(1.0, 1.0, 1.0, 0.07)
		match type:
			"ground":
				var pts := PackedVector2Array([
					pos + Vector2(0, -22) * scale,
					pos + Vector2(16, 14) * scale,
					pos + Vector2(-16, 14) * scale,
				])
				draw_colored_polygon(pts, col)
			"flame":
				var pts := PackedVector2Array([
					pos + Vector2(0, -22) * scale,
					pos + Vector2(10, 8) * scale,
					pos + Vector2(0, 0) * scale,
					pos + Vector2(-10, 8) * scale,
				])
				draw_colored_polygon(pts, col)
				draw_circle(pos + Vector2(0, -12) * scale, 6.0 * scale, col)
			"rock":
				var pts := PackedVector2Array([
					pos + Vector2(-16, -10) * scale,
					pos + Vector2(0, -22) * scale,
					pos + Vector2(16, -10) * scale,
					pos + Vector2(16, 10) * scale,
					pos + Vector2(0, 18) * scale,
					pos + Vector2(-16, 10) * scale,
				])
				draw_colored_polygon(pts, col)
