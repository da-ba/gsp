/**
 * Emoji API and data
 */

import { getStorageValue, setStorageValue } from "../../../utils/storage.ts";

// Storage key for recently used emojis
const STORAGE_KEY_RECENT_EMOJIS = "recentEmojis";

/** Maximum number of recently used emojis to store */
const MAX_RECENT_EMOJIS = 16;

/** Emoji category type */
export type EmojiCategory =
  | "smileys"
  | "people"
  | "nature"
  | "food"
  | "activities"
  | "travel"
  | "objects"
  | "symbols";

/** Emoji item */
export type EmojiItem = {
  emoji: string;
  name: string;
  keywords: string[];
  category: EmojiCategory;
};

/** Category display labels */
export const CATEGORY_LABELS: Record<EmojiCategory, string> = {
  smileys: "Smileys",
  people: "People",
  nature: "Nature",
  food: "Food",
  activities: "Activities",
  travel: "Travel",
  objects: "Objects",
  symbols: "Symbols",
};

/** Emoji data - a curated set of commonly used emojis */
export const EMOJIS: EmojiItem[] = [
  // Smileys
  { emoji: "😀", name: "grinning face", keywords: ["happy", "smile", "joy"], category: "smileys" },
  {
    emoji: "😃",
    name: "grinning face with big eyes",
    keywords: ["happy", "smile"],
    category: "smileys",
  },
  {
    emoji: "😄",
    name: "grinning face with smiling eyes",
    keywords: ["happy", "smile", "laugh"],
    category: "smileys",
  },
  { emoji: "😁", name: "beaming face", keywords: ["smile", "grin"], category: "smileys" },
  {
    emoji: "😅",
    name: "grinning face with sweat",
    keywords: ["awkward", "nervous", "laugh"],
    category: "smileys",
  },
  {
    emoji: "😂",
    name: "face with tears of joy",
    keywords: ["laugh", "lol", "funny", "cry"],
    category: "smileys",
  },
  {
    emoji: "🤣",
    name: "rolling on the floor laughing",
    keywords: ["laugh", "lol", "rofl"],
    category: "smileys",
  },
  {
    emoji: "😊",
    name: "smiling face with smiling eyes",
    keywords: ["happy", "blush", "shy"],
    category: "smileys",
  },
  {
    emoji: "😇",
    name: "smiling face with halo",
    keywords: ["angel", "innocent"],
    category: "smileys",
  },
  {
    emoji: "🥰",
    name: "smiling face with hearts",
    keywords: ["love", "adore"],
    category: "smileys",
  },
  { emoji: "😍", name: "heart eyes", keywords: ["love", "crush", "adore"], category: "smileys" },
  {
    emoji: "🤩",
    name: "star struck",
    keywords: ["excited", "wow", "amazing"],
    category: "smileys",
  },
  { emoji: "😘", name: "blowing kiss", keywords: ["kiss", "love", "flirt"], category: "smileys" },
  {
    emoji: "😋",
    name: "face savoring food",
    keywords: ["yum", "delicious", "tasty"],
    category: "smileys",
  },
  {
    emoji: "😜",
    name: "winking face with tongue",
    keywords: ["playful", "joke", "silly"],
    category: "smileys",
  },
  { emoji: "🤪", name: "zany face", keywords: ["crazy", "wild", "silly"], category: "smileys" },
  {
    emoji: "😎",
    name: "smiling face with sunglasses",
    keywords: ["cool", "confident"],
    category: "smileys",
  },
  { emoji: "🤓", name: "nerd face", keywords: ["geek", "smart", "glasses"], category: "smileys" },
  {
    emoji: "🧐",
    name: "face with monocle",
    keywords: ["thinking", "curious"],
    category: "smileys",
  },
  {
    emoji: "🤔",
    name: "thinking face",
    keywords: ["think", "hmm", "consider"],
    category: "smileys",
  },
  { emoji: "🤫", name: "shushing face", keywords: ["quiet", "secret", "shh"], category: "smileys" },
  { emoji: "😏", name: "smirking face", keywords: ["smug", "sly"], category: "smileys" },
  { emoji: "😐", name: "neutral face", keywords: ["meh", "indifferent"], category: "smileys" },
  {
    emoji: "😑",
    name: "expressionless face",
    keywords: ["blank", "unimpressed"],
    category: "smileys",
  },
  {
    emoji: "😶",
    name: "face without mouth",
    keywords: ["silent", "speechless"],
    category: "smileys",
  },
  { emoji: "🙄", name: "rolling eyes", keywords: ["annoyed", "sarcasm"], category: "smileys" },
  { emoji: "😔", name: "pensive face", keywords: ["sad", "disappointed"], category: "smileys" },
  { emoji: "😢", name: "crying face", keywords: ["sad", "cry", "upset"], category: "smileys" },
  { emoji: "😭", name: "loudly crying face", keywords: ["cry", "sob", "sad"], category: "smileys" },
  {
    emoji: "😱",
    name: "face screaming in fear",
    keywords: ["scared", "shock", "horror"],
    category: "smileys",
  },
  {
    emoji: "😤",
    name: "face with steam from nose",
    keywords: ["angry", "frustrated"],
    category: "smileys",
  },
  { emoji: "😡", name: "pouting face", keywords: ["angry", "mad", "rage"], category: "smileys" },
  { emoji: "🤯", name: "exploding head", keywords: ["mind blown", "shocked"], category: "smileys" },
  { emoji: "🥳", name: "partying face", keywords: ["party", "celebrate"], category: "smileys" },
  {
    emoji: "🥺",
    name: "pleading face",
    keywords: ["puppy eyes", "please", "cute"],
    category: "smileys",
  },
  { emoji: "😴", name: "sleeping face", keywords: ["sleep", "tired", "zzz"], category: "smileys" },
  {
    emoji: "🤮",
    name: "vomiting face",
    keywords: ["sick", "gross", "disgusted"],
    category: "smileys",
  },
  { emoji: "🤧", name: "sneezing face", keywords: ["sick", "cold", "achoo"], category: "smileys" },
  {
    emoji: "😷",
    name: "face with medical mask",
    keywords: ["sick", "mask", "covid"],
    category: "smileys",
  },

  // People & Gestures
  {
    emoji: "👍",
    name: "thumbs up",
    keywords: ["yes", "ok", "good", "approve", "like"],
    category: "people",
  },
  {
    emoji: "👎",
    name: "thumbs down",
    keywords: ["no", "bad", "dislike", "disapprove"],
    category: "people",
  },
  {
    emoji: "👏",
    name: "clapping hands",
    keywords: ["applause", "congrats", "bravo"],
    category: "people",
  },
  {
    emoji: "🙌",
    name: "raising hands",
    keywords: ["hooray", "celebrate", "yay"],
    category: "people",
  },
  { emoji: "🤝", name: "handshake", keywords: ["deal", "agree", "meeting"], category: "people" },
  { emoji: "🙏", name: "folded hands", keywords: ["please", "pray", "thanks"], category: "people" },
  {
    emoji: "💪",
    name: "flexed biceps",
    keywords: ["strong", "muscle", "power"],
    category: "people",
  },
  { emoji: "👋", name: "waving hand", keywords: ["hello", "bye", "wave"], category: "people" },
  { emoji: "✋", name: "raised hand", keywords: ["stop", "high five"], category: "people" },
  {
    emoji: "🖐️",
    name: "hand with fingers splayed",
    keywords: ["five", "palm"],
    category: "people",
  },
  { emoji: "👌", name: "ok hand", keywords: ["perfect", "ok", "fine"], category: "people" },
  { emoji: "✌️", name: "victory hand", keywords: ["peace", "v", "two"], category: "people" },
  { emoji: "🤞", name: "crossed fingers", keywords: ["luck", "hope"], category: "people" },
  { emoji: "🤟", name: "love you gesture", keywords: ["love", "rock"], category: "people" },
  { emoji: "👆", name: "pointing up", keywords: ["up", "point"], category: "people" },
  { emoji: "👇", name: "pointing down", keywords: ["down", "point"], category: "people" },
  { emoji: "👈", name: "pointing left", keywords: ["left", "point"], category: "people" },
  { emoji: "👉", name: "pointing right", keywords: ["right", "point"], category: "people" },
  { emoji: "👀", name: "eyes", keywords: ["look", "see", "watch"], category: "people" },
  { emoji: "🧠", name: "brain", keywords: ["smart", "think", "mind"], category: "people" },
  { emoji: "💀", name: "skull", keywords: ["dead", "death", "skeleton"], category: "people" },
  { emoji: "👻", name: "ghost", keywords: ["halloween", "spooky", "boo"], category: "people" },

  // Nature & Animals
  { emoji: "🐶", name: "dog face", keywords: ["puppy", "pet", "cute"], category: "nature" },
  { emoji: "🐱", name: "cat face", keywords: ["kitten", "pet", "meow"], category: "nature" },
  { emoji: "🐭", name: "mouse face", keywords: ["animal", "rodent"], category: "nature" },
  { emoji: "🐹", name: "hamster", keywords: ["pet", "cute", "rodent"], category: "nature" },
  { emoji: "🐰", name: "rabbit face", keywords: ["bunny", "pet", "easter"], category: "nature" },
  { emoji: "🦊", name: "fox", keywords: ["animal", "clever"], category: "nature" },
  { emoji: "🐻", name: "bear", keywords: ["animal", "teddy"], category: "nature" },
  { emoji: "🐼", name: "panda", keywords: ["animal", "cute", "china"], category: "nature" },
  { emoji: "🐨", name: "koala", keywords: ["animal", "australia"], category: "nature" },
  { emoji: "🦁", name: "lion", keywords: ["king", "animal", "roar"], category: "nature" },
  { emoji: "🐮", name: "cow face", keywords: ["moo", "animal", "farm"], category: "nature" },
  { emoji: "🐷", name: "pig face", keywords: ["oink", "animal", "farm"], category: "nature" },
  { emoji: "🐸", name: "frog", keywords: ["animal", "croak", "toad"], category: "nature" },
  { emoji: "🐵", name: "monkey face", keywords: ["animal", "ape"], category: "nature" },
  {
    emoji: "🙈",
    name: "see-no-evil monkey",
    keywords: ["shy", "hide", "embarrassed"],
    category: "nature",
  },
  {
    emoji: "🙉",
    name: "hear-no-evil monkey",
    keywords: ["ignore", "not listening"],
    category: "nature",
  },
  {
    emoji: "🙊",
    name: "speak-no-evil monkey",
    keywords: ["secret", "oops", "quiet"],
    category: "nature",
  },
  { emoji: "🐔", name: "chicken", keywords: ["bird", "farm", "cluck"], category: "nature" },
  { emoji: "🦆", name: "duck", keywords: ["bird", "quack"], category: "nature" },
  { emoji: "🦅", name: "eagle", keywords: ["bird", "america", "fly"], category: "nature" },
  { emoji: "🦉", name: "owl", keywords: ["bird", "night", "wise"], category: "nature" },
  { emoji: "🐝", name: "bee", keywords: ["insect", "honey", "buzz"], category: "nature" },
  { emoji: "🦋", name: "butterfly", keywords: ["insect", "pretty", "fly"], category: "nature" },
  { emoji: "🐛", name: "bug", keywords: ["insect", "caterpillar"], category: "nature" },
  { emoji: "🐌", name: "snail", keywords: ["slow", "animal"], category: "nature" },
  { emoji: "🐙", name: "octopus", keywords: ["sea", "animal", "tentacle"], category: "nature" },
  { emoji: "🦀", name: "crab", keywords: ["sea", "animal", "beach"], category: "nature" },
  { emoji: "🐠", name: "tropical fish", keywords: ["sea", "animal", "swim"], category: "nature" },
  { emoji: "🐳", name: "whale", keywords: ["sea", "animal", "ocean"], category: "nature" },
  { emoji: "🐬", name: "dolphin", keywords: ["sea", "animal", "smart"], category: "nature" },
  { emoji: "🦈", name: "shark", keywords: ["sea", "animal", "scary"], category: "nature" },
  { emoji: "🐍", name: "snake", keywords: ["reptile", "hiss"], category: "nature" },
  { emoji: "🦎", name: "lizard", keywords: ["reptile", "gecko"], category: "nature" },
  { emoji: "🐢", name: "turtle", keywords: ["slow", "shell", "reptile"], category: "nature" },
  { emoji: "🦖", name: "dinosaur", keywords: ["extinct", "t-rex", "jurassic"], category: "nature" },
  { emoji: "🐉", name: "dragon", keywords: ["mythical", "fire", "fantasy"], category: "nature" },
  {
    emoji: "🌸",
    name: "cherry blossom",
    keywords: ["flower", "spring", "pink"],
    category: "nature",
  },
  { emoji: "🌹", name: "rose", keywords: ["flower", "love", "red"], category: "nature" },
  { emoji: "🌻", name: "sunflower", keywords: ["flower", "yellow", "summer"], category: "nature" },
  {
    emoji: "🌲",
    name: "evergreen tree",
    keywords: ["tree", "nature", "christmas"],
    category: "nature",
  },
  {
    emoji: "🌳",
    name: "deciduous tree",
    keywords: ["tree", "nature", "green"],
    category: "nature",
  },
  {
    emoji: "🌴",
    name: "palm tree",
    keywords: ["tropical", "beach", "vacation"],
    category: "nature",
  },
  {
    emoji: "🍀",
    name: "four leaf clover",
    keywords: ["luck", "lucky", "irish"],
    category: "nature",
  },
  { emoji: "🔥", name: "fire", keywords: ["hot", "flame", "lit"], category: "nature" },
  { emoji: "💧", name: "water droplet", keywords: ["water", "wet", "rain"], category: "nature" },
  { emoji: "⭐", name: "star", keywords: ["night", "sky", "favorite"], category: "nature" },
  { emoji: "🌙", name: "crescent moon", keywords: ["night", "sky", "sleep"], category: "nature" },
  { emoji: "☀️", name: "sun", keywords: ["sunny", "bright", "warm"], category: "nature" },
  { emoji: "🌈", name: "rainbow", keywords: ["colorful", "pride", "weather"], category: "nature" },
  { emoji: "❄️", name: "snowflake", keywords: ["cold", "winter", "snow"], category: "nature" },
  { emoji: "⚡", name: "lightning", keywords: ["electric", "thunder", "fast"], category: "nature" },

  // Food & Drink
  { emoji: "🍎", name: "red apple", keywords: ["fruit", "healthy"], category: "food" },
  { emoji: "🍐", name: "pear", keywords: ["fruit", "green"], category: "food" },
  { emoji: "🍊", name: "orange", keywords: ["fruit", "citrus"], category: "food" },
  { emoji: "🍋", name: "lemon", keywords: ["fruit", "citrus", "sour"], category: "food" },
  { emoji: "🍌", name: "banana", keywords: ["fruit", "yellow"], category: "food" },
  { emoji: "🍉", name: "watermelon", keywords: ["fruit", "summer"], category: "food" },
  { emoji: "🍇", name: "grapes", keywords: ["fruit", "wine"], category: "food" },
  { emoji: "🍓", name: "strawberry", keywords: ["fruit", "berry"], category: "food" },
  { emoji: "🍒", name: "cherries", keywords: ["fruit", "red"], category: "food" },
  { emoji: "🍑", name: "peach", keywords: ["fruit", "butt"], category: "food" },
  { emoji: "🥑", name: "avocado", keywords: ["fruit", "guac", "healthy"], category: "food" },
  { emoji: "🥕", name: "carrot", keywords: ["vegetable", "orange"], category: "food" },
  { emoji: "🌽", name: "corn", keywords: ["vegetable", "maize"], category: "food" },
  { emoji: "🥔", name: "potato", keywords: ["vegetable", "fries"], category: "food" },
  { emoji: "🍔", name: "hamburger", keywords: ["burger", "fast food", "meat"], category: "food" },
  {
    emoji: "🍟",
    name: "french fries",
    keywords: ["fries", "fast food", "potato"],
    category: "food",
  },
  { emoji: "🍕", name: "pizza", keywords: ["italian", "cheese", "slice"], category: "food" },
  { emoji: "🌭", name: "hot dog", keywords: ["sausage", "fast food"], category: "food" },
  { emoji: "🌮", name: "taco", keywords: ["mexican", "food"], category: "food" },
  { emoji: "🌯", name: "burrito", keywords: ["mexican", "wrap"], category: "food" },
  { emoji: "🍿", name: "popcorn", keywords: ["movie", "snack"], category: "food" },
  { emoji: "🍩", name: "donut", keywords: ["sweet", "dessert"], category: "food" },
  { emoji: "🍪", name: "cookie", keywords: ["sweet", "snack", "dessert"], category: "food" },
  { emoji: "🍰", name: "cake", keywords: ["dessert", "birthday", "sweet"], category: "food" },
  {
    emoji: "🎂",
    name: "birthday cake",
    keywords: ["birthday", "celebration", "party"],
    category: "food",
  },
  { emoji: "🍫", name: "chocolate bar", keywords: ["candy", "sweet", "dessert"], category: "food" },
  { emoji: "🍦", name: "ice cream", keywords: ["dessert", "cold", "sweet"], category: "food" },
  { emoji: "☕", name: "coffee", keywords: ["drink", "hot", "caffeine"], category: "food" },
  { emoji: "🍵", name: "tea", keywords: ["drink", "hot", "green"], category: "food" },
  { emoji: "🍺", name: "beer", keywords: ["drink", "alcohol", "bar"], category: "food" },
  { emoji: "🍷", name: "wine", keywords: ["drink", "alcohol", "red"], category: "food" },
  { emoji: "🥤", name: "cup with straw", keywords: ["drink", "soda", "juice"], category: "food" },

  // Activities & Sports
  {
    emoji: "⚽",
    name: "soccer ball",
    keywords: ["football", "sport", "game"],
    category: "activities",
  },
  { emoji: "🏀", name: "basketball", keywords: ["sport", "nba", "ball"], category: "activities" },
  {
    emoji: "🏈",
    name: "american football",
    keywords: ["sport", "nfl", "ball"],
    category: "activities",
  },
  { emoji: "⚾", name: "baseball", keywords: ["sport", "mlb", "ball"], category: "activities" },
  { emoji: "🎾", name: "tennis", keywords: ["sport", "ball", "racket"], category: "activities" },
  { emoji: "🏐", name: "volleyball", keywords: ["sport", "ball", "beach"], category: "activities" },
  { emoji: "🎱", name: "pool 8 ball", keywords: ["billiards", "game"], category: "activities" },
  { emoji: "🏓", name: "ping pong", keywords: ["table tennis", "sport"], category: "activities" },
  { emoji: "🎯", name: "bullseye", keywords: ["target", "dart", "goal"], category: "activities" },
  {
    emoji: "🎮",
    name: "video game",
    keywords: ["gaming", "controller", "play"],
    category: "activities",
  },
  { emoji: "🕹️", name: "joystick", keywords: ["game", "arcade", "retro"], category: "activities" },
  { emoji: "🎲", name: "dice", keywords: ["game", "luck", "random"], category: "activities" },
  {
    emoji: "♟️",
    name: "chess pawn",
    keywords: ["game", "strategy", "board"],
    category: "activities",
  },
  {
    emoji: "🎨",
    name: "artist palette",
    keywords: ["art", "paint", "creative"],
    category: "activities",
  },
  {
    emoji: "🎬",
    name: "clapper board",
    keywords: ["movie", "film", "action"],
    category: "activities",
  },
  {
    emoji: "🎤",
    name: "microphone",
    keywords: ["sing", "karaoke", "music"],
    category: "activities",
  },
  {
    emoji: "🎸",
    name: "guitar",
    keywords: ["music", "rock", "instrument"],
    category: "activities",
  },
  {
    emoji: "🎹",
    name: "piano",
    keywords: ["music", "keyboard", "instrument"],
    category: "activities",
  },
  {
    emoji: "🎺",
    name: "trumpet",
    keywords: ["music", "brass", "instrument"],
    category: "activities",
  },
  {
    emoji: "🎻",
    name: "violin",
    keywords: ["music", "string", "instrument"],
    category: "activities",
  },
  { emoji: "🏆", name: "trophy", keywords: ["win", "champion", "prize"], category: "activities" },
  {
    emoji: "🥇",
    name: "gold medal",
    keywords: ["first", "winner", "champion"],
    category: "activities",
  },
  { emoji: "🥈", name: "silver medal", keywords: ["second", "runner up"], category: "activities" },
  { emoji: "🥉", name: "bronze medal", keywords: ["third", "place"], category: "activities" },
  {
    emoji: "🎪",
    name: "circus tent",
    keywords: ["show", "carnival", "event"],
    category: "activities",
  },
  {
    emoji: "🎭",
    name: "performing arts",
    keywords: ["theater", "drama", "masks"],
    category: "activities",
  },

  // Travel & Places
  { emoji: "🚗", name: "car", keywords: ["auto", "vehicle", "drive"], category: "travel" },
  { emoji: "🚕", name: "taxi", keywords: ["cab", "car", "ride"], category: "travel" },
  { emoji: "🚌", name: "bus", keywords: ["vehicle", "transit", "transport"], category: "travel" },
  {
    emoji: "🚑",
    name: "ambulance",
    keywords: ["emergency", "hospital", "medical"],
    category: "travel",
  },
  {
    emoji: "🚒",
    name: "fire engine",
    keywords: ["emergency", "fire", "truck"],
    category: "travel",
  },
  { emoji: "🚓", name: "police car", keywords: ["cop", "emergency", "law"], category: "travel" },
  { emoji: "🚲", name: "bicycle", keywords: ["bike", "cycle", "ride"], category: "travel" },
  { emoji: "✈️", name: "airplane", keywords: ["fly", "travel", "flight"], category: "travel" },
  { emoji: "🚀", name: "rocket", keywords: ["space", "launch", "fast"], category: "travel" },
  { emoji: "🛸", name: "flying saucer", keywords: ["ufo", "alien", "space"], category: "travel" },
  { emoji: "🚢", name: "ship", keywords: ["boat", "cruise", "ocean"], category: "travel" },
  { emoji: "⛵", name: "sailboat", keywords: ["boat", "sail", "sea"], category: "travel" },
  { emoji: "🗼", name: "tokyo tower", keywords: ["japan", "landmark"], category: "travel" },
  {
    emoji: "🗽",
    name: "statue of liberty",
    keywords: ["usa", "nyc", "landmark"],
    category: "travel",
  },
  { emoji: "🗿", name: "moai", keywords: ["easter island", "statue"], category: "travel" },
  { emoji: "🏠", name: "house", keywords: ["home", "building"], category: "travel" },
  { emoji: "🏢", name: "office building", keywords: ["work", "business"], category: "travel" },
  { emoji: "🏥", name: "hospital", keywords: ["medical", "health", "doctor"], category: "travel" },
  { emoji: "🏫", name: "school", keywords: ["education", "learn", "study"], category: "travel" },
  {
    emoji: "🏛️",
    name: "classical building",
    keywords: ["museum", "government"],
    category: "travel",
  },
  {
    emoji: "⛪",
    name: "church",
    keywords: ["religion", "christian", "wedding"],
    category: "travel",
  },
  { emoji: "🕌", name: "mosque", keywords: ["religion", "islam", "muslim"], category: "travel" },
  { emoji: "🏕️", name: "camping", keywords: ["tent", "outdoor", "nature"], category: "travel" },
  { emoji: "🏖️", name: "beach", keywords: ["vacation", "sun", "sea"], category: "travel" },
  { emoji: "🏔️", name: "mountain", keywords: ["nature", "climb", "high"], category: "travel" },
  { emoji: "🌋", name: "volcano", keywords: ["nature", "lava", "hot"], category: "travel" },
  { emoji: "🗺️", name: "world map", keywords: ["globe", "travel", "earth"], category: "travel" },
  {
    emoji: "🌍",
    name: "earth globe europe",
    keywords: ["world", "planet", "global"],
    category: "travel",
  },
  {
    emoji: "🌎",
    name: "earth globe americas",
    keywords: ["world", "planet", "global"],
    category: "travel",
  },
  {
    emoji: "🌏",
    name: "earth globe asia",
    keywords: ["world", "planet", "global"],
    category: "travel",
  },

  // Objects
  { emoji: "⌚", name: "watch", keywords: ["time", "clock", "wrist"], category: "objects" },
  {
    emoji: "📱",
    name: "mobile phone",
    keywords: ["cell", "smartphone", "iphone"],
    category: "objects",
  },
  { emoji: "💻", name: "laptop", keywords: ["computer", "pc", "mac"], category: "objects" },
  {
    emoji: "🖥️",
    name: "desktop computer",
    keywords: ["pc", "monitor", "screen"],
    category: "objects",
  },
  { emoji: "🖨️", name: "printer", keywords: ["print", "paper", "office"], category: "objects" },
  { emoji: "⌨️", name: "keyboard", keywords: ["type", "computer", "input"], category: "objects" },
  { emoji: "🖱️", name: "computer mouse", keywords: ["click", "cursor", "pc"], category: "objects" },
  { emoji: "💾", name: "floppy disk", keywords: ["save", "storage", "retro"], category: "objects" },
  { emoji: "📷", name: "camera", keywords: ["photo", "picture", "snap"], category: "objects" },
  { emoji: "🎥", name: "movie camera", keywords: ["film", "video", "record"], category: "objects" },
  { emoji: "📺", name: "television", keywords: ["tv", "watch", "screen"], category: "objects" },
  { emoji: "📻", name: "radio", keywords: ["music", "broadcast", "retro"], category: "objects" },
  { emoji: "🔦", name: "flashlight", keywords: ["light", "dark", "torch"], category: "objects" },
  { emoji: "💡", name: "light bulb", keywords: ["idea", "bright", "lamp"], category: "objects" },
  { emoji: "🔧", name: "wrench", keywords: ["tool", "fix", "repair"], category: "objects" },
  { emoji: "🔨", name: "hammer", keywords: ["tool", "build", "construction"], category: "objects" },
  { emoji: "🔩", name: "nut and bolt", keywords: ["tool", "hardware", "fix"], category: "objects" },
  { emoji: "⚙️", name: "gear", keywords: ["settings", "cog", "mechanical"], category: "objects" },
  { emoji: "🔑", name: "key", keywords: ["lock", "security", "access"], category: "objects" },
  { emoji: "🔒", name: "locked", keywords: ["security", "private", "safe"], category: "objects" },
  { emoji: "🔓", name: "unlocked", keywords: ["open", "security", "access"], category: "objects" },
  { emoji: "📦", name: "package", keywords: ["box", "delivery", "shipping"], category: "objects" },
  { emoji: "📧", name: "email", keywords: ["mail", "message", "inbox"], category: "objects" },
  { emoji: "📝", name: "memo", keywords: ["note", "write", "paper"], category: "objects" },
  { emoji: "📚", name: "books", keywords: ["read", "study", "library"], category: "objects" },
  { emoji: "📖", name: "open book", keywords: ["read", "study", "page"], category: "objects" },
  { emoji: "📎", name: "paperclip", keywords: ["attach", "office", "clip"], category: "objects" },
  { emoji: "✂️", name: "scissors", keywords: ["cut", "office", "craft"], category: "objects" },
  { emoji: "📌", name: "pushpin", keywords: ["pin", "note", "location"], category: "objects" },
  {
    emoji: "🗑️",
    name: "wastebasket",
    keywords: ["trash", "delete", "garbage"],
    category: "objects",
  },
  { emoji: "💰", name: "money bag", keywords: ["rich", "cash", "wealth"], category: "objects" },
  { emoji: "💵", name: "dollar bill", keywords: ["money", "cash", "usd"], category: "objects" },
  { emoji: "💎", name: "gem", keywords: ["diamond", "jewel", "precious"], category: "objects" },
  { emoji: "🎁", name: "gift", keywords: ["present", "birthday", "wrap"], category: "objects" },
  {
    emoji: "🎈",
    name: "balloon",
    keywords: ["party", "birthday", "celebrate"],
    category: "objects",
  },
  {
    emoji: "🎉",
    name: "party popper",
    keywords: ["celebrate", "congratulations", "party"],
    category: "objects",
  },
  {
    emoji: "🎊",
    name: "confetti ball",
    keywords: ["celebrate", "party", "win"],
    category: "objects",
  },

  // Symbols
  { emoji: "❤️", name: "red heart", keywords: ["love", "like", "valentine"], category: "symbols" },
  { emoji: "🧡", name: "orange heart", keywords: ["love", "like"], category: "symbols" },
  { emoji: "💛", name: "yellow heart", keywords: ["love", "like"], category: "symbols" },
  { emoji: "💚", name: "green heart", keywords: ["love", "like"], category: "symbols" },
  { emoji: "💙", name: "blue heart", keywords: ["love", "like"], category: "symbols" },
  { emoji: "💜", name: "purple heart", keywords: ["love", "like"], category: "symbols" },
  { emoji: "🖤", name: "black heart", keywords: ["love", "dark"], category: "symbols" },
  { emoji: "🤍", name: "white heart", keywords: ["love", "pure"], category: "symbols" },
  { emoji: "💔", name: "broken heart", keywords: ["sad", "heartbreak"], category: "symbols" },
  { emoji: "❣️", name: "heart exclamation", keywords: ["love", "heavy"], category: "symbols" },
  { emoji: "💕", name: "two hearts", keywords: ["love", "couple"], category: "symbols" },
  { emoji: "💞", name: "revolving hearts", keywords: ["love", "romance"], category: "symbols" },
  { emoji: "💓", name: "beating heart", keywords: ["love", "alive"], category: "symbols" },
  { emoji: "💗", name: "growing heart", keywords: ["love", "affection"], category: "symbols" },
  { emoji: "💖", name: "sparkling heart", keywords: ["love", "shiny"], category: "symbols" },
  { emoji: "💘", name: "heart with arrow", keywords: ["love", "cupid"], category: "symbols" },
  {
    emoji: "💝",
    name: "heart with ribbon",
    keywords: ["love", "gift", "valentine"],
    category: "symbols",
  },
  { emoji: "✅", name: "check mark", keywords: ["yes", "done", "complete"], category: "symbols" },
  { emoji: "❌", name: "cross mark", keywords: ["no", "wrong", "error"], category: "symbols" },
  { emoji: "⭕", name: "circle", keywords: ["correct", "yes", "ring"], category: "symbols" },
  {
    emoji: "❗",
    name: "exclamation",
    keywords: ["alert", "warning", "important"],
    category: "symbols",
  },
  { emoji: "❓", name: "question mark", keywords: ["ask", "help", "what"], category: "symbols" },
  { emoji: "⚠️", name: "warning", keywords: ["alert", "caution", "danger"], category: "symbols" },
  { emoji: "🚫", name: "prohibited", keywords: ["no", "forbidden", "banned"], category: "symbols" },
  {
    emoji: "♻️",
    name: "recycling",
    keywords: ["environment", "green", "eco"],
    category: "symbols",
  },
  { emoji: "✨", name: "sparkles", keywords: ["shiny", "magic", "new"], category: "symbols" },
  { emoji: "💫", name: "dizzy", keywords: ["star", "sparkle", "shooting"], category: "symbols" },
  { emoji: "💥", name: "collision", keywords: ["boom", "explosion", "bang"], category: "symbols" },
  {
    emoji: "💦",
    name: "sweat droplets",
    keywords: ["water", "wet", "splash"],
    category: "symbols",
  },
  { emoji: "💨", name: "dashing away", keywords: ["wind", "fast", "run"], category: "symbols" },
  {
    emoji: "💬",
    name: "speech balloon",
    keywords: ["chat", "talk", "comment"],
    category: "symbols",
  },
  {
    emoji: "💭",
    name: "thought balloon",
    keywords: ["think", "cloud", "dream"],
    category: "symbols",
  },
  { emoji: "🔴", name: "red circle", keywords: ["color", "dot"], category: "symbols" },
  { emoji: "🟠", name: "orange circle", keywords: ["color", "dot"], category: "symbols" },
  { emoji: "🟡", name: "yellow circle", keywords: ["color", "dot"], category: "symbols" },
  { emoji: "🟢", name: "green circle", keywords: ["color", "dot"], category: "symbols" },
  { emoji: "🔵", name: "blue circle", keywords: ["color", "dot"], category: "symbols" },
  { emoji: "🟣", name: "purple circle", keywords: ["color", "dot"], category: "symbols" },
  { emoji: "⚫", name: "black circle", keywords: ["color", "dot"], category: "symbols" },
  { emoji: "⚪", name: "white circle", keywords: ["color", "dot"], category: "symbols" },
  { emoji: "🔶", name: "orange diamond", keywords: ["shape", "color"], category: "symbols" },
  { emoji: "🔷", name: "blue diamond", keywords: ["shape", "color"], category: "symbols" },
  { emoji: "▶️", name: "play button", keywords: ["start", "video", "music"], category: "symbols" },
  { emoji: "⏸️", name: "pause button", keywords: ["stop", "wait"], category: "symbols" },
  { emoji: "⏹️", name: "stop button", keywords: ["end", "halt"], category: "symbols" },
  { emoji: "⏩", name: "fast forward", keywords: ["skip", "speed"], category: "symbols" },
  { emoji: "⏪", name: "rewind", keywords: ["back", "reverse"], category: "symbols" },
  { emoji: "🔀", name: "shuffle", keywords: ["random", "mix"], category: "symbols" },
  { emoji: "🔁", name: "repeat", keywords: ["loop", "again"], category: "symbols" },
  { emoji: "🔂", name: "repeat single", keywords: ["loop", "one"], category: "symbols" },
  { emoji: "➕", name: "plus", keywords: ["add", "more"], category: "symbols" },
  { emoji: "➖", name: "minus", keywords: ["subtract", "less"], category: "symbols" },
  { emoji: "➗", name: "division", keywords: ["divide", "math"], category: "symbols" },
  {
    emoji: "✖️",
    name: "multiplication",
    keywords: ["multiply", "math", "times"],
    category: "symbols",
  },
  {
    emoji: "♾️",
    name: "infinity",
    keywords: ["forever", "endless", "infinite"],
    category: "symbols",
  },
  {
    emoji: "💯",
    name: "hundred points",
    keywords: ["perfect", "100", "score"],
    category: "symbols",
  },
  { emoji: "🆗", name: "ok button", keywords: ["okay", "yes", "approve"], category: "symbols" },
  { emoji: "🆕", name: "new button", keywords: ["fresh", "latest"], category: "symbols" },
  { emoji: "🆙", name: "up button", keywords: ["upgrade", "increase"], category: "symbols" },
  { emoji: "🆒", name: "cool button", keywords: ["awesome", "nice"], category: "symbols" },
  { emoji: "🆓", name: "free button", keywords: ["no cost", "gratis"], category: "symbols" },
  { emoji: "ℹ️", name: "information", keywords: ["info", "help", "about"], category: "symbols" },
  { emoji: "🔔", name: "bell", keywords: ["notification", "alert", "ring"], category: "symbols" },
  {
    emoji: "🔕",
    name: "bell with slash",
    keywords: ["mute", "silent", "quiet"],
    category: "symbols",
  },
  {
    emoji: "🔊",
    name: "speaker high volume",
    keywords: ["loud", "sound", "audio"],
    category: "symbols",
  },
  {
    emoji: "🔇",
    name: "muted speaker",
    keywords: ["silent", "quiet", "mute"],
    category: "symbols",
  },
];

