import test from "node:test";
import assert from "node:assert/strict";
import {
  convertPreetiToUnicode,
  convertUnicodeToPreeti,
  detectEncoding
} from "../src/index.js";

test("detects unicode text", () => {
  assert.equal(detectEncoding("नेपाल"), "unicode");
});

test("detects preeti text", () => {
  assert.equal(detectEncoding("g]kfn"), "preeti");
});

test("converts preeti to unicode", () => {
  assert.equal(convertPreetiToUnicode("g]kfn").text, "नेपाल");
});

test("converts unicode to preeti", () => {
  assert.equal(convertUnicodeToPreeti("नेपाल").text, "g]kfn");
});
