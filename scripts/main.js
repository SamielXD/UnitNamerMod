// Unit Namer v1.1 - FIXED VERSION with Scrollable Tutorial

// ============================================================================
// CONSTANTS
// ============================================================================
const VERSION = "1.1";
const NAME_Y_OFFSET = 15;
const AUTO_SAVE_INTERVAL = 10;
const DIALOG_COOLDOWN = 1.5;
const MAX_NAME_LENGTH = 15;
const BUTTON_WIDTH = 220;
const BUTTON_HEIGHT = 60;
const MIN_NAME_SIZE = 10;
const MAX_NAME_SIZE = 90;
const DEFAULT_NAME_SIZE = 30;
const MAX_BACKUP_SLOTS = 3;
const HEALTH_ALERT_THRESHOLD = 30;

// ============================================================================
// IMPORTS
// ============================================================================
const ui = Vars.ui;
const settings = Core.settings;
const world = Vars.world;

// ============================================================================
// DATA STORAGE
// ============================================================================
var unitNames = new java.util.HashMap();
var unitColors = new java.util.HashMap();
var unitIcons = new java.util.HashMap();
var nameHistory = [];
var nameTemplates = ["Scout", "Guard", "Attack", "Defense", "Support", "Recon", "Striker", "Defender", "Vanguard", "Ranger"];
var backupSlots = [null, null, null];
var lowHealthAlerted = new java.util.HashSet();

// ============================================================================
// SETTINGS
// ============================================================================
var renamerEnabled = true;
var nameSize = DEFAULT_NAME_SIZE / 100.0;
var showOnlyPlayerUnits = false;
var showTutorial = true;
var alertsEnabled = true;
var minimapNamesEnabled = false;
var autoCapitalize = true;

// ============================================================================
// ICONS LIBRARY
// ============================================================================
var iconsList = [
  ["none", "None"],
  ["⚔️", "Sword"],
  ["⚡", "Lightning"],
  ["⚙️", "Gear"],
  ["★", "Star"],
  ["●", "Dot"],
  ["■", "Square"],
  ["▲", "Triangle"],
  ["♦", "Diamond"],
  ["@", "At"],
  ["#", "Hash"],
  ["$", "Dollar"],
  ["+", "Plus"],
  ["*", "Asterisk"],
  ["~", "Wave"],
  ["!", "Exclaim"]
];

// ============================================================================
// COLOR CACHE
// ============================================================================
var colorCache = {
  "white": Color.white,
  "red": Color.red,
  "blue": Color.blue,
  "green": Color.green,
  "yellow": Color.yellow,
  "orange": Color.orange,
  "purple": Color.purple,
  "cyan": Color.cyan,
  "pink": Color.pink,
  "lime": Color.lime,
  "gold": Color.gold,
  "sky": Color.sky
};

// ============================================================================
// PRESET NAME TEMPLATES
// ============================================================================
var presetNamePacks = {
  "Military": ["Alpha", "Bravo", "Charlie", "Delta", "Echo", "Foxtrot", "Golf", "Hotel"],
  "Numbers": ["Unit-01", "Unit-02", "Unit-03", "Unit-04", "Unit-05", "Unit-06", "Unit-07", "Unit-08"],
  "Colors": ["Red", "Blue", "Green", "Yellow", "Orange", "Purple", "Cyan", "Pink"],
  "Roles": ["Scout", "Guard", "Attack", "Defense", "Support", "Recon", "Striker", "Tank"],
  "Nature": ["Storm", "Thunder", "Lightning", "Blaze", "Frost", "Wind", "Shadow", "Light"]
};

// ============================================================================
// WORD FILTER / MODERATION SYSTEM
// ============================================================================
var bannedWords = [
  "damn", "hell", "crap", "shit", "fuck", "bitch", "ass", "bastard", "piss",
  "nigger", "nigga", "negro", "chink", "gook", "spic", "wetback", "kike", "beaner",
  "kill", "die", "death", "dead", "murder", "suicide", "rape", "molest",
  "hate", "nazi", "hitler", "kkk", "terrorist",
  "sex", "porn", "dick", "cock", "pussy", "vagina", "penis", "boob", "tit",
  "stupid", "dumb", "idiot", "retard", "moron", "loser", "trash", "garbage",
  "cocaine", "heroin", "meth", "weed", "drug"
];

function containsBannedWord(text) {
  if (!text) return false;
  
  var lowerText = text.toLowerCase();
  
  for (var i = 0; i < bannedWords.length; i++) {
    if (lowerText.indexOf(bannedWords[i]) !== -1) {
      return true;
    }
  }
  
  return false;
}

