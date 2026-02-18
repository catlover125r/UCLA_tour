# UCLA Self-Guided Campus Tour

A mobile-friendly web app for a self-guided walking tour of UCLA campus with 8 stops, interactive map, and audio narration.

---

## Setup Instructions

### 1. Get a Google Maps API Key

1. Go to https://console.cloud.google.com
2. Create a new project (or use an existing one)
3. Enable the **Maps JavaScript API**
4. Create an API key under **Credentials**
5. Restrict the key to your GitHub Pages domain for security

### 2. Add your API key

Open `index.html` and find this line near the bottom:

```html
<script src="https://maps.googleapis.com/maps/api/js?key=YOUR_API_KEY&callback=initMap" async defer></script>
```

Replace `YOUR_API_KEY` with your actual key.

### 3. Add audio files

Place your 8 audio files in the `audio/` folder with these exact names:

```
audio/
  01.mp3
  02.mp3
  03.mp3
  04.mp3
  05.mp3
  06.mp3
  07.mp3
  08.mp3
```

Each file corresponds to a tour stop in order:
1. Murphy Hall
2. Royce Hall
3. Janss Steps
4. Sculpture Gardens
5. Inverted Fountain
6. Kerckhoff Hall
7. Bruin Plaza
8. Pauley Pavilion

### 4. Deploy to GitHub Pages

1. Create a new GitHub repository
2. Upload all files (keep the folder structure):
   ```
   index.html
   style.css
   app.js
   audio/01.mp3 ... 08.mp3
   ```
3. Go to **Settings > Pages** in your repository
4. Set source to **Deploy from branch > main > / (root)**
5. Your app will be live at `https://yourusername.github.io/your-repo-name`

---

## How to Use

- The map opens centered on UCLA with 8 numbered pins
- The active stop is highlighted in blue
- Tap a pin or use the arrows to navigate between stops
- Press the play button to hear the audio guide for each stop
- After each audio clip ends, the app auto-advances to the next stop
- Tap the crosshair button to center the map on your current location

---

## File Structure

```
ucla-tour/
  index.html    - App structure
  style.css     - All styles
  app.js        - Map, audio, and navigation logic
  audio/        - Your MP3 files go here
  README.md     - This file
```
