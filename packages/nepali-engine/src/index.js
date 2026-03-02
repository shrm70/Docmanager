import { preetiToUnicode } from "preeti2unicode/src/index.js";
import { unicodeToPreeti } from "unicode-to-preeti";

export const PREETI = "ne-preeti";
export const UNICODE = "ne-unicode";

const PREETI_HINT = /[\/\\\]\[\}\{!@#$%^&*()_+=;:'",.<>?`~A-Za-z]/;
const DEVANAGARI_HINT = /[\u0900-\u097F]/;

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

export const convertUnicodeToPreeti = (text) => {
  try {
    return createResult(unicodeToPreeti(text), [], "unicode", "preeti");
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