function filterName(name) {
  if (containsBannedWord(name)) {
    return null;
  }
  
  var specialCharCount = 0;
  for (var i = 0; i < name.length; i++) {
    var char = name.charAt(i);
    if (!char.match(/[a-zA-Z0-9\s]/)) {
      specialCharCount++;
    }
  }
  
  if (specialCharCount / name.length > 0.3) {
    return null;
  }
  
  return name;
}

// ============================================================================
// SIMPLE TUTORIAL SYSTEM (FIXED WITH SCROLL & BACK BUTTON)
// ============================================================================

function showTutorialGuide() {
  try {
    var dialog = new BaseDialog("[sky]📚 Unit Namer Guide");
    dialog.cont.margin(15);
    
    var guideText = 
      "[accent]═══ WELCOME TO UNIT NAMER v1.1 ═══[]\n\n" +
      
      "[lime]HOW TO USE:[]\n" +
      "1. [sky]Tap any unit[] on the battlefield\n" +
      "2. A menu will appear with options\n" +
      "3. Choose what you want to do!\n\n" +
      
      "[gold]MAIN FEATURES:[]\n\n" +
      
      "[cyan]✏️ RENAME UNIT[]\n" +
      "• Give your unit a custom name (max 15 chars)\n" +
      "• Names appear above units\n" +
      "• Auto-capitalize available\n\n" +
      
      "[cyan]🎨 CHANGE COLOR[]\n" +
      "• 12 colors available\n" +
      "• Organize squads by color\n" +
      "• Colors: White, Red, Blue, Green, Yellow,\n  Orange, Purple, Cyan, Pink, Lime, Gold, Sky\n\n" +
      
      "[cyan]★ ADD ICON[]\n" +
      "• 16 icons to choose from\n" +
      "• Icons appear before unit name\n" +
      "• Examples: ⚔️ ⚡ ⚙️ ★ ● ■ ▲ ♦\n\n" +
      
      "[cyan]📝 QUICK NAMES[]\n" +
      "• Access recent names\n" +
      "• Use preset templates\n" +
      "• Faster naming for multiple units\n\n" +
      
      "[pink]ADVANCED FEATURES:[]\n\n" +
      
      "[cyan]💾 BACKUPS (3 slots)[]\n" +
      "• Save your entire collection\n" +
      "• Load saved backups\n" +
      "• Found in Settings\n\n" +
      
      "[cyan]📝 NAME PACKS[]\n" +
      "• Military: Alpha, Bravo, Charlie...\n" +
      "• Numbers: Unit-01, Unit-02...\n" +
      "• Colors, Roles, Nature themes\n" +
      "• Browse in Settings\n\n" +
      
      "[cyan]📤 EXPORT/IMPORT[]\n" +
      "• Export collection to clipboard\n" +
      "• Share with friends\n" +
      "• Import from clipboard\n\n" +
      
      "[cyan]⚠️ HEALTH ALERTS[]\n" +
      "• Get notified when named units are low HP\n" +
      "• Threshold: 30% health\n" +
      "• Enable/disable in Settings\n\n" +
      
      "[yellow]SETTINGS OPTIONS:[]\n" +
      "• Enable/Disable mod\n" +
      "• Show only player units\n" +
      "• Auto-capitalize names\n" +
      "• Adjust name size (10-90)\n" +
      "• Health alerts on/off\n\n" +
      
      "[red]⚠️ CONTENT FILTER:[]\n" +
      "• Inappropriate words blocked\n" +
      "• Too many special characters blocked\n" +
      "• Keeps the game family-friendly\n\n" +
      
      "[sky]═══ TIPS & TRICKS ═══[]\n\n" +
      "• Use colors to organize attack/defense squads\n" +
      "• Icons help identify unit roles quickly\n" +
      "• Save backups before major changes\n" +
      "• Export before updating the mod\n" +
      "• Clear All removes everything (be careful!)\n\n" +
      
      "[lime]Ready to start naming your army![]\n" +
      "[gray]Open Settings anytime to customize[]";
    
    // Create scrollable pane
    var pane = new ScrollPane(new Label(guideText));
    pane.setScrollingDisabled(true, false);
    
    dialog.cont.add(pane).width(450).height(500).row();
    
    dialog.cont.add("").padTop(15).row();
    
    // Add Back button
    dialog.cont.button("[lime]Got It!", () => {
      dialog.hide();
      settings.put("unitnamertutorialshown", true);
    }).size(200, 50);
    
    dialog.show();
    
  } catch (e) {
    print("Unit Namer: Tutorial guide error - " + e);
  }
}

// ============================================================================
// UTILITY FUNCTIONS
// ============================================================================

function capitalize(str) {
  if (!str || str.length === 0) return str;
  return str.charAt(0).toUpperCase() + str.slice(1);
}

