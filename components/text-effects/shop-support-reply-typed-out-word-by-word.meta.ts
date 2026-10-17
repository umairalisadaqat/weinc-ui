export default {
  slug: "shop-support-reply-typed-out-word-by-word",
  category: "text-effects",
  name: "Shop Support Reply Typed Word by Word",
  keyword: "typing reply animation",
  title: "",
  description: "",
  intro: "A ceramics shop support thread on warm stone: a customer asks about speckled mugs and the reply from Maya fills in word by word, each word lifting out of a slight blur, with longer beats after commas and full stops. Between loops three bobbing dots show she is writing. The bubble is sized to the full answer, so the thread never grows mid-sentence.",
  useWhen: [
    'A help page or contact section should show how quickly and warmly the team answers.',
    'You are mocking up a messaging feature and want a realistic reply rhythm in the preview.',
  ],
  customize: [
    'Change REPLY and QUESTION; START_AT sets how many words are already on screen when the page opens.',
    'Swap the bubble colours on .ssr-me and .ssr-them, and the avatar colour on .ssr-av.',
    'Edit the 70 plus random times 110 delay for faster or slower word arrival.',
  ],
  accessibility: [
    'Screen readers hear You said and Maya replied with each full message once, while the arriving words and dots stay aria-hidden.',
  ],
  faqs: [],
  related: [],
  tags: [
    'chat typing',
    'message animation',
    'support reply',
    'word by word',
  ],
  height: 500,
  collection: "typing-animation-css",
  tech: "css",
  reducedMotion: "Both messages are complete on arrival and the typing dots never appear.",
  perf: "Appends one span per word with a short opacity and blur fade, around thirty in a cycle, and waits while off screen.",
} satisfies UiMeta;
