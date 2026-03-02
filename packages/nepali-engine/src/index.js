import { createRequire } from "node:module";
import { preetiToUnicode } from "preeti2unicode/src/index.js";

export const PREETI = "ne-preeti";
export const UNICODE = "ne-unicode";

const PREETI_HINT = /[\/\\\]\[\}\{!@#$%^&*()_+=;:'",.<>?`~A-Za-z]/;
const DEVANAGARI_HINT = /[\u0900-\u097F]/;
const REPHA_PATTERN = /\u0930\u094d((?:.\u094d)*.)/g;
const SHORT_I_PATTERN = /((?:.\u094d)*.)\u093f/g;

const require = createRequire(import.meta.url);
const preetiRules = require("preeti2unicode/src/rules.js").preeti;

const scorePreetiKey = (value) => {
  const isAsciiPrintable = /^[\x20-\x7E]+$/.test(value);
  return [isAsciiPrintable ? 0 : 1, value.length];
};

const reverseCharMap = (() => {
  const entries = new Map();

  for (const [preeti, unicode] of Object.entries(preetiRules["char-map"])) {
    if (typeof unicode !== "string" || !unicode) {
      continue;
    }

    const current = entries.get(unicode);

    if (!current) {
      entries.set(unicode, preeti);
      continue;
    }

    const currentScore = scorePreetiKey(current);
    const nextScore = scorePreetiKey(preeti);

    if (nextScore[0] < currentScore[0] || (nextScore[0] === currentScore[0] && nextScore[1] < currentScore[1])) {
      entries.set(unicode, preeti);
    }
  }

  return [...entries.entries()].sort((left, right) => right[0].length - left[0].length);
})();

const createResult = (text, warnings = [], sourceEncoding = "unknown", targetEncoding = "unknown") => ({
  text,
  warnings,
  sourceEncoding,
  targetEncoding
});

export const detectEncoding = (text) => {
  if (!text || !text.trim()) {
    return "unknown";
  }

  if (DEVANAGARI_HINT.test(text)) {
    return "unicode";
  }

  if (PREETI_HINT.test(text)) {
    return "preeti";
  }

  return "unknown";
};

export const convertPreetiToUnicode = (text) => {
  try {
    return createResult(preetiToUnicode(text), [], "preeti", "unicode");
  } catch (error) {
    return createResult(text, [error instanceof Error ? error.message : "Preeti conversion failed."], "preeti", "unicode");
  }
};

const prepareUnicodeForPreeti = (text) =>
  text
    .replace(REPHA_PATTERN, "$1{")
    .replace(SHORT_I_PATTERN, "\u093f$1")
    .replace(/\u0913/g, "\u0906\u0947")
    .replace(/\u0914/g, "\u0906\u0948")
    .replace(/\u0906/g, "\u0905\u093e")
    .replace(/\u0910/g, "\u090f\u0947")
    .replace(/\u094c/g, "\u093e\u0948")
    .replace(/\u094b/g, "\u093e\u0947");

const unicodeToPreetiWithRules = (text) => {
  let output = prepareUnicodeForPreeti(text);

  for (const [unicode, preeti] of reverseCharMap) {
    output = output.split(unicode).join(preeti);
  }

  return output;
};

export const convertUnicodeToPreeti = (text) => {
  try {
    return createResult(unicodeToPreetiWithRules(text), [], "unicode", "preeti");
  } catch (error) {
    return createResult(text, [error instanceof Error ? error.message : "Unicode conversion failed."], "unicode", "preeti");
  }
};

export const normalizeToUnicode = (text, encodingHint = detectEncoding(text)) =>
  encodingHint === "preeti" ? convertPreetiToUnicode(text) : createResult(text, [], "unicode", "unicode");

export const convertBetweenVariants = (text, fromVariant, toVariant) => {
  if (fromVariant === toVariant) {
    return createResult(text, [], fromVariant, toVariant);
  }

  if (fromVariant === PREETI && toVariant === UNICODE) {
    return convertPreetiToUnicode(text);
  }

  if (fromVariant === UNICODE && toVariant === PREETI) {
    return convertUnicodeToPreeti(text);
  }

  if (fromVariant === PREETI) {
    const unicodeResult = convertPreetiToUnicode(text);
    if (toVariant === "en") {
      return createResult(unicodeResult.text, unicodeResult.warnings, PREETI, UNICODE);
    }

    return unicodeResult;
  }

  if (toVariant === PREETI) {
    return convertUnicodeToPreeti(text);
  }

  return createResult(text, [], fromVariant, toVariant);
};
