extends Node
## DataRegistry — scans data/ folders on startup and loads all JSON into
## dictionaries keyed by "id". Loader skips files whose names start with "_".

var wards        : Dictionary = {}
var demons       : Dictionary = {}
var characters   : Dictionary = {}
var powers       : Dictionary = {}
var quests       : Dictionary = {}
var villages     : Dictionary = {}
var world_events : Dictionary = {}
var items        : Dictionary = {}

func _ready() -> void:
	_load_all()
	print("[DataRegistry] Loaded: %d wards | %d demons | %d characters | %d villages | %d items | %d quests | %d powers | %d world_events" % [
		wards.size(), demons.size(), characters.size(),
		villages.size(), items.size(), quests.size(),
		powers.size(), world_events.size(),
	])

func _load_all() -> void:
	wards        = _scan_folder("res://data/wards/")
	demons       = _scan_folder("res://data/demons/")
	characters   = _scan_folder("res://data/characters/")
	powers       = _scan_folder_recursive("res://data/powers/")
	quests       = _scan_folder("res://data/quests/")
	villages     = _scan_folder("res://data/villages/")
	world_events = _scan_folder("res://data/world_events/")
	items        = _scan_folder("res://data/items/")

## Scan a flat folder for .json files. Skips _-prefixed filenames.
func _scan_folder(path: String) -> Dictionary:
	var result : Dictionary = {}
	var dir := DirAccess.open(path)
	if dir == null:
		push_warning("[DataRegistry] Cannot open folder: " + path)
		return result
	dir.list_dir_begin()
	var file_name := dir.get_next()
	while file_name != "":
		if not dir.current_is_dir() \
				and file_name.ends_with(".json") \
				and not file_name.begins_with("_"):
			var data := _load_json(path + file_name)
			if data.has("id"):
				result[data["id"]] = data
			else:
				push_warning("[DataRegistry] File missing 'id': " + path + file_name)
		file_name = dir.get_next()
	dir.list_dir_end()
	return result

## Recursively scan a folder and all sub-folders.
func _scan_folder_recursive(path: String) -> Dictionary:
	var result : Dictionary = {}
	var dir := DirAccess.open(path)
	if dir == null:
		return result
	dir.list_dir_begin()
	var entry := dir.get_next()
	while entry != "":
		if dir.current_is_dir() and entry != "." and entry != "..":
			result.merge(_scan_folder_recursive(path + entry + "/"))
		elif entry.ends_with(".json") and not entry.begins_with("_"):
			var data := _load_json(path + entry)
			if data.has("id"):
				result[data["id"]] = data
		entry = dir.get_next()
	dir.list_dir_end()
	return result

## Load a single JSON file, return its data as a Dictionary.
func _load_json(path: String) -> Dictionary:
	var file := FileAccess.open(path, FileAccess.READ)
	if file == null:
		push_warning("[DataRegistry] Cannot open file: " + path)
		return {}
	var text := file.get_as_text()
	file.close()
	var j := JSON.new()
	var err := j.parse(text)
	if err != OK:
		push_warning("[DataRegistry] JSON parse error in '%s' at line %d: %s" % [path, j.get_error_line(), j.get_error_message()])
		return {}
	if j.data is Dictionary:
		return j.data as Dictionary
	push_warning("[DataRegistry] Root is not a Dictionary in: " + path)
	return {}

## Force a full rescan of all data folders.
func reload() -> void:
	_load_all()
	print("[DataRegistry] Reloaded all data.")

# ---------------------------------------------------------------------------
# Query helpers
# ---------------------------------------------------------------------------

func get_ward(id: String) -> Dictionary:
	return wards.get(id, {})

func get_demon(id: String) -> Dictionary:
	return demons.get(id, {})

func get_character(id: String) -> Dictionary:
	return characters.get(id, {})

func get_item(id: String) -> Dictionary:
	return items.get(id, {})

func get_village(id: String) -> Dictionary:
	return villages.get(id, {})

## Returns all wards whose effective_against list contains demon_id or "all".
func get_wards_against(demon_id: String) -> Array:
	var result : Array = []
	for ward_id in wards:
		var w : Dictionary = wards[ward_id]
		var effective : Array = w.get("effective_against", [])
		if "all" in effective or demon_id in effective:
			result.append(w)
	return result

## Returns all demons at or below the given tier.
func get_demons_by_max_tier(tier: int) -> Array:
	var result : Array = []
	for demon_id in demons:
		var d : Dictionary = demons[demon_id]
		if (d.get("tier", 1) as int) <= tier:
			result.append(d)
	return result
