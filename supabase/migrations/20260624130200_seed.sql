-- ============================================================
-- THE SPHERE — Seed data
-- Mirrors src/lib/constants.ts so a fresh database has the same
-- lands, stations, badges, and tunable config the app expects.
-- Idempotent: re-running upserts rather than duplicating.
-- ============================================================

-- ── Current season ──────────────────────────────────────────
insert into public.seasons (name, slug, is_active)
values ('2025 Summer', '2025-summer', true)
on conflict (slug) do update set is_active = excluded.is_active;

-- ── Lands ───────────────────────────────────────────────────
insert into public.lands (id, name, slug, description, tagline, theme_color, icon_emoji, age_min, age_max, sort_order) values
('land-art','Art Land','art-land','Unleash your inner artist. From 3D sculpting to mirror painting, every mark you make is a masterpiece waiting to be discovered.','Every mark you make is a masterpiece','#E74C3C','🎨',6,16,1),
('land-fashion','Fashion Land','fashion-land','Step onto the runway of creativity. Design custom clothes, master tie-dye, and create accessories that are totally, uniquely YOU.','Style is your superpower','#9B59B6','👗',8,18,2),
('land-cooking','Cooking Land','cooking-land','Where science meets taste. Become a junior chef, create molecular gastronomy magic, and discover the delicious chaos of real cooking.','Where science meets delicious','#F39C12','🧁',5,18,3),
('land-science','Science Land','science-land','Real experiments. Real explosions. Real WHOA moments. Science Land turns every child into a mad scientist with a lab coat and a mission.','Real experiments. Real WHOA moments','#2ECC71','🔬',5,16,4),
('land-lego','Lego & Building','lego-building','"I built that!" — the proudest four words in any child''s vocabulary. Engineering challenges, teamwork, and the pure satisfaction of construction.','Build it. Break it. Build it better','#E67E22','🧱',6,16,5),
('land-vr','VR Land','vr-land','Lights, camera, the FUTURE. From green screen adventures to 360° virtual worlds — this is where tomorrow''s creators make their debut.','Lights. Camera. The Future','#3498DB','🎬',5,18,6),
('land-sports','Sports Land','sports-land','High energy, high stakes, high fives. Sports Land is where champions are made — whether you love team sports, dance, or just moving FAST.','Champions are made here','#1ABC9C','⚽',6,18,7),
('land-gardening','Gardening Land','gardening-land','Slow down. Get your hands in the soil. Create something living that you can take home and watch grow — a tiny world you made yourself.','Grow something beautiful. Take it home','#27AE60','🌱',4,14,8),
('land-nilco','Nilco Zone','nilco-zone','Giant games, bounce castles, and tournaments where strategy rules. The Nilco Zone is pure, joyful chaos — and you''ll love every second.','Giant fun. Serious strategy','#F1C40F','🎲',4,16,9),
('land-beauty','Beauty Land','beauty-land','This isn''t a salon — it''s a lab. Create your own signature lip gloss, blend your personal fragrance, and leave with confidence you crafted yourself.','Create your signature. Own your confidence','#E91E63','💄',7,18,10),
('land-handmade','Hand Made Land','handmade-land','The art of making something with your own two hands. Bracelets, jewelry, macramé — every piece tells your story. Every piece is a gift.','Made by your hands. Told by your story','#FF7043','📿',5,18,11)
on conflict (id) do update set
  name = excluded.name, slug = excluded.slug, description = excluded.description,
  tagline = excluded.tagline, theme_color = excluded.theme_color,
  icon_emoji = excluded.icon_emoji, age_min = excluded.age_min,
  age_max = excluded.age_max, sort_order = excluded.sort_order;

