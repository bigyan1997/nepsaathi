export function timeAgo(dateStr) {
  if (!dateStr) return "";
  const diff = Date.now() - new Date(dateStr).getTime();
  const mins = Math.floor(diff / 60000);
  if (mins < 1) return "Just now";
  if (mins < 60) return mins === 1 ? "1 min ago" : `${mins} mins ago`;
  const hours = Math.floor(mins / 60);
  if (hours < 24) return hours === 1 ? "1 hour ago" : `${hours} hours ago`;
  const days = Math.floor(hours / 24);
  if (days === 1) return "1 day ago";
  if (days < 7) return `${days} days ago`;
  const weeks = Math.floor(days / 7);
  if (weeks === 1) return "1 week ago";
  if (weeks < 5) return `${weeks} weeks ago`;
  const months = Math.floor(days / 30);
  return months === 1 ? "1 month ago" : `${months} months ago`;
}

export function isNew(dateStr) {
  if (!dateStr) return false;
  return Date.now() - new Date(dateStr).getTime() < 24 * 60 * 60 * 1000;
}

export const CARD_ACCENT = {
  job:      { footer: "#534AB7", time: "#534AB7", bg: "#EEEDFE" },
  room:     { footer: "#E87722", time: "#E87722", bg: "#FFF1E0" },
  event:    { footer: "#1D9E75", time: "#1D9E75", bg: "#E1F5EE" },
  notice:   { footer: "#0C447C", time: "#2176AE", bg: "#E6F1FB" },
  business: { footer: "#8B5E00", time: "#B47D00", bg: "#FAEEDA" },
  default:  { footer: "#26215C", time: "#534AB7", bg: "#F5F4F0" },
};

export const HOME_CATEGORIES = [
  { to: "/jobs",       emoji: "💼", label: "Jobs",       desc: "Find work near you",        color: "#EEEDFE", border: "#AFA9EC" },
  { to: "/rooms",      emoji: "🏡", label: "Rooms",      desc: "Affordable rentals",         color: "#FFF1E0", border: "#EFD9C0" },
  { to: "/events",     emoji: "🎉", label: "Events",     desc: "Community gatherings",       color: "#E1F5EE", border: "#9FE1CB" },
  { to: "/notices",    emoji: "📢", label: "Notices",    desc: "News and updates",           color: "#E6F1FB", border: "#B5D4F4" },
  { to: "/businesses", emoji: "🏪", label: "Businesses", desc: "Nepalese directory",         color: "#FAEEDA", border: "#FAC775" },
];

export const HOME_SEARCH_TYPES = [
  { value: "all",        emoji: "🔍", label: "All" },
  { value: "jobs",       emoji: "💼", label: "Jobs" },
  { value: "rooms",      emoji: "🏠", label: "Rooms" },
  { value: "events",     emoji: "🎉", label: "Events" },
  { value: "notices",    emoji: "📢", label: "Notices" },
  { value: "businesses", emoji: "🏪", label: "Businesses" },
];
