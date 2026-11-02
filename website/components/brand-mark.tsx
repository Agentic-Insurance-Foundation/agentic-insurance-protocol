/**
 * The AIP mark: a painted acorn, a cognac nut under a bronze cap. It keeps
 * its own colours in both themes. `public/aip-mark.svg` is the file of the
 * AIP Design System: use it as it is, and do not redraw or recolour it.
 */
export function BrandMark({ size = 36 }: { size?: number }) {
  return <img className="block flex-none" src="/aip-mark.svg" width={size} height={size} alt="" />;
}
