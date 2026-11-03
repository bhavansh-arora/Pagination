/* AI writing for the site editor: drafts SEO-friendly blog posts with Claude (Anthropic API).
   The owner adds an Anthropic API key once (⚙ Account → Owner settings); it is stored encrypted in admin/auth.json
   like the GitHub token and unlocked in the browser at sign-in. Drafts come back as structured data that fills in the
   Blog panel's form, so nothing is published until someone reviews it and clicks Create post.
   Site details (who the business is, where it works, which pages to link) come from config.blog.ai. */
(function () {
  "use strict";
  var C = window.SITE_EDITOR_CONFIG || {}, B = C.blog || {}, A = B.ai || {};
  var SDK_URL = "https://cdn.jsdelivr.net/npm/@anthropic-ai/sdk@0.137.0/+esm";
  var MODEL = "claude-opus-5-5";
  var sdk = null;

  function loadSdk() {
    if (!sdk) sdk = import(SDK_URL).catch(function (e) { sdk = null; throw new Error("Couldn't load the AI library. Check the internet connection and try again."); });
    return sdk;
  }
  function keyNow() { return (window.__editorAuth && window.__editorAuth.ai) || ""; }
  // The key only ever lives in this browser session (it is decrypted at sign-in, like the GitHub token).
  function clientFor(key) {
    return loadSdk().then(function (m) { return { m: m, client: new m.default({ apiKey: key, dangerouslyAllowBrowser: true, maxRetries: 2 }) }; });
  }
  // Plain-language errors, most specific first.
  function explain(err, m) {
    if (m && err instanceof m.AuthenticationError) return "The Anthropic API key was rejected. The site owner can replace it in ⚙ Account → Owner settings.";
    if (m && err instanceof m.PermissionDeniedError) return "This Anthropic API key isn't allowed to use " + MODEL + ". Check the key's workspace in the Anthropic Console.";
    if (m && err instanceof m.RateLimitError) return "Too many requests right now. Wait a minute and try again.";
    if (m && err instanceof m.InternalServerError) return "The AI service is busy right now. Try again in a minute.";
    if (m && err instanceof m.APIConnectionError) return "Couldn't reach the AI service. Check the internet connection and try again.";
    if (m && err instanceof m.BadRequestError) return "The AI service couldn't handle this request: " + ((err.error && err.error.error && err.error.error.message) || err.message);
    if (m && err instanceof m.APIError) return "The AI service returned an error (" + err.status + "): " + err.message;
    return err && err.message ? err.message : String(err);
  }

  // Check a key before saving it (reading a model's details costs nothing).
  function check(key) {
    return clientFor(key).then(function (x) {
      return x.client.models.retrieve(MODEL).catch(function (e) { throw new Error(explain(e, x.m)); });
    });
  }

  var POST_SCHEMA = {
    type: "object", additionalProperties: false,
    required: ["title", "slug", "excerpt", "category", "keywords", "body"],
    properties: {
      title: { type: "string", description: "The post's title (also its main heading and Google title)." },
      slug: { type: "string", description: "Short web address: lowercase words joined by hyphens." },
      excerpt: { type: "string", description: "Summary for the blog page and Google's description." },
      category: { type: "string", description: "One of the site's blog categories." },
      keywords: { type: "array", items: { type: "string" }, description: "The search phrases the post targets, most important first." },
      body: { type: "string", description: "The post itself, in the simple formatting described in the instructions." }
    }
  };

  function systemPrompt() {
    var cats = (B.categories || []).join(", ");
    var pages = (A.pages || []).map(function (p) { return "- " + p[0] + " (" + p[1] + ")"; }).join("\n");
    return [
      "You write blog posts for a wedding photography and film business's website. Each post should help engaged couples with something they genuinely search for, read naturally, and rank well in Google.",
      "",
      "About the business:",
      A.about || "",
      "",
      "Voice: write as the business owners, in the first person plural (\"we\"), warm, personal and specific, like advice from a friend who has been at a lot of weddings. Plain American English. No clichés like \"in today's fast-paced world\", no exclamation-mark hype, no keyword stuffing.",
      "",
      "Accuracy matters more than detail: the posts are published under the owners' names. Use only facts from the brief and from the business details above. Never invent couple names, venues, dates, prices, quotes, reviews or statistics. When a specific detail would help but wasn't given, write around it in general terms (\"many of our couples\") rather than making one up. Only use a quote (\"> \") if the brief supplies it word for word.",
      "",
      "Search-engine guidance:",
      "- title: about 50-60 characters, with the main keyword near the start; it reads like a headline a couple would click, not a list of keywords.",
      "- excerpt: 140-160 characters, includes the main keyword, and tells the reader what they'll get from the post (it's the description Google shows).",
      "- slug: 3-6 lowercase words joined by hyphens, built around the main keyword.",
      "- body: the main keyword appears naturally in the first two sentences; 3-6 sections with \"## \" headings that use natural variations of the keywords and the questions couples ask; short paragraphs; at least one list where it helps. Mention the places the business serves only where it's relevant to the topic.",
      "- Link to 2-3 of the site's own pages where they genuinely help the reader, written as [link text](page.html), choosing from:",
      pages,
      "- Finish with one or two sentences inviting couples to get in touch, linking to the contact page with the link text \"Inquire here\": [Inquire here](contact.html).",
      "- category: choose the closest of: " + cats + ".",
      "- keywords: the 3-6 search phrases the post targets, most important first.",
      "",
      "Formatting of body (it is turned into the page by the site): a blank line between paragraphs; \"## \" for section headings and \"### \" for sub-headings; \"- \" for list items (one per line, no blank lines inside a list); **bold** and *italic* sparingly; links as [text](page.html). Don't include the title as a heading, images, HTML, or a table of contents."
    ].join("\n");
  }

  /* brief: { topic, details, keywords, length: "short" | "standard" | "long", existing: [titles] } */
  function draftPost(brief) {
    var key = keyNow();
    if (!key) return Promise.reject(new Error("AI writing isn't set up yet: the site owner adds an Anthropic API key in ⚙ Account → Owner settings (then sign out and back in on other computers)."));
    var words = { short: "about 500-700 words", standard: "about 900-1,200 words", long: "about 1,500-1,800 words" }[brief.length] || "about 900-1,200 words";
    var user = "Write a blog post.\n\nTopic: " + brief.topic +
      (brief.details ? "\n\nDetails, facts and notes to use:\n" + brief.details : "") +
      (brief.keywords ? "\n\nSearch phrases to rank for: " + brief.keywords : "\n\nChoose the search phrases couples are most likely to use for this topic.") +
      "\n\nLength: " + words + "." +
      (brief.existing && brief.existing.length ? "\n\nPosts already on the blog (cover a different angle, and link to none of them): " + brief.existing.join("; ") : "");
    var m;
    return clientFor(key).then(function (x) {
      m = x.m;
      return x.client.beta.messages.create({
        model: MODEL,
        max_tokens: 16000,
        betas: ["server-side-fallback-2026-07-01"],
        fallbacks: "default",              // if the request is declined, the API retries it on a fallback model
        output_config: { effort: "medium", format: { type: "json_schema", schema: POST_SCHEMA } },
        system: systemPrompt(),
        messages: [{ role: "user", content: user }]
      });
    }).then(function (res) {
      if (res.stop_reason === "refusal") throw new Error("The AI declined to write this post. Try rewording the topic.");
      if (res.stop_reason === "max_tokens") throw new Error("The draft came out too long and was cut off. Try a shorter length.");
      var text = res.content.filter(function (b) { return b.type === "text"; }).map(function (b) { return b.text; }).join("");
      var post;
      try { post = JSON.parse(text); } catch (e) { throw new Error("The AI's answer couldn't be read. Please try again."); }
      if (!post.title || !post.body) throw new Error("The AI's draft was incomplete. Please try again.");
      return post;
    }).catch(function (err) { throw new Error(explain(err, m)); });
  }

  window.__siteAI = { model: MODEL, check: check, draftPost: draftPost, hasKey: function () { return !!keyNow(); } };
})();