function validateName(name) {
  if (!name || name.trim() === "") return null;
  
  var cleaned = name.trim();
  
  if (containsBannedWord(cleaned)) {
    ui.showInfoToast("[scarlet]⚠️ Name contains inappropriate content!", 2);
    return null;
  }
  
  var filtered = filterName(cleaned);
  if (!filtered) {
    ui.showInfoToast("[scarlet]⚠️ Name not allowed!", 2);
    return null;
  }
  
  if (autoCapitalize) {
    cleaned = capitalize(cleaned);
  }
  
  if (cleaned.length > MAX_NAME_LENGTH) {
    cleaned = cleaned.substring(0, MAX_NAME_LENGTH);
  }
  
  return cleaned;
}

function getColorFromName(colorName) {
  return colorCache[colorName] || Color.white;
}

function addToHistory(name) {
  try {
    var index = nameHistory.indexOf(name);
    if (index > -1) {
      nameHistory.splice(index, 1);
    }
    nameHistory.unshift(name);
    if (nameHistory.length > 5) {
      nameHistory = nameHistory.slice(0, 5);
    }
  } catch (e) {
    print("Unit Namer: Error adding to history - " + e);
  }
}

// ============================================================================
// DATA PERSISTENCE (FIXED)
// ============================================================================

function loadData() {
  try {
    var savedNames = settings.getString("unit-namer-names", "{}");
    var savedColors = settings.getString("unit-namer-colors", "{}");
    var savedIcons = settings.getString("unit-namer-icons", "{}");
    var savedHistory = settings.getString("unit-namer-history", "[]");
    var savedBackups = settings.getString("unit-namer-backups", "[null,null,null]");
    
    var parsedNames = JSON.parse(savedNames);
    var parsedColors = JSON.parse(savedColors);
    var parsedIcons = JSON.parse(savedIcons);
    nameHistory = JSON.parse(savedHistory);
    backupSlots = JSON.parse(savedBackups);
    
    unitNames.clear();
    unitColors.clear();
    unitIcons.clear();
    
    for (var key in parsedNames) {
      unitNames.put(parseInt(key), parsedNames[key]);
    }
    
    for (var key in parsedColors) {
      unitColors.put(parseInt(key), parsedColors[key]);
    }
    
    for (var key in parsedIcons) {
      unitIcons.put(parseInt(key), parsedIcons[key]);
    }
    
    renamerEnabled = settings.getBool("unitnamerenabled", true);
    nameSize = settings.getInt("unitnamersize", DEFAULT_NAME_SIZE) / 100.0;
    showOnlyPlayerUnits = settings.getBool("unitnameronlyplayer", false);
    showTutorial = settings.getBool("unitnamertutorial", true);
    alertsEnabled = settings.getBool("unitnameralerts", true);
    minimapNamesEnabled = settings.getBool("unitnamerminimap", false);
    autoCapitalize = settings.getBool("unitnamercapitalize", true);
    
    print("Unit Namer v" + VERSION + ": Data loaded successfully - " + unitNames.size() + " units");
  } catch (e) {
    print("Unit Namer: Error loading data - " + e);
    unitNames.clear();
    unitColors.clear();
    unitIcons.clear();
    nameHistory = [];
    backupSlots = [null, null, null];
  }
}

function saveData() {
  try {
    var namesObj = {};
    var colorsObj = {};
    var iconsObj = {};
    
    var it = unitNames.entrySet().iterator();
    while (it.hasNext()) {
      var entry = it.next();
      namesObj[entry.getKey()] = entry.getValue();
    }
    
    var it2 = unitColors.entrySet().iterator();
    while (it2.hasNext()) {
      var entry = it2.next();
      colorsObj[entry.getKey()] = entry.getValue();
    }
    
    var it3 = unitIcons.entrySet().iterator();
    while (it3.hasNext()) {
      var entry = it3.next();
      iconsObj[entry.getKey()] = entry.getValue();
    }
    
    settings.put("unit-namer-names", JSON.stringify(namesObj));
    settings.put("unit-namer-colors", JSON.stringify(colorsObj));
    settings.put("unit-namer-icons", JSON.stringify(iconsObj));
    settings.put("unit-namer-history", JSON.stringify(nameHistory));
    settings.put("unit-namer-backups", JSON.stringify(backupSlots));
    
  } catch (e) {
    print("Unit Namer: Error saving data - " + e);
  }
}// ============================================================================
// BACKUP SYSTEM
// ============================================================================

