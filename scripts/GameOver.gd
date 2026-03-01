extends Control

const C_BG     := Color(0.027, 0.027, 0.102)
const C_GOLD   := Color(1.0,   0.843, 0.0  )
const C_RED    := Color(0.898, 0.224, 0.208)
const C_PURPLE := Color(0.808, 0.576, 0.847)
const C_CARD   := Color(1.0,   1.0,   1.0,   0.04)
const C_GREY   := Color(0.741, 0.741, 0.741)

func _ready() -> void:
	set_anchors_and_offsets_preset(Control.PRESET_FULL_RECT)
	_build_ui()

func _build_ui() -> void:
	var sw  := get_viewport().get_visible_rect().size.x
	var sh  := get_viewport().get_visible_rect().size.y
	var scr := GameData.final_score
	var nts := GameData.nights_survived

	# Background
	var bg := ColorRect.new()
	bg.color = C_BG
	bg.set_anchors_and_offsets_preset(Control.PRESET_FULL_RECT)
	add_child(bg)

	# Red glow
	var glow := _GlowCanvas.new()
	glow.sw = sw
	glow.sh = sh
	add_child(glow)

	# Broken ward symbol
	var ward_node := _BrokenWard.new()
	ward_node.position = Vector2(sw * 0.5, sh * 0.20)
	add_child(ward_node)

	# "WARD SHATTERED"
	_add_label("WARD SHATTERED", Vector2(sw * 0.5, sh * 0.30),
			12, C_RED, HORIZONTAL_ALIGNMENT_CENTER)

	# "DEFEATED"
	_add_label("DEFEATED", Vector2(sw * 0.5, sh * 0.33),
			54, Color.WHITE, HORIZONTAL_ALIGNMENT_CENTER)

	# Stats card
	var card := ColorRect.new()
	card.color    = C_CARD
	card.position = Vector2(20, sh * 0.44)
	card.size     = Vector2(sw - 40, 136)
	add_child(card)

	_add_label("SCORE", Vector2(36, sh * 0.44 + 14), 12, Color(0.55, 0.55, 0.55))
	_add_label(str(scr), Vector2(sw - 50, sh * 0.44 + 12),
			22, C_GREY, HORIZONTAL_ALIGNMENT_RIGHT)

	_add_label("NIGHTS SURVIVED", Vector2(36, sh * 0.44 + 52), 12, Color(0.55, 0.55, 0.55))
	_add_label(str(nts), Vector2(sw - 50, sh * 0.44 + 50),
			22, C_PURPLE, HORIZONTAL_ALIGNMENT_RIGHT)

	_add_label("RANK", Vector2(36, sh * 0.44 + 90), 12, Color(0.55, 0.55, 0.55))
	_add_label(_rank(nts), Vector2(sw - 50, sh * 0.44 + 88),
			18, C_GOLD, HORIZONTAL_ALIGNMENT_RIGHT)

	# Tip
	var tip_text : String
	if nts == 0:
		tip_text = "💡 Place wards BEFORE night falls — tap WARD MODE then tap the ground."
	elif nts < 3:
		tip_text = "💡 Place wards at chokepoints between the spawn edges and yourself."
	else:
		tip_text = "💡 Rock corelings appear on day 4+. Stack wards to melt them fast."
	var tip := _add_label(tip_text, Vector2(24, sh * 0.44 + 152), 13, Color(0.62, 0.62, 0.62))
	tip.autowrap_mode = TextServer.AUTOWRAP_WORD_SMART
	tip.custom_minimum_size.x = sw - 48.0

	# Retry
	var retry := _make_button("TRY AGAIN", Vector2(20, sh * 0.68), Vector2(sw - 40, 54))
	retry.pressed.connect(func() -> void:
		get_tree().change_scene_to_file("res://scenes/Game.tscn"))
	add_child(retry)

	# Menu
	var menu_btn := _make_button("MAIN MENU", Vector2(20, sh * 0.68 + 68), Vector2(sw - 40, 46))
	menu_btn.pressed.connect(func() -> void:
		get_tree().change_scene_to_file("res://scenes/Menu.tscn"))
	add_child(menu_btn)

# ---------------------------------------------------------------------------

func _rank(nights: int) -> String:
	if nights == 0:  return "NOVICE"
	if nights < 3:   return "INITIATE"
	if nights < 6:   return "WARD PAINTER"
	if nights < 10:  return "CORELING BANE"
	return "ARLEN REBORN"

func _add_label(txt: String, pos: Vector2, sz: int,
		col: Color, align: int = HORIZONTAL_ALIGNMENT_LEFT) -> Label:
	var lbl := Label.new()
	lbl.text     = txt
	lbl.position = pos
	lbl.add_theme_font_size_override("font_size", sz)
	lbl.add_theme_color_override("font_color", col)
	lbl.horizontal_alignment = align as HorizontalAlignment
	add_child(lbl)
	return lbl

func _make_button(txt: String, pos: Vector2, sz: Vector2) -> Button:
	var btn := Button.new()
	btn.text     = txt
	btn.position = pos
	btn.size     = sz
	return btn

# ---------------------------------------------------------------------------

class _GlowCanvas extends Node2D:
	var sw: float = 390.0
	var sh: float = 844.0
	func _draw() -> void:
		for i in range(5, 0, -1):
			draw_circle(Vector2(sw * 0.5, sh * 0.35), 80.0 + i * 24.0,
					Color(0.72, 0.11, 0.11, 0.04 * i))

class _BrokenWard extends Node2D:
	func _draw() -> void:
		draw_arc(Vector2.ZERO, 42.0, 0.0, TAU, 64, Color(0.9, 0.22, 0.21, 0.55), 2.0)
		var pts := PackedVector2Array()
		for i in 10:
			var angle := (float(i) / 10.0) * TAU - PI / 2.0
			var rad   := 30.0 if i % 2 == 0 else 12.0
			pts.append(Vector2(cos(angle), sin(angle)) * rad)
		draw_colored_polygon(pts, Color(0.9, 0.22, 0.21, 0.65))
		# Crack lines
		draw_line(Vector2(-20, -28), Vector2(20,  28), Color(0.9, 0.22, 0.21, 0.9), 2.5)
		draw_line(Vector2(-18, -28), Vector2(-12, -2), Color(0.9, 0.22, 0.21, 0.7), 2.0)
