'use strict';
export default function fuzzyUrlEquals(one, other) {
  return fuzzyIncludes(one, other) || fuzzyIncludes(other, one);
};

function fuzzyIncludes(one, other) {
  return one.indexOf(other) !== -1 ||
         (other.charAt(other.length -1) === '/' &&
          one.indexOf(other.slice(0, -1)) !== -1);
}