function createBackup(slotIndex) {
  try {
    var backup = {
      names: {},
      colors: {},
      icons: {},
      timestamp: Date.now(),
      count: unitNames.size()
    };
    
    var it = unitNames.entrySet().iterator();
    while (it.hasNext()) {
      var entry = it.next();
      backup.names[entry.getKey()] = entry.getValue();
    }
    
    var it2 = unitColors.entrySet().iterator();
    while (it2.hasNext()) {
      var entry = it2.next();
      backup.colors[entry.getKey()] = entry.getValue();
    }
    
    var it3 = unitIcons.entrySet().iterator();
    while (it3.hasNext()) {
      var entry = it3.next();
      backup.icons[entry.getKey()] = entry.getValue();
    }
    
    backupSlots[slotIndex] = backup;
    saveData();
    
    return true;
  } catch (e) {
    print("Unit Namer: Backup error - " + e);
    return false;
  }
}

function restoreBackup(slotIndex) {
  try {
    var backup = backupSlots[slotIndex];
    
    if (backup === null || backup === undefined || !backup.names) {
      return false;
    }
    
    unitNames.clear();
    unitColors.clear();
    unitIcons.clear();
    
    for (var key in backup.names) {
      unitNames.put(parseInt(key), backup.names[key]);
    }
    
    for (var key in backup.colors) {
      unitColors.put(parseInt(key), backup.colors[key]);
    }
    
    if (backup.icons) {
      for (var key in backup.icons) {
        unitIcons.put(parseInt(key), backup.icons[key]);
      }
    }
    
    saveData();
    return true;
  } catch (e) {
    print("Unit Namer: Restore error - " + e);
    return false;
  }
}

function getBackupInfo(slotIndex) {
  var backup = backupSlots[slotIndex];
  
  if (backup === null || backup === undefined || !backup.timestamp) {
    return "Empty Slot";
  }
  
  try {
    var date = new Date(backup.timestamp);
    var count = backup.count || 0;
    return count + " names saved";
  } catch (e) {
    return "Empty Slot";
  }
}

// ============================================================================
// ALERT SYSTEM (FIXED)
// ============================================================================

function checkUnitHealth(unit) {
  try {
    if (!alertsEnabled) return;
    if (!unit || !unit.isValid()) return;
    if (!unitNames.containsKey(unit.id)) return;
    
    var healthPercent = (unit.health / unit.maxHealth) * 100;
    
    if (healthPercent <= HEALTH_ALERT_THRESHOLD && !lowHealthAlerted.contains(unit.id)) {
      var name = unitNames.get(unit.id);
      ui.showInfoToast("[scarlet]⚠️ " + name + " low health!", 2);
      lowHealthAlerted.add(unit.id);
      
      Timer.schedule(() => {
        lowHealthAlerted.remove(unit.id);
      }, 10);
    }
  } catch (e) {
    // Silent fail for invalid units
  }
}

// ============================================================================
// EXPORT/IMPORT FUNCTIONS
// ============================================================================

function exportCollection() {
  try {
    var exportData = {
      names: {},
      colors: {},
      icons: {},
      version: VERSION
    };
    
    var it = unitNames.entrySet().iterator();
    while (it.hasNext()) {
      var entry = it.next();
      exportData.names[entry.getKey()] = entry.getValue();
    }
    
    var it2 = unitColors.entrySet().iterator();
    while (it2.hasNext()) {
      var entry = it2.next();
      exportData.colors[entry.getKey()] = entry.getValue();
    }
    
    var it3 = unitIcons.entrySet().iterator();
    while (it3.hasNext()) {
      var entry = it3.next();
      exportData.icons[entry.getKey()] = entry.getValue();
    }
    
    var exportStr = JSON.stringify(exportData);
    Core.app.setClipboardText(exportStr);
    ui.showInfoToast("[lime]📋 Copied to clipboard!", 2);
  } catch (e) {
    ui.showInfoToast("[scarlet]Export failed: " + e, 2);
  }
}

function importCollection() {
  try {
    var clipboardText = Core.app.getClipboardText();
    if (!clipboardText || clipboardText == "") {
      ui.showInfoToast("[scarlet]Clipboard is empty!", 2);
      return;
    }
    
    var importData = JSON.parse(clipboardText);
    
    if (!importData.names || !importData.colors) {
      ui.showInfoToast("[scarlet]Invalid data format!", 2);
      return;
    }
    
    ui.showConfirm("Import Collection", "Add imported names?", () => {
      for (var key in importData.names) {
        unitNames.put(parseInt(key), importData.names[key]);
      }
      
      for (var key in importData.colors) {
        unitColors.put(parseInt(key), importData.colors[key]);
      }
      
      if (importData.icons) {
        for (var key in importData.icons) {
          unitIcons.put(parseInt(key), importData.icons[key]);
        }
      }
      
      saveData();
      ui.showInfoToast("[lime]✅ Imported!", 2);
    });
  } catch (e) {
    ui.showInfoToast("[scarlet]Import failed!", 2);
  }
}

