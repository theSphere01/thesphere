// ─────────────────────────────────────────────
// THE SPHERE — Master Constants
// Single source of truth — no database needed
// ─────────────────────────────────────────────

import type { BadgeDefinition, PointsConfig, DiscountConfig } from "./types";

// ── 11 Activity Lands ─────────────────────────
export const LANDS = [
  {
    id: "land-art",
    name: "Art Land",
    slug: "art-land",
    description: "Unleash your inner artist. From 3D sculpting to mirror painting, every mark you make is a masterpiece waiting to be discovered.",
    tagline: "Every mark you make is a masterpiece",
    theme_color: "#E74C3C",
    icon_emoji: "🎨",
    age_min: 6,
    age_max: 16,
    is_active: true,
    stations: [
      { id: "s-art-1", land_id: "land-art", name: "Gips 3D Sculpting", description: "Mold, shape, and sculpt plaster into 3D art pieces to take home", age_min: 6, age_max: 16, emoji: "🗿", is_active: true, sort_order: 1 },
      { id: "s-art-2", land_id: "land-art", name: "Canvas Painting", description: "Express yourself freely on canvas with acrylic paints and brushes", age_min: 6, age_max: 16, emoji: "🖌️", is_active: true, sort_order: 2 },
      { id: "s-art-3", land_id: "land-art", name: "Wood Painting", description: "Transform raw wood into decorated art pieces with vibrant colors", age_min: 6, age_max: 16, emoji: "🪵", is_active: true, sort_order: 3 },
      { id: "s-art-4", land_id: "land-art", name: "Mirror Painting", description: "Create stunning reflective art pieces on mirrors with glass paints", age_min: 6, age_max: 16, emoji: "🪞", is_active: true, sort_order: 4 },
    ],
  },
  {
    id: "land-fashion",
    name: "Fashion Land",
    slug: "fashion-land",
    description: "Step onto the runway of creativity. Design custom clothes, master tie-dye, and create accessories that are totally, uniquely YOU.",
    tagline: "Style is your superpower",
    theme_color: "#9B59B6",
    icon_emoji: "👗",
    age_min: 8,
    age_max: 18,
    is_active: true,
    stations: [
      { id: "s-fash-1", land_id: "land-fashion", name: "Spray Art T-Shirt", description: "Use spray paints and stencils to create one-of-a-kind wearable art", age_min: 8, age_max: 18, emoji: "👕", is_active: true, sort_order: 1 },
      { id: "s-fash-2", land_id: "land-fashion", name: "Tie-Dye Studio", description: "Master the ancient art of tie-dye to create swirling colorful patterns", age_min: 8, age_max: 18, emoji: "🌀", is_active: true, sort_order: 2 },
      { id: "s-fash-3", land_id: "land-fashion", name: "Custom Print Studio", description: "Design and print your own graphics onto fabric items", age_min: 8, age_max: 18, emoji: "🖨️", is_active: true, sort_order: 3 },
      { id: "s-fash-4", land_id: "land-fashion", name: "Fashion Accessories", description: "Create matching jewelry, bags, and accessories to complete your look", age_min: 8, age_max: 18, emoji: "💍", is_active: true, sort_order: 4 },
    ],
  },
  {
    id: "land-cooking",
    name: "Cooking Land",
    slug: "cooking-land",
    description: "Where science meets taste. Become a junior chef, create molecular gastronomy magic, and discover the delicious chaos of real cooking.",
    tagline: "Where science meets delicious",
    theme_color: "#F39C12",
    icon_emoji: "🧁",
    age_min: 5,
    age_max: 18,
    is_active: true,
    stations: [
      { id: "s-cook-1", land_id: "land-cooking", name: "Cupcake Decorating", description: "Ice, decorate, and create the most beautiful (and delicious) cupcakes", age_min: 5, age_max: 18, emoji: "🧁", is_active: true, sort_order: 1 },
      { id: "s-cook-2", land_id: "land-cooking", name: "Pancake Art", description: "Pour colorful batter into amazing shapes and art using pancake art techniques", age_min: 5, age_max: 18, emoji: "🥞", is_active: true, sort_order: 2 },
      { id: "s-cook-3", land_id: "land-cooking", name: "Chocolate Factory", description: "Melt, mold, and decorate your own chocolate creations from scratch", age_min: 5, age_max: 18, emoji: "🍫", is_active: true, sort_order: 3 },
      { id: "s-cook-4", land_id: "land-cooking", name: "Boba Tea Bar", description: "Make your own bubble tea with custom flavors, toppings, and pearl levels", age_min: 5, age_max: 18, emoji: "🧋", is_active: true, sort_order: 4 },
      { id: "s-cook-5", land_id: "land-cooking", name: "Cookie Decorating", description: "Bake and decorate cookies with icing, sprinkles, and creative designs", age_min: 5, age_max: 18, emoji: "🍪", is_active: true, sort_order: 5 },
      { id: "s-cook-6", land_id: "land-cooking", name: "Molecular Gastronomy", description: "Turn cooking into edible science — spherification, foams, and flavor magic", age_min: 8, age_max: 18, emoji: "⚗️", is_active: true, sort_order: 6 },
    ],
  },
  {
    id: "land-science",
    name: "Science Land",
    slug: "science-land",
    description: "Real experiments. Real explosions. Real WHOA moments. Science Land turns every child into a mad scientist with a lab coat and a mission.",
    tagline: "Real experiments. Real WHOA moments",
    theme_color: "#2ECC71",
    icon_emoji: "🔬",
    age_min: 5,
    age_max: 16,
    is_active: true,
    stations: [
      { id: "s-sci-1", land_id: "land-science", name: "Elephant Toothpaste", description: "Create an explosive foam eruption using hydrogen peroxide and yeast", age_min: 5, age_max: 16, emoji: "🦷", is_active: true, sort_order: 1 },
      { id: "s-sci-2", land_id: "land-science", name: "Slime Lab 2.0", description: "Mix and create custom slimes with glitter, color, and amazing textures", age_min: 5, age_max: 16, emoji: "🟢", is_active: true, sort_order: 2 },
      { id: "s-sci-3", land_id: "land-science", name: "Volcano Lab", description: "Build and erupt your own volcano with a chemical reaction that always amazes", age_min: 5, age_max: 16, emoji: "🌋", is_active: true, sort_order: 3 },
      { id: "s-sci-4", land_id: "land-science", name: "Oobleck", description: "Is it a solid or a liquid? Explore the mind-bending science of non-Newtonian fluids", age_min: 5, age_max: 16, emoji: "💚", is_active: true, sort_order: 4 },
      { id: "s-sci-5", land_id: "land-science", name: "DNA Extraction", description: "Extract real DNA from strawberries using simple household chemicals", age_min: 5, age_max: 16, emoji: "🧬", is_active: true, sort_order: 5 },
      { id: "s-sci-6", land_id: "land-science", name: "Bridge Builder Challenge", description: "Engineer and test bridges using limited materials — science meets architecture", age_min: 8, age_max: 16, emoji: "🌉", is_active: true, sort_order: 6 },
    ],
  },
  {
    id: "land-lego",
    name: "Lego & Building",
    slug: "lego-building",
    description: "\"I built that!\" — the proudest four words in any child's vocabulary. Engineering challenges, teamwork, and the pure satisfaction of construction.",
    tagline: "Build it. Break it. Build it better",
    theme_color: "#E67E22",
    icon_emoji: "🧱",
    age_min: 6,
    age_max: 16,
    is_active: true,
    stations: [
      { id: "s-lego-1", land_id: "land-lego", name: "Giant LEGO Challenge", description: "Work in teams to build giant LEGO structures against the clock", age_min: 6, age_max: 16, emoji: "🧱", is_active: true, sort_order: 1 },
      { id: "s-lego-2", land_id: "land-lego", name: "Cardboard Architecture", description: "Design and build scale models of buildings using just cardboard and tape", age_min: 6, age_max: 16, emoji: "🏗️", is_active: true, sort_order: 2 },
      { id: "s-lego-3", land_id: "land-lego", name: "Spaghetti Tower", description: "Build the tallest tower you can using only spaghetti and marshmallows", age_min: 6, age_max: 16, emoji: "🍝", is_active: true, sort_order: 3 },
      { id: "s-lego-4", land_id: "land-lego", name: "Rube Goldberg Machine", description: "Design elaborate chain-reaction machines where everything connects", age_min: 8, age_max: 16, emoji: "⚙️", is_active: true, sort_order: 4 },
    ],
  },
  {
    id: "land-vr",
    name: "VR Land",
    slug: "vr-land",
    description: "Lights, camera, the FUTURE. From green screen adventures to 360° virtual worlds — this is where tomorrow's creators make their debut.",
    tagline: "Lights. Camera. The Future",
    theme_color: "#3498DB",
    icon_emoji: "🎬",
    age_min: 5,
    age_max: 18,
    is_active: true,
    stations: [
      { id: "s-vr-1", land_id: "land-vr", name: "Green Screen Film Studio", description: "Act in front of a green screen and be transported to any world imaginable", age_min: 5, age_max: 18, emoji: "🎬", is_active: true, sort_order: 1 },
      { id: "s-vr-2", land_id: "land-vr", name: "Stop-Motion Animation", description: "Create your own animated movie frame-by-frame using characters you design", age_min: 5, age_max: 18, emoji: "🎞️", is_active: true, sort_order: 2 },
      { id: "s-vr-3", land_id: "land-vr", name: "News Broadcast Room", description: "Become a news anchor, weather presenter, or sports reporter on our live set", age_min: 5, age_max: 18, emoji: "📺", is_active: true, sort_order: 3 },
      { id: "s-vr-4", land_id: "land-vr", name: "360° VR Worlds", description: "Put on the headset and step into virtual worlds — underwater, in space, anywhere", age_min: 8, age_max: 18, emoji: "🥽", is_active: true, sort_order: 4 },
    ],
  },
  {
    id: "land-sports",
    name: "Sports Land",
    slug: "sports-land",
    description: "High energy, high stakes, high fives. Sports Land is where champions are made — whether you love team sports, dance, or just moving FAST.",
    tagline: "Champions are made here",
    theme_color: "#1ABC9C",
    icon_emoji: "⚽",
    age_min: 6,
    age_max: 18,
    is_active: true,
    stations: [
      { id: "s-spt-1", land_id: "land-sports", name: "Dodgeball", description: "Classic dodgeball with The Sphere's own twist — team strategy meets pure fun", age_min: 6, age_max: 18, emoji: "🔴", is_active: true, sort_order: 1 },
      { id: "s-spt-2", land_id: "land-sports", name: "Capture the Flag", description: "Team strategy, stealth, and speed in the ultimate outdoor challenge", age_min: 6, age_max: 18, emoji: "🚩", is_active: true, sort_order: 2 },
      { id: "s-spt-3", land_id: "land-sports", name: "Football Challenge", description: "Skills tests, penalty shootouts, and mini matches on our dedicated pitch", age_min: 6, age_max: 18, emoji: "⚽", is_active: true, sort_order: 3 },
      { id: "s-spt-4", land_id: "land-sports", name: "Multi-Sport Rotation", description: "Rotate through basketball, volleyball, and cricket in one action-packed hour", age_min: 6, age_max: 18, emoji: "🏅", is_active: true, sort_order: 4 },
      { id: "s-spt-5", land_id: "land-sports", name: "Dance Floor Game", description: "Dance battles, choreography challenges, and just-dance-style fun for everyone", age_min: 6, age_max: 18, emoji: "💃", is_active: true, sort_order: 5 },
    ],
  },
  {
    id: "land-gardening",
    name: "Gardening Land",
    slug: "gardening-land",
    description: "Slow down. Get your hands in the soil. Create something living that you can take home and watch grow — a tiny world you made yourself.",
    tagline: "Grow something beautiful. Take it home",
    theme_color: "#27AE60",
    icon_emoji: "🌱",
    age_min: 4,
    age_max: 14,
    is_active: true,
    stations: [
      { id: "s-gard-1", land_id: "land-gardening", name: "Plant Your Own Pot", description: "Choose your plant, prepare your soil, and create a decorated pot to take home", age_min: 4, age_max: 14, emoji: "🪴", is_active: true, sort_order: 1 },
      { id: "s-gard-2", land_id: "land-gardening", name: "Terrarium Building", description: "Build a miniature glass ecosystem with plants, pebbles, and tiny decorations", age_min: 6, age_max: 14, emoji: "🏺", is_active: true, sort_order: 2 },
      { id: "s-gard-3", land_id: "land-gardening", name: "Seed Bomb Workshop", description: "Make seed bombs to throw in your garden at home — tiny acts of nature", age_min: 4, age_max: 14, emoji: "💣", is_active: true, sort_order: 3 },
      { id: "s-gard-4", land_id: "land-gardening", name: "Pressed Flower Art", description: "Collect, press, and arrange real flowers into framed botanical art pieces", age_min: 4, age_max: 14, emoji: "🌸", is_active: true, sort_order: 4 },
    ],
  },
  {
    id: "land-nilco",
    name: "Nilco Zone",
    slug: "nilco-zone",
    description: "Giant games, bounce castles, and tournaments where strategy rules. The Nilco Zone is pure, joyful chaos — and you'll love every second.",
    tagline: "Giant fun. Serious strategy",
    theme_color: "#F1C40F",
    icon_emoji: "🎲",
    age_min: 4,
    age_max: 16,
    is_active: true,
    stations: [
      { id: "s-nil-1", land_id: "land-nilco", name: "Giant Board Games", description: "Play human-sized versions of Jenga, chess, checkers, and more", age_min: 4, age_max: 16, emoji: "🎲", is_active: true, sort_order: 1 },
      { id: "s-nil-2", land_id: "land-nilco", name: "Card Game Tournament", description: "Compete in organized card game tournaments with prizes and rankings", age_min: 6, age_max: 16, emoji: "🃏", is_active: true, sort_order: 2 },
      { id: "s-nil-3", land_id: "land-nilco", name: "Bounce Castle", description: "The biggest, most epic bounce castle in Sahel — pure energy release", age_min: 4, age_max: 12, emoji: "🏰", is_active: true, sort_order: 3 },
    ],
  },
  {
    id: "land-beauty",
    name: "Beauty Land",
    slug: "beauty-land",
    description: "This isn't a salon — it's a lab. Create your own signature lip gloss, blend your personal fragrance, and leave with confidence you crafted yourself.",
    tagline: "Create your signature. Own your confidence",
    theme_color: "#E91E63",
    icon_emoji: "💄",
    age_min: 7,
    age_max: 18,
    is_active: true,
    stations: [
      { id: "s-bty-1", land_id: "land-beauty", name: "Lip Gloss Lab", description: "Mix and create your own custom lip gloss with colors, flavors, and sparkle", age_min: 7, age_max: 18, emoji: "💋", is_active: true, sort_order: 1 },
      { id: "s-bty-2", land_id: "land-beauty", name: "Perfume & Body Splash Studio", description: "Blend essential oils and create your own signature personal fragrance", age_min: 7, age_max: 18, emoji: "🌸", is_active: true, sort_order: 2 },
      { id: "s-bty-3", land_id: "land-beauty", name: "Candle Making Workshop", description: "Pour, color, and scent soy wax candles to take home and gift", age_min: 8, age_max: 18, emoji: "🕯️", is_active: true, sort_order: 3 },
    ],
  },
  {
    id: "land-handmade",
    name: "Hand Made Land",
    slug: "handmade-land",
    description: "The art of making something with your own two hands. Bracelets, jewelry, macramé — every piece tells your story. Every piece is a gift.",
    tagline: "Made by your hands. Told by your story",
    theme_color: "#FF7043",
    icon_emoji: "📿",
    age_min: 5,
    age_max: 18,
    is_active: true,
    stations: [
      { id: "s-hm-1", land_id: "land-handmade", name: "Macramé Basics", description: "Learn the ancient art of knotting to create wall hangings and plant hangers", age_min: 8, age_max: 18, emoji: "🪢", is_active: true, sort_order: 1 },
      { id: "s-hm-2", land_id: "land-handmade", name: "Friendship Bracelet", description: "Weave colorful friendship bracelets using traditional thread techniques", age_min: 5, age_max: 18, emoji: "🤝", is_active: true, sort_order: 2 },
      { id: "s-hm-3", land_id: "land-handmade", name: "Bead Jewelry", description: "Create necklaces, earrings, and bracelets from a huge variety of beads", age_min: 5, age_max: 18, emoji: "📿", is_active: true, sort_order: 3 },
      { id: "s-hm-4", land_id: "land-handmade", name: "Surf Rope Bracelet", description: "Knot and braid surf-style rope bracelets with metal clasps and charms", age_min: 5, age_max: 18, emoji: "🌊", is_active: true, sort_order: 4 },
      { id: "s-hm-5", land_id: "land-handmade", name: "Shell & Sea Glass Jewelry", description: "Drill and wire-wrap natural shells and sea glass into wearable art", age_min: 6, age_max: 18, emoji: "🐚", is_active: true, sort_order: 5 },
    ],
  },
];

