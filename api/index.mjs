var __create = Object.create;
var __defProp = Object.defineProperty;
var __getOwnPropDesc = Object.getOwnPropertyDescriptor;
var __getOwnPropNames = Object.getOwnPropertyNames;
var __getProtoOf = Object.getPrototypeOf;
var __hasOwnProp = Object.prototype.hasOwnProperty;
var __esm = (fn, res) => function __init() {
  return fn && (res = (0, fn[__getOwnPropNames(fn)[0]])(fn = 0)), res;
};
var __commonJS = (cb, mod) => function __require() {
  return mod || (0, cb[__getOwnPropNames(cb)[0]])((mod = { exports: {} }).exports, mod), mod.exports;
};
var __export = (target, all) => {
  for (var name in all)
    __defProp(target, name, { get: all[name], enumerable: true });
};
var __copyProps = (to, from, except, desc) => {
  if (from && typeof from === "object" || typeof from === "function") {
    for (let key of __getOwnPropNames(from))
      if (!__hasOwnProp.call(to, key) && key !== except)
        __defProp(to, key, { get: () => from[key], enumerable: !(desc = __getOwnPropDesc(from, key)) || desc.enumerable });
  }
  return to;
};
var __toESM = (mod, isNodeMode, target) => (target = mod != null ? __create(__getProtoOf(mod)) : {}, __copyProps(
  // If the importer is in node compatibility mode or this is not an ESM
  // file that has been converted to a CommonJS file using a Babel-
  // compatible transform (i.e. "__esModule" has not been set), then set
  // "default" to the CommonJS "module.exports" for node compatibility.
  isNodeMode || !mod || !mod.__esModule ? __defProp(target, "default", { value: mod, enumerable: true }) : target,
  mod
));
var __toCommonJS = (mod) => __copyProps(__defProp({}, "__esModule", { value: true }), mod);

// src/config.ts
var config;
var init_config = __esm({
  "src/config.ts"() {
    config = {
      env: process.env.NODE_ENV || "development",
      port: parseInt(process.env.PORT || "8787"),
      // Shared service credentials
      notion: {
        apiKey: process.env.NOTION_API_KEY
      },
      slack: {
        botToken: process.env.SLACK_BOT_TOKEN,
        signingSecret: process.env.SLACK_SIGNING_SECRET || ""
      },
      email: {
        smtp: {
          host: process.env.SMTP_HOST || "smtp.gmail.com",
          port: parseInt(process.env.SMTP_PORT || "587"),
          user: process.env.SMTP_USER || "",
          pass: process.env.SMTP_PASS || ""
        },
        from: process.env.FROM_EMAIL || "",
        fromName: process.env.FROM_NAME || "Automation Platform"
      },
      resend: {
        apiKey: process.env.RESEND_API_KEY || "",
        fromEmail: process.env.RESEND_FROM_EMAIL || "",
        replyTo: process.env.RESEND_REPLY_TO || ""
      },
      attio: {
        apiKey: process.env.ATTIO_API_KEY || "",
        marketplaceListId: process.env.ATTIO_MARKETPLACE_LIST_ID || ""
      },
      observability: {
        axiom: {
          token: process.env.AXIOM_TOKEN || "",
          dataset: process.env.AXIOM_DATASET || "automation-platform"
        },
        sentry: {
          dsn: process.env.SENTRY_DSN || ""
        }
      }
    };
    if (!config.notion.apiKey) {
      throw new Error("NOTION_API_KEY is required");
    }
    if (!config.slack.botToken) {
      throw new Error("SLACK_BOT_TOKEN is required");
    }
  }
});

// src/shared/utils/logger.ts
import { Axiom } from "@axiomhq/js";
function log2(level, message, context = {}) {
  const timestamp = (/* @__PURE__ */ new Date()).toISOString();
  const logData = {
    timestamp,
    level,
    message,
    environment: config.env,
    ...context
  };
  if (config.env === "development") {
    const emoji = level === "error" ? "\u274C" : level === "warn" ? "\u26A0\uFE0F" : level === "debug" ? "\u{1F50D}" : "\u2139\uFE0F";
    console.log(`${emoji} [${level.toUpperCase()}] ${message}`, context);
  }
  if (axiom) {
    try {
      axiom.ingest(config.observability.axiom.dataset, [logData]);
    } catch (error2) {
      console.error("Failed to send log to Axiom:", error2);
    }
  }
}
function info(message, context = {}) {
  log2("info", message, context);
}
function warn(message, context = {}) {
  log2("warn", message, context);
}
function error(message, errorObj, context = {}) {
  const errorContext = errorObj instanceof Error ? {
    error: errorObj.message,
    stack: errorObj.stack
  } : { error: String(errorObj) };
  log2("error", message, { ...context, ...errorContext });
}
function debug(message, context = {}) {
  if (config.env === "development") {
    log2("debug", message, context);
  }
}
async function flush() {
  if (axiom) {
    try {
      await axiom.flush();
    } catch (error2) {
      console.error("Failed to flush logs:", error2);
    }
  }
}
var axiom, logger2;
var init_logger = __esm({
  "src/shared/utils/logger.ts"() {
    init_config();
    axiom = null;
    if (config.observability.axiom.token) {
      axiom = new Axiom({
        token: config.observability.axiom.token
      });
    }
    logger2 = {
      info,
      warn,
      error,
      debug,
      flush
    };
  }
});

// src/shared/utils/retry.ts
import pRetry from "p-retry";
async function withRetry(fn, options = {}) {
  const {
    retries = 3,
    minTimeout = 1e3,
    maxTimeout = 5e3,
    onFailedAttempt
  } = options;
  return pRetry(fn, {
    retries,
    minTimeout,
    maxTimeout,
    onFailedAttempt: (error2) => {
      logger2.warn(`Retry attempt ${error2.attemptNumber} failed`, {
        error: error2.message,
        retriesLeft: error2.retriesLeft
      });
      if (onFailedAttempt) {
        onFailedAttempt(error2);
      }
    }
  });
}
var init_retry = __esm({
  "src/shared/utils/retry.ts"() {
    init_logger();
  }
});

// src/shared/services/slack.ts
var slack_exports = {};
__export(slack_exports, {
  addReaction: () => addReaction,
  getUserInfo: () => getUserInfo,
  sendAlert: () => sendAlert,
  sendDM: () => sendDM,
  sendMessage: () => sendMessage,
  sendThreadReply: () => sendThreadReply,
  updateMessage: () => updateMessage
});
import { WebClient } from "@slack/web-api";
async function sendMessage(channel, text, blocks) {
  logger2.info("Sending Slack message", { channel });
  const result = await withRetry(
    () => slack.chat.postMessage({
      channel,
      text,
      blocks
    })
  );
  return {
    ts: result.ts,
    channel: result.channel
  };
}
async function sendThreadReply(channel, threadTs, text, blocks) {
  logger2.info("Sending Slack thread reply", { channel, threadTs });
  return withRetry(
    () => slack.chat.postMessage({
      channel,
      thread_ts: threadTs,
      text,
      blocks
    })
  );
}
async function updateMessage(channel, ts, text, blocks) {
  logger2.info("Updating Slack message", { channel, ts });
  return withRetry(
    () => slack.chat.update({
      channel,
      ts,
      text,
      blocks
    })
  );
}
async function sendAlert(title, message, severity = "error") {
  const emoji = severity === "error" ? "\u{1F6A8}" : severity === "warning" ? "\u26A0\uFE0F" : "\u2139\uFE0F";
  const alertsChannel = process.env.SLACK_ALERTS_CHANNEL_ID || config.slack.botToken;
  return sendMessage(alertsChannel, `${emoji} ${title}`, [
    {
      type: "header",
      text: {
        type: "plain_text",
        text: `${emoji} ${title}`
      }
    },
    {
      type: "section",
      text: {
        type: "mrkdwn",
        text: message
      }
    }
  ]);
}
async function sendDM(userId, text, blocks) {
  logger2.info("Sending Slack DM", { userId });
  const conversation = await slack.conversations.open({
    users: userId
  });
  if (!conversation.channel?.id) {
    throw new Error("Failed to open conversation");
  }
  return sendMessage(conversation.channel.id, text, blocks);
}
async function getUserInfo(userId) {
  return withRetry(() => slack.users.info({ user: userId }));
}
async function addReaction(channel, timestamp, emoji) {
  return withRetry(
    () => slack.reactions.add({
      channel,
      timestamp,
      name: emoji
    })
  );
}
var slack;
var init_slack = __esm({
  "src/shared/services/slack.ts"() {
    init_config();
    init_retry();
    init_logger();
    slack = new WebClient(config.slack.botToken);
  }
});

// node_modules/svix/dist/models/applicationIn.js
var require_applicationIn = __commonJS({
  "node_modules/svix/dist/models/applicationIn.js"(exports) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    exports.ApplicationInSerializer = void 0;
    exports.ApplicationInSerializer = {
      _fromJsonObject(object) {
        return {
          metadata: object["metadata"],
          name: object["name"],
          rateLimit: object["rateLimit"],
          uid: object["uid"]
        };
      },
      _toJsonObject(self) {
        return {
          metadata: self.metadata,
          name: self.name,
          rateLimit: self.rateLimit,
          uid: self.uid
        };
      }
    };
  }
});

// node_modules/svix/dist/models/applicationOut.js
var require_applicationOut = __commonJS({
  "node_modules/svix/dist/models/applicationOut.js"(exports) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    exports.ApplicationOutSerializer = void 0;
    exports.ApplicationOutSerializer = {
      _fromJsonObject(object) {
        return {
          createdAt: new Date(object["createdAt"]),
          id: object["id"],
          metadata: object["metadata"],
          name: object["name"],
          rateLimit: object["rateLimit"],
          uid: object["uid"],
          updatedAt: new Date(object["updatedAt"])
        };
      },
      _toJsonObject(self) {
        return {
          createdAt: self.createdAt,
          id: self.id,
          metadata: self.metadata,
          name: self.name,
          rateLimit: self.rateLimit,
          uid: self.uid,
          updatedAt: self.updatedAt
        };
      }
    };
  }
});

// node_modules/svix/dist/models/applicationPatch.js
var require_applicationPatch = __commonJS({
  "node_modules/svix/dist/models/applicationPatch.js"(exports) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    exports.ApplicationPatchSerializer = void 0;
    exports.ApplicationPatchSerializer = {
      _fromJsonObject(object) {
        return {
          metadata: object["metadata"],
          name: object["name"],
          rateLimit: object["rateLimit"],
          uid: object["uid"]
        };
      },
      _toJsonObject(self) {
        return {
          metadata: self.metadata,
          name: self.name,
          rateLimit: self.rateLimit,
          uid: self.uid
        };
      }
    };
  }
});

// node_modules/svix/dist/models/listResponseApplicationOut.js
var require_listResponseApplicationOut = __commonJS({
  "node_modules/svix/dist/models/listResponseApplicationOut.js"(exports) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    exports.ListResponseApplicationOutSerializer = void 0;
    var applicationOut_1 = require_applicationOut();
    exports.ListResponseApplicationOutSerializer = {
      _fromJsonObject(object) {
        return {
          data: object["data"].map((item) => applicationOut_1.ApplicationOutSerializer._fromJsonObject(item)),
          done: object["done"],
          iterator: object["iterator"],
          prevIterator: object["prevIterator"]
        };
      },
      _toJsonObject(self) {
        return {
          data: self.data.map((item) => applicationOut_1.ApplicationOutSerializer._toJsonObject(item)),
          done: self.done,
          iterator: self.iterator,
          prevIterator: self.prevIterator
        };
      }
    };
  }
});

// node_modules/svix/dist/util.js
var require_util = __commonJS({
  "node_modules/svix/dist/util.js"(exports) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    exports.ApiException = void 0;
    var ApiException = class extends Error {
      constructor(code, body, headers) {
        super(`HTTP-Code: ${code}
Headers: ${JSON.stringify(headers)}`);
        this.code = code;
        this.body = body;
        this.headers = {};
        headers.forEach((value, name) => {
          this.headers[name] = value;
        });
      }
    };
    exports.ApiException = ApiException;
  }
});

// node_modules/svix/node_modules/uuid/dist/esm-node/max.js
var max_default;
var init_max = __esm({
  "node_modules/svix/node_modules/uuid/dist/esm-node/max.js"() {
    max_default = "ffffffff-ffff-ffff-ffff-ffffffffffff";
  }
});

// node_modules/svix/node_modules/uuid/dist/esm-node/nil.js
var nil_default;
var init_nil = __esm({
  "node_modules/svix/node_modules/uuid/dist/esm-node/nil.js"() {
    nil_default = "00000000-0000-0000-0000-000000000000";
  }
});

// node_modules/svix/node_modules/uuid/dist/esm-node/regex.js
var regex_default;
var init_regex = __esm({
  "node_modules/svix/node_modules/uuid/dist/esm-node/regex.js"() {
    regex_default = /^(?:[0-9a-f]{8}-[0-9a-f]{4}-[1-8][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}|00000000-0000-0000-0000-000000000000|ffffffff-ffff-ffff-ffff-ffffffffffff)$/i;
  }
});

// node_modules/svix/node_modules/uuid/dist/esm-node/validate.js
function validate(uuid) {
  return typeof uuid === "string" && regex_default.test(uuid);
}
var validate_default;
var init_validate = __esm({
  "node_modules/svix/node_modules/uuid/dist/esm-node/validate.js"() {
    init_regex();
    validate_default = validate;
  }
});

// node_modules/svix/node_modules/uuid/dist/esm-node/parse.js
function parse(uuid) {
  if (!validate_default(uuid)) {
    throw TypeError("Invalid UUID");
  }
  let v;
  const arr = new Uint8Array(16);
  arr[0] = (v = parseInt(uuid.slice(0, 8), 16)) >>> 24;
  arr[1] = v >>> 16 & 255;
  arr[2] = v >>> 8 & 255;
  arr[3] = v & 255;
  arr[4] = (v = parseInt(uuid.slice(9, 13), 16)) >>> 8;
  arr[5] = v & 255;
  arr[6] = (v = parseInt(uuid.slice(14, 18), 16)) >>> 8;
  arr[7] = v & 255;
  arr[8] = (v = parseInt(uuid.slice(19, 23), 16)) >>> 8;
  arr[9] = v & 255;
  arr[10] = (v = parseInt(uuid.slice(24, 36), 16)) / 1099511627776 & 255;
  arr[11] = v / 4294967296 & 255;
  arr[12] = v >>> 24 & 255;
  arr[13] = v >>> 16 & 255;
  arr[14] = v >>> 8 & 255;
  arr[15] = v & 255;
  return arr;
}
var parse_default;
var init_parse = __esm({
  "node_modules/svix/node_modules/uuid/dist/esm-node/parse.js"() {
    init_validate();
    parse_default = parse;
  }
});

// node_modules/svix/node_modules/uuid/dist/esm-node/stringify.js
function unsafeStringify(arr, offset = 0) {
  return (byteToHex[arr[offset + 0]] + byteToHex[arr[offset + 1]] + byteToHex[arr[offset + 2]] + byteToHex[arr[offset + 3]] + "-" + byteToHex[arr[offset + 4]] + byteToHex[arr[offset + 5]] + "-" + byteToHex[arr[offset + 6]] + byteToHex[arr[offset + 7]] + "-" + byteToHex[arr[offset + 8]] + byteToHex[arr[offset + 9]] + "-" + byteToHex[arr[offset + 10]] + byteToHex[arr[offset + 11]] + byteToHex[arr[offset + 12]] + byteToHex[arr[offset + 13]] + byteToHex[arr[offset + 14]] + byteToHex[arr[offset + 15]]).toLowerCase();
}
function stringify(arr, offset = 0) {
  const uuid = unsafeStringify(arr, offset);
  if (!validate_default(uuid)) {
    throw TypeError("Stringified UUID is invalid");
  }
  return uuid;
}
var byteToHex, stringify_default;
var init_stringify = __esm({
  "node_modules/svix/node_modules/uuid/dist/esm-node/stringify.js"() {
    init_validate();
    byteToHex = [];
    for (let i = 0; i < 256; ++i) {
      byteToHex.push((i + 256).toString(16).slice(1));
    }
    stringify_default = stringify;
  }
});

// node_modules/svix/node_modules/uuid/dist/esm-node/rng.js
import crypto from "node:crypto";
function rng() {
  if (poolPtr > rnds8Pool.length - 16) {
    crypto.randomFillSync(rnds8Pool);
    poolPtr = 0;
  }
  return rnds8Pool.slice(poolPtr, poolPtr += 16);
}
var rnds8Pool, poolPtr;
var init_rng = __esm({
  "node_modules/svix/node_modules/uuid/dist/esm-node/rng.js"() {
    rnds8Pool = new Uint8Array(256);
    poolPtr = rnds8Pool.length;
  }
});

// node_modules/svix/node_modules/uuid/dist/esm-node/v1.js
function v1(options, buf, offset) {
  let i = buf && offset || 0;
  const b = buf || new Array(16);
  options = options || {};
  let node = options.node;
  let clockseq = options.clockseq;
  if (!options._v6) {
    if (!node) {
      node = _nodeId;
    }
    if (clockseq == null) {
      clockseq = _clockseq;
    }
  }
  if (node == null || clockseq == null) {
    const seedBytes = options.random || (options.rng || rng)();
    if (node == null) {
      node = [seedBytes[0], seedBytes[1], seedBytes[2], seedBytes[3], seedBytes[4], seedBytes[5]];
      if (!_nodeId && !options._v6) {
        node[0] |= 1;
        _nodeId = node;
      }
    }
    if (clockseq == null) {
      clockseq = (seedBytes[6] << 8 | seedBytes[7]) & 16383;
      if (_clockseq === void 0 && !options._v6) {
        _clockseq = clockseq;
      }
    }
  }
  let msecs = options.msecs !== void 0 ? options.msecs : Date.now();
  let nsecs = options.nsecs !== void 0 ? options.nsecs : _lastNSecs + 1;
  const dt = msecs - _lastMSecs + (nsecs - _lastNSecs) / 1e4;
  if (dt < 0 && options.clockseq === void 0) {
    clockseq = clockseq + 1 & 16383;
  }
  if ((dt < 0 || msecs > _lastMSecs) && options.nsecs === void 0) {
    nsecs = 0;
  }
  if (nsecs >= 1e4) {
    throw new Error("uuid.v1(): Can't create more than 10M uuids/sec");
  }
  _lastMSecs = msecs;
  _lastNSecs = nsecs;
  _clockseq = clockseq;
  msecs += 122192928e5;
  const tl = ((msecs & 268435455) * 1e4 + nsecs) % 4294967296;
  b[i++] = tl >>> 24 & 255;
  b[i++] = tl >>> 16 & 255;
  b[i++] = tl >>> 8 & 255;
  b[i++] = tl & 255;
  const tmh = msecs / 4294967296 * 1e4 & 268435455;
  b[i++] = tmh >>> 8 & 255;
  b[i++] = tmh & 255;
  b[i++] = tmh >>> 24 & 15 | 16;
  b[i++] = tmh >>> 16 & 255;
  b[i++] = clockseq >>> 8 | 128;
  b[i++] = clockseq & 255;
  for (let n = 0; n < 6; ++n) {
    b[i + n] = node[n];
  }
  return buf || unsafeStringify(b);
}
var _nodeId, _clockseq, _lastMSecs, _lastNSecs, v1_default;
var init_v1 = __esm({
  "node_modules/svix/node_modules/uuid/dist/esm-node/v1.js"() {
    init_rng();
    init_stringify();
    _lastMSecs = 0;
    _lastNSecs = 0;
    v1_default = v1;
  }
});

// node_modules/svix/node_modules/uuid/dist/esm-node/v1ToV6.js
function v1ToV6(uuid) {
  const v1Bytes = typeof uuid === "string" ? parse_default(uuid) : uuid;
  const v6Bytes = _v1ToV6(v1Bytes);
  return typeof uuid === "string" ? unsafeStringify(v6Bytes) : v6Bytes;
}
function _v1ToV6(v1Bytes, randomize = false) {
  return Uint8Array.of((v1Bytes[6] & 15) << 4 | v1Bytes[7] >> 4 & 15, (v1Bytes[7] & 15) << 4 | (v1Bytes[4] & 240) >> 4, (v1Bytes[4] & 15) << 4 | (v1Bytes[5] & 240) >> 4, (v1Bytes[5] & 15) << 4 | (v1Bytes[0] & 240) >> 4, (v1Bytes[0] & 15) << 4 | (v1Bytes[1] & 240) >> 4, (v1Bytes[1] & 15) << 4 | (v1Bytes[2] & 240) >> 4, 96 | v1Bytes[2] & 15, v1Bytes[3], v1Bytes[8], v1Bytes[9], v1Bytes[10], v1Bytes[11], v1Bytes[12], v1Bytes[13], v1Bytes[14], v1Bytes[15]);
}
var init_v1ToV6 = __esm({
  "node_modules/svix/node_modules/uuid/dist/esm-node/v1ToV6.js"() {
    init_parse();
    init_stringify();
  }
});

// node_modules/svix/node_modules/uuid/dist/esm-node/v35.js
function stringToBytes(str) {
  str = unescape(encodeURIComponent(str));
  const bytes = [];
  for (let i = 0; i < str.length; ++i) {
    bytes.push(str.charCodeAt(i));
  }
  return bytes;
}
function v35(name, version3, hashfunc) {
  function generateUUID(value, namespace, buf, offset) {
    var _namespace;
    if (typeof value === "string") {
      value = stringToBytes(value);
    }
    if (typeof namespace === "string") {
      namespace = parse_default(namespace);
    }
    if (((_namespace = namespace) === null || _namespace === void 0 ? void 0 : _namespace.length) !== 16) {
      throw TypeError("Namespace must be array-like (16 iterable integer values, 0-255)");
    }
    let bytes = new Uint8Array(16 + value.length);
    bytes.set(namespace);
    bytes.set(value, namespace.length);
    bytes = hashfunc(bytes);
    bytes[6] = bytes[6] & 15 | version3;
    bytes[8] = bytes[8] & 63 | 128;
    if (buf) {
      offset = offset || 0;
      for (let i = 0; i < 16; ++i) {
        buf[offset + i] = bytes[i];
      }
      return buf;
    }
    return unsafeStringify(bytes);
  }
  try {
    generateUUID.name = name;
  } catch (err) {
  }
  generateUUID.DNS = DNS;
  generateUUID.URL = URL2;
  return generateUUID;
}
var DNS, URL2;
var init_v35 = __esm({
  "node_modules/svix/node_modules/uuid/dist/esm-node/v35.js"() {
    init_stringify();
    init_parse();
    DNS = "6ba7b810-9dad-11d1-80b4-00c04fd430c8";
    URL2 = "6ba7b811-9dad-11d1-80b4-00c04fd430c8";
  }
});

// node_modules/svix/node_modules/uuid/dist/esm-node/md5.js
import crypto2 from "node:crypto";
function md5(bytes) {
  if (Array.isArray(bytes)) {
    bytes = Buffer.from(bytes);
  } else if (typeof bytes === "string") {
    bytes = Buffer.from(bytes, "utf8");
  }
  return crypto2.createHash("md5").update(bytes).digest();
}
var md5_default;
var init_md5 = __esm({
  "node_modules/svix/node_modules/uuid/dist/esm-node/md5.js"() {
    md5_default = md5;
  }
});

// node_modules/svix/node_modules/uuid/dist/esm-node/v3.js
var v3, v3_default;
var init_v3 = __esm({
  "node_modules/svix/node_modules/uuid/dist/esm-node/v3.js"() {
    init_v35();
    init_md5();
    v3 = v35("v3", 48, md5_default);
    v3_default = v3;
  }
});

// node_modules/svix/node_modules/uuid/dist/esm-node/native.js
import crypto3 from "node:crypto";
var native_default;
var init_native = __esm({
  "node_modules/svix/node_modules/uuid/dist/esm-node/native.js"() {
    native_default = {
      randomUUID: crypto3.randomUUID
    };
  }
});

// node_modules/svix/node_modules/uuid/dist/esm-node/v4.js
function v4(options, buf, offset) {
  if (native_default.randomUUID && !buf && !options) {
    return native_default.randomUUID();
  }
  options = options || {};
  const rnds = options.random || (options.rng || rng)();
  rnds[6] = rnds[6] & 15 | 64;
  rnds[8] = rnds[8] & 63 | 128;
  if (buf) {
    offset = offset || 0;
    for (let i = 0; i < 16; ++i) {
      buf[offset + i] = rnds[i];
    }
    return buf;
  }
  return unsafeStringify(rnds);
}
var v4_default;
var init_v4 = __esm({
  "node_modules/svix/node_modules/uuid/dist/esm-node/v4.js"() {
    init_native();
    init_rng();
    init_stringify();
    v4_default = v4;
  }
});

// node_modules/svix/node_modules/uuid/dist/esm-node/sha1.js
import crypto4 from "node:crypto";
function sha1(bytes) {
  if (Array.isArray(bytes)) {
    bytes = Buffer.from(bytes);
  } else if (typeof bytes === "string") {
    bytes = Buffer.from(bytes, "utf8");
  }
  return crypto4.createHash("sha1").update(bytes).digest();
}
var sha1_default;
var init_sha1 = __esm({
  "node_modules/svix/node_modules/uuid/dist/esm-node/sha1.js"() {
    sha1_default = sha1;
  }
});

// node_modules/svix/node_modules/uuid/dist/esm-node/v5.js
var v5, v5_default;
var init_v5 = __esm({
  "node_modules/svix/node_modules/uuid/dist/esm-node/v5.js"() {
    init_v35();
    init_sha1();
    v5 = v35("v5", 80, sha1_default);
    v5_default = v5;
  }
});

// node_modules/svix/node_modules/uuid/dist/esm-node/v6.js
function v6(options = {}, buf, offset = 0) {
  let bytes = v1_default({
    ...options,
    _v6: true
  }, new Uint8Array(16));
  bytes = v1ToV6(bytes);
  if (buf) {
    for (let i = 0; i < 16; i++) {
      buf[offset + i] = bytes[i];
    }
    return buf;
  }
  return unsafeStringify(bytes);
}
var init_v6 = __esm({
  "node_modules/svix/node_modules/uuid/dist/esm-node/v6.js"() {
    init_stringify();
    init_v1();
    init_v1ToV6();
  }
});

// node_modules/svix/node_modules/uuid/dist/esm-node/v6ToV1.js
function v6ToV1(uuid) {
  const v6Bytes = typeof uuid === "string" ? parse_default(uuid) : uuid;
  const v1Bytes = _v6ToV1(v6Bytes);
  return typeof uuid === "string" ? unsafeStringify(v1Bytes) : v1Bytes;
}
function _v6ToV1(v6Bytes) {
  return Uint8Array.of((v6Bytes[3] & 15) << 4 | v6Bytes[4] >> 4 & 15, (v6Bytes[4] & 15) << 4 | (v6Bytes[5] & 240) >> 4, (v6Bytes[5] & 15) << 4 | v6Bytes[6] & 15, v6Bytes[7], (v6Bytes[1] & 15) << 4 | (v6Bytes[2] & 240) >> 4, (v6Bytes[2] & 15) << 4 | (v6Bytes[3] & 240) >> 4, 16 | (v6Bytes[0] & 240) >> 4, (v6Bytes[0] & 15) << 4 | (v6Bytes[1] & 240) >> 4, v6Bytes[8], v6Bytes[9], v6Bytes[10], v6Bytes[11], v6Bytes[12], v6Bytes[13], v6Bytes[14], v6Bytes[15]);
}
var init_v6ToV1 = __esm({
  "node_modules/svix/node_modules/uuid/dist/esm-node/v6ToV1.js"() {
    init_parse();
    init_stringify();
  }
});

// node_modules/svix/node_modules/uuid/dist/esm-node/v7.js
function v7(options, buf, offset) {
  options = options || {};
  let i = buf && offset || 0;
  const b = buf || new Uint8Array(16);
  const rnds = options.random || (options.rng || rng)();
  const msecs = options.msecs !== void 0 ? options.msecs : Date.now();
  let seq = options.seq !== void 0 ? options.seq : null;
  let seqHigh = _seqHigh;
  let seqLow = _seqLow;
  if (msecs > _msecs && options.msecs === void 0) {
    _msecs = msecs;
    if (seq !== null) {
      seqHigh = null;
      seqLow = null;
    }
  }
  if (seq !== null) {
    if (seq > 2147483647) {
      seq = 2147483647;
    }
    seqHigh = seq >>> 19 & 4095;
    seqLow = seq & 524287;
  }
  if (seqHigh === null || seqLow === null) {
    seqHigh = rnds[6] & 127;
    seqHigh = seqHigh << 8 | rnds[7];
    seqLow = rnds[8] & 63;
    seqLow = seqLow << 8 | rnds[9];
    seqLow = seqLow << 5 | rnds[10] >>> 3;
  }
  if (msecs + 1e4 > _msecs && seq === null) {
    if (++seqLow > 524287) {
      seqLow = 0;
      if (++seqHigh > 4095) {
        seqHigh = 0;
        _msecs++;
      }
    }
  } else {
    _msecs = msecs;
  }
  _seqHigh = seqHigh;
  _seqLow = seqLow;
  b[i++] = _msecs / 1099511627776 & 255;
  b[i++] = _msecs / 4294967296 & 255;
  b[i++] = _msecs / 16777216 & 255;
  b[i++] = _msecs / 65536 & 255;
  b[i++] = _msecs / 256 & 255;
  b[i++] = _msecs & 255;
  b[i++] = seqHigh >>> 4 & 15 | 112;
  b[i++] = seqHigh & 255;
  b[i++] = seqLow >>> 13 & 63 | 128;
  b[i++] = seqLow >>> 5 & 255;
  b[i++] = seqLow << 3 & 255 | rnds[10] & 7;
  b[i++] = rnds[11];
  b[i++] = rnds[12];
  b[i++] = rnds[13];
  b[i++] = rnds[14];
  b[i++] = rnds[15];
  return buf || unsafeStringify(b);
}
var _seqLow, _seqHigh, _msecs, v7_default;
var init_v7 = __esm({
  "node_modules/svix/node_modules/uuid/dist/esm-node/v7.js"() {
    init_rng();
    init_stringify();
    _seqLow = null;
    _seqHigh = null;
    _msecs = 0;
    v7_default = v7;
  }
});

// node_modules/svix/node_modules/uuid/dist/esm-node/version.js
function version(uuid) {
  if (!validate_default(uuid)) {
    throw TypeError("Invalid UUID");
  }
  return parseInt(uuid.slice(14, 15), 16);
}
var version_default;
var init_version = __esm({
  "node_modules/svix/node_modules/uuid/dist/esm-node/version.js"() {
    init_validate();
    version_default = version;
  }
});

// node_modules/svix/node_modules/uuid/dist/esm-node/index.js
var esm_node_exports = {};
__export(esm_node_exports, {
  MAX: () => max_default,
  NIL: () => nil_default,
  parse: () => parse_default,
  stringify: () => stringify_default,
  v1: () => v1_default,
  v1ToV6: () => v1ToV6,
  v3: () => v3_default,
  v4: () => v4_default,
  v5: () => v5_default,
  v6: () => v6,
  v6ToV1: () => v6ToV1,
  v7: () => v7_default,
  validate: () => validate_default,
  version: () => version_default
});
var init_esm_node = __esm({
  "node_modules/svix/node_modules/uuid/dist/esm-node/index.js"() {
    init_max();
    init_nil();
    init_parse();
    init_stringify();
    init_v1();
    init_v1ToV6();
    init_v3();
    init_v4();
    init_v5();
    init_v6();
    init_v6ToV1();
    init_v7();
    init_validate();
    init_version();
  }
});

// node_modules/svix/dist/request.js
var require_request = __commonJS({
  "node_modules/svix/dist/request.js"(exports) {
    "use strict";
    var __awaiter = exports && exports.__awaiter || function(thisArg, _arguments, P, generator) {
      function adopt(value) {
        return value instanceof P ? value : new P(function(resolve) {
          resolve(value);
        });
      }
      return new (P || (P = Promise))(function(resolve, reject) {
        function fulfilled(value) {
          try {
            step(generator.next(value));
          } catch (e) {
            reject(e);
          }
        }
        function rejected(value) {
          try {
            step(generator["throw"](value));
          } catch (e) {
            reject(e);
          }
        }
        function step(result) {
          result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected);
        }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
      });
    };
    Object.defineProperty(exports, "__esModule", { value: true });
    exports.SvixRequest = exports.HttpMethod = exports.LIB_VERSION = void 0;
    var util_1 = require_util();
    var uuid_1 = (init_esm_node(), __toCommonJS(esm_node_exports));
    exports.LIB_VERSION = "1.76.1";
    var USER_AGENT = `svix-libs/${exports.LIB_VERSION}/javascript`;
    var HttpMethod;
    (function(HttpMethod2) {
      HttpMethod2["GET"] = "GET";
      HttpMethod2["HEAD"] = "HEAD";
      HttpMethod2["POST"] = "POST";
      HttpMethod2["PUT"] = "PUT";
      HttpMethod2["DELETE"] = "DELETE";
      HttpMethod2["CONNECT"] = "CONNECT";
      HttpMethod2["OPTIONS"] = "OPTIONS";
      HttpMethod2["TRACE"] = "TRACE";
      HttpMethod2["PATCH"] = "PATCH";
    })(HttpMethod = exports.HttpMethod || (exports.HttpMethod = {}));
    var SvixRequest = class {
      constructor(method, path) {
        this.method = method;
        this.path = path;
        this.queryParams = {};
        this.headerParams = {};
      }
      setPathParam(name, value) {
        const newPath = this.path.replace(`{${name}}`, encodeURIComponent(value));
        if (this.path === newPath) {
          throw new Error(`path parameter ${name} not found`);
        }
        this.path = newPath;
      }
      setQueryParam(name, value) {
        if (value === void 0 || value === null) {
          return;
        }
        if (typeof value === "string") {
          this.queryParams[name] = value;
        } else if (typeof value === "boolean" || typeof value === "number") {
          this.queryParams[name] = value.toString();
        } else if (value instanceof Date) {
          this.queryParams[name] = value.toISOString();
        } else if (value instanceof Array) {
          if (value.length > 0) {
            this.queryParams[name] = value.join(",");
          }
        } else {
          const _assert_unreachable = value;
          throw new Error(`query parameter ${name} has unsupported type`);
        }
      }
      setHeaderParam(name, value) {
        if (value === void 0) {
          return;
        }
        this.headerParams[name] = value;
      }
      setBody(value) {
        this.body = JSON.stringify(value);
      }
      send(ctx, parseResponseBody) {
        return __awaiter(this, void 0, void 0, function* () {
          const response = yield this.sendInner(ctx);
          if (response.status == 204) {
            return null;
          }
          const responseBody = yield response.text();
          return parseResponseBody(JSON.parse(responseBody));
        });
      }
      sendNoResponseBody(ctx) {
        return __awaiter(this, void 0, void 0, function* () {
          yield this.sendInner(ctx);
        });
      }
      sendInner(ctx) {
        var _a, _b;
        return __awaiter(this, void 0, void 0, function* () {
          const url = new URL(ctx.baseUrl + this.path);
          for (const [name, value] of Object.entries(this.queryParams)) {
            url.searchParams.set(name, value);
          }
          if (this.headerParams["idempotency-key"] === void 0 && this.method.toUpperCase() === "POST") {
            this.headerParams["idempotency-key"] = "auto_" + (0, uuid_1.v4)();
          }
          const randomId = Math.floor(Math.random() * Number.MAX_SAFE_INTEGER);
          if (this.body != null) {
            this.headerParams["content-type"] = "application/json";
          }
          const isCredentialsSupported = "credentials" in Request.prototype;
          const response = yield sendWithRetry(url, {
            method: this.method.toString(),
            body: this.body,
            headers: Object.assign({ accept: "application/json, */*;q=0.8", authorization: `Bearer ${ctx.token}`, "user-agent": USER_AGENT, "svix-req-id": randomId.toString() }, this.headerParams),
            credentials: isCredentialsSupported ? "same-origin" : void 0,
            signal: ctx.timeout !== void 0 ? AbortSignal.timeout(ctx.timeout) : void 0
          }, ctx.retryScheduleInMs, (_a = ctx.retryScheduleInMs) === null || _a === void 0 ? void 0 : _a[0], ((_b = ctx.retryScheduleInMs) === null || _b === void 0 ? void 0 : _b.length) || ctx.numRetries);
          return filterResponseForErrors(response);
        });
      }
    };
    exports.SvixRequest = SvixRequest;
    function filterResponseForErrors(response) {
      return __awaiter(this, void 0, void 0, function* () {
        if (response.status < 300) {
          return response;
        }
        const responseBody = yield response.text();
        if (response.status === 422) {
          throw new util_1.ApiException(response.status, JSON.parse(responseBody), response.headers);
        }
        if (response.status >= 400 && response.status <= 499) {
          throw new util_1.ApiException(response.status, JSON.parse(responseBody), response.headers);
        }
        throw new util_1.ApiException(response.status, responseBody, response.headers);
      });
    }
    function sendWithRetry(url, init2, retryScheduleInMs, nextInterval = 50, triesLeft = 2, retryCount = 1) {
      return __awaiter(this, void 0, void 0, function* () {
        const sleep = (interval) => new Promise((resolve) => setTimeout(resolve, interval));
        try {
          const response = yield fetch(url, init2);
          if (triesLeft <= 0 || response.status < 500) {
            return response;
          }
        } catch (e) {
          if (triesLeft <= 0) {
            throw e;
          }
        }
        yield sleep(nextInterval);
        init2.headers["svix-retry-count"] = retryCount.toString();
        nextInterval = (retryScheduleInMs === null || retryScheduleInMs === void 0 ? void 0 : retryScheduleInMs[retryCount]) || nextInterval * 2;
        return yield sendWithRetry(url, init2, retryScheduleInMs, nextInterval, --triesLeft, ++retryCount);
      });
    }
  }
});

// node_modules/svix/dist/api/application.js
var require_application = __commonJS({
  "node_modules/svix/dist/api/application.js"(exports) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    exports.Application = void 0;
    var applicationIn_1 = require_applicationIn();
    var applicationOut_1 = require_applicationOut();
    var applicationPatch_1 = require_applicationPatch();
    var listResponseApplicationOut_1 = require_listResponseApplicationOut();
    var request_1 = require_request();
    var Application = class {
      constructor(requestCtx) {
        this.requestCtx = requestCtx;
      }
      list(options) {
        const request = new request_1.SvixRequest(request_1.HttpMethod.GET, "/api/v1/app");
        request.setQueryParam("limit", options === null || options === void 0 ? void 0 : options.limit);
        request.setQueryParam("iterator", options === null || options === void 0 ? void 0 : options.iterator);
        request.setQueryParam("order", options === null || options === void 0 ? void 0 : options.order);
        return request.send(this.requestCtx, listResponseApplicationOut_1.ListResponseApplicationOutSerializer._fromJsonObject);
      }
      create(applicationIn, options) {
        const request = new request_1.SvixRequest(request_1.HttpMethod.POST, "/api/v1/app");
        request.setHeaderParam("idempotency-key", options === null || options === void 0 ? void 0 : options.idempotencyKey);
        request.setBody(applicationIn_1.ApplicationInSerializer._toJsonObject(applicationIn));
        return request.send(this.requestCtx, applicationOut_1.ApplicationOutSerializer._fromJsonObject);
      }
      getOrCreate(applicationIn, options) {
        const request = new request_1.SvixRequest(request_1.HttpMethod.POST, "/api/v1/app");
        request.setQueryParam("get_if_exists", true);
        request.setHeaderParam("idempotency-key", options === null || options === void 0 ? void 0 : options.idempotencyKey);
        request.setBody(applicationIn_1.ApplicationInSerializer._toJsonObject(applicationIn));
        return request.send(this.requestCtx, applicationOut_1.ApplicationOutSerializer._fromJsonObject);
      }
      get(appId) {
        const request = new request_1.SvixRequest(request_1.HttpMethod.GET, "/api/v1/app/{app_id}");
        request.setPathParam("app_id", appId);
        return request.send(this.requestCtx, applicationOut_1.ApplicationOutSerializer._fromJsonObject);
      }
      update(appId, applicationIn) {
        const request = new request_1.SvixRequest(request_1.HttpMethod.PUT, "/api/v1/app/{app_id}");
        request.setPathParam("app_id", appId);
        request.setBody(applicationIn_1.ApplicationInSerializer._toJsonObject(applicationIn));
        return request.send(this.requestCtx, applicationOut_1.ApplicationOutSerializer._fromJsonObject);
      }
      delete(appId) {
        const request = new request_1.SvixRequest(request_1.HttpMethod.DELETE, "/api/v1/app/{app_id}");
        request.setPathParam("app_id", appId);
        return request.sendNoResponseBody(this.requestCtx);
      }
      patch(appId, applicationPatch) {
        const request = new request_1.SvixRequest(request_1.HttpMethod.PATCH, "/api/v1/app/{app_id}");
        request.setPathParam("app_id", appId);
        request.setBody(applicationPatch_1.ApplicationPatchSerializer._toJsonObject(applicationPatch));
        return request.send(this.requestCtx, applicationOut_1.ApplicationOutSerializer._fromJsonObject);
      }
    };
    exports.Application = Application;
  }
});

// node_modules/svix/dist/models/appPortalCapability.js
var require_appPortalCapability = __commonJS({
  "node_modules/svix/dist/models/appPortalCapability.js"(exports) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    exports.AppPortalCapabilitySerializer = exports.AppPortalCapability = void 0;
    var AppPortalCapability;
    (function(AppPortalCapability2) {
      AppPortalCapability2["ViewBase"] = "ViewBase";
      AppPortalCapability2["ViewEndpointSecret"] = "ViewEndpointSecret";
      AppPortalCapability2["ManageEndpointSecret"] = "ManageEndpointSecret";
      AppPortalCapability2["ManageTransformations"] = "ManageTransformations";
      AppPortalCapability2["CreateAttempts"] = "CreateAttempts";
      AppPortalCapability2["ManageEndpoint"] = "ManageEndpoint";
    })(AppPortalCapability = exports.AppPortalCapability || (exports.AppPortalCapability = {}));
    exports.AppPortalCapabilitySerializer = {
      _fromJsonObject(object) {
        return object;
      },
      _toJsonObject(self) {
        return self;
      }
    };
  }
});

// node_modules/svix/dist/models/appPortalAccessIn.js
var require_appPortalAccessIn = __commonJS({
  "node_modules/svix/dist/models/appPortalAccessIn.js"(exports) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    exports.AppPortalAccessInSerializer = void 0;
    var appPortalCapability_1 = require_appPortalCapability();
    var applicationIn_1 = require_applicationIn();
    exports.AppPortalAccessInSerializer = {
      _fromJsonObject(object) {
        var _a;
        return {
          application: object["application"] ? applicationIn_1.ApplicationInSerializer._fromJsonObject(object["application"]) : void 0,
          capabilities: (_a = object["capabilities"]) === null || _a === void 0 ? void 0 : _a.map((item) => appPortalCapability_1.AppPortalCapabilitySerializer._fromJsonObject(item)),
          expiry: object["expiry"],
          featureFlags: object["featureFlags"],
          readOnly: object["readOnly"],
          sessionId: object["sessionId"]
        };
      },
      _toJsonObject(self) {
        var _a;
        return {
          application: self.application ? applicationIn_1.ApplicationInSerializer._toJsonObject(self.application) : void 0,
          capabilities: (_a = self.capabilities) === null || _a === void 0 ? void 0 : _a.map((item) => appPortalCapability_1.AppPortalCapabilitySerializer._toJsonObject(item)),
          expiry: self.expiry,
          featureFlags: self.featureFlags,
          readOnly: self.readOnly,
          sessionId: self.sessionId
        };
      }
    };
  }
});

// node_modules/svix/dist/models/appPortalAccessOut.js
var require_appPortalAccessOut = __commonJS({
  "node_modules/svix/dist/models/appPortalAccessOut.js"(exports) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    exports.AppPortalAccessOutSerializer = void 0;
    exports.AppPortalAccessOutSerializer = {
      _fromJsonObject(object) {
        return {
          token: object["token"],
          url: object["url"]
        };
      },
      _toJsonObject(self) {
        return {
          token: self.token,
          url: self.url
        };
      }
    };
  }
});

// node_modules/svix/dist/models/applicationTokenExpireIn.js
var require_applicationTokenExpireIn = __commonJS({
  "node_modules/svix/dist/models/applicationTokenExpireIn.js"(exports) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    exports.ApplicationTokenExpireInSerializer = void 0;
    exports.ApplicationTokenExpireInSerializer = {
      _fromJsonObject(object) {
        return {
          expiry: object["expiry"],
          sessionIds: object["sessionIds"]
        };
      },
      _toJsonObject(self) {
        return {
          expiry: self.expiry,
          sessionIds: self.sessionIds
        };
      }
    };
  }
});

// node_modules/svix/dist/models/dashboardAccessOut.js
var require_dashboardAccessOut = __commonJS({
  "node_modules/svix/dist/models/dashboardAccessOut.js"(exports) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    exports.DashboardAccessOutSerializer = void 0;
    exports.DashboardAccessOutSerializer = {
      _fromJsonObject(object) {
        return {
          token: object["token"],
          url: object["url"]
        };
      },
      _toJsonObject(self) {
        return {
          token: self.token,
          url: self.url
        };
      }
    };
  }
});

// node_modules/svix/dist/api/authentication.js
var require_authentication = __commonJS({
  "node_modules/svix/dist/api/authentication.js"(exports) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    exports.Authentication = void 0;
    var appPortalAccessIn_1 = require_appPortalAccessIn();
    var appPortalAccessOut_1 = require_appPortalAccessOut();
    var applicationTokenExpireIn_1 = require_applicationTokenExpireIn();
    var dashboardAccessOut_1 = require_dashboardAccessOut();
    var request_1 = require_request();
    var Authentication = class {
      constructor(requestCtx) {
        this.requestCtx = requestCtx;
      }
      appPortalAccess(appId, appPortalAccessIn, options) {
        const request = new request_1.SvixRequest(request_1.HttpMethod.POST, "/api/v1/auth/app-portal-access/{app_id}");
        request.setPathParam("app_id", appId);
        request.setHeaderParam("idempotency-key", options === null || options === void 0 ? void 0 : options.idempotencyKey);
        request.setBody(appPortalAccessIn_1.AppPortalAccessInSerializer._toJsonObject(appPortalAccessIn));
        return request.send(this.requestCtx, appPortalAccessOut_1.AppPortalAccessOutSerializer._fromJsonObject);
      }
      expireAll(appId, applicationTokenExpireIn, options) {
        const request = new request_1.SvixRequest(request_1.HttpMethod.POST, "/api/v1/auth/app/{app_id}/expire-all");
        request.setPathParam("app_id", appId);
        request.setHeaderParam("idempotency-key", options === null || options === void 0 ? void 0 : options.idempotencyKey);
        request.setBody(applicationTokenExpireIn_1.ApplicationTokenExpireInSerializer._toJsonObject(applicationTokenExpireIn));
        return request.sendNoResponseBody(this.requestCtx);
      }
      dashboardAccess(appId, options) {
        const request = new request_1.SvixRequest(request_1.HttpMethod.POST, "/api/v1/auth/dashboard-access/{app_id}");
        request.setPathParam("app_id", appId);
        request.setHeaderParam("idempotency-key", options === null || options === void 0 ? void 0 : options.idempotencyKey);
        return request.send(this.requestCtx, dashboardAccessOut_1.DashboardAccessOutSerializer._fromJsonObject);
      }
      logout(options) {
        const request = new request_1.SvixRequest(request_1.HttpMethod.POST, "/api/v1/auth/logout");
        request.setHeaderParam("idempotency-key", options === null || options === void 0 ? void 0 : options.idempotencyKey);
        return request.sendNoResponseBody(this.requestCtx);
      }
    };
    exports.Authentication = Authentication;
  }
});

// node_modules/svix/dist/models/backgroundTaskStatus.js
var require_backgroundTaskStatus = __commonJS({
  "node_modules/svix/dist/models/backgroundTaskStatus.js"(exports) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    exports.BackgroundTaskStatusSerializer = exports.BackgroundTaskStatus = void 0;
    var BackgroundTaskStatus;
    (function(BackgroundTaskStatus2) {
      BackgroundTaskStatus2["Running"] = "running";
      BackgroundTaskStatus2["Finished"] = "finished";
      BackgroundTaskStatus2["Failed"] = "failed";
    })(BackgroundTaskStatus = exports.BackgroundTaskStatus || (exports.BackgroundTaskStatus = {}));
    exports.BackgroundTaskStatusSerializer = {
      _fromJsonObject(object) {
        return object;
      },
      _toJsonObject(self) {
        return self;
      }
    };
  }
});

// node_modules/svix/dist/models/backgroundTaskType.js
var require_backgroundTaskType = __commonJS({
  "node_modules/svix/dist/models/backgroundTaskType.js"(exports) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    exports.BackgroundTaskTypeSerializer = exports.BackgroundTaskType = void 0;
    var BackgroundTaskType;
    (function(BackgroundTaskType2) {
      BackgroundTaskType2["EndpointReplay"] = "endpoint.replay";
      BackgroundTaskType2["EndpointRecover"] = "endpoint.recover";
      BackgroundTaskType2["ApplicationStats"] = "application.stats";
      BackgroundTaskType2["MessageBroadcast"] = "message.broadcast";
      BackgroundTaskType2["SdkGenerate"] = "sdk.generate";
      BackgroundTaskType2["EventTypeAggregate"] = "event-type.aggregate";
      BackgroundTaskType2["ApplicationPurgeContent"] = "application.purge_content";
    })(BackgroundTaskType = exports.BackgroundTaskType || (exports.BackgroundTaskType = {}));
    exports.BackgroundTaskTypeSerializer = {
      _fromJsonObject(object) {
        return object;
      },
      _toJsonObject(self) {
        return self;
      }
    };
  }
});

// node_modules/svix/dist/models/backgroundTaskOut.js
var require_backgroundTaskOut = __commonJS({
  "node_modules/svix/dist/models/backgroundTaskOut.js"(exports) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    exports.BackgroundTaskOutSerializer = void 0;
    var backgroundTaskStatus_1 = require_backgroundTaskStatus();
    var backgroundTaskType_1 = require_backgroundTaskType();
    exports.BackgroundTaskOutSerializer = {
      _fromJsonObject(object) {
        return {
          data: object["data"],
          id: object["id"],
          status: backgroundTaskStatus_1.BackgroundTaskStatusSerializer._fromJsonObject(object["status"]),
          task: backgroundTaskType_1.BackgroundTaskTypeSerializer._fromJsonObject(object["task"])
        };
      },
      _toJsonObject(self) {
        return {
          data: self.data,
          id: self.id,
          status: backgroundTaskStatus_1.BackgroundTaskStatusSerializer._toJsonObject(self.status),
          task: backgroundTaskType_1.BackgroundTaskTypeSerializer._toJsonObject(self.task)
        };
      }
    };
  }
});

// node_modules/svix/dist/models/listResponseBackgroundTaskOut.js
var require_listResponseBackgroundTaskOut = __commonJS({
  "node_modules/svix/dist/models/listResponseBackgroundTaskOut.js"(exports) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    exports.ListResponseBackgroundTaskOutSerializer = void 0;
    var backgroundTaskOut_1 = require_backgroundTaskOut();
    exports.ListResponseBackgroundTaskOutSerializer = {
      _fromJsonObject(object) {
        return {
          data: object["data"].map((item) => backgroundTaskOut_1.BackgroundTaskOutSerializer._fromJsonObject(item)),
          done: object["done"],
          iterator: object["iterator"],
          prevIterator: object["prevIterator"]
        };
      },
      _toJsonObject(self) {
        return {
          data: self.data.map((item) => backgroundTaskOut_1.BackgroundTaskOutSerializer._toJsonObject(item)),
          done: self.done,
          iterator: self.iterator,
          prevIterator: self.prevIterator
        };
      }
    };
  }
});

// node_modules/svix/dist/api/backgroundTask.js
var require_backgroundTask = __commonJS({
  "node_modules/svix/dist/api/backgroundTask.js"(exports) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    exports.BackgroundTask = void 0;
    var backgroundTaskOut_1 = require_backgroundTaskOut();
    var listResponseBackgroundTaskOut_1 = require_listResponseBackgroundTaskOut();
    var request_1 = require_request();
    var BackgroundTask = class {
      constructor(requestCtx) {
        this.requestCtx = requestCtx;
      }
      list(options) {
        const request = new request_1.SvixRequest(request_1.HttpMethod.GET, "/api/v1/background-task");
        request.setQueryParam("status", options === null || options === void 0 ? void 0 : options.status);
        request.setQueryParam("task", options === null || options === void 0 ? void 0 : options.task);
        request.setQueryParam("limit", options === null || options === void 0 ? void 0 : options.limit);
        request.setQueryParam("iterator", options === null || options === void 0 ? void 0 : options.iterator);
        request.setQueryParam("order", options === null || options === void 0 ? void 0 : options.order);
        return request.send(this.requestCtx, listResponseBackgroundTaskOut_1.ListResponseBackgroundTaskOutSerializer._fromJsonObject);
      }
      listByEndpoint(options) {
        return this.list(options);
      }
      get(taskId) {
        const request = new request_1.SvixRequest(request_1.HttpMethod.GET, "/api/v1/background-task/{task_id}");
        request.setPathParam("task_id", taskId);
        return request.send(this.requestCtx, backgroundTaskOut_1.BackgroundTaskOutSerializer._fromJsonObject);
      }
    };
    exports.BackgroundTask = BackgroundTask;
  }
});

// node_modules/svix/dist/models/endpointHeadersIn.js
var require_endpointHeadersIn = __commonJS({
  "node_modules/svix/dist/models/endpointHeadersIn.js"(exports) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    exports.EndpointHeadersInSerializer = void 0;
    exports.EndpointHeadersInSerializer = {
      _fromJsonObject(object) {
        return {
          headers: object["headers"]
        };
      },
      _toJsonObject(self) {
        return {
          headers: self.headers
        };
      }
    };
  }
});

// node_modules/svix/dist/models/endpointHeadersOut.js
var require_endpointHeadersOut = __commonJS({
  "node_modules/svix/dist/models/endpointHeadersOut.js"(exports) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    exports.EndpointHeadersOutSerializer = void 0;
    exports.EndpointHeadersOutSerializer = {
      _fromJsonObject(object) {
        return {
          headers: object["headers"],
          sensitive: object["sensitive"]
        };
      },
      _toJsonObject(self) {
        return {
          headers: self.headers,
          sensitive: self.sensitive
        };
      }
    };
  }
});

// node_modules/svix/dist/models/endpointHeadersPatchIn.js
var require_endpointHeadersPatchIn = __commonJS({
  "node_modules/svix/dist/models/endpointHeadersPatchIn.js"(exports) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    exports.EndpointHeadersPatchInSerializer = void 0;
    exports.EndpointHeadersPatchInSerializer = {
      _fromJsonObject(object) {
        return {
          deleteHeaders: object["deleteHeaders"],
          headers: object["headers"]
        };
      },
      _toJsonObject(self) {
        return {
          deleteHeaders: self.deleteHeaders,
          headers: self.headers
        };
      }
    };
  }
});

// node_modules/svix/dist/models/endpointIn.js
var require_endpointIn = __commonJS({
  "node_modules/svix/dist/models/endpointIn.js"(exports) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    exports.EndpointInSerializer = void 0;
    exports.EndpointInSerializer = {
      _fromJsonObject(object) {
        return {
          channels: object["channels"],
          description: object["description"],
          disabled: object["disabled"],
          filterTypes: object["filterTypes"],
          headers: object["headers"],
          metadata: object["metadata"],
          rateLimit: object["rateLimit"],
          secret: object["secret"],
          uid: object["uid"],
          url: object["url"],
          version: object["version"]
        };
      },
      _toJsonObject(self) {
        return {
          channels: self.channels,
          description: self.description,
          disabled: self.disabled,
          filterTypes: self.filterTypes,
          headers: self.headers,
          metadata: self.metadata,
          rateLimit: self.rateLimit,
          secret: self.secret,
          uid: self.uid,
          url: self.url,
          version: self.version
        };
      }
    };
  }
});

// node_modules/svix/dist/models/endpointOut.js
var require_endpointOut = __commonJS({
  "node_modules/svix/dist/models/endpointOut.js"(exports) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    exports.EndpointOutSerializer = void 0;
    exports.EndpointOutSerializer = {
      _fromJsonObject(object) {
        return {
          channels: object["channels"],
          createdAt: new Date(object["createdAt"]),
          description: object["description"],
          disabled: object["disabled"],
          filterTypes: object["filterTypes"],
          id: object["id"],
          metadata: object["metadata"],
          rateLimit: object["rateLimit"],
          uid: object["uid"],
          updatedAt: new Date(object["updatedAt"]),
          url: object["url"],
          version: object["version"]
        };
      },
      _toJsonObject(self) {
        return {
          channels: self.channels,
          createdAt: self.createdAt,
          description: self.description,
          disabled: self.disabled,
          filterTypes: self.filterTypes,
          id: self.id,
          metadata: self.metadata,
          rateLimit: self.rateLimit,
          uid: self.uid,
          updatedAt: self.updatedAt,
          url: self.url,
          version: self.version
        };
      }
    };
  }
});

// node_modules/svix/dist/models/endpointPatch.js
var require_endpointPatch = __commonJS({
  "node_modules/svix/dist/models/endpointPatch.js"(exports) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    exports.EndpointPatchSerializer = void 0;
    exports.EndpointPatchSerializer = {
      _fromJsonObject(object) {
        return {
          channels: object["channels"],
          description: object["description"],
          disabled: object["disabled"],
          filterTypes: object["filterTypes"],
          metadata: object["metadata"],
          rateLimit: object["rateLimit"],
          secret: object["secret"],
          uid: object["uid"],
          url: object["url"],
          version: object["version"]
        };
      },
      _toJsonObject(self) {
        return {
          channels: self.channels,
          description: self.description,
          disabled: self.disabled,
          filterTypes: self.filterTypes,
          metadata: self.metadata,
          rateLimit: self.rateLimit,
          secret: self.secret,
          uid: self.uid,
          url: self.url,
          version: self.version
        };
      }
    };
  }
});

// node_modules/svix/dist/models/endpointSecretOut.js
var require_endpointSecretOut = __commonJS({
  "node_modules/svix/dist/models/endpointSecretOut.js"(exports) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    exports.EndpointSecretOutSerializer = void 0;
    exports.EndpointSecretOutSerializer = {
      _fromJsonObject(object) {
        return {
          key: object["key"]
        };
      },
      _toJsonObject(self) {
        return {
          key: self.key
        };
      }
    };
  }
});

// node_modules/svix/dist/models/endpointSecretRotateIn.js
var require_endpointSecretRotateIn = __commonJS({
  "node_modules/svix/dist/models/endpointSecretRotateIn.js"(exports) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    exports.EndpointSecretRotateInSerializer = void 0;
    exports.EndpointSecretRotateInSerializer = {
      _fromJsonObject(object) {
        return {
          key: object["key"]
        };
      },
      _toJsonObject(self) {
        return {
          key: self.key
        };
      }
    };
  }
});

// node_modules/svix/dist/models/endpointStats.js
var require_endpointStats = __commonJS({
  "node_modules/svix/dist/models/endpointStats.js"(exports) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    exports.EndpointStatsSerializer = void 0;
    exports.EndpointStatsSerializer = {
      _fromJsonObject(object) {
        return {
          fail: object["fail"],
          pending: object["pending"],
          sending: object["sending"],
          success: object["success"]
        };
      },
      _toJsonObject(self) {
        return {
          fail: self.fail,
          pending: self.pending,
          sending: self.sending,
          success: self.success
        };
      }
    };
  }
});

// node_modules/svix/dist/models/endpointTransformationIn.js
var require_endpointTransformationIn = __commonJS({
  "node_modules/svix/dist/models/endpointTransformationIn.js"(exports) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    exports.EndpointTransformationInSerializer = void 0;
    exports.EndpointTransformationInSerializer = {
      _fromJsonObject(object) {
        return {
          code: object["code"],
          enabled: object["enabled"]
        };
      },
      _toJsonObject(self) {
        return {
          code: self.code,
          enabled: self.enabled
        };
      }
    };
  }
});

// node_modules/svix/dist/models/endpointTransformationOut.js
var require_endpointTransformationOut = __commonJS({
  "node_modules/svix/dist/models/endpointTransformationOut.js"(exports) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    exports.EndpointTransformationOutSerializer = void 0;
    exports.EndpointTransformationOutSerializer = {
      _fromJsonObject(object) {
        return {
          code: object["code"],
          enabled: object["enabled"]
        };
      },
      _toJsonObject(self) {
        return {
          code: self.code,
          enabled: self.enabled
        };
      }
    };
  }
});

// node_modules/svix/dist/models/endpointTransformationPatch.js
var require_endpointTransformationPatch = __commonJS({
  "node_modules/svix/dist/models/endpointTransformationPatch.js"(exports) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    exports.EndpointTransformationPatchSerializer = void 0;
    exports.EndpointTransformationPatchSerializer = {
      _fromJsonObject(object) {
        return {
          code: object["code"],
          enabled: object["enabled"]
        };
      },
      _toJsonObject(self) {
        return {
          code: self.code,
          enabled: self.enabled
        };
      }
    };
  }
});

// node_modules/svix/dist/models/endpointUpdate.js
var require_endpointUpdate = __commonJS({
  "node_modules/svix/dist/models/endpointUpdate.js"(exports) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    exports.EndpointUpdateSerializer = void 0;
    exports.EndpointUpdateSerializer = {
      _fromJsonObject(object) {
        return {
          channels: object["channels"],
          description: object["description"],
          disabled: object["disabled"],
          filterTypes: object["filterTypes"],
          metadata: object["metadata"],
          rateLimit: object["rateLimit"],
          uid: object["uid"],
          url: object["url"],
          version: object["version"]
        };
      },
      _toJsonObject(self) {
        return {
          channels: self.channels,
          description: self.description,
          disabled: self.disabled,
          filterTypes: self.filterTypes,
          metadata: self.metadata,
          rateLimit: self.rateLimit,
          uid: self.uid,
          url: self.url,
          version: self.version
        };
      }
    };
  }
});

// node_modules/svix/dist/models/eventExampleIn.js
var require_eventExampleIn = __commonJS({
  "node_modules/svix/dist/models/eventExampleIn.js"(exports) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    exports.EventExampleInSerializer = void 0;
    exports.EventExampleInSerializer = {
      _fromJsonObject(object) {
        return {
          eventType: object["eventType"],
          exampleIndex: object["exampleIndex"]
        };
      },
      _toJsonObject(self) {
        return {
          eventType: self.eventType,
          exampleIndex: self.exampleIndex
        };
      }
    };
  }
});

// node_modules/svix/dist/models/listResponseEndpointOut.js
var require_listResponseEndpointOut = __commonJS({
  "node_modules/svix/dist/models/listResponseEndpointOut.js"(exports) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    exports.ListResponseEndpointOutSerializer = void 0;
    var endpointOut_1 = require_endpointOut();
    exports.ListResponseEndpointOutSerializer = {
      _fromJsonObject(object) {
        return {
          data: object["data"].map((item) => endpointOut_1.EndpointOutSerializer._fromJsonObject(item)),
          done: object["done"],
          iterator: object["iterator"],
          prevIterator: object["prevIterator"]
        };
      },
      _toJsonObject(self) {
        return {
          data: self.data.map((item) => endpointOut_1.EndpointOutSerializer._toJsonObject(item)),
          done: self.done,
          iterator: self.iterator,
          prevIterator: self.prevIterator
        };
      }
    };
  }
});

// node_modules/svix/dist/models/messageOut.js
var require_messageOut = __commonJS({
  "node_modules/svix/dist/models/messageOut.js"(exports) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    exports.MessageOutSerializer = void 0;
    exports.MessageOutSerializer = {
      _fromJsonObject(object) {
        return {
          channels: object["channels"],
          eventId: object["eventId"],
          eventType: object["eventType"],
          id: object["id"],
          payload: object["payload"],
          tags: object["tags"],
          timestamp: new Date(object["timestamp"])
        };
      },
      _toJsonObject(self) {
        return {
          channels: self.channels,
          eventId: self.eventId,
          eventType: self.eventType,
          id: self.id,
          payload: self.payload,
          tags: self.tags,
          timestamp: self.timestamp
        };
      }
    };
  }
});

// node_modules/svix/dist/models/recoverIn.js
var require_recoverIn = __commonJS({
  "node_modules/svix/dist/models/recoverIn.js"(exports) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    exports.RecoverInSerializer = void 0;
    exports.RecoverInSerializer = {
      _fromJsonObject(object) {
        return {
          since: new Date(object["since"]),
          until: object["until"] ? new Date(object["until"]) : null
        };
      },
      _toJsonObject(self) {
        return {
          since: self.since,
          until: self.until
        };
      }
    };
  }
});

// node_modules/svix/dist/models/recoverOut.js
var require_recoverOut = __commonJS({
  "node_modules/svix/dist/models/recoverOut.js"(exports) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    exports.RecoverOutSerializer = void 0;
    var backgroundTaskStatus_1 = require_backgroundTaskStatus();
    var backgroundTaskType_1 = require_backgroundTaskType();
    exports.RecoverOutSerializer = {
      _fromJsonObject(object) {
        return {
          id: object["id"],
          status: backgroundTaskStatus_1.BackgroundTaskStatusSerializer._fromJsonObject(object["status"]),
          task: backgroundTaskType_1.BackgroundTaskTypeSerializer._fromJsonObject(object["task"])
        };
      },
      _toJsonObject(self) {
        return {
          id: self.id,
          status: backgroundTaskStatus_1.BackgroundTaskStatusSerializer._toJsonObject(self.status),
          task: backgroundTaskType_1.BackgroundTaskTypeSerializer._toJsonObject(self.task)
        };
      }
    };
  }
});

// node_modules/svix/dist/models/replayIn.js
var require_replayIn = __commonJS({
  "node_modules/svix/dist/models/replayIn.js"(exports) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    exports.ReplayInSerializer = void 0;
    exports.ReplayInSerializer = {
      _fromJsonObject(object) {
        return {
          since: new Date(object["since"]),
          until: object["until"] ? new Date(object["until"]) : null
        };
      },
      _toJsonObject(self) {
        return {
          since: self.since,
          until: self.until
        };
      }
    };
  }
});

// node_modules/svix/dist/models/replayOut.js
var require_replayOut = __commonJS({
  "node_modules/svix/dist/models/replayOut.js"(exports) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    exports.ReplayOutSerializer = void 0;
    var backgroundTaskStatus_1 = require_backgroundTaskStatus();
    var backgroundTaskType_1 = require_backgroundTaskType();
    exports.ReplayOutSerializer = {
      _fromJsonObject(object) {
        return {
          id: object["id"],
          status: backgroundTaskStatus_1.BackgroundTaskStatusSerializer._fromJsonObject(object["status"]),
          task: backgroundTaskType_1.BackgroundTaskTypeSerializer._fromJsonObject(object["task"])
        };
      },
      _toJsonObject(self) {
        return {
          id: self.id,
          status: backgroundTaskStatus_1.BackgroundTaskStatusSerializer._toJsonObject(self.status),
          task: backgroundTaskType_1.BackgroundTaskTypeSerializer._toJsonObject(self.task)
        };
      }
    };
  }
});

// node_modules/svix/dist/api/endpoint.js
var require_endpoint = __commonJS({
  "node_modules/svix/dist/api/endpoint.js"(exports) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    exports.Endpoint = void 0;
    var endpointHeadersIn_1 = require_endpointHeadersIn();
    var endpointHeadersOut_1 = require_endpointHeadersOut();
    var endpointHeadersPatchIn_1 = require_endpointHeadersPatchIn();
    var endpointIn_1 = require_endpointIn();
    var endpointOut_1 = require_endpointOut();
    var endpointPatch_1 = require_endpointPatch();
    var endpointSecretOut_1 = require_endpointSecretOut();
    var endpointSecretRotateIn_1 = require_endpointSecretRotateIn();
    var endpointStats_1 = require_endpointStats();
    var endpointTransformationIn_1 = require_endpointTransformationIn();
    var endpointTransformationOut_1 = require_endpointTransformationOut();
    var endpointTransformationPatch_1 = require_endpointTransformationPatch();
    var endpointUpdate_1 = require_endpointUpdate();
    var eventExampleIn_1 = require_eventExampleIn();
    var listResponseEndpointOut_1 = require_listResponseEndpointOut();
    var messageOut_1 = require_messageOut();
    var recoverIn_1 = require_recoverIn();
    var recoverOut_1 = require_recoverOut();
    var replayIn_1 = require_replayIn();
    var replayOut_1 = require_replayOut();
    var request_1 = require_request();
    var Endpoint = class {
      constructor(requestCtx) {
        this.requestCtx = requestCtx;
      }
      list(appId, options) {
        const request = new request_1.SvixRequest(request_1.HttpMethod.GET, "/api/v1/app/{app_id}/endpoint");
        request.setPathParam("app_id", appId);
        request.setQueryParam("limit", options === null || options === void 0 ? void 0 : options.limit);
        request.setQueryParam("iterator", options === null || options === void 0 ? void 0 : options.iterator);
        request.setQueryParam("order", options === null || options === void 0 ? void 0 : options.order);
        return request.send(this.requestCtx, listResponseEndpointOut_1.ListResponseEndpointOutSerializer._fromJsonObject);
      }
      create(appId, endpointIn, options) {
        const request = new request_1.SvixRequest(request_1.HttpMethod.POST, "/api/v1/app/{app_id}/endpoint");
        request.setPathParam("app_id", appId);
        request.setHeaderParam("idempotency-key", options === null || options === void 0 ? void 0 : options.idempotencyKey);
        request.setBody(endpointIn_1.EndpointInSerializer._toJsonObject(endpointIn));
        return request.send(this.requestCtx, endpointOut_1.EndpointOutSerializer._fromJsonObject);
      }
      get(appId, endpointId) {
        const request = new request_1.SvixRequest(request_1.HttpMethod.GET, "/api/v1/app/{app_id}/endpoint/{endpoint_id}");
        request.setPathParam("app_id", appId);
        request.setPathParam("endpoint_id", endpointId);
        return request.send(this.requestCtx, endpointOut_1.EndpointOutSerializer._fromJsonObject);
      }
      update(appId, endpointId, endpointUpdate) {
        const request = new request_1.SvixRequest(request_1.HttpMethod.PUT, "/api/v1/app/{app_id}/endpoint/{endpoint_id}");
        request.setPathParam("app_id", appId);
        request.setPathParam("endpoint_id", endpointId);
        request.setBody(endpointUpdate_1.EndpointUpdateSerializer._toJsonObject(endpointUpdate));
        return request.send(this.requestCtx, endpointOut_1.EndpointOutSerializer._fromJsonObject);
      }
      delete(appId, endpointId) {
        const request = new request_1.SvixRequest(request_1.HttpMethod.DELETE, "/api/v1/app/{app_id}/endpoint/{endpoint_id}");
        request.setPathParam("app_id", appId);
        request.setPathParam("endpoint_id", endpointId);
        return request.sendNoResponseBody(this.requestCtx);
      }
      patch(appId, endpointId, endpointPatch) {
        const request = new request_1.SvixRequest(request_1.HttpMethod.PATCH, "/api/v1/app/{app_id}/endpoint/{endpoint_id}");
        request.setPathParam("app_id", appId);
        request.setPathParam("endpoint_id", endpointId);
        request.setBody(endpointPatch_1.EndpointPatchSerializer._toJsonObject(endpointPatch));
        return request.send(this.requestCtx, endpointOut_1.EndpointOutSerializer._fromJsonObject);
      }
      getHeaders(appId, endpointId) {
        const request = new request_1.SvixRequest(request_1.HttpMethod.GET, "/api/v1/app/{app_id}/endpoint/{endpoint_id}/headers");
        request.setPathParam("app_id", appId);
        request.setPathParam("endpoint_id", endpointId);
        return request.send(this.requestCtx, endpointHeadersOut_1.EndpointHeadersOutSerializer._fromJsonObject);
      }
      updateHeaders(appId, endpointId, endpointHeadersIn) {
        const request = new request_1.SvixRequest(request_1.HttpMethod.PUT, "/api/v1/app/{app_id}/endpoint/{endpoint_id}/headers");
        request.setPathParam("app_id", appId);
        request.setPathParam("endpoint_id", endpointId);
        request.setBody(endpointHeadersIn_1.EndpointHeadersInSerializer._toJsonObject(endpointHeadersIn));
        return request.sendNoResponseBody(this.requestCtx);
      }
      headersUpdate(appId, endpointId, endpointHeadersIn) {
        return this.updateHeaders(appId, endpointId, endpointHeadersIn);
      }
      patchHeaders(appId, endpointId, endpointHeadersPatchIn) {
        const request = new request_1.SvixRequest(request_1.HttpMethod.PATCH, "/api/v1/app/{app_id}/endpoint/{endpoint_id}/headers");
        request.setPathParam("app_id", appId);
        request.setPathParam("endpoint_id", endpointId);
        request.setBody(endpointHeadersPatchIn_1.EndpointHeadersPatchInSerializer._toJsonObject(endpointHeadersPatchIn));
        return request.sendNoResponseBody(this.requestCtx);
      }
      headersPatch(appId, endpointId, endpointHeadersPatchIn) {
        return this.patchHeaders(appId, endpointId, endpointHeadersPatchIn);
      }
      recover(appId, endpointId, recoverIn, options) {
        const request = new request_1.SvixRequest(request_1.HttpMethod.POST, "/api/v1/app/{app_id}/endpoint/{endpoint_id}/recover");
        request.setPathParam("app_id", appId);
        request.setPathParam("endpoint_id", endpointId);
        request.setHeaderParam("idempotency-key", options === null || options === void 0 ? void 0 : options.idempotencyKey);
        request.setBody(recoverIn_1.RecoverInSerializer._toJsonObject(recoverIn));
        return request.send(this.requestCtx, recoverOut_1.RecoverOutSerializer._fromJsonObject);
      }
      replayMissing(appId, endpointId, replayIn, options) {
        const request = new request_1.SvixRequest(request_1.HttpMethod.POST, "/api/v1/app/{app_id}/endpoint/{endpoint_id}/replay-missing");
        request.setPathParam("app_id", appId);
        request.setPathParam("endpoint_id", endpointId);
        request.setHeaderParam("idempotency-key", options === null || options === void 0 ? void 0 : options.idempotencyKey);
        request.setBody(replayIn_1.ReplayInSerializer._toJsonObject(replayIn));
        return request.send(this.requestCtx, replayOut_1.ReplayOutSerializer._fromJsonObject);
      }
      getSecret(appId, endpointId) {
        const request = new request_1.SvixRequest(request_1.HttpMethod.GET, "/api/v1/app/{app_id}/endpoint/{endpoint_id}/secret");
        request.setPathParam("app_id", appId);
        request.setPathParam("endpoint_id", endpointId);
        return request.send(this.requestCtx, endpointSecretOut_1.EndpointSecretOutSerializer._fromJsonObject);
      }
      rotateSecret(appId, endpointId, endpointSecretRotateIn, options) {
        const request = new request_1.SvixRequest(request_1.HttpMethod.POST, "/api/v1/app/{app_id}/endpoint/{endpoint_id}/secret/rotate");
        request.setPathParam("app_id", appId);
        request.setPathParam("endpoint_id", endpointId);
        request.setHeaderParam("idempotency-key", options === null || options === void 0 ? void 0 : options.idempotencyKey);
        request.setBody(endpointSecretRotateIn_1.EndpointSecretRotateInSerializer._toJsonObject(endpointSecretRotateIn));
        return request.sendNoResponseBody(this.requestCtx);
      }
      sendExample(appId, endpointId, eventExampleIn, options) {
        const request = new request_1.SvixRequest(request_1.HttpMethod.POST, "/api/v1/app/{app_id}/endpoint/{endpoint_id}/send-example");
        request.setPathParam("app_id", appId);
        request.setPathParam("endpoint_id", endpointId);
        request.setHeaderParam("idempotency-key", options === null || options === void 0 ? void 0 : options.idempotencyKey);
        request.setBody(eventExampleIn_1.EventExampleInSerializer._toJsonObject(eventExampleIn));
        return request.send(this.requestCtx, messageOut_1.MessageOutSerializer._fromJsonObject);
      }
      getStats(appId, endpointId, options) {
        const request = new request_1.SvixRequest(request_1.HttpMethod.GET, "/api/v1/app/{app_id}/endpoint/{endpoint_id}/stats");
        request.setPathParam("app_id", appId);
        request.setPathParam("endpoint_id", endpointId);
        request.setQueryParam("since", options === null || options === void 0 ? void 0 : options.since);
        request.setQueryParam("until", options === null || options === void 0 ? void 0 : options.until);
        return request.send(this.requestCtx, endpointStats_1.EndpointStatsSerializer._fromJsonObject);
      }
      transformationGet(appId, endpointId) {
        const request = new request_1.SvixRequest(request_1.HttpMethod.GET, "/api/v1/app/{app_id}/endpoint/{endpoint_id}/transformation");
        request.setPathParam("app_id", appId);
        request.setPathParam("endpoint_id", endpointId);
        return request.send(this.requestCtx, endpointTransformationOut_1.EndpointTransformationOutSerializer._fromJsonObject);
      }
      patchTransformation(appId, endpointId, endpointTransformationPatch) {
        const request = new request_1.SvixRequest(request_1.HttpMethod.PATCH, "/api/v1/app/{app_id}/endpoint/{endpoint_id}/transformation");
        request.setPathParam("app_id", appId);
        request.setPathParam("endpoint_id", endpointId);
        request.setBody(endpointTransformationPatch_1.EndpointTransformationPatchSerializer._toJsonObject(endpointTransformationPatch));
        return request.sendNoResponseBody(this.requestCtx);
      }
      transformationPartialUpdate(appId, endpointId, endpointTransformationIn) {
        const request = new request_1.SvixRequest(request_1.HttpMethod.PATCH, "/api/v1/app/{app_id}/endpoint/{endpoint_id}/transformation");
        request.setPathParam("app_id", appId);
        request.setPathParam("endpoint_id", endpointId);
        request.setBody(endpointTransformationIn_1.EndpointTransformationInSerializer._toJsonObject(endpointTransformationIn));
        return request.sendNoResponseBody(this.requestCtx);
      }
    };
    exports.Endpoint = Endpoint;
  }
});

// node_modules/svix/dist/models/connectorKind.js
var require_connectorKind = __commonJS({
  "node_modules/svix/dist/models/connectorKind.js"(exports) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    exports.ConnectorKindSerializer = exports.ConnectorKind = void 0;
    var ConnectorKind;
    (function(ConnectorKind2) {
      ConnectorKind2["Custom"] = "Custom";
      ConnectorKind2["CloseCrm"] = "CloseCRM";
      ConnectorKind2["CustomerIo"] = "CustomerIO";
      ConnectorKind2["Discord"] = "Discord";
      ConnectorKind2["Hubspot"] = "Hubspot";
      ConnectorKind2["Inngest"] = "Inngest";
      ConnectorKind2["Loops"] = "Loops";
      ConnectorKind2["Resend"] = "Resend";
      ConnectorKind2["Salesforce"] = "Salesforce";
      ConnectorKind2["Segment"] = "Segment";
      ConnectorKind2["Sendgrid"] = "Sendgrid";
      ConnectorKind2["Slack"] = "Slack";
      ConnectorKind2["Teams"] = "Teams";
      ConnectorKind2["TriggerDev"] = "TriggerDev";
      ConnectorKind2["Windmill"] = "Windmill";
      ConnectorKind2["Zapier"] = "Zapier";
    })(ConnectorKind = exports.ConnectorKind || (exports.ConnectorKind = {}));
    exports.ConnectorKindSerializer = {
      _fromJsonObject(object) {
        return object;
      },
      _toJsonObject(self) {
        return self;
      }
    };
  }
});

// node_modules/svix/dist/models/connectorIn.js
var require_connectorIn = __commonJS({
  "node_modules/svix/dist/models/connectorIn.js"(exports) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    exports.ConnectorInSerializer = void 0;
    var connectorKind_1 = require_connectorKind();
    exports.ConnectorInSerializer = {
      _fromJsonObject(object) {
        return {
          description: object["description"],
          featureFlag: object["featureFlag"],
          featureFlags: object["featureFlags"],
          filterTypes: object["filterTypes"],
          instructions: object["instructions"],
          instructionsLink: object["instructionsLink"],
          kind: object["kind"] ? connectorKind_1.ConnectorKindSerializer._fromJsonObject(object["kind"]) : void 0,
          logo: object["logo"],
          name: object["name"],
          transformation: object["transformation"]
        };
      },
      _toJsonObject(self) {
        return {
          description: self.description,
          featureFlag: self.featureFlag,
          featureFlags: self.featureFlags,
          filterTypes: self.filterTypes,
          instructions: self.instructions,
          instructionsLink: self.instructionsLink,
          kind: self.kind ? connectorKind_1.ConnectorKindSerializer._toJsonObject(self.kind) : void 0,
          logo: self.logo,
          name: self.name,
          transformation: self.transformation
        };
      }
    };
  }
});

// node_modules/svix/dist/models/eventTypeIn.js
var require_eventTypeIn = __commonJS({
  "node_modules/svix/dist/models/eventTypeIn.js"(exports) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    exports.EventTypeInSerializer = void 0;
    exports.EventTypeInSerializer = {
      _fromJsonObject(object) {
        return {
          archived: object["archived"],
          deprecated: object["deprecated"],
          description: object["description"],
          featureFlag: object["featureFlag"],
          featureFlags: object["featureFlags"],
          groupName: object["groupName"],
          name: object["name"],
          schemas: object["schemas"]
        };
      },
      _toJsonObject(self) {
        return {
          archived: self.archived,
          deprecated: self.deprecated,
          description: self.description,
          featureFlag: self.featureFlag,
          featureFlags: self.featureFlags,
          groupName: self.groupName,
          name: self.name,
          schemas: self.schemas
        };
      }
    };
  }
});

// node_modules/svix/dist/models/environmentIn.js
var require_environmentIn = __commonJS({
  "node_modules/svix/dist/models/environmentIn.js"(exports) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    exports.EnvironmentInSerializer = void 0;
    var connectorIn_1 = require_connectorIn();
    var eventTypeIn_1 = require_eventTypeIn();
    exports.EnvironmentInSerializer = {
      _fromJsonObject(object) {
        var _a, _b;
        return {
          connectors: (_a = object["connectors"]) === null || _a === void 0 ? void 0 : _a.map((item) => connectorIn_1.ConnectorInSerializer._fromJsonObject(item)),
          eventTypes: (_b = object["eventTypes"]) === null || _b === void 0 ? void 0 : _b.map((item) => eventTypeIn_1.EventTypeInSerializer._fromJsonObject(item)),
          settings: object["settings"]
        };
      },
      _toJsonObject(self) {
        var _a, _b;
        return {
          connectors: (_a = self.connectors) === null || _a === void 0 ? void 0 : _a.map((item) => connectorIn_1.ConnectorInSerializer._toJsonObject(item)),
          eventTypes: (_b = self.eventTypes) === null || _b === void 0 ? void 0 : _b.map((item) => eventTypeIn_1.EventTypeInSerializer._toJsonObject(item)),
          settings: self.settings
        };
      }
    };
  }
});

// node_modules/svix/dist/models/connectorOut.js
var require_connectorOut = __commonJS({
  "node_modules/svix/dist/models/connectorOut.js"(exports) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    exports.ConnectorOutSerializer = void 0;
    var connectorKind_1 = require_connectorKind();
    exports.ConnectorOutSerializer = {
      _fromJsonObject(object) {
        return {
          createdAt: new Date(object["createdAt"]),
          description: object["description"],
          featureFlag: object["featureFlag"],
          featureFlags: object["featureFlags"],
          filterTypes: object["filterTypes"],
          id: object["id"],
          instructions: object["instructions"],
          instructionsLink: object["instructionsLink"],
          kind: connectorKind_1.ConnectorKindSerializer._fromJsonObject(object["kind"]),
          logo: object["logo"],
          name: object["name"],
          orgId: object["orgId"],
          transformation: object["transformation"],
          updatedAt: new Date(object["updatedAt"])
        };
      },
      _toJsonObject(self) {
        return {
          createdAt: self.createdAt,
          description: self.description,
          featureFlag: self.featureFlag,
          featureFlags: self.featureFlags,
          filterTypes: self.filterTypes,
          id: self.id,
          instructions: self.instructions,
          instructionsLink: self.instructionsLink,
          kind: connectorKind_1.ConnectorKindSerializer._toJsonObject(self.kind),
          logo: self.logo,
          name: self.name,
          orgId: self.orgId,
          transformation: self.transformation,
          updatedAt: self.updatedAt
        };
      }
    };
  }
});

// node_modules/svix/dist/models/eventTypeOut.js
var require_eventTypeOut = __commonJS({
  "node_modules/svix/dist/models/eventTypeOut.js"(exports) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    exports.EventTypeOutSerializer = void 0;
    exports.EventTypeOutSerializer = {
      _fromJsonObject(object) {
        return {
          archived: object["archived"],
          createdAt: new Date(object["createdAt"]),
          deprecated: object["deprecated"],
          description: object["description"],
          featureFlag: object["featureFlag"],
          featureFlags: object["featureFlags"],
          groupName: object["groupName"],
          name: object["name"],
          schemas: object["schemas"],
          updatedAt: new Date(object["updatedAt"])
        };
      },
      _toJsonObject(self) {
        return {
          archived: self.archived,
          createdAt: self.createdAt,
          deprecated: self.deprecated,
          description: self.description,
          featureFlag: self.featureFlag,
          featureFlags: self.featureFlags,
          groupName: self.groupName,
          name: self.name,
          schemas: self.schemas,
          updatedAt: self.updatedAt
        };
      }
    };
  }
});

// node_modules/svix/dist/models/environmentOut.js
var require_environmentOut = __commonJS({
  "node_modules/svix/dist/models/environmentOut.js"(exports) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    exports.EnvironmentOutSerializer = void 0;
    var connectorOut_1 = require_connectorOut();
    var eventTypeOut_1 = require_eventTypeOut();
    exports.EnvironmentOutSerializer = {
      _fromJsonObject(object) {
        return {
          createdAt: new Date(object["createdAt"]),
          eventTypes: object["eventTypes"].map((item) => eventTypeOut_1.EventTypeOutSerializer._fromJsonObject(item)),
          settings: object["settings"],
          transformationTemplates: object["transformationTemplates"].map((item) => connectorOut_1.ConnectorOutSerializer._fromJsonObject(item)),
          version: object["version"]
        };
      },
      _toJsonObject(self) {
        return {
          createdAt: self.createdAt,
          eventTypes: self.eventTypes.map((item) => eventTypeOut_1.EventTypeOutSerializer._toJsonObject(item)),
          settings: self.settings,
          transformationTemplates: self.transformationTemplates.map((item) => connectorOut_1.ConnectorOutSerializer._toJsonObject(item)),
          version: self.version
        };
      }
    };
  }
});

// node_modules/svix/dist/api/environment.js
var require_environment = __commonJS({
  "node_modules/svix/dist/api/environment.js"(exports) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    exports.Environment = void 0;
    var environmentIn_1 = require_environmentIn();
    var environmentOut_1 = require_environmentOut();
    var request_1 = require_request();
    var Environment = class {
      constructor(requestCtx) {
        this.requestCtx = requestCtx;
      }
      export(options) {
        const request = new request_1.SvixRequest(request_1.HttpMethod.POST, "/api/v1/environment/export");
        request.setHeaderParam("idempotency-key", options === null || options === void 0 ? void 0 : options.idempotencyKey);
        return request.send(this.requestCtx, environmentOut_1.EnvironmentOutSerializer._fromJsonObject);
      }
      import(environmentIn, options) {
        const request = new request_1.SvixRequest(request_1.HttpMethod.POST, "/api/v1/environment/import");
        request.setHeaderParam("idempotency-key", options === null || options === void 0 ? void 0 : options.idempotencyKey);
        request.setBody(environmentIn_1.EnvironmentInSerializer._toJsonObject(environmentIn));
        return request.sendNoResponseBody(this.requestCtx);
      }
    };
    exports.Environment = Environment;
  }
});

// node_modules/svix/dist/models/eventTypeImportOpenApiIn.js
var require_eventTypeImportOpenApiIn = __commonJS({
  "node_modules/svix/dist/models/eventTypeImportOpenApiIn.js"(exports) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    exports.EventTypeImportOpenApiInSerializer = void 0;
    exports.EventTypeImportOpenApiInSerializer = {
      _fromJsonObject(object) {
        return {
          dryRun: object["dryRun"],
          replaceAll: object["replaceAll"],
          spec: object["spec"],
          specRaw: object["specRaw"]
        };
      },
      _toJsonObject(self) {
        return {
          dryRun: self.dryRun,
          replaceAll: self.replaceAll,
          spec: self.spec,
          specRaw: self.specRaw
        };
      }
    };
  }
});

// node_modules/svix/dist/models/eventTypeFromOpenApi.js
var require_eventTypeFromOpenApi = __commonJS({
  "node_modules/svix/dist/models/eventTypeFromOpenApi.js"(exports) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    exports.EventTypeFromOpenApiSerializer = void 0;
    exports.EventTypeFromOpenApiSerializer = {
      _fromJsonObject(object) {
        return {
          deprecated: object["deprecated"],
          description: object["description"],
          featureFlag: object["featureFlag"],
          featureFlags: object["featureFlags"],
          groupName: object["groupName"],
          name: object["name"],
          schemas: object["schemas"]
        };
      },
      _toJsonObject(self) {
        return {
          deprecated: self.deprecated,
          description: self.description,
          featureFlag: self.featureFlag,
          featureFlags: self.featureFlags,
          groupName: self.groupName,
          name: self.name,
          schemas: self.schemas
        };
      }
    };
  }
});

// node_modules/svix/dist/models/eventTypeImportOpenApiOutData.js
var require_eventTypeImportOpenApiOutData = __commonJS({
  "node_modules/svix/dist/models/eventTypeImportOpenApiOutData.js"(exports) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    exports.EventTypeImportOpenApiOutDataSerializer = void 0;
    var eventTypeFromOpenApi_1 = require_eventTypeFromOpenApi();
    exports.EventTypeImportOpenApiOutDataSerializer = {
      _fromJsonObject(object) {
        var _a;
        return {
          modified: object["modified"],
          toModify: (_a = object["to_modify"]) === null || _a === void 0 ? void 0 : _a.map((item) => eventTypeFromOpenApi_1.EventTypeFromOpenApiSerializer._fromJsonObject(item))
        };
      },
      _toJsonObject(self) {
        var _a;
        return {
          modified: self.modified,
          to_modify: (_a = self.toModify) === null || _a === void 0 ? void 0 : _a.map((item) => eventTypeFromOpenApi_1.EventTypeFromOpenApiSerializer._toJsonObject(item))
        };
      }
    };
  }
});

// node_modules/svix/dist/models/eventTypeImportOpenApiOut.js
var require_eventTypeImportOpenApiOut = __commonJS({
  "node_modules/svix/dist/models/eventTypeImportOpenApiOut.js"(exports) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    exports.EventTypeImportOpenApiOutSerializer = void 0;
    var eventTypeImportOpenApiOutData_1 = require_eventTypeImportOpenApiOutData();
    exports.EventTypeImportOpenApiOutSerializer = {
      _fromJsonObject(object) {
        return {
          data: eventTypeImportOpenApiOutData_1.EventTypeImportOpenApiOutDataSerializer._fromJsonObject(object["data"])
        };
      },
      _toJsonObject(self) {
        return {
          data: eventTypeImportOpenApiOutData_1.EventTypeImportOpenApiOutDataSerializer._toJsonObject(self.data)
        };
      }
    };
  }
});

// node_modules/svix/dist/models/eventTypePatch.js
var require_eventTypePatch = __commonJS({
  "node_modules/svix/dist/models/eventTypePatch.js"(exports) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    exports.EventTypePatchSerializer = void 0;
    exports.EventTypePatchSerializer = {
      _fromJsonObject(object) {
        return {
          archived: object["archived"],
          deprecated: object["deprecated"],
          description: object["description"],
          featureFlag: object["featureFlag"],
          featureFlags: object["featureFlags"],
          groupName: object["groupName"],
          schemas: object["schemas"]
        };
      },
      _toJsonObject(self) {
        return {
          archived: self.archived,
          deprecated: self.deprecated,
          description: self.description,
          featureFlag: self.featureFlag,
          featureFlags: self.featureFlags,
          groupName: self.groupName,
          schemas: self.schemas
        };
      }
    };
  }
});

// node_modules/svix/dist/models/eventTypeUpdate.js
var require_eventTypeUpdate = __commonJS({
  "node_modules/svix/dist/models/eventTypeUpdate.js"(exports) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    exports.EventTypeUpdateSerializer = void 0;
    exports.EventTypeUpdateSerializer = {
      _fromJsonObject(object) {
        return {
          archived: object["archived"],
          deprecated: object["deprecated"],
          description: object["description"],
          featureFlag: object["featureFlag"],
          featureFlags: object["featureFlags"],
          groupName: object["groupName"],
          schemas: object["schemas"]
        };
      },
      _toJsonObject(self) {
        return {
          archived: self.archived,
          deprecated: self.deprecated,
          description: self.description,
          featureFlag: self.featureFlag,
          featureFlags: self.featureFlags,
          groupName: self.groupName,
          schemas: self.schemas
        };
      }
    };
  }
});

// node_modules/svix/dist/models/listResponseEventTypeOut.js
var require_listResponseEventTypeOut = __commonJS({
  "node_modules/svix/dist/models/listResponseEventTypeOut.js"(exports) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    exports.ListResponseEventTypeOutSerializer = void 0;
    var eventTypeOut_1 = require_eventTypeOut();
    exports.ListResponseEventTypeOutSerializer = {
      _fromJsonObject(object) {
        return {
          data: object["data"].map((item) => eventTypeOut_1.EventTypeOutSerializer._fromJsonObject(item)),
          done: object["done"],
          iterator: object["iterator"],
          prevIterator: object["prevIterator"]
        };
      },
      _toJsonObject(self) {
        return {
          data: self.data.map((item) => eventTypeOut_1.EventTypeOutSerializer._toJsonObject(item)),
          done: self.done,
          iterator: self.iterator,
          prevIterator: self.prevIterator
        };
      }
    };
  }
});

// node_modules/svix/dist/api/eventType.js
var require_eventType = __commonJS({
  "node_modules/svix/dist/api/eventType.js"(exports) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    exports.EventType = void 0;
    var eventTypeImportOpenApiIn_1 = require_eventTypeImportOpenApiIn();
    var eventTypeImportOpenApiOut_1 = require_eventTypeImportOpenApiOut();
    var eventTypeIn_1 = require_eventTypeIn();
    var eventTypeOut_1 = require_eventTypeOut();
    var eventTypePatch_1 = require_eventTypePatch();
    var eventTypeUpdate_1 = require_eventTypeUpdate();
    var listResponseEventTypeOut_1 = require_listResponseEventTypeOut();
    var request_1 = require_request();
    var EventType = class {
      constructor(requestCtx) {
        this.requestCtx = requestCtx;
      }
      list(options) {
        const request = new request_1.SvixRequest(request_1.HttpMethod.GET, "/api/v1/event-type");
        request.setQueryParam("limit", options === null || options === void 0 ? void 0 : options.limit);
        request.setQueryParam("iterator", options === null || options === void 0 ? void 0 : options.iterator);
        request.setQueryParam("order", options === null || options === void 0 ? void 0 : options.order);
        request.setQueryParam("include_archived", options === null || options === void 0 ? void 0 : options.includeArchived);
        request.setQueryParam("with_content", options === null || options === void 0 ? void 0 : options.withContent);
        return request.send(this.requestCtx, listResponseEventTypeOut_1.ListResponseEventTypeOutSerializer._fromJsonObject);
      }
      create(eventTypeIn, options) {
        const request = new request_1.SvixRequest(request_1.HttpMethod.POST, "/api/v1/event-type");
        request.setHeaderParam("idempotency-key", options === null || options === void 0 ? void 0 : options.idempotencyKey);
        request.setBody(eventTypeIn_1.EventTypeInSerializer._toJsonObject(eventTypeIn));
        return request.send(this.requestCtx, eventTypeOut_1.EventTypeOutSerializer._fromJsonObject);
      }
      importOpenapi(eventTypeImportOpenApiIn, options) {
        const request = new request_1.SvixRequest(request_1.HttpMethod.POST, "/api/v1/event-type/import/openapi");
        request.setHeaderParam("idempotency-key", options === null || options === void 0 ? void 0 : options.idempotencyKey);
        request.setBody(eventTypeImportOpenApiIn_1.EventTypeImportOpenApiInSerializer._toJsonObject(eventTypeImportOpenApiIn));
        return request.send(this.requestCtx, eventTypeImportOpenApiOut_1.EventTypeImportOpenApiOutSerializer._fromJsonObject);
      }
      get(eventTypeName) {
        const request = new request_1.SvixRequest(request_1.HttpMethod.GET, "/api/v1/event-type/{event_type_name}");
        request.setPathParam("event_type_name", eventTypeName);
        return request.send(this.requestCtx, eventTypeOut_1.EventTypeOutSerializer._fromJsonObject);
      }
      update(eventTypeName, eventTypeUpdate) {
        const request = new request_1.SvixRequest(request_1.HttpMethod.PUT, "/api/v1/event-type/{event_type_name}");
        request.setPathParam("event_type_name", eventTypeName);
        request.setBody(eventTypeUpdate_1.EventTypeUpdateSerializer._toJsonObject(eventTypeUpdate));
        return request.send(this.requestCtx, eventTypeOut_1.EventTypeOutSerializer._fromJsonObject);
      }
      delete(eventTypeName, options) {
        const request = new request_1.SvixRequest(request_1.HttpMethod.DELETE, "/api/v1/event-type/{event_type_name}");
        request.setPathParam("event_type_name", eventTypeName);
        request.setQueryParam("expunge", options === null || options === void 0 ? void 0 : options.expunge);
        return request.sendNoResponseBody(this.requestCtx);
      }
      patch(eventTypeName, eventTypePatch) {
        const request = new request_1.SvixRequest(request_1.HttpMethod.PATCH, "/api/v1/event-type/{event_type_name}");
        request.setPathParam("event_type_name", eventTypeName);
        request.setBody(eventTypePatch_1.EventTypePatchSerializer._toJsonObject(eventTypePatch));
        return request.send(this.requestCtx, eventTypeOut_1.EventTypeOutSerializer._fromJsonObject);
      }
    };
    exports.EventType = EventType;
  }
});

// node_modules/svix/dist/api/health.js
var require_health = __commonJS({
  "node_modules/svix/dist/api/health.js"(exports) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    exports.Health = void 0;
    var request_1 = require_request();
    var Health = class {
      constructor(requestCtx) {
        this.requestCtx = requestCtx;
      }
      get() {
        const request = new request_1.SvixRequest(request_1.HttpMethod.GET, "/api/v1/health");
        return request.sendNoResponseBody(this.requestCtx);
      }
    };
    exports.Health = Health;
  }
});

// node_modules/svix/dist/models/ingestSourceConsumerPortalAccessIn.js
var require_ingestSourceConsumerPortalAccessIn = __commonJS({
  "node_modules/svix/dist/models/ingestSourceConsumerPortalAccessIn.js"(exports) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    exports.IngestSourceConsumerPortalAccessInSerializer = void 0;
    exports.IngestSourceConsumerPortalAccessInSerializer = {
      _fromJsonObject(object) {
        return {
          expiry: object["expiry"],
          readOnly: object["readOnly"]
        };
      },
      _toJsonObject(self) {
        return {
          expiry: self.expiry,
          readOnly: self.readOnly
        };
      }
    };
  }
});

// node_modules/svix/dist/models/ingestEndpointHeadersIn.js
var require_ingestEndpointHeadersIn = __commonJS({
  "node_modules/svix/dist/models/ingestEndpointHeadersIn.js"(exports) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    exports.IngestEndpointHeadersInSerializer = void 0;
    exports.IngestEndpointHeadersInSerializer = {
      _fromJsonObject(object) {
        return {
          headers: object["headers"]
        };
      },
      _toJsonObject(self) {
        return {
          headers: self.headers
        };
      }
    };
  }
});

// node_modules/svix/dist/models/ingestEndpointHeadersOut.js
var require_ingestEndpointHeadersOut = __commonJS({
  "node_modules/svix/dist/models/ingestEndpointHeadersOut.js"(exports) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    exports.IngestEndpointHeadersOutSerializer = void 0;
    exports.IngestEndpointHeadersOutSerializer = {
      _fromJsonObject(object) {
        return {
          headers: object["headers"],
          sensitive: object["sensitive"]
        };
      },
      _toJsonObject(self) {
        return {
          headers: self.headers,
          sensitive: self.sensitive
        };
      }
    };
  }
});

// node_modules/svix/dist/models/ingestEndpointIn.js
var require_ingestEndpointIn = __commonJS({
  "node_modules/svix/dist/models/ingestEndpointIn.js"(exports) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    exports.IngestEndpointInSerializer = void 0;
    exports.IngestEndpointInSerializer = {
      _fromJsonObject(object) {
        return {
          description: object["description"],
          disabled: object["disabled"],
          metadata: object["metadata"],
          rateLimit: object["rateLimit"],
          secret: object["secret"],
          uid: object["uid"],
          url: object["url"]
        };
      },
      _toJsonObject(self) {
        return {
          description: self.description,
          disabled: self.disabled,
          metadata: self.metadata,
          rateLimit: self.rateLimit,
          secret: self.secret,
          uid: self.uid,
          url: self.url
        };
      }
    };
  }
});

// node_modules/svix/dist/models/ingestEndpointOut.js
var require_ingestEndpointOut = __commonJS({
  "node_modules/svix/dist/models/ingestEndpointOut.js"(exports) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    exports.IngestEndpointOutSerializer = void 0;
    exports.IngestEndpointOutSerializer = {
      _fromJsonObject(object) {
        return {
          createdAt: new Date(object["createdAt"]),
          description: object["description"],
          disabled: object["disabled"],
          id: object["id"],
          metadata: object["metadata"],
          rateLimit: object["rateLimit"],
          uid: object["uid"],
          updatedAt: new Date(object["updatedAt"]),
          url: object["url"]
        };
      },
      _toJsonObject(self) {
        return {
          createdAt: self.createdAt,
          description: self.description,
          disabled: self.disabled,
          id: self.id,
          metadata: self.metadata,
          rateLimit: self.rateLimit,
          uid: self.uid,
          updatedAt: self.updatedAt,
          url: self.url
        };
      }
    };
  }
});

// node_modules/svix/dist/models/ingestEndpointSecretIn.js
var require_ingestEndpointSecretIn = __commonJS({
  "node_modules/svix/dist/models/ingestEndpointSecretIn.js"(exports) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    exports.IngestEndpointSecretInSerializer = void 0;
    exports.IngestEndpointSecretInSerializer = {
      _fromJsonObject(object) {
        return {
          key: object["key"]
        };
      },
      _toJsonObject(self) {
        return {
          key: self.key
        };
      }
    };
  }
});

// node_modules/svix/dist/models/ingestEndpointSecretOut.js
var require_ingestEndpointSecretOut = __commonJS({
  "node_modules/svix/dist/models/ingestEndpointSecretOut.js"(exports) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    exports.IngestEndpointSecretOutSerializer = void 0;
    exports.IngestEndpointSecretOutSerializer = {
      _fromJsonObject(object) {
        return {
          key: object["key"]
        };
      },
      _toJsonObject(self) {
        return {
          key: self.key
        };
      }
    };
  }
});

// node_modules/svix/dist/models/ingestEndpointTransformationOut.js
var require_ingestEndpointTransformationOut = __commonJS({
  "node_modules/svix/dist/models/ingestEndpointTransformationOut.js"(exports) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    exports.IngestEndpointTransformationOutSerializer = void 0;
    exports.IngestEndpointTransformationOutSerializer = {
      _fromJsonObject(object) {
        return {
          code: object["code"],
          enabled: object["enabled"]
        };
      },
      _toJsonObject(self) {
        return {
          code: self.code,
          enabled: self.enabled
        };
      }
    };
  }
});

// node_modules/svix/dist/models/ingestEndpointTransformationPatch.js
var require_ingestEndpointTransformationPatch = __commonJS({
  "node_modules/svix/dist/models/ingestEndpointTransformationPatch.js"(exports) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    exports.IngestEndpointTransformationPatchSerializer = void 0;
    exports.IngestEndpointTransformationPatchSerializer = {
      _fromJsonObject(object) {
        return {
          code: object["code"],
          enabled: object["enabled"]
        };
      },
      _toJsonObject(self) {
        return {
          code: self.code,
          enabled: self.enabled
        };
      }
    };
  }
});

// node_modules/svix/dist/models/ingestEndpointUpdate.js
var require_ingestEndpointUpdate = __commonJS({
  "node_modules/svix/dist/models/ingestEndpointUpdate.js"(exports) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    exports.IngestEndpointUpdateSerializer = void 0;
    exports.IngestEndpointUpdateSerializer = {
      _fromJsonObject(object) {
        return {
          description: object["description"],
          disabled: object["disabled"],
          metadata: object["metadata"],
          rateLimit: object["rateLimit"],
          uid: object["uid"],
          url: object["url"]
        };
      },
      _toJsonObject(self) {
        return {
          description: self.description,
          disabled: self.disabled,
          metadata: self.metadata,
          rateLimit: self.rateLimit,
          uid: self.uid,
          url: self.url
        };
      }
    };
  }
});

// node_modules/svix/dist/models/listResponseIngestEndpointOut.js
var require_listResponseIngestEndpointOut = __commonJS({
  "node_modules/svix/dist/models/listResponseIngestEndpointOut.js"(exports) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    exports.ListResponseIngestEndpointOutSerializer = void 0;
    var ingestEndpointOut_1 = require_ingestEndpointOut();
    exports.ListResponseIngestEndpointOutSerializer = {
      _fromJsonObject(object) {
        return {
          data: object["data"].map((item) => ingestEndpointOut_1.IngestEndpointOutSerializer._fromJsonObject(item)),
          done: object["done"],
          iterator: object["iterator"],
          prevIterator: object["prevIterator"]
        };
      },
      _toJsonObject(self) {
        return {
          data: self.data.map((item) => ingestEndpointOut_1.IngestEndpointOutSerializer._toJsonObject(item)),
          done: self.done,
          iterator: self.iterator,
          prevIterator: self.prevIterator
        };
      }
    };
  }
});

// node_modules/svix/dist/api/ingestEndpoint.js
var require_ingestEndpoint = __commonJS({
  "node_modules/svix/dist/api/ingestEndpoint.js"(exports) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    exports.IngestEndpoint = void 0;
    var ingestEndpointHeadersIn_1 = require_ingestEndpointHeadersIn();
    var ingestEndpointHeadersOut_1 = require_ingestEndpointHeadersOut();
    var ingestEndpointIn_1 = require_ingestEndpointIn();
    var ingestEndpointOut_1 = require_ingestEndpointOut();
    var ingestEndpointSecretIn_1 = require_ingestEndpointSecretIn();
    var ingestEndpointSecretOut_1 = require_ingestEndpointSecretOut();
    var ingestEndpointTransformationOut_1 = require_ingestEndpointTransformationOut();
    var ingestEndpointTransformationPatch_1 = require_ingestEndpointTransformationPatch();
    var ingestEndpointUpdate_1 = require_ingestEndpointUpdate();
    var listResponseIngestEndpointOut_1 = require_listResponseIngestEndpointOut();
    var request_1 = require_request();
    var IngestEndpoint = class {
      constructor(requestCtx) {
        this.requestCtx = requestCtx;
      }
      list(sourceId, options) {
        const request = new request_1.SvixRequest(request_1.HttpMethod.GET, "/ingest/api/v1/source/{source_id}/endpoint");
        request.setPathParam("source_id", sourceId);
        request.setQueryParam("limit", options === null || options === void 0 ? void 0 : options.limit);
        request.setQueryParam("iterator", options === null || options === void 0 ? void 0 : options.iterator);
        request.setQueryParam("order", options === null || options === void 0 ? void 0 : options.order);
        return request.send(this.requestCtx, listResponseIngestEndpointOut_1.ListResponseIngestEndpointOutSerializer._fromJsonObject);
      }
      create(sourceId, ingestEndpointIn, options) {
        const request = new request_1.SvixRequest(request_1.HttpMethod.POST, "/ingest/api/v1/source/{source_id}/endpoint");
        request.setPathParam("source_id", sourceId);
        request.setHeaderParam("idempotency-key", options === null || options === void 0 ? void 0 : options.idempotencyKey);
        request.setBody(ingestEndpointIn_1.IngestEndpointInSerializer._toJsonObject(ingestEndpointIn));
        return request.send(this.requestCtx, ingestEndpointOut_1.IngestEndpointOutSerializer._fromJsonObject);
      }
      get(sourceId, endpointId) {
        const request = new request_1.SvixRequest(request_1.HttpMethod.GET, "/ingest/api/v1/source/{source_id}/endpoint/{endpoint_id}");
        request.setPathParam("source_id", sourceId);
        request.setPathParam("endpoint_id", endpointId);
        return request.send(this.requestCtx, ingestEndpointOut_1.IngestEndpointOutSerializer._fromJsonObject);
      }
      update(sourceId, endpointId, ingestEndpointUpdate) {
        const request = new request_1.SvixRequest(request_1.HttpMethod.PUT, "/ingest/api/v1/source/{source_id}/endpoint/{endpoint_id}");
        request.setPathParam("source_id", sourceId);
        request.setPathParam("endpoint_id", endpointId);
        request.setBody(ingestEndpointUpdate_1.IngestEndpointUpdateSerializer._toJsonObject(ingestEndpointUpdate));
        return request.send(this.requestCtx, ingestEndpointOut_1.IngestEndpointOutSerializer._fromJsonObject);
      }
      delete(sourceId, endpointId) {
        const request = new request_1.SvixRequest(request_1.HttpMethod.DELETE, "/ingest/api/v1/source/{source_id}/endpoint/{endpoint_id}");
        request.setPathParam("source_id", sourceId);
        request.setPathParam("endpoint_id", endpointId);
        return request.sendNoResponseBody(this.requestCtx);
      }
      getHeaders(sourceId, endpointId) {
        const request = new request_1.SvixRequest(request_1.HttpMethod.GET, "/ingest/api/v1/source/{source_id}/endpoint/{endpoint_id}/headers");
        request.setPathParam("source_id", sourceId);
        request.setPathParam("endpoint_id", endpointId);
        return request.send(this.requestCtx, ingestEndpointHeadersOut_1.IngestEndpointHeadersOutSerializer._fromJsonObject);
      }
      updateHeaders(sourceId, endpointId, ingestEndpointHeadersIn) {
        const request = new request_1.SvixRequest(request_1.HttpMethod.PUT, "/ingest/api/v1/source/{source_id}/endpoint/{endpoint_id}/headers");
        request.setPathParam("source_id", sourceId);
        request.setPathParam("endpoint_id", endpointId);
        request.setBody(ingestEndpointHeadersIn_1.IngestEndpointHeadersInSerializer._toJsonObject(ingestEndpointHeadersIn));
        return request.sendNoResponseBody(this.requestCtx);
      }
      getSecret(sourceId, endpointId) {
        const request = new request_1.SvixRequest(request_1.HttpMethod.GET, "/ingest/api/v1/source/{source_id}/endpoint/{endpoint_id}/secret");
        request.setPathParam("source_id", sourceId);
        request.setPathParam("endpoint_id", endpointId);
        return request.send(this.requestCtx, ingestEndpointSecretOut_1.IngestEndpointSecretOutSerializer._fromJsonObject);
      }
      rotateSecret(sourceId, endpointId, ingestEndpointSecretIn, options) {
        const request = new request_1.SvixRequest(request_1.HttpMethod.POST, "/ingest/api/v1/source/{source_id}/endpoint/{endpoint_id}/secret/rotate");
        request.setPathParam("source_id", sourceId);
        request.setPathParam("endpoint_id", endpointId);
        request.setHeaderParam("idempotency-key", options === null || options === void 0 ? void 0 : options.idempotencyKey);
        request.setBody(ingestEndpointSecretIn_1.IngestEndpointSecretInSerializer._toJsonObject(ingestEndpointSecretIn));
        return request.sendNoResponseBody(this.requestCtx);
      }
      getTransformation(sourceId, endpointId) {
        const request = new request_1.SvixRequest(request_1.HttpMethod.GET, "/ingest/api/v1/source/{source_id}/endpoint/{endpoint_id}/transformation");
        request.setPathParam("source_id", sourceId);
        request.setPathParam("endpoint_id", endpointId);
        return request.send(this.requestCtx, ingestEndpointTransformationOut_1.IngestEndpointTransformationOutSerializer._fromJsonObject);
      }
      setTransformation(sourceId, endpointId, ingestEndpointTransformationPatch) {
        const request = new request_1.SvixRequest(request_1.HttpMethod.PATCH, "/ingest/api/v1/source/{source_id}/endpoint/{endpoint_id}/transformation");
        request.setPathParam("source_id", sourceId);
        request.setPathParam("endpoint_id", endpointId);
        request.setBody(ingestEndpointTransformationPatch_1.IngestEndpointTransformationPatchSerializer._toJsonObject(ingestEndpointTransformationPatch));
        return request.sendNoResponseBody(this.requestCtx);
      }
    };
    exports.IngestEndpoint = IngestEndpoint;
  }
});

// node_modules/svix/dist/models/adobeSignConfig.js
var require_adobeSignConfig = __commonJS({
  "node_modules/svix/dist/models/adobeSignConfig.js"(exports) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    exports.AdobeSignConfigSerializer = void 0;
    exports.AdobeSignConfigSerializer = {
      _fromJsonObject(object) {
        return {
          clientId: object["clientId"]
        };
      },
      _toJsonObject(self) {
        return {
          clientId: self.clientId
        };
      }
    };
  }
});

// node_modules/svix/dist/models/airwallexConfig.js
var require_airwallexConfig = __commonJS({
  "node_modules/svix/dist/models/airwallexConfig.js"(exports) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    exports.AirwallexConfigSerializer = void 0;
    exports.AirwallexConfigSerializer = {
      _fromJsonObject(object) {
        return {
          secret: object["secret"]
        };
      },
      _toJsonObject(self) {
        return {
          secret: self.secret
        };
      }
    };
  }
});

// node_modules/svix/dist/models/checkbookConfig.js
var require_checkbookConfig = __commonJS({
  "node_modules/svix/dist/models/checkbookConfig.js"(exports) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    exports.CheckbookConfigSerializer = void 0;
    exports.CheckbookConfigSerializer = {
      _fromJsonObject(object) {
        return {
          secret: object["secret"]
        };
      },
      _toJsonObject(self) {
        return {
          secret: self.secret
        };
      }
    };
  }
});

// node_modules/svix/dist/models/cronConfig.js
var require_cronConfig = __commonJS({
  "node_modules/svix/dist/models/cronConfig.js"(exports) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    exports.CronConfigSerializer = void 0;
    exports.CronConfigSerializer = {
      _fromJsonObject(object) {
        return {
          contentType: object["contentType"],
          payload: object["payload"],
          schedule: object["schedule"]
        };
      },
      _toJsonObject(self) {
        return {
          contentType: self.contentType,
          payload: self.payload,
          schedule: self.schedule
        };
      }
    };
  }
});

// node_modules/svix/dist/models/docusignConfig.js
var require_docusignConfig = __commonJS({
  "node_modules/svix/dist/models/docusignConfig.js"(exports) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    exports.DocusignConfigSerializer = void 0;
    exports.DocusignConfigSerializer = {
      _fromJsonObject(object) {
        return {
          secret: object["secret"]
        };
      },
      _toJsonObject(self) {
        return {
          secret: self.secret
        };
      }
    };
  }
});

// node_modules/svix/dist/models/easypostConfig.js
var require_easypostConfig = __commonJS({
  "node_modules/svix/dist/models/easypostConfig.js"(exports) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    exports.EasypostConfigSerializer = void 0;
    exports.EasypostConfigSerializer = {
      _fromJsonObject(object) {
        return {
          secret: object["secret"]
        };
      },
      _toJsonObject(self) {
        return {
          secret: self.secret
        };
      }
    };
  }
});

// node_modules/svix/dist/models/githubConfig.js
var require_githubConfig = __commonJS({
  "node_modules/svix/dist/models/githubConfig.js"(exports) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    exports.GithubConfigSerializer = void 0;
    exports.GithubConfigSerializer = {
      _fromJsonObject(object) {
        return {
          secret: object["secret"]
        };
      },
      _toJsonObject(self) {
        return {
          secret: self.secret
        };
      }
    };
  }
});

// node_modules/svix/dist/models/hubspotConfig.js
var require_hubspotConfig = __commonJS({
  "node_modules/svix/dist/models/hubspotConfig.js"(exports) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    exports.HubspotConfigSerializer = void 0;
    exports.HubspotConfigSerializer = {
      _fromJsonObject(object) {
        return {
          secret: object["secret"]
        };
      },
      _toJsonObject(self) {
        return {
          secret: self.secret
        };
      }
    };
  }
});

// node_modules/svix/dist/models/orumIoConfig.js
var require_orumIoConfig = __commonJS({
  "node_modules/svix/dist/models/orumIoConfig.js"(exports) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    exports.OrumIoConfigSerializer = void 0;
    exports.OrumIoConfigSerializer = {
      _fromJsonObject(object) {
        return {
          publicKey: object["publicKey"]
        };
      },
      _toJsonObject(self) {
        return {
          publicKey: self.publicKey
        };
      }
    };
  }
});

// node_modules/svix/dist/models/pandaDocConfig.js
var require_pandaDocConfig = __commonJS({
  "node_modules/svix/dist/models/pandaDocConfig.js"(exports) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    exports.PandaDocConfigSerializer = void 0;
    exports.PandaDocConfigSerializer = {
      _fromJsonObject(object) {
        return {
          secret: object["secret"]
        };
      },
      _toJsonObject(self) {
        return {
          secret: self.secret
        };
      }
    };
  }
});

// node_modules/svix/dist/models/portIoConfig.js
var require_portIoConfig = __commonJS({
  "node_modules/svix/dist/models/portIoConfig.js"(exports) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    exports.PortIoConfigSerializer = void 0;
    exports.PortIoConfigSerializer = {
      _fromJsonObject(object) {
        return {
          secret: object["secret"]
        };
      },
      _toJsonObject(self) {
        return {
          secret: self.secret
        };
      }
    };
  }
});

// node_modules/svix/dist/models/rutterConfig.js
var require_rutterConfig = __commonJS({
  "node_modules/svix/dist/models/rutterConfig.js"(exports) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    exports.RutterConfigSerializer = void 0;
    exports.RutterConfigSerializer = {
      _fromJsonObject(object) {
        return {
          secret: object["secret"]
        };
      },
      _toJsonObject(self) {
        return {
          secret: self.secret
        };
      }
    };
  }
});

// node_modules/svix/dist/models/segmentConfig.js
var require_segmentConfig = __commonJS({
  "node_modules/svix/dist/models/segmentConfig.js"(exports) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    exports.SegmentConfigSerializer = void 0;
    exports.SegmentConfigSerializer = {
      _fromJsonObject(object) {
        return {
          secret: object["secret"]
        };
      },
      _toJsonObject(self) {
        return {
          secret: self.secret
        };
      }
    };
  }
});

// node_modules/svix/dist/models/shopifyConfig.js
var require_shopifyConfig = __commonJS({
  "node_modules/svix/dist/models/shopifyConfig.js"(exports) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    exports.ShopifyConfigSerializer = void 0;
    exports.ShopifyConfigSerializer = {
      _fromJsonObject(object) {
        return {
          secret: object["secret"]
        };
      },
      _toJsonObject(self) {
        return {
          secret: self.secret
        };
      }
    };
  }
});

// node_modules/svix/dist/models/slackConfig.js
var require_slackConfig = __commonJS({
  "node_modules/svix/dist/models/slackConfig.js"(exports) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    exports.SlackConfigSerializer = void 0;
    exports.SlackConfigSerializer = {
      _fromJsonObject(object) {
        return {
          secret: object["secret"]
        };
      },
      _toJsonObject(self) {
        return {
          secret: self.secret
        };
      }
    };
  }
});

// node_modules/svix/dist/models/stripeConfig.js
var require_stripeConfig = __commonJS({
  "node_modules/svix/dist/models/stripeConfig.js"(exports) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    exports.StripeConfigSerializer = void 0;
    exports.StripeConfigSerializer = {
      _fromJsonObject(object) {
        return {
          secret: object["secret"]
        };
      },
      _toJsonObject(self) {
        return {
          secret: self.secret
        };
      }
    };
  }
});

// node_modules/svix/dist/models/svixConfig.js
var require_svixConfig = __commonJS({
  "node_modules/svix/dist/models/svixConfig.js"(exports) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    exports.SvixConfigSerializer = void 0;
    exports.SvixConfigSerializer = {
      _fromJsonObject(object) {
        return {
          secret: object["secret"]
        };
      },
      _toJsonObject(self) {
        return {
          secret: self.secret
        };
      }
    };
  }
});

// node_modules/svix/dist/models/telnyxConfig.js
var require_telnyxConfig = __commonJS({
  "node_modules/svix/dist/models/telnyxConfig.js"(exports) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    exports.TelnyxConfigSerializer = void 0;
    exports.TelnyxConfigSerializer = {
      _fromJsonObject(object) {
        return {
          publicKey: object["publicKey"]
        };
      },
      _toJsonObject(self) {
        return {
          publicKey: self.publicKey
        };
      }
    };
  }
});

// node_modules/svix/dist/models/vapiConfig.js
var require_vapiConfig = __commonJS({
  "node_modules/svix/dist/models/vapiConfig.js"(exports) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    exports.VapiConfigSerializer = void 0;
    exports.VapiConfigSerializer = {
      _fromJsonObject(object) {
        return {
          secret: object["secret"]
        };
      },
      _toJsonObject(self) {
        return {
          secret: self.secret
        };
      }
    };
  }
});

// node_modules/svix/dist/models/veriffConfig.js
var require_veriffConfig = __commonJS({
  "node_modules/svix/dist/models/veriffConfig.js"(exports) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    exports.VeriffConfigSerializer = void 0;
    exports.VeriffConfigSerializer = {
      _fromJsonObject(object) {
        return {
          secret: object["secret"]
        };
      },
      _toJsonObject(self) {
        return {
          secret: self.secret
        };
      }
    };
  }
});

// node_modules/svix/dist/models/zoomConfig.js
var require_zoomConfig = __commonJS({
  "node_modules/svix/dist/models/zoomConfig.js"(exports) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    exports.ZoomConfigSerializer = void 0;
    exports.ZoomConfigSerializer = {
      _fromJsonObject(object) {
        return {
          secret: object["secret"]
        };
      },
      _toJsonObject(self) {
        return {
          secret: self.secret
        };
      }
    };
  }
});

// node_modules/svix/dist/models/ingestSourceIn.js
var require_ingestSourceIn = __commonJS({
  "node_modules/svix/dist/models/ingestSourceIn.js"(exports) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    exports.IngestSourceInSerializer = void 0;
    var adobeSignConfig_1 = require_adobeSignConfig();
    var airwallexConfig_1 = require_airwallexConfig();
    var checkbookConfig_1 = require_checkbookConfig();
    var cronConfig_1 = require_cronConfig();
    var docusignConfig_1 = require_docusignConfig();
    var easypostConfig_1 = require_easypostConfig();
    var githubConfig_1 = require_githubConfig();
    var hubspotConfig_1 = require_hubspotConfig();
    var orumIoConfig_1 = require_orumIoConfig();
    var pandaDocConfig_1 = require_pandaDocConfig();
    var portIoConfig_1 = require_portIoConfig();
    var rutterConfig_1 = require_rutterConfig();
    var segmentConfig_1 = require_segmentConfig();
    var shopifyConfig_1 = require_shopifyConfig();
    var slackConfig_1 = require_slackConfig();
    var stripeConfig_1 = require_stripeConfig();
    var svixConfig_1 = require_svixConfig();
    var telnyxConfig_1 = require_telnyxConfig();
    var vapiConfig_1 = require_vapiConfig();
    var veriffConfig_1 = require_veriffConfig();
    var zoomConfig_1 = require_zoomConfig();
    exports.IngestSourceInSerializer = {
      _fromJsonObject(object) {
        const type = object["type"];
        function getConfig(type2) {
          switch (type2) {
            case "generic-webhook":
              return {};
            case "cron":
              return cronConfig_1.CronConfigSerializer._fromJsonObject(object["config"]);
            case "adobe-sign":
              return adobeSignConfig_1.AdobeSignConfigSerializer._fromJsonObject(object["config"]);
            case "beehiiv":
              return svixConfig_1.SvixConfigSerializer._fromJsonObject(object["config"]);
            case "brex":
              return svixConfig_1.SvixConfigSerializer._fromJsonObject(object["config"]);
            case "checkbook":
              return checkbookConfig_1.CheckbookConfigSerializer._fromJsonObject(object["config"]);
            case "clerk":
              return svixConfig_1.SvixConfigSerializer._fromJsonObject(object["config"]);
            case "docusign":
              return docusignConfig_1.DocusignConfigSerializer._fromJsonObject(object["config"]);
            case "easypost":
              return easypostConfig_1.EasypostConfigSerializer._fromJsonObject(object["config"]);
            case "github":
              return githubConfig_1.GithubConfigSerializer._fromJsonObject(object["config"]);
            case "guesty":
              return svixConfig_1.SvixConfigSerializer._fromJsonObject(object["config"]);
            case "hubspot":
              return hubspotConfig_1.HubspotConfigSerializer._fromJsonObject(object["config"]);
            case "incident-io":
              return svixConfig_1.SvixConfigSerializer._fromJsonObject(object["config"]);
            case "lithic":
              return svixConfig_1.SvixConfigSerializer._fromJsonObject(object["config"]);
            case "nash":
              return svixConfig_1.SvixConfigSerializer._fromJsonObject(object["config"]);
            case "orum-io":
              return orumIoConfig_1.OrumIoConfigSerializer._fromJsonObject(object["config"]);
            case "panda-doc":
              return pandaDocConfig_1.PandaDocConfigSerializer._fromJsonObject(object["config"]);
            case "port-io":
              return portIoConfig_1.PortIoConfigSerializer._fromJsonObject(object["config"]);
            case "pleo":
              return svixConfig_1.SvixConfigSerializer._fromJsonObject(object["config"]);
            case "replicate":
              return svixConfig_1.SvixConfigSerializer._fromJsonObject(object["config"]);
            case "resend":
              return svixConfig_1.SvixConfigSerializer._fromJsonObject(object["config"]);
            case "rutter":
              return rutterConfig_1.RutterConfigSerializer._fromJsonObject(object["config"]);
            case "safebase":
              return svixConfig_1.SvixConfigSerializer._fromJsonObject(object["config"]);
            case "sardine":
              return svixConfig_1.SvixConfigSerializer._fromJsonObject(object["config"]);
            case "segment":
              return segmentConfig_1.SegmentConfigSerializer._fromJsonObject(object["config"]);
            case "shopify":
              return shopifyConfig_1.ShopifyConfigSerializer._fromJsonObject(object["config"]);
            case "slack":
              return slackConfig_1.SlackConfigSerializer._fromJsonObject(object["config"]);
            case "stripe":
              return stripeConfig_1.StripeConfigSerializer._fromJsonObject(object["config"]);
            case "stych":
              return svixConfig_1.SvixConfigSerializer._fromJsonObject(object["config"]);
            case "svix":
              return svixConfig_1.SvixConfigSerializer._fromJsonObject(object["config"]);
            case "zoom":
              return zoomConfig_1.ZoomConfigSerializer._fromJsonObject(object["config"]);
            case "telnyx":
              return telnyxConfig_1.TelnyxConfigSerializer._fromJsonObject(object["config"]);
            case "vapi":
              return vapiConfig_1.VapiConfigSerializer._fromJsonObject(object["config"]);
            case "open-ai":
              return svixConfig_1.SvixConfigSerializer._fromJsonObject(object["config"]);
            case "render":
              return svixConfig_1.SvixConfigSerializer._fromJsonObject(object["config"]);
            case "veriff":
              return veriffConfig_1.VeriffConfigSerializer._fromJsonObject(object["config"]);
            case "airwallex":
              return airwallexConfig_1.AirwallexConfigSerializer._fromJsonObject(object["config"]);
            default:
              throw new Error(`Unexpected type: ${type2}`);
          }
        }
        return {
          type,
          config: getConfig(type),
          metadata: object["metadata"],
          name: object["name"],
          uid: object["uid"]
        };
      },
      _toJsonObject(self) {
        let config3;
        switch (self.type) {
          case "generic-webhook":
            config3 = {};
            break;
          case "cron":
            config3 = cronConfig_1.CronConfigSerializer._toJsonObject(self.config);
            break;
          case "adobe-sign":
            config3 = adobeSignConfig_1.AdobeSignConfigSerializer._toJsonObject(self.config);
            break;
          case "beehiiv":
            config3 = svixConfig_1.SvixConfigSerializer._toJsonObject(self.config);
            break;
          case "brex":
            config3 = svixConfig_1.SvixConfigSerializer._toJsonObject(self.config);
            break;
          case "checkbook":
            config3 = checkbookConfig_1.CheckbookConfigSerializer._toJsonObject(self.config);
            break;
          case "clerk":
            config3 = svixConfig_1.SvixConfigSerializer._toJsonObject(self.config);
            break;
          case "docusign":
            config3 = docusignConfig_1.DocusignConfigSerializer._toJsonObject(self.config);
            break;
          case "easypost":
            config3 = easypostConfig_1.EasypostConfigSerializer._toJsonObject(self.config);
            break;
          case "github":
            config3 = githubConfig_1.GithubConfigSerializer._toJsonObject(self.config);
            break;
          case "guesty":
            config3 = svixConfig_1.SvixConfigSerializer._toJsonObject(self.config);
            break;
          case "hubspot":
            config3 = hubspotConfig_1.HubspotConfigSerializer._toJsonObject(self.config);
            break;
          case "incident-io":
            config3 = svixConfig_1.SvixConfigSerializer._toJsonObject(self.config);
            break;
          case "lithic":
            config3 = svixConfig_1.SvixConfigSerializer._toJsonObject(self.config);
            break;
          case "nash":
            config3 = svixConfig_1.SvixConfigSerializer._toJsonObject(self.config);
            break;
          case "orum-io":
            config3 = orumIoConfig_1.OrumIoConfigSerializer._toJsonObject(self.config);
            break;
          case "panda-doc":
            config3 = pandaDocConfig_1.PandaDocConfigSerializer._toJsonObject(self.config);
            break;
          case "port-io":
            config3 = portIoConfig_1.PortIoConfigSerializer._toJsonObject(self.config);
            break;
          case "pleo":
            config3 = svixConfig_1.SvixConfigSerializer._toJsonObject(self.config);
            break;
          case "replicate":
            config3 = svixConfig_1.SvixConfigSerializer._toJsonObject(self.config);
            break;
          case "resend":
            config3 = svixConfig_1.SvixConfigSerializer._toJsonObject(self.config);
            break;
          case "rutter":
            config3 = rutterConfig_1.RutterConfigSerializer._toJsonObject(self.config);
            break;
          case "safebase":
            config3 = svixConfig_1.SvixConfigSerializer._toJsonObject(self.config);
            break;
          case "sardine":
            config3 = svixConfig_1.SvixConfigSerializer._toJsonObject(self.config);
            break;
          case "segment":
            config3 = segmentConfig_1.SegmentConfigSerializer._toJsonObject(self.config);
            break;
          case "shopify":
            config3 = shopifyConfig_1.ShopifyConfigSerializer._toJsonObject(self.config);
            break;
          case "slack":
            config3 = slackConfig_1.SlackConfigSerializer._toJsonObject(self.config);
            break;
          case "stripe":
            config3 = stripeConfig_1.StripeConfigSerializer._toJsonObject(self.config);
            break;
          case "stych":
            config3 = svixConfig_1.SvixConfigSerializer._toJsonObject(self.config);
            break;
          case "svix":
            config3 = svixConfig_1.SvixConfigSerializer._toJsonObject(self.config);
            break;
          case "zoom":
            config3 = zoomConfig_1.ZoomConfigSerializer._toJsonObject(self.config);
            break;
          case "telnyx":
            config3 = telnyxConfig_1.TelnyxConfigSerializer._toJsonObject(self.config);
            break;
          case "vapi":
            config3 = vapiConfig_1.VapiConfigSerializer._toJsonObject(self.config);
            break;
          case "open-ai":
            config3 = svixConfig_1.SvixConfigSerializer._toJsonObject(self.config);
            break;
          case "render":
            config3 = svixConfig_1.SvixConfigSerializer._toJsonObject(self.config);
            break;
          case "veriff":
            config3 = veriffConfig_1.VeriffConfigSerializer._toJsonObject(self.config);
            break;
          case "airwallex":
            config3 = airwallexConfig_1.AirwallexConfigSerializer._toJsonObject(self.config);
            break;
        }
        return {
          type: self.type,
          config: config3,
          metadata: self.metadata,
          name: self.name,
          uid: self.uid
        };
      }
    };
  }
});

// node_modules/svix/dist/models/adobeSignConfigOut.js
var require_adobeSignConfigOut = __commonJS({
  "node_modules/svix/dist/models/adobeSignConfigOut.js"(exports) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    exports.AdobeSignConfigOutSerializer = void 0;
    exports.AdobeSignConfigOutSerializer = {
      _fromJsonObject(object) {
        return {};
      },
      _toJsonObject(self) {
        return {};
      }
    };
  }
});

// node_modules/svix/dist/models/airwallexConfigOut.js
var require_airwallexConfigOut = __commonJS({
  "node_modules/svix/dist/models/airwallexConfigOut.js"(exports) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    exports.AirwallexConfigOutSerializer = void 0;
    exports.AirwallexConfigOutSerializer = {
      _fromJsonObject(object) {
        return {};
      },
      _toJsonObject(self) {
        return {};
      }
    };
  }
});

// node_modules/svix/dist/models/checkbookConfigOut.js
var require_checkbookConfigOut = __commonJS({
  "node_modules/svix/dist/models/checkbookConfigOut.js"(exports) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    exports.CheckbookConfigOutSerializer = void 0;
    exports.CheckbookConfigOutSerializer = {
      _fromJsonObject(object) {
        return {};
      },
      _toJsonObject(self) {
        return {};
      }
    };
  }
});

// node_modules/svix/dist/models/docusignConfigOut.js
var require_docusignConfigOut = __commonJS({
  "node_modules/svix/dist/models/docusignConfigOut.js"(exports) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    exports.DocusignConfigOutSerializer = void 0;
    exports.DocusignConfigOutSerializer = {
      _fromJsonObject(object) {
        return {};
      },
      _toJsonObject(self) {
        return {};
      }
    };
  }
});

// node_modules/svix/dist/models/easypostConfigOut.js
var require_easypostConfigOut = __commonJS({
  "node_modules/svix/dist/models/easypostConfigOut.js"(exports) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    exports.EasypostConfigOutSerializer = void 0;
    exports.EasypostConfigOutSerializer = {
      _fromJsonObject(object) {
        return {};
      },
      _toJsonObject(self) {
        return {};
      }
    };
  }
});

// node_modules/svix/dist/models/githubConfigOut.js
var require_githubConfigOut = __commonJS({
  "node_modules/svix/dist/models/githubConfigOut.js"(exports) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    exports.GithubConfigOutSerializer = void 0;
    exports.GithubConfigOutSerializer = {
      _fromJsonObject(object) {
        return {};
      },
      _toJsonObject(self) {
        return {};
      }
    };
  }
});

// node_modules/svix/dist/models/hubspotConfigOut.js
var require_hubspotConfigOut = __commonJS({
  "node_modules/svix/dist/models/hubspotConfigOut.js"(exports) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    exports.HubspotConfigOutSerializer = void 0;
    exports.HubspotConfigOutSerializer = {
      _fromJsonObject(object) {
        return {};
      },
      _toJsonObject(self) {
        return {};
      }
    };
  }
});

// node_modules/svix/dist/models/orumIoConfigOut.js
var require_orumIoConfigOut = __commonJS({
  "node_modules/svix/dist/models/orumIoConfigOut.js"(exports) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    exports.OrumIoConfigOutSerializer = void 0;
    exports.OrumIoConfigOutSerializer = {
      _fromJsonObject(object) {
        return {
          publicKey: object["publicKey"]
        };
      },
      _toJsonObject(self) {
        return {
          publicKey: self.publicKey
        };
      }
    };
  }
});

// node_modules/svix/dist/models/pandaDocConfigOut.js
var require_pandaDocConfigOut = __commonJS({
  "node_modules/svix/dist/models/pandaDocConfigOut.js"(exports) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    exports.PandaDocConfigOutSerializer = void 0;
    exports.PandaDocConfigOutSerializer = {
      _fromJsonObject(object) {
        return {};
      },
      _toJsonObject(self) {
        return {};
      }
    };
  }
});

// node_modules/svix/dist/models/portIoConfigOut.js
var require_portIoConfigOut = __commonJS({
  "node_modules/svix/dist/models/portIoConfigOut.js"(exports) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    exports.PortIoConfigOutSerializer = void 0;
    exports.PortIoConfigOutSerializer = {
      _fromJsonObject(object) {
        return {};
      },
      _toJsonObject(self) {
        return {};
      }
    };
  }
});

// node_modules/svix/dist/models/rutterConfigOut.js
var require_rutterConfigOut = __commonJS({
  "node_modules/svix/dist/models/rutterConfigOut.js"(exports) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    exports.RutterConfigOutSerializer = void 0;
    exports.RutterConfigOutSerializer = {
      _fromJsonObject(object) {
        return {};
      },
      _toJsonObject(self) {
        return {};
      }
    };
  }
});

// node_modules/svix/dist/models/segmentConfigOut.js
var require_segmentConfigOut = __commonJS({
  "node_modules/svix/dist/models/segmentConfigOut.js"(exports) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    exports.SegmentConfigOutSerializer = void 0;
    exports.SegmentConfigOutSerializer = {
      _fromJsonObject(object) {
        return {};
      },
      _toJsonObject(self) {
        return {};
      }
    };
  }
});

// node_modules/svix/dist/models/shopifyConfigOut.js
var require_shopifyConfigOut = __commonJS({
  "node_modules/svix/dist/models/shopifyConfigOut.js"(exports) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    exports.ShopifyConfigOutSerializer = void 0;
    exports.ShopifyConfigOutSerializer = {
      _fromJsonObject(object) {
        return {};
      },
      _toJsonObject(self) {
        return {};
      }
    };
  }
});

// node_modules/svix/dist/models/slackConfigOut.js
var require_slackConfigOut = __commonJS({
  "node_modules/svix/dist/models/slackConfigOut.js"(exports) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    exports.SlackConfigOutSerializer = void 0;
    exports.SlackConfigOutSerializer = {
      _fromJsonObject(object) {
        return {};
      },
      _toJsonObject(self) {
        return {};
      }
    };
  }
});

// node_modules/svix/dist/models/stripeConfigOut.js
var require_stripeConfigOut = __commonJS({
  "node_modules/svix/dist/models/stripeConfigOut.js"(exports) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    exports.StripeConfigOutSerializer = void 0;
    exports.StripeConfigOutSerializer = {
      _fromJsonObject(object) {
        return {};
      },
      _toJsonObject(self) {
        return {};
      }
    };
  }
});

// node_modules/svix/dist/models/svixConfigOut.js
var require_svixConfigOut = __commonJS({
  "node_modules/svix/dist/models/svixConfigOut.js"(exports) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    exports.SvixConfigOutSerializer = void 0;
    exports.SvixConfigOutSerializer = {
      _fromJsonObject(object) {
        return {};
      },
      _toJsonObject(self) {
        return {};
      }
    };
  }
});

// node_modules/svix/dist/models/telnyxConfigOut.js
var require_telnyxConfigOut = __commonJS({
  "node_modules/svix/dist/models/telnyxConfigOut.js"(exports) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    exports.TelnyxConfigOutSerializer = void 0;
    exports.TelnyxConfigOutSerializer = {
      _fromJsonObject(object) {
        return {
          publicKey: object["publicKey"]
        };
      },
      _toJsonObject(self) {
        return {
          publicKey: self.publicKey
        };
      }
    };
  }
});

// node_modules/svix/dist/models/vapiConfigOut.js
var require_vapiConfigOut = __commonJS({
  "node_modules/svix/dist/models/vapiConfigOut.js"(exports) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    exports.VapiConfigOutSerializer = void 0;
    exports.VapiConfigOutSerializer = {
      _fromJsonObject(object) {
        return {};
      },
      _toJsonObject(self) {
        return {};
      }
    };
  }
});

// node_modules/svix/dist/models/veriffConfigOut.js
var require_veriffConfigOut = __commonJS({
  "node_modules/svix/dist/models/veriffConfigOut.js"(exports) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    exports.VeriffConfigOutSerializer = void 0;
    exports.VeriffConfigOutSerializer = {
      _fromJsonObject(object) {
        return {};
      },
      _toJsonObject(self) {
        return {};
      }
    };
  }
});

// node_modules/svix/dist/models/zoomConfigOut.js
var require_zoomConfigOut = __commonJS({
  "node_modules/svix/dist/models/zoomConfigOut.js"(exports) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    exports.ZoomConfigOutSerializer = void 0;
    exports.ZoomConfigOutSerializer = {
      _fromJsonObject(object) {
        return {};
      },
      _toJsonObject(self) {
        return {};
      }
    };
  }
});

// node_modules/svix/dist/models/ingestSourceOut.js
var require_ingestSourceOut = __commonJS({
  "node_modules/svix/dist/models/ingestSourceOut.js"(exports) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    exports.IngestSourceOutSerializer = void 0;
    var adobeSignConfigOut_1 = require_adobeSignConfigOut();
    var airwallexConfigOut_1 = require_airwallexConfigOut();
    var checkbookConfigOut_1 = require_checkbookConfigOut();
    var cronConfig_1 = require_cronConfig();
    var docusignConfigOut_1 = require_docusignConfigOut();
    var easypostConfigOut_1 = require_easypostConfigOut();
    var githubConfigOut_1 = require_githubConfigOut();
    var hubspotConfigOut_1 = require_hubspotConfigOut();
    var orumIoConfigOut_1 = require_orumIoConfigOut();
    var pandaDocConfigOut_1 = require_pandaDocConfigOut();
    var portIoConfigOut_1 = require_portIoConfigOut();
    var rutterConfigOut_1 = require_rutterConfigOut();
    var segmentConfigOut_1 = require_segmentConfigOut();
    var shopifyConfigOut_1 = require_shopifyConfigOut();
    var slackConfigOut_1 = require_slackConfigOut();
    var stripeConfigOut_1 = require_stripeConfigOut();
    var svixConfigOut_1 = require_svixConfigOut();
    var telnyxConfigOut_1 = require_telnyxConfigOut();
    var vapiConfigOut_1 = require_vapiConfigOut();
    var veriffConfigOut_1 = require_veriffConfigOut();
    var zoomConfigOut_1 = require_zoomConfigOut();
    exports.IngestSourceOutSerializer = {
      _fromJsonObject(object) {
        const type = object["type"];
        function getConfig(type2) {
          switch (type2) {
            case "generic-webhook":
              return {};
            case "cron":
              return cronConfig_1.CronConfigSerializer._fromJsonObject(object["config"]);
            case "adobe-sign":
              return adobeSignConfigOut_1.AdobeSignConfigOutSerializer._fromJsonObject(object["config"]);
            case "beehiiv":
              return svixConfigOut_1.SvixConfigOutSerializer._fromJsonObject(object["config"]);
            case "brex":
              return svixConfigOut_1.SvixConfigOutSerializer._fromJsonObject(object["config"]);
            case "checkbook":
              return checkbookConfigOut_1.CheckbookConfigOutSerializer._fromJsonObject(object["config"]);
            case "clerk":
              return svixConfigOut_1.SvixConfigOutSerializer._fromJsonObject(object["config"]);
            case "docusign":
              return docusignConfigOut_1.DocusignConfigOutSerializer._fromJsonObject(object["config"]);
            case "easypost":
              return easypostConfigOut_1.EasypostConfigOutSerializer._fromJsonObject(object["config"]);
            case "github":
              return githubConfigOut_1.GithubConfigOutSerializer._fromJsonObject(object["config"]);
            case "guesty":
              return svixConfigOut_1.SvixConfigOutSerializer._fromJsonObject(object["config"]);
            case "hubspot":
              return hubspotConfigOut_1.HubspotConfigOutSerializer._fromJsonObject(object["config"]);
            case "incident-io":
              return svixConfigOut_1.SvixConfigOutSerializer._fromJsonObject(object["config"]);
            case "lithic":
              return svixConfigOut_1.SvixConfigOutSerializer._fromJsonObject(object["config"]);
            case "nash":
              return svixConfigOut_1.SvixConfigOutSerializer._fromJsonObject(object["config"]);
            case "orum-io":
              return orumIoConfigOut_1.OrumIoConfigOutSerializer._fromJsonObject(object["config"]);
            case "panda-doc":
              return pandaDocConfigOut_1.PandaDocConfigOutSerializer._fromJsonObject(object["config"]);
            case "port-io":
              return portIoConfigOut_1.PortIoConfigOutSerializer._fromJsonObject(object["config"]);
            case "pleo":
              return svixConfigOut_1.SvixConfigOutSerializer._fromJsonObject(object["config"]);
            case "replicate":
              return svixConfigOut_1.SvixConfigOutSerializer._fromJsonObject(object["config"]);
            case "resend":
              return svixConfigOut_1.SvixConfigOutSerializer._fromJsonObject(object["config"]);
            case "rutter":
              return rutterConfigOut_1.RutterConfigOutSerializer._fromJsonObject(object["config"]);
            case "safebase":
              return svixConfigOut_1.SvixConfigOutSerializer._fromJsonObject(object["config"]);
            case "sardine":
              return svixConfigOut_1.SvixConfigOutSerializer._fromJsonObject(object["config"]);
            case "segment":
              return segmentConfigOut_1.SegmentConfigOutSerializer._fromJsonObject(object["config"]);
            case "shopify":
              return shopifyConfigOut_1.ShopifyConfigOutSerializer._fromJsonObject(object["config"]);
            case "slack":
              return slackConfigOut_1.SlackConfigOutSerializer._fromJsonObject(object["config"]);
            case "stripe":
              return stripeConfigOut_1.StripeConfigOutSerializer._fromJsonObject(object["config"]);
            case "stych":
              return svixConfigOut_1.SvixConfigOutSerializer._fromJsonObject(object["config"]);
            case "svix":
              return svixConfigOut_1.SvixConfigOutSerializer._fromJsonObject(object["config"]);
            case "zoom":
              return zoomConfigOut_1.ZoomConfigOutSerializer._fromJsonObject(object["config"]);
            case "telnyx":
              return telnyxConfigOut_1.TelnyxConfigOutSerializer._fromJsonObject(object["config"]);
            case "vapi":
              return vapiConfigOut_1.VapiConfigOutSerializer._fromJsonObject(object["config"]);
            case "open-ai":
              return svixConfigOut_1.SvixConfigOutSerializer._fromJsonObject(object["config"]);
            case "render":
              return svixConfigOut_1.SvixConfigOutSerializer._fromJsonObject(object["config"]);
            case "veriff":
              return veriffConfigOut_1.VeriffConfigOutSerializer._fromJsonObject(object["config"]);
            case "airwallex":
              return airwallexConfigOut_1.AirwallexConfigOutSerializer._fromJsonObject(object["config"]);
            default:
              throw new Error(`Unexpected type: ${type2}`);
          }
        }
        return {
          type,
          config: getConfig(type),
          createdAt: new Date(object["createdAt"]),
          id: object["id"],
          ingestUrl: object["ingestUrl"],
          metadata: object["metadata"],
          name: object["name"],
          uid: object["uid"],
          updatedAt: new Date(object["updatedAt"])
        };
      },
      _toJsonObject(self) {
        let config3;
        switch (self.type) {
          case "generic-webhook":
            config3 = {};
            break;
          case "cron":
            config3 = cronConfig_1.CronConfigSerializer._toJsonObject(self.config);
            break;
          case "adobe-sign":
            config3 = adobeSignConfigOut_1.AdobeSignConfigOutSerializer._toJsonObject(self.config);
            break;
          case "beehiiv":
            config3 = svixConfigOut_1.SvixConfigOutSerializer._toJsonObject(self.config);
            break;
          case "brex":
            config3 = svixConfigOut_1.SvixConfigOutSerializer._toJsonObject(self.config);
            break;
          case "checkbook":
            config3 = checkbookConfigOut_1.CheckbookConfigOutSerializer._toJsonObject(self.config);
            break;
          case "clerk":
            config3 = svixConfigOut_1.SvixConfigOutSerializer._toJsonObject(self.config);
            break;
          case "docusign":
            config3 = docusignConfigOut_1.DocusignConfigOutSerializer._toJsonObject(self.config);
            break;
          case "easypost":
            config3 = easypostConfigOut_1.EasypostConfigOutSerializer._toJsonObject(self.config);
            break;
          case "github":
            config3 = githubConfigOut_1.GithubConfigOutSerializer._toJsonObject(self.config);
            break;
          case "guesty":
            config3 = svixConfigOut_1.SvixConfigOutSerializer._toJsonObject(self.config);
            break;
          case "hubspot":
            config3 = hubspotConfigOut_1.HubspotConfigOutSerializer._toJsonObject(self.config);
            break;
          case "incident-io":
            config3 = svixConfigOut_1.SvixConfigOutSerializer._toJsonObject(self.config);
            break;
          case "lithic":
            config3 = svixConfigOut_1.SvixConfigOutSerializer._toJsonObject(self.config);
            break;
          case "nash":
            config3 = svixConfigOut_1.SvixConfigOutSerializer._toJsonObject(self.config);
            break;
          case "orum-io":
            config3 = orumIoConfigOut_1.OrumIoConfigOutSerializer._toJsonObject(self.config);
            break;
          case "panda-doc":
            config3 = pandaDocConfigOut_1.PandaDocConfigOutSerializer._toJsonObject(self.config);
            break;
          case "port-io":
            config3 = portIoConfigOut_1.PortIoConfigOutSerializer._toJsonObject(self.config);
            break;
          case "pleo":
            config3 = svixConfigOut_1.SvixConfigOutSerializer._toJsonObject(self.config);
            break;
          case "replicate":
            config3 = svixConfigOut_1.SvixConfigOutSerializer._toJsonObject(self.config);
            break;
          case "resend":
            config3 = svixConfigOut_1.SvixConfigOutSerializer._toJsonObject(self.config);
            break;
          case "rutter":
            config3 = rutterConfigOut_1.RutterConfigOutSerializer._toJsonObject(self.config);
            break;
          case "safebase":
            config3 = svixConfigOut_1.SvixConfigOutSerializer._toJsonObject(self.config);
            break;
          case "sardine":
            config3 = svixConfigOut_1.SvixConfigOutSerializer._toJsonObject(self.config);
            break;
          case "segment":
            config3 = segmentConfigOut_1.SegmentConfigOutSerializer._toJsonObject(self.config);
            break;
          case "shopify":
            config3 = shopifyConfigOut_1.ShopifyConfigOutSerializer._toJsonObject(self.config);
            break;
          case "slack":
            config3 = slackConfigOut_1.SlackConfigOutSerializer._toJsonObject(self.config);
            break;
          case "stripe":
            config3 = stripeConfigOut_1.StripeConfigOutSerializer._toJsonObject(self.config);
            break;
          case "stych":
            config3 = svixConfigOut_1.SvixConfigOutSerializer._toJsonObject(self.config);
            break;
          case "svix":
            config3 = svixConfigOut_1.SvixConfigOutSerializer._toJsonObject(self.config);
            break;
          case "zoom":
            config3 = zoomConfigOut_1.ZoomConfigOutSerializer._toJsonObject(self.config);
            break;
          case "telnyx":
            config3 = telnyxConfigOut_1.TelnyxConfigOutSerializer._toJsonObject(self.config);
            break;
          case "vapi":
            config3 = vapiConfigOut_1.VapiConfigOutSerializer._toJsonObject(self.config);
            break;
          case "open-ai":
            config3 = svixConfigOut_1.SvixConfigOutSerializer._toJsonObject(self.config);
            break;
          case "render":
            config3 = svixConfigOut_1.SvixConfigOutSerializer._toJsonObject(self.config);
            break;
          case "veriff":
            config3 = veriffConfigOut_1.VeriffConfigOutSerializer._toJsonObject(self.config);
            break;
          case "airwallex":
            config3 = airwallexConfigOut_1.AirwallexConfigOutSerializer._toJsonObject(self.config);
            break;
        }
        return {
          type: self.type,
          config: config3,
          createdAt: self.createdAt,
          id: self.id,
          ingestUrl: self.ingestUrl,
          metadata: self.metadata,
          name: self.name,
          uid: self.uid,
          updatedAt: self.updatedAt
        };
      }
    };
  }
});

// node_modules/svix/dist/models/listResponseIngestSourceOut.js
var require_listResponseIngestSourceOut = __commonJS({
  "node_modules/svix/dist/models/listResponseIngestSourceOut.js"(exports) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    exports.ListResponseIngestSourceOutSerializer = void 0;
    var ingestSourceOut_1 = require_ingestSourceOut();
    exports.ListResponseIngestSourceOutSerializer = {
      _fromJsonObject(object) {
        return {
          data: object["data"].map((item) => ingestSourceOut_1.IngestSourceOutSerializer._fromJsonObject(item)),
          done: object["done"],
          iterator: object["iterator"],
          prevIterator: object["prevIterator"]
        };
      },
      _toJsonObject(self) {
        return {
          data: self.data.map((item) => ingestSourceOut_1.IngestSourceOutSerializer._toJsonObject(item)),
          done: self.done,
          iterator: self.iterator,
          prevIterator: self.prevIterator
        };
      }
    };
  }
});

// node_modules/svix/dist/models/rotateTokenOut.js
var require_rotateTokenOut = __commonJS({
  "node_modules/svix/dist/models/rotateTokenOut.js"(exports) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    exports.RotateTokenOutSerializer = void 0;
    exports.RotateTokenOutSerializer = {
      _fromJsonObject(object) {
        return {
          ingestUrl: object["ingestUrl"]
        };
      },
      _toJsonObject(self) {
        return {
          ingestUrl: self.ingestUrl
        };
      }
    };
  }
});

// node_modules/svix/dist/api/ingestSource.js
var require_ingestSource = __commonJS({
  "node_modules/svix/dist/api/ingestSource.js"(exports) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    exports.IngestSource = void 0;
    var ingestSourceIn_1 = require_ingestSourceIn();
    var ingestSourceOut_1 = require_ingestSourceOut();
    var listResponseIngestSourceOut_1 = require_listResponseIngestSourceOut();
    var rotateTokenOut_1 = require_rotateTokenOut();
    var request_1 = require_request();
    var IngestSource = class {
      constructor(requestCtx) {
        this.requestCtx = requestCtx;
      }
      list(options) {
        const request = new request_1.SvixRequest(request_1.HttpMethod.GET, "/ingest/api/v1/source");
        request.setQueryParam("limit", options === null || options === void 0 ? void 0 : options.limit);
        request.setQueryParam("iterator", options === null || options === void 0 ? void 0 : options.iterator);
        request.setQueryParam("order", options === null || options === void 0 ? void 0 : options.order);
        return request.send(this.requestCtx, listResponseIngestSourceOut_1.ListResponseIngestSourceOutSerializer._fromJsonObject);
      }
      create(ingestSourceIn, options) {
        const request = new request_1.SvixRequest(request_1.HttpMethod.POST, "/ingest/api/v1/source");
        request.setHeaderParam("idempotency-key", options === null || options === void 0 ? void 0 : options.idempotencyKey);
        request.setBody(ingestSourceIn_1.IngestSourceInSerializer._toJsonObject(ingestSourceIn));
        return request.send(this.requestCtx, ingestSourceOut_1.IngestSourceOutSerializer._fromJsonObject);
      }
      get(sourceId) {
        const request = new request_1.SvixRequest(request_1.HttpMethod.GET, "/ingest/api/v1/source/{source_id}");
        request.setPathParam("source_id", sourceId);
        return request.send(this.requestCtx, ingestSourceOut_1.IngestSourceOutSerializer._fromJsonObject);
      }
      update(sourceId, ingestSourceIn) {
        const request = new request_1.SvixRequest(request_1.HttpMethod.PUT, "/ingest/api/v1/source/{source_id}");
        request.setPathParam("source_id", sourceId);
        request.setBody(ingestSourceIn_1.IngestSourceInSerializer._toJsonObject(ingestSourceIn));
        return request.send(this.requestCtx, ingestSourceOut_1.IngestSourceOutSerializer._fromJsonObject);
      }
      delete(sourceId) {
        const request = new request_1.SvixRequest(request_1.HttpMethod.DELETE, "/ingest/api/v1/source/{source_id}");
        request.setPathParam("source_id", sourceId);
        return request.sendNoResponseBody(this.requestCtx);
      }
      rotateToken(sourceId, options) {
        const request = new request_1.SvixRequest(request_1.HttpMethod.POST, "/ingest/api/v1/source/{source_id}/token/rotate");
        request.setPathParam("source_id", sourceId);
        request.setHeaderParam("idempotency-key", options === null || options === void 0 ? void 0 : options.idempotencyKey);
        return request.send(this.requestCtx, rotateTokenOut_1.RotateTokenOutSerializer._fromJsonObject);
      }
    };
    exports.IngestSource = IngestSource;
  }
});

// node_modules/svix/dist/api/ingest.js
var require_ingest = __commonJS({
  "node_modules/svix/dist/api/ingest.js"(exports) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    exports.Ingest = void 0;
    var dashboardAccessOut_1 = require_dashboardAccessOut();
    var ingestSourceConsumerPortalAccessIn_1 = require_ingestSourceConsumerPortalAccessIn();
    var ingestEndpoint_1 = require_ingestEndpoint();
    var ingestSource_1 = require_ingestSource();
    var request_1 = require_request();
    var Ingest = class {
      constructor(requestCtx) {
        this.requestCtx = requestCtx;
      }
      get endpoint() {
        return new ingestEndpoint_1.IngestEndpoint(this.requestCtx);
      }
      get source() {
        return new ingestSource_1.IngestSource(this.requestCtx);
      }
      dashboard(sourceId, ingestSourceConsumerPortalAccessIn, options) {
        const request = new request_1.SvixRequest(request_1.HttpMethod.POST, "/ingest/api/v1/source/{source_id}/dashboard");
        request.setPathParam("source_id", sourceId);
        request.setHeaderParam("idempotency-key", options === null || options === void 0 ? void 0 : options.idempotencyKey);
        request.setBody(ingestSourceConsumerPortalAccessIn_1.IngestSourceConsumerPortalAccessInSerializer._toJsonObject(ingestSourceConsumerPortalAccessIn));
        return request.send(this.requestCtx, dashboardAccessOut_1.DashboardAccessOutSerializer._fromJsonObject);
      }
    };
    exports.Ingest = Ingest;
  }
});

// node_modules/svix/dist/models/integrationIn.js
var require_integrationIn = __commonJS({
  "node_modules/svix/dist/models/integrationIn.js"(exports) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    exports.IntegrationInSerializer = void 0;
    exports.IntegrationInSerializer = {
      _fromJsonObject(object) {
        return {
          featureFlags: object["featureFlags"],
          name: object["name"]
        };
      },
      _toJsonObject(self) {
        return {
          featureFlags: self.featureFlags,
          name: self.name
        };
      }
    };
  }
});

// node_modules/svix/dist/models/integrationKeyOut.js
var require_integrationKeyOut = __commonJS({
  "node_modules/svix/dist/models/integrationKeyOut.js"(exports) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    exports.IntegrationKeyOutSerializer = void 0;
    exports.IntegrationKeyOutSerializer = {
      _fromJsonObject(object) {
        return {
          key: object["key"]
        };
      },
      _toJsonObject(self) {
        return {
          key: self.key
        };
      }
    };
  }
});

// node_modules/svix/dist/models/integrationOut.js
var require_integrationOut = __commonJS({
  "node_modules/svix/dist/models/integrationOut.js"(exports) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    exports.IntegrationOutSerializer = void 0;
    exports.IntegrationOutSerializer = {
      _fromJsonObject(object) {
        return {
          createdAt: new Date(object["createdAt"]),
          featureFlags: object["featureFlags"],
          id: object["id"],
          name: object["name"],
          updatedAt: new Date(object["updatedAt"])
        };
      },
      _toJsonObject(self) {
        return {
          createdAt: self.createdAt,
          featureFlags: self.featureFlags,
          id: self.id,
          name: self.name,
          updatedAt: self.updatedAt
        };
      }
    };
  }
});

// node_modules/svix/dist/models/integrationUpdate.js
var require_integrationUpdate = __commonJS({
  "node_modules/svix/dist/models/integrationUpdate.js"(exports) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    exports.IntegrationUpdateSerializer = void 0;
    exports.IntegrationUpdateSerializer = {
      _fromJsonObject(object) {
        return {
          featureFlags: object["featureFlags"],
          name: object["name"]
        };
      },
      _toJsonObject(self) {
        return {
          featureFlags: self.featureFlags,
          name: self.name
        };
      }
    };
  }
});

// node_modules/svix/dist/models/listResponseIntegrationOut.js
var require_listResponseIntegrationOut = __commonJS({
  "node_modules/svix/dist/models/listResponseIntegrationOut.js"(exports) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    exports.ListResponseIntegrationOutSerializer = void 0;
    var integrationOut_1 = require_integrationOut();
    exports.ListResponseIntegrationOutSerializer = {
      _fromJsonObject(object) {
        return {
          data: object["data"].map((item) => integrationOut_1.IntegrationOutSerializer._fromJsonObject(item)),
          done: object["done"],
          iterator: object["iterator"],
          prevIterator: object["prevIterator"]
        };
      },
      _toJsonObject(self) {
        return {
          data: self.data.map((item) => integrationOut_1.IntegrationOutSerializer._toJsonObject(item)),
          done: self.done,
          iterator: self.iterator,
          prevIterator: self.prevIterator
        };
      }
    };
  }
});

// node_modules/svix/dist/api/integration.js
var require_integration = __commonJS({
  "node_modules/svix/dist/api/integration.js"(exports) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    exports.Integration = void 0;
    var integrationIn_1 = require_integrationIn();
    var integrationKeyOut_1 = require_integrationKeyOut();
    var integrationOut_1 = require_integrationOut();
    var integrationUpdate_1 = require_integrationUpdate();
    var listResponseIntegrationOut_1 = require_listResponseIntegrationOut();
    var request_1 = require_request();
    var Integration = class {
      constructor(requestCtx) {
        this.requestCtx = requestCtx;
      }
      list(appId, options) {
        const request = new request_1.SvixRequest(request_1.HttpMethod.GET, "/api/v1/app/{app_id}/integration");
        request.setPathParam("app_id", appId);
        request.setQueryParam("limit", options === null || options === void 0 ? void 0 : options.limit);
        request.setQueryParam("iterator", options === null || options === void 0 ? void 0 : options.iterator);
        request.setQueryParam("order", options === null || options === void 0 ? void 0 : options.order);
        return request.send(this.requestCtx, listResponseIntegrationOut_1.ListResponseIntegrationOutSerializer._fromJsonObject);
      }
      create(appId, integrationIn, options) {
        const request = new request_1.SvixRequest(request_1.HttpMethod.POST, "/api/v1/app/{app_id}/integration");
        request.setPathParam("app_id", appId);
        request.setHeaderParam("idempotency-key", options === null || options === void 0 ? void 0 : options.idempotencyKey);
        request.setBody(integrationIn_1.IntegrationInSerializer._toJsonObject(integrationIn));
        return request.send(this.requestCtx, integrationOut_1.IntegrationOutSerializer._fromJsonObject);
      }
      get(appId, integId) {
        const request = new request_1.SvixRequest(request_1.HttpMethod.GET, "/api/v1/app/{app_id}/integration/{integ_id}");
        request.setPathParam("app_id", appId);
        request.setPathParam("integ_id", integId);
        return request.send(this.requestCtx, integrationOut_1.IntegrationOutSerializer._fromJsonObject);
      }
      update(appId, integId, integrationUpdate) {
        const request = new request_1.SvixRequest(request_1.HttpMethod.PUT, "/api/v1/app/{app_id}/integration/{integ_id}");
        request.setPathParam("app_id", appId);
        request.setPathParam("integ_id", integId);
        request.setBody(integrationUpdate_1.IntegrationUpdateSerializer._toJsonObject(integrationUpdate));
        return request.send(this.requestCtx, integrationOut_1.IntegrationOutSerializer._fromJsonObject);
      }
      delete(appId, integId) {
        const request = new request_1.SvixRequest(request_1.HttpMethod.DELETE, "/api/v1/app/{app_id}/integration/{integ_id}");
        request.setPathParam("app_id", appId);
        request.setPathParam("integ_id", integId);
        return request.sendNoResponseBody(this.requestCtx);
      }
      getKey(appId, integId) {
        const request = new request_1.SvixRequest(request_1.HttpMethod.GET, "/api/v1/app/{app_id}/integration/{integ_id}/key");
        request.setPathParam("app_id", appId);
        request.setPathParam("integ_id", integId);
        return request.send(this.requestCtx, integrationKeyOut_1.IntegrationKeyOutSerializer._fromJsonObject);
      }
      rotateKey(appId, integId, options) {
        const request = new request_1.SvixRequest(request_1.HttpMethod.POST, "/api/v1/app/{app_id}/integration/{integ_id}/key/rotate");
        request.setPathParam("app_id", appId);
        request.setPathParam("integ_id", integId);
        request.setHeaderParam("idempotency-key", options === null || options === void 0 ? void 0 : options.idempotencyKey);
        return request.send(this.requestCtx, integrationKeyOut_1.IntegrationKeyOutSerializer._fromJsonObject);
      }
    };
    exports.Integration = Integration;
  }
});

// node_modules/svix/dist/models/expungeAllContentsOut.js
var require_expungeAllContentsOut = __commonJS({
  "node_modules/svix/dist/models/expungeAllContentsOut.js"(exports) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    exports.ExpungeAllContentsOutSerializer = void 0;
    var backgroundTaskStatus_1 = require_backgroundTaskStatus();
    var backgroundTaskType_1 = require_backgroundTaskType();
    exports.ExpungeAllContentsOutSerializer = {
      _fromJsonObject(object) {
        return {
          id: object["id"],
          status: backgroundTaskStatus_1.BackgroundTaskStatusSerializer._fromJsonObject(object["status"]),
          task: backgroundTaskType_1.BackgroundTaskTypeSerializer._fromJsonObject(object["task"])
        };
      },
      _toJsonObject(self) {
        return {
          id: self.id,
          status: backgroundTaskStatus_1.BackgroundTaskStatusSerializer._toJsonObject(self.status),
          task: backgroundTaskType_1.BackgroundTaskTypeSerializer._toJsonObject(self.task)
        };
      }
    };
  }
});

// node_modules/svix/dist/models/listResponseMessageOut.js
var require_listResponseMessageOut = __commonJS({
  "node_modules/svix/dist/models/listResponseMessageOut.js"(exports) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    exports.ListResponseMessageOutSerializer = void 0;
    var messageOut_1 = require_messageOut();
    exports.ListResponseMessageOutSerializer = {
      _fromJsonObject(object) {
        return {
          data: object["data"].map((item) => messageOut_1.MessageOutSerializer._fromJsonObject(item)),
          done: object["done"],
          iterator: object["iterator"],
          prevIterator: object["prevIterator"]
        };
      },
      _toJsonObject(self) {
        return {
          data: self.data.map((item) => messageOut_1.MessageOutSerializer._toJsonObject(item)),
          done: self.done,
          iterator: self.iterator,
          prevIterator: self.prevIterator
        };
      }
    };
  }
});

// node_modules/svix/dist/models/pollingEndpointConsumerSeekIn.js
var require_pollingEndpointConsumerSeekIn = __commonJS({
  "node_modules/svix/dist/models/pollingEndpointConsumerSeekIn.js"(exports) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    exports.PollingEndpointConsumerSeekInSerializer = void 0;
    exports.PollingEndpointConsumerSeekInSerializer = {
      _fromJsonObject(object) {
        return {
          after: new Date(object["after"])
        };
      },
      _toJsonObject(self) {
        return {
          after: self.after
        };
      }
    };
  }
});

// node_modules/svix/dist/models/pollingEndpointConsumerSeekOut.js
var require_pollingEndpointConsumerSeekOut = __commonJS({
  "node_modules/svix/dist/models/pollingEndpointConsumerSeekOut.js"(exports) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    exports.PollingEndpointConsumerSeekOutSerializer = void 0;
    exports.PollingEndpointConsumerSeekOutSerializer = {
      _fromJsonObject(object) {
        return {
          iterator: object["iterator"]
        };
      },
      _toJsonObject(self) {
        return {
          iterator: self.iterator
        };
      }
    };
  }
});

// node_modules/svix/dist/models/pollingEndpointMessageOut.js
var require_pollingEndpointMessageOut = __commonJS({
  "node_modules/svix/dist/models/pollingEndpointMessageOut.js"(exports) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    exports.PollingEndpointMessageOutSerializer = void 0;
    exports.PollingEndpointMessageOutSerializer = {
      _fromJsonObject(object) {
        return {
          channels: object["channels"],
          eventId: object["eventId"],
          eventType: object["eventType"],
          headers: object["headers"],
          id: object["id"],
          payload: object["payload"],
          tags: object["tags"],
          timestamp: new Date(object["timestamp"])
        };
      },
      _toJsonObject(self) {
        return {
          channels: self.channels,
          eventId: self.eventId,
          eventType: self.eventType,
          headers: self.headers,
          id: self.id,
          payload: self.payload,
          tags: self.tags,
          timestamp: self.timestamp
        };
      }
    };
  }
});

// node_modules/svix/dist/models/pollingEndpointOut.js
var require_pollingEndpointOut = __commonJS({
  "node_modules/svix/dist/models/pollingEndpointOut.js"(exports) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    exports.PollingEndpointOutSerializer = void 0;
    var pollingEndpointMessageOut_1 = require_pollingEndpointMessageOut();
    exports.PollingEndpointOutSerializer = {
      _fromJsonObject(object) {
        return {
          data: object["data"].map((item) => pollingEndpointMessageOut_1.PollingEndpointMessageOutSerializer._fromJsonObject(item)),
          done: object["done"],
          iterator: object["iterator"]
        };
      },
      _toJsonObject(self) {
        return {
          data: self.data.map((item) => pollingEndpointMessageOut_1.PollingEndpointMessageOutSerializer._toJsonObject(item)),
          done: self.done,
          iterator: self.iterator
        };
      }
    };
  }
});

// node_modules/svix/dist/api/messagePoller.js
var require_messagePoller = __commonJS({
  "node_modules/svix/dist/api/messagePoller.js"(exports) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    exports.MessagePoller = void 0;
    var pollingEndpointConsumerSeekIn_1 = require_pollingEndpointConsumerSeekIn();
    var pollingEndpointConsumerSeekOut_1 = require_pollingEndpointConsumerSeekOut();
    var pollingEndpointOut_1 = require_pollingEndpointOut();
    var request_1 = require_request();
    var MessagePoller = class {
      constructor(requestCtx) {
        this.requestCtx = requestCtx;
      }
      poll(appId, sinkId, options) {
        const request = new request_1.SvixRequest(request_1.HttpMethod.GET, "/api/v1/app/{app_id}/poller/{sink_id}");
        request.setPathParam("app_id", appId);
        request.setPathParam("sink_id", sinkId);
        request.setQueryParam("limit", options === null || options === void 0 ? void 0 : options.limit);
        request.setQueryParam("iterator", options === null || options === void 0 ? void 0 : options.iterator);
        request.setQueryParam("event_type", options === null || options === void 0 ? void 0 : options.eventType);
        request.setQueryParam("channel", options === null || options === void 0 ? void 0 : options.channel);
        request.setQueryParam("after", options === null || options === void 0 ? void 0 : options.after);
        return request.send(this.requestCtx, pollingEndpointOut_1.PollingEndpointOutSerializer._fromJsonObject);
      }
      consumerPoll(appId, sinkId, consumerId, options) {
        const request = new request_1.SvixRequest(request_1.HttpMethod.GET, "/api/v1/app/{app_id}/poller/{sink_id}/consumer/{consumer_id}");
        request.setPathParam("app_id", appId);
        request.setPathParam("sink_id", sinkId);
        request.setPathParam("consumer_id", consumerId);
        request.setQueryParam("limit", options === null || options === void 0 ? void 0 : options.limit);
        request.setQueryParam("iterator", options === null || options === void 0 ? void 0 : options.iterator);
        return request.send(this.requestCtx, pollingEndpointOut_1.PollingEndpointOutSerializer._fromJsonObject);
      }
      consumerSeek(appId, sinkId, consumerId, pollingEndpointConsumerSeekIn, options) {
        const request = new request_1.SvixRequest(request_1.HttpMethod.POST, "/api/v1/app/{app_id}/poller/{sink_id}/consumer/{consumer_id}/seek");
        request.setPathParam("app_id", appId);
        request.setPathParam("sink_id", sinkId);
        request.setPathParam("consumer_id", consumerId);
        request.setHeaderParam("idempotency-key", options === null || options === void 0 ? void 0 : options.idempotencyKey);
        request.setBody(pollingEndpointConsumerSeekIn_1.PollingEndpointConsumerSeekInSerializer._toJsonObject(pollingEndpointConsumerSeekIn));
        return request.send(this.requestCtx, pollingEndpointConsumerSeekOut_1.PollingEndpointConsumerSeekOutSerializer._fromJsonObject);
      }
    };
    exports.MessagePoller = MessagePoller;
  }
});

// node_modules/svix/dist/models/messageIn.js
var require_messageIn = __commonJS({
  "node_modules/svix/dist/models/messageIn.js"(exports) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    exports.MessageInSerializer = void 0;
    var applicationIn_1 = require_applicationIn();
    exports.MessageInSerializer = {
      _fromJsonObject(object) {
        return {
          application: object["application"] ? applicationIn_1.ApplicationInSerializer._fromJsonObject(object["application"]) : void 0,
          channels: object["channels"],
          eventId: object["eventId"],
          eventType: object["eventType"],
          payload: object["payload"],
          payloadRetentionHours: object["payloadRetentionHours"],
          payloadRetentionPeriod: object["payloadRetentionPeriod"],
          tags: object["tags"],
          transformationsParams: object["transformationsParams"]
        };
      },
      _toJsonObject(self) {
        return {
          application: self.application ? applicationIn_1.ApplicationInSerializer._toJsonObject(self.application) : void 0,
          channels: self.channels,
          eventId: self.eventId,
          eventType: self.eventType,
          payload: self.payload,
          payloadRetentionHours: self.payloadRetentionHours,
          payloadRetentionPeriod: self.payloadRetentionPeriod,
          tags: self.tags,
          transformationsParams: self.transformationsParams
        };
      }
    };
  }
});

// node_modules/svix/dist/api/message.js
var require_message = __commonJS({
  "node_modules/svix/dist/api/message.js"(exports) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    exports.messageInRaw = exports.Message = void 0;
    var expungeAllContentsOut_1 = require_expungeAllContentsOut();
    var listResponseMessageOut_1 = require_listResponseMessageOut();
    var messageOut_1 = require_messageOut();
    var messagePoller_1 = require_messagePoller();
    var request_1 = require_request();
    var messageIn_1 = require_messageIn();
    var Message = class {
      constructor(requestCtx) {
        this.requestCtx = requestCtx;
      }
      get poller() {
        return new messagePoller_1.MessagePoller(this.requestCtx);
      }
      list(appId, options) {
        const request = new request_1.SvixRequest(request_1.HttpMethod.GET, "/api/v1/app/{app_id}/msg");
        request.setPathParam("app_id", appId);
        request.setQueryParam("limit", options === null || options === void 0 ? void 0 : options.limit);
        request.setQueryParam("iterator", options === null || options === void 0 ? void 0 : options.iterator);
        request.setQueryParam("channel", options === null || options === void 0 ? void 0 : options.channel);
        request.setQueryParam("before", options === null || options === void 0 ? void 0 : options.before);
        request.setQueryParam("after", options === null || options === void 0 ? void 0 : options.after);
        request.setQueryParam("with_content", options === null || options === void 0 ? void 0 : options.withContent);
        request.setQueryParam("tag", options === null || options === void 0 ? void 0 : options.tag);
        request.setQueryParam("event_types", options === null || options === void 0 ? void 0 : options.eventTypes);
        return request.send(this.requestCtx, listResponseMessageOut_1.ListResponseMessageOutSerializer._fromJsonObject);
      }
      create(appId, messageIn, options) {
        const request = new request_1.SvixRequest(request_1.HttpMethod.POST, "/api/v1/app/{app_id}/msg");
        request.setPathParam("app_id", appId);
        request.setQueryParam("with_content", options === null || options === void 0 ? void 0 : options.withContent);
        request.setHeaderParam("idempotency-key", options === null || options === void 0 ? void 0 : options.idempotencyKey);
        request.setBody(messageIn_1.MessageInSerializer._toJsonObject(messageIn));
        return request.send(this.requestCtx, messageOut_1.MessageOutSerializer._fromJsonObject);
      }
      expungeAllContents(appId, options) {
        const request = new request_1.SvixRequest(request_1.HttpMethod.POST, "/api/v1/app/{app_id}/msg/expunge-all-contents");
        request.setPathParam("app_id", appId);
        request.setHeaderParam("idempotency-key", options === null || options === void 0 ? void 0 : options.idempotencyKey);
        return request.send(this.requestCtx, expungeAllContentsOut_1.ExpungeAllContentsOutSerializer._fromJsonObject);
      }
      get(appId, msgId, options) {
        const request = new request_1.SvixRequest(request_1.HttpMethod.GET, "/api/v1/app/{app_id}/msg/{msg_id}");
        request.setPathParam("app_id", appId);
        request.setPathParam("msg_id", msgId);
        request.setQueryParam("with_content", options === null || options === void 0 ? void 0 : options.withContent);
        return request.send(this.requestCtx, messageOut_1.MessageOutSerializer._fromJsonObject);
      }
      expungeContent(appId, msgId) {
        const request = new request_1.SvixRequest(request_1.HttpMethod.DELETE, "/api/v1/app/{app_id}/msg/{msg_id}/content");
        request.setPathParam("app_id", appId);
        request.setPathParam("msg_id", msgId);
        return request.sendNoResponseBody(this.requestCtx);
      }
    };
    exports.Message = Message;
    function messageInRaw(eventType, payload, contentType) {
      const headers = contentType ? { "content-type": contentType } : void 0;
      return {
        eventType,
        payload: {},
        transformationsParams: {
          rawPayload: payload,
          headers
        }
      };
    }
    exports.messageInRaw = messageInRaw;
  }
});

// node_modules/svix/dist/models/messageStatus.js
var require_messageStatus = __commonJS({
  "node_modules/svix/dist/models/messageStatus.js"(exports) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    exports.MessageStatusSerializer = exports.MessageStatus = void 0;
    var MessageStatus;
    (function(MessageStatus2) {
      MessageStatus2[MessageStatus2["Success"] = 0] = "Success";
      MessageStatus2[MessageStatus2["Pending"] = 1] = "Pending";
      MessageStatus2[MessageStatus2["Fail"] = 2] = "Fail";
      MessageStatus2[MessageStatus2["Sending"] = 3] = "Sending";
    })(MessageStatus = exports.MessageStatus || (exports.MessageStatus = {}));
    exports.MessageStatusSerializer = {
      _fromJsonObject(object) {
        return object;
      },
      _toJsonObject(self) {
        return self;
      }
    };
  }
});

// node_modules/svix/dist/models/messageStatusText.js
var require_messageStatusText = __commonJS({
  "node_modules/svix/dist/models/messageStatusText.js"(exports) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    exports.MessageStatusTextSerializer = exports.MessageStatusText = void 0;
    var MessageStatusText;
    (function(MessageStatusText2) {
      MessageStatusText2["Success"] = "success";
      MessageStatusText2["Pending"] = "pending";
      MessageStatusText2["Fail"] = "fail";
      MessageStatusText2["Sending"] = "sending";
    })(MessageStatusText = exports.MessageStatusText || (exports.MessageStatusText = {}));
    exports.MessageStatusTextSerializer = {
      _fromJsonObject(object) {
        return object;
      },
      _toJsonObject(self) {
        return self;
      }
    };
  }
});

// node_modules/svix/dist/models/endpointMessageOut.js
var require_endpointMessageOut = __commonJS({
  "node_modules/svix/dist/models/endpointMessageOut.js"(exports) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    exports.EndpointMessageOutSerializer = void 0;
    var messageStatus_1 = require_messageStatus();
    var messageStatusText_1 = require_messageStatusText();
    exports.EndpointMessageOutSerializer = {
      _fromJsonObject(object) {
        return {
          channels: object["channels"],
          eventId: object["eventId"],
          eventType: object["eventType"],
          id: object["id"],
          nextAttempt: object["nextAttempt"] ? new Date(object["nextAttempt"]) : null,
          payload: object["payload"],
          status: messageStatus_1.MessageStatusSerializer._fromJsonObject(object["status"]),
          statusText: messageStatusText_1.MessageStatusTextSerializer._fromJsonObject(object["statusText"]),
          tags: object["tags"],
          timestamp: new Date(object["timestamp"])
        };
      },
      _toJsonObject(self) {
        return {
          channels: self.channels,
          eventId: self.eventId,
          eventType: self.eventType,
          id: self.id,
          nextAttempt: self.nextAttempt,
          payload: self.payload,
          status: messageStatus_1.MessageStatusSerializer._toJsonObject(self.status),
          statusText: messageStatusText_1.MessageStatusTextSerializer._toJsonObject(self.statusText),
          tags: self.tags,
          timestamp: self.timestamp
        };
      }
    };
  }
});

// node_modules/svix/dist/models/listResponseEndpointMessageOut.js
var require_listResponseEndpointMessageOut = __commonJS({
  "node_modules/svix/dist/models/listResponseEndpointMessageOut.js"(exports) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    exports.ListResponseEndpointMessageOutSerializer = void 0;
    var endpointMessageOut_1 = require_endpointMessageOut();
    exports.ListResponseEndpointMessageOutSerializer = {
      _fromJsonObject(object) {
        return {
          data: object["data"].map((item) => endpointMessageOut_1.EndpointMessageOutSerializer._fromJsonObject(item)),
          done: object["done"],
          iterator: object["iterator"],
          prevIterator: object["prevIterator"]
        };
      },
      _toJsonObject(self) {
        return {
          data: self.data.map((item) => endpointMessageOut_1.EndpointMessageOutSerializer._toJsonObject(item)),
          done: self.done,
          iterator: self.iterator,
          prevIterator: self.prevIterator
        };
      }
    };
  }
});

// node_modules/svix/dist/models/messageAttemptTriggerType.js
var require_messageAttemptTriggerType = __commonJS({
  "node_modules/svix/dist/models/messageAttemptTriggerType.js"(exports) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    exports.MessageAttemptTriggerTypeSerializer = exports.MessageAttemptTriggerType = void 0;
    var MessageAttemptTriggerType;
    (function(MessageAttemptTriggerType2) {
      MessageAttemptTriggerType2[MessageAttemptTriggerType2["Scheduled"] = 0] = "Scheduled";
      MessageAttemptTriggerType2[MessageAttemptTriggerType2["Manual"] = 1] = "Manual";
    })(MessageAttemptTriggerType = exports.MessageAttemptTriggerType || (exports.MessageAttemptTriggerType = {}));
    exports.MessageAttemptTriggerTypeSerializer = {
      _fromJsonObject(object) {
        return object;
      },
      _toJsonObject(self) {
        return self;
      }
    };
  }
});

// node_modules/svix/dist/models/messageAttemptOut.js
var require_messageAttemptOut = __commonJS({
  "node_modules/svix/dist/models/messageAttemptOut.js"(exports) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    exports.MessageAttemptOutSerializer = void 0;
    var messageAttemptTriggerType_1 = require_messageAttemptTriggerType();
    var messageOut_1 = require_messageOut();
    var messageStatus_1 = require_messageStatus();
    var messageStatusText_1 = require_messageStatusText();
    exports.MessageAttemptOutSerializer = {
      _fromJsonObject(object) {
        return {
          endpointId: object["endpointId"],
          id: object["id"],
          msg: object["msg"] ? messageOut_1.MessageOutSerializer._fromJsonObject(object["msg"]) : void 0,
          msgId: object["msgId"],
          response: object["response"],
          responseDurationMs: object["responseDurationMs"],
          responseStatusCode: object["responseStatusCode"],
          status: messageStatus_1.MessageStatusSerializer._fromJsonObject(object["status"]),
          statusText: messageStatusText_1.MessageStatusTextSerializer._fromJsonObject(object["statusText"]),
          timestamp: new Date(object["timestamp"]),
          triggerType: messageAttemptTriggerType_1.MessageAttemptTriggerTypeSerializer._fromJsonObject(object["triggerType"]),
          url: object["url"]
        };
      },
      _toJsonObject(self) {
        return {
          endpointId: self.endpointId,
          id: self.id,
          msg: self.msg ? messageOut_1.MessageOutSerializer._toJsonObject(self.msg) : void 0,
          msgId: self.msgId,
          response: self.response,
          responseDurationMs: self.responseDurationMs,
          responseStatusCode: self.responseStatusCode,
          status: messageStatus_1.MessageStatusSerializer._toJsonObject(self.status),
          statusText: messageStatusText_1.MessageStatusTextSerializer._toJsonObject(self.statusText),
          timestamp: self.timestamp,
          triggerType: messageAttemptTriggerType_1.MessageAttemptTriggerTypeSerializer._toJsonObject(self.triggerType),
          url: self.url
        };
      }
    };
  }
});

// node_modules/svix/dist/models/listResponseMessageAttemptOut.js
var require_listResponseMessageAttemptOut = __commonJS({
  "node_modules/svix/dist/models/listResponseMessageAttemptOut.js"(exports) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    exports.ListResponseMessageAttemptOutSerializer = void 0;
    var messageAttemptOut_1 = require_messageAttemptOut();
    exports.ListResponseMessageAttemptOutSerializer = {
      _fromJsonObject(object) {
        return {
          data: object["data"].map((item) => messageAttemptOut_1.MessageAttemptOutSerializer._fromJsonObject(item)),
          done: object["done"],
          iterator: object["iterator"],
          prevIterator: object["prevIterator"]
        };
      },
      _toJsonObject(self) {
        return {
          data: self.data.map((item) => messageAttemptOut_1.MessageAttemptOutSerializer._toJsonObject(item)),
          done: self.done,
          iterator: self.iterator,
          prevIterator: self.prevIterator
        };
      }
    };
  }
});

// node_modules/svix/dist/models/messageEndpointOut.js
var require_messageEndpointOut = __commonJS({
  "node_modules/svix/dist/models/messageEndpointOut.js"(exports) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    exports.MessageEndpointOutSerializer = void 0;
    var messageStatus_1 = require_messageStatus();
    var messageStatusText_1 = require_messageStatusText();
    exports.MessageEndpointOutSerializer = {
      _fromJsonObject(object) {
        return {
          channels: object["channels"],
          createdAt: new Date(object["createdAt"]),
          description: object["description"],
          disabled: object["disabled"],
          filterTypes: object["filterTypes"],
          id: object["id"],
          nextAttempt: object["nextAttempt"] ? new Date(object["nextAttempt"]) : null,
          rateLimit: object["rateLimit"],
          status: messageStatus_1.MessageStatusSerializer._fromJsonObject(object["status"]),
          statusText: messageStatusText_1.MessageStatusTextSerializer._fromJsonObject(object["statusText"]),
          uid: object["uid"],
          updatedAt: new Date(object["updatedAt"]),
          url: object["url"],
          version: object["version"]
        };
      },
      _toJsonObject(self) {
        return {
          channels: self.channels,
          createdAt: self.createdAt,
          description: self.description,
          disabled: self.disabled,
          filterTypes: self.filterTypes,
          id: self.id,
          nextAttempt: self.nextAttempt,
          rateLimit: self.rateLimit,
          status: messageStatus_1.MessageStatusSerializer._toJsonObject(self.status),
          statusText: messageStatusText_1.MessageStatusTextSerializer._toJsonObject(self.statusText),
          uid: self.uid,
          updatedAt: self.updatedAt,
          url: self.url,
          version: self.version
        };
      }
    };
  }
});

// node_modules/svix/dist/models/listResponseMessageEndpointOut.js
var require_listResponseMessageEndpointOut = __commonJS({
  "node_modules/svix/dist/models/listResponseMessageEndpointOut.js"(exports) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    exports.ListResponseMessageEndpointOutSerializer = void 0;
    var messageEndpointOut_1 = require_messageEndpointOut();
    exports.ListResponseMessageEndpointOutSerializer = {
      _fromJsonObject(object) {
        return {
          data: object["data"].map((item) => messageEndpointOut_1.MessageEndpointOutSerializer._fromJsonObject(item)),
          done: object["done"],
          iterator: object["iterator"],
          prevIterator: object["prevIterator"]
        };
      },
      _toJsonObject(self) {
        return {
          data: self.data.map((item) => messageEndpointOut_1.MessageEndpointOutSerializer._toJsonObject(item)),
          done: self.done,
          iterator: self.iterator,
          prevIterator: self.prevIterator
        };
      }
    };
  }
});

// node_modules/svix/dist/api/messageAttempt.js
var require_messageAttempt = __commonJS({
  "node_modules/svix/dist/api/messageAttempt.js"(exports) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    exports.MessageAttempt = void 0;
    var listResponseEndpointMessageOut_1 = require_listResponseEndpointMessageOut();
    var listResponseMessageAttemptOut_1 = require_listResponseMessageAttemptOut();
    var listResponseMessageEndpointOut_1 = require_listResponseMessageEndpointOut();
    var messageAttemptOut_1 = require_messageAttemptOut();
    var request_1 = require_request();
    var MessageAttempt = class {
      constructor(requestCtx) {
        this.requestCtx = requestCtx;
      }
      listByEndpoint(appId, endpointId, options) {
        const request = new request_1.SvixRequest(request_1.HttpMethod.GET, "/api/v1/app/{app_id}/attempt/endpoint/{endpoint_id}");
        request.setPathParam("app_id", appId);
        request.setPathParam("endpoint_id", endpointId);
        request.setQueryParam("limit", options === null || options === void 0 ? void 0 : options.limit);
        request.setQueryParam("iterator", options === null || options === void 0 ? void 0 : options.iterator);
        request.setQueryParam("status", options === null || options === void 0 ? void 0 : options.status);
        request.setQueryParam("status_code_class", options === null || options === void 0 ? void 0 : options.statusCodeClass);
        request.setQueryParam("channel", options === null || options === void 0 ? void 0 : options.channel);
        request.setQueryParam("tag", options === null || options === void 0 ? void 0 : options.tag);
        request.setQueryParam("before", options === null || options === void 0 ? void 0 : options.before);
        request.setQueryParam("after", options === null || options === void 0 ? void 0 : options.after);
        request.setQueryParam("with_content", options === null || options === void 0 ? void 0 : options.withContent);
        request.setQueryParam("with_msg", options === null || options === void 0 ? void 0 : options.withMsg);
        request.setQueryParam("event_types", options === null || options === void 0 ? void 0 : options.eventTypes);
        return request.send(this.requestCtx, listResponseMessageAttemptOut_1.ListResponseMessageAttemptOutSerializer._fromJsonObject);
      }
      listByMsg(appId, msgId, options) {
        const request = new request_1.SvixRequest(request_1.HttpMethod.GET, "/api/v1/app/{app_id}/attempt/msg/{msg_id}");
        request.setPathParam("app_id", appId);
        request.setPathParam("msg_id", msgId);
        request.setQueryParam("limit", options === null || options === void 0 ? void 0 : options.limit);
        request.setQueryParam("iterator", options === null || options === void 0 ? void 0 : options.iterator);
        request.setQueryParam("status", options === null || options === void 0 ? void 0 : options.status);
        request.setQueryParam("status_code_class", options === null || options === void 0 ? void 0 : options.statusCodeClass);
        request.setQueryParam("channel", options === null || options === void 0 ? void 0 : options.channel);
        request.setQueryParam("tag", options === null || options === void 0 ? void 0 : options.tag);
        request.setQueryParam("endpoint_id", options === null || options === void 0 ? void 0 : options.endpointId);
        request.setQueryParam("before", options === null || options === void 0 ? void 0 : options.before);
        request.setQueryParam("after", options === null || options === void 0 ? void 0 : options.after);
        request.setQueryParam("with_content", options === null || options === void 0 ? void 0 : options.withContent);
        request.setQueryParam("event_types", options === null || options === void 0 ? void 0 : options.eventTypes);
        return request.send(this.requestCtx, listResponseMessageAttemptOut_1.ListResponseMessageAttemptOutSerializer._fromJsonObject);
      }
      listAttemptedMessages(appId, endpointId, options) {
        const request = new request_1.SvixRequest(request_1.HttpMethod.GET, "/api/v1/app/{app_id}/endpoint/{endpoint_id}/msg");
        request.setPathParam("app_id", appId);
        request.setPathParam("endpoint_id", endpointId);
        request.setQueryParam("limit", options === null || options === void 0 ? void 0 : options.limit);
        request.setQueryParam("iterator", options === null || options === void 0 ? void 0 : options.iterator);
        request.setQueryParam("channel", options === null || options === void 0 ? void 0 : options.channel);
        request.setQueryParam("tag", options === null || options === void 0 ? void 0 : options.tag);
        request.setQueryParam("status", options === null || options === void 0 ? void 0 : options.status);
        request.setQueryParam("before", options === null || options === void 0 ? void 0 : options.before);
        request.setQueryParam("after", options === null || options === void 0 ? void 0 : options.after);
        request.setQueryParam("with_content", options === null || options === void 0 ? void 0 : options.withContent);
        request.setQueryParam("event_types", options === null || options === void 0 ? void 0 : options.eventTypes);
        return request.send(this.requestCtx, listResponseEndpointMessageOut_1.ListResponseEndpointMessageOutSerializer._fromJsonObject);
      }
      get(appId, msgId, attemptId) {
        const request = new request_1.SvixRequest(request_1.HttpMethod.GET, "/api/v1/app/{app_id}/msg/{msg_id}/attempt/{attempt_id}");
        request.setPathParam("app_id", appId);
        request.setPathParam("msg_id", msgId);
        request.setPathParam("attempt_id", attemptId);
        return request.send(this.requestCtx, messageAttemptOut_1.MessageAttemptOutSerializer._fromJsonObject);
      }
      expungeContent(appId, msgId, attemptId) {
        const request = new request_1.SvixRequest(request_1.HttpMethod.DELETE, "/api/v1/app/{app_id}/msg/{msg_id}/attempt/{attempt_id}/content");
        request.setPathParam("app_id", appId);
        request.setPathParam("msg_id", msgId);
        request.setPathParam("attempt_id", attemptId);
        return request.sendNoResponseBody(this.requestCtx);
      }
      listAttemptedDestinations(appId, msgId, options) {
        const request = new request_1.SvixRequest(request_1.HttpMethod.GET, "/api/v1/app/{app_id}/msg/{msg_id}/endpoint");
        request.setPathParam("app_id", appId);
        request.setPathParam("msg_id", msgId);
        request.setQueryParam("limit", options === null || options === void 0 ? void 0 : options.limit);
        request.setQueryParam("iterator", options === null || options === void 0 ? void 0 : options.iterator);
        return request.send(this.requestCtx, listResponseMessageEndpointOut_1.ListResponseMessageEndpointOutSerializer._fromJsonObject);
      }
      resend(appId, msgId, endpointId, options) {
        const request = new request_1.SvixRequest(request_1.HttpMethod.POST, "/api/v1/app/{app_id}/msg/{msg_id}/endpoint/{endpoint_id}/resend");
        request.setPathParam("app_id", appId);
        request.setPathParam("msg_id", msgId);
        request.setPathParam("endpoint_id", endpointId);
        request.setHeaderParam("idempotency-key", options === null || options === void 0 ? void 0 : options.idempotencyKey);
        return request.sendNoResponseBody(this.requestCtx);
      }
    };
    exports.MessageAttempt = MessageAttempt;
  }
});

// node_modules/svix/dist/models/operationalWebhookEndpointOut.js
var require_operationalWebhookEndpointOut = __commonJS({
  "node_modules/svix/dist/models/operationalWebhookEndpointOut.js"(exports) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    exports.OperationalWebhookEndpointOutSerializer = void 0;
    exports.OperationalWebhookEndpointOutSerializer = {
      _fromJsonObject(object) {
        return {
          createdAt: new Date(object["createdAt"]),
          description: object["description"],
          disabled: object["disabled"],
          filterTypes: object["filterTypes"],
          id: object["id"],
          metadata: object["metadata"],
          rateLimit: object["rateLimit"],
          uid: object["uid"],
          updatedAt: new Date(object["updatedAt"]),
          url: object["url"]
        };
      },
      _toJsonObject(self) {
        return {
          createdAt: self.createdAt,
          description: self.description,
          disabled: self.disabled,
          filterTypes: self.filterTypes,
          id: self.id,
          metadata: self.metadata,
          rateLimit: self.rateLimit,
          uid: self.uid,
          updatedAt: self.updatedAt,
          url: self.url
        };
      }
    };
  }
});

// node_modules/svix/dist/models/listResponseOperationalWebhookEndpointOut.js
var require_listResponseOperationalWebhookEndpointOut = __commonJS({
  "node_modules/svix/dist/models/listResponseOperationalWebhookEndpointOut.js"(exports) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    exports.ListResponseOperationalWebhookEndpointOutSerializer = void 0;
    var operationalWebhookEndpointOut_1 = require_operationalWebhookEndpointOut();
    exports.ListResponseOperationalWebhookEndpointOutSerializer = {
      _fromJsonObject(object) {
        return {
          data: object["data"].map((item) => operationalWebhookEndpointOut_1.OperationalWebhookEndpointOutSerializer._fromJsonObject(item)),
          done: object["done"],
          iterator: object["iterator"],
          prevIterator: object["prevIterator"]
        };
      },
      _toJsonObject(self) {
        return {
          data: self.data.map((item) => operationalWebhookEndpointOut_1.OperationalWebhookEndpointOutSerializer._toJsonObject(item)),
          done: self.done,
          iterator: self.iterator,
          prevIterator: self.prevIterator
        };
      }
    };
  }
});

// node_modules/svix/dist/models/operationalWebhookEndpointHeadersIn.js
var require_operationalWebhookEndpointHeadersIn = __commonJS({
  "node_modules/svix/dist/models/operationalWebhookEndpointHeadersIn.js"(exports) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    exports.OperationalWebhookEndpointHeadersInSerializer = void 0;
    exports.OperationalWebhookEndpointHeadersInSerializer = {
      _fromJsonObject(object) {
        return {
          headers: object["headers"]
        };
      },
      _toJsonObject(self) {
        return {
          headers: self.headers
        };
      }
    };
  }
});

// node_modules/svix/dist/models/operationalWebhookEndpointHeadersOut.js
var require_operationalWebhookEndpointHeadersOut = __commonJS({
  "node_modules/svix/dist/models/operationalWebhookEndpointHeadersOut.js"(exports) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    exports.OperationalWebhookEndpointHeadersOutSerializer = void 0;
    exports.OperationalWebhookEndpointHeadersOutSerializer = {
      _fromJsonObject(object) {
        return {
          headers: object["headers"],
          sensitive: object["sensitive"]
        };
      },
      _toJsonObject(self) {
        return {
          headers: self.headers,
          sensitive: self.sensitive
        };
      }
    };
  }
});

// node_modules/svix/dist/models/operationalWebhookEndpointIn.js
var require_operationalWebhookEndpointIn = __commonJS({
  "node_modules/svix/dist/models/operationalWebhookEndpointIn.js"(exports) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    exports.OperationalWebhookEndpointInSerializer = void 0;
    exports.OperationalWebhookEndpointInSerializer = {
      _fromJsonObject(object) {
        return {
          description: object["description"],
          disabled: object["disabled"],
          filterTypes: object["filterTypes"],
          metadata: object["metadata"],
          rateLimit: object["rateLimit"],
          secret: object["secret"],
          uid: object["uid"],
          url: object["url"]
        };
      },
      _toJsonObject(self) {
        return {
          description: self.description,
          disabled: self.disabled,
          filterTypes: self.filterTypes,
          metadata: self.metadata,
          rateLimit: self.rateLimit,
          secret: self.secret,
          uid: self.uid,
          url: self.url
        };
      }
    };
  }
});

// node_modules/svix/dist/models/operationalWebhookEndpointSecretIn.js
var require_operationalWebhookEndpointSecretIn = __commonJS({
  "node_modules/svix/dist/models/operationalWebhookEndpointSecretIn.js"(exports) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    exports.OperationalWebhookEndpointSecretInSerializer = void 0;
    exports.OperationalWebhookEndpointSecretInSerializer = {
      _fromJsonObject(object) {
        return {
          key: object["key"]
        };
      },
      _toJsonObject(self) {
        return {
          key: self.key
        };
      }
    };
  }
});

// node_modules/svix/dist/models/operationalWebhookEndpointSecretOut.js
var require_operationalWebhookEndpointSecretOut = __commonJS({
  "node_modules/svix/dist/models/operationalWebhookEndpointSecretOut.js"(exports) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    exports.OperationalWebhookEndpointSecretOutSerializer = void 0;
    exports.OperationalWebhookEndpointSecretOutSerializer = {
      _fromJsonObject(object) {
        return {
          key: object["key"]
        };
      },
      _toJsonObject(self) {
        return {
          key: self.key
        };
      }
    };
  }
});

// node_modules/svix/dist/models/operationalWebhookEndpointUpdate.js
var require_operationalWebhookEndpointUpdate = __commonJS({
  "node_modules/svix/dist/models/operationalWebhookEndpointUpdate.js"(exports) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    exports.OperationalWebhookEndpointUpdateSerializer = void 0;
    exports.OperationalWebhookEndpointUpdateSerializer = {
      _fromJsonObject(object) {
        return {
          description: object["description"],
          disabled: object["disabled"],
          filterTypes: object["filterTypes"],
          metadata: object["metadata"],
          rateLimit: object["rateLimit"],
          uid: object["uid"],
          url: object["url"]
        };
      },
      _toJsonObject(self) {
        return {
          description: self.description,
          disabled: self.disabled,
          filterTypes: self.filterTypes,
          metadata: self.metadata,
          rateLimit: self.rateLimit,
          uid: self.uid,
          url: self.url
        };
      }
    };
  }
});

// node_modules/svix/dist/api/operationalWebhookEndpoint.js
var require_operationalWebhookEndpoint = __commonJS({
  "node_modules/svix/dist/api/operationalWebhookEndpoint.js"(exports) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    exports.OperationalWebhookEndpoint = void 0;
    var listResponseOperationalWebhookEndpointOut_1 = require_listResponseOperationalWebhookEndpointOut();
    var operationalWebhookEndpointHeadersIn_1 = require_operationalWebhookEndpointHeadersIn();
    var operationalWebhookEndpointHeadersOut_1 = require_operationalWebhookEndpointHeadersOut();
    var operationalWebhookEndpointIn_1 = require_operationalWebhookEndpointIn();
    var operationalWebhookEndpointOut_1 = require_operationalWebhookEndpointOut();
    var operationalWebhookEndpointSecretIn_1 = require_operationalWebhookEndpointSecretIn();
    var operationalWebhookEndpointSecretOut_1 = require_operationalWebhookEndpointSecretOut();
    var operationalWebhookEndpointUpdate_1 = require_operationalWebhookEndpointUpdate();
    var request_1 = require_request();
    var OperationalWebhookEndpoint = class {
      constructor(requestCtx) {
        this.requestCtx = requestCtx;
      }
      list(options) {
        const request = new request_1.SvixRequest(request_1.HttpMethod.GET, "/api/v1/operational-webhook/endpoint");
        request.setQueryParam("limit", options === null || options === void 0 ? void 0 : options.limit);
        request.setQueryParam("iterator", options === null || options === void 0 ? void 0 : options.iterator);
        request.setQueryParam("order", options === null || options === void 0 ? void 0 : options.order);
        return request.send(this.requestCtx, listResponseOperationalWebhookEndpointOut_1.ListResponseOperationalWebhookEndpointOutSerializer._fromJsonObject);
      }
      create(operationalWebhookEndpointIn, options) {
        const request = new request_1.SvixRequest(request_1.HttpMethod.POST, "/api/v1/operational-webhook/endpoint");
        request.setHeaderParam("idempotency-key", options === null || options === void 0 ? void 0 : options.idempotencyKey);
        request.setBody(operationalWebhookEndpointIn_1.OperationalWebhookEndpointInSerializer._toJsonObject(operationalWebhookEndpointIn));
        return request.send(this.requestCtx, operationalWebhookEndpointOut_1.OperationalWebhookEndpointOutSerializer._fromJsonObject);
      }
      get(endpointId) {
        const request = new request_1.SvixRequest(request_1.HttpMethod.GET, "/api/v1/operational-webhook/endpoint/{endpoint_id}");
        request.setPathParam("endpoint_id", endpointId);
        return request.send(this.requestCtx, operationalWebhookEndpointOut_1.OperationalWebhookEndpointOutSerializer._fromJsonObject);
      }
      update(endpointId, operationalWebhookEndpointUpdate) {
        const request = new request_1.SvixRequest(request_1.HttpMethod.PUT, "/api/v1/operational-webhook/endpoint/{endpoint_id}");
        request.setPathParam("endpoint_id", endpointId);
        request.setBody(operationalWebhookEndpointUpdate_1.OperationalWebhookEndpointUpdateSerializer._toJsonObject(operationalWebhookEndpointUpdate));
        return request.send(this.requestCtx, operationalWebhookEndpointOut_1.OperationalWebhookEndpointOutSerializer._fromJsonObject);
      }
      delete(endpointId) {
        const request = new request_1.SvixRequest(request_1.HttpMethod.DELETE, "/api/v1/operational-webhook/endpoint/{endpoint_id}");
        request.setPathParam("endpoint_id", endpointId);
        return request.sendNoResponseBody(this.requestCtx);
      }
      getHeaders(endpointId) {
        const request = new request_1.SvixRequest(request_1.HttpMethod.GET, "/api/v1/operational-webhook/endpoint/{endpoint_id}/headers");
        request.setPathParam("endpoint_id", endpointId);
        return request.send(this.requestCtx, operationalWebhookEndpointHeadersOut_1.OperationalWebhookEndpointHeadersOutSerializer._fromJsonObject);
      }
      updateHeaders(endpointId, operationalWebhookEndpointHeadersIn) {
        const request = new request_1.SvixRequest(request_1.HttpMethod.PUT, "/api/v1/operational-webhook/endpoint/{endpoint_id}/headers");
        request.setPathParam("endpoint_id", endpointId);
        request.setBody(operationalWebhookEndpointHeadersIn_1.OperationalWebhookEndpointHeadersInSerializer._toJsonObject(operationalWebhookEndpointHeadersIn));
        return request.sendNoResponseBody(this.requestCtx);
      }
      getSecret(endpointId) {
        const request = new request_1.SvixRequest(request_1.HttpMethod.GET, "/api/v1/operational-webhook/endpoint/{endpoint_id}/secret");
        request.setPathParam("endpoint_id", endpointId);
        return request.send(this.requestCtx, operationalWebhookEndpointSecretOut_1.OperationalWebhookEndpointSecretOutSerializer._fromJsonObject);
      }
      rotateSecret(endpointId, operationalWebhookEndpointSecretIn, options) {
        const request = new request_1.SvixRequest(request_1.HttpMethod.POST, "/api/v1/operational-webhook/endpoint/{endpoint_id}/secret/rotate");
        request.setPathParam("endpoint_id", endpointId);
        request.setHeaderParam("idempotency-key", options === null || options === void 0 ? void 0 : options.idempotencyKey);
        request.setBody(operationalWebhookEndpointSecretIn_1.OperationalWebhookEndpointSecretInSerializer._toJsonObject(operationalWebhookEndpointSecretIn));
        return request.sendNoResponseBody(this.requestCtx);
      }
    };
    exports.OperationalWebhookEndpoint = OperationalWebhookEndpoint;
  }
});

// node_modules/svix/dist/api/operationalWebhook.js
var require_operationalWebhook = __commonJS({
  "node_modules/svix/dist/api/operationalWebhook.js"(exports) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    exports.OperationalWebhook = void 0;
    var operationalWebhookEndpoint_1 = require_operationalWebhookEndpoint();
    var OperationalWebhook = class {
      constructor(requestCtx) {
        this.requestCtx = requestCtx;
      }
      get endpoint() {
        return new operationalWebhookEndpoint_1.OperationalWebhookEndpoint(this.requestCtx);
      }
    };
    exports.OperationalWebhook = OperationalWebhook;
  }
});

// node_modules/svix/dist/models/aggregateEventTypesOut.js
var require_aggregateEventTypesOut = __commonJS({
  "node_modules/svix/dist/models/aggregateEventTypesOut.js"(exports) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    exports.AggregateEventTypesOutSerializer = void 0;
    var backgroundTaskStatus_1 = require_backgroundTaskStatus();
    var backgroundTaskType_1 = require_backgroundTaskType();
    exports.AggregateEventTypesOutSerializer = {
      _fromJsonObject(object) {
        return {
          id: object["id"],
          status: backgroundTaskStatus_1.BackgroundTaskStatusSerializer._fromJsonObject(object["status"]),
          task: backgroundTaskType_1.BackgroundTaskTypeSerializer._fromJsonObject(object["task"])
        };
      },
      _toJsonObject(self) {
        return {
          id: self.id,
          status: backgroundTaskStatus_1.BackgroundTaskStatusSerializer._toJsonObject(self.status),
          task: backgroundTaskType_1.BackgroundTaskTypeSerializer._toJsonObject(self.task)
        };
      }
    };
  }
});

// node_modules/svix/dist/models/appUsageStatsIn.js
var require_appUsageStatsIn = __commonJS({
  "node_modules/svix/dist/models/appUsageStatsIn.js"(exports) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    exports.AppUsageStatsInSerializer = void 0;
    exports.AppUsageStatsInSerializer = {
      _fromJsonObject(object) {
        return {
          appIds: object["appIds"],
          since: new Date(object["since"]),
          until: new Date(object["until"])
        };
      },
      _toJsonObject(self) {
        return {
          appIds: self.appIds,
          since: self.since,
          until: self.until
        };
      }
    };
  }
});

// node_modules/svix/dist/models/appUsageStatsOut.js
var require_appUsageStatsOut = __commonJS({
  "node_modules/svix/dist/models/appUsageStatsOut.js"(exports) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    exports.AppUsageStatsOutSerializer = void 0;
    var backgroundTaskStatus_1 = require_backgroundTaskStatus();
    var backgroundTaskType_1 = require_backgroundTaskType();
    exports.AppUsageStatsOutSerializer = {
      _fromJsonObject(object) {
        return {
          id: object["id"],
          status: backgroundTaskStatus_1.BackgroundTaskStatusSerializer._fromJsonObject(object["status"]),
          task: backgroundTaskType_1.BackgroundTaskTypeSerializer._fromJsonObject(object["task"]),
          unresolvedAppIds: object["unresolvedAppIds"]
        };
      },
      _toJsonObject(self) {
        return {
          id: self.id,
          status: backgroundTaskStatus_1.BackgroundTaskStatusSerializer._toJsonObject(self.status),
          task: backgroundTaskType_1.BackgroundTaskTypeSerializer._toJsonObject(self.task),
          unresolvedAppIds: self.unresolvedAppIds
        };
      }
    };
  }
});

// node_modules/svix/dist/api/statistics.js
var require_statistics = __commonJS({
  "node_modules/svix/dist/api/statistics.js"(exports) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    exports.Statistics = void 0;
    var aggregateEventTypesOut_1 = require_aggregateEventTypesOut();
    var appUsageStatsIn_1 = require_appUsageStatsIn();
    var appUsageStatsOut_1 = require_appUsageStatsOut();
    var request_1 = require_request();
    var Statistics = class {
      constructor(requestCtx) {
        this.requestCtx = requestCtx;
      }
      aggregateAppStats(appUsageStatsIn, options) {
        const request = new request_1.SvixRequest(request_1.HttpMethod.POST, "/api/v1/stats/usage/app");
        request.setHeaderParam("idempotency-key", options === null || options === void 0 ? void 0 : options.idempotencyKey);
        request.setBody(appUsageStatsIn_1.AppUsageStatsInSerializer._toJsonObject(appUsageStatsIn));
        return request.send(this.requestCtx, appUsageStatsOut_1.AppUsageStatsOutSerializer._fromJsonObject);
      }
      aggregateEventTypes() {
        const request = new request_1.SvixRequest(request_1.HttpMethod.PUT, "/api/v1/stats/usage/event-types");
        return request.send(this.requestCtx, aggregateEventTypesOut_1.AggregateEventTypesOutSerializer._fromJsonObject);
      }
    };
    exports.Statistics = Statistics;
  }
});

// node_modules/svix/dist/HttpErrors.js
var require_HttpErrors = __commonJS({
  "node_modules/svix/dist/HttpErrors.js"(exports) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    exports.HTTPValidationError = exports.ValidationError = exports.HttpErrorOut = void 0;
    var HttpErrorOut = class _HttpErrorOut {
      static getAttributeTypeMap() {
        return _HttpErrorOut.attributeTypeMap;
      }
    };
    exports.HttpErrorOut = HttpErrorOut;
    HttpErrorOut.discriminator = void 0;
    HttpErrorOut.mapping = void 0;
    HttpErrorOut.attributeTypeMap = [
      {
        name: "code",
        baseName: "code",
        type: "string",
        format: ""
      },
      {
        name: "detail",
        baseName: "detail",
        type: "string",
        format: ""
      }
    ];
    var ValidationError = class _ValidationError {
      static getAttributeTypeMap() {
        return _ValidationError.attributeTypeMap;
      }
    };
    exports.ValidationError = ValidationError;
    ValidationError.discriminator = void 0;
    ValidationError.mapping = void 0;
    ValidationError.attributeTypeMap = [
      {
        name: "loc",
        baseName: "loc",
        type: "Array<string>",
        format: ""
      },
      {
        name: "msg",
        baseName: "msg",
        type: "string",
        format: ""
      },
      {
        name: "type",
        baseName: "type",
        type: "string",
        format: ""
      }
    ];
    var HTTPValidationError = class _HTTPValidationError {
      static getAttributeTypeMap() {
        return _HTTPValidationError.attributeTypeMap;
      }
    };
    exports.HTTPValidationError = HTTPValidationError;
    HTTPValidationError.discriminator = void 0;
    HTTPValidationError.mapping = void 0;
    HTTPValidationError.attributeTypeMap = [
      {
        name: "detail",
        baseName: "detail",
        type: "Array<ValidationError>",
        format: ""
      }
    ];
  }
});

// node_modules/svix/dist/timing_safe_equal.js
var require_timing_safe_equal = __commonJS({
  "node_modules/svix/dist/timing_safe_equal.js"(exports) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    exports.timingSafeEqual = void 0;
    function assert(expr, msg = "") {
      if (!expr) {
        throw new Error(msg);
      }
    }
    function timingSafeEqual2(a, b) {
      if (a.byteLength !== b.byteLength) {
        return false;
      }
      if (!(a instanceof DataView)) {
        a = new DataView(ArrayBuffer.isView(a) ? a.buffer : a);
      }
      if (!(b instanceof DataView)) {
        b = new DataView(ArrayBuffer.isView(b) ? b.buffer : b);
      }
      assert(a instanceof DataView);
      assert(b instanceof DataView);
      const length = a.byteLength;
      let out = 0;
      let i = -1;
      while (++i < length) {
        out |= a.getUint8(i) ^ b.getUint8(i);
      }
      return out === 0;
    }
    exports.timingSafeEqual = timingSafeEqual2;
  }
});

// node_modules/@stablelib/base64/lib/base64.js
var require_base64 = __commonJS({
  "node_modules/@stablelib/base64/lib/base64.js"(exports) {
    "use strict";
    var __extends = exports && exports.__extends || /* @__PURE__ */ (function() {
      var extendStatics = function(d, b) {
        extendStatics = Object.setPrototypeOf || { __proto__: [] } instanceof Array && function(d2, b2) {
          d2.__proto__ = b2;
        } || function(d2, b2) {
          for (var p in b2) if (b2.hasOwnProperty(p)) d2[p] = b2[p];
        };
        return extendStatics(d, b);
      };
      return function(d, b) {
        extendStatics(d, b);
        function __() {
          this.constructor = d;
        }
        d.prototype = b === null ? Object.create(b) : (__.prototype = b.prototype, new __());
      };
    })();
    Object.defineProperty(exports, "__esModule", { value: true });
    var INVALID_BYTE = 256;
    var Coder = (
      /** @class */
      (function() {
        function Coder2(_paddingCharacter) {
          if (_paddingCharacter === void 0) {
            _paddingCharacter = "=";
          }
          this._paddingCharacter = _paddingCharacter;
        }
        Coder2.prototype.encodedLength = function(length) {
          if (!this._paddingCharacter) {
            return (length * 8 + 5) / 6 | 0;
          }
          return (length + 2) / 3 * 4 | 0;
        };
        Coder2.prototype.encode = function(data) {
          var out = "";
          var i = 0;
          for (; i < data.length - 2; i += 3) {
            var c = data[i] << 16 | data[i + 1] << 8 | data[i + 2];
            out += this._encodeByte(c >>> 3 * 6 & 63);
            out += this._encodeByte(c >>> 2 * 6 & 63);
            out += this._encodeByte(c >>> 1 * 6 & 63);
            out += this._encodeByte(c >>> 0 * 6 & 63);
          }
          var left = data.length - i;
          if (left > 0) {
            var c = data[i] << 16 | (left === 2 ? data[i + 1] << 8 : 0);
            out += this._encodeByte(c >>> 3 * 6 & 63);
            out += this._encodeByte(c >>> 2 * 6 & 63);
            if (left === 2) {
              out += this._encodeByte(c >>> 1 * 6 & 63);
            } else {
              out += this._paddingCharacter || "";
            }
            out += this._paddingCharacter || "";
          }
          return out;
        };
        Coder2.prototype.maxDecodedLength = function(length) {
          if (!this._paddingCharacter) {
            return (length * 6 + 7) / 8 | 0;
          }
          return length / 4 * 3 | 0;
        };
        Coder2.prototype.decodedLength = function(s) {
          return this.maxDecodedLength(s.length - this._getPaddingLength(s));
        };
        Coder2.prototype.decode = function(s) {
          if (s.length === 0) {
            return new Uint8Array(0);
          }
          var paddingLength = this._getPaddingLength(s);
          var length = s.length - paddingLength;
          var out = new Uint8Array(this.maxDecodedLength(length));
          var op = 0;
          var i = 0;
          var haveBad = 0;
          var v0 = 0, v12 = 0, v2 = 0, v32 = 0;
          for (; i < length - 4; i += 4) {
            v0 = this._decodeChar(s.charCodeAt(i + 0));
            v12 = this._decodeChar(s.charCodeAt(i + 1));
            v2 = this._decodeChar(s.charCodeAt(i + 2));
            v32 = this._decodeChar(s.charCodeAt(i + 3));
            out[op++] = v0 << 2 | v12 >>> 4;
            out[op++] = v12 << 4 | v2 >>> 2;
            out[op++] = v2 << 6 | v32;
            haveBad |= v0 & INVALID_BYTE;
            haveBad |= v12 & INVALID_BYTE;
            haveBad |= v2 & INVALID_BYTE;
            haveBad |= v32 & INVALID_BYTE;
          }
          if (i < length - 1) {
            v0 = this._decodeChar(s.charCodeAt(i));
            v12 = this._decodeChar(s.charCodeAt(i + 1));
            out[op++] = v0 << 2 | v12 >>> 4;
            haveBad |= v0 & INVALID_BYTE;
            haveBad |= v12 & INVALID_BYTE;
          }
          if (i < length - 2) {
            v2 = this._decodeChar(s.charCodeAt(i + 2));
            out[op++] = v12 << 4 | v2 >>> 2;
            haveBad |= v2 & INVALID_BYTE;
          }
          if (i < length - 3) {
            v32 = this._decodeChar(s.charCodeAt(i + 3));
            out[op++] = v2 << 6 | v32;
            haveBad |= v32 & INVALID_BYTE;
          }
          if (haveBad !== 0) {
            throw new Error("Base64Coder: incorrect characters for decoding");
          }
          return out;
        };
        Coder2.prototype._encodeByte = function(b) {
          var result = b;
          result += 65;
          result += 25 - b >>> 8 & 0 - 65 - 26 + 97;
          result += 51 - b >>> 8 & 26 - 97 - 52 + 48;
          result += 61 - b >>> 8 & 52 - 48 - 62 + 43;
          result += 62 - b >>> 8 & 62 - 43 - 63 + 47;
          return String.fromCharCode(result);
        };
        Coder2.prototype._decodeChar = function(c) {
          var result = INVALID_BYTE;
          result += (42 - c & c - 44) >>> 8 & -INVALID_BYTE + c - 43 + 62;
          result += (46 - c & c - 48) >>> 8 & -INVALID_BYTE + c - 47 + 63;
          result += (47 - c & c - 58) >>> 8 & -INVALID_BYTE + c - 48 + 52;
          result += (64 - c & c - 91) >>> 8 & -INVALID_BYTE + c - 65 + 0;
          result += (96 - c & c - 123) >>> 8 & -INVALID_BYTE + c - 97 + 26;
          return result;
        };
        Coder2.prototype._getPaddingLength = function(s) {
          var paddingLength = 0;
          if (this._paddingCharacter) {
            for (var i = s.length - 1; i >= 0; i--) {
              if (s[i] !== this._paddingCharacter) {
                break;
              }
              paddingLength++;
            }
            if (s.length < 4 || paddingLength > 2) {
              throw new Error("Base64Coder: incorrect padding");
            }
          }
          return paddingLength;
        };
        return Coder2;
      })()
    );
    exports.Coder = Coder;
    var stdCoder = new Coder();
    function encode(data) {
      return stdCoder.encode(data);
    }
    exports.encode = encode;
    function decode(s) {
      return stdCoder.decode(s);
    }
    exports.decode = decode;
    var URLSafeCoder = (
      /** @class */
      (function(_super) {
        __extends(URLSafeCoder2, _super);
        function URLSafeCoder2() {
          return _super !== null && _super.apply(this, arguments) || this;
        }
        URLSafeCoder2.prototype._encodeByte = function(b) {
          var result = b;
          result += 65;
          result += 25 - b >>> 8 & 0 - 65 - 26 + 97;
          result += 51 - b >>> 8 & 26 - 97 - 52 + 48;
          result += 61 - b >>> 8 & 52 - 48 - 62 + 45;
          result += 62 - b >>> 8 & 62 - 45 - 63 + 95;
          return String.fromCharCode(result);
        };
        URLSafeCoder2.prototype._decodeChar = function(c) {
          var result = INVALID_BYTE;
          result += (44 - c & c - 46) >>> 8 & -INVALID_BYTE + c - 45 + 62;
          result += (94 - c & c - 96) >>> 8 & -INVALID_BYTE + c - 95 + 63;
          result += (47 - c & c - 58) >>> 8 & -INVALID_BYTE + c - 48 + 52;
          result += (64 - c & c - 91) >>> 8 & -INVALID_BYTE + c - 65 + 0;
          result += (96 - c & c - 123) >>> 8 & -INVALID_BYTE + c - 97 + 26;
          return result;
        };
        return URLSafeCoder2;
      })(Coder)
    );
    exports.URLSafeCoder = URLSafeCoder;
    var urlSafeCoder = new URLSafeCoder();
    function encodeURLSafe(data) {
      return urlSafeCoder.encode(data);
    }
    exports.encodeURLSafe = encodeURLSafe;
    function decodeURLSafe(s) {
      return urlSafeCoder.decode(s);
    }
    exports.decodeURLSafe = decodeURLSafe;
    exports.encodedLength = function(length) {
      return stdCoder.encodedLength(length);
    };
    exports.maxDecodedLength = function(length) {
      return stdCoder.maxDecodedLength(length);
    };
    exports.decodedLength = function(s) {
      return stdCoder.decodedLength(s);
    };
  }
});

// node_modules/fast-sha256/sha256.js
var require_sha256 = __commonJS({
  "node_modules/fast-sha256/sha256.js"(exports, module) {
    (function(root, factory) {
      var exports2 = {};
      factory(exports2);
      var sha256 = exports2["default"];
      for (var k in exports2) {
        sha256[k] = exports2[k];
      }
      if (typeof module === "object" && typeof module.exports === "object") {
        module.exports = sha256;
      } else if (typeof define === "function" && define.amd) {
        define(function() {
          return sha256;
        });
      } else {
        root.sha256 = sha256;
      }
    })(exports, function(exports2) {
      "use strict";
      exports2.__esModule = true;
      exports2.digestLength = 32;
      exports2.blockSize = 64;
      var K = new Uint32Array([
        1116352408,
        1899447441,
        3049323471,
        3921009573,
        961987163,
        1508970993,
        2453635748,
        2870763221,
        3624381080,
        310598401,
        607225278,
        1426881987,
        1925078388,
        2162078206,
        2614888103,
        3248222580,
        3835390401,
        4022224774,
        264347078,
        604807628,
        770255983,
        1249150122,
        1555081692,
        1996064986,
        2554220882,
        2821834349,
        2952996808,
        3210313671,
        3336571891,
        3584528711,
        113926993,
        338241895,
        666307205,
        773529912,
        1294757372,
        1396182291,
        1695183700,
        1986661051,
        2177026350,
        2456956037,
        2730485921,
        2820302411,
        3259730800,
        3345764771,
        3516065817,
        3600352804,
        4094571909,
        275423344,
        430227734,
        506948616,
        659060556,
        883997877,
        958139571,
        1322822218,
        1537002063,
        1747873779,
        1955562222,
        2024104815,
        2227730452,
        2361852424,
        2428436474,
        2756734187,
        3204031479,
        3329325298
      ]);
      function hashBlocks(w, v, p, pos, len) {
        var a, b, c, d, e, f, g, h, u, i, j, t1, t2;
        while (len >= 64) {
          a = v[0];
          b = v[1];
          c = v[2];
          d = v[3];
          e = v[4];
          f = v[5];
          g = v[6];
          h = v[7];
          for (i = 0; i < 16; i++) {
            j = pos + i * 4;
            w[i] = (p[j] & 255) << 24 | (p[j + 1] & 255) << 16 | (p[j + 2] & 255) << 8 | p[j + 3] & 255;
          }
          for (i = 16; i < 64; i++) {
            u = w[i - 2];
            t1 = (u >>> 17 | u << 32 - 17) ^ (u >>> 19 | u << 32 - 19) ^ u >>> 10;
            u = w[i - 15];
            t2 = (u >>> 7 | u << 32 - 7) ^ (u >>> 18 | u << 32 - 18) ^ u >>> 3;
            w[i] = (t1 + w[i - 7] | 0) + (t2 + w[i - 16] | 0);
          }
          for (i = 0; i < 64; i++) {
            t1 = (((e >>> 6 | e << 32 - 6) ^ (e >>> 11 | e << 32 - 11) ^ (e >>> 25 | e << 32 - 25)) + (e & f ^ ~e & g) | 0) + (h + (K[i] + w[i] | 0) | 0) | 0;
            t2 = ((a >>> 2 | a << 32 - 2) ^ (a >>> 13 | a << 32 - 13) ^ (a >>> 22 | a << 32 - 22)) + (a & b ^ a & c ^ b & c) | 0;
            h = g;
            g = f;
            f = e;
            e = d + t1 | 0;
            d = c;
            c = b;
            b = a;
            a = t1 + t2 | 0;
          }
          v[0] += a;
          v[1] += b;
          v[2] += c;
          v[3] += d;
          v[4] += e;
          v[5] += f;
          v[6] += g;
          v[7] += h;
          pos += 64;
          len -= 64;
        }
        return pos;
      }
      var Hash = (
        /** @class */
        (function() {
          function Hash2() {
            this.digestLength = exports2.digestLength;
            this.blockSize = exports2.blockSize;
            this.state = new Int32Array(8);
            this.temp = new Int32Array(64);
            this.buffer = new Uint8Array(128);
            this.bufferLength = 0;
            this.bytesHashed = 0;
            this.finished = false;
            this.reset();
          }
          Hash2.prototype.reset = function() {
            this.state[0] = 1779033703;
            this.state[1] = 3144134277;
            this.state[2] = 1013904242;
            this.state[3] = 2773480762;
            this.state[4] = 1359893119;
            this.state[5] = 2600822924;
            this.state[6] = 528734635;
            this.state[7] = 1541459225;
            this.bufferLength = 0;
            this.bytesHashed = 0;
            this.finished = false;
            return this;
          };
          Hash2.prototype.clean = function() {
            for (var i = 0; i < this.buffer.length; i++) {
              this.buffer[i] = 0;
            }
            for (var i = 0; i < this.temp.length; i++) {
              this.temp[i] = 0;
            }
            this.reset();
          };
          Hash2.prototype.update = function(data, dataLength) {
            if (dataLength === void 0) {
              dataLength = data.length;
            }
            if (this.finished) {
              throw new Error("SHA256: can't update because hash was finished.");
            }
            var dataPos = 0;
            this.bytesHashed += dataLength;
            if (this.bufferLength > 0) {
              while (this.bufferLength < 64 && dataLength > 0) {
                this.buffer[this.bufferLength++] = data[dataPos++];
                dataLength--;
              }
              if (this.bufferLength === 64) {
                hashBlocks(this.temp, this.state, this.buffer, 0, 64);
                this.bufferLength = 0;
              }
            }
            if (dataLength >= 64) {
              dataPos = hashBlocks(this.temp, this.state, data, dataPos, dataLength);
              dataLength %= 64;
            }
            while (dataLength > 0) {
              this.buffer[this.bufferLength++] = data[dataPos++];
              dataLength--;
            }
            return this;
          };
          Hash2.prototype.finish = function(out) {
            if (!this.finished) {
              var bytesHashed = this.bytesHashed;
              var left = this.bufferLength;
              var bitLenHi = bytesHashed / 536870912 | 0;
              var bitLenLo = bytesHashed << 3;
              var padLength = bytesHashed % 64 < 56 ? 64 : 128;
              this.buffer[left] = 128;
              for (var i = left + 1; i < padLength - 8; i++) {
                this.buffer[i] = 0;
              }
              this.buffer[padLength - 8] = bitLenHi >>> 24 & 255;
              this.buffer[padLength - 7] = bitLenHi >>> 16 & 255;
              this.buffer[padLength - 6] = bitLenHi >>> 8 & 255;
              this.buffer[padLength - 5] = bitLenHi >>> 0 & 255;
              this.buffer[padLength - 4] = bitLenLo >>> 24 & 255;
              this.buffer[padLength - 3] = bitLenLo >>> 16 & 255;
              this.buffer[padLength - 2] = bitLenLo >>> 8 & 255;
              this.buffer[padLength - 1] = bitLenLo >>> 0 & 255;
              hashBlocks(this.temp, this.state, this.buffer, 0, padLength);
              this.finished = true;
            }
            for (var i = 0; i < 8; i++) {
              out[i * 4 + 0] = this.state[i] >>> 24 & 255;
              out[i * 4 + 1] = this.state[i] >>> 16 & 255;
              out[i * 4 + 2] = this.state[i] >>> 8 & 255;
              out[i * 4 + 3] = this.state[i] >>> 0 & 255;
            }
            return this;
          };
          Hash2.prototype.digest = function() {
            var out = new Uint8Array(this.digestLength);
            this.finish(out);
            return out;
          };
          Hash2.prototype._saveState = function(out) {
            for (var i = 0; i < this.state.length; i++) {
              out[i] = this.state[i];
            }
          };
          Hash2.prototype._restoreState = function(from, bytesHashed) {
            for (var i = 0; i < this.state.length; i++) {
              this.state[i] = from[i];
            }
            this.bytesHashed = bytesHashed;
            this.finished = false;
            this.bufferLength = 0;
          };
          return Hash2;
        })()
      );
      exports2.Hash = Hash;
      var HMAC = (
        /** @class */
        (function() {
          function HMAC2(key) {
            this.inner = new Hash();
            this.outer = new Hash();
            this.blockSize = this.inner.blockSize;
            this.digestLength = this.inner.digestLength;
            var pad = new Uint8Array(this.blockSize);
            if (key.length > this.blockSize) {
              new Hash().update(key).finish(pad).clean();
            } else {
              for (var i = 0; i < key.length; i++) {
                pad[i] = key[i];
              }
            }
            for (var i = 0; i < pad.length; i++) {
              pad[i] ^= 54;
            }
            this.inner.update(pad);
            for (var i = 0; i < pad.length; i++) {
              pad[i] ^= 54 ^ 92;
            }
            this.outer.update(pad);
            this.istate = new Uint32Array(8);
            this.ostate = new Uint32Array(8);
            this.inner._saveState(this.istate);
            this.outer._saveState(this.ostate);
            for (var i = 0; i < pad.length; i++) {
              pad[i] = 0;
            }
          }
          HMAC2.prototype.reset = function() {
            this.inner._restoreState(this.istate, this.inner.blockSize);
            this.outer._restoreState(this.ostate, this.outer.blockSize);
            return this;
          };
          HMAC2.prototype.clean = function() {
            for (var i = 0; i < this.istate.length; i++) {
              this.ostate[i] = this.istate[i] = 0;
            }
            this.inner.clean();
            this.outer.clean();
          };
          HMAC2.prototype.update = function(data) {
            this.inner.update(data);
            return this;
          };
          HMAC2.prototype.finish = function(out) {
            if (this.outer.finished) {
              this.outer.finish(out);
            } else {
              this.inner.finish(out);
              this.outer.update(out, this.digestLength).finish(out);
            }
            return this;
          };
          HMAC2.prototype.digest = function() {
            var out = new Uint8Array(this.digestLength);
            this.finish(out);
            return out;
          };
          return HMAC2;
        })()
      );
      exports2.HMAC = HMAC;
      function hash(data) {
        var h = new Hash().update(data);
        var digest = h.digest();
        h.clean();
        return digest;
      }
      exports2.hash = hash;
      exports2["default"] = hash;
      function hmac(key, data) {
        var h = new HMAC(key).update(data);
        var digest = h.digest();
        h.clean();
        return digest;
      }
      exports2.hmac = hmac;
      function fillBuffer(buffer, hmac2, info2, counter) {
        var num = counter[0];
        if (num === 0) {
          throw new Error("hkdf: cannot expand more");
        }
        hmac2.reset();
        if (num > 1) {
          hmac2.update(buffer);
        }
        if (info2) {
          hmac2.update(info2);
        }
        hmac2.update(counter);
        hmac2.finish(buffer);
        counter[0]++;
      }
      var hkdfSalt = new Uint8Array(exports2.digestLength);
      function hkdf(key, salt, info2, length) {
        if (salt === void 0) {
          salt = hkdfSalt;
        }
        if (length === void 0) {
          length = 32;
        }
        var counter = new Uint8Array([1]);
        var okm = hmac(salt, key);
        var hmac_ = new HMAC(okm);
        var buffer = new Uint8Array(hmac_.digestLength);
        var bufpos = buffer.length;
        var out = new Uint8Array(length);
        for (var i = 0; i < length; i++) {
          if (bufpos === buffer.length) {
            fillBuffer(buffer, hmac_, info2, counter);
            bufpos = 0;
          }
          out[i] = buffer[bufpos++];
        }
        hmac_.clean();
        buffer.fill(0);
        counter.fill(0);
        return out;
      }
      exports2.hkdf = hkdf;
      function pbkdf2(password, salt, iterations, dkLen) {
        var prf = new HMAC(password);
        var len = prf.digestLength;
        var ctr = new Uint8Array(4);
        var t = new Uint8Array(len);
        var u = new Uint8Array(len);
        var dk = new Uint8Array(dkLen);
        for (var i = 0; i * len < dkLen; i++) {
          var c = i + 1;
          ctr[0] = c >>> 24 & 255;
          ctr[1] = c >>> 16 & 255;
          ctr[2] = c >>> 8 & 255;
          ctr[3] = c >>> 0 & 255;
          prf.reset();
          prf.update(salt);
          prf.update(ctr);
          prf.finish(u);
          for (var j = 0; j < len; j++) {
            t[j] = u[j];
          }
          for (var j = 2; j <= iterations; j++) {
            prf.reset();
            prf.update(u).finish(u);
            for (var k = 0; k < len; k++) {
              t[k] ^= u[k];
            }
          }
          for (var j = 0; j < len && i * len + j < dkLen; j++) {
            dk[i * len + j] = t[j];
          }
        }
        for (var i = 0; i < len; i++) {
          t[i] = u[i] = 0;
        }
        for (var i = 0; i < 4; i++) {
          ctr[i] = 0;
        }
        prf.clean();
        return dk;
      }
      exports2.pbkdf2 = pbkdf2;
    });
  }
});

// node_modules/svix/dist/webhook.js
var require_webhook = __commonJS({
  "node_modules/svix/dist/webhook.js"(exports) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    exports.Webhook = exports.WebhookVerificationError = void 0;
    var timing_safe_equal_1 = require_timing_safe_equal();
    var base64 = require_base64();
    var sha256 = require_sha256();
    var WEBHOOK_TOLERANCE_IN_SECONDS = 5 * 60;
    var ExtendableError = class _ExtendableError extends Error {
      constructor(message) {
        super(message);
        Object.setPrototypeOf(this, _ExtendableError.prototype);
        this.name = "ExtendableError";
        this.stack = new Error(message).stack;
      }
    };
    var WebhookVerificationError = class _WebhookVerificationError extends ExtendableError {
      constructor(message) {
        super(message);
        Object.setPrototypeOf(this, _WebhookVerificationError.prototype);
        this.name = "WebhookVerificationError";
      }
    };
    exports.WebhookVerificationError = WebhookVerificationError;
    var Webhook2 = class _Webhook {
      constructor(secret, options) {
        if (!secret) {
          throw new Error("Secret can't be empty.");
        }
        if ((options === null || options === void 0 ? void 0 : options.format) === "raw") {
          if (secret instanceof Uint8Array) {
            this.key = secret;
          } else {
            this.key = Uint8Array.from(secret, (c) => c.charCodeAt(0));
          }
        } else {
          if (typeof secret !== "string") {
            throw new Error("Expected secret to be of type string");
          }
          if (secret.startsWith(_Webhook.prefix)) {
            secret = secret.substring(_Webhook.prefix.length);
          }
          this.key = base64.decode(secret);
        }
      }
      verify(payload, headers_) {
        const headers = {};
        for (const key of Object.keys(headers_)) {
          headers[key.toLowerCase()] = headers_[key];
        }
        let msgId = headers["svix-id"];
        let msgSignature = headers["svix-signature"];
        let msgTimestamp = headers["svix-timestamp"];
        if (!msgSignature || !msgId || !msgTimestamp) {
          msgId = headers["webhook-id"];
          msgSignature = headers["webhook-signature"];
          msgTimestamp = headers["webhook-timestamp"];
          if (!msgSignature || !msgId || !msgTimestamp) {
            throw new WebhookVerificationError("Missing required headers");
          }
        }
        const timestamp = this.verifyTimestamp(msgTimestamp);
        const computedSignature = this.sign(msgId, timestamp, payload);
        const expectedSignature = computedSignature.split(",")[1];
        const passedSignatures = msgSignature.split(" ");
        const encoder = new globalThis.TextEncoder();
        for (const versionedSignature of passedSignatures) {
          const [version3, signature] = versionedSignature.split(",");
          if (version3 !== "v1") {
            continue;
          }
          if ((0, timing_safe_equal_1.timingSafeEqual)(encoder.encode(signature), encoder.encode(expectedSignature))) {
            return JSON.parse(payload.toString());
          }
        }
        throw new WebhookVerificationError("No matching signature found");
      }
      sign(msgId, timestamp, payload) {
        if (typeof payload === "string") {
        } else if (payload.constructor.name === "Buffer") {
          payload = payload.toString();
        } else {
          throw new Error("Expected payload to be of type string or Buffer. Please refer to https://docs.svix.com/receiving/verifying-payloads/how for more information.");
        }
        const encoder = new TextEncoder();
        const timestampNumber = Math.floor(timestamp.getTime() / 1e3);
        const toSign = encoder.encode(`${msgId}.${timestampNumber}.${payload}`);
        const expectedSignature = base64.encode(sha256.hmac(this.key, toSign));
        return `v1,${expectedSignature}`;
      }
      verifyTimestamp(timestampHeader) {
        const now = Math.floor(Date.now() / 1e3);
        const timestamp = parseInt(timestampHeader, 10);
        if (isNaN(timestamp)) {
          throw new WebhookVerificationError("Invalid Signature Headers");
        }
        if (now - timestamp > WEBHOOK_TOLERANCE_IN_SECONDS) {
          throw new WebhookVerificationError("Message timestamp too old");
        }
        if (timestamp > now + WEBHOOK_TOLERANCE_IN_SECONDS) {
          throw new WebhookVerificationError("Message timestamp too new");
        }
        return new Date(timestamp * 1e3);
      }
    };
    exports.Webhook = Webhook2;
    Webhook2.prefix = "whsec_";
  }
});

// node_modules/svix/dist/models/endpointDisabledTrigger.js
var require_endpointDisabledTrigger = __commonJS({
  "node_modules/svix/dist/models/endpointDisabledTrigger.js"(exports) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    exports.EndpointDisabledTriggerSerializer = exports.EndpointDisabledTrigger = void 0;
    var EndpointDisabledTrigger;
    (function(EndpointDisabledTrigger2) {
      EndpointDisabledTrigger2["Manual"] = "manual";
      EndpointDisabledTrigger2["Automatic"] = "automatic";
    })(EndpointDisabledTrigger = exports.EndpointDisabledTrigger || (exports.EndpointDisabledTrigger = {}));
    exports.EndpointDisabledTriggerSerializer = {
      _fromJsonObject(object) {
        return object;
      },
      _toJsonObject(self) {
        return self;
      }
    };
  }
});

// node_modules/svix/dist/models/ordering.js
var require_ordering = __commonJS({
  "node_modules/svix/dist/models/ordering.js"(exports) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    exports.OrderingSerializer = exports.Ordering = void 0;
    var Ordering;
    (function(Ordering2) {
      Ordering2["Ascending"] = "ascending";
      Ordering2["Descending"] = "descending";
    })(Ordering = exports.Ordering || (exports.Ordering = {}));
    exports.OrderingSerializer = {
      _fromJsonObject(object) {
        return object;
      },
      _toJsonObject(self) {
        return self;
      }
    };
  }
});

// node_modules/svix/dist/models/statusCodeClass.js
var require_statusCodeClass = __commonJS({
  "node_modules/svix/dist/models/statusCodeClass.js"(exports) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    exports.StatusCodeClassSerializer = exports.StatusCodeClass = void 0;
    var StatusCodeClass;
    (function(StatusCodeClass2) {
      StatusCodeClass2[StatusCodeClass2["CodeNone"] = 0] = "CodeNone";
      StatusCodeClass2[StatusCodeClass2["Code1xx"] = 100] = "Code1xx";
      StatusCodeClass2[StatusCodeClass2["Code2xx"] = 200] = "Code2xx";
      StatusCodeClass2[StatusCodeClass2["Code3xx"] = 300] = "Code3xx";
      StatusCodeClass2[StatusCodeClass2["Code4xx"] = 400] = "Code4xx";
      StatusCodeClass2[StatusCodeClass2["Code5xx"] = 500] = "Code5xx";
    })(StatusCodeClass = exports.StatusCodeClass || (exports.StatusCodeClass = {}));
    exports.StatusCodeClassSerializer = {
      _fromJsonObject(object) {
        return object;
      },
      _toJsonObject(self) {
        return self;
      }
    };
  }
});

// node_modules/svix/dist/models/index.js
var require_models = __commonJS({
  "node_modules/svix/dist/models/index.js"(exports) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    exports.StatusCodeClass = exports.Ordering = exports.MessageStatusText = exports.MessageStatus = exports.MessageAttemptTriggerType = exports.EndpointDisabledTrigger = exports.ConnectorKind = exports.BackgroundTaskType = exports.BackgroundTaskStatus = exports.AppPortalCapability = void 0;
    var appPortalCapability_1 = require_appPortalCapability();
    Object.defineProperty(exports, "AppPortalCapability", { enumerable: true, get: function() {
      return appPortalCapability_1.AppPortalCapability;
    } });
    var backgroundTaskStatus_1 = require_backgroundTaskStatus();
    Object.defineProperty(exports, "BackgroundTaskStatus", { enumerable: true, get: function() {
      return backgroundTaskStatus_1.BackgroundTaskStatus;
    } });
    var backgroundTaskType_1 = require_backgroundTaskType();
    Object.defineProperty(exports, "BackgroundTaskType", { enumerable: true, get: function() {
      return backgroundTaskType_1.BackgroundTaskType;
    } });
    var connectorKind_1 = require_connectorKind();
    Object.defineProperty(exports, "ConnectorKind", { enumerable: true, get: function() {
      return connectorKind_1.ConnectorKind;
    } });
    var endpointDisabledTrigger_1 = require_endpointDisabledTrigger();
    Object.defineProperty(exports, "EndpointDisabledTrigger", { enumerable: true, get: function() {
      return endpointDisabledTrigger_1.EndpointDisabledTrigger;
    } });
    var messageAttemptTriggerType_1 = require_messageAttemptTriggerType();
    Object.defineProperty(exports, "MessageAttemptTriggerType", { enumerable: true, get: function() {
      return messageAttemptTriggerType_1.MessageAttemptTriggerType;
    } });
    var messageStatus_1 = require_messageStatus();
    Object.defineProperty(exports, "MessageStatus", { enumerable: true, get: function() {
      return messageStatus_1.MessageStatus;
    } });
    var messageStatusText_1 = require_messageStatusText();
    Object.defineProperty(exports, "MessageStatusText", { enumerable: true, get: function() {
      return messageStatusText_1.MessageStatusText;
    } });
    var ordering_1 = require_ordering();
    Object.defineProperty(exports, "Ordering", { enumerable: true, get: function() {
      return ordering_1.Ordering;
    } });
    var statusCodeClass_1 = require_statusCodeClass();
    Object.defineProperty(exports, "StatusCodeClass", { enumerable: true, get: function() {
      return statusCodeClass_1.StatusCodeClass;
    } });
  }
});

// node_modules/svix/dist/index.js
var require_dist = __commonJS({
  "node_modules/svix/dist/index.js"(exports) {
    "use strict";
    var __createBinding = exports && exports.__createBinding || (Object.create ? (function(o, m, k, k2) {
      if (k2 === void 0) k2 = k;
      var desc = Object.getOwnPropertyDescriptor(m, k);
      if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
        desc = { enumerable: true, get: function() {
          return m[k];
        } };
      }
      Object.defineProperty(o, k2, desc);
    }) : (function(o, m, k, k2) {
      if (k2 === void 0) k2 = k;
      o[k2] = m[k];
    }));
    var __exportStar = exports && exports.__exportStar || function(m, exports2) {
      for (var p in m) if (p !== "default" && !Object.prototype.hasOwnProperty.call(exports2, p)) __createBinding(exports2, m, p);
    };
    Object.defineProperty(exports, "__esModule", { value: true });
    exports.Svix = exports.messageInRaw = exports.ValidationError = exports.HttpErrorOut = exports.HTTPValidationError = exports.ApiException = void 0;
    var application_1 = require_application();
    var authentication_1 = require_authentication();
    var backgroundTask_1 = require_backgroundTask();
    var endpoint_1 = require_endpoint();
    var environment_1 = require_environment();
    var eventType_1 = require_eventType();
    var health_1 = require_health();
    var ingest_1 = require_ingest();
    var integration_1 = require_integration();
    var message_1 = require_message();
    var messageAttempt_1 = require_messageAttempt();
    var operationalWebhook_1 = require_operationalWebhook();
    var statistics_1 = require_statistics();
    var operationalWebhookEndpoint_1 = require_operationalWebhookEndpoint();
    var util_1 = require_util();
    Object.defineProperty(exports, "ApiException", { enumerable: true, get: function() {
      return util_1.ApiException;
    } });
    var HttpErrors_1 = require_HttpErrors();
    Object.defineProperty(exports, "HTTPValidationError", { enumerable: true, get: function() {
      return HttpErrors_1.HTTPValidationError;
    } });
    Object.defineProperty(exports, "HttpErrorOut", { enumerable: true, get: function() {
      return HttpErrors_1.HttpErrorOut;
    } });
    Object.defineProperty(exports, "ValidationError", { enumerable: true, get: function() {
      return HttpErrors_1.ValidationError;
    } });
    __exportStar(require_webhook(), exports);
    __exportStar(require_models(), exports);
    var message_2 = require_message();
    Object.defineProperty(exports, "messageInRaw", { enumerable: true, get: function() {
      return message_2.messageInRaw;
    } });
    var REGIONS = [
      { region: "us", url: "https://api.us.svix.com" },
      { region: "eu", url: "https://api.eu.svix.com" },
      { region: "in", url: "https://api.in.svix.com" },
      { region: "ca", url: "https://api.ca.svix.com" },
      { region: "au", url: "https://api.au.svix.com" }
    ];
    var Svix = class {
      constructor(token, options = {}) {
        var _a, _b, _c;
        const regionalUrl = (_a = REGIONS.find((x) => x.region === token.split(".")[1])) === null || _a === void 0 ? void 0 : _a.url;
        const baseUrl2 = (_c = (_b = options.serverUrl) !== null && _b !== void 0 ? _b : regionalUrl) !== null && _c !== void 0 ? _c : "https://api.svix.com";
        if (options.retryScheduleInMs) {
          this.requestCtx = {
            baseUrl: baseUrl2,
            token,
            timeout: options.requestTimeout,
            retryScheduleInMs: options.retryScheduleInMs
          };
          return;
        }
        if (options.numRetries) {
          this.requestCtx = {
            baseUrl: baseUrl2,
            token,
            timeout: options.requestTimeout,
            numRetries: options.numRetries
          };
          return;
        }
        this.requestCtx = {
          baseUrl: baseUrl2,
          token,
          timeout: options.requestTimeout
        };
      }
      get application() {
        return new application_1.Application(this.requestCtx);
      }
      get authentication() {
        return new authentication_1.Authentication(this.requestCtx);
      }
      get backgroundTask() {
        return new backgroundTask_1.BackgroundTask(this.requestCtx);
      }
      get endpoint() {
        return new endpoint_1.Endpoint(this.requestCtx);
      }
      get environment() {
        return new environment_1.Environment(this.requestCtx);
      }
      get eventType() {
        return new eventType_1.EventType(this.requestCtx);
      }
      get health() {
        return new health_1.Health(this.requestCtx);
      }
      get ingest() {
        return new ingest_1.Ingest(this.requestCtx);
      }
      get integration() {
        return new integration_1.Integration(this.requestCtx);
      }
      get message() {
        return new message_1.Message(this.requestCtx);
      }
      get messageAttempt() {
        return new messageAttempt_1.MessageAttempt(this.requestCtx);
      }
      get operationalWebhook() {
        return new operationalWebhook_1.OperationalWebhook(this.requestCtx);
      }
      get statistics() {
        return new statistics_1.Statistics(this.requestCtx);
      }
      get operationalWebhookEndpoint() {
        return new operationalWebhookEndpoint_1.OperationalWebhookEndpoint(this.requestCtx);
      }
    };
    exports.Svix = Svix;
  }
});

// node_modules/hono/dist/compose.js
var compose = (middleware, onError, onNotFound) => {
  return (context, next) => {
    let index = -1;
    return dispatch(0);
    async function dispatch(i) {
      if (i <= index) {
        throw new Error("next() called multiple times");
      }
      index = i;
      let res;
      let isError = false;
      let handler2;
      if (middleware[i]) {
        handler2 = middleware[i][0][0];
        context.req.routeIndex = i;
      } else {
        handler2 = i === middleware.length && next || void 0;
      }
      if (handler2) {
        try {
          res = await handler2(context, () => dispatch(i + 1));
        } catch (err) {
          if (err instanceof Error && onError) {
            context.error = err;
            res = await onError(err, context);
            isError = true;
          } else {
            throw err;
          }
        }
      } else {
        if (context.finalized === false && onNotFound) {
          res = await onNotFound(context);
        }
      }
      if (res && (context.finalized === false || isError)) {
        context.res = res;
      }
      return context;
    }
  };
};

// node_modules/hono/dist/request/constants.js
var GET_MATCH_RESULT = Symbol();

// node_modules/hono/dist/utils/body.js
var parseBody = async (request, options = /* @__PURE__ */ Object.create(null)) => {
  const { all = false, dot = false } = options;
  const headers = request instanceof HonoRequest ? request.raw.headers : request.headers;
  const contentType = headers.get("Content-Type");
  if (contentType?.startsWith("multipart/form-data") || contentType?.startsWith("application/x-www-form-urlencoded")) {
    return parseFormData(request, { all, dot });
  }
  return {};
};
async function parseFormData(request, options) {
  const formData = await request.formData();
  if (formData) {
    return convertFormDataToBodyData(formData, options);
  }
  return {};
}
function convertFormDataToBodyData(formData, options) {
  const form = /* @__PURE__ */ Object.create(null);
  formData.forEach((value, key) => {
    const shouldParseAllValues = options.all || key.endsWith("[]");
    if (!shouldParseAllValues) {
      form[key] = value;
    } else {
      handleParsingAllValues(form, key, value);
    }
  });
  if (options.dot) {
    Object.entries(form).forEach(([key, value]) => {
      const shouldParseDotValues = key.includes(".");
      if (shouldParseDotValues) {
        handleParsingNestedValues(form, key, value);
        delete form[key];
      }
    });
  }
  return form;
}
var handleParsingAllValues = (form, key, value) => {
  if (form[key] !== void 0) {
    if (Array.isArray(form[key])) {
      ;
      form[key].push(value);
    } else {
      form[key] = [form[key], value];
    }
  } else {
    if (!key.endsWith("[]")) {
      form[key] = value;
    } else {
      form[key] = [value];
    }
  }
};
var handleParsingNestedValues = (form, key, value) => {
  let nestedForm = form;
  const keys = key.split(".");
  keys.forEach((key2, index) => {
    if (index === keys.length - 1) {
      nestedForm[key2] = value;
    } else {
      if (!nestedForm[key2] || typeof nestedForm[key2] !== "object" || Array.isArray(nestedForm[key2]) || nestedForm[key2] instanceof File) {
        nestedForm[key2] = /* @__PURE__ */ Object.create(null);
      }
      nestedForm = nestedForm[key2];
    }
  });
};

// node_modules/hono/dist/utils/url.js
var splitPath = (path) => {
  const paths = path.split("/");
  if (paths[0] === "") {
    paths.shift();
  }
  return paths;
};
var splitRoutingPath = (routePath) => {
  const { groups, path } = extractGroupsFromPath(routePath);
  const paths = splitPath(path);
  return replaceGroupMarks(paths, groups);
};
var extractGroupsFromPath = (path) => {
  const groups = [];
  path = path.replace(/\{[^}]+\}/g, (match2, index) => {
    const mark = `@${index}`;
    groups.push([mark, match2]);
    return mark;
  });
  return { groups, path };
};
var replaceGroupMarks = (paths, groups) => {
  for (let i = groups.length - 1; i >= 0; i--) {
    const [mark] = groups[i];
    for (let j = paths.length - 1; j >= 0; j--) {
      if (paths[j].includes(mark)) {
        paths[j] = paths[j].replace(mark, groups[i][1]);
        break;
      }
    }
  }
  return paths;
};
var patternCache = {};
var getPattern = (label, next) => {
  if (label === "*") {
    return "*";
  }
  const match2 = label.match(/^\:([^\{\}]+)(?:\{(.+)\})?$/);
  if (match2) {
    const cacheKey = `${label}#${next}`;
    if (!patternCache[cacheKey]) {
      if (match2[2]) {
        patternCache[cacheKey] = next && next[0] !== ":" && next[0] !== "*" ? [cacheKey, match2[1], new RegExp(`^${match2[2]}(?=/${next})`)] : [label, match2[1], new RegExp(`^${match2[2]}$`)];
      } else {
        patternCache[cacheKey] = [label, match2[1], true];
      }
    }
    return patternCache[cacheKey];
  }
  return null;
};
var tryDecode = (str, decoder) => {
  try {
    return decoder(str);
  } catch {
    return str.replace(/(?:%[0-9A-Fa-f]{2})+/g, (match2) => {
      try {
        return decoder(match2);
      } catch {
        return match2;
      }
    });
  }
};
var tryDecodeURI = (str) => tryDecode(str, decodeURI);
var getPath = (request) => {
  const url = request.url;
  const start = url.indexOf("/", url.indexOf(":") + 4);
  let i = start;
  for (; i < url.length; i++) {
    const charCode = url.charCodeAt(i);
    if (charCode === 37) {
      const queryIndex = url.indexOf("?", i);
      const path = url.slice(start, queryIndex === -1 ? void 0 : queryIndex);
      return tryDecodeURI(path.includes("%25") ? path.replace(/%25/g, "%2525") : path);
    } else if (charCode === 63) {
      break;
    }
  }
  return url.slice(start, i);
};
var getPathNoStrict = (request) => {
  const result = getPath(request);
  return result.length > 1 && result.at(-1) === "/" ? result.slice(0, -1) : result;
};
var mergePath = (base, sub, ...rest) => {
  if (rest.length) {
    sub = mergePath(sub, ...rest);
  }
  return `${base?.[0] === "/" ? "" : "/"}${base}${sub === "/" ? "" : `${base?.at(-1) === "/" ? "" : "/"}${sub?.[0] === "/" ? sub.slice(1) : sub}`}`;
};
var checkOptionalParameter = (path) => {
  if (path.charCodeAt(path.length - 1) !== 63 || !path.includes(":")) {
    return null;
  }
  const segments = path.split("/");
  const results = [];
  let basePath = "";
  segments.forEach((segment) => {
    if (segment !== "" && !/\:/.test(segment)) {
      basePath += "/" + segment;
    } else if (/\:/.test(segment)) {
      if (/\?/.test(segment)) {
        if (results.length === 0 && basePath === "") {
          results.push("/");
        } else {
          results.push(basePath);
        }
        const optionalSegment = segment.replace("?", "");
        basePath += "/" + optionalSegment;
        results.push(basePath);
      } else {
        basePath += "/" + segment;
      }
    }
  });
  return results.filter((v, i, a) => a.indexOf(v) === i);
};
var _decodeURI = (value) => {
  if (!/[%+]/.test(value)) {
    return value;
  }
  if (value.indexOf("+") !== -1) {
    value = value.replace(/\+/g, " ");
  }
  return value.indexOf("%") !== -1 ? tryDecode(value, decodeURIComponent_) : value;
};
var _getQueryParam = (url, key, multiple) => {
  let encoded;
  if (!multiple && key && !/[%+]/.test(key)) {
    let keyIndex2 = url.indexOf(`?${key}`, 8);
    if (keyIndex2 === -1) {
      keyIndex2 = url.indexOf(`&${key}`, 8);
    }
    while (keyIndex2 !== -1) {
      const trailingKeyCode = url.charCodeAt(keyIndex2 + key.length + 1);
      if (trailingKeyCode === 61) {
        const valueIndex = keyIndex2 + key.length + 2;
        const endIndex = url.indexOf("&", valueIndex);
        return _decodeURI(url.slice(valueIndex, endIndex === -1 ? void 0 : endIndex));
      } else if (trailingKeyCode == 38 || isNaN(trailingKeyCode)) {
        return "";
      }
      keyIndex2 = url.indexOf(`&${key}`, keyIndex2 + 1);
    }
    encoded = /[%+]/.test(url);
    if (!encoded) {
      return void 0;
    }
  }
  const results = {};
  encoded ??= /[%+]/.test(url);
  let keyIndex = url.indexOf("?", 8);
  while (keyIndex !== -1) {
    const nextKeyIndex = url.indexOf("&", keyIndex + 1);
    let valueIndex = url.indexOf("=", keyIndex);
    if (valueIndex > nextKeyIndex && nextKeyIndex !== -1) {
      valueIndex = -1;
    }
    let name = url.slice(
      keyIndex + 1,
      valueIndex === -1 ? nextKeyIndex === -1 ? void 0 : nextKeyIndex : valueIndex
    );
    if (encoded) {
      name = _decodeURI(name);
    }
    keyIndex = nextKeyIndex;
    if (name === "") {
      continue;
    }
    let value;
    if (valueIndex === -1) {
      value = "";
    } else {
      value = url.slice(valueIndex + 1, nextKeyIndex === -1 ? void 0 : nextKeyIndex);
      if (encoded) {
        value = _decodeURI(value);
      }
    }
    if (multiple) {
      if (!(results[name] && Array.isArray(results[name]))) {
        results[name] = [];
      }
      ;
      results[name].push(value);
    } else {
      results[name] ??= value;
    }
  }
  return key ? results[key] : results;
};
var getQueryParam = _getQueryParam;
var getQueryParams = (url, key) => {
  return _getQueryParam(url, key, true);
};
var decodeURIComponent_ = decodeURIComponent;

// node_modules/hono/dist/request.js
var tryDecodeURIComponent = (str) => tryDecode(str, decodeURIComponent_);
var HonoRequest = class {
  raw;
  #validatedData;
  #matchResult;
  routeIndex = 0;
  path;
  bodyCache = {};
  constructor(request, path = "/", matchResult = [[]]) {
    this.raw = request;
    this.path = path;
    this.#matchResult = matchResult;
    this.#validatedData = {};
  }
  param(key) {
    return key ? this.#getDecodedParam(key) : this.#getAllDecodedParams();
  }
  #getDecodedParam(key) {
    const paramKey = this.#matchResult[0][this.routeIndex][1][key];
    const param = this.#getParamValue(paramKey);
    return param && /\%/.test(param) ? tryDecodeURIComponent(param) : param;
  }
  #getAllDecodedParams() {
    const decoded = {};
    const keys = Object.keys(this.#matchResult[0][this.routeIndex][1]);
    for (const key of keys) {
      const value = this.#getParamValue(this.#matchResult[0][this.routeIndex][1][key]);
      if (value !== void 0) {
        decoded[key] = /\%/.test(value) ? tryDecodeURIComponent(value) : value;
      }
    }
    return decoded;
  }
  #getParamValue(paramKey) {
    return this.#matchResult[1] ? this.#matchResult[1][paramKey] : paramKey;
  }
  query(key) {
    return getQueryParam(this.url, key);
  }
  queries(key) {
    return getQueryParams(this.url, key);
  }
  header(name) {
    if (name) {
      return this.raw.headers.get(name) ?? void 0;
    }
    const headerData = {};
    this.raw.headers.forEach((value, key) => {
      headerData[key] = value;
    });
    return headerData;
  }
  async parseBody(options) {
    return this.bodyCache.parsedBody ??= await parseBody(this, options);
  }
  #cachedBody = (key) => {
    const { bodyCache, raw: raw2 } = this;
    const cachedBody = bodyCache[key];
    if (cachedBody) {
      return cachedBody;
    }
    const anyCachedKey = Object.keys(bodyCache)[0];
    if (anyCachedKey) {
      return bodyCache[anyCachedKey].then((body) => {
        if (anyCachedKey === "json") {
          body = JSON.stringify(body);
        }
        return new Response(body)[key]();
      });
    }
    return bodyCache[key] = raw2[key]();
  };
  json() {
    return this.#cachedBody("text").then((text) => JSON.parse(text));
  }
  text() {
    return this.#cachedBody("text");
  }
  arrayBuffer() {
    return this.#cachedBody("arrayBuffer");
  }
  blob() {
    return this.#cachedBody("blob");
  }
  formData() {
    return this.#cachedBody("formData");
  }
  addValidatedData(target, data) {
    this.#validatedData[target] = data;
  }
  valid(target) {
    return this.#validatedData[target];
  }
  get url() {
    return this.raw.url;
  }
  get method() {
    return this.raw.method;
  }
  get [GET_MATCH_RESULT]() {
    return this.#matchResult;
  }
  get matchedRoutes() {
    return this.#matchResult[0].map(([[, route]]) => route);
  }
  get routePath() {
    return this.#matchResult[0].map(([[, route]]) => route)[this.routeIndex].path;
  }
};

// node_modules/hono/dist/utils/html.js
var HtmlEscapedCallbackPhase = {
  Stringify: 1,
  BeforeStream: 2,
  Stream: 3
};
var raw = (value, callbacks) => {
  const escapedString = new String(value);
  escapedString.isEscaped = true;
  escapedString.callbacks = callbacks;
  return escapedString;
};
var resolveCallback = async (str, phase, preserveCallbacks, context, buffer) => {
  if (typeof str === "object" && !(str instanceof String)) {
    if (!(str instanceof Promise)) {
      str = str.toString();
    }
    if (str instanceof Promise) {
      str = await str;
    }
  }
  const callbacks = str.callbacks;
  if (!callbacks?.length) {
    return Promise.resolve(str);
  }
  if (buffer) {
    buffer[0] += str;
  } else {
    buffer = [str];
  }
  const resStr = Promise.all(callbacks.map((c) => c({ phase, buffer, context }))).then(
    (res) => Promise.all(
      res.filter(Boolean).map((str2) => resolveCallback(str2, phase, false, context, buffer))
    ).then(() => buffer[0])
  );
  if (preserveCallbacks) {
    return raw(await resStr, callbacks);
  } else {
    return resStr;
  }
};

// node_modules/hono/dist/context.js
var TEXT_PLAIN = "text/plain; charset=UTF-8";
var setDefaultContentType = (contentType, headers) => {
  return {
    "Content-Type": contentType,
    ...headers
  };
};
var Context = class {
  #rawRequest;
  #req;
  env = {};
  #var;
  finalized = false;
  error;
  #status;
  #executionCtx;
  #res;
  #layout;
  #renderer;
  #notFoundHandler;
  #preparedHeaders;
  #matchResult;
  #path;
  constructor(req, options) {
    this.#rawRequest = req;
    if (options) {
      this.#executionCtx = options.executionCtx;
      this.env = options.env;
      this.#notFoundHandler = options.notFoundHandler;
      this.#path = options.path;
      this.#matchResult = options.matchResult;
    }
  }
  get req() {
    this.#req ??= new HonoRequest(this.#rawRequest, this.#path, this.#matchResult);
    return this.#req;
  }
  get event() {
    if (this.#executionCtx && "respondWith" in this.#executionCtx) {
      return this.#executionCtx;
    } else {
      throw Error("This context has no FetchEvent");
    }
  }
  get executionCtx() {
    if (this.#executionCtx) {
      return this.#executionCtx;
    } else {
      throw Error("This context has no ExecutionContext");
    }
  }
  get res() {
    return this.#res ||= new Response(null, {
      headers: this.#preparedHeaders ??= new Headers()
    });
  }
  set res(_res) {
    if (this.#res && _res) {
      _res = new Response(_res.body, _res);
      for (const [k, v] of this.#res.headers.entries()) {
        if (k === "content-type") {
          continue;
        }
        if (k === "set-cookie") {
          const cookies = this.#res.headers.getSetCookie();
          _res.headers.delete("set-cookie");
          for (const cookie of cookies) {
            _res.headers.append("set-cookie", cookie);
          }
        } else {
          _res.headers.set(k, v);
        }
      }
    }
    this.#res = _res;
    this.finalized = true;
  }
  render = (...args) => {
    this.#renderer ??= (content) => this.html(content);
    return this.#renderer(...args);
  };
  setLayout = (layout) => this.#layout = layout;
  getLayout = () => this.#layout;
  setRenderer = (renderer) => {
    this.#renderer = renderer;
  };
  header = (name, value, options) => {
    if (this.finalized) {
      this.#res = new Response(this.#res.body, this.#res);
    }
    const headers = this.#res ? this.#res.headers : this.#preparedHeaders ??= new Headers();
    if (value === void 0) {
      headers.delete(name);
    } else if (options?.append) {
      headers.append(name, value);
    } else {
      headers.set(name, value);
    }
  };
  status = (status) => {
    this.#status = status;
  };
  set = (key, value) => {
    this.#var ??= /* @__PURE__ */ new Map();
    this.#var.set(key, value);
  };
  get = (key) => {
    return this.#var ? this.#var.get(key) : void 0;
  };
  get var() {
    if (!this.#var) {
      return {};
    }
    return Object.fromEntries(this.#var);
  }
  #newResponse(data, arg, headers) {
    const responseHeaders = this.#res ? new Headers(this.#res.headers) : this.#preparedHeaders ?? new Headers();
    if (typeof arg === "object" && "headers" in arg) {
      const argHeaders = arg.headers instanceof Headers ? arg.headers : new Headers(arg.headers);
      for (const [key, value] of argHeaders) {
        if (key.toLowerCase() === "set-cookie") {
          responseHeaders.append(key, value);
        } else {
          responseHeaders.set(key, value);
        }
      }
    }
    if (headers) {
      for (const [k, v] of Object.entries(headers)) {
        if (typeof v === "string") {
          responseHeaders.set(k, v);
        } else {
          responseHeaders.delete(k);
          for (const v2 of v) {
            responseHeaders.append(k, v2);
          }
        }
      }
    }
    const status = typeof arg === "number" ? arg : arg?.status ?? this.#status;
    return new Response(data, { status, headers: responseHeaders });
  }
  newResponse = (...args) => this.#newResponse(...args);
  body = (data, arg, headers) => this.#newResponse(data, arg, headers);
  text = (text, arg, headers) => {
    return !this.#preparedHeaders && !this.#status && !arg && !headers && !this.finalized ? new Response(text) : this.#newResponse(
      text,
      arg,
      setDefaultContentType(TEXT_PLAIN, headers)
    );
  };
  json = (object, arg, headers) => {
    return this.#newResponse(
      JSON.stringify(object),
      arg,
      setDefaultContentType("application/json", headers)
    );
  };
  html = (html, arg, headers) => {
    const res = (html2) => this.#newResponse(html2, arg, setDefaultContentType("text/html; charset=UTF-8", headers));
    return typeof html === "object" ? resolveCallback(html, HtmlEscapedCallbackPhase.Stringify, false, {}).then(res) : res(html);
  };
  redirect = (location, status) => {
    const locationString = String(location);
    this.header(
      "Location",
      !/[^\x00-\xFF]/.test(locationString) ? locationString : encodeURI(locationString)
    );
    return this.newResponse(null, status ?? 302);
  };
  notFound = () => {
    this.#notFoundHandler ??= () => new Response();
    return this.#notFoundHandler(this);
  };
};

// node_modules/hono/dist/router.js
var METHOD_NAME_ALL = "ALL";
var METHOD_NAME_ALL_LOWERCASE = "all";
var METHODS = ["get", "post", "put", "delete", "options", "patch"];
var MESSAGE_MATCHER_IS_ALREADY_BUILT = "Can not add a route since the matcher is already built.";
var UnsupportedPathError = class extends Error {
};

// node_modules/hono/dist/utils/constants.js
var COMPOSED_HANDLER = "__COMPOSED_HANDLER";

// node_modules/hono/dist/hono-base.js
var notFoundHandler = (c) => {
  return c.text("404 Not Found", 404);
};
var errorHandler = (err, c) => {
  if ("getResponse" in err) {
    const res = err.getResponse();
    return c.newResponse(res.body, res);
  }
  console.error(err);
  return c.text("Internal Server Error", 500);
};
var Hono = class {
  get;
  post;
  put;
  delete;
  options;
  patch;
  all;
  on;
  use;
  router;
  getPath;
  _basePath = "/";
  #path = "/";
  routes = [];
  constructor(options = {}) {
    const allMethods = [...METHODS, METHOD_NAME_ALL_LOWERCASE];
    allMethods.forEach((method) => {
      this[method] = (args1, ...args) => {
        if (typeof args1 === "string") {
          this.#path = args1;
        } else {
          this.#addRoute(method, this.#path, args1);
        }
        args.forEach((handler2) => {
          this.#addRoute(method, this.#path, handler2);
        });
        return this;
      };
    });
    this.on = (method, path, ...handlers) => {
      for (const p of [path].flat()) {
        this.#path = p;
        for (const m of [method].flat()) {
          handlers.map((handler2) => {
            this.#addRoute(m.toUpperCase(), this.#path, handler2);
          });
        }
      }
      return this;
    };
    this.use = (arg1, ...handlers) => {
      if (typeof arg1 === "string") {
        this.#path = arg1;
      } else {
        this.#path = "*";
        handlers.unshift(arg1);
      }
      handlers.forEach((handler2) => {
        this.#addRoute(METHOD_NAME_ALL, this.#path, handler2);
      });
      return this;
    };
    const { strict, ...optionsWithoutStrict } = options;
    Object.assign(this, optionsWithoutStrict);
    this.getPath = strict ?? true ? options.getPath ?? getPath : getPathNoStrict;
  }
  #clone() {
    const clone = new Hono({
      router: this.router,
      getPath: this.getPath
    });
    clone.errorHandler = this.errorHandler;
    clone.#notFoundHandler = this.#notFoundHandler;
    clone.routes = this.routes;
    return clone;
  }
  #notFoundHandler = notFoundHandler;
  errorHandler = errorHandler;
  route(path, app2) {
    const subApp = this.basePath(path);
    app2.routes.map((r) => {
      let handler2;
      if (app2.errorHandler === errorHandler) {
        handler2 = r.handler;
      } else {
        handler2 = async (c, next) => (await compose([], app2.errorHandler)(c, () => r.handler(c, next))).res;
        handler2[COMPOSED_HANDLER] = r.handler;
      }
      subApp.#addRoute(r.method, r.path, handler2);
    });
    return this;
  }
  basePath(path) {
    const subApp = this.#clone();
    subApp._basePath = mergePath(this._basePath, path);
    return subApp;
  }
  onError = (handler2) => {
    this.errorHandler = handler2;
    return this;
  };
  notFound = (handler2) => {
    this.#notFoundHandler = handler2;
    return this;
  };
  mount(path, applicationHandler, options) {
    let replaceRequest;
    let optionHandler;
    if (options) {
      if (typeof options === "function") {
        optionHandler = options;
      } else {
        optionHandler = options.optionHandler;
        if (options.replaceRequest === false) {
          replaceRequest = (request) => request;
        } else {
          replaceRequest = options.replaceRequest;
        }
      }
    }
    const getOptions = optionHandler ? (c) => {
      const options2 = optionHandler(c);
      return Array.isArray(options2) ? options2 : [options2];
    } : (c) => {
      let executionContext = void 0;
      try {
        executionContext = c.executionCtx;
      } catch {
      }
      return [c.env, executionContext];
    };
    replaceRequest ||= (() => {
      const mergedPath = mergePath(this._basePath, path);
      const pathPrefixLength = mergedPath === "/" ? 0 : mergedPath.length;
      return (request) => {
        const url = new URL(request.url);
        url.pathname = url.pathname.slice(pathPrefixLength) || "/";
        return new Request(url, request);
      };
    })();
    const handler2 = async (c, next) => {
      const res = await applicationHandler(replaceRequest(c.req.raw), ...getOptions(c));
      if (res) {
        return res;
      }
      await next();
    };
    this.#addRoute(METHOD_NAME_ALL, mergePath(path, "*"), handler2);
    return this;
  }
  #addRoute(method, path, handler2) {
    method = method.toUpperCase();
    path = mergePath(this._basePath, path);
    const r = { basePath: this._basePath, path, method, handler: handler2 };
    this.router.add(method, path, [handler2, r]);
    this.routes.push(r);
  }
  #handleError(err, c) {
    if (err instanceof Error) {
      return this.errorHandler(err, c);
    }
    throw err;
  }
  #dispatch(request, executionCtx, env, method) {
    if (method === "HEAD") {
      return (async () => new Response(null, await this.#dispatch(request, executionCtx, env, "GET")))();
    }
    const path = this.getPath(request, { env });
    const matchResult = this.router.match(method, path);
    const c = new Context(request, {
      path,
      matchResult,
      env,
      executionCtx,
      notFoundHandler: this.#notFoundHandler
    });
    if (matchResult[0].length === 1) {
      let res;
      try {
        res = matchResult[0][0][0][0](c, async () => {
          c.res = await this.#notFoundHandler(c);
        });
      } catch (err) {
        return this.#handleError(err, c);
      }
      return res instanceof Promise ? res.then(
        (resolved) => resolved || (c.finalized ? c.res : this.#notFoundHandler(c))
      ).catch((err) => this.#handleError(err, c)) : res ?? this.#notFoundHandler(c);
    }
    const composed = compose(matchResult[0], this.errorHandler, this.#notFoundHandler);
    return (async () => {
      try {
        const context = await composed(c);
        if (!context.finalized) {
          throw new Error(
            "Context is not finalized. Did you forget to return a Response object or `await next()`?"
          );
        }
        return context.res;
      } catch (err) {
        return this.#handleError(err, c);
      }
    })();
  }
  fetch = (request, ...rest) => {
    return this.#dispatch(request, rest[1], rest[0], request.method);
  };
  request = (input, requestInit, Env, executionCtx) => {
    if (input instanceof Request) {
      return this.fetch(requestInit ? new Request(input, requestInit) : input, Env, executionCtx);
    }
    input = input.toString();
    return this.fetch(
      new Request(
        /^https?:\/\//.test(input) ? input : `http://localhost${mergePath("/", input)}`,
        requestInit
      ),
      Env,
      executionCtx
    );
  };
  fire = () => {
    addEventListener("fetch", (event) => {
      event.respondWith(this.#dispatch(event.request, event, void 0, event.request.method));
    });
  };
};

// node_modules/hono/dist/router/reg-exp-router/matcher.js
var emptyParam = [];
function match(method, path) {
  const matchers = this.buildAllMatchers();
  const match2 = (method2, path2) => {
    const matcher = matchers[method2] || matchers[METHOD_NAME_ALL];
    const staticMatch = matcher[2][path2];
    if (staticMatch) {
      return staticMatch;
    }
    const match3 = path2.match(matcher[0]);
    if (!match3) {
      return [[], emptyParam];
    }
    const index = match3.indexOf("", 1);
    return [matcher[1][index], match3];
  };
  this.match = match2;
  return match2(method, path);
}

// node_modules/hono/dist/router/reg-exp-router/node.js
var LABEL_REG_EXP_STR = "[^/]+";
var ONLY_WILDCARD_REG_EXP_STR = ".*";
var TAIL_WILDCARD_REG_EXP_STR = "(?:|/.*)";
var PATH_ERROR = Symbol();
var regExpMetaChars = new Set(".\\+*[^]$()");
function compareKey(a, b) {
  if (a.length === 1) {
    return b.length === 1 ? a < b ? -1 : 1 : -1;
  }
  if (b.length === 1) {
    return 1;
  }
  if (a === ONLY_WILDCARD_REG_EXP_STR || a === TAIL_WILDCARD_REG_EXP_STR) {
    return 1;
  } else if (b === ONLY_WILDCARD_REG_EXP_STR || b === TAIL_WILDCARD_REG_EXP_STR) {
    return -1;
  }
  if (a === LABEL_REG_EXP_STR) {
    return 1;
  } else if (b === LABEL_REG_EXP_STR) {
    return -1;
  }
  return a.length === b.length ? a < b ? -1 : 1 : b.length - a.length;
}
var Node = class {
  #index;
  #varIndex;
  #children = /* @__PURE__ */ Object.create(null);
  insert(tokens, index, paramMap, context, pathErrorCheckOnly) {
    if (tokens.length === 0) {
      if (this.#index !== void 0) {
        throw PATH_ERROR;
      }
      if (pathErrorCheckOnly) {
        return;
      }
      this.#index = index;
      return;
    }
    const [token, ...restTokens] = tokens;
    const pattern = token === "*" ? restTokens.length === 0 ? ["", "", ONLY_WILDCARD_REG_EXP_STR] : ["", "", LABEL_REG_EXP_STR] : token === "/*" ? ["", "", TAIL_WILDCARD_REG_EXP_STR] : token.match(/^\:([^\{\}]+)(?:\{(.+)\})?$/);
    let node;
    if (pattern) {
      const name = pattern[1];
      let regexpStr = pattern[2] || LABEL_REG_EXP_STR;
      if (name && pattern[2]) {
        if (regexpStr === ".*") {
          throw PATH_ERROR;
        }
        regexpStr = regexpStr.replace(/^\((?!\?:)(?=[^)]+\)$)/, "(?:");
        if (/\((?!\?:)/.test(regexpStr)) {
          throw PATH_ERROR;
        }
      }
      node = this.#children[regexpStr];
      if (!node) {
        if (Object.keys(this.#children).some(
          (k) => k !== ONLY_WILDCARD_REG_EXP_STR && k !== TAIL_WILDCARD_REG_EXP_STR
        )) {
          throw PATH_ERROR;
        }
        if (pathErrorCheckOnly) {
          return;
        }
        node = this.#children[regexpStr] = new Node();
        if (name !== "") {
          node.#varIndex = context.varIndex++;
        }
      }
      if (!pathErrorCheckOnly && name !== "") {
        paramMap.push([name, node.#varIndex]);
      }
    } else {
      node = this.#children[token];
      if (!node) {
        if (Object.keys(this.#children).some(
          (k) => k.length > 1 && k !== ONLY_WILDCARD_REG_EXP_STR && k !== TAIL_WILDCARD_REG_EXP_STR
        )) {
          throw PATH_ERROR;
        }
        if (pathErrorCheckOnly) {
          return;
        }
        node = this.#children[token] = new Node();
      }
    }
    node.insert(restTokens, index, paramMap, context, pathErrorCheckOnly);
  }
  buildRegExpStr() {
    const childKeys = Object.keys(this.#children).sort(compareKey);
    const strList = childKeys.map((k) => {
      const c = this.#children[k];
      return (typeof c.#varIndex === "number" ? `(${k})@${c.#varIndex}` : regExpMetaChars.has(k) ? `\\${k}` : k) + c.buildRegExpStr();
    });
    if (typeof this.#index === "number") {
      strList.unshift(`#${this.#index}`);
    }
    if (strList.length === 0) {
      return "";
    }
    if (strList.length === 1) {
      return strList[0];
    }
    return "(?:" + strList.join("|") + ")";
  }
};

// node_modules/hono/dist/router/reg-exp-router/trie.js
var Trie = class {
  #context = { varIndex: 0 };
  #root = new Node();
  insert(path, index, pathErrorCheckOnly) {
    const paramAssoc = [];
    const groups = [];
    for (let i = 0; ; ) {
      let replaced = false;
      path = path.replace(/\{[^}]+\}/g, (m) => {
        const mark = `@\\${i}`;
        groups[i] = [mark, m];
        i++;
        replaced = true;
        return mark;
      });
      if (!replaced) {
        break;
      }
    }
    const tokens = path.match(/(?::[^\/]+)|(?:\/\*$)|./g) || [];
    for (let i = groups.length - 1; i >= 0; i--) {
      const [mark] = groups[i];
      for (let j = tokens.length - 1; j >= 0; j--) {
        if (tokens[j].indexOf(mark) !== -1) {
          tokens[j] = tokens[j].replace(mark, groups[i][1]);
          break;
        }
      }
    }
    this.#root.insert(tokens, index, paramAssoc, this.#context, pathErrorCheckOnly);
    return paramAssoc;
  }
  buildRegExp() {
    let regexp = this.#root.buildRegExpStr();
    if (regexp === "") {
      return [/^$/, [], []];
    }
    let captureIndex = 0;
    const indexReplacementMap = [];
    const paramReplacementMap = [];
    regexp = regexp.replace(/#(\d+)|@(\d+)|\.\*\$/g, (_, handlerIndex, paramIndex) => {
      if (handlerIndex !== void 0) {
        indexReplacementMap[++captureIndex] = Number(handlerIndex);
        return "$()";
      }
      if (paramIndex !== void 0) {
        paramReplacementMap[Number(paramIndex)] = ++captureIndex;
        return "";
      }
      return "";
    });
    return [new RegExp(`^${regexp}`), indexReplacementMap, paramReplacementMap];
  }
};

// node_modules/hono/dist/router/reg-exp-router/router.js
var nullMatcher = [/^$/, [], /* @__PURE__ */ Object.create(null)];
var wildcardRegExpCache = /* @__PURE__ */ Object.create(null);
function buildWildcardRegExp(path) {
  return wildcardRegExpCache[path] ??= new RegExp(
    path === "*" ? "" : `^${path.replace(
      /\/\*$|([.\\+*[^\]$()])/g,
      (_, metaChar) => metaChar ? `\\${metaChar}` : "(?:|/.*)"
    )}$`
  );
}
function clearWildcardRegExpCache() {
  wildcardRegExpCache = /* @__PURE__ */ Object.create(null);
}
function buildMatcherFromPreprocessedRoutes(routes) {
  const trie = new Trie();
  const handlerData = [];
  if (routes.length === 0) {
    return nullMatcher;
  }
  const routesWithStaticPathFlag = routes.map(
    (route) => [!/\*|\/:/.test(route[0]), ...route]
  ).sort(
    ([isStaticA, pathA], [isStaticB, pathB]) => isStaticA ? 1 : isStaticB ? -1 : pathA.length - pathB.length
  );
  const staticMap = /* @__PURE__ */ Object.create(null);
  for (let i = 0, j = -1, len = routesWithStaticPathFlag.length; i < len; i++) {
    const [pathErrorCheckOnly, path, handlers] = routesWithStaticPathFlag[i];
    if (pathErrorCheckOnly) {
      staticMap[path] = [handlers.map(([h]) => [h, /* @__PURE__ */ Object.create(null)]), emptyParam];
    } else {
      j++;
    }
    let paramAssoc;
    try {
      paramAssoc = trie.insert(path, j, pathErrorCheckOnly);
    } catch (e) {
      throw e === PATH_ERROR ? new UnsupportedPathError(path) : e;
    }
    if (pathErrorCheckOnly) {
      continue;
    }
    handlerData[j] = handlers.map(([h, paramCount]) => {
      const paramIndexMap = /* @__PURE__ */ Object.create(null);
      paramCount -= 1;
      for (; paramCount >= 0; paramCount--) {
        const [key, value] = paramAssoc[paramCount];
        paramIndexMap[key] = value;
      }
      return [h, paramIndexMap];
    });
  }
  const [regexp, indexReplacementMap, paramReplacementMap] = trie.buildRegExp();
  for (let i = 0, len = handlerData.length; i < len; i++) {
    for (let j = 0, len2 = handlerData[i].length; j < len2; j++) {
      const map = handlerData[i][j]?.[1];
      if (!map) {
        continue;
      }
      const keys = Object.keys(map);
      for (let k = 0, len3 = keys.length; k < len3; k++) {
        map[keys[k]] = paramReplacementMap[map[keys[k]]];
      }
    }
  }
  const handlerMap = [];
  for (const i in indexReplacementMap) {
    handlerMap[i] = handlerData[indexReplacementMap[i]];
  }
  return [regexp, handlerMap, staticMap];
}
function findMiddleware(middleware, path) {
  if (!middleware) {
    return void 0;
  }
  for (const k of Object.keys(middleware).sort((a, b) => b.length - a.length)) {
    if (buildWildcardRegExp(k).test(path)) {
      return [...middleware[k]];
    }
  }
  return void 0;
}
var RegExpRouter = class {
  name = "RegExpRouter";
  #middleware;
  #routes;
  constructor() {
    this.#middleware = { [METHOD_NAME_ALL]: /* @__PURE__ */ Object.create(null) };
    this.#routes = { [METHOD_NAME_ALL]: /* @__PURE__ */ Object.create(null) };
  }
  add(method, path, handler2) {
    const middleware = this.#middleware;
    const routes = this.#routes;
    if (!middleware || !routes) {
      throw new Error(MESSAGE_MATCHER_IS_ALREADY_BUILT);
    }
    if (!middleware[method]) {
      ;
      [middleware, routes].forEach((handlerMap) => {
        handlerMap[method] = /* @__PURE__ */ Object.create(null);
        Object.keys(handlerMap[METHOD_NAME_ALL]).forEach((p) => {
          handlerMap[method][p] = [...handlerMap[METHOD_NAME_ALL][p]];
        });
      });
    }
    if (path === "/*") {
      path = "*";
    }
    const paramCount = (path.match(/\/:/g) || []).length;
    if (/\*$/.test(path)) {
      const re = buildWildcardRegExp(path);
      if (method === METHOD_NAME_ALL) {
        Object.keys(middleware).forEach((m) => {
          middleware[m][path] ||= findMiddleware(middleware[m], path) || findMiddleware(middleware[METHOD_NAME_ALL], path) || [];
        });
      } else {
        middleware[method][path] ||= findMiddleware(middleware[method], path) || findMiddleware(middleware[METHOD_NAME_ALL], path) || [];
      }
      Object.keys(middleware).forEach((m) => {
        if (method === METHOD_NAME_ALL || method === m) {
          Object.keys(middleware[m]).forEach((p) => {
            re.test(p) && middleware[m][p].push([handler2, paramCount]);
          });
        }
      });
      Object.keys(routes).forEach((m) => {
        if (method === METHOD_NAME_ALL || method === m) {
          Object.keys(routes[m]).forEach(
            (p) => re.test(p) && routes[m][p].push([handler2, paramCount])
          );
        }
      });
      return;
    }
    const paths = checkOptionalParameter(path) || [path];
    for (let i = 0, len = paths.length; i < len; i++) {
      const path2 = paths[i];
      Object.keys(routes).forEach((m) => {
        if (method === METHOD_NAME_ALL || method === m) {
          routes[m][path2] ||= [
            ...findMiddleware(middleware[m], path2) || findMiddleware(middleware[METHOD_NAME_ALL], path2) || []
          ];
          routes[m][path2].push([handler2, paramCount - len + i + 1]);
        }
      });
    }
  }
  match = match;
  buildAllMatchers() {
    const matchers = /* @__PURE__ */ Object.create(null);
    Object.keys(this.#routes).concat(Object.keys(this.#middleware)).forEach((method) => {
      matchers[method] ||= this.#buildMatcher(method);
    });
    this.#middleware = this.#routes = void 0;
    clearWildcardRegExpCache();
    return matchers;
  }
  #buildMatcher(method) {
    const routes = [];
    let hasOwnRoute = method === METHOD_NAME_ALL;
    [this.#middleware, this.#routes].forEach((r) => {
      const ownRoute = r[method] ? Object.keys(r[method]).map((path) => [path, r[method][path]]) : [];
      if (ownRoute.length !== 0) {
        hasOwnRoute ||= true;
        routes.push(...ownRoute);
      } else if (method !== METHOD_NAME_ALL) {
        routes.push(
          ...Object.keys(r[METHOD_NAME_ALL]).map((path) => [path, r[METHOD_NAME_ALL][path]])
        );
      }
    });
    if (!hasOwnRoute) {
      return null;
    } else {
      return buildMatcherFromPreprocessedRoutes(routes);
    }
  }
};

// node_modules/hono/dist/router/smart-router/router.js
var SmartRouter = class {
  name = "SmartRouter";
  #routers = [];
  #routes = [];
  constructor(init2) {
    this.#routers = init2.routers;
  }
  add(method, path, handler2) {
    if (!this.#routes) {
      throw new Error(MESSAGE_MATCHER_IS_ALREADY_BUILT);
    }
    this.#routes.push([method, path, handler2]);
  }
  match(method, path) {
    if (!this.#routes) {
      throw new Error("Fatal error");
    }
    const routers = this.#routers;
    const routes = this.#routes;
    const len = routers.length;
    let i = 0;
    let res;
    for (; i < len; i++) {
      const router = routers[i];
      try {
        for (let i2 = 0, len2 = routes.length; i2 < len2; i2++) {
          router.add(...routes[i2]);
        }
        res = router.match(method, path);
      } catch (e) {
        if (e instanceof UnsupportedPathError) {
          continue;
        }
        throw e;
      }
      this.match = router.match.bind(router);
      this.#routers = [router];
      this.#routes = void 0;
      break;
    }
    if (i === len) {
      throw new Error("Fatal error");
    }
    this.name = `SmartRouter + ${this.activeRouter.name}`;
    return res;
  }
  get activeRouter() {
    if (this.#routes || this.#routers.length !== 1) {
      throw new Error("No active router has been determined yet.");
    }
    return this.#routers[0];
  }
};

// node_modules/hono/dist/router/trie-router/node.js
var emptyParams = /* @__PURE__ */ Object.create(null);
var Node2 = class {
  #methods;
  #children;
  #patterns;
  #order = 0;
  #params = emptyParams;
  constructor(method, handler2, children) {
    this.#children = children || /* @__PURE__ */ Object.create(null);
    this.#methods = [];
    if (method && handler2) {
      const m = /* @__PURE__ */ Object.create(null);
      m[method] = { handler: handler2, possibleKeys: [], score: 0 };
      this.#methods = [m];
    }
    this.#patterns = [];
  }
  insert(method, path, handler2) {
    this.#order = ++this.#order;
    let curNode = this;
    const parts = splitRoutingPath(path);
    const possibleKeys = [];
    for (let i = 0, len = parts.length; i < len; i++) {
      const p = parts[i];
      const nextP = parts[i + 1];
      const pattern = getPattern(p, nextP);
      const key = Array.isArray(pattern) ? pattern[0] : p;
      if (key in curNode.#children) {
        curNode = curNode.#children[key];
        if (pattern) {
          possibleKeys.push(pattern[1]);
        }
        continue;
      }
      curNode.#children[key] = new Node2();
      if (pattern) {
        curNode.#patterns.push(pattern);
        possibleKeys.push(pattern[1]);
      }
      curNode = curNode.#children[key];
    }
    curNode.#methods.push({
      [method]: {
        handler: handler2,
        possibleKeys: possibleKeys.filter((v, i, a) => a.indexOf(v) === i),
        score: this.#order
      }
    });
    return curNode;
  }
  #getHandlerSets(node, method, nodeParams, params) {
    const handlerSets = [];
    for (let i = 0, len = node.#methods.length; i < len; i++) {
      const m = node.#methods[i];
      const handlerSet = m[method] || m[METHOD_NAME_ALL];
      const processedSet = {};
      if (handlerSet !== void 0) {
        handlerSet.params = /* @__PURE__ */ Object.create(null);
        handlerSets.push(handlerSet);
        if (nodeParams !== emptyParams || params && params !== emptyParams) {
          for (let i2 = 0, len2 = handlerSet.possibleKeys.length; i2 < len2; i2++) {
            const key = handlerSet.possibleKeys[i2];
            const processed = processedSet[handlerSet.score];
            handlerSet.params[key] = params?.[key] && !processed ? params[key] : nodeParams[key] ?? params?.[key];
            processedSet[handlerSet.score] = true;
          }
        }
      }
    }
    return handlerSets;
  }
  search(method, path) {
    const handlerSets = [];
    this.#params = emptyParams;
    const curNode = this;
    let curNodes = [curNode];
    const parts = splitPath(path);
    const curNodesQueue = [];
    for (let i = 0, len = parts.length; i < len; i++) {
      const part = parts[i];
      const isLast = i === len - 1;
      const tempNodes = [];
      for (let j = 0, len2 = curNodes.length; j < len2; j++) {
        const node = curNodes[j];
        const nextNode = node.#children[part];
        if (nextNode) {
          nextNode.#params = node.#params;
          if (isLast) {
            if (nextNode.#children["*"]) {
              handlerSets.push(
                ...this.#getHandlerSets(nextNode.#children["*"], method, node.#params)
              );
            }
            handlerSets.push(...this.#getHandlerSets(nextNode, method, node.#params));
          } else {
            tempNodes.push(nextNode);
          }
        }
        for (let k = 0, len3 = node.#patterns.length; k < len3; k++) {
          const pattern = node.#patterns[k];
          const params = node.#params === emptyParams ? {} : { ...node.#params };
          if (pattern === "*") {
            const astNode = node.#children["*"];
            if (astNode) {
              handlerSets.push(...this.#getHandlerSets(astNode, method, node.#params));
              astNode.#params = params;
              tempNodes.push(astNode);
            }
            continue;
          }
          const [key, name, matcher] = pattern;
          if (!part && !(matcher instanceof RegExp)) {
            continue;
          }
          const child = node.#children[key];
          const restPathString = parts.slice(i).join("/");
          if (matcher instanceof RegExp) {
            const m = matcher.exec(restPathString);
            if (m) {
              params[name] = m[0];
              handlerSets.push(...this.#getHandlerSets(child, method, node.#params, params));
              if (Object.keys(child.#children).length) {
                child.#params = params;
                const componentCount = m[0].match(/\//)?.length ?? 0;
                const targetCurNodes = curNodesQueue[componentCount] ||= [];
                targetCurNodes.push(child);
              }
              continue;
            }
          }
          if (matcher === true || matcher.test(part)) {
            params[name] = part;
            if (isLast) {
              handlerSets.push(...this.#getHandlerSets(child, method, params, node.#params));
              if (child.#children["*"]) {
                handlerSets.push(
                  ...this.#getHandlerSets(child.#children["*"], method, params, node.#params)
                );
              }
            } else {
              child.#params = params;
              tempNodes.push(child);
            }
          }
        }
      }
      curNodes = tempNodes.concat(curNodesQueue.shift() ?? []);
    }
    if (handlerSets.length > 1) {
      handlerSets.sort((a, b) => {
        return a.score - b.score;
      });
    }
    return [handlerSets.map(({ handler: handler2, params }) => [handler2, params])];
  }
};

// node_modules/hono/dist/router/trie-router/router.js
var TrieRouter = class {
  name = "TrieRouter";
  #node;
  constructor() {
    this.#node = new Node2();
  }
  add(method, path, handler2) {
    const results = checkOptionalParameter(path);
    if (results) {
      for (let i = 0, len = results.length; i < len; i++) {
        this.#node.insert(method, results[i], handler2);
      }
      return;
    }
    this.#node.insert(method, path, handler2);
  }
  match(method, path) {
    return this.#node.search(method, path);
  }
};

// node_modules/hono/dist/hono.js
var Hono2 = class extends Hono {
  constructor(options = {}) {
    super(options);
    this.router = options.router ?? new SmartRouter({
      routers: [new RegExpRouter(), new TrieRouter()]
    });
  }
};

// node_modules/hono/dist/middleware/cors/index.js
var cors = (options) => {
  const defaults = {
    origin: "*",
    allowMethods: ["GET", "HEAD", "PUT", "POST", "DELETE", "PATCH"],
    allowHeaders: [],
    exposeHeaders: []
  };
  const opts = {
    ...defaults,
    ...options
  };
  const findAllowOrigin = ((optsOrigin) => {
    if (typeof optsOrigin === "string") {
      if (optsOrigin === "*") {
        return () => optsOrigin;
      } else {
        return (origin) => optsOrigin === origin ? origin : null;
      }
    } else if (typeof optsOrigin === "function") {
      return optsOrigin;
    } else {
      return (origin) => optsOrigin.includes(origin) ? origin : null;
    }
  })(opts.origin);
  const findAllowMethods = ((optsAllowMethods) => {
    if (typeof optsAllowMethods === "function") {
      return optsAllowMethods;
    } else if (Array.isArray(optsAllowMethods)) {
      return () => optsAllowMethods;
    } else {
      return () => [];
    }
  })(opts.allowMethods);
  return async function cors2(c, next) {
    function set(key, value) {
      c.res.headers.set(key, value);
    }
    const allowOrigin = await findAllowOrigin(c.req.header("origin") || "", c);
    if (allowOrigin) {
      set("Access-Control-Allow-Origin", allowOrigin);
    }
    if (opts.origin !== "*") {
      const existingVary = c.req.header("Vary");
      if (existingVary) {
        set("Vary", existingVary);
      } else {
        set("Vary", "Origin");
      }
    }
    if (opts.credentials) {
      set("Access-Control-Allow-Credentials", "true");
    }
    if (opts.exposeHeaders?.length) {
      set("Access-Control-Expose-Headers", opts.exposeHeaders.join(","));
    }
    if (c.req.method === "OPTIONS") {
      if (opts.maxAge != null) {
        set("Access-Control-Max-Age", opts.maxAge.toString());
      }
      const allowMethods = await findAllowMethods(c.req.header("origin") || "", c);
      if (allowMethods.length) {
        set("Access-Control-Allow-Methods", allowMethods.join(","));
      }
      let headers = opts.allowHeaders;
      if (!headers?.length) {
        const requestHeaders = c.req.header("Access-Control-Request-Headers");
        if (requestHeaders) {
          headers = requestHeaders.split(/\s*,\s*/);
        }
      }
      if (headers?.length) {
        set("Access-Control-Allow-Headers", headers.join(","));
        c.res.headers.append("Vary", "Access-Control-Request-Headers");
      }
      c.res.headers.delete("Content-Length");
      c.res.headers.delete("Content-Type");
      return new Response(null, {
        headers: c.res.headers,
        status: 204,
        statusText: "No Content"
      });
    }
    await next();
  };
};

// node_modules/hono/dist/utils/color.js
function getColorEnabled() {
  const { process: process2, Deno } = globalThis;
  const isNoColor = typeof Deno?.noColor === "boolean" ? Deno.noColor : process2 !== void 0 ? "NO_COLOR" in process2?.env : false;
  return !isNoColor;
}
async function getColorEnabledAsync() {
  const { navigator } = globalThis;
  const cfWorkers = "cloudflare:workers";
  const isNoColor = navigator !== void 0 && navigator.userAgent === "Cloudflare-Workers" ? await (async () => {
    try {
      return "NO_COLOR" in ((await import(cfWorkers)).env ?? {});
    } catch {
      return false;
    }
  })() : !getColorEnabled();
  return !isNoColor;
}

// node_modules/hono/dist/middleware/logger/index.js
var humanize = (times) => {
  const [delimiter, separator] = [",", "."];
  const orderTimes = times.map((v) => v.replace(/(\d)(?=(\d\d\d)+(?!\d))/g, "$1" + delimiter));
  return orderTimes.join(separator);
};
var time = (start) => {
  const delta = Date.now() - start;
  return humanize([delta < 1e3 ? delta + "ms" : Math.round(delta / 1e3) + "s"]);
};
var colorStatus = async (status) => {
  const colorEnabled = await getColorEnabledAsync();
  if (colorEnabled) {
    switch (status / 100 | 0) {
      case 5:
        return `\x1B[31m${status}\x1B[0m`;
      case 4:
        return `\x1B[33m${status}\x1B[0m`;
      case 3:
        return `\x1B[36m${status}\x1B[0m`;
      case 2:
        return `\x1B[32m${status}\x1B[0m`;
    }
  }
  return `${status}`;
};
async function log(fn, prefix, method, path, status = 0, elapsed) {
  const out = prefix === "<--" ? `${prefix} ${method} ${path}` : `${prefix} ${method} ${path} ${await colorStatus(status)} ${elapsed}`;
  fn(out);
}
var logger = (fn = console.log) => {
  return async function logger22(c, next) {
    const { method, url } = c.req;
    const path = url.slice(url.indexOf("/", 8));
    await log(fn, "<--", method, path);
    const start = Date.now();
    await next();
    await log(fn, "-->", method, path, c.res.status, time(start));
  };
};

// src/app.ts
init_config();

// src/automations/lead-management/config.ts
var config2 = {
  notionDatabase: process.env.LEAD_NOTION_DATABASE_ID,
  companiesDatabase: process.env.LEAD_COMPANIES_DATABASE_ID,
  peopleDatabase: process.env.LEAD_PEOPLE_DATABASE_ID,
  slackChannel: process.env.LEAD_SLACK_CHANNEL_ID,
  calcomLink: process.env.LEAD_CALCOM_LINK || "",
  calcomWebhookSecret: process.env.LEAD_CALCOM_WEBHOOK_SECRET || "",
  google: {
    clientId: process.env.GOOGLE_CLIENT_ID || "",
    clientSecret: process.env.GOOGLE_CLIENT_SECRET || "",
    refreshToken: process.env.GOOGLE_REFRESH_TOKEN || ""
  },
  features: {
    minimumBudget: parseInt(process.env.LEAD_MINIMUM_BUDGET || "0"),
    autoAccept: process.env.LEAD_AUTO_ACCEPT === "true"
  },
  budgetRanges: [
    "$250 - $1000",
    "$1000 - $5000",
    "$5000 - $20000",
    "$20000+"
  ]
};
if (!config2.notionDatabase) {
  throw new Error("LEAD_NOTION_DATABASE_ID is required");
}
if (!config2.companiesDatabase) {
  throw new Error("LEAD_COMPANIES_DATABASE_ID is required");
}
if (!config2.peopleDatabase) {
  throw new Error("LEAD_PEOPLE_DATABASE_ID is required");
}
if (!config2.slackChannel) {
  throw new Error("LEAD_SLACK_CHANNEL_ID is required");
}

// src/automations/lead-management/webhooks/gmail.ts
init_logger();
import { google } from "googleapis";

// src/shared/utils/monitor.ts
init_config();
init_logger();
import * as Sentry from "@sentry/node";
function initMonitoring() {
  if (config.observability.sentry.dsn) {
    Sentry.init({
      dsn: config.observability.sentry.dsn,
      environment: config.env,
      tracesSampleRate: config.env === "production" ? 0.1 : 1
    });
    logger2.info("Sentry monitoring initialized");
  }
}
function captureException2(error2, context) {
  logger2.error("Exception captured", error2);
  if (config.observability.sentry.dsn) {
    Sentry.captureException(error2, {
      extra: context
    });
  }
}
function captureMessage2(message, level = "info") {
  if (config.observability.sentry.dsn) {
    Sentry.captureMessage(message, level);
  }
}
function setUser2(user) {
  if (config.observability.sentry.dsn) {
    Sentry.setUser(user);
  }
}
function addBreadcrumb2(breadcrumb) {
  if (config.observability.sentry.dsn) {
    Sentry.addBreadcrumb(breadcrumb);
  }
}
var monitor = {
  initMonitoring,
  captureException: captureException2,
  captureMessage: captureMessage2,
  setUser: setUser2,
  addBreadcrumb: addBreadcrumb2
};

// src/shared/services/notion.ts
init_config();
init_retry();
init_logger();
import { Client } from "@notionhq/client";
var notion = new Client({ auth: config.notion.apiKey });
async function createPage(databaseId, properties) {
  logger2.info("Creating Notion page", { databaseId });
  return withRetry(
    () => notion.pages.create({
      parent: { database_id: databaseId },
      properties
    })
  );
}
async function updatePage(pageId, properties) {
  logger2.info("Updating Notion page", { pageId });
  return withRetry(
    () => notion.pages.update({
      page_id: pageId,
      properties
    })
  );
}
async function queryDatabase(databaseId, filter) {
  return withRetry(
    () => notion.databases.query({
      database_id: databaseId,
      filter
    })
  );
}
async function findPageByProperty(databaseId, propertyName, propertyType, value) {
  const filter = { property: propertyName };
  if (propertyType === "email") {
    filter.email = { equals: value };
  } else if (propertyType === "rich_text") {
    filter.rich_text = { equals: value };
  } else if (propertyType === "title") {
    filter.title = { equals: value };
  }
  const results = await queryDatabase(databaseId, filter);
  return results.results[0] || null;
}
async function retrievePage(pageId) {
  return withRetry(() => notion.pages.retrieve({ page_id: pageId }));
}
async function retrieveDatabase(databaseId) {
  return withRetry(() => notion.databases.retrieve({ database_id: databaseId }));
}
async function getTitlePropertyName(databaseId) {
  const db = await retrieveDatabase(databaseId);
  for (const [propName, prop] of Object.entries(db.properties)) {
    if (prop.type === "title") {
      logger2.info("Found title property", { databaseId, propertyName: propName });
      return propName;
    }
  }
  throw new Error(`No title property found in database ${databaseId}`);
}

// src/automations/lead-management/workflows/process-lead.ts
init_slack();
init_logger();

// src/shared/utils/parser.ts
import * as cheerio from "cheerio";
function extractEmail(text) {
  const emailRegex = /[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}/;
  const match2 = text.match(emailRegex);
  return match2 ? match2[0] : null;
}
function parseCurrency(text) {
  const currencyRegex = /\$?\s*(\d{1,3}(?:,?\d{3})*(?:\.\d{2})?)/;
  const match2 = text.match(currencyRegex);
  if (match2) {
    const amount = match2[1].replace(/,/g, "");
    return parseFloat(amount);
  }
  return null;
}
function cleanText(text) {
  return text.replace(/\s+/g, " ").replace(/\n\s*\n/g, "\n").trim();
}

// src/automations/lead-management/workflows/manage-company.ts
init_logger();
async function findOrCreateCompany(companyName) {
  if (!companyName || companyName.trim() === "") {
    logger2.warn("No company name provided");
    return "";
  }
  logger2.info("Finding or creating company", { companyName });
  const titleProp = await getTitlePropertyName(config2.companiesDatabase);
  const existingCompany = await findPageByProperty(
    config2.companiesDatabase,
    titleProp,
    "title",
    companyName
  );
  if (existingCompany) {
    logger2.info("Company found", { companyId: existingCompany.id, companyName });
    return existingCompany.id;
  }
  logger2.info("Creating new company", { companyName });
  const properties = {
    [titleProp]: {
      title: [
        {
          text: {
            content: companyName
          }
        }
      ]
    }
  };
  const newCompany = await createPage(config2.companiesDatabase, properties);
  logger2.info("Company created", { companyId: newCompany.id, companyName });
  return newCompany.id;
}

// src/automations/lead-management/workflows/manage-contact.ts
init_logger();
async function findOrCreateContact(name, email, companyId) {
  if (!email || email.trim() === "") {
    logger2.warn("No email provided for contact");
    return "";
  }
  logger2.info("Finding or creating contact", { name, email });
  const existingContact = await findPageByProperty(
    config2.peopleDatabase,
    "Email",
    "email",
    email
  );
  if (existingContact) {
    logger2.info("Contact found", { contactId: existingContact.id, email });
    if (name || companyId) {
      await updateContactInfo(existingContact.id, name, companyId);
    }
    return existingContact.id;
  }
  logger2.info("Creating new contact", { name, email });
  const titleProp = await getTitlePropertyName(config2.peopleDatabase);
  const properties = {
    [titleProp]: {
      title: [
        {
          text: {
            content: name || email
          }
        }
      ]
    },
    Email: {
      email
    }
  };
  if (companyId) {
    properties.Company = {
      relation: [{ id: companyId }]
    };
  }
  const newContact = await createPage(config2.peopleDatabase, properties);
  logger2.info("Contact created", { contactId: newContact.id, email });
  return newContact.id;
}
async function updateContactInfo(contactId, name, companyId) {
  const properties = {};
  if (name) {
    const titleProp = await getTitlePropertyName(config2.peopleDatabase);
    properties[titleProp] = {
      title: [
        {
          text: {
            content: name
          }
        }
      ]
    };
  }
  if (companyId) {
    properties.Company = {
      relation: [{ id: companyId }]
    };
  }
  if (Object.keys(properties).length > 0) {
    logger2.info("Updating contact", { contactId, hasName: !!name, hasCompany: !!companyId });
    await updatePage(contactId, properties);
  }
}

// src/automations/lead-management/workflows/process-lead.ts
function mapBudgetToRange(budget) {
  if (!budget) return void 0;
  if (budget < 1e3) return "$250 - $1000";
  if (budget < 5e3) return "$1000 - $5000";
  if (budget < 2e4) return "$5000 - $20000";
  return "$20000+";
}
function parseBookingEmail(emailData) {
  const { from, subject, body } = emailData;
  const email = extractEmail(from) || "";
  const nameMatch = from.match(/^([^<]+)</);
  const name = nameMatch ? nameMatch[1].trim() : "";
  const companyMatch = body.match(/company:?\s*([^\n]+)/i);
  const company = companyMatch ? companyMatch[1].trim() : void 0;
  const projectMatch = body.match(/project:?\s*([^\n]+(?:\n(?!\w+:)[^\n]+)*)/i);
  const projectDescription = projectMatch ? cleanText(projectMatch[1]) : body.slice(0, 500);
  const budget = parseCurrency(body) || void 0;
  const timelineMatch = body.match(/timeline:?\s*([^\n]+)/i);
  const timeline = timelineMatch ? timelineMatch[1].trim() : void 0;
  return {
    from,
    subject,
    body,
    name,
    company,
    projectDescription,
    budget,
    timeline
  };
}
async function createLeadInNotion(lead) {
  logger2.info("Creating lead in Notion", { email: lead.email, company: lead.company });
  let companyId;
  if (lead.company) {
    companyId = await findOrCreateCompany(lead.company);
  }
  const contactId = await findOrCreateContact(
    lead.name || "",
    lead.email,
    companyId
  );
  const titleProp = await getTitlePropertyName(config2.notionDatabase);
  const properties = {
    [titleProp]: {
      title: [
        {
          text: {
            content: lead.name || lead.email
          }
        }
      ]
    },
    Stage: {
      status: {
        name: "Lead"
        // Default stage
      }
    }
  };
  if (companyId) {
    properties.Company = {
      relation: [{ id: companyId }]
    };
  }
  if (contactId) {
    properties.Contacts = {
      relation: [{ id: contactId }]
    };
  }
  if (lead.projectDescription) {
    properties.Description = {
      rich_text: [{ text: { content: lead.projectDescription } }]
    };
  }
  const budgetRange = mapBudgetToRange(lead.budget);
  if (budgetRange) {
    properties.Budget = {
      select: {
        name: budgetRange
      }
    };
  }
  const page = await createPage(config2.notionDatabase, properties);
  logger2.info("Lead created in Notion", {
    pageId: page.id,
    email: lead.email,
    companyId,
    contactId,
    budgetRange
  });
  return page.id;
}
async function sendSlackNotification(lead, notionPageId) {
  logger2.info("Sending Slack notification", { email: lead.email });
  const budgetRange = mapBudgetToRange(lead.budget);
  const blocks = [
    {
      type: "header",
      text: {
        type: "plain_text",
        text: `\u{1F3AF} New Lead: ${lead.name || lead.email}`
      }
    },
    {
      type: "section",
      fields: [
        {
          type: "mrkdwn",
          text: `*Email:*
${lead.email}`
        },
        {
          type: "mrkdwn",
          text: `*Company:*
${lead.company || "N/A"}`
        },
        {
          type: "mrkdwn",
          text: `*Budget:*
${budgetRange || "N/A"}`
        },
        {
          type: "mrkdwn",
          text: `*Contact:*
${lead.name || "N/A"}`
        }
      ]
    }
  ];
  if (lead.projectDescription) {
    blocks.push({
      type: "section",
      text: {
        type: "mrkdwn",
        text: `*Project:*
${lead.projectDescription}`
      }
    });
  }
  blocks.push({
    type: "section",
    text: {
      type: "mrkdwn",
      text: `<https://notion.so/${notionPageId.replace(/-/g, "")}|View in Notion>`
    }
  });
  blocks.push({
    type: "actions",
    block_id: "lead_actions",
    elements: [
      {
        type: "button",
        text: {
          type: "plain_text",
          text: "\u2705 Accept Lead"
        },
        style: "primary",
        action_id: "accept_lead",
        value: notionPageId
      },
      {
        type: "button",
        text: {
          type: "plain_text",
          text: "\u274C Reject Lead"
        },
        style: "danger",
        action_id: "reject_lead",
        value: notionPageId
      }
    ]
  });
  const result = await sendMessage(
    config2.slackChannel,
    `New lead: ${lead.name || lead.email}`,
    blocks
  );
  logger2.info("Slack notification sent", { ts: result.ts, channel: result.channel });
  return result;
}
async function processLead(emailData) {
  logger2.info("Processing new lead", { email: emailData.from });
  const parsedData = parseBookingEmail({
    from: emailData.from,
    subject: emailData.subject,
    body: emailData.body
  });
  const lead = {
    email: extractEmail(parsedData.from),
    name: parsedData.name,
    company: parsedData.company,
    projectDescription: parsedData.projectDescription,
    budget: parsedData.budget,
    timeline: parsedData.timeline,
    status: "new"
  };
  const notionPageId = await createLeadInNotion(lead);
  const { ts, channel } = await sendSlackNotification(lead, notionPageId);
  lead.notionPageId = notionPageId;
  lead.slackThreadTs = ts;
  logger2.info("Lead processed successfully", {
    email: lead.email,
    notionPageId,
    slackThreadTs: ts
  });
}

// src/automations/lead-management/webhooks/gmail.ts
async function handleGmailWebhook(c) {
  try {
    logger2.info("Gmail webhook received", { automationId: "lead-management" });
    const body = await c.req.json();
    const message = body.message;
    if (!message || !message.data) {
      logger2.warn("Invalid Gmail webhook payload");
      return c.json({ success: false, error: "Invalid payload" }, 400);
    }
    const decodedData = Buffer.from(message.data, "base64").toString("utf-8");
    const data = JSON.parse(decodedData);
    logger2.info("Gmail push notification decoded", { data });
    const emailData = await fetchGmailMessage(data.historyId);
    if (!emailData) {
      logger2.warn("Could not fetch email message");
      return c.json({ success: false, error: "Could not fetch email" }, 400);
    }
    await processLead(emailData);
    return c.json({
      success: true,
      message: "Lead processed successfully"
    });
  } catch (error2) {
    logger2.error("Error handling Gmail webhook", error2);
    monitor.captureException(error2, {
      automationId: "lead-management",
      webhook: "gmail"
    });
    return c.json(
      {
        success: false,
        error: "Internal server error"
      },
      500
    );
  }
}
async function fetchGmailMessage(historyId) {
  try {
    const oauth2Client = new google.auth.OAuth2(
      config2.google.clientId,
      config2.google.clientSecret
    );
    oauth2Client.setCredentials({
      refresh_token: config2.google.refreshToken
    });
    const gmail = google.gmail({ version: "v1", auth: oauth2Client });
    const response = await gmail.users.messages.list({
      userId: "me",
      maxResults: 1,
      q: "is:unread"
      // Only fetch unread messages
    });
    const messages = response.data.messages;
    if (!messages || messages.length === 0) {
      return null;
    }
    const messageId = messages[0].id;
    const message = await gmail.users.messages.get({
      userId: "me",
      id: messageId,
      format: "full"
    });
    const headers = message.data.payload?.headers || [];
    const from = headers.find((h) => h.name?.toLowerCase() === "from")?.value || "";
    const subject = headers.find((h) => h.name?.toLowerCase() === "subject")?.value || "";
    let body = "";
    if (message.data.payload?.body?.data) {
      body = Buffer.from(message.data.payload.body.data, "base64").toString("utf-8");
    } else if (message.data.payload?.parts) {
      for (const part of message.data.payload.parts) {
        if (part.mimeType === "text/plain" && part.body?.data) {
          body = Buffer.from(part.body.data, "base64").toString("utf-8");
          break;
        }
      }
    }
    await gmail.users.messages.modify({
      userId: "me",
      id: messageId,
      requestBody: {
        removeLabelIds: ["UNREAD"]
      }
    });
    logger2.info("Email fetched successfully", { messageId, from, subject });
    return {
      from,
      subject,
      body
    };
  } catch (error2) {
    logger2.error("Error fetching Gmail message", error2);
    return null;
  }
}

// src/automations/lead-management/webhooks/calcom.ts
init_logger();

// src/automations/lead-management/workflows/handle-booking.ts
init_slack();
init_logger();

// src/shared/utils/format.ts
function formatDateTime(date) {
  const d = typeof date === "string" ? new Date(date) : date;
  return d.toLocaleString("en-US", {
    year: "numeric",
    month: "short",
    day: "numeric",
    hour: "numeric",
    minute: "2-digit",
    hour12: true
  });
}

// src/automations/lead-management/workflows/handle-booking.ts
async function findLeadByEmail(email) {
  logger2.info("Finding lead by email", { email });
  const page = await findPageByProperty(
    config2.notionDatabase,
    "Email",
    "email",
    email
  );
  return page ? page.id : null;
}
async function updateLeadWithBooking(pageId, booking) {
  logger2.info("Updating lead with booking info", { pageId, bookingId: booking.payload.bookingId });
  const properties = {
    Status: {
      select: {
        name: "booked"
      }
    },
    "Booking Date": {
      date: {
        start: booking.payload.startTime
      }
    }
  };
  if (booking.payload.bookingId) {
    properties["Booking ID"] = {
      number: booking.payload.bookingId
    };
  }
  await updatePage(pageId, properties);
  logger2.info("Lead updated with booking info", { pageId });
}
async function sendSlackBookingConfirmation(email, booking, threadTs) {
  logger2.info("Sending Slack booking confirmation", { email, bookingId: booking.payload.bookingId });
  const { payload } = booking;
  const attendee = payload.attendees[0];
  const message = `
\u{1F389} *Booking Confirmed!*

*Lead:* ${attendee.name} (${attendee.email})
*Meeting:* ${payload.title}
*Time:* ${formatDateTime(new Date(payload.startTime))}
*Duration:* ${payload.description || "N/A"}

The discovery call has been scheduled!
  `.trim();
  if (threadTs) {
    await sendThreadReply(config2.slackChannel, threadTs, message);
  } else {
    const { sendMessage: sendMessage2 } = await Promise.resolve().then(() => (init_slack(), slack_exports));
    await sendMessage2(config2.slackChannel, message);
  }
  logger2.info("Slack booking confirmation sent", { email });
}
async function handleBookingConfirmation(booking) {
  logger2.info("Handling booking confirmation", {
    triggerEvent: booking.triggerEvent,
    bookingId: booking.payload.bookingId
  });
  const attendeeEmail = booking.payload.attendees[0]?.email;
  if (!attendeeEmail) {
    logger2.warn("No attendee email found in booking", { bookingId: booking.payload.bookingId });
    return;
  }
  const pageId = await findLeadByEmail(attendeeEmail);
  if (!pageId) {
    logger2.warn("Lead not found for email", { email: attendeeEmail });
    return;
  }
  await updateLeadWithBooking(pageId, booking);
  await sendSlackBookingConfirmation(attendeeEmail, booking);
  logger2.info("Booking confirmation handled successfully", {
    email: attendeeEmail,
    pageId,
    bookingId: booking.payload.bookingId
  });
}
async function handleBookingCancellation(booking) {
  logger2.info("Handling booking cancellation", {
    bookingId: booking.payload.bookingId
  });
  const attendeeEmail = booking.payload.attendees[0]?.email;
  if (!attendeeEmail) {
    logger2.warn("No attendee email found in booking", { bookingId: booking.payload.bookingId });
    return;
  }
  const pageId = await findLeadByEmail(attendeeEmail);
  if (!pageId) {
    logger2.warn("Lead not found for email", { email: attendeeEmail });
    return;
  }
  await updatePage(pageId, {
    Status: {
      select: {
        name: "accepted"
      }
    }
  });
  logger2.info("Booking cancellation handled", {
    email: attendeeEmail,
    pageId
  });
}
async function handleBookingRescheduled(booking) {
  logger2.info("Handling booking rescheduled", {
    bookingId: booking.payload.bookingId
  });
  const attendeeEmail = booking.payload.attendees[0]?.email;
  if (!attendeeEmail) {
    return;
  }
  const pageId = await findLeadByEmail(attendeeEmail);
  if (!pageId) {
    return;
  }
  await updateLeadWithBooking(pageId, booking);
  logger2.info("Booking rescheduled handled", {
    email: attendeeEmail,
    pageId
  });
}

// src/automations/lead-management/webhooks/calcom.ts
async function handleCalcomWebhook(c) {
  try {
    logger2.info("Cal.com webhook received", { automationId: "lead-management" });
    const body = await c.req.json();
    logger2.info("Cal.com webhook payload", {
      triggerEvent: body.triggerEvent,
      bookingId: body.payload?.bookingId
    });
    switch (body.triggerEvent) {
      case "BOOKING_CREATED":
        await handleBookingConfirmation(body);
        break;
      case "BOOKING_CANCELLED":
        await handleBookingCancellation(body);
        break;
      case "BOOKING_RESCHEDULED":
        await handleBookingRescheduled(body);
        break;
      default:
        logger2.warn("Unknown Cal.com event type", { triggerEvent: body.triggerEvent });
    }
    return c.json({
      success: true,
      message: "Booking event processed"
    });
  } catch (error2) {
    logger2.error("Error handling Cal.com webhook", error2);
    monitor.captureException(error2, {
      automationId: "lead-management",
      webhook: "calcom"
    });
    return c.json(
      {
        success: false,
        error: "Internal server error"
      },
      500
    );
  }
}

// src/automations/lead-management/webhooks/slack.ts
init_logger();

// src/shared/services/email.ts
init_config();
init_retry();
init_logger();
import nodemailer from "nodemailer";
var transporter = nodemailer.createTransport({
  host: config.email.smtp.host,
  port: config.email.smtp.port,
  secure: false,
  auth: {
    user: config.email.smtp.user,
    pass: config.email.smtp.pass
  }
});
async function sendEmail(to, subject, html, text) {
  logger2.info("Sending email", { to, subject });
  await withRetry(
    () => transporter.sendMail({
      from: `"${config.email.fromName}" <${config.email.from}>`,
      to,
      subject,
      html,
      text: text || html.replace(/<[^>]*>/g, "")
    })
  );
  logger2.info("Email sent successfully", { to });
}
async function sendTemplatedEmail(to, subject, templateData) {
  const { greeting, body, cta, footer } = templateData;
  const html = `
    <!DOCTYPE html>
    <html>
      <head>
        <meta charset="utf-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <style>
          body {
            font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif;
            line-height: 1.6;
            color: #333;
            max-width: 600px;
            margin: 0 auto;
            padding: 20px;
          }
          .greeting {
            font-size: 18px;
            margin-bottom: 20px;
          }
          .body {
            margin-bottom: 30px;
          }
          .cta {
            margin: 30px 0;
          }
          .cta a {
            display: inline-block;
            padding: 12px 24px;
            background-color: #0066cc;
            color: white;
            text-decoration: none;
            border-radius: 5px;
          }
          .footer {
            margin-top: 40px;
            padding-top: 20px;
            border-top: 1px solid #ddd;
            font-size: 14px;
            color: #666;
          }
        </style>
      </head>
      <body>
        ${greeting ? `<div class="greeting">${greeting}</div>` : ""}
        <div class="body">${body}</div>
        ${cta ? `<div class="cta"><a href="${cta.url}">${cta.text}</a></div>` : ""}
        ${footer ? `<div class="footer">${footer}</div>` : ""}
      </body>
    </html>
  `;
  return sendEmail(to, subject, html);
}

// src/automations/lead-management/workflows/accept-lead.ts
init_slack();
init_logger();
async function updateLeadStatus(pageId, status) {
  logger2.info("Updating lead status in Notion", { pageId, status });
  await updatePage(pageId, {
    Status: {
      select: {
        name: status
      }
    }
  });
  logger2.info("Lead status updated", { pageId, status });
}
async function getLeadEmail(pageId) {
  const page = await retrievePage(pageId);
  const properties = page.properties;
  const email = properties.Email?.email;
  if (!email) {
    throw new Error("Email not found in Notion page");
  }
  return email;
}
async function getLeadName(pageId) {
  const page = await retrievePage(pageId);
  const properties = page.properties;
  const titleProperty = properties.Name || properties.title;
  if (titleProperty?.title?.[0]?.text?.content) {
    return titleProperty.title[0].text.content;
  }
  return "there";
}
async function sendBookingLinkEmail(email, name = "there") {
  logger2.info("Sending booking link email", { email });
  await sendTemplatedEmail(email, "Let's schedule a discovery call!", {
    greeting: `Hi ${name},`,
    body: `
      <p>Thanks for reaching out! We'd love to learn more about your project.</p>
      <p>Please use the link below to schedule a discovery call at a time that works best for you:</p>
    `,
    cta: {
      text: "Schedule Discovery Call",
      url: config2.calcomLink
    },
    footer: "Looking forward to speaking with you!"
  });
  logger2.info("Booking link email sent", { email });
}
async function updateSlackMessage(channel, ts, status, acceptedBy) {
  logger2.info("Updating Slack message", { channel, ts, status });
  const emoji = status === "accepted" ? "\u2705" : "\u274C";
  const statusText = status === "accepted" ? "Accepted" : "Rejected";
  const byText = acceptedBy ? ` by ${acceptedBy}` : "";
  await updateMessage(
    channel,
    ts,
    `Lead ${statusText.toLowerCase()}${byText}`,
    [
      {
        type: "section",
        text: {
          type: "mrkdwn",
          text: `${emoji} *${statusText}*${byText}`
        }
      }
    ]
  );
  logger2.info("Slack message updated", { channel, ts, status });
}
async function acceptLead(pageId, acceptedBy) {
  logger2.info("Accepting lead", { pageId, acceptedBy });
  await updateLeadStatus(pageId, "accepted");
  const email = await getLeadEmail(pageId);
  const name = await getLeadName(pageId);
  await sendBookingLinkEmail(email, name);
  logger2.info("Lead accepted successfully", {
    pageId,
    email,
    acceptedBy
  });
}
async function rejectLead(pageId, rejectedBy) {
  logger2.info("Rejecting lead", { pageId, rejectedBy });
  await updateLeadStatus(pageId, "rejected");
  logger2.info("Lead rejected successfully", {
    pageId,
    rejectedBy
  });
}

// src/automations/lead-management/webhooks/slack.ts
async function handleSlackInteraction(c) {
  try {
    logger2.info("Slack interaction received", { automationId: "lead-management" });
    const body = await c.req.parseBody();
    const payloadStr = body.payload;
    if (!payloadStr) {
      logger2.warn("No payload in Slack interaction");
      return c.json({ error: "No payload" }, 400);
    }
    const payload = JSON.parse(payloadStr);
    logger2.info("Slack interaction payload", {
      type: payload.type,
      actionId: payload.actions?.[0]?.action_id,
      user: payload.user.username
    });
    if (payload.type === "block_actions" && payload.actions.length > 0) {
      const action = payload.actions[0];
      const pageId = action.value;
      const actionId = action.action_id;
      const userName = payload.user.name || payload.user.username;
      const channel = payload.container.channel_id;
      const messageTs = payload.container.message_ts;
      if (actionId === "accept_lead") {
        await acceptLead(pageId, userName);
        await updateSlackMessage(channel, messageTs, "accepted", userName);
        logger2.info("Lead accepted", { pageId, userName });
        return c.json({
          response_type: "in_channel",
          replace_original: false,
          text: `\u2705 Lead accepted by ${userName}. Booking link sent!`
        });
      } else if (actionId === "reject_lead") {
        await rejectLead(pageId, userName);
        await updateSlackMessage(channel, messageTs, "rejected", userName);
        logger2.info("Lead rejected", { pageId, userName });
        return c.json({
          response_type: "in_channel",
          replace_original: false,
          text: `\u274C Lead rejected by ${userName}.`
        });
      }
    }
    return c.json({ success: true });
  } catch (error2) {
    logger2.error("Error handling Slack interaction", error2);
    monitor.captureException(error2, {
      automationId: "lead-management",
      webhook: "slack"
    });
    return c.json(
      {
        success: false,
        error: "Internal server error"
      },
      500
    );
  }
}

// src/automations/lead-management/webhooks/test.ts
init_logger();
async function handleTestWebhook(c) {
  try {
    logger2.info("Test webhook received", { automationId: "lead-management" });
    const body = await c.req.json();
    if (!body.from || !body.subject || !body.body) {
      return c.json({ success: false, error: "Missing required fields: from, subject, body" }, 400);
    }
    const emailData = {
      from: body.from,
      subject: body.subject,
      body: body.body
    };
    await processLead(emailData);
    return c.json({
      success: true,
      message: "Test lead processed successfully"
    });
  } catch (error2) {
    logger2.error("Error processing test lead", error2);
    monitor.captureException(error2, { automationId: "lead-management" });
    return c.json(
      {
        success: false,
        error: "Failed to process test lead",
        details: error2 instanceof Error ? error2.message : "Unknown error"
      },
      500
    );
  }
}

// src/automations/lead-management/webhooks/notion-marketplace.ts
init_logger();

// src/shared/services/attio.ts
init_config();
init_logger();
init_retry();
var ATTIO_API_BASE = "https://api.attio.com/v2";
async function attioRequest(endpoint, options = {}) {
  const url = `${ATTIO_API_BASE}${endpoint}`;
  const response = await fetch(url, {
    ...options,
    headers: {
      "Authorization": `Bearer ${config.attio.apiKey}`,
      "Content-Type": "application/json",
      ...options.headers
    }
  });
  if (!response.ok) {
    const error2 = await response.text();
    throw new Error(`Attio API error (${response.status}): ${error2}`);
  }
  return response.json();
}
async function assertCompany(name, domain) {
  logger2.info("Asserting company in Attio", { name, domain });
  const data = {
    data: {
      values: {
        name: [{ value: name }],
        ...domain && {
          domains: [{ domain }]
        }
      }
    }
  };
  const matchingAttribute = domain ? "domains" : "name";
  return withRetry(async () => {
    const response = await attioRequest(
      `/objects/companies/records?matching_attribute=${matchingAttribute}`,
      {
        method: "PUT",
        body: JSON.stringify(data)
      }
    );
    const recordId = response.data.id.record_id;
    logger2.info("Company asserted in Attio", { name, recordId });
    return recordId;
  });
}
async function assertPerson(name, email, companyId) {
  logger2.info("Asserting person in Attio", { name, email });
  const nameParts = name.split(" ");
  const firstName = nameParts[0] || name;
  const lastName = nameParts.slice(1).join(" ") || "";
  const data = {
    data: {
      values: {
        email_addresses: [{ email_address: email }],
        name: [
          {
            first_name: firstName,
            last_name: lastName,
            full_name: name
          }
        ]
        // Note: Company relation needs to be set via a specific company field
        // which varies by Attio workspace setup. Skipping for now.
      }
    }
  };
  return withRetry(async () => {
    const response = await attioRequest(
      "/objects/people/records?matching_attribute=email_addresses",
      {
        method: "PUT",
        body: JSON.stringify(data)
      }
    );
    const recordId = response.data.id.record_id;
    logger2.info("Person asserted in Attio", { name, email, recordId });
    return recordId;
  });
}
async function addToListWithAttributes(listId, recordId, attributes) {
  logger2.info("Adding record to Attio list", { listId, recordId, attributes });
  const data = {
    data: {
      parent_object: "people",
      parent_record_id: recordId,
      entry_values: {
        template_purchased: [
          {
            option: attributes.templatePurchased
          }
        ],
        date_purchased: [
          {
            value: attributes.datePurchased.toISOString()
          }
        ]
      }
    }
  };
  return withRetry(async () => {
    await attioRequest(`/lists/${listId}/entries`, {
      method: "POST",
      body: JSON.stringify(data)
    });
    logger2.info("Record added to Attio list", { listId, recordId });
  });
}

// node_modules/resend/dist/index.mjs
var import_svix = __toESM(require_dist(), 1);
var __defProp2 = Object.defineProperty;
var __defProps = Object.defineProperties;
var __getOwnPropDescs = Object.getOwnPropertyDescriptors;
var __getOwnPropSymbols = Object.getOwnPropertySymbols;
var __hasOwnProp2 = Object.prototype.hasOwnProperty;
var __propIsEnum = Object.prototype.propertyIsEnumerable;
var __defNormalProp = (obj, key, value) => key in obj ? __defProp2(obj, key, { enumerable: true, configurable: true, writable: true, value }) : obj[key] = value;
var __spreadValues = (a, b) => {
  for (var prop in b || (b = {}))
    if (__hasOwnProp2.call(b, prop))
      __defNormalProp(a, prop, b[prop]);
  if (__getOwnPropSymbols)
    for (var prop of __getOwnPropSymbols(b)) {
      if (__propIsEnum.call(b, prop))
        __defNormalProp(a, prop, b[prop]);
    }
  return a;
};
var __spreadProps = (a, b) => __defProps(a, __getOwnPropDescs(b));
var __objRest = (source, exclude) => {
  var target = {};
  for (var prop in source)
    if (__hasOwnProp2.call(source, prop) && exclude.indexOf(prop) < 0)
      target[prop] = source[prop];
  if (source != null && __getOwnPropSymbols)
    for (var prop of __getOwnPropSymbols(source)) {
      if (exclude.indexOf(prop) < 0 && __propIsEnum.call(source, prop))
        target[prop] = source[prop];
    }
  return target;
};
var version2 = "6.2.2";
function buildPaginationQuery(options) {
  const searchParams = new URLSearchParams();
  if (options.limit !== void 0) {
    searchParams.set("limit", options.limit.toString());
  }
  if ("after" in options && options.after !== void 0) {
    searchParams.set("after", options.after);
  }
  if ("before" in options && options.before !== void 0) {
    searchParams.set("before", options.before);
  }
  return searchParams.toString();
}
var ApiKeys = class {
  constructor(resend2) {
    this.resend = resend2;
  }
  async create(payload, options = {}) {
    const data = await this.resend.post(
      "/api-keys",
      payload,
      options
    );
    return data;
  }
  async list(options = {}) {
    const queryString = buildPaginationQuery(options);
    const url = queryString ? `/api-keys?${queryString}` : "/api-keys";
    const data = await this.resend.get(url);
    return data;
  }
  async remove(id) {
    const data = await this.resend.delete(
      `/api-keys/${id}`
    );
    return data;
  }
};
var Audiences = class {
  constructor(resend2) {
    this.resend = resend2;
  }
  async create(payload, options = {}) {
    const data = await this.resend.post(
      "/audiences",
      payload,
      options
    );
    return data;
  }
  async list(options = {}) {
    const queryString = buildPaginationQuery(options);
    const url = queryString ? `/audiences?${queryString}` : "/audiences";
    const data = await this.resend.get(url);
    return data;
  }
  async get(id) {
    const data = await this.resend.get(
      `/audiences/${id}`
    );
    return data;
  }
  async remove(id) {
    const data = await this.resend.delete(
      `/audiences/${id}`
    );
    return data;
  }
};
function parseAttachments(attachments) {
  return attachments == null ? void 0 : attachments.map((attachment) => ({
    content: attachment.content,
    filename: attachment.filename,
    path: attachment.path,
    content_type: attachment.contentType,
    content_id: attachment.contentId
  }));
}
function parseEmailToApiOptions(email) {
  return {
    attachments: parseAttachments(email.attachments),
    bcc: email.bcc,
    cc: email.cc,
    from: email.from,
    headers: email.headers,
    html: email.html,
    reply_to: email.replyTo,
    scheduled_at: email.scheduledAt,
    subject: email.subject,
    tags: email.tags,
    text: email.text,
    to: email.to
  };
}
async function render(node) {
  let render2;
  try {
    ({ render: render2 } = await import("@react-email/render"));
  } catch (e) {
    throw new Error(
      "Failed to render React component. Make sure to install `@react-email/render` or `@react-email/components`."
    );
  }
  return render2(node);
}
var Batch = class {
  constructor(resend2) {
    this.resend = resend2;
  }
  async send(payload, options) {
    return this.create(payload, options);
  }
  async create(payload, options) {
    var _a;
    const emails = [];
    for (const email of payload) {
      if (email.react) {
        email.html = await render(email.react);
        email.react = void 0;
      }
      emails.push(parseEmailToApiOptions(email));
    }
    const data = await this.resend.post(
      "/emails/batch",
      emails,
      __spreadProps(__spreadValues({}, options), {
        headers: __spreadValues({
          "x-batch-validation": (_a = options == null ? void 0 : options.batchValidation) != null ? _a : "strict"
        }, options == null ? void 0 : options.headers)
      })
    );
    return data;
  }
};
var Broadcasts = class {
  constructor(resend2) {
    this.resend = resend2;
  }
  async create(payload, options = {}) {
    if (payload.react) {
      payload.html = await render(payload.react);
    }
    const data = await this.resend.post(
      "/broadcasts",
      {
        name: payload.name,
        audience_id: payload.audienceId,
        preview_text: payload.previewText,
        from: payload.from,
        html: payload.html,
        reply_to: payload.replyTo,
        subject: payload.subject,
        text: payload.text
      },
      options
    );
    return data;
  }
  async send(id, payload) {
    const data = await this.resend.post(
      `/broadcasts/${id}/send`,
      { scheduled_at: payload == null ? void 0 : payload.scheduledAt }
    );
    return data;
  }
  async list(options = {}) {
    const queryString = buildPaginationQuery(options);
    const url = queryString ? `/broadcasts?${queryString}` : "/broadcasts";
    const data = await this.resend.get(url);
    return data;
  }
  async get(id) {
    const data = await this.resend.get(
      `/broadcasts/${id}`
    );
    return data;
  }
  async remove(id) {
    const data = await this.resend.delete(
      `/broadcasts/${id}`
    );
    return data;
  }
  async update(id, payload) {
    if (payload.react) {
      payload.html = await render(payload.react);
    }
    const data = await this.resend.patch(
      `/broadcasts/${id}`,
      {
        name: payload.name,
        audience_id: payload.audienceId,
        from: payload.from,
        html: payload.html,
        text: payload.text,
        subject: payload.subject,
        reply_to: payload.replyTo,
        preview_text: payload.previewText
      }
    );
    return data;
  }
};
var Contacts = class {
  constructor(resend2) {
    this.resend = resend2;
  }
  async create(payload, options = {}) {
    const data = await this.resend.post(
      `/audiences/${payload.audienceId}/contacts`,
      {
        unsubscribed: payload.unsubscribed,
        email: payload.email,
        first_name: payload.firstName,
        last_name: payload.lastName
      },
      options
    );
    return data;
  }
  async list(options) {
    const _a = options, { audienceId } = _a, paginationOptions = __objRest(_a, ["audienceId"]);
    const queryString = buildPaginationQuery(paginationOptions);
    const url = queryString ? `/audiences/${audienceId}/contacts?${queryString}` : `/audiences/${audienceId}/contacts`;
    const data = await this.resend.get(url);
    return data;
  }
  async get(options) {
    if (!options.id && !options.email) {
      return {
        data: null,
        error: {
          message: "Missing `id` or `email` field.",
          statusCode: null,
          name: "missing_required_field"
        }
      };
    }
    const data = await this.resend.get(
      `/audiences/${options.audienceId}/contacts/${(options == null ? void 0 : options.email) ? options == null ? void 0 : options.email : options == null ? void 0 : options.id}`
    );
    return data;
  }
  async update(options) {
    if (!options.id && !options.email) {
      return {
        data: null,
        error: {
          message: "Missing `id` or `email` field.",
          statusCode: null,
          name: "missing_required_field"
        }
      };
    }
    const data = await this.resend.patch(
      `/audiences/${options.audienceId}/contacts/${(options == null ? void 0 : options.email) ? options == null ? void 0 : options.email : options == null ? void 0 : options.id}`,
      {
        unsubscribed: options.unsubscribed,
        first_name: options.firstName,
        last_name: options.lastName
      }
    );
    return data;
  }
  async remove(payload) {
    if (!payload.id && !payload.email) {
      return {
        data: null,
        error: {
          message: "Missing `id` or `email` field.",
          statusCode: null,
          name: "missing_required_field"
        }
      };
    }
    const data = await this.resend.delete(
      `/audiences/${payload.audienceId}/contacts/${(payload == null ? void 0 : payload.email) ? payload == null ? void 0 : payload.email : payload == null ? void 0 : payload.id}`
    );
    return data;
  }
};
function parseDomainToApiOptions(domain) {
  return {
    name: domain.name,
    region: domain.region,
    custom_return_path: domain.customReturnPath
  };
}
var Domains = class {
  constructor(resend2) {
    this.resend = resend2;
  }
  async create(payload, options = {}) {
    const data = await this.resend.post(
      "/domains",
      parseDomainToApiOptions(payload),
      options
    );
    return data;
  }
  async list(options = {}) {
    const queryString = buildPaginationQuery(options);
    const url = queryString ? `/domains?${queryString}` : "/domains";
    const data = await this.resend.get(url);
    return data;
  }
  async get(id) {
    const data = await this.resend.get(
      `/domains/${id}`
    );
    return data;
  }
  async update(payload) {
    const data = await this.resend.patch(
      `/domains/${payload.id}`,
      {
        click_tracking: payload.clickTracking,
        open_tracking: payload.openTracking,
        tls: payload.tls
      }
    );
    return data;
  }
  async remove(id) {
    const data = await this.resend.delete(
      `/domains/${id}`
    );
    return data;
  }
  async verify(id) {
    const data = await this.resend.post(
      `/domains/${id}/verify`
    );
    return data;
  }
};
var Emails = class {
  constructor(resend2) {
    this.resend = resend2;
  }
  async send(payload, options = {}) {
    return this.create(payload, options);
  }
  async create(payload, options = {}) {
    if (payload.react) {
      payload.html = await render(payload.react);
    }
    const data = await this.resend.post(
      "/emails",
      parseEmailToApiOptions(payload),
      options
    );
    return data;
  }
  async get(id) {
    const data = await this.resend.get(
      `/emails/${id}`
    );
    return data;
  }
  async list(options = {}) {
    const queryString = buildPaginationQuery(options);
    const url = queryString ? `/emails?${queryString}` : "/emails";
    const data = await this.resend.get(url);
    return data;
  }
  async update(payload) {
    const data = await this.resend.patch(
      `/emails/${payload.id}`,
      {
        scheduled_at: payload.scheduledAt
      }
    );
    return data;
  }
  async cancel(id) {
    const data = await this.resend.post(
      `/emails/${id}/cancel`
    );
    return data;
  }
};
var Webhooks = class {
  verify(payload) {
    const webhook = new import_svix.Webhook(payload.webhookSecret);
    return webhook.verify(payload.payload, {
      "svix-id": payload.headers.id,
      "svix-timestamp": payload.headers.timestamp,
      "svix-signature": payload.headers.signature
    });
  }
};
var defaultBaseUrl = "https://api.resend.com";
var defaultUserAgent = `resend-node:${version2}`;
var baseUrl = typeof process !== "undefined" && process.env ? process.env.RESEND_BASE_URL || defaultBaseUrl : defaultBaseUrl;
var userAgent = typeof process !== "undefined" && process.env ? process.env.RESEND_USER_AGENT || defaultUserAgent : defaultUserAgent;
var Resend = class {
  constructor(key) {
    this.key = key;
    this.apiKeys = new ApiKeys(this);
    this.audiences = new Audiences(this);
    this.batch = new Batch(this);
    this.broadcasts = new Broadcasts(this);
    this.contacts = new Contacts(this);
    this.domains = new Domains(this);
    this.emails = new Emails(this);
    this.webhooks = new Webhooks();
    if (!key) {
      if (typeof process !== "undefined" && process.env) {
        this.key = process.env.RESEND_API_KEY;
      }
      if (!this.key) {
        throw new Error(
          'Missing API key. Pass it to the constructor `new Resend("re_123")`'
        );
      }
    }
    this.headers = new Headers({
      Authorization: `Bearer ${this.key}`,
      "User-Agent": userAgent,
      "Content-Type": "application/json"
    });
  }
  async fetchRequest(path, options = {}) {
    try {
      const response = await fetch(`${baseUrl}${path}`, options);
      if (!response.ok) {
        try {
          const rawError = await response.text();
          return { data: null, error: JSON.parse(rawError) };
        } catch (err) {
          if (err instanceof SyntaxError) {
            return {
              data: null,
              error: {
                name: "application_error",
                statusCode: response.status,
                message: "Internal server error. We are unable to process your request right now, please try again later."
              }
            };
          }
          const error2 = {
            message: response.statusText,
            statusCode: response.status,
            name: "application_error"
          };
          if (err instanceof Error) {
            return { data: null, error: __spreadProps(__spreadValues({}, error2), { message: err.message }) };
          }
          return { data: null, error: error2 };
        }
      }
      const data = await response.json();
      return { data, error: null };
    } catch (e) {
      return {
        data: null,
        error: {
          name: "application_error",
          statusCode: null,
          message: "Unable to fetch data. The request could not be resolved."
        }
      };
    }
  }
  async post(path, entity, options = {}) {
    const headers = new Headers(this.headers);
    if (options.headers) {
      for (const [key, value] of new Headers(options.headers).entries()) {
        headers.set(key, value);
      }
    }
    if (options.idempotencyKey) {
      headers.set("Idempotency-Key", options.idempotencyKey);
    }
    const requestOptions = __spreadProps(__spreadValues({
      method: "POST",
      body: JSON.stringify(entity)
    }, options), {
      headers
    });
    return this.fetchRequest(path, requestOptions);
  }
  async get(path, options = {}) {
    const headers = new Headers(this.headers);
    if (options.headers) {
      for (const [key, value] of new Headers(options.headers).entries()) {
        headers.set(key, value);
      }
    }
    const requestOptions = __spreadProps(__spreadValues({
      method: "GET"
    }, options), {
      headers
    });
    return this.fetchRequest(path, requestOptions);
  }
  async put(path, entity, options = {}) {
    const headers = new Headers(this.headers);
    if (options.headers) {
      for (const [key, value] of new Headers(options.headers).entries()) {
        headers.set(key, value);
      }
    }
    const requestOptions = __spreadProps(__spreadValues({
      method: "PUT",
      body: JSON.stringify(entity)
    }, options), {
      headers
    });
    return this.fetchRequest(path, requestOptions);
  }
  async patch(path, entity, options = {}) {
    const headers = new Headers(this.headers);
    if (options.headers) {
      for (const [key, value] of new Headers(options.headers).entries()) {
        headers.set(key, value);
      }
    }
    const requestOptions = __spreadProps(__spreadValues({
      method: "PATCH",
      body: JSON.stringify(entity)
    }, options), {
      headers
    });
    return this.fetchRequest(path, requestOptions);
  }
  async delete(path, query) {
    const requestOptions = {
      method: "DELETE",
      body: JSON.stringify(query),
      headers: this.headers
    };
    return this.fetchRequest(path, requestOptions);
  }
};

// src/shared/services/resend.ts
init_config();
init_logger();
init_retry();
var resend = new Resend(config.resend.apiKey);
async function sendWelcomeEmail(email, name, templateName) {
  logger2.info("Sending welcome email", { email, templateName });
  if (!config.resend.fromEmail) {
    throw new Error("RESEND_FROM_EMAIL environment variable is not set");
  }
  const emailContent = generateWelcomeEmail(name, templateName);
  return withRetry(async () => {
    const { data, error: error2 } = await resend.emails.send({
      from: config.resend.fromEmail,
      to: [email],
      ...config.resend.replyTo && { reply_to: config.resend.replyTo },
      subject: `Welcome! Your ${templateName} is ready`,
      html: emailContent
    });
    if (error2) {
      throw new Error(`Failed to send email: ${error2.message}`);
    }
    logger2.info("Welcome email sent", { email, emailId: data?.id });
    return { id: data.id };
  });
}
function generateWelcomeEmail(name, templateName) {
  const firstName = name.split(" ")[0] || name;
  return `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Welcome to ${templateName}</title>
</head>
<body style="margin: 0; padding: 0; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif; background-color: #f5f5f5;">
  <table width="100%" cellpadding="0" cellspacing="0" style="max-width: 600px; margin: 40px auto; background-color: #ffffff; border-radius: 8px; overflow: hidden; box-shadow: 0 2px 8px rgba(0,0,0,0.1);">
    <tr>
      <td style="padding: 40px 40px 20px;">
        <h1 style="margin: 0 0 20px; font-size: 28px; font-weight: 600; color: #000000;">
          Thanks for your purchase, ${firstName}! \u{1F389}
        </h1>
        <p style="margin: 0 0 20px; font-size: 16px; line-height: 1.6; color: #333333;">
          We're excited to see you got <strong>${templateName}</strong> from the Notion Marketplace.
        </p>
        <p style="margin: 0 0 20px; font-size: 16px; line-height: 1.6; color: #333333;">
          Your template should already be available in your Notion workspace and ready to use.
        </p>
        <p style="margin: 0 0 30px; font-size: 16px; line-height: 1.6; color: #333333;">
          If you have any questions or need help getting started, feel free to reach out!
        </p>
        <p style="margin: 0; font-size: 14px; color: #666666;">
          Best regards,<br>
          The Team
        </p>
      </td>
    </tr>
    <tr>
      <td style="padding: 20px 40px; background-color: #f9f9f9; border-top: 1px solid #eeeeee;">
        <p style="margin: 0; font-size: 12px; color: #999999; line-height: 1.5;">
          This email was sent because you purchased a template from the Notion Marketplace.
        </p>
      </td>
    </tr>
  </table>
</body>
</html>
  `.trim();
}

// src/automations/lead-management/webhooks/notion-marketplace.ts
init_config();
function extractCompanyFromEmail(email) {
  const domain = email.split("@")[1]?.toLowerCase();
  if (!domain) return void 0;
  const consumerDomains = [
    "gmail.com",
    "yahoo.com",
    "hotmail.com",
    "outlook.com",
    "icloud.com",
    "aol.com",
    "protonmail.com",
    "mail.com"
  ];
  if (consumerDomains.includes(domain)) {
    return void 0;
  }
  const companyName = domain.split(".")[0].split("-").map((word) => word.charAt(0).toUpperCase() + word.slice(1)).join(" ");
  return companyName;
}
function extractNameFromEmail(email) {
  const localPart = email.split("@")[0];
  const name = localPart.replace(/[._-]/g, " ").split(" ").map((word) => word.charAt(0).toUpperCase() + word.slice(1)).join(" ");
  return name || email;
}
async function handleNotionMarketplaceWebhook(c) {
  try {
    const body = await c.req.json();
    logger2.info("Received Notion Marketplace purchase", {
      acquisitionId: body.acquisitionId,
      email: body.customerEmail,
      template: body.templateName
    });
    if (!body.customerEmail || !body.templateName) {
      return c.json({
        success: false,
        error: "Missing required fields: customerEmail, templateName"
      }, 400);
    }
    const email = body.customerEmail.toLowerCase();
    const name = extractNameFromEmail(email);
    const companyName = extractCompanyFromEmail(email);
    const purchaseDate = new Date(body.time);
    logger2.info("Processing marketplace purchase", {
      email,
      name,
      companyName,
      template: body.templateName
    });
    let notionCompanyId;
    if (companyName) {
      notionCompanyId = await findOrCreateCompany(companyName);
    }
    const notionContactId = await findOrCreateContact(
      name,
      email,
      notionCompanyId
    );
    let attioCompanyId;
    let attioPersonId;
    let attioError;
    try {
      logger2.info("Starting Attio sync", {
        hasApiKey: !!config.attio.apiKey,
        hasListId: !!config.attio.marketplaceListId,
        listId: config.attio.marketplaceListId
      });
      if (companyName) {
        const domain = email.split("@")[1];
        logger2.info("Creating company in Attio", { companyName, domain });
        attioCompanyId = await assertCompany(companyName, domain);
        logger2.info("Company created in Attio", { attioCompanyId });
      }
      logger2.info("Creating person in Attio", { name, email, attioCompanyId });
      attioPersonId = await assertPerson(name, email, attioCompanyId);
      logger2.info("Person created in Attio", { attioPersonId });
      logger2.info("Adding to Notion Marketplace list", {
        listId: config.attio.marketplaceListId,
        personId: attioPersonId,
        templateName: body.templateName
      });
      await addToListWithAttributes(
        config.attio.marketplaceListId,
        attioPersonId,
        {
          templatePurchased: body.templateName,
          datePurchased: purchaseDate
        }
      );
      logger2.info("Successfully synced to Attio", {
        attioPersonId,
        attioCompanyId,
        addedToList: true
      });
    } catch (error2) {
      attioError = error2.message || String(error2);
      logger2.error("Failed to sync to Attio", {
        error: error2.message,
        stack: error2.stack,
        email
      });
    }
    let emailSent = false;
    let emailError;
    try {
      logger2.info("Sending welcome email", {
        hasApiKey: !!config.resend.apiKey,
        hasFromEmail: !!config.resend.fromEmail,
        to: email
      });
      await sendWelcomeEmail(email, name, body.templateName);
      emailSent = true;
      logger2.info("Welcome email sent successfully");
    } catch (error2) {
      emailError = error2.message || String(error2);
      logger2.error("Failed to send welcome email", {
        error: error2.message,
        stack: error2.stack,
        email
      });
    }
    return c.json({
      success: true,
      message: "Marketplace purchase processed successfully",
      data: {
        acquisitionId: body.acquisitionId,
        contactId: notionContactId,
        companyId: notionCompanyId,
        attioPersonId,
        attioCompanyId,
        emailSent
      },
      debug: {
        attioError,
        emailError,
        hasAttioApiKey: !!config.attio.apiKey,
        hasResendApiKey: !!config.resend.apiKey,
        attioListId: config.attio.marketplaceListId
      }
    });
  } catch (error2) {
    logger2.error("Failed to process marketplace purchase", {
      error: error2.message,
      stack: error2.stack
    });
    return c.json({
      success: false,
      error: "Failed to process marketplace purchase",
      details: error2.message
    }, 500);
  }
}

// src/shared/middleware/auth.ts
init_config();
init_logger();
import { createHmac, timingSafeEqual } from "crypto";
function verifyCalcomSignature(secret) {
  return async (c, next) => {
    const signature = c.req.header("x-cal-signature-256");
    const body = await c.req.text();
    if (!signature) {
      logger2.warn("Missing Cal.com signature");
      return c.json({ error: "Unauthorized" }, 401);
    }
    const hmac = createHmac("sha256", secret);
    hmac.update(body);
    const expectedSignature = hmac.digest("hex");
    if (signature !== expectedSignature) {
      logger2.warn("Invalid Cal.com signature");
      return c.json({ error: "Invalid signature" }, 401);
    }
    c.set("body", body);
    await next();
  };
}

// src/automations/lead-management/index.ts
function setup(app2) {
  const base = "/automations/lead-management";
  app2.post(`${base}/webhooks/gmail`, handleGmailWebhook);
  app2.post(`${base}/webhooks/test`, handleTestWebhook);
  app2.post(`${base}/webhooks/notion-marketplace`, handleNotionMarketplaceWebhook);
  if (config2.calcomWebhookSecret) {
    app2.post(
      `${base}/webhooks/calcom`,
      verifyCalcomSignature(config2.calcomWebhookSecret),
      handleCalcomWebhook
    );
  } else {
    app2.post(`${base}/webhooks/calcom`, handleCalcomWebhook);
  }
  app2.post(`${base}/webhooks/slack`, handleSlackInteraction);
  app2.get(`${base}/health`, (c) => {
    return c.json({
      automation: "lead-management",
      status: "ok",
      config: {
        notionDatabase: config2.notionDatabase,
        slackChannel: config2.slackChannel,
        minimumBudget: config2.features.minimumBudget,
        autoAccept: config2.features.autoAccept
      },
      timestamp: (/* @__PURE__ */ new Date()).toISOString()
    });
  });
}
var leadManagementAutomation = {
  id: "lead-management",
  name: "Lead Management",
  description: "Automated lead processing from email to booking",
  enabled: process.env.LEAD_ENABLED !== "false",
  baseRoute: "/automations/lead-management",
  setup
};

// src/core/automation-registry.ts
var automations = [
  leadManagementAutomation
  // invoiceAutomation,
];
function getEnabledAutomations() {
  return automations.filter((a) => a.enabled);
}

// src/app.ts
init_logger();
monitor.initMonitoring();
var app = new Hono2();
app.use("*", cors());
app.use("*", logger());
app.get("/", (c) => {
  const enabledAutomations2 = getEnabledAutomations();
  return c.json({
    status: "ok",
    service: "automation-platform",
    version: "1.0.0",
    environment: config.env,
    automations: enabledAutomations2.map((a) => ({
      id: a.id,
      name: a.name,
      route: a.baseRoute
    })),
    timestamp: (/* @__PURE__ */ new Date()).toISOString()
  });
});
app.get("/automations", (c) => {
  const enabledAutomations2 = getEnabledAutomations();
  return c.json({
    automations: enabledAutomations2.map((a) => ({
      id: a.id,
      name: a.name,
      description: a.description,
      baseRoute: a.baseRoute
    }))
  });
});
logger2.info("Registering automations...");
var enabledAutomations = getEnabledAutomations();
for (const automation of enabledAutomations) {
  logger2.info(`Registering: ${automation.name}`, {
    automationId: automation.id,
    route: automation.baseRoute
  });
  automation.setup(app);
}
logger2.info(`${enabledAutomations.length} automations registered`);
app.notFound((c) => {
  return c.json({ error: "Not found" }, 404);
});
app.onError((err, c) => {
  logger2.error("Unhandled error", err);
  monitor.captureException(err);
  return c.json(
    {
      error: "Internal server error",
      message: config.env === "development" ? err.message : void 0
    },
    500
  );
});
if (config.env === "development") {
  const port = config.port;
  console.log(`
\u2554\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2557
\u2551                                                            \u2551
\u2551  \u{1F680}  Multi-Automation Platform                             \u2551
\u2551                                                            \u2551
\u2551  Server: http://localhost:${port}                        \u2551
\u2551  Environment: ${config.env}                              \u2551
\u2551                                                            \u2551
\u2551  Enabled Automations:                                      \u2551
${enabledAutomations.map((a) => `\u2551    \u2022 ${a.name.padEnd(50)}  \u2551`).join("\n")}
\u2551                                                            \u2551
\u255A\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u255D
  `);
}
var app_default = app;

// api/_entry.ts
async function handler(req, res) {
  const request = new Request(new URL(req.url || "/", `https://${req.headers.host}`), {
    method: req.method,
    headers: req.headers,
    body: req.method !== "GET" && req.method !== "HEAD" ? JSON.stringify(req.body) : void 0
  });
  const response = await app_default.fetch(request);
  res.status(response.status);
  response.headers.forEach((value, key) => {
    res.setHeader(key, value);
  });
  const text = await response.text();
  res.send(text);
}
export {
  handler as default
};
//# sourceMappingURL=index.mjs.map
