import { classTokens } from "../shared/html.mjs";

function classesFromGroup(group) {
  return [group?.base, ...(group?.elements || []), ...(group?.modifiers || [])].filter(Boolean);
}

export function authoringClasses(item) {
  const authoring = item?.authoring || {};
  return [
    ...(authoring.classes || []),
    ...(authoring.classGroups || []).flatMap(classesFromGroup),
  ].filter(Boolean);
}

export function buildAuthoringClassIndex(items) {
  const known = new Set();
  const ownerByClass = new Map();
  const ownersByClass = new Map();
  for (const item of items) {
    for (const className of authoringClasses(item)) {
      known.add(className);
      if (!ownerByClass.has(className)) ownerByClass.set(className, item.name);
      const owners = ownersByClass.get(className) || new Set();
      owners.add(item.name);
      ownersByClass.set(className, owners);
    }
  }
  return { known, ownerByClass, ownersByClass };
}

export function lsClassTokens(html) {
  return [...new Set(classTokens(html).filter((token) => token.startsWith("ls-")))];
}

export function unknownLsClasses(html, knownClasses) {
  return lsClassTokens(html).filter((token) => !knownClasses.has(token));
}

export function itemNamesForClasses(html, ownerByClass) {
  const items = new Set();
  for (const token of lsClassTokens(html)) {
    const owner = ownerByClass.get(token);
    if (owner) items.add(owner);
  }
  return items;
}
