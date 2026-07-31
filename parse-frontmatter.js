// parse-frontmatter.js
// 解析类 YAML frontmatter 为对象。
// 支持：inline 数组 [a,b,c]、YAML 块状列表（key:\n  - x）、折叠续行（key: value\n  续行）。
//
// 抄自 afoim/af_blog-data 的 parseFrontmatter，关键点是折叠续行支持：
// PagesCMS 写回长文本时会自动折成多行，如：
//   description: 前半句很长很长
//     后半句在缩进的续行里
// 不支持折叠续行的解析器会把 description 截断到第一行，连带 posts.json、
// RSS <description>、主站显示一起缺一截。

/** 去外层单/双引号 */
function stripQuotes(s) {
  return s.replace(/^['"]|['"]$/g, "");
}

/**
 * @param {string} fm frontmatter 文本（不含首尾 --- 分隔符）
 * @returns {Object} 解析后的键值对
 */
function parseFrontmatter(fm) {
  const result = {};
  let listKey = null;       // 正在累积列表项的键
  let currentList = [];
  let scalarKey = null;     // 正在累积折叠标量的键
  let scalarParts = [];

  const flushScalar = () => {
    if (scalarKey !== null) {
      // YAML 折叠语义：续行之间用单个空格拼接
      result[scalarKey] = stripQuotes(scalarParts.join(" ").trim());
      scalarKey = null;
      scalarParts = [];
    }
  };
  const flushList = () => {
    if (listKey !== null && currentList.length) {
      result[listKey] = [...currentList];
    }
    listKey = null;
    currentList = [];
  };

  for (const line of fm.split("\n")) {
    // Key: value
    const kvMatch = line.match(/^(\w[\w_-]*):\s*(.*)$/);
    if (kvMatch) {
      flushScalar();
      flushList();
      const key = kvMatch[1];
      const val = kvMatch[2].trim();
      if (val === "") {
        // 值为空，可能是块状列表开头
        listKey = key;
      } else if (val.startsWith("[")) {
        // inline 数组 [a, b, c]
        result[key] = val
          .slice(1, -1)
          .split(",")
          .map((s) => stripQuotes(s.trim()))
          .filter(Boolean);
      } else if (val === "true" || val === "false") {
        result[key] = val === "true";
      } else {
        // 先挂起：后面可能还有折叠续行
        scalarKey = key;
        scalarParts = [val];
      }
      continue;
    }

    // 列表项：  - value
    const liMatch = line.match(/^\s*-\s+(.*)$/);
    if (liMatch && listKey !== null) {
      flushScalar();
      currentList.push(stripQuotes(liMatch[1].trim()));
      continue;
    }

    // 折叠续行：缩进的非列表行，归属上一个标量键
    if (scalarKey !== null && /^\s+\S/.test(line)) {
      scalarParts.push(line.trim());
    }
  }

  flushScalar();
  flushList();

  return result;
}

module.exports = { parseFrontmatter, stripQuotes };