// ── Points System ─────────────────────────────
export const DEFAULT_POINTS_CONFIG: PointsConfig = {
  per_hour:              50,
  bonus_2h:              30,
  bonus_3h:              70,
  bonus_5h:             150,
  return_visit:         200,
  new_land:             100,
  explorer:             300,
  streak_3_multiplier:    1.3,
  streak_5_multiplier:    1.5,
};

// ── Discount System ───────────────────────────
export const DEFAULT_DISCOUNT_CONFIG: DiscountConfig = {
  visit_2:           5,
  visit_3:          10,
  visit_4_plus:     15,
  group_5:          10,
  sibling:          20,
  early_bird:        8,
  ceremony_1st:     30,
  ceremony_2nd:     20,
  ceremony_3rd:     15,
  ceremony_top10:   10,
  all_participants:  5,
};

// ── Badge Catalog ─────────────────────────────
export const BADGE_DEFINITIONS: BadgeDefinition[] = [
  // Visit milestones
  { id: "b-first-timer",     name: "First Timer",      description: "Welcome to The Sphere! Your first visit begins here.",  emoji: "🌟", rarity: "common",    category: "visits",    criteria_type: "visit_count", criteria_value: 1 },
  { id: "b-explorer",        name: "Explorer",         description: "You came back — adventure calls your name!",            emoji: "🗺️", rarity: "common",    category: "visits",    criteria_type: "visit_count", criteria_value: 3 },
  { id: "b-regular",         name: "Regular",          description: "The Sphere knows your face. 5 visits strong.",          emoji: "⭐", rarity: "rare",      category: "visits",    criteria_type: "visit_count", criteria_value: 5 },
  { id: "b-dedicated",       name: "Dedicated",        description: "10 visits in. Seriously dedicated to the adventure.",   emoji: "🏅", rarity: "rare",      category: "visits",    criteria_type: "visit_count", criteria_value: 10 },
  { id: "b-sphere-veteran",  name: "Sphere Veteran",   description: "20 visits. You ARE The Sphere.",                       emoji: "🎖️", rarity: "epic",      category: "visits",    criteria_type: "visit_count", criteria_value: 20 },
  { id: "b-sphere-legend",   name: "Sphere Legend",    description: "50 visits. A living legend walks among us.",           emoji: "👑", rarity: "legendary", category: "visits",    criteria_type: "visit_count", criteria_value: 50 },
  // Streak badges
  { id: "b-3day-warrior",    name: "3-Day Warrior",    description: "3 days in a row. The streak has begun!",               emoji: "🔥", rarity: "rare",      category: "streaks",   criteria_type: "streak",      criteria_value: 3 },
  { id: "b-5day-streak",     name: "5-Day Streak",     description: "5 consecutive days — you are UNSTOPPABLE.",            emoji: "⚡", rarity: "epic",      category: "streaks",   criteria_type: "streak",      criteria_value: 5 },
  { id: "b-week-champion",   name: "Week Champion",    description: "7 days straight. The ultimate streak master.",         emoji: "🏆", rarity: "legendary", category: "streaks",   criteria_type: "streak",      criteria_value: 7 },
  // Points milestones
  { id: "b-rising-star",     name: "Rising Star",      description: "500 points earned. You're on your way!",               emoji: "💫", rarity: "common",    category: "points",    criteria_type: "total_points", criteria_value: 500 },
  { id: "b-superstar",       name: "Superstar",        description: "2,000 points. The crowd goes wild.",                  emoji: "🌠", rarity: "rare",      category: "points",    criteria_type: "total_points", criteria_value: 2000 },
  { id: "b-points-machine",  name: "Points Machine",   description: "5,000 points. An unstoppable points engine.",          emoji: "⚙️", rarity: "epic",      category: "points",    criteria_type: "total_points", criteria_value: 5000 },
  { id: "b-legend",          name: "Legend",           description: "10,000 points. Your name echoes through The Sphere.", emoji: "🌟", rarity: "legendary", category: "points",    criteria_type: "total_points", criteria_value: 10000 },
  // Explorer badges
  { id: "b-land-hopper",     name: "Land Hopper",      description: "Visited 3 different lands. The adventure broadens!",   emoji: "🦘", rarity: "common",    category: "explorer",  criteria_type: "lands_count",  criteria_value: 3 },
  { id: "b-world-traveler",  name: "World Traveler",   description: "Visited 6 lands. Half the world explored.",            emoji: "🌍", rarity: "rare",      category: "explorer",  criteria_type: "lands_count",  criteria_value: 6 },
  { id: "b-all-rounder",     name: "All-Rounder",      description: "All 11 lands visited. You've seen EVERYTHING.",        emoji: "🎯", rarity: "legendary", category: "explorer",  criteria_type: "lands_count",  criteria_value: 11 },
  // Per-land badges (11)
  { id: "b-art-explorer",    name: "Art Explorer",     description: "3 sessions in Art Land. The paint never washes off.",  emoji: "🎨", rarity: "rare",      category: "land",      criteria_type: "land_visits",  criteria_value: 3, criteria_land_slug: "art-land" },
  { id: "b-fashion-icon",    name: "Fashion Icon",     description: "3 sessions in Fashion Land. Your style is iconic.",    emoji: "👗", rarity: "rare",      category: "land",      criteria_type: "land_visits",  criteria_value: 3, criteria_land_slug: "fashion-land" },
  { id: "b-junior-chef",     name: "Junior Chef",      description: "3 sessions in Cooking Land. The kitchen is yours.",    emoji: "👨‍🍳", rarity: "rare",    category: "land",      criteria_type: "land_visits",  criteria_value: 3, criteria_land_slug: "cooking-land" },
  { id: "b-mad-scientist",   name: "Mad Scientist",    description: "3 sessions in Science Land. Explosions galore!",      emoji: "🔬", rarity: "rare",      category: "land",      criteria_type: "land_visits",  criteria_value: 3, criteria_land_slug: "science-land" },
  { id: "b-master-builder",  name: "Master Builder",   description: "3 sessions in Lego Land. What you build stands tall.", emoji: "🧱", rarity: "rare",     category: "land",      criteria_type: "land_visits",  criteria_value: 3, criteria_land_slug: "lego-building" },
  { id: "b-digital-creator", name: "Digital Creator",  description: "3 sessions in VR Land. The director has arrived.",    emoji: "🎬", rarity: "rare",      category: "land",      criteria_type: "land_visits",  criteria_value: 3, criteria_land_slug: "vr-land" },
  { id: "b-sports-champion", name: "Sports Champion",  description: "3 sessions in Sports Land. Champion of the arena.",   emoji: "🏆", rarity: "rare",      category: "land",      criteria_type: "land_visits",  criteria_value: 3, criteria_land_slug: "sports-land" },
  { id: "b-green-thumb",     name: "Green Thumb",      description: "3 sessions in Gardening Land. Life blooms around you.", emoji: "🌱", rarity: "rare",    category: "land",      criteria_type: "land_visits",  criteria_value: 3, criteria_land_slug: "gardening-land" },
  { id: "b-game-master",     name: "Game Master",      description: "3 sessions in Nilco Zone. You dominate every game.",  emoji: "🎲", rarity: "rare",      category: "land",      criteria_type: "land_visits",  criteria_value: 3, criteria_land_slug: "nilco-zone" },
  { id: "b-beauty-guru",     name: "Beauty Guru",      description: "3 sessions in Beauty Land. Signature style, always.", emoji: "💄", rarity: "rare",      category: "land",      criteria_type: "land_visits",  criteria_value: 3, criteria_land_slug: "beauty-land" },
  { id: "b-craft-master",    name: "Craft Master",     description: "3 sessions in Hand Made Land. Your hands create magic.", emoji: "📿", rarity: "rare",   category: "land",      criteria_type: "land_visits",  criteria_value: 3, criteria_land_slug: "handmade-land" },
  // Special
  { id: "b-day-champion",    name: "Day Champion",     description: "Won the daily ceremony. The Sphere bows to you.",     emoji: "👑", rarity: "legendary", category: "special",   criteria_type: "ceremony_win", criteria_value: 1 },
];

