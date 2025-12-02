// .github/scripts/generate-index.js
// 在仓库根目录扫描 /mhtml 下的文件，生成 index.json

const fs = require("fs");
const path = require("path");

const ROOT = process.cwd();              // 仓库根目录
const MHTML_DIR = path.join(ROOT, "mhtml");
const OUT_FILE  = path.join(ROOT, "index.json");

// 支持的扩展名
const EXTS = [".html", ".pdf", ".mhtml", ".mht"];

// 文件名 -> 标题：去掉扩展名 + 去掉前缀日期 + 下划线/中划线转空格
function filenameToTitle(name) {
  let base = name.replace(/\.(html?|pdf|mhtml?)$/i, "");

  // 去掉类似：20250101_、2025-01-01-、2025_01_ 前缀
  base = base.replace(/^(20\d{2}(?:[-_]?(\d{2}))?(?:[-_]?(\d{2}))?)[\s_\-]*/, "");

  return base
    .replace(/[_\-]+/g, " ")
    .trim();
}

// 从文件名提取日期信息：2025 / 2025-01 / 2025-01-31 / 20250131 / 2025_01_31
function extractDate(name) {
  const m = name.match(/^(20\d{2})(?:[-_]?(\d{2}))?(?:[-_]?(\d{2}))?/);
  if (!m) return null;

  const y  = m[1];
  const mo = m[2] || "01";
  const d  = m[3] || "01";

  let text;
  if (m[3]) {
    text = `${y}-${mo}-${d}`;
  } else if (m[2]) {
    text = `${y}-${mo}`;
  } else {
    text = y;
  }

  const key       = `${y}${mo}${d}`;     // 排序
  const groupKey  = `${y}${mo}`;        // 分组：年月
  const groupLabel = `${y.slice(2)}年${parseInt(mo, 10)}月`; // 如 25年1月

  return { text, key, groupKey, groupLabel };
}

// 递归扫描 mhtml 目录
function walk(dir) {
  let results = [];
  const entries = fs.readdirSync(dir, { withFileTypes: true });

  for (const entry of entries) {
    const fullPath = path.join(dir, entry.name);
    if (entry.isDirectory()) {
      results = results.concat(walk(fullPath));
    } else if (entry.isFile()) {
      const lower = entry.name.toLowerCase();
      if (EXTS.some(ext => lower.endsWith(ext))) {
        results.push(fullPath);
      }
    }
  }
  return results;
}

function main() {
  if (!fs.existsSync(MHTML_DIR)) {
    console.log("mhtml 目录不存在，无需生成 index.json");
    fs.writeFileSync(OUT_FILE, "[]", "utf8");
    return;
  }

  const files = walk(MHTML_DIR);

  const items = files.map(full => {
    const rel = path.relative(ROOT, full).replace(/\\/g, "/"); // mhtml/xxx.html
    const name = path.basename(full);
    const date = extractDate(name);

    return {
      title: filenameToTitle(name),
      dateText:    date ? date.text       : "未知时间",
      dateKey:     date ? date.key        : "00000000",
      dateGroupKey:   date ? date.groupKey   : "000000",
      dateGroupLabel: date ? date.groupLabel : "未知日期",
      url: rel
    };
  });

  // 写入 JSON（未排序，排序留给前端做也可以）
  fs.writeFileSync(OUT_FILE, JSON.stringify(items, null, 2), "utf8");
  console.log("index.json 已生成，文件数：", items.length);
}

main();
