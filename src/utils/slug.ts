/**
 * Converts a string into a URL-friendly slug.
 * "Coris Seguro Viagem" -> "coris-seguro-viagem"
 */
export function slugify(value: string): string {
  return value
    .toString()
    .normalize("NFD")
    .replace(/[̀-ͯ]/g, "") // strip accents
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, "-") // non-alphanumeric -> dash
    .replace(/^-+|-+$/g, ""); // trim leading/trailing dashes
}
