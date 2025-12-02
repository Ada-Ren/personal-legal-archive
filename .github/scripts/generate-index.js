/**
 * 自动扫描 /mhtml 并生成 index.json
 * 放置位置：.github/scripts/generate-index.js
 */

const fs = require("fs");
const path = require("path");

// 扫描的目录（与你 repo 中的 mhtml 文件夹一致）
const ROOT_DIR = path.join(process.cwd(), "mhtml");

// 输出文件（放在仓库根目录）
const OUTPUT = path.join(process.cwd(), "index.json");

// 支持的扩展名
const EXTS = [".html", ".mhtml", ".mht", ".pdf"];

/* 日期解析：从文件名开头提取 YYYY-MM / YYYY-MM-DD / YYYYMMDD */
function extractDate(name) {
  const m = name.match(/^(20\d{2})(?:[-_]?(\d{2}))?(?:[-_]?(\d{2}))?/);
  if (!m) return null;

  const y = m[1];
  const mo = m[2] || "01";
  const d = m[3] || "01";

  let text;
  if (m[3]) text = `${y}-${mo}-${d}`;
  else if (m[2]) text = `${y}-${mo}`;
  else text = y;

  const key = `${y}${mo}${d}`;
  const groupKey = `${y}${mo}`;
  const groupLabel = `${y.slice(2)}年${parseInt(mo, 10)}月`;

  return { text, key, groupKey, groupLabel };
}

/* 从文件名生成标题 */
function filenameToTitle(name) {
  let base = name.replace(/\.(html?|pdf|mhtml?)$/i, "");

  base = base.replace(
    /^(20\d{2}(?:[-_]?(\d{2}))?(?:[-_]?(\d{2}))?)[\s_\-]*/,
    ""
  );

  return base.replace(/[_\-]+/g, " ").trim();
}

/* 递归扫描目录 */
function walk(dir) {
  let results = [];

  fs.readdirSync(dir).forEach((file) => {
    const full = path.join(dir, file);
    const stat = fs.statSync(full);

    if (stat.isDirectory()) {
      results = results.concat(walk(full));
    } else if (stat.isFile()) {
      const ext = path.extname(file).toLowerCase();
      if (EXTS.includes(ext)) results.push(full);
    }
  });

  return results;
}

/* 主程序：扫描并生成 JSON */
function main() {
  const files = walk(ROOT_DIR);

  const items = files.map((fullPath) => {
    const relativePath = path.relative(process.cwd(), fullPath).replace(/\\/g, "/");
    const fileName = path.basename(fullPath);

    const date = extractDate(fileName);

    return {
      title: filenameToTitle(fileName),
      dateText: date ? date.text : "未知时间",
      dateKey: date ? date.key : "00000000",
      dateGroupKey: date ? date.groupKey : "000000",
      dateGroupLabel: date ? date.groupLabel : "未知日期",
      url: encodeURI(relativePath)
    };
  });

  fs.writeFileSync(OUTPUT, JSON.stringify(items, null, 2), "utf-8");
  console.log("index.json 已生成，共", items.length, "条文件记录。");
}

main();