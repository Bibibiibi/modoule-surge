/******************************
脚本名称: NodeSeek
Version : v1.1.2
更新时间: 2026-07-24
平台: Surge Mac
功能: Cookie 捕获 + 每日签到
脚本作者: @Curtinp118 / @Nullwhy (Surge 适配)
使用说明:
1. 在 Surge 中安装 NodeSeek.sgmodule
2. 启用「NodeSeek Cookie 捕获」脚本后访问 nodeseek.com 个人页面
3. 收到「Cookie 成功」通知后，禁用该 http-request 脚本（或注释掉配置行）
4. 定时签到脚本自动按 sgmodule 中的 cronexp 运行
5. 固定 5 鸡腿：将 cron 脚本的 argument 改为 MODE=checkin&FIXED_LEGS=true
   随机鸡腿（默认）：argument=MODE=checkin
*******************************/

const SCRIPT_NAME = "NodeSeek🎉";
const STORE_KEY = "nodeseek_headers";
const ATTEND_BASE = "https://www.nodeseek.com/api/attendance";

const DEFAULT_HEADERS = {
  Connection: "keep-alive",
  "Accept-Encoding": "gzip, deflate, br",
  Priority: "u=3, i",
  "Content-Type": "text/plain;charset=UTF-8",
  Origin: "https://www.nodeseek.com",
  "refract-sign": "",
  "User-Agent": "Mozilla/5.0",
  "refract-key": "",
  "Sec-Fetch-Mode": "cors",
  Cookie: "",
  Host: "www.nodeseek.com",
  Referer: "https://www.nodeseek.com/",
  "Accept-Language": "zh-CN,zh-Hans;q=0.9",
  Accept: "*/*"
};

const HEADER_KEYS = Object.keys(DEFAULT_HEADERS);

// 解析 $argument（格式: KEY=val&KEY2=val2）
const args = (() => {
  const result = {};
  if (typeof $argument !== "undefined" && $argument) {
    $argument.split("&").forEach(pair => {
      const idx = pair.indexOf("=");
      if (idx !== -1) {
        result[decodeURIComponent(pair.slice(0, idx))] =
          decodeURIComponent(pair.slice(idx + 1));
      }
    });
  }
  return result;
})();

function log(msg) {
  console.log("[" + SCRIPT_NAME + "] " + msg);
}

function notify(subtitle, body) {
  log(subtitle + ": " + body);
  $notification.post(SCRIPT_NAME, subtitle, body);
}

function envTrue(key) {
  const val = args[key];
  if (val == null || String(val).trim() === "") return false;
  return ["1", "true", "yes", "on"].indexOf(String(val).trim().toLowerCase()) !== -1;
}

function headerValue(src, key) {
  return src[key] || src[key.toLowerCase()] || src[key.toUpperCase()] || "";
}

function pickHeaders(src) {
  const saved = {};
  HEADER_KEYS.forEach(key => {
    const value = headerValue(src || {}, key);
    if (value) saved[key] = value;
  });
  return saved;
}

function buildAttendHeaders(saved) {
  const headers = {};
  HEADER_KEYS.forEach(key => {
    headers[key] = (saved && saved[key]) || DEFAULT_HEADERS[key];
  });
  return headers;
}

function attendUrl() {
  const fixed = envTrue("FIXED_LEGS");
  return ATTEND_BASE + "?random=" + (fixed ? "false" : "true");
}

// 将 $httpClient.post 封装为 Promise
function httpPost(url, headers, body) {
  return new Promise((resolve, reject) => {
    $httpClient.post(
      { url, headers, body, timeout: 10000 },
      (error, response, data) => {
        if (error) reject(new Error(String(error)));
        else resolve({ status: response.status, text: data });
      }
    );
  });
}

// ── Cookie 捕获模式（http-request 脚本）──────────────────────────
function captureHeaders() {
  const src = (typeof $request !== "undefined" && $request.headers) || {};
  const saved = pickHeaders(src);

  if (Object.keys(saved).length === 0) {
    notify("Cookie 失败", "未获取到请求头，请确认访问了 nodeseek.com 个人页面");
    $done({});
    return;
  }

  $persistentStore.write(JSON.stringify(saved), STORE_KEY);
  log("请求头已保存，共 " + Object.keys(saved).length + " 个字段");
  notify("Cookie 成功", "请求头已保存，请立即禁用「Cookie 捕获」脚本");
  $done({});
}

// ── 签到模式（cron 脚本）─────────────────────────────────────────
async function doCheckIn() {
  const fixed = envTrue("FIXED_LEGS");
  const url = attendUrl();
  log("开始签到（" + (fixed ? "固定鸡腿" : "随机鸡腿") + "）");

  const raw = $persistentStore.read(STORE_KEY);
  if (!raw) {
    notify("缺少请求头", "请先启用 Cookie 捕获脚本并访问个人页面");
    $done({});
    return;
  }

  let saved;
  try {
    saved = JSON.parse(raw);
  } catch (e) {
    notify("数据异常", "请重新启用 Cookie 捕获脚本并访问个人页面");
    $done({});
    return;
  }

  try {
    const { status, text } = await httpPost(url, buildAttendHeaders(saved), "");
    let message = "";
    try { message = (JSON.parse(text) || {}).message || ""; } catch (e) {}

    const modeTag = fixed ? "固定" : "随机";
    if (status === 403) {
      notify("被风控", "403 Forbidden，稍后重试");
    } else if (status === 500) {
      notify("服务器错误", "500 Internal Server Error");
    } else if (status >= 200 && status < 300) {
      notify("签到成功（" + modeTag + "）", message || "签到完成");
    } else {
      notify("请求异常", "HTTP " + status);
    }
  } catch (error) {
    notify("网络错误", "请检查网络连接");
    log(error && error.message ? error.message : String(error));
  }

  $done({});
}

// ── 入口：按 MODE 参数或脚本类型选择执行路径 ──────────────────────
const mode = (args.MODE || "").toLowerCase();
if (mode === "checkin") {
  doCheckIn();
} else if (mode === "cookie" || (typeof $request !== "undefined" && $request)) {
  captureHeaders();
} else {
  // cron 脚本未传 MODE 时默认执行签到
  doCheckIn();
}