/** Get recently used emojis from storage */
export async function getRecentEmojis(): Promise<string[]> {
  return getStorageValue<string[]>(STORAGE_KEY_RECENT_EMOJIS, []);
}

/** Add an emoji to recently used list */
export async function addRecentEmoji(emoji: string): Promise<void> {
  const recent = await getRecentEmojis();
  // Remove if already exists (to move it to front)
  const filtered = recent.filter((e) => e !== emoji);
  // Add to front
  filtered.unshift(emoji);
  // Limit size
  const limited = filtered.slice(0, MAX_RECENT_EMOJIS);
  await setStorageValue(STORAGE_KEY_RECENT_EMOJIS, limited);
}

/** Search emojis by query */
export function searchEmojis(query: string): EmojiItem[] {
  const q = (query || "").toLowerCase().trim();
  if (!q) return EMOJIS;

  return EMOJIS.filter((item) => {
    // Match emoji itself
    if (item.emoji === q) return true;
    // Match name
    if (item.name.toLowerCase().includes(q)) return true;
    // Match keywords
    if (item.keywords.some((kw) => kw.toLowerCase().includes(q))) return true;
    // Match category
    if (item.category.toLowerCase().includes(q)) return true;
    if (CATEGORY_LABELS[item.category].toLowerCase().includes(q)) return true;
    return false;
  });
}

/** Get emojis by category */
export function getEmojisByCategory(category: EmojiCategory): EmojiItem[] {
  return EMOJIS.filter((item) => item.category === category);
}

/** Get popular emojis for empty state */
export function getPopularEmojis(): EmojiItem[] {
  const popularIds = [
    "😀",
    "😂",
    "❤️",
    "👍",
    "🎉",
    "🔥",
    "✨",
    "🚀",
    "💯",
    "👀",
    "🙏",
    "💪",
    "✅",
    "❌",
    "⭐",
    "💡",
  ];
  return EMOJIS.filter((item) => popularIds.includes(item.emoji));
}

/** Get suggestion terms for autocomplete */
export function getEmojiSuggestions(): string[] {
  return ["smile", "heart", "thumbs", "fire", "star", "check"];
}
