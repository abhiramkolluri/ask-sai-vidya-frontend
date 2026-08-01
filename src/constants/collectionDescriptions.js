// Curated one-to-two-sentence descriptions for the Collections tab cards,
// keyed by the exact `book` value the backend returns. Sathya Sai Speaks
// volumes and year-based series entries share their book's description.

export const COLLECTION_DESCRIPTIONS = {
  // ── Vahinis ──────────────────────────────────────────────────────────────
  "Bhagavata Vahini":
    "The story of the Bhagavata retold by Swami — the glory of the Lord's avatars and the devotion of those who lived for Him.",
  "Dharma Vahini":
    "The stream of righteousness: what dharma truly means and how to live it in daily conduct, family life, and spiritual practice.",
  "Dhyana Vahini":
    "Practical guidance on meditation — preparing the mind, the discipline of regular practice, and the inner transformation dhyana brings.",
  "Geeta Vahini":
    "Swami's own commentary on the Bhagavad Gita, unfolding Krishna's teaching to Arjuna chapter by chapter for the modern seeker.",
  "Jnana Vahini":
    "The stream of eternal wisdom: discriminating the real from the unreal and realizing the Atma as one's true self.",
  "Leela Kaivalya Vahini":
    "The cosmic play of the Divine — how the Lord's leela pervades creation and draws the seeker toward liberation.",
  "Prasanthi Vahini":
    "The supreme peace of Prasanthi: stilling the agitations of the mind to reach the highest inner peace.",
  "Prashnottara Vahini":
    "Questions and answers with Swami on the spiritual path — doubts of seekers resolved with clarity and compassion.",
  "Prema Vahini":
    "The stream of divine love: cultivating prema as the surest path to God and the foundation of all sadhana.",
  "Ramakatha Rasavahini":
    "The sweet story of Rama, retold by Swami as an inner journey — every character and episode a lesson for the aspirant.",
  "Sandeha Nivarini":
    "The clearance of spiritual doubts — a dialogue that removes the seeker's confusions about sadhana, scripture, and self.",
  "Sathya Sai Vahini":
    "Swami's message on the human predicament and its resolution — the essential teaching of Sathya Sai in one stream.",
  "Sutra Vahini":
    "Aphorisms of the Brahma Sutras illumined — the essence of Vedantic inquiry made accessible.",
  "Upanishad Vahini":
    "The message of the principal Upanishads distilled — the eternal truths of the Vedas for the earnest student.",
  "Vidya Vahini":
    "True education as the flowering of character — vidya that illumines the inner person, not mere information.",

  // ── Books / series ───────────────────────────────────────────────────────
  "Sathya Sai Speaks":
    "Discourses delivered by Swami across the decades — the living voice of His teaching, volume by volume.",
  "Summer Showers":
    "Discourses from the Summer Course in Indian Culture and Spirituality at Brindavan, addressed especially to students.",
  "Sai Echoes from Kodai Hills":
    "Intimate discourses given at Kodaikanal — teachings shared with devotees in the serenity of the hills.",
  "Monsoon Showers":
    "A series of discourses on the ideals of Indian culture and the spiritual life, delivered in 1996.",
  "Ati Rudra Maha Yajna":
    "Discourses during the Ati Rudra Maha Yajna of 2006 — the significance of the yajna and the divinity within.",
  "Women's Role in Rejuvenating the Culture of Bharat":
    "Addresses on the dignity and duty of women as preservers of Bharat's culture and character.",
  "Chinna Katha":
    "Little stories with great meaning — parables and anecdotes Swami used to illustrate His teachings.",
};

export const getCollectionDescription = ({ book }) =>
  COLLECTION_DESCRIPTIONS[book] || "";