-- ── Stations ────────────────────────────────────────────────
insert into public.stations (id, land_id, name, description, age_min, age_max, emoji, display_order) values
('s-art-1','land-art','Gips 3D Sculpting','Mold, shape, and sculpt plaster into 3D art pieces to take home',6,16,'🗿',1),
('s-art-2','land-art','Canvas Painting','Express yourself freely on canvas with acrylic paints and brushes',6,16,'🖌️',2),
('s-art-3','land-art','Wood Painting','Transform raw wood into decorated art pieces with vibrant colors',6,16,'🪵',3),
('s-art-4','land-art','Mirror Painting','Create stunning reflective art pieces on mirrors with glass paints',6,16,'🪞',4),
('s-fash-1','land-fashion','Spray Art T-Shirt','Use spray paints and stencils to create one-of-a-kind wearable art',8,18,'👕',1),
('s-fash-2','land-fashion','Tie-Dye Studio','Master the ancient art of tie-dye to create swirling colorful patterns',8,18,'🌀',2),
('s-fash-3','land-fashion','Custom Print Studio','Design and print your own graphics onto fabric items',8,18,'🖨️',3),
('s-fash-4','land-fashion','Fashion Accessories','Create matching jewelry, bags, and accessories to complete your look',8,18,'💍',4),
('s-cook-1','land-cooking','Cupcake Decorating','Ice, decorate, and create the most beautiful (and delicious) cupcakes',5,18,'🧁',1),
('s-cook-2','land-cooking','Pancake Art','Pour colorful batter into amazing shapes and art using pancake art techniques',5,18,'🥞',2),
('s-cook-3','land-cooking','Chocolate Factory','Melt, mold, and decorate your own chocolate creations from scratch',5,18,'🍫',3),
('s-cook-4','land-cooking','Boba Tea Bar','Make your own bubble tea with custom flavors, toppings, and pearl levels',5,18,'🧋',4),
('s-cook-5','land-cooking','Cookie Decorating','Bake and decorate cookies with icing, sprinkles, and creative designs',5,18,'🍪',5),
('s-cook-6','land-cooking','Molecular Gastronomy','Turn cooking into edible science — spherification, foams, and flavor magic',8,18,'⚗️',6),
('s-sci-1','land-science','Elephant Toothpaste','Create an explosive foam eruption using hydrogen peroxide and yeast',5,16,'🦷',1),
('s-sci-2','land-science','Slime Lab 2.0','Mix and create custom slimes with glitter, color, and amazing textures',5,16,'🟢',2),
('s-sci-3','land-science','Volcano Lab','Build and erupt your own volcano with a chemical reaction that always amazes',5,16,'🌋',3),
('s-sci-4','land-science','Oobleck','Is it a solid or a liquid? Explore the mind-bending science of non-Newtonian fluids',5,16,'💚',4),
('s-sci-5','land-science','DNA Extraction','Extract real DNA from strawberries using simple household chemicals',5,16,'🧬',5),
('s-sci-6','land-science','Bridge Builder Challenge','Engineer and test bridges using limited materials — science meets architecture',8,16,'🌉',6),
('s-lego-1','land-lego','Giant LEGO Challenge','Work in teams to build giant LEGO structures against the clock',6,16,'🧱',1),
('s-lego-2','land-lego','Cardboard Architecture','Design and build scale models of buildings using just cardboard and tape',6,16,'🏗️',2),
('s-lego-3','land-lego','Spaghetti Tower','Build the tallest tower you can using only spaghetti and marshmallows',6,16,'🍝',3),
('s-lego-4','land-lego','Rube Goldberg Machine','Design elaborate chain-reaction machines where everything connects',8,16,'⚙️',4),
('s-vr-1','land-vr','Green Screen Film Studio','Act in front of a green screen and be transported to any world imaginable',5,18,'🎬',1),
('s-vr-2','land-vr','Stop-Motion Animation','Create your own animated movie frame-by-frame using characters you design',5,18,'🎞️',2),
('s-vr-3','land-vr','News Broadcast Room','Become a news anchor, weather presenter, or sports reporter on our live set',5,18,'📺',3),
('s-vr-4','land-vr','360° VR Worlds','Put on the headset and step into virtual worlds — underwater, in space, anywhere',8,18,'🥽',4),
('s-spt-1','land-sports','Dodgeball','Classic dodgeball with The Sphere''s own twist — team strategy meets pure fun',6,18,'🔴',1),
('s-spt-2','land-sports','Capture the Flag','Team strategy, stealth, and speed in the ultimate outdoor challenge',6,18,'🚩',2),
('s-spt-3','land-sports','Football Challenge','Skills tests, penalty shootouts, and mini matches on our dedicated pitch',6,18,'⚽',3),
('s-spt-4','land-sports','Multi-Sport Rotation','Rotate through basketball, volleyball, and cricket in one action-packed hour',6,18,'🏅',4),
('s-spt-5','land-sports','Dance Floor Game','Dance battles, choreography challenges, and just-dance-style fun for everyone',6,18,'💃',5),
('s-gard-1','land-gardening','Plant Your Own Pot','Choose your plant, prepare your soil, and create a decorated pot to take home',4,14,'🪴',1),
('s-gard-2','land-gardening','Terrarium Building','Build a miniature glass ecosystem with plants, pebbles, and tiny decorations',6,14,'🏺',2),
('s-gard-3','land-gardening','Seed Bomb Workshop','Make seed bombs to throw in your garden at home — tiny acts of nature',4,14,'💣',3),
('s-gard-4','land-gardening','Pressed Flower Art','Collect, press, and arrange real flowers into framed botanical art pieces',4,14,'🌸',4),
('s-nil-1','land-nilco','Giant Board Games','Play human-sized versions of Jenga, chess, checkers, and more',4,16,'🎲',1),
('s-nil-2','land-nilco','Card Game Tournament','Compete in organized card game tournaments with prizes and rankings',6,16,'🃏',2),
('s-nil-3','land-nilco','Bounce Castle','The biggest, most epic bounce castle in Sahel — pure energy release',4,12,'🏰',3),
('s-bty-1','land-beauty','Lip Gloss Lab','Mix and create your own custom lip gloss with colors, flavors, and sparkle',7,18,'💋',1),
('s-bty-2','land-beauty','Perfume & Body Splash Studio','Blend essential oils and create your own signature personal fragrance',7,18,'🌸',2),
('s-bty-3','land-beauty','Candle Making Workshop','Pour, color, and scent soy wax candles to take home and gift',8,18,'🕯️',3),
('s-hm-1','land-handmade','Macramé Basics','Learn the ancient art of knotting to create wall hangings and plant hangers',8,18,'🪢',1),
('s-hm-2','land-handmade','Friendship Bracelet','Weave colorful friendship bracelets using traditional thread techniques',5,18,'🤝',2),
('s-hm-3','land-handmade','Bead Jewelry','Create necklaces, earrings, and bracelets from a huge variety of beads',5,18,'📿',3),
('s-hm-4','land-handmade','Surf Rope Bracelet','Knot and braid surf-style rope bracelets with metal clasps and charms',5,18,'🌊',4),
('s-hm-5','land-handmade','Shell & Sea Glass Jewelry','Drill and wire-wrap natural shells and sea glass into wearable art',6,18,'🐚',5)
on conflict (id) do update set
  land_id = excluded.land_id, name = excluded.name, description = excluded.description,
  age_min = excluded.age_min, age_max = excluded.age_max, emoji = excluded.emoji,
  display_order = excluded.display_order;

