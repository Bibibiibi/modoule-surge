/*
 * Claude Surge Panel (no WARP status)
 *
 * Optional arguments:
 *   title=Claude&icon=checkmark.seal.fill&iconerr=xmark.seal.fill
 *   &icon-color=#D97706&iconerr-color=#D65C51
 *
 * The availability list follows Anthropic's supported-locations page:
 * https://support.claude.com/en/articles/8461763-where-can-i-access-claude
 * Last checked: 2026-07-29
 */

var TRACE_URL = "https://claude.ai/cdn-cgi/trace";

// ISO 3166-1 alpha-2 codes for locations where Claude is officially available.
var SUPPORTED_REGIONS = [
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

var panelOptions = parseArguments(
  typeof $argument === "undefined" ? "" : $argument
);

$httpClient.get(TRACE_URL, function (error, response, data) {
  if (error || !data) {
    finishWithError(error ? String(error) : "No response data");
    return;
  }

  var trace = parseTrace(data);
  var region = String(trace.loc || "XX").toUpperCase();

  if (!/^[A-Z]{2}$/.test(region) || region === "XX") {
    finishWithError("Unable to determine the exit region");
    return;
  }

  var supported = SUPPORTED_REGIONS.indexOf(region) !== -1;
  var icon = supported ? panelOptions.icon : panelOptions.iconerr;
  var iconColor = supported
    ? panelOptions["icon-color"]
    : panelOptions["iconerr-color"];

  $done({
    title: panelOptions.title || "Claude",
    content:
      "Claude: " + (supported ? "\u2714\uFE0F" : "\u2716\uFE0F") +
      "  \u5340\u57DF: " + countryFlag(region) + region,
    icon: icon || undefined,
    "icon-color": iconColor || undefined
  });
});

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
  if (!/^[A-Z]{2}$/.test(region)) {
    return "";
  }

  return String.fromCodePoint(
    region.charCodeAt(0) + 127397,
    region.charCodeAt(1) + 127397
  );
}

function finishWithError(message) {
  $done({
    title: panelOptions.title || "Claude",
    content: "Claude: \u26A0\uFE0F  \u6AA2\u6E2C\u5931\u6557\n" + message,
    icon: panelOptions.iconerr || undefined,
    "icon-color": panelOptions["iconerr-color"] || undefined
  });
}
