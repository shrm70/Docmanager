const languageByVariant = {
  en: "en",
  "ne-unicode": "ne",
  "ne-preeti": "ne"
};

const toLanguage = (variantKey) => languageByVariant[variantKey] ?? variantKey;

const getGoogleBaseUrl = (config) => config.googleBaseUrl || "https://translation.googleapis.com/language/translate/v2";
const getAzureBaseUrl = (config) => config.azureBaseUrl || "https://api.cognitive.microsofttranslator.com";
const getDeepLBaseUrl = (config) => config.deepLBaseUrl || "https://api-free.deepl.com/v2";

const translateWithGoogle = async ({ text, from, to, config }) => {
  const url = new URL(getGoogleBaseUrl(config));
  url.searchParams.set("key", config.apiKey);

  const response = await fetch(url, {
    method: "POST",
    headers: {
      "Content-Type": "application/json"
    },
    body: JSON.stringify({
      q: [text],
      source: from,
      target: to,
      format: "text"
    })
  });

  if (!response.ok) {
    throw new Error(`Google translation failed with status ${response.status}.`);
  }

  const payload = await response.json();
  return payload?.data?.translations?.[0]?.translatedText ?? text;
};

const translateWithAzure = async ({ text, from, to, config }) => {
  const url = new URL("/translate", getAzureBaseUrl(config));
  url.searchParams.set("api-version", "3.0");
  url.searchParams.set("from", from);
  url.searchParams.append("to", to);

  const response = await fetch(url, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "Ocp-Apim-Subscription-Key": config.apiKey,
      "Ocp-Apim-Subscription-Region": config.azureRegion ?? "",
      "X-ClientTraceId": crypto.randomUUID()
    },
    body: JSON.stringify([{ text }])
  });

  if (!response.ok) {
    throw new Error(`Azure translation failed with status ${response.status}.`);
  }

  const payload = await response.json();
  return payload?.[0]?.translations?.[0]?.text ?? text;
};

const translateWithDeepL = async ({ text, from, to, config }) => {
  const url = new URL("/translate", getDeepLBaseUrl(config));
  const body = new URLSearchParams();
  body.set("text", text);
  body.set("target_lang", to.toUpperCase());
  body.set("source_lang", from.toUpperCase());

  const response = await fetch(url, {
    method: "POST",
    headers: {
      Authorization: `DeepL-Auth-Key ${config.apiKey}`,
      "Content-Type": "application/x-www-form-urlencoded"
    },
    body
  });

  if (!response.ok) {
    throw new Error(`DeepL translation failed with status ${response.status}.`);
  }

  const payload = await response.json();
  return payload?.translations?.[0]?.text ?? text;
};

const translateWithMock = async ({ text, to }) => `[mock:${to}] ${text}`;

export const translateText = async ({ text, sourceVariant, targetVariant, config = {} }) => {
  const provider = config.provider || "mock";
  const from = toLanguage(sourceVariant);
  const to = toLanguage(targetVariant);

  if (from === to) {
    return {
      text,
      provider,
      warnings: []
    };
  }

  if (!text?.trim()) {
    return {
      text,
      provider,
      warnings: []
    };
  }

  if (provider !== "mock" && !config.apiKey) {
    return {
      text,
      provider,
      warnings: ["Translation API key is missing. Falling back to mock translation output."]
    };
  }

  const executor =
    provider === "google"
      ? translateWithGoogle
      : provider === "azure"
        ? translateWithAzure
        : provider === "deepl"
          ? translateWithDeepL
          : translateWithMock;

  try {
    const translated = await executor({ text, from, to, config });
    return {
      text: translated,
      provider,
      warnings: provider === "mock" ? ["Mock translation provider is active."] : []
    };
  } catch (error) {
    return {
      text,
      provider,
      warnings: [error instanceof Error ? error.message : "Translation failed."]
    };
  }
};

export const detectLanguage = (variantKey) => toLanguage(variantKey);
