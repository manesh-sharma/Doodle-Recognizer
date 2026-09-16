import os
import json
import random
import logging
from typing import Dict, List, Optional, Tuple

logger = logging.getLogger("doodle.contexto")

# Comprehensive taxonomy and semantic classification for QuickDraw classes
TAXONOMY: Dict[str, Tuple[str, str, List[str], str, str]] = {
    # format: class_name: (domain, subcategory, tags, display_category, semantic_clue)
    # FOOD & DRINKS
    "apple": ("food", "fruit", ["sweet", "tree", "round", "red", "green", "healthy", "orchard", "snack"], "Food & Fruits", "Keeps the doctor away; grows in orchards."),
    "banana": ("food", "fruit", ["sweet", "yellow", "tropical", "peel", "healthy", "curved", "snack"], "Food & Fruits", "A yellow curved fruit monkeys love to peel."),
    "blackberry": ("food", "fruit", ["sweet", "berry", "bush", "dark", "healthy", "thorny"], "Food & Fruits", "A dark cluster berry that grows on thorny bushes."),
    "blueberry": ("food", "fruit", ["sweet", "berry", "bush", "blue", "healthy", "round"], "Food & Fruits", "A small, round blue fruit often baked in muffins."),
    "grapes": ("food", "fruit", ["sweet", "vine", "bunch", "wine", "purple", "green", "juicy"], "Food & Fruits", "Grows in bunches on vines; made into raisins or wine."),
    "pear": ("food", "fruit", ["sweet", "tree", "green", "yellow", "juicy", "orchard"], "Food & Fruits", "Sweet bell-shaped fruit with soft juicy flesh."),
    "pineapple": ("food", "fruit", ["sweet", "tropical", "spiky", "yellow", "crown", "acidic"], "Food & Fruits", "A prickly tropical fruit wearing a leafy crown."),
    "strawberry": ("food", "fruit", ["sweet", "berry", "red", "seeds", "dessert", "heart_shaped"], "Food & Fruits", "Bright red heart-shaped berry with seeds on the outside."),
    "watermelon": ("food", "fruit", ["sweet", "melon", "large", "green", "red", "seeds", "summer", "juicy"], "Food & Fruits", "Huge green melon with sweet watery red slices."),
    "asparagus": ("food", "vegetable", ["green", "healthy", "stalk", "spear", "savory", "dinner"], "Food & Vegetables", "Long slender green stalks prized in fine cooking."),
    "carrot": ("food", "vegetable", ["orange", "root", "healthy", "rabbit", "savory", "crunchy"], "Food & Vegetables", "A crunchy orange root favorite of cartoon rabbits."),
    "mushroom": ("food", "vegetable", ["fungus", "cap", "forest", "stem", "savory", "edible"], "Food & Vegetables", "Has an umbrella cap and stem; found in damp forests."),
    "onion": ("food", "vegetable", ["bulb", "savory", "layers", "cooking", "tear", "pungent"], "Food & Vegetables", "Pungent layered bulb that makes chefs shed tears."),
    "peas": ("food", "vegetable", ["green", "pod", "small", "round", "healthy", "sweet"], "Food & Vegetables", "Tiny round green pearls nestled inside a pod."),
    "potato": ("food", "vegetable", ["root", "starch", "brown", "savory", "fries", "spud"], "Food & Vegetables", "Starchy brown spud that makes delicious french fries."),
    "bread": ("food", "bakery", ["grain", "wheat", "loaf", "baked", "breakfast", "sandwich", "crust"], "Food & Bakery", "Baked staple food made of flour and yeast; sliced for toast."),
    "cake": ("food", "dessert", ["sweet", "baked", "frosting", "birthday", "party", "candles"], "Food & Desserts", "Frosted celebration treat adorned with birthday candles."),
    "cookie": ("food", "dessert", ["sweet", "baked", "chocolate", "snack", "round", "crisp"], "Food & Desserts", "Crisp baked snack with chocolate chips and milk."),
    "donut": ("food", "dessert", ["sweet", "baked", "ring", "hole", "frosting", "sprinkles"], "Food & Desserts", "Fried sweet dough ring with glaze and sprinkles."),
    "ice cream": ("food", "dessert", ["sweet", "cold", "frozen", "cone", "scoop", "dairy", "summer"], "Food & Desserts", "Cold creamy dessert scooped into waffle cones."),
    "lollipop": ("food", "candy", ["sweet", "sugar", "stick", "candy", "kids", "hard"], "Food & Candy", "Hard flavored candy perched atop a stick."),
    "popsicle": ("food", "dessert", ["sweet", "frozen", "ice", "stick", "fruit", "cold"], "Food & Desserts", "Refreshing frozen fruit juice on a wooden stick."),
    "peanut": ("food", "nut", ["shell", "snack", "butter", "crunchy", "salty"], "Food & Snacks", "Two crunchy nuts tucked inside a tan brittle shell."),
    "hamburger": ("food", "fastfood", ["meat", "bun", "savory", "beef", "patty", "grill", "cheese"], "Food & Fast Food", "Juicy beef patty grilled between two sesame buns."),
    "hot dog": ("food", "fastfood", ["sausage", "bun", "mustard", "savory", "frank", "ballpark"], "Food & Fast Food", "Cooked sausage nestled inside a warm long roll."),
    "pizza": ("food", "fastfood", ["cheese", "crust", "slice", "savory", "italian", "sauce", "pepperoni"], "Food & Fast Food", "Circular flatbread topped with tomato sauce and melted cheese."),
    "sandwich": ("food", "fastfood", ["bread", "filling", "lunch", "savory", "deli", "sub"], "Food & Fast Food", "Slices of bread packed with meats, cheeses, and greens."),
    "steak": ("food", "meat", ["beef", "savory", "dinner", "grill", "butcher", "cut"], "Food & Meals", "Thick cut of prime beef seared over high heat."),
    "cup": ("home", "drinkware", ["drink", "liquid", "coffee", "tea", "tableware", "container"], "Kitchen & Dining", "Small handheld vessel for enjoying warm drinks."),
    "coffee cup": ("home", "drinkware", ["mug", "caffeine", "hot", "drink", "morning", "steaming"], "Kitchen & Dining", "Ceramic mug filled with steaming morning caffeine."),
    "wine bottle": ("home", "drinkware", ["glass", "alcohol", "grapes", "cork", "drink"], "Kitchen & Dining", "Tall glass container sealed with a cork stopper."),
    "wine glass": ("home", "drinkware", ["stem", "glass", "alcohol", "drink", "fragile"], "Kitchen & Dining", "Delicate goblet with an elegant stem for tasting vintages."),
    "teapot": ("home", "drinkware", ["tea", "spout", "steep", "hot", "handle", "brewing"], "Kitchen & Dining", "Pot with handle and spout for steeping aromatic herbal teas."),
    "frying pan": ("home", "cookware", ["skillet", "cook", "stove", "handle", "metal", "fry"], "Kitchen & Dining", "Flat-bottomed metal skillet for sizzling eggs and bacon."),

    # ANIMALS - MAMMALS
    "cat": ("animal", "pet", ["feline", "meow", "whiskers", "domestic", "fur", "paws", "tail", "purr"], "Animals & Pets", "Agile purring feline with sharp claws and soft fur."),
    "dog": ("animal", "pet", ["canine", "bark", "domestic", "fur", "paws", "tail", "friendly", "loyal"], "Animals & Pets", "Man's best friend who wags its tail and barks joyfully."),
    "rabbit": ("animal", "pet", ["bunny", "ears", "hop", "fur", "carrot", "small", "burrow"], "Animals & Pets", "Fluffy burrowing animal with long upright ears that hops."),
    "cow": ("animal", "farm_animal", ["bovine", "milk", "farm", "horns", "large", "grass", "moo"], "Animals & Farm", "Gentle farm grazer that provides milk and says moo."),
    "horse": ("animal", "farm_animal", ["equine", "ride", "farm", "mane", "hooves", "fast", "gallop"], "Animals & Farm", "Magnificent galloping companion with flowing mane."),
    "pig": ("animal", "farm_animal", ["swine", "farm", "pink", "mud", "snout", "oink", "curly_tail"], "Animals & Farm", "Pink barnyard friend with a round snout and curly tail."),
    "sheep": ("animal", "farm_animal", ["wool", "farm", "white", "fluffy", "lamb", "pasture", "baa"], "Animals & Farm", "Fluffy fleece-covered grazer that gives cozy wool."),
    "bear": ("animal", "wild_mammal", ["large", "fur", "claws", "forest", "hibernation", "brown", "predator"], "Animals & Wildlife", "Mighty forest mammal that catches salmon and hibernates."),
    "elephant": ("animal", "wild_mammal", ["trunk", "tusks", "large", "ears", "gray", "safari", "giant"], "Animals & Wildlife", "Majestic gentle giant with enormous ears and a long trunk."),
    "giraffe": ("animal", "wild_mammal", ["neck", "tall", "spots", "safari", "herbivore", "acacia"], "Animals & Wildlife", "Sky-high savanna browser with an impossibly long neck."),
    "kangaroo": ("animal", "wild_mammal", ["pouch", "hop", "australia", "tail", "marsupial", "joey"], "Animals & Wildlife", "Australian hopper carrying its joey safely in its pouch."),
    "lion": ("animal", "wild_mammal", ["feline", "mane", "safari", "predator", "roar", "king", "pride"], "Animals & Wildlife", "The majestic king of beasts sporting a golden mane."),
    "monkey": ("animal", "wild_mammal", ["primate", "tail", "tree", "jungle", "banana", "swing", "playful"], "Animals & Wildlife", "Clever primate swinging through jungle treetops by its tail."),
    "mouse": ("animal", "wild_mammal", ["rodent", "small", "cheese", "tail", "fur", "squeak", "trap"], "Animals & Wildlife", "Tiny squeaking rodent fond of nibbling on cheddar cheese."),
    "panda": ("animal", "wild_mammal", ["bear", "bamboo", "black_white", "china", "rare", "cute"], "Animals & Wildlife", "Beloved black-and-white bear munching on tender bamboo."),
    "raccoon": ("animal", "wild_mammal", ["mask", "tail", "stripes", "nocturnal", "clever", "bandit"], "Animals & Wildlife", "Masked nocturnal bandit with ringed tail and nimble paws."),
    "rhinoceros": ("animal", "wild_mammal", ["horn", "large", "safari", "heavy", "gray", "armor", "thick_skin"], "Animals & Wildlife", "Armored heavyweight wielding sturdy horns on its snout."),
    "squirrel": ("animal", "wild_mammal", ["rodent", "tree", "tail", "acorn", "nuts", "bushy_tail"], "Animals & Wildlife", "Bushy-tailed acrobat hoarding acorns in tree hollows."),
    "tiger": ("animal", "wild_mammal", ["feline", "stripes", "orange", "predator", "jungle", "stalk", "big_cat"], "Animals & Wildlife", "Fierce jungle hunter clad in orange fur and bold black stripes."),
    "zebra": ("animal", "wild_mammal", ["stripes", "black_white", "safari", "equine", "herd", "savanna"], "Animals & Wildlife", "Wild African equine draped in optical black-and-white stripes."),
    "bat": ("animal", "wild_mammal", ["wings", "flying", "night", "cave", "sonar", "echolocation"], "Animals & Wildlife", "Nocturnal winged mammal navigating caves with echolocation."),
    "hedgehog": ("animal", "wild_mammal", ["spines", "small", "curled", "nocturnal", "quills"], "Animals & Wildlife", "Small prickly creature that curls into a protective spiked ball."),

    # ANIMALS - BIRDS
    "bird": ("animal", "bird", ["feathers", "wings", "beak", "flying", "nest", "song"], "Animals & Birds", "Feathered sky dweller singing from tree branches."),
    "duck": ("animal", "bird", ["water", "quack", "feathers", "beak", "pond", "swimming", "webbed_feet"], "Animals & Birds", "Pond paddle bird with webbed feet and a cheerful quack."),
    "flamingo": ("animal", "bird", ["pink", "long_legs", "water", "feathers", "tropical", "wading"], "Animals & Birds", "Vibrant pink tropical wader standing gracefully on one leg."),
    "owl": ("animal", "bird", ["night", "wise", "eyes", "feathers", "nocturnal", "hoot", "silent_flight"], "Animals & Birds", "Wise nocturnal hunter with large forward-facing eyes."),
    "parrot": ("animal", "bird", ["colorful", "tropical", "feathers", "beak", "talk", "mimic", "jungle"], "Animals & Birds", "Brightly feathered chatterbox capable of repeating human speech."),
    "penguin": ("animal", "bird", ["antarctica", "cold", "swimming", "black_white", "tuxedo", "ice"], "Animals & Birds", "Flightless tuxedo bird waddling over polar ice and diving deep."),
    "swan": ("animal", "bird", ["white", "graceful", "water", "lake", "feathers", "long_neck"], "Animals & Birds", "Graceful pure-white waterfowl gliding across tranquil lakes."),

    # ANIMALS - SEA & REPTILES
    "fish": ("animal", "marine", ["water", "swimming", "fins", "scales", "ocean", "river", "gills"], "Sea Life & Ocean", "Aquatic creature breathing through gills and gliding with fins."),
    "crab": ("animal", "marine", ["claws", "shell", "beach", "ocean", "sideways", "pincers"], "Sea Life & Ocean", "Sideways-walking crustacean brandishing two sharp pincers."),
    "dolphin": ("animal", "marine", ["mammal", "ocean", "smart", "swimming", "fin", "blowhole", "playful"], "Sea Life & Ocean", "Playful aquatic genius leaping in bow waves with clicks and whistles."),
    "lobster": ("animal", "marine", ["claws", "shell", "ocean", "red", "seafood", "bottom_dweller"], "Sea Life & Ocean", "Heavily armored seafloor dweller with mighty crushing claws."),
    "octopus": ("animal", "marine", ["tentacles", "ocean", "ink", "smart", "eight_arms", "suction_cups"], "Sea Life & Ocean", "Eight-armed ocean marvel master of camouflage and ink clouds."),
    "sea turtle": ("animal", "marine", ["shell", "ocean", "swimming", "reptile", "beach", "nesting"], "Sea Life & Ocean", "Ancient mariner with flippers navigating vast open oceans."),
    "shark": ("animal", "marine", ["predator", "ocean", "teeth", "fin", "swimming", "dorsal_fin"], "Sea Life & Ocean", "Sleek apex predator cutting through blue depths with triangular dorsal fin."),
    "whale": ("animal", "marine", ["huge", "ocean", "mammal", "blowhole", "water", "song", "giant"], "Sea Life & Ocean", "Enormous leviathan breaching high with a plume from its blowhole."),
    "crocodile": ("animal", "reptile", ["teeth", "swamp", "water", "green", "scales", "jaws", "ancient"], "Reptiles & Amphibians", "Prehistoric river ambush predator with bone-crushing jaws."),
    "snake": ("animal", "reptile", ["slither", "scales", "long", "poison", "venom", "forked_tongue"], "Reptiles & Amphibians", "Legless slithering serpent flicking its forked tongue."),
    "frog": ("animal", "amphibian", ["green", "hop", "pond", "croak", "tongue", "lilypad"], "Reptiles & Amphibians", "Leaping amphibian with a sticky tongue croaking on lily pads."),
    "ant": ("animal", "insect", ["small", "colony", "six_legs", "worker", "ground", "anthill"], "Insects & Creepy Crawlies", "Tiny tireless worker hauling loads ten times its weight."),
    "bee": ("animal", "insect", ["honey", "yellow_black", "wings", "sting", "flower", "hive", "buzz"], "Insects & Creepy Crawlies", "Buzzing pollinator collecting sweet nectar to brew rich honey."),
    "butterfly": ("animal", "insect", ["wings", "colorful", "flower", "caterpillar", "flying", "cocoon"], "Insects & Creepy Crawlies", "Fluttering beauty that metamorphosed from a humble caterpillar."),
    "mosquito": ("animal", "insect", ["flying", "bite", "blood", "buzz", "small", "pest"], "Insects & Creepy Crawlies", "Pesky whining insect that leaves itchy red bites on summer nights."),
    "snail": ("animal", "mollusk", ["shell", "slow", "slime", "garden", "spiral"], "Insects & Creepy Crawlies", "Gentle slowpoke carrying its spiral home everywhere it crawls."),
    "spider": ("animal", "arachnid", ["web", "eight_legs", "creepy", "silk", "fangs"], "Insects & Creepy Crawlies", "Eight-legged silk weaver spinning intricate geometry to catch prey."),
    "dragon": ("animal", "mythical", ["fire", "wings", "myth", "scales", "treasure", "flying"], "Mythical & Fantasy", "Legendary winged beast breathing fiery plumes from atop hoards."),
    "mermaid": ("animal", "mythical", ["fish_tail", "human", "ocean", "myth", "singing"], "Mythical & Fantasy", "Mythic ocean siren with human torso and glistening fish tail."),

    # VEHICLES & TRANSPORTATION
    "airplane": ("transport", "air_vehicle", ["wings", "flying", "sky", "passengers", "jet", "travel", "runway"], "Vehicles & Travel", "Metal bird that soars above clouds carrying passengers abroad."),
    "flying saucer": ("transport", "air_vehicle", ["ufo", "space", "alien", "flying", "round", "disc"], "Vehicles & Travel", "Mysterious spinning disc piloted by visitors from distant stars."),
    "helicopter": ("transport", "air_vehicle", ["rotor", "blades", "flying", "sky", "propeller", "hover"], "Vehicles & Travel", "Aircraft that hovers vertically in place using whirling rotor blades."),
    "parachute": ("transport", "air_vehicle", ["sky", "falling", "jump", "canopy", "floating", "skydive"], "Vehicles & Travel", "Billowing nylon canopy that slows skydivers down safely."),
    "ambulance": ("transport", "emergency", ["hospital", "siren", "medical", "red_cross", "van", "paramedic"], "Emergency & Public", "Emergency vehicle with flashing beacons rushing patients to hospital."),
    "fire truck": ("transport", "emergency", ["fire", "ladder", "hose", "siren", "red", "hydrant"], "Emergency & Public", "Mighty crimson truck equipped with long ladders and high-pressure hoses."),
    "police car": ("transport", "emergency", ["siren", "cops", "blue_lights", "law", "patrol"], "Emergency & Public", "Patrol vehicle with dual blue and red sirens upholding neighborhood safety."),
    "bicycle": ("transport", "cycle", ["two_wheels", "pedals", "handlebars", "ride", "chain", "helmet"], "Vehicles & Cycles", "Two-wheeled human-powered ride balanced by pedals and handlebars."),
    "motorbike": ("transport", "cycle", ["engine", "fast", "two_wheels", "helmet", "ride", "throttle"], "Vehicles & Cycles", "Motorized two-wheeled machine roaring down highways."),
    "bus": ("transport", "road_vehicle", ["large", "passengers", "school", "transit", "wheels", "route"], "Vehicles & Travel", "Spacious passenger cruiser following regular city schedules."),
    "car": ("transport", "road_vehicle", ["automobile", "four_wheels", "drive", "road", "vehicle", "sedan"], "Vehicles & Travel", "Everyday four-wheeled automobile with engine, steering wheel, and trunk."),
    "pickup truck": ("transport", "road_vehicle", ["cargo", "bed", "heavy", "hauling", "wheels", "tailgate"], "Vehicles & Travel", "Workhorse vehicle with an open rear bed built for hauling cargo."),
    "tractor": ("transport", "farm_vehicle", ["farm", "fields", "large_wheels", "slow", "agriculture", "plow"], "Vehicles & Farm", "Rugged diesel workhorse with giant treaded rear wheels tilling fields."),
    "train": ("transport", "rail_vehicle", ["tracks", "locomotive", "railroad", "cars", "station", "whistle"], "Vehicles & Travel", "Chain of wagons pulled along steel tracks with a chugging whistle."),
    "cruise ship": ("transport", "water_vehicle", ["ocean", "vacation", "huge", "passengers", "boat", "luxury"], "Boats & Maritime", "Floating luxury city carrying thousands across calm blue seas."),
    "sailboat": ("transport", "water_vehicle", ["wind", "sails", "water", "lake", "mast", "canvas"], "Boats & Maritime", "Sleek vessel propelled across waterways solely by wind in its sails."),
    "submarine": ("transport", "water_vehicle", ["underwater", "ocean", "periscope", "deep", "sonar", "torpedo"], "Boats & Maritime", "Naval vessel navigating pitch-black ocean depths beneath waves."),

    # CLOTHING & ACCESSORIES
    "belt": ("clothing", "accessory", ["leather", "waist", "buckle", "pants", "tighten"], "Clothing & Fashion", "Leather band cinched around waist to hold trousers in place."),
    "bowtie": ("clothing", "formal", ["tie", "neck", "fancy", "suit", "knot", "tuxedo"], "Clothing & Fashion", "Smart knotted ribbon worn at collar for black-tie galas."),
    "bracelet": ("clothing", "jewelry", ["wrist", "metal", "gold", "silver", "jewelry", "bangle"], "Clothing & Fashion", "Decorative circlet fashioned from metals or beads around the wrist."),
    "crown": ("clothing", "headwear", ["king", "queen", "gold", "royal", "jewels", "head", "monarch"], "Clothing & Royalty", "Golden royal headpiece studded with sparkling precious gemstones."),
    "diamond": ("clothing", "jewelry", ["gem", "precious", "sparkle", "ring", "expensive", "crystal"], "Clothing & Jewelry", "Unbreakable sparkling carbon gem cut with brilliant facets."),
    "necklace": ("clothing", "jewelry", ["neck", "chain", "pendant", "gold", "jewelry", "collar"], "Clothing & Fashion", "Ornamental chain or pearl strand draped elegantly around the neck."),
    "pants": ("clothing", "bottoms", ["legs", "jeans", "trousers", "wear", "denim", "pockets"], "Clothing & Apparel", "Two-legged outerwear covering hips down to ankles."),
    "ring": ("clothing", "jewelry", ["finger", "gold", "diamond", "wedding", "jewelry", "band"], "Clothing & Jewelry", "Circular precious metal band slipped onto fingers during vows."),
    "shoe": ("clothing", "footwear", ["foot", "laces", "sole", "walking", "sneaker", "leather"], "Clothing & Footwear", "Sturdy outer footwear protecting soles with rubber tread."),
    "shorts": ("clothing", "bottoms", ["summer", "legs", "casual", "wear", "hot"], "Clothing & Apparel", "Comfortable warm-weather trousers cut above the knee."),
    "sock": ("clothing", "footwear", ["foot", "cotton", "warm", "shoe", "cozy"], "Clothing & Footwear", "Soft knitted cotton foot-covering tucked under shoes."),
    "hat": ("clothing", "headwear", ["head", "sun", "brim", "cap", "wear"], "Clothing & Apparel", "Protective or stylish headwear sporting a wide brim."),
    "jacket": ("clothing", "tops", ["zipper", "warm", "coat", "outerwear", "pockets"], "Clothing & Apparel", "Zipped or buttoned warm outer garment shielding against chill winds."),
    "flip flops": ("clothing", "footwear", ["beach", "summer", "sandals", "thong", "rubber"], "Clothing & Footwear", "Light rubber summer sandals that slap against your heel on beaches."),
    "purse": ("clothing", "accessory", ["handbag", "money", "wallet", "straps", "leather"], "Clothing & Fashion", "Fashionable handbag containing wallet, keys, and daily essentials."),
    "backpack": ("clothing", "bag", ["school", "straps", "books", "carry", "travel", "zipper"], "Bags & Accessories", "Dual-strapped canvas bag slung over shoulders for textbooks."),
    "suitcase": ("clothing", "bag", ["travel", "luggage", "handle", "clothes", "vacation", "wheels"], "Bags & Accessories", "Rectangular rolling luggage packed with wardrobes for trips."),

    # HOME & LIVING
    "alarm clock": ("home", "electronics", ["time", "morning", "wake_up", "ringing", "bedside", "buzzer"], "Home & Bedroom", "Bedside device whose loud morning buzzer interrupts your sleep."),
    "bed": ("home", "furniture", ["sleep", "mattress", "pillow", "blanket", "bedroom", "rest"], "Home & Bedroom", "Plush mattress crowned with pillows and blankets for restful sleep."),
    "chair": ("home", "furniture", ["sit", "seat", "four_legs", "table", "wooden", "backrest"], "Home & Furniture", "Single-person seat with four sturdy legs and supportive backrest."),
    "couch": ("home", "furniture", ["sofa", "living_room", "sit", "cushions", "comfort", "lounge"], "Home & Furniture", "Long cushioned lounge piece where families gather for movie nights."),
    "table": ("home", "furniture", ["dining", "wood", "surface", "legs", "meal", "desk"], "Home & Furniture", "Flat horizontal elevated wooden plane where feasts are served."),
    "dresser": ("home", "furniture", ["drawers", "clothes", "bedroom", "wood", "wardrobe"], "Home & Bedroom", "Tall chest of sliding wooden drawers organizing folded clothes."),
    "door": ("home", "building_part", ["entrance", "handle", "open", "close", "room", "lock"], "Home & Structure", "Hinged entrance barrier opened and shut using a rotating brass knob."),
    "sink": ("home", "plumbing", ["water", "faucet", "wash", "drain", "bathroom", "kitchen", "basin"], "Home & Bathroom", "Porcelain basin crowned with faucets for washing hands and dishes."),
    "toilet": ("home", "plumbing", ["bathroom", "flush", "water", "sanitary", "seat"], "Home & Bathroom", "Essential bathroom fixture that cleanses with a swirl flush."),
    "bathtub": ("home", "plumbing", ["water", "wash", "soak", "bathroom", "bubbles", "faucet"], "Home & Bathroom", "Deep basin for relaxing bubble baths and washing."),
    "pond": ("nature", "water", ["water", "fish", "frogs", "lily_pads", "calm", "freshwater"], "Waters & Nature", "Small tranquil body of still water dotted with lily pads."),
    "teddy-bear": ("item", "toy", ["plush", "stuffed", "cuddle", "fur", "toy", "childhood"], "Toys & Play", "Cuddly stuffed plush toy with soft round ears and button eyes."),
    "pillow": ("home", "bedding", ["soft", "sleep", "head", "bed", "cushion", "feathers"], "Home & Bedroom", "Soft downy cushion supporting tired heads in slumber."),
    "television": ("home", "electronics", ["screen", "watch", "remote", "shows", "living_room", "display"], "Home Electronics", "Flat screen display broadcasting sports, movies, and animations."),
    "cell phone": ("home", "electronics", ["mobile", "screen", "smartphone", "call", "pocket", "touch"], "Tech & Gadgets", "Pocket computer connected to cellular networks via touchscreen."),
    "computer": ("home", "electronics", ["pc", "desktop", "monitor", "keyboard", "tech", "work"], "Tech & Gadgets", "Workstation combining monitor, processor tower, and keyboard."),
    "laptop": ("home", "electronics", ["computer", "screen", "keyboard", "portable", "tech", "battery"], "Tech & Gadgets", "Foldable clamshell workstation powered by rechargeable lithium battery."),
    "camera": ("home", "electronics", ["photos", "lens", "flash", "pictures", "tripod", "shutter"], "Tech & Gadgets", "Optical device capturing precious moments through high-speed shutter."),
    "headphones": ("home", "electronics", ["music", "ears", "sound", "audio", "listen", "cushions"], "Tech & Audio", "Audio cups resting over ears delivering private musical melodies."),
    "radio": ("home", "electronics", ["music", "sound", "antenna", "broadcast", "audio", "tuner"], "Tech & Audio", "Wireless tuner receiver picking up sound broadcasts over airwaves."),
    "telephone": ("home", "electronics", ["call", "ring", "cord", "talk", "dial", "handset"], "Tech & Gadgets", "Vintage telecommunication handset connected by coiled curly wire."),
    "light bulb": ("home", "lighting", ["glow", "electric", "bright", "idea", "glass", "filament"], "Home Lighting", "Glass sphere glowing bright to spark creative genius ideas."),
    "floor lamp": ("home", "lighting", ["light", "stand", "shade", "tall", "living_room"], "Home Lighting", "Tall standing luminary throwing warm light from beneath shade."),
    "candle": ("home", "lighting", ["wax", "flame", "wick", "fire", "light", "scented"], "Home Lighting", "Wax cylinder harboring a dancing golden flame along its cotton wick."),
    "fireplace": ("home", "heating", ["hearth", "chimney", "wood", "flame", "warmth", "logs"], "Home & Warmth", "Stone hearth where crackling timber logs provide cozy winter warmth."),
    "campfire": ("nature", "fire", ["fire", "flames", "wood", "camping", "smoke", "marshmallows"], "Nature & Outdoor", "Outdoor circle of stones with crackling embers roasting marshmallows."),
    "microwave": ("home", "appliance", ["heat", "food", "kitchen", "fast", "cooking", "timer"], "Kitchen Appliances", "Electric countertop box warming leftover dinners in seconds."),
    "toaster": ("home", "appliance", ["bread", "toast", "breakfast", "heat", "kitchen", "pop_up"], "Kitchen Appliances", "Spring-loaded appliance popping up golden crispy bread slices."),

    # TOOLS & HARDWARE
    "anvil": ("tool", "heavy_tool", ["metal", "blacksmith", "heavy", "iron", "forge", "strike"], "Tools & Metalwork", "Heavy forged iron block upon which glowing metals are hammered."),
    "axe": ("tool", "hand_tool", ["wood", "chop", "blade", "handle", "tree", "lumberjack"], "Tools & Hand Tools", "Wedged steel blade on hickory handle chopping fire logs."),
    "broom": ("tool", "cleaning", ["sweep", "bristles", "floor", "dust", "handle", "straw"], "Cleaning & Home", "Long-handled bunch of bristles sweeping dust across floors."),
    "bucket": ("tool", "container", ["pail", "water", "handle", "mop", "plastic", "metal"], "Tools & Home", "Deep cylinder container with wire bail handle carrying water."),
    "hammer": ("tool", "hand_tool", ["nails", "hit", "metal", "wood", "tool", "carpentry", "claw"], "Tools & Hand Tools", "Clawed steel head driving iron nails into timber boards."),
    "knife": ("tool", "cutlery", ["blade", "sharp", "cut", "kitchen", "cooking", "slice"], "Cutlery & Tools", "Honed razor steel blade designed for slicing culinary ingredients."),
    "fork": ("tool", "cutlery", ["tines", "eat", "food", "tableware", "dinner", "prong"], "Cutlery & Tools", "Four-pronged stainless dining implement for spearing morsels."),
    "spoon": ("tool", "cutlery", ["soup", "eat", "food", "tableware", "scoop", "cereal"], "Cutlery & Tools", "Concave bowl tool for sipping broths and scooping cereals."),
    "ladder": ("tool", "hardware", ["climb", "rungs", "tall", "steps", "height", "extension"], "Tools & Hardware", "Pair of upright stiles joined by horizontal rungs for climbing high."),
    "paintbrush": ("tool", "art_tool", ["paint", "bristles", "art", "color", "canvas", "easel"], "Art & Creativity", "Fine tuft of camel bristles applying vibrant pigments onto canvas."),
    "scissors": ("tool", "hand_tool", ["cut", "paper", "blades", "two_loops", "sharp", "craft"], "Tools & Crafts", "Dual pivoted cutting blades with thumb and finger looped handles."),
    "screwdriver": ("tool", "hand_tool", ["screws", "turn", "handle", "fix", "tool", "tip"], "Tools & Hand Tools", "Shafted hand tool turning slotted or Phillips head fasteners."),
    "key": ("tool", "hardware", ["lock", "open", "door", "metal", "keyhole", "teeth"], "Hardware & Security", "Notched metal piece turning tumblers inside a deadbolt lock."),
    "shovel": ("tool", "gardening", ["dirt", "dig", "scoop", "blade", "handle", "garden"], "Tools & Garden", "Broad curved blade on long shank for scooping soil and gravel."),

    # NATURE, LANDSCAPE & WEATHER
    "beach": ("nature", "landscape", ["sand", "ocean", "sea", "sun", "waves", "shore"], "Nature & Outdoors", "Sandy shoreline kissed by rolling waves and warm coastal sunshine."),
    "bush": ("nature", "flora", ["shrub", "leaves", "green", "garden", "plant", "hedge"], "Plants & Nature", "Dense low-growing cluster of woody leafy stems."),
    "cactus": ("nature", "flora", ["desert", "spikes", "green", "dry", "succulent", "thorns"], "Plants & Nature", "Desert succulent armored with defensive needles storing vital water."),
    "cloud": ("nature", "weather", ["sky", "rain", "fluffy", "white", "gray", "cumulus"], "Weather & Skies", "Fluffy vapor condensation drifting lazily across blue skies."),
    "flower": ("nature", "flora", ["petals", "stem", "bloom", "colorful", "garden", "blossom"], "Plants & Nature", "Fragrant blossoms opening colorful petals to morning sunbeams."),
    "grass": ("nature", "flora", ["green", "lawn", "ground", "field", "blades", "meadow"], "Plants & Nature", "Carpet of verdant blades blanketing meadow soils."),
    "lightning": ("nature", "weather", ["thunder", "storm", "flash", "electric", "sky", "bolt"], "Weather & Skies", "Blinding zigzag electric discharge crackling across stormy clouds."),
    "moon": ("nature", "celestial", ["night", "sky", "crater", "crescent", "orbit", "lunar"], "Cosmos & Night", "Earth's silver celestial companion waxing and waning through orbits."),
    "mountain": ("nature", "landscape", ["peak", "climb", "rock", "snow", "tall", "high", "ridge"], "Nature & Outdoors", "Towering rocky geological giant piercing clouds with snowy summits."),
    "ocean": ("nature", "water", ["sea", "waves", "water", "deep", "blue", "marine", "tide"], "Waters & Oceans", "Vast expanse of deep saltwater covering over seventy percent of Earth."),
    "palm tree": ("nature", "flora", ["tropical", "coconuts", "beach", "fronds", "tree", "oasis"], "Plants & Nature", "Tall tropical trunk crowned with waving fan fronds bearing coconuts."),
    "rain": ("nature", "weather", ["water", "drops", "storm", "clouds", "umbrella", "shower"], "Weather & Skies", "Liquid sky drops replenishing thirsty rivers and green gardens."),
    "rainbow": ("nature", "weather", ["colors", "sky", "arch", "rain", "sun", "prism"], "Weather & Skies", "Seven-colored celestial arch painted by refracted sun through mist."),
    "river": ("nature", "water", ["flowing", "water", "stream", "banks", "current", "meander"], "Waters & Oceans", "Natural ribbon of freshwater flowing steadily down toward oceans."),
    "snowflake": ("nature", "weather", ["winter", "cold", "ice", "crystal", "snow", "six_sided"], "Weather & Skies", "Delicate hexagonal ice crystal fluttering softly during blizzards."),
    "star": ("nature", "celestial", ["night", "sky", "twinkle", "space", "astronomy", "glow"], "Cosmos & Night", "Distant nuclear furnace twinkling millions of light-years away."),
    "sun": ("nature", "celestial", ["day", "light", "yellow", "heat", "solar", "warm", "daylight"], "Cosmos & Night", "Blazing golden star radiating light and life across our system."),
    "tree": ("nature", "flora", ["trunk", "branches", "leaves", "wood", "forest", "roots"], "Plants & Nature", "Perennial woody giant spreading shady boughs and leafy crowns."),
    "umbrella": ("item", "weather_gear", ["rain", "canopy", "handle", "shelter", "waterproof", "shade"], "Gear & Outdoors", "Collapsible waterproof dome shielding commuters from downpours."),
    "snowman": ("nature", "winter", ["snow", "carrot", "coal", "winter", "scarf", "cold"], "Winter & Fun", "Figure rolled from packed snowballs with a carrot nose and coal eyes."),

    # ARCHITECTURE & BUILDINGS
    "The Eiffel Tower": ("architecture", "landmark", ["paris", "france", "tower", "metal", "monument", "wrought_iron"], "Famous Landmarks", "Latticed wrought-iron French monument rising high above Paris."),
    "The Mona Lisa": ("art", "landmark", ["painting", "portrait", "da_vinci", "museum", "art", "louvre"], "Art & Masterpieces", "Da Vinci's enigmatic smiling portrait housed inside the Louvre."),
    "bridge": ("architecture", "infrastructure", ["cross", "river", "road", "arch", "support", "suspension"], "Architecture & Roads", "Engineered crossing spanning chasms or rivers for road traffic."),
    "castle": ("architecture", "historic", ["fortress", "towers", "medieval", "stone", "king", "moat"], "Historic Castles", "Medieval stone fortress flanked by turrets, ramparts, and moats."),
    "church": ("architecture", "building", ["cross", "steeple", "worship", "bell", "religion", "spire"], "Buildings & Places", "Sanctuary with stained glass and tall bell tower spire."),
    "hospital": ("architecture", "building", ["medical", "doctors", "emergency", "health", "care", "clinic"], "Buildings & Places", "Healing center staffed by physicians and nurses aiding the unwell."),
    "house": ("architecture", "dwelling", ["home", "roof", "door", "windows", "chimney", "family", "suburb"], "Homes & Housing", "Cozy dwelling where families gather under protective tiled roofs."),
    "tent": ("architecture", "dwelling", ["camping", "canvas", "outdoor", "poles", "sleep", "shelter"], "Homes & Housing", "Portable canvas shelter pitched on grassy campgrounds under stars."),

    # MUSIC & SPORTS
    "drums": ("music", "percussion", ["beat", "sticks", "cymbal", "snare", "rhythm", "bang"], "Music & Instruments", "Percussion kit struck with wooden sticks to keep infectious rhythms."),
    "guitar": ("music", "strings", ["acoustic", "electric", "strings", "chords", "play", "fretboard"], "Music & Instruments", "Six-stringed wooden instrument plucked and strummed to play chords."),
    "microphone": ("music", "audio", ["sing", "voice", "sound", "stage", "karaoke", "vocal"], "Music & Audio", "Handheld sound transducer amplifying singers on concert stages."),
    "trumpet": ("music", "wind", ["brass", "valves", "horn", "jazz", "loud", "fanfare"], "Music & Instruments", "Bright brass horn with three valves sounding celebratory fanfares."),
    "saxophone": ("music", "wind", ["brass", "jazz", "reed", "golden", "instrument", "keys"], "Music & Instruments", "Curved brass woodwind producing soulful blues and jazz melodies."),
    "harp": ("music", "strings", ["angel", "plucked", "strings", "classical", "frame"], "Music & Instruments", "Graceful triangular frame strung with plucked heavenly nylon strings."),
    "baseball": ("sports", "ball_game", ["bat", "ball", "glove", "pitcher", "homerun", "diamond"], "Sports & Games", "White cowhide sphere stitched with red seams struck by bats."),
    "basketball": ("sports", "ball_game", ["hoop", "dribble", "orange_ball", "dunk", "court", "rebound"], "Sports & Games", "Pebbled orange ball bounced across hardwood courts toward hoops."),
    "soccer ball": ("sports", "ball_game", ["kick", "black_white", "goal", "pitch", "fifa", "world_cup"], "Sports & Games", "Iconic sphere of stitched black pentagons kicked into net goals."),
    "tennis racquet": ("sports", "racket_game", ["strings", "tennis_ball", "serve", "court", "ace"], "Sports & Games", "Strung oval paddle wielded to volley felt balls over nets."),
    "hockey puck": ("sports", "hockey", ["ice", "black", "rubber", "game", "rink"], "Sports & Games", "Dense vulcanized black rubber disc gliding across frozen ice rinks."),
    "roller coaster": ("entertainment", "rides", ["amusement_park", "tracks", "speed", "thrill", "loop", "cars"], "Attractions & Fun", "Thrill ride cart screaming along twisting tubular steel tracks."),

    # BODY PARTS
    "angel": ("body", "mythical", ["halo", "wings", "heaven", "divine", "spirit"], "Mythical & Human", "Benevolent heavenly guardian adorned with radiant halo and wings."),
    "eye": ("body", "sense_organ", ["see", "vision", "pupil", "iris", "look", "eyelashes"], "Body Parts", "Sensory organ focusing light through iris and pupil to perceive world."),
    "ear": ("body", "sense_organ", ["hear", "sound", "listen", "head", "lobe"], "Body Parts", "Auditory flap on the side of head catching whispers and symphonies."),
    "mouth": ("body", "face", ["lips", "teeth", "tongue", "eat", "speak", "smile"], "Body Parts", "Facial opening housing teeth and tongue for speaking and smiling."),
    "nose": ("body", "face", ["smell", "breathe", "nostrils", "face", "sniff"], "Body Parts", "Facial projection bearing twin nostrils for breathing and smelling."),
    "hand": ("body", "extremity", ["fingers", "palm", "hold", "wave", "grasp", "thumb"], "Body Parts", "Five-fingered end of arm skilled in crafting, waving, and grasping."),
    "foot": ("body", "extremity", ["toes", "walk", "shoe", "leg", "heel", "arch"], "Body Parts", "Arched foundation at base of leg taking thousands of steps daily."),
    "tooth": ("body", "mouth", ["white", "bite", "chew", "dental", "enamel", "incisor"], "Body Parts", "Hard white enamel pillar rooted in gums for chewing meals."),
    "brain": ("body", "organ", ["mind", "think", "head", "intelligence", "neural", "synapse"], "Body Parts", "Folded neural organ inside skull generating thoughts and dreams."),
    "skull": ("body", "bone", ["skeleton", "head", "bone", "death", "teeth", "cranium"], "Body Parts", "Bony cranium framework safeguarding neural tissue."),
    "basket": ("item", "container", ["woven", "picnic", "carry", "handle", "wicker"], "Containers & Items", "Woven wicker vessel with handle for carrying picnics."),
    "beard": ("body", "facial_hair", ["chin", "hair", "man", "face", "whiskers"], "Body & Appearance", "Facial hair flourishing along chin and jawline."),
    "binoculars": ("item", "optics", ["see", "far", "lenses", "birdwatching", "eyes"], "Optics & Tools", "Dual lenses magnifying distant horizon vistas."),
    "book": ("item", "reading", ["pages", "read", "cover", "library", "words", "author"], "Reading & Office", "Bound paper pages conveying stories and knowledge."),
    "boomerang": ("sports", "toy", ["throw", "return", "wood", "curve", "australia"], "Sports & Toys", "Curved wooden throwing blade returning to thrower."),
    "bottlecap": ("item", "container", ["bottle", "metal", "seal", "pry", "drink"], "Containers & Items", "Fluted metal cap sealing carbonated beverage bottles."),
    "calculator": ("home", "electronics", ["math", "numbers", "buttons", "screen", "add"], "Office & Gadgets", "Handheld digital screen crunching mathematical sums."),
    "circle": ("geometry", "shape", ["round", "ring", "loop", "geometry", "curve"], "Shapes & Geometry", "Perfect continuous curved loop equidistant from center."),
    "compass": ("tool", "navigation", ["north", "needle", "direction", "magnet", "map"], "Tools & Travel", "Magnetic needle pointing steadfastly toward magnetic north."),
    "dumbbell": ("sports", "fitness", ["weights", "gym", "muscle", "workout", "lift"], "Sports & Fitness", "Handheld weighted bar hoisted during gym workouts."),
    "elbow": ("body", "joint", ["arm", "bend", "joint", "bones"], "Body Parts", "Hinged arm joint enabling your forearm to bend."),
    "envelope": ("item", "office", ["mail", "letter", "stamp", "paper", "send"], "Office & Mail", "Folded paper packet holding letters for postal delivery."),
    "eraser": ("item", "office", ["rubber", "pencil", "mistake", "clean", "school"], "Stationery & School", "Rubber bar wiping away accidental graphite pencil marks."),
    "eyeglasses": ("item", "optics", ["eyes", "see", "lenses", "frames", "vision"], "Optics & Fashion", "Framed corrective glass lenses perched on bridge of nose."),
    "fire hydrant": ("transport", "emergency", ["water", "fire", "street", "red", "hose"], "Emergency & City", "Street-corner iron casting supplying water for fire hoses."),
    "flashlight": ("home", "lighting", ["beam", "portable", "battery", "dark", "light"], "Lighting & Tools", "Handheld battery torch casting a bright beam through darkness."),
    "garden": ("nature", "flora", ["flowers", "plants", "vegetables", "green", "soil"], "Nature & Gardening", "Cultivated patch of flourishing blossoms and green herbs."),
    "hockey stick": ("sports", "hockey", ["ice", "wood", "slapshot", "puck", "sport"], "Sports & Games", "Curved shaft used by ice players to strike the black puck."),
    "hourglass": ("home", "time", ["sand", "time", "glass", "minutes", "trickle"], "Time & Antiques", "Twin glass bulbs where flowing sand measures passing minutes."),
    "house plant": ("nature", "flora", ["pot", "indoor", "leaves", "green", "water"], "Plants & Home", "Potted leafy green botanical thriving on sunny windowsills."),
    "hurricane": ("nature", "weather", ["storm", "wind", "cyclone", "rain", "ocean"], "Weather & Disasters", "Enormous rotating ocean cyclone with gale winds and torrential rains."),
    "jail": ("architecture", "building", ["bars", "prison", "cells", "crime", "guard"], "Buildings & Places", "Fortified holding facility with iron bars behind high walls."),
    "knee": ("body", "joint", ["leg", "bend", "joint", "patella", "walk"], "Body Parts", "Crucial leg hinge cushioned by patella enabling walking and running."),
    "lantern": ("home", "lighting", ["light", "handle", "glass", "flame", "camp"], "Lighting & Outdoor", "Portable glass-walled beacon carrying a glowing wick or bulb."),
    "leaf": ("nature", "flora", ["tree", "green", "fall", "photosynthesis", "veins"], "Plants & Nature", "Verdant flat blade harnessing sunlight through photosynthesis."),
    "lighter": ("home", "fire", ["flame", "spark", "pocket", "fire", "fuel"], "Tools & Everyday", "Pocket gadget flicking a miniature flint spark to kindle flame."),
    "mailbox": ("item", "outdoor", ["mail", "letters", "post", "flag", "curb"], "City & Outdoor", "Curbside metal box awaiting the postal carrier with its red flag."),
    "map": ("item", "navigation", ["geography", "roads", "paper", "world", "travel"], "Travel & Navigation", "Cartographic diagram charting terrain, borders, and roadways."),
    "matches": ("home", "fire", ["strike", "sulfur", "wood", "flame", "box"], "Tools & Everyday", "Thin wooden splints tipped with sulfur sparking quick fire."),
    "nail": ("tool", "hardware", ["hammer", "iron", "fastener", "metal", "wood"], "Tools & Hardware", "Slender pointed steel spike driven into lumber to fasten joints."),
    "paper clip": ("item", "office", ["wire", "bind", "paper", "office", "metal"], "Office & Stationery", "Bent springy steel wire looping stacks of paper neatly together."),
    "pencil": ("item", "stationery", ["graphite", "wood", "write", "draw", "yellow"], "Stationery & School", "Slender cedar wood shaft housing a core of writing graphite."),
    "picture frame": ("home", "decor", ["photo", "wall", "border", "wood", "art"], "Home Decor", "Decorative wood or gilt border framing cherished family portraits."),
    "power outlet": ("home", "electronics", ["electric", "plug", "wall", "voltage", "socket"], "Home Electronics", "Wall-mounted dual socket delivering alternating current electricity."),
    "remote control": ("home", "electronics", ["buttons", "tv", "channels", "handheld", "infrared"], "Tech & Gadgets", "Handheld infrared wand switching channels and volume on televisions."),
    "rollerskates": ("sports", "cycle", ["wheels", "skating", "shoes", "gliding", "rink"], "Sports & Fun", "Wheeled boot harness gliding rhythmically around wooden rinks."),
    "see saw": ("sports", "playground", ["plank", "teeter", "play", "pivot", "kids"], "Parks & Playgrounds", "Pivoting balanced plank teetering up and down on playgrounds."),
    "smiley face": ("art", "symbol", ["smile", "happy", "yellow", "eyes", "joy"], "Symbols & Art", "Cheerful bright yellow circle sporting twin dots and a wide grin."),
    "spreadsheet": ("item", "office", ["grid", "cells", "numbers", "excel", "data"], "Office & Computing", "Grid of numerical rows and columns calculating financial data."),
    "stairs": ("architecture", "infrastructure", ["steps", "climb", "flights", "building", "levels"], "Architecture & Structure", "Ascending flight of rhythmic steps connecting building floors."),
    "stethoscope": ("tool", "medical", ["heartbeat", "doctor", "ears", "pulse", "medicine"], "Medical & Health", "Acoustic medical chest piece listening to heart valves and lungs."),
    "stop sign": ("transport", "traffic", ["red", "octagon", "halt", "intersection", "road"], "Traffic & Roads", "Bright red octagonal roadside beacon commanding drivers to halt."),
    "streetlight": ("transport", "lighting", ["pole", "lamp", "night", "road", "city"], "City & Lighting", "High-standing luminary illuminating nocturnal avenues."),
    "swing set": ("sports", "playground", ["chains", "seat", "pump", "park", "flying"], "Parks & Playgrounds", "Chained wooden seat suspended from overhead beams for swinging high."),
    "sword": ("tool", "weapon", ["blade", "steel", "hilt", "knight", "sharp"], "History & Arms", "Honed double-edged steel blade brandished by knights of yore."),
    "syringe": ("tool", "medical", ["needle", "injection", "vaccine", "medicine", "doctor"], "Medical & Health", "Calibrated plunger needle delivering lifesaving liquid medicine."),
    "traffic light": ("transport", "traffic", ["red", "yellow", "green", "intersection", "signals"], "Traffic & Roads", "Trio of red, amber, and emerald signals directing intersection flow."),
    "vase": ("home", "decor", ["flowers", "ceramic", "water", "table", "decorative"], "Home Decor", "Ornamental porcelain urn displaying freshly cut floral bouquets."),
    "yoga": ("sports", "fitness", ["pose", "stretch", "mindful", "mat", "meditation"], "Health & Fitness", "Mindful discipline of breathwork and limber physical postures."),
    "zigzag": ("geometry", "shape", ["angles", "sharp", "pattern", "geometry", "teeth"], "Shapes & Geometry", "Sharp alternating jagged line zigzagging between opposing vertices."),
}