// ============================================================================
// NAME PACKS DIALOG
// ============================================================================

function showNamePacksDialog() {
  try {
    var dialog = new BaseDialog("[sky]📝 Name Packs");
    dialog.cont.margin(10);
    
    dialog.cont.add("[accent]Choose a naming theme").row();
    dialog.cont.add("[gray]These are preset name templates").row();
    dialog.cont.row();
    
    for (var packName in presetNamePacks) {
      (function(pName) {
        dialog.cont.button(pName, () => {
          dialog.hide();
          showPackNamesDialog(pName);
        }).size(BUTTON_WIDTH, BUTTON_HEIGHT);
        dialog.cont.row();
      })(packName);
    }
    
    dialog.cont.row();
    dialog.cont.button("[lightgray]Close", () => {
      dialog.hide();
    }).size(BUTTON_WIDTH, BUTTON_HEIGHT);
    
    dialog.show();
  } catch (e) {
    print("Unit Namer: Name packs error - " + e);
  }
}

function showPackNamesDialog(packName) {
  try {
    var dialog = new BaseDialog("[lime]" + packName + " Pack");
    dialog.cont.margin(10);
    
    dialog.cont.add("[accent]" + packName + " Names").row();
    dialog.cont.add("[gray]Tap to add to quick names").row();
    dialog.cont.row();
    
    var names = presetNamePacks[packName];
    for (var i = 0; i < names.length; i++) {
      var name = names[i];
      (function(n) {
        dialog.cont.button(n, () => {
          if (nameTemplates.indexOf(n) === -1) {
            nameTemplates.push(n);
          }
          addToHistory(n);
          saveData();
          ui.showInfoToast("[lime]Added '" + n + "' to quick names!", 2);
        }).size(BUTTON_WIDTH, BUTTON_HEIGHT);
        dialog.cont.row();
      })(name);
    }
    
    dialog.cont.row();
    dialog.cont.button("[lightgray]Back", () => {
      dialog.hide();
      showNamePacksDialog();
    }).size(BUTTON_WIDTH, BUTTON_HEIGHT);
    
    dialog.show();
  } catch (e) {
    print("Unit Namer: Pack names error - " + e);
  }
}

// ============================================================================
// DIALOG FUNCTIONS (FIXED) - PART 1
// ============================================================================

function showRenameDialog(unit) {
  try {
    if (!unit || !unit.isValid()) return;
    
    var dialog = new BaseDialog("[sky]🏷️ Unit Options");
    dialog.cont.margin(10);
    
    if (unitNames.containsKey(unit.id)) {
      var currentName = unitNames.get(unit.id);
      var currentColor = unitColors.get(unit.id) || "white";
      var currentIcon = unitIcons.get(unit.id) || "none";
      var displayIcon = currentIcon !== "none" ? currentIcon + " " : "";
      dialog.cont.add("[accent]Current: [" + currentColor + "]" + displayIcon + currentName).row();
      dialog.cont.row();
    }
    
    dialog.cont.button("[gold]✏️ Rename Unit", () => {
      dialog.hide();
      askForName(unit);
    }).size(BUTTON_WIDTH, BUTTON_HEIGHT);
    dialog.cont.row();
    
    dialog.cont.button("[cyan]🎨 Change Color", () => {
      dialog.hide();
      showColorPicker(unit);
    }).size(BUTTON_WIDTH, BUTTON_HEIGHT);
    dialog.cont.row();
    
    dialog.cont.button("[pink]★ Add Icon", () => {
      dialog.hide();
      showIconPicker(unit);
    }).size(BUTTON_WIDTH, BUTTON_HEIGHT);
    dialog.cont.row();
    
    dialog.cont.button("[lime]📝 Quick Names", () => {
      dialog.hide();
      showQuickNames(unit);
    }).size(BUTTON_WIDTH, BUTTON_HEIGHT);
    dialog.cont.row();
    
    if (unitNames.containsKey(unit.id)) {
      dialog.cont.button("[scarlet]❌ Clear Name", () => {
        unitNames.remove(unit.id);
        unitColors.remove(unit.id);
        unitIcons.remove(unit.id);
        saveData();
        ui.showInfoToast("[scarlet]Name cleared!", 2);
        dialog.hide();
      }).size(BUTTON_WIDTH, BUTTON_HEIGHT);
      dialog.cont.row();
    }
    
    dialog.cont.button("[lightgray]Close", () => {
      dialog.hide();
    }).size(BUTTON_WIDTH, BUTTON_HEIGHT);
    
    dialog.show();
  } catch (e) {
    print("Unit Namer: Dialog error - " + e);
  }
}

