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

export function getColumnCount(type) {
  const order = CRITTERPEDIA_ORDER[type];
  return order ? Math.ceil(order.length / GRID_ROWS) : 0;
}
