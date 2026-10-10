import Journal from '../module/journal.js';

const journalSeeds = [
  {
    slug: 'meet-the-makers',
    category: 'Studio visit',
    title: "Meet the makers: inside our Copenhagen color lab",
    summary: 'A closer look at the hands, ideas, and careful work behind every collection.',
    readTime: '6 min read',
    image: '/assets/image5.jpeg',
    alt: 'Garment maker working at a sewing machine',
    paragraphs: [
      'Every collection starts with a conversation: about color, comfort, and the pieces we reach for again and again. In our Copenhagen studio, those ideas move from a wall of fabric swatches to a first pattern on the table.',
      'We work in considered runs with independent makers. That lets us spend more time on fit, finish, and the small details that make an everyday layer feel personal.',
      'The color lab is less a room than a way of working: test, wear, adjust, and make only what deserves a place in your wardrobe.',
    ],
  },
  {
    slug: 'creative-director-ana',
    category: 'People',
    title: 'How creative director Ana moves through the city',
    summary: 'A day of studio visits, long walks, and the uniform that goes everywhere.',
    readTime: '4 min read',
    image: '/assets/image4.jpeg',
    alt: 'Designer reviewing a garment sketch in the studio',
    paragraphs: [
      "Ana's days rarely follow the same route twice. A morning fitting can turn into a fabric visit, then a long walk home with a notebook full of ideas.",
      'Her uniform is built for that movement: soft layers, a useful pocket, and color that feels good in changing light.',
      'We asked her what makes a piece last. Her answer was simple: it should feel like you from the first wear, and leave room for the next version of you.',
    ],
  },
  {
    slug: 'natural-texture',
    category: 'Materials',
    title: 'The quiet beauty of natural texture',
    summary: 'Why the feel of a fabric matters as much as the way it looks.',
    readTime: '5 min read',
    image: '/assets/image6.jpeg',
    alt: 'A selection of natural fabrics and textured materials',
    paragraphs: [
      'Texture is often the first thing you notice when you reach for a garment. The soft grain of cotton, the dry hand of linen, or the reassuring weight of a knit can make a familiar shape feel new.',
      'We look for materials that feel comfortable in motion and settle naturally with wear. Their small variations are part of the character, not something to hide.',
      'Choosing texture carefully lets a wardrobe do more with less: pieces work together, and the details reveal themselves over time.',
    ],
  },
];

export async function seedJournalIfEmpty() {
  const count = await Journal.countDocuments();
  if (count > 0) return;

  await Journal.insertMany(journalSeeds);
  console.log(`Seeded ${journalSeeds.length} journal posts`);
}

export async function getAllJournalPosts() {
  return Journal.find({ active: true }).sort({ createdAt: -1 });
}

export async function getJournalPostBySlug(slug) {
  return Journal.findOne({ slug, active: true });
}

export async function createJournalPost(data) {
  return Journal.create(data);
}

export async function updateJournalPost(slug, data) {
  return Journal.findOneAndUpdate(
    { slug },
    { ...data, slug },
    { new: true, runValidators: true, context: 'query' },
  );
}

export async function deleteJournalPost(slug) {
  return Journal.findOneAndUpdate(
    { slug },
    { active: false },
    { new: true },
  );
}