// ── Current Season ────────────────────────────
export const CURRENT_SEASON = "2025-summer";

// ── Ceremony Prize Structure ──────────────────
export const CEREMONY_PRIZES = [
  { rank: 1,       label: "Champion",      prize: "Trophy + Premium Prize Pack (T-shirt, activity voucher, branded merchandise)", discount: 30, valid_days: 7 },
  { rank: 2,       label: "2nd Place",     prize: "Activity voucher + T-shirt",                                                  discount: 20, valid_days: 7 },
  { rank: 3,       label: "3rd Place",     prize: "Activity voucher",                                                            discount: 15, valid_days: 7 },
  { rank: 4,  max: 10, label: "VIP",       prize: "VIP wristband for next visit (priority Land access)",                         discount: 10, valid_days: 5 },
  { rank: 11, max: 999, label: "Participant", prize: "Participation certificate + sticker pack",                                 discount:  5, valid_days: 3 },
];

// ── Land slug → id map ────────────────────────
export const LAND_SLUG_MAP = Object.fromEntries(LANDS.map(l => [l.slug, l.id]));

// ── Land color map ────────────────────────────
export const LAND_COLOR_MAP = Object.fromEntries(LANDS.map(l => [l.slug, l.theme_color]));

// ── Mock photos (local, served from /public/photos/) ──
export const MOCK_LAND_PHOTOS: Record<string, import("./types").LandPhoto[]> = {
  "land-art": [
    { id: "mp-1", land_id: "land-art",     url: "/photos/sphere-1.jpeg", caption: "Creating masterpieces at Art Land", sort_order: 1 },
    { id: "mp-2", land_id: "land-art",     url: "/photos/sphere-2.jpeg", caption: "Young artists in action",           sort_order: 2 },
  ],
  "land-cooking": [
    { id: "mp-3", land_id: "land-cooking", url: "/photos/sphere-3.jpeg", caption: "Junior chefs at work",              sort_order: 1 },
    { id: "mp-4", land_id: "land-cooking", url: "/photos/sphere-4.jpeg", caption: "Sweet creations at Cooking Land",   sort_order: 2 },
  ],
  "land-sports": [
    { id: "mp-5", land_id: "land-sports",  url: "/photos/sphere-5.jpeg", caption: "High energy at Sports Land",        sort_order: 1 },
  ],
  "land-science": [
    { id: "mp-6", land_id: "land-science", url: "/photos/sphere-6.jpeg", caption: "Science experiments in progress",   sort_order: 1 },
  ],
  "land-nilco": [
    { id: "mp-7", land_id: "land-nilco",   url: "/photos/sphere-7.jpeg", caption: "Giant games at Nilco Zone",         sort_order: 1 },
  ],
};
