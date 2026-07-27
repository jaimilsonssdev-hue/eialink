/**
 * Reserved semantic slots for the future block-based page builder. They remain
 * hidden until each block gains data and an editor, without coupling that work
 * to the public profile shell.
 */
const futureBlocks = [
  "gallery",
  "products",
  "services",
  "videos",
  "testimonials",
  "map",
  "hours",
  "contact",
] as const;

export function FutureSections() {
  return (
    <div hidden aria-hidden="true">
      {futureBlocks.map((block) => (
        <section key={block} data-public-profile-block={block} />
      ))}
    </div>
  );
}