function askForName(unit) {
  try {
    if (!unit || !unit.isValid()) return;
    
    var currentName = unitNames.containsKey(unit.id) ? unitNames.get(unit.id) : "";
    
    ui.showTextInput("✏️ Rename Unit", "Name (max " + MAX_NAME_LENGTH + " chars)", MAX_NAME_LENGTH, currentName, text => {
      var validated = validateName(text);
      
      if (validated) {
        unitNames.put(unit.id, validated);
        
        if (!unitColors.containsKey(unit.id)) {
          unitColors.put(unit.id, "white");
        }
        
        addToHistory(validated);
        saveData();
        ui.showInfoToast("[sky]✨ Renamed: [accent]" + validated, 2);
      } else if (text && text.trim() !== "") {
        // Error already shown by validateName
      } else {
        ui.showInfoToast("[scarlet]Name cannot be empty!", 2);
      }
    });
  } catch (e) {
    print("Unit Namer: Name input error - " + e);
  }
}

function showColorPicker(unit) {
  try {
    if (!unit || !unit.isValid()) return;
    
    var dialog = new BaseDialog("[sky]🎨 Choose Color");
    dialog.cont.margin(10);
    
    if (unitNames.containsKey(unit.id)) {
      var currentName = unitNames.get(unit.id);
      var currentColor = unitColors.get(unit.id) || "white";
      dialog.cont.add("[accent]Preview: [" + currentColor + "]" + currentName).colspan(2).row();
      dialog.cont.row();
    }
    
    var colors = [
      ["white", "White"],
      ["red", "Red"],
      ["blue", "Blue"],
      ["green", "Green"],
      ["yellow", "Yellow"],
      ["orange", "Orange"],
      ["purple", "Purple"],
      ["cyan", "Cyan"],
      ["pink", "Pink"],
      ["lime", "Lime"],
      ["gold", "Gold"],
      ["sky", "Sky"]
    ];
    
    for (var i = 0; i < colors.length; i++) {
      var colorData = colors[i];
      var colorName = colorData[0];
      var displayName = colorData[1];
      
      (function(cName, dName) {
        dialog.cont.button("[" + cName + "]● " + dName, () => {
          if (unit && unit.isValid()) {
            unitColors.put(unit.id, cName);
            saveData();
            ui.showInfoToast("[" + cName + "]✨ " + dName, 2);
          }
          dialog.hide();
        }).size(BUTTON_WIDTH, BUTTON_HEIGHT);
      })(colorName, displayName);
      
      if ((i + 1) % 2 == 0) {
        dialog.cont.row();
      }
    }
    
    dialog.cont.row();
    dialog.cont.button("[lightgray]Cancel", () => {
      dialog.hide();
    }).size(BUTTON_WIDTH, BUTTON_HEIGHT);
    
    dialog.show();
  } catch (e) {
    print("Unit Namer: Color picker error - " + e);
  }
}

function showIconPicker(unit) {
  try {
    if (!unit || !unit.isValid()) return;
    
    var dialog = new BaseDialog("[pink]★ Choose Icon");
    dialog.cont.margin(10);
    
    dialog.cont.add("[accent]Select an icon").row();
    dialog.cont.add("[gray]Only these work in Mindustry").row();
    dialog.cont.row();
    
    for (var i = 0; i < iconsList.length; i++) {
      var iconData = iconsList[i];
      var iconValue = iconData[0];
      var iconName = iconData[1];
      
      (function(iValue, iName) {
        var displayText = iValue === "none" ? "[gray]" + iName : iValue + " " + iName;
        dialog.cont.button(displayText, () => {
          if (unit && unit.isValid()) {
            unitIcons.put(unit.id, iValue);
            saveData();
            ui.showInfoToast("[lime]✨ Icon: " + iName, 2);
          }
          dialog.hide();
        }).size(BUTTON_WIDTH, BUTTON_HEIGHT);
      })(iconValue, iconName);
      
      if ((i + 1) % 2 == 0) {
        dialog.cont.row();
      }
    }
    
    dialog.cont.row();
    dialog.cont.button("[lightgray]Cancel", () => {
      dialog.hide();
    }).size(BUTTON_WIDTH, BUTTON_HEIGHT);
    
    dialog.show();
  } catch (e) {
    print("Unit Namer: Icon picker error - " + e);
  }
}

