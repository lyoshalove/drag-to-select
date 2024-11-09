export const shallowEqual = (
  x: Record<string, boolean>,
  y: Record<string, boolean>
) => {
  return (
    Object.keys(x).length === Object.keys(y).length &&
    Object.keys(x).every((key) => x[key] === y[key])
  );
};
