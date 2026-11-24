const includePattern = /^[ \t]*#[ \t]*include[ \t]*(?:<([^<>\r\n]+)>|"([^"\r\n]+)")[ \t]*$/;

/**
 * Сортирует директивы #include. При повторе сохраняет первую строку в исходном виде.
 * Возвращает null, если хотя бы одна строка выделения имеет неподдерживаемый формат.
 */
function sortIncludes(lines) {
  const angleIncludes = new Map();
  const quotedIncludes = new Map();

  for (const line of lines) {
    const match = includePattern.exec(line);
    if (!match) {
      return null;
    }

    const [, anglePath, quotedPath] = match;
    const group = anglePath === undefined ? quotedIncludes : angleIncludes;
    const path = anglePath ?? quotedPath;
    if (!group.has(path)) {
      group.set(path, line);
    }
  }

  return [
    ...sortedLines(angleIncludes),
    ...sortedLines(quotedIncludes),
  ];
}

/** Сортирует пути заголовков в группе в лексикографическом порядке с учётом регистра. */
function sortedLines(group) {
  const paths = [...group.keys()].sort();
  return paths.map((path) => group.get(path));
}

module.exports = { sortIncludes };