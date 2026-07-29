/*
 * ChatGPT & Claude Surge Panel (no WARP status)
 *
 * Optional arguments:
 *   title=AI&icon=checkmark.seal.fill&iconerr=xmark.seal.fill
 *   &icon-color=#D97706&iconerr-color=#D65C51
 *
 * ChatGPT regions are inherited from CFGPT_2_nowarp.js:
 * https://raw.githubusercontent.com/getsomecat/GetSomeCats/Surge/modules/Panel/CFGPT/CFGPT_2_nowarp.js
 * Claude regions follow Anthropic's supported-locations page:
 * https://support.claude.com/en/articles/8461763-where-can-i-access-claude
 * Last checked: 2026-07-29
 */

var CHATGPT_REGIONS = [
  "T1", "XX", "AL", "DZ", "AD", "AO", "AG", "AR", "AM", "AU",
  "AT", "AZ", "BS", "BD", "BB", "BE", "BZ", "BJ", "BT", "BA",
  "BW", "BR", "BG", "BF", "CV", "CA", "CL", "CO", "KM", "CR",
  "HR", "CY", "DK", "DJ", "DM", "DO", "EC", "SV", "EE", "FJ",
  "FI", "FR", "GA", "GM", "GE", "DE", "GH", "GR", "GD", "GT",
  "GN", "GW", "GY", "HT", "HN", "HU", "IS", "IN", "ID", "IQ",
  "IE", "IL", "IT", "JM", "JP", "JO", "KZ", "KE", "KI", "KW",
  "KG", "LV", "LB", "LS", "LR", "LI", "LT", "LU", "MG", "MW",
  "MY", "MV", "ML", "MT", "MH", "MR", "MU", "MX", "MC", "MN",
  "ME", "MA", "MZ", "MM", "NA", "NR", "NP", "NL", "NZ", "NI",
  "NE", "NG", "MK", "NO", "OM", "PK", "PW", "PA", "PG", "PE",
  "PH", "PL", "PT", "QA", "RO", "RW", "KN", "LC", "VC", "WS",
  "SM", "ST", "SN", "RS", "SC", "SL", "SG", "SK", "SI", "SB",
  "ZA", "ES", "LK", "SR", "SE", "CH", "TH", "TG", "TO", "TT",
  "TN", "TR", "TV", "UG", "AE", "US", "UY", "VU", "ZM", "BO",
  "BN", "CG", "CZ", "VA", "FM", "MD", "PS", "KR", "TW", "TZ",
  "TL", "GB"
];

var CLAUDE_REGIONS = [
  "AL", "DZ", "AD", "AO", "AG", "AR", "AM", "AU", "AT", "AZ",
  "BS", "BH", "BD", "BB", "BE", "BZ", "BJ", "BT", "BO", "BA",
  "BW", "BR", "BN", "BG", "BF", "BI", "KH", "CM", "CA", "CV",
  "TD", "CL", "CO", "KM", "CG", "CR", "HR", "CZ", "DK", "DJ",
  "DM", "DO", "TL", "EC", "EG", "SV", "GQ", "EE", "SZ", "FJ",
  "FI", "FR", "GA", "GM", "GE", "DE", "GH", "GR", "GD", "GT",
  "GN", "GW", "GY", "HT", "HN", "HU", "IS", "IN", "ID", "IQ",
  "IE", "IL", "IT", "CI", "JM", "JP", "JO", "KZ", "KE", "KI",
  "KW", "KG", "LA", "LV", "LB", "LS", "LR", "LI", "LT", "LU",
  "MG", "MW", "MY", "MV", "MT", "MP", "MH", "MR", "MU", "MX",
  "FM", "MD", "MC", "MN", "ME", "MA", "MZ", "NA", "NR", "NP",
  "NL", "NZ", "NE", "NG", "MK", "NO", "OM", "PK", "PW", "PS",
  "PA", "PG", "PY", "PE", "PH", "PL", "PT", "QA", "CY", "RO",
  "RW", "KN", "LC", "VC", "WS", "SM", "ST", "SA", "SN", "RS",
  "SC", "SL", "SG", "SK", "SI", "SB", "ZA", "KR", "ES", "LK",
  "SR", "SE", "CH", "TW", "TJ", "TZ", "TH", "TG", "TO", "TT",
  "TN", "TR", "TM", "TV", "UG", "UA", "AE", "GB", "US", "UY",
  "UZ", "VU", "VA", "VN", "ZM", "ZW"
];

var SERVICES = [
  {
    name: "ChatGPT",
    url: "https://chat.openai.com/cdn-cgi/trace",
    regions: CHATGPT_REGIONS
  },
  {
    name: "Claude",
    url: "https://claude.ai/cdn-cgi/trace",
    regions: CLAUDE_REGIONS
  }
];

var panelOptions = parseArguments(
  typeof $argument === "undefined" ? "" : $argument
);
var results = new Array(SERVICES.length);
var pending = SERVICES.length;

SERVICES.forEach(function (service, index) {
  $httpClient.get(service.url, function (error, response, data) {
    results[index] = evaluateService(service, error, data);
    pending -= 1;

    if (pending === 0) {
      finishPanel();
    }
  });
});

function evaluateService(service, error, data) {
  if (error || !data) {
    if (typeof console !== "undefined") {
      console.log(service.name + ": " + (error || "No response data"));
    }
    return {
      supported: false,
      line: service.name + ": \u26A0\uFE0F  \u6AA2\u6E2C\u5931\u6557"
    };
  }

  var trace = parseTrace(data);
  var region = String(trace.loc || "").toUpperCase();

  if (!region) {
    return {
      supported: false,
      line: service.name + ": \u26A0\uFE0F  \u7121\u6CD5\u53D6\u5F97\u5730\u5340"
    };
  }

  var supported = service.regions.indexOf(region) !== -1;
  return {
    supported: supported,
    line:
      service.name + ": " +
      (supported ? "\u2714\uFE0F" : "\u2716\uFE0F") +
      "  \u5340\u57DF: " + countryFlag(region) + region
  };
}

function finishPanel() {
  var allSupported = results.every(function (result) {
    return result.supported;
  });
  var icon = allSupported ? panelOptions.icon : panelOptions.iconerr;
  var iconColor = allSupported
    ? panelOptions["icon-color"]
    : panelOptions["iconerr-color"];

  $done({
    title: panelOptions.title || "ChatGPT & Claude",
    content: results.map(function (result) {
      return result.line;
    }).join("\n"),
    icon: icon || undefined,
    "icon-color": iconColor || undefined
  });
}

function parseArguments(argument) {
  var result = {};

  if (!argument) {
    return result;
  }

  argument.split("&").forEach(function (item) {
    var separator = item.indexOf("=");
    if (separator === -1) {
      return;
    }

    var key = item.slice(0, separator);
    var value = item.slice(separator + 1);
    try {
      result[key] = decodeURIComponent(value);
    } catch (_) {
      result[key] = value;
    }
  });

  return result;
}

function parseTrace(data) {
  return String(data).split("\n").reduce(function (result, line) {
    var separator = line.indexOf("=");
    if (separator !== -1) {
      result[line.slice(0, separator)] = line.slice(separator + 1).trim();
    }
    return result;
  }, {});
}

function countryFlag(region) {
  if (!/^[A-Z]{2}$/.test(region) || region === "XX") {
    return "";
  }

  return String.fromCodePoint(
    region.charCodeAt(0) + 127397,
    region.charCodeAt(1) + 127397
  );
}
