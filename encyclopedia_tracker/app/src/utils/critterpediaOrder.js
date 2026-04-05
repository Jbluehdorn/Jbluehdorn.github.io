// Critterpedia display order (matches the in-game grid layout)
// The in-game grid uses COLUMN-MAJOR order: creatures fill top-to-bottom
// within each column, then move to the next column to the right.
// Grid has 5 visible rows. Column count varies by creature type.
//
// Example (fish): Column 0 = Bitterling(row0), Pale chub(row1), Crucian carp(row2),
//   Dace(row3), Carp(row4). Column 1 = Koi(row0), Goldfish(row1), ...
//
// To convert list index → grid position:  col = floor(index / GRID_ROWS), row = index % GRID_ROWS
// To convert grid position → list index:  index = col * GRID_ROWS + row

export const CRITTERPEDIA_ORDER = {
  fish: [
    "Bitterling","Pale chub","Crucian carp","Dace","Carp",
    "Koi","Goldfish","Pop-eyed goldfish","Ranchu goldfish","Killifish",
    "Crawfish","Soft-shelled turtle","Snapping turtle","Tadpole","Frog",
    "Freshwater goby","Loach","Catfish","Giant snakehead","Bluegill",
    "Yellow perch","Black bass","Tilapia","Pike","Pond smelt",
    "Sweetfish","Cherry salmon","Char","Golden trout","Stringfish",
    "Salmon","King salmon","Mitten crab","Guppy","Nibble fish",
    "Angelfish","Betta","Neon tetra","Rainbowfish","Piranha",
    "Arowana","Dorado","Gar","Arapaima","Saddled bichir",
    "Sturgeon","Sea butterfly","Sea horse","Clown fish","Surgeonfish",
    "Butterfly fish","Napoleonfish","Zebra turkeyfish","Blowfish","Puffer fish",
    "Anchovy","Horse mackerel","Barred knifejaw","Sea bass","Red snapper",
    "Dab","Olive flounder","Squid","Moray eel","Ribbon eel",
    "Tuna","Blue marlin","Giant trevally","Mahi-mahi","Ocean sunfish",
    "Ray","Saw shark","Hammerhead shark","Great white shark","Whale shark",
    "Suckerfish","Football fish","Oarfish","Barreleye","Coelacanth"
  ],
  insects: [
    "Common butterfly","Yellow butterfly","Tiger butterfly","Peacock butterfly","Common bluebottle",
    "Paper kite butterfly","Great purple emperor","Monarch butterfly","Emperor butterfly","Agrias butterfly",
    "Rajah Brooke's birdwing","Queen Alexandra's birdwing","Moth","Atlas moth","Madagascan sunset moth",
    "Long locust","Migratory locust","Rice grasshopper","Grasshopper","Cricket",
    "Bell cricket","Mantis","Orchid mantis","Honeybee","Wasp",
    "Brown cicada","Robust cicada","Giant cicada","Walker cicada","Evening cicada",
    "Cicada shell","Red dragonfly","Darner dragonfly","Banded dragonfly","Damselfly",
    "Firefly","Mole cricket","Pondskater","Diving beetle","Giant water bug",
    "Stinkbug","Man-faced stink bug","Ladybug","Tiger beetle","Jewel beetle",
    "Violin beetle","Citrus long-horned beetle","Rosalia batesi beetle","Blue weevil beetle","Dung beetle",
    "Earth-boring dung beetle","Scarab beetle","Drone beetle","Goliath beetle","Saw stag",
    "Miyama stag","Giant stag","Rainbow stag","Cyclommatus stag","Golden stag",
    "Giraffe stag","Horned dynastid","Horned atlas","Horned elephant","Horned hercules",
    "Walking stick","Walking leaf","Bagworm","Ant","Hermit crab",
    "Wharf roach","Fly","Mosquito","Flea","Snail",
    "Pill bug","Centipede","Spider","Tarantula","Scorpion"
  ],
  "sea-creatures": [
    "Seaweed","Sea grapes","Sea cucumber","Sea pig","Sea star",
    "Sea urchin","Slate pencil urchin","Sea anemone","Moon jellyfish","Sea slug",
    "Pearl oyster","Mussel","Oyster","Scallop","Whelk",
    "Turban shell","Abalone","Gigas giant clam","Chambered nautilus","Octopus",
    "Umbrella octopus","Vampire squid","Firefly squid","Gazami crab","Dungeness crab",
    "Snow crab","Red king crab","Acorn barnacle","Spider crab","Tiger prawn",
    "Sweet shrimp","Mantis shrimp","Spiny lobster","Lobster","Giant isopod",
    "Horseshoe crab","Sea pineapple","Spotted garden eel","Flatworm","Venus' flower basket"
  ],
};

export const GRID_ROWS = 5;

// Get the number of columns for a creature type
export function getColumnCount(type) {
  const order = CRITTERPEDIA_ORDER[type];
  return order ? Math.ceil(order.length / GRID_ROWS) : 0;
}

// Get the name of the first creature in each visible column (for scroll offset UI)
export function getColumnStarts(type) {
  const order = CRITTERPEDIA_ORDER[type];
  if (!order) return [];
  const starts = [];
  for (let col = 0; col < Math.ceil(order.length / GRID_ROWS); col++) {
    starts.push({ col, name: order[col * GRID_ROWS] });
  }
  return starts;
}