-- ── Badge catalog ───────────────────────────────────────────
insert into public.badge_definitions (id, name, description, emoji, rarity, category, criteria_type, criteria_value, criteria_land_slug, display_order) values
('b-first-timer','First Timer','Welcome to The Sphere! Your first visit begins here.','🌟','common','visits','visit_count',1,null,1),
('b-explorer','Explorer','You came back — adventure calls your name!','🗺️','common','visits','visit_count',3,null,2),
('b-regular','Regular','The Sphere knows your face. 5 visits strong.','⭐','rare','visits','visit_count',5,null,3),
('b-dedicated','Dedicated','10 visits in. Seriously dedicated to the adventure.','🏅','rare','visits','visit_count',10,null,4),
('b-sphere-veteran','Sphere Veteran','20 visits. You ARE The Sphere.','🎖️','epic','visits','visit_count',20,null,5),
('b-sphere-legend','Sphere Legend','50 visits. A living legend walks among us.','👑','legendary','visits','visit_count',50,null,6),
('b-3day-warrior','3-Day Warrior','3 days in a row. The streak has begun!','🔥','rare','streaks','streak',3,null,7),
('b-5day-streak','5-Day Streak','5 consecutive days — you are UNSTOPPABLE.','⚡','epic','streaks','streak',5,null,8),
('b-week-champion','Week Champion','7 days straight. The ultimate streak master.','🏆','legendary','streaks','streak',7,null,9),
('b-rising-star','Rising Star','500 points earned. You''re on your way!','💫','common','points','total_points',500,null,10),
('b-superstar','Superstar','2,000 points. The crowd goes wild.','🌠','rare','points','total_points',2000,null,11),
('b-points-machine','Points Machine','5,000 points. An unstoppable points engine.','⚙️','epic','points','total_points',5000,null,12),
('b-legend','Legend','10,000 points. Your name echoes through The Sphere.','🌟','legendary','points','total_points',10000,null,13),
('b-land-hopper','Land Hopper','Visited 3 different lands. The adventure broadens!','🦘','common','explorer','lands_count',3,null,14),
('b-world-traveler','World Traveler','Visited 6 lands. Half the world explored.','🌍','rare','explorer','lands_count',6,null,15),
('b-all-rounder','All-Rounder','All 11 lands visited. You''ve seen EVERYTHING.','🎯','legendary','explorer','lands_count',11,null,16),
('b-art-explorer','Art Explorer','3 sessions in Art Land. The paint never washes off.','🎨','rare','land','land_visits',3,'art-land',17),
('b-fashion-icon','Fashion Icon','3 sessions in Fashion Land. Your style is iconic.','👗','rare','land','land_visits',3,'fashion-land',18),
('b-junior-chef','Junior Chef','3 sessions in Cooking Land. The kitchen is yours.','👨‍🍳','rare','land','land_visits',3,'cooking-land',19),
('b-mad-scientist','Mad Scientist','3 sessions in Science Land. Explosions galore!','🔬','rare','land','land_visits',3,'science-land',20),
('b-master-builder','Master Builder','3 sessions in Lego Land. What you build stands tall.','🧱','rare','land','land_visits',3,'lego-building',21),
('b-digital-creator','Digital Creator','3 sessions in VR Land. The director has arrived.','🎬','rare','land','land_visits',3,'vr-land',22),
('b-sports-champion','Sports Champion','3 sessions in Sports Land. Champion of the arena.','🏆','rare','land','land_visits',3,'sports-land',23),
('b-green-thumb','Green Thumb','3 sessions in Gardening Land. Life blooms around you.','🌱','rare','land','land_visits',3,'gardening-land',24),
('b-game-master','Game Master','3 sessions in Nilco Zone. You dominate every game.','🎲','rare','land','land_visits',3,'nilco-zone',25),
('b-beauty-guru','Beauty Guru','3 sessions in Beauty Land. Signature style, always.','💄','rare','land','land_visits',3,'beauty-land',26),
('b-craft-master','Craft Master','3 sessions in Hand Made Land. Your hands create magic.','📿','rare','land','land_visits',3,'handmade-land',27),
('b-day-champion','Day Champion','Won the daily ceremony. The Sphere bows to you.','👑','legendary','special','ceremony_win',1,null,28)
on conflict (id) do update set
  name = excluded.name, description = excluded.description, emoji = excluded.emoji,
  rarity = excluded.rarity, category = excluded.category,
  criteria_type = excluded.criteria_type, criteria_value = excluded.criteria_value,
  criteria_land_slug = excluded.criteria_land_slug, display_order = excluded.display_order;

-- ── Points configuration (keyed by rule_type) ───────────────
insert into public.points_config (rule_type, value) values
('per_land_hour',50),
('session_bonus_2hr',30),
('session_bonus_3hr',70),
('session_bonus_5hr',150),
('return_visit_bonus',200),
('new_land_bonus',100),
('explorer_bonus',300),
('streak_3day_multiplier',1.3),
('streak_5visit_multiplier',1.5)
on conflict (rule_type) do update set value = excluded.value;

-- ── Discount configuration (keyed by condition_key) ─────────
insert into public.discount_config (condition_key, discount_value) values
('loyalty_2visits',5),
('loyalty_3visits',10),
('loyalty_4visits',15),
('group_5',10),
('sibling',20),
('early_bird',8),
('ceremony_1st',30),
('ceremony_2nd',20),
('ceremony_3rd',15),
('ceremony_top10',10),
('all_participants',5)
on conflict (condition_key) do update set discount_value = excluded.discount_value;
