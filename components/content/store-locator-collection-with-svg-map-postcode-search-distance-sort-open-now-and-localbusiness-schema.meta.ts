const meta = {
  slug: "store-locator-collection-with-svg-map-postcode-search-distance-sort-open-now-and-localbusiness-schema",
  category: "content",
  name: "Store Locator with Map, Postcode Search, Open Now and Schema",
  keyword: "store locator",
  title: "Store Locator for Websites: Free Code, No Plugin | We.Inc",
  description: "Free store locator code: postcode search, distance sort with the haversine formula, open now from opening hours, directions links and LocalBusiness JSON-LD.",
  intro: "A complete store locator for a made-up hardware chain with six branches, built without a plugin or a map library. Type a town or the start of a postcode and the list re-sorts by straight-line distance, each row saying whether that store is open now and when it next opens or closes. The list and the map stay in step: choose a row or a pin and the other highlights, and picking a pin scrolls the list to the matching store. The map is an illustrated SVG of an invented town, so nothing loads from a tile server. Below it, tabs give you the store data as JSON, LocalBusiness JSON-LD for the selected store, the plain JavaScript and a React hook. On phones the map sits above the list.",
  useWhen: [
    "A business with a handful to a few hundred branches wants a find-a-store page without paying for a locator plugin or a monthly service.",
    "You need structured data for each location so search engines can read the address, coordinates and opening hours.",
    "Your store list lives in a spreadsheet or CMS and you want a simple JSON shape to export it into.",
    "You want the logic (distance, open now, directions) separately so you can attach it to whichever map your project already uses.",
  ],
  customize: [
    "Replace the STORES array with your branches. Each needs lat and lng in decimal degrees and an hours object with keys su to sa, holding \"08:00-18:00\" or \"closed\".",
    "Turn on real directions by swapping href=\"#\" for the Google Maps address dir/?api=1&destination= followed by lat,lng, or the Apple Maps form ?daddr=lat,lng. The directionsUrl function in the Vanilla JS tab builds both.",
    "Use miles instead of kilometres by changing the Earth radius in distanceKm from 6371 to 3959 and the km label to mi.",
    "Swap the SVG for a real map with Leaflet and OpenStreetMap tiles: create one marker per store from the same lat and lng, call the same selection function from the marker's click handler, and keep the list code as it is. That map is not part of this demo.",
    "Change the brand colour by replacing emerald-800 and emerald-700 on the button, selected row and pin fill (#065f46 in the SVG).",
  ],
  accessibility: [
    "The search field has a label, results sit in a labelled list, and a polite status line announces the place searched and the nearest store, so screen reader users hear the outcome without moving focus.",
    "Every pin is focusable with role=button, a name that matches its list number, and Enter or Space to select. The list rows are real buttons with aria-pressed, so the map is never the only way to choose a store.",
    "Open or closed is written as text next to the coloured dot, not shown by colour alone. Keep it that way if you restyle the badge.",
  ],
  faqs: [
    {
      question: "How do I make a store locator without a plugin?",
      answer: "Keep your stores in a JSON array with coordinates and hours, turn a postcode or town into a latitude and longitude, measure the distance to each store with the haversine formula, sort, and render the list. A map is optional; the list with distances and directions links already answers the question.",
    },
    {
      question: "How is the distance worked out?",
      answer: "With the haversine formula, which gives the great-circle distance between two points on a sphere from their latitudes and longitudes. It is straight-line distance, not driving distance, so label it as such or ask a routing service for travel times.",
    },
    {
      question: "How does the open now check work?",
      answer: "It reads today's hours for the store, converts the opening and closing times to minutes after midnight and checks whether the current time falls between them. If not, it looks ahead day by day for the next opening. It uses the visitor's clock, so convert the time if your stores are in another time zone.",
    },
    {
      question: "Should every store have its own LocalBusiness schema?",
      answer: "Yes, ideally on its own page. Use the most specific type that fits, such as HardwareStore or Restaurant, with name, address, telephone, geo coordinates and openingHoursSpecification, and make sure everything in the JSON-LD matches what the page shows.",
    },
    {
      question: "How do people search by postcode in a real locator?",
      answer: "You need a geocoder that turns the postcode into coordinates. This demo uses a small lookup table of invented places. On a live site, call a geocoding service or ship your own postcode-to-coordinates list, then pass the result to the same sort function.",
    },
    {
      question: "Can I link to directions in Google Maps and Apple Maps?",
      answer: "Yes. Both accept the destination as coordinates in the address, so a plain link works with no API key. Google uses dir/?api=1&destination=lat,lng and Apple uses ?daddr=lat,lng; each opens the visitor's own maps app or the website.",
    },
  ],
  related: [
    "folded-paper-street-map-that-unfolds-panel-by-panel-with-creases-and-a-pin-that-drops-in",
    "html-form-examples-collection-with-every-input-type-and-copyable-html-css-or-tailwind",
    "bento-grid-collection-with-ten-tailwind-layouts-grid-template-areas-and-copyable-code",
  ],
  tags: ["store locator", "store locator html", "store finder", "find a store page", "haversine javascript", "localbusiness schema", "opening hours open now"],
  height: 1290,
  section: true,
  interactive: true,
};

export default meta;
