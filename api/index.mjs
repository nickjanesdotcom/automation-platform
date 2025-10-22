var __defProp = Object.defineProperty;
var __getOwnPropNames = Object.getOwnPropertyNames;
var __esm = (fn, res) => function __init() {
  return fn && (res = (0, fn[__getOwnPropNames(fn)[0]])(fn = 0)), res;
};
var __export = (target, all) => {
  for (var name in all)
    __defProp(target, name, { get: all[name], enumerable: true });
};

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
  try {
    properties.Status = {
      select: {
        name: "Active"
      }
    };
  } catch (e) {
  }
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
    Status: {
      status: {
        name: "Lead"
        // Default status
      }
    }
  };
  if (companyId) {
    properties.Company = {
      relation: [{ id: companyId }]
    };
  }
  if (contactId) {
    properties.Contact = {
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
