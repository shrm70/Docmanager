import test from "node:test";
import assert from "node:assert/strict";
import {
  convertPreetiToUnicode,
  convertUnicodeToPreeti,
  detectEncoding
} from "../src/index.js";

test("detects unicode text", () => {
  assert.equal(detectEncoding("\u0928\u0947\u092a\u093e\u0932"), "unicode");
});

test("detects preeti text", () => {
  assert.equal(detectEncoding("g]kfn"), "preeti");
});

test("converts preeti to unicode", () => {
  assert.equal(convertPreetiToUnicode("g]kfn").text, "\u0928\u0947\u092a\u093e\u0932");
});

test("converts unicode to preeti", () => {
  assert.equal(convertUnicodeToPreeti("\u0928\u0947\u092a\u093e\u0932").text, "g]kfn");
});
