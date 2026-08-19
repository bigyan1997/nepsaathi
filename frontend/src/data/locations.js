export const LOCATIONS = {
  // Major cities
  sydney: {
    label: "Sydney",
    state: "NSW",
    stateLabel: "New South Wales",
    emoji: "🌉",
    description:
      "Sydney is home to Australia's largest Nepalese community, concentrated around Parramatta, Hurstville, and the inner west. Find jobs and rooms posted by Nepalese employers and housemates across Greater Sydney.",
    nearby: ["parramatta", "hurstville", "auburn", "strathfield", "lidcombe", "blacktown"],
  },
  melbourne: {
    label: "Melbourne",
    state: "VIC",
    stateLabel: "Victoria",
    emoji: "☕",
    description:
      "Melbourne's Nepalese community is growing fast, especially in the southeast suburbs and CBD fringe. Explore jobs and accommodation listings from the Nepalese community in Victoria.",
    nearby: ["sydney", "brisbane", "perth"],
  },
  brisbane: {
    label: "Brisbane",
    state: "QLD",
    stateLabel: "Queensland",
    emoji: "☀️",
    description:
      "Brisbane and South East Queensland have a thriving Nepalese community. Browse jobs and rooms posted by Nepalese Australians across the Sunshine State.",
    nearby: ["sydney", "melbourne", "goldcoast"],
  },
  perth: {
    label: "Perth",
    state: "WA",
    stateLabel: "Western Australia",
    emoji: "🌊",
    description:
      "Perth has a growing Nepalese community, particularly in the northern and eastern suburbs. Find community-posted jobs and rooms in Western Australia.",
    nearby: ["sydney", "melbourne", "adelaide"],
  },
  adelaide: {
    label: "Adelaide",
    state: "SA",
    stateLabel: "South Australia",
    emoji: "🍷",
    description:
      "Adelaide's Nepalese community is welcoming and tight-knit. Discover job opportunities and accommodation options posted by the community in South Australia.",
    nearby: ["melbourne", "perth", "sydney"],
  },
  canberra: {
    label: "Canberra",
    state: "ACT",
    stateLabel: "Australian Capital Territory",
    emoji: "🏛️",
    description:
      "Canberra hosts many Nepalese students and professionals, especially around the ANU and UC precincts. Find community jobs and rooms in the nation's capital.",
    nearby: ["sydney", "melbourne"],
  },
  // Sydney suburbs
  parramatta: {
    label: "Parramatta",
    state: "NSW",
    stateLabel: "New South Wales",
    emoji: "🏙️",
    description:
      "Parramatta is a top hub for Nepalese Australians in Western Sydney — with Nepali restaurants, grocery stores, and community events. Browse listings close to home.",
    nearby: ["sydney", "blacktown", "auburn", "lidcombe", "strathfield"],
  },
  hurstville: {
    label: "Hurstville",
    state: "NSW",
    stateLabel: "New South Wales",
    emoji: "🏘️",
    description:
      "Hurstville in Sydney's south has one of Australia's most active Nepalese communities. Find local jobs and rooms in the area.",
    nearby: ["sydney", "auburn", "strathfield"],
  },
  auburn: {
    label: "Auburn",
    state: "NSW",
    stateLabel: "New South Wales",
    emoji: "🌆",
    description:
      "Auburn in Western Sydney has a strong multicultural community including many Nepalese families. Browse rooms and jobs close to Auburn station.",
    nearby: ["parramatta", "strathfield", "lidcombe", "blacktown"],
  },
  strathfield: {
    label: "Strathfield",
    state: "NSW",
    stateLabel: "New South Wales",
    emoji: "🏡",
    description:
      "Strathfield is well-connected and popular with Nepalese students and young professionals. Find share rooms and job opportunities nearby.",
    nearby: ["auburn", "lidcombe", "parramatta", "sydney"],
  },
  lidcombe: {
    label: "Lidcombe",
    state: "NSW",
    stateLabel: "New South Wales",
    emoji: "🌳",
    description:
      "Lidcombe is a convenient base in Western Sydney, close to Parramatta and Auburn. Browse community listings in and around Lidcombe.",
    nearby: ["auburn", "strathfield", "parramatta", "blacktown"],
  },
  blacktown: {
    label: "Blacktown",
    state: "NSW",
    stateLabel: "New South Wales",
    emoji: "🌏",
    description:
      "Blacktown is one of Sydney's fastest-growing areas and home to a large Nepalese community. Find affordable rooms and job opportunities nearby.",
    nearby: ["parramatta", "aubun", "lidcombe", "sydney"],
  },
  goldcoast: {
    label: "Gold Coast",
    state: "QLD",
    stateLabel: "Queensland",
    emoji: "🏄",
    description:
      "The Gold Coast's hospitality industry offers many opportunities for the Nepalese community. Browse jobs and rooms in this vibrant coastal city.",
    nearby: ["brisbane", "sydney"],
  },
};

// Ordered list for "Browse by city" section (major cities first)
export const FEATURED_LOCATIONS = [
  "sydney",
  "melbourne",
  "brisbane",
  "perth",
  "adelaide",
  "canberra",
  "parramatta",
  "hurstville",
  "auburn",
  "blacktown",
];

export function getLocationMeta(slug, listingType) {
  const loc = LOCATIONS[slug];
  if (!loc) return null;
  const typeLabel = listingType === "job" ? "Jobs" : listingType === "room" ? "Rooms" : "Listings";
  const typeVerb = listingType === "job" ? "jobs" : listingType === "room" ? "rooms for rent" : "listings";
  return {
    title: `Nepali ${typeLabel} in ${loc.label}, ${loc.state}`,
    description: `Find ${typeVerb} in ${loc.label} posted by the Nepalese community in Australia. Browse Nepali-friendly listings on NepSaathi — ${loc.stateLabel}.`,
  };
}
