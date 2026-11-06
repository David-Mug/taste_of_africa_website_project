# Taste of Africa

Taste of Africa is a responsive, multi-page website that celebrates African culinary heritage. Visitors can discover traditional dishes, explore culinary regions, follow complete recipes, scale ingredients to their serving size and save their favorites.

It was built as a university frontend development project using only HTML5, CSS3 and vanilla JavaScript.

## Project objectives

- Demonstrate semantic, accessible HTML5 across a complete multi-page site.
- Build a consistent visual identity and responsive layouts with modern CSS.
- Use JavaScript and DOM manipulation to create real interactive features.
- Persist visitor preferences in the browser with `localStorage`.
- Present African food with accurate, culturally respectful content.

## Technologies used

| Technology | Purpose |
|---|---|
| HTML5 | Page structure and semantic content |
| CSS3 | Custom properties, Grid, Flexbox, media queries, `clamp()` |
| Vanilla JavaScript | DOM manipulation, events and validation |
| Browser `localStorage` | Saved favorites and theme |
| Google Fonts | Playfair Display and DM Sans |

No frameworks, UI libraries or build tools are used.

## Website pages

| Page | File | Content |
|---|---|---|
| Home | `index.html` | Hero with video, featured dishes, regions, stories, newsletter |
| Recipes | `recipes.html` | Five complete recipes, filters, favorites, ingredient scaler |
| Culinary Regions | `regions.html` | West, East and North Africa: ingredients, techniques, dishes |
| About Us | `about.html` | Story, mission, vision, food heritage, map, photo credits |
| Contact | `contact.html` | Validated contact form and contact information |
| Food Stories | `stories.html` | Full articles behind the home page's "Read more" links |

`stories.html` is a supporting page, added so that every "Read more" link leads to a real article. It is linked from the home page and the footer.

## Main features

- Sticky, responsive navigation with an active page state and a mobile menu
- Dark and light themes that follow the system preference until a visitor chooses
- Five recipes with cultural background, ingredients, method, video, nutrition and map
- Expandable recipe sections using `<details>` and `<summary>`
- Scroll animations that respect the "reduce motion" system setting
- Responsive embedded videos and maps

## JavaScript functionality

All code is in `js/script.js`, which is loaded with `defer` on every page. Each feature first checks that its elements exist, so the same file runs safely on every page. The code is wrapped in a function so that it creates no global variables.

| Feature | How it works |
|---|---|
| Recipe filtering | Buttons with `data-filter` are compared to each card's `data-region`. Cards that do not match receive the `.hidden` class, with no page reload. |
| Favorites | Recipe IDs are saved as a JSON array in `localStorage`. Reading is protected against missing or invalid data and removes duplicates. Favorites are shared between the home and recipes pages. |
| Ingredient scaler | Original amounts are kept in `data-quantity`. New amounts are always calculated from that value (`original x new servings / default servings`), so rounding errors cannot build up. Servings cannot go below one. |
| Dark/light mode | The toggle changes `data-theme` on `<html>`, which reassigns the CSS custom properties. The choice is saved in `localStorage`. |
| Contact form | The submit handler calls `event.preventDefault()` and validates each field. The message must be more than 20 characters. On success the form is hidden and a message using the visitor's first name is shown. |
| Newsletter | The email is validated on submit, feedback is displayed and the form is cleared. |

## Folder structure

```text
taste_of_africa_website_project/
├── index.html
├── recipes.html
├── regions.html
├── about.html
├── contact.html
├── stories.html
├── css/
│   └── styles.css
├── js/
│   └── script.js
├── images/
│   └── food and regional photographs, favicon.svg
└── README.md
```

## Running locally

An internet connection is needed for fonts, videos and maps.

**Recommended: use a local server**, so that YouTube videos play inside the page.

- In VS Code, install the Live Server extension, right-click `index.html` and choose **Open with Live Server**.
- Or run this command in the project folder, then visit <http://localhost:8000>:

  ```bash
  python3 -m http.server 8000
  ```

**Opening `index.html` directly** also works. YouTube blocks embedded playback on `file://` pages, so the site automatically replaces each player with a thumbnail that links to the video on YouTube.

## Accessibility considerations

- Semantic landmarks, one `h1` per page and a logical heading order
- A skip link and full keyboard access, with visible focus indicators
- Descriptive `alt` text, and a `title` on every iframe
- A `<label>` for every form field, with errors linked through `aria-describedby` and `aria-invalid`
- `aria-pressed`, `aria-expanded` and `aria-current` to communicate state
- Live regions that announce filter results, serving changes and form feedback
- Color contrast checked in both themes with the axe accessibility engine

## Content and credits

- Pictures come from [Wikimedia Commons](https://commons.wikimedia.org/) under Creative Commons licenses. 
- Videos belong to their creators and are embedded from YouTube.
- Nutritional values are approximate estimates based on the listed ingredients. They are not laboratory measurements.
- Forms have no backend, so no data is sent or stored. The contact email address and social media links are placeholders.