function showQuickNames(unit) {
  try {
    if (!unit || !unit.isValid()) return;
    
    var dialog = new BaseDialog("[lime]📝 Quick Names");
    dialog.cont.margin(10);
    
    if (nameHistory.length > 0) {
      dialog.cont.add("[accent]Recent Names:").left().row();
      
      for (var i = 0; i < nameHistory.length; i++) {
        var histName = nameHistory[i];
        (function(hName) {
          dialog.cont.button(hName, () => {
            if (unit && unit.isValid()) {
              unitNames.put(unit.id, hName);
              if (!unitColors.containsKey(unit.id)) {
                unitColors.put(unit.id, "white");
              }
              saveData();
              ui.showInfoToast("[sky]✨ Named: " + hName, 2);
            }
            dialog.hide();
          }).size(BUTTON_WIDTH, BUTTON_HEIGHT);
        })(histName);
        dialog.cont.row();
      }
      
      dialog.cont.row();
      dialog.cont.add("[gray]───────").row();
    }
    
    dialog.cont.add("[accent]Templates:").left().row();
    
    for (var i = 0; i < Math.min(5, nameTemplates.length); i++) {
      var template = nameTemplates[i];
      (function(tmpl) {
        dialog.cont.button(tmpl, () => {
          if (unit && unit.isValid()) {
            unitNames.put(unit.id, tmpl);
            if (!unitColors.containsKey(unit.id)) {
              unitColors.put(unit.id, "white");
            }
            addToHistory(tmpl);
            saveData();
            ui.showInfoToast("[sky]✨ Named: " + tmpl, 2);
          }
          dialog.hide();
        }).size(BUTTON_WIDTH, BUTTON_HEIGHT);
      })(template);
      dialog.cont.row();
    }
    
    dialog.cont.row();
    dialog.cont.button("[lightgray]Back", () => {
      dialog.hide();
      showRenameDialog(unit);
    }).size(BUTTON_WIDTH, BUTTON_HEIGHT);
    
    dialog.show();
  } catch (e) {
    print("Unit Namer: Quick names error - " + e);
  }
}// ============================================================================
// MAIN EVENT HANDLERS (FIXED)
// ============================================================================

