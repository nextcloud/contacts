/**
 * @fileoverview Camelcase something.
 */
export default function camelize(str, delimiter='_') {
  let words = str.split(delimiter);
  return [words[0]]
    .concat(
      words.slice(1).map(word => word.charAt(0).toUpperCase() + word.slice(1))
    )
    .join('');
}
