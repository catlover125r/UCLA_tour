# UCLA Tour

An **interactive, self-guided audio tour web app for UCLA's campus**, optimized for mobile browsers. Navigate 8 landmark stops with map markers, descriptions, and audio narration.

## Features

- 8 sequential tour stops with titles, descriptions, and coordinates
- Google Maps integration with numbered custom markers (active/visited states visually distinguished)
- Real-time user location as a dot on the map with a "locate me" button
- Audio narration per stop — play/pause, seek bar, time display, and auto-advance to next stop
- Previous/next stop navigation
- Satellite/roadmap view toggle
- Visual progress dots showing visited, current, and unvisited stops
- Mobile-optimized layout with safe area insets for notched devices

## Tech Stack

- Vanilla JavaScript, HTML5, CSS3
- [Google Maps JavaScript API](https://developers.google.com/maps/documentation/javascript) — custom overlay markers
- Web Geolocation API — live user position
- HTML5 Audio API — narration playback
- Google Fonts (DM Serif Display, DM Sans)

## Setup

1. Get a [Google Maps JavaScript API key](https://developers.google.com/maps/get-started)
2. Add the key to the `<script>` tag in `index.html`:
   ```html
   <script src="https://maps.googleapis.com/maps/api/js?key=YOUR_API_KEY&callback=initMap" async defer></script>
   ```
3. Place audio narration files in the `audio/` directory matching the paths defined in the `STOPS` array in `app.js`
4. Open `index.html` in a browser or serve with a static file server

## Running Locally

```bash
npx serve .
```
Then open [http://localhost:3000](http://localhost:3000) on your phone or browser.