Events.on(ClientLoadEvent, () => {
  loadData();
  
  ui.showInfoToast("[sky]✨ Unit Namer v" + VERSION + " loaded!", 2);
  
  // Show tutorial guide on first launch
  var hasSeenGuide = settings.getBool("unitnamertutorialshown", false);
  if (showTutorial && !hasSeenGuide) {
    Timer.schedule(() => {
      showTutorialGuide();
    }, 2);
  }
  
  // ============================================================================
  // SETTINGS MENU
  // ============================================================================
  
  ui.settings.addCategory("Unit Namer", Icon.edit, table => {
    table.checkPref("unitnamerenabled", true, val => {
      renamerEnabled = val;
      ui.showInfoToast(val ? "[lime]✅ Enabled!" : "[scarlet]❌ Disabled!", 2);
    });
    table.row();
    
    table.checkPref("unitnameronlyplayer", false, val => {
      showOnlyPlayerUnits = val;
    });
    table.row();
    
    table.checkPref("unitnamercapitalize", true, val => {
      autoCapitalize = val;
    });
    table.row();
    
    table.checkPref("unitnameralerts", true, val => {
      alertsEnabled = val;
    });
    table.row();
    
    table.checkPref("unitnamertutorial", true, val => {
      showTutorial = val;
    });
    table.row();
    
    table.sliderPref("unitnamersize", DEFAULT_NAME_SIZE, MIN_NAME_SIZE, MAX_NAME_SIZE, 5, val => {
      nameSize = val / 100.0;
    });
    table.row();
    
    table.add("[lightgray]Name size (10-90)").left().padTop(5);
    table.row();
    
    table.button("📚 Show Guide", () => {
      showTutorialGuide();
    }).size(BUTTON_WIDTH, BUTTON_HEIGHT).padTop(10);
    table.row();
    
    table.add("[accent]═══ Backup System ═══").padTop(20);
    table.row();
    
    for (var i = 0; i < MAX_BACKUP_SLOTS; i++) {
      (function(slot) {
        var info = getBackupInfo(slot);
        
        table.button("💾 Save " + (slot + 1), () => {
          ui.showConfirm("Save Backup", "Save to slot " + (slot + 1) + "?", () => {
            if (createBackup(slot)) {
              ui.showInfoToast("[lime]✅ Backup saved!", 2);
            } else {
              ui.showInfoToast("[scarlet]❌ Save failed!", 2);
            }
          });
        }).size(BUTTON_WIDTH / 2 - 5, BUTTON_HEIGHT);
        
        table.button("📂 Load", () => {
          var currentInfo = getBackupInfo(slot);
          if (currentInfo === "Empty Slot") {
            ui.showInfoToast("[scarlet]Slot " + (slot + 1) + " is empty!", 2);
            return;
          }
          
          ui.showConfirm("Load Backup", "Load from slot " + (slot + 1) + "?", () => {
            if (restoreBackup(slot)) {
              ui.showInfoToast("[lime]✅ Backup loaded!", 2);
            } else {
              ui.showInfoToast("[scarlet]❌ Load failed!", 2);
            }
          });
        }).size(BUTTON_WIDTH / 2 - 5, BUTTON_HEIGHT);
        
        table.row();
        table.add("[gray]" + info).colspan(2).left();
        table.row();
      })(i);
    }
    
    table.add("[accent]═══ Name Packs ═══").padTop(20);
    table.row();
    
    table.button("📝 Browse Name Packs", () => {
      showNamePacksDialog();
    }).size(BUTTON_WIDTH, BUTTON_HEIGHT).padTop(10);
    table.row();
    
    table.button("📤 Export Collection", () => {
      exportCollection();
    }).size(BUTTON_WIDTH, BUTTON_HEIGHT).padTop(5);
    table.row();
    
    table.button("📥 Import Collection", () => {
      importCollection();
    }).size(BUTTON_WIDTH, BUTTON_HEIGHT).padTop(5);
    table.row();
    
    table.button("🗑️ Clear All Names", () => {
      ui.showConfirm("⚠️ Clear Everything?", "Delete all unit names?", () => {
        unitNames.clear();
        unitColors.clear();
        unitIcons.clear();
        nameHistory = [];
        saveData();
        ui.showInfoToast("[scarlet]🗑️ All cleared!", 2);
      });
    }).size(BUTTON_WIDTH, BUTTON_HEIGHT).padTop(20);
  });
  
  // ============================================================================
  // UPDATE LOOP (FIXED)
  // ============================================================================
  
  var lastTapped = null;
  var canShowDialog = true;
  var lastDialogTime = 0;
  
  Events.run(Trigger.update, () => {
    try {
      if (!renamerEnabled) return;
      
      var input = Vars.control.input;
      var currentTime = Time.millis() / 1000.0;
      
      if (input.unitTapped != null && canShowDialog && (currentTime - lastDialogTime) > DIALOG_COOLDOWN) {
        var tappedUnit = input.unitTapped;
        
        if (showOnlyPlayerUnits && tappedUnit.team != Vars.player.team()) {
          input.unitTapped = null;
          return;
        }
        
        if (tappedUnit && tappedUnit.isValid()) {
          lastTapped = tappedUnit;
          canShowDialog = false;
          lastDialogTime = currentTime;
          
          ui.showInfoToast("[sky]Selected: " + tappedUnit.type.name, 1);
          showRenameDialog(lastTapped);
          
          Timer.schedule(() => {
            canShowDialog = true;
          }, DIALOG_COOLDOWN);
        }
        
        input.unitTapped = null;
      }
      
      if (alertsEnabled) {
        Groups.unit.each(unit => {
          if (unit && unit.isValid()) {
            checkUnitHealth(unit);
          }
        });
      }
      
    } catch (e) {
      print("Unit Namer: Update error - " + e);
    }
  });
});

// ============================================================================
// DRAW LOOP (FIXED)
// ============================================================================

Events.on(EventType.WorldLoadEvent, () => {
  Timer.schedule(() => {
    Events.run(Trigger.draw, () => {
      try {
        if (!renamerEnabled) return;
        
        Groups.unit.each(unit => {
          try {
            if (!unit || !unit.isValid()) return;
            if (!unitNames.containsKey(unit.id)) return;
            if (showOnlyPlayerUnits && unit.team != Vars.player.team()) return;
            
            var name = unitNames.get(unit.id);
            var colorName = unitColors.get(unit.id) || "white";
            var icon = unitIcons.get(unit.id) || "none";
            
            var font = Fonts.outline;
            var color = getColorFromName(colorName);
            
            Draw.z(Layer.overlayUI);
            
            font.setColor(color);
            font.getData().setScale(nameSize);
            
            var displayText = icon !== "none" ? icon + " " + name : name;
            font.draw(displayText, unit.x, unit.y + NAME_Y_OFFSET, Align.center);
            
            font.getData().setScale(1);
            font.setColor(Color.white);
          } catch (e) {
            // Silent fail for individual units
          }
        });
        
      } catch (e) {
        print("Unit Namer: Draw error - " + e);
      }
    });
  }, 0.1);
});

// ============================================================================
// AUTO-SAVE
// ============================================================================

Timer.schedule(() => {
  saveData();
}, AUTO_SAVE_INTERVAL, AUTO_SAVE_INTERVAL);

print("Unit Namer v" + VERSION + " initialized successfully!");