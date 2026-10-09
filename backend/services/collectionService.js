import Collection from '../module/collection.js';

// Mirrors the original hardcoded collection banner metadata so the backend
// stays the single source of truth for collection page copy and imagery.
const collectionSeeds = [
  {
    kind: 'arrivals',
    eyebrow: 'Sola / All',
    title: 'All new arrivals',
    description:
      'The complete summer edit: fresh shapes, saturated color and instant everyday favorites.',
    image: '/assets/image9.jpeg',
    imageAlt: 'Model wearing a relaxed green overshirt in a fashion studio',
    imageLabel: "Summer edit ’25",
    tone: 'cream',
  },
  {
    kind: 'women',
    eyebrow: 'Sola / Women',
    title: 'Made for her',
    description:
      'Fluid layers, bold color and everyday ease—pieces that work as hard as you do.',
    image: '/assets/image2.jpeg',
    imageAlt: 'Model wearing a vivid orange look outdoors',
    imageLabel: "The women’s edit",
    tone: 'cream',
  },
  {
    kind: 'men',
    eyebrow: 'Sola / Men',
    title: 'Made for him',
    description:
      'Relaxed tailoring and hardworking essentials, designed for every plan and no plan at all.',
    image: '/assets/image7.jpeg',
    imageAlt: 'Models wearing expressive red and orange looks',
    imageLabel: "The men’s edit",
    tone: 'cream',
  },
  {
    kind: 'sale',
    eyebrow: 'Up to 40% off selected styles',
    title: 'The bright side of sale',
    description: 'Last chances, first choices. Considered pieces at a little less.',
    image: '/assets/image7.jpeg',
    imageAlt: 'Models wearing colorful outfits in a fashion campaign',
    imageLabel: "Summer edit ’25",
    tone: 'orange',
  },
];

export async function seedCollectionsIfEmpty() {
  const count = await Collection.countDocuments();
  if (count > 0) return;

  await Collection.insertMany(collectionSeeds);
  console.log(`Seeded ${collectionSeeds.length} collections`);
}

export async function getAllCollections() {
  return Collection.find({ active: true }).sort({ kind: 1 });
}

export async function getCollectionByKind(kind) {
  return Collection.findOne({ kind, active: true });
}

export async function upsertCollection(kind, data) {
  return Collection.findOneAndUpdate(
    { kind },
    { ...data, kind },
    { new: true, upsert: true, runValidators: true, context: 'query' },
  );
}

export async function deleteCollection(kind) {
  return Collection.findOneAndUpdate(
    { kind },
    { active: false },
    { new: true },
  );
}