class ContextoService:
    def __init__(self):
        self.taxonomy = TAXONOMY
        self._classes_cache: List[dict] = []
        self._load_classes()

    def _load_classes(self):
        try:
            from app.config import CLASSES_JSON_PATH
            if os.path.exists(CLASSES_JSON_PATH):
                with open(CLASSES_JSON_PATH, "r", encoding="utf-8") as f:
                    data = json.load(f)
                for item in data.get("classes", []):
                    if item.get("label") != "removed":
                        self._classes_cache.append(item)
        except Exception as e:
            logger.warning(f"Could not load curated classes: {e}")

    def get_all_active_words(self) -> List[str]:
        if self._classes_cache:
            return [c["class_name"] for c in self._classes_cache]
        return list(self.taxonomy.keys())

    def get_random_target(self, difficulty: Optional[str] = None) -> dict:
        candidates = self._classes_cache if self._classes_cache else []
        if difficulty and candidates:
            filtered = [c for c in candidates if c.get("label", "").lower() == difficulty.lower()]
            if filtered:
                candidates = filtered

        if candidates:
            chosen = random.choice(candidates)
            cname = chosen["class_name"]
            cid = chosen["id"]
            diff = chosen.get("label", "easy")
        else:
            cname = random.choice(list(self.taxonomy.keys()))
            cid = 0
            diff = "easy"

        # Lookup taxonomy entry
        tax = self.taxonomy.get(cname.lower()) or self.taxonomy.get(cname)
        category_hint = tax[3] if tax else "Everyday Object"
        semantic_clue = tax[4] if tax else f"A common doodle of {cname}"

        return {
            "target_id": cid,
            "prompt": cname,
            "difficulty": diff,
            "category_hint": category_hint,
            "semantic_clue": semantic_clue
        }

    def compute_similarity(self, word1: str, word2: str) -> float:
        w1 = word1.strip().lower()
        w2 = word2.strip().lower()

        if w1 == w2:
            return 1.0

        t1 = self.taxonomy.get(w1)
        t2 = self.taxonomy.get(w2)

        if not t1 or not t2:
            # Fallback based on character overlap and string distance
            common_chars = len(set(w1) & set(w2))
            return min(0.35, max(0.05, (common_chars / max(len(w1), len(w2))) * 0.35))

        dom1, sub1, tags1, _, _ = t1
        dom2, sub2, tags2, _, _ = t2

        score = 0.05
        # Same domain
        if dom1 == dom2:
            score += 0.35

        # Same subcategory
        if sub1 == sub2:
            score += 0.35

        # Tag Jaccard similarity
        s1, s2 = set(tags1), set(tags2)
        if s1 and s2:
            overlap = len(s1 & s2)
            union = len(s1 | s2)
            if union > 0:
                score += (overlap / union) * 0.25

        return min(0.99, round(score, 3))

    def evaluate_guess(self, target_word: str, guessed_word: str) -> dict:
        t_clean = target_word.strip().lower()
        g_clean = guessed_word.strip().lower()

        all_words = self.get_all_active_words()
        word_set = set(w.lower() for w in all_words)
        word_set.add(t_clean)
        word_set.add(g_clean)

        # Compute similarity of all words against target_word
        scored_words = []
        for w in word_set:
            sim = self.compute_similarity(t_clean, w)
            scored_words.append((w, sim))

        # Sort descending by similarity, ensuring target itself ranks #1
        scored_words.sort(key=lambda x: (x[1], x[0] == t_clean), reverse=True)

        # Find 1-indexed rank of guessed_word
        rank = 1
        guess_sim = 1.0 if t_clean == g_clean else 0.0
        for idx, (w, sim) in enumerate(scored_words, 1):
            if w == g_clean:
                rank = idx
                guess_sim = sim
                break

        is_match = (rank == 1) or (t_clean == g_clean)
        if is_match:
            rank = 1
            guess_sim = 1.0

        # Proximity temperature (Hot 1-20, Warm 21-60, Cold 61+)
        if rank <= 20:
            proximity = "hot"
            color = "#10b981"  # Emerald green
        elif rank <= 60:
            proximity = "warm"
            color = "#f59e0b"  # Amber
        else:
            proximity = "cold"
            color = "#ef4444"  # Red

        sim_pct = round(guess_sim * 100.0, 1)

        return {
            "target_word": target_word,
            "guessed_word": guessed_word,
            "is_match": is_match,
            "rank": rank,
            "total_words": len(scored_words),
            "similarity": sim_pct,
            "proximity": proximity,
            "color": color
        }

    def get_hint(self, target_word: str, level: int = 1) -> dict:
        t_clean = target_word.strip().lower()
        tax = self.taxonomy.get(t_clean)
        category_name = tax[3] if tax else "General Object"
        semantic_clue = tax[4] if tax else "A well-known everyday object."

        if level == 1:
            return {
                "level": 1,
                "type": "category",
                "hint": f"Category: {category_name}"
            }
        elif level == 2:
            first_letter = target_word[0].upper()
            word_len = len(target_word.replace(" ", ""))
            return {
                "level": 2,
                "type": "letters",
                "hint": f"Starts with '{first_letter}' • {word_len} letters ({category_name})"
            }
        else:
            return {
                "level": 3,
                "type": "clue",
                "hint": f"Clue: {semantic_clue}"
            }

contexto_service = ContextoService()
