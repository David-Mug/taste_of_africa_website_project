/* ==========================================================================
   TASTE OF AFRICA - MAIN SCRIPT
   This one file is loaded (with "defer") by every page, so the HTML is fully
   parsed before this code runs.

   Not every page contains every element. Each feature therefore looks for
   its elements first and stops quietly if they are missing, which prevents
   null-reference errors on the other pages.

   Contents
   1. Shared helpers
   2. FEATURE 4: Dark/light theme
   3. Mobile navigation and header
   4. FEATURE 2: Favorites (localStorage)
   5. FEATURE 1: Recipe filtering
   6. FEATURE 3: Ingredient scaler
   7. FEATURE 5: Contact form validation
   8. FEATURE 6: Newsletter subscription
   9. Scroll animations
   10. Video fallback
   11. Start-up
   ========================================================================== */

"use strict";

/* The whole script lives inside this function so that none of its variables
   become globals. */
(function () {
  /* localStorage keys, kept together so they are easy to find */
  const THEME_KEY = "tasteOfAfrica.theme";
  const FAVORITES_KEY = "tasteOfAfrica.favorites";

  /* The filter currently chosen on the recipes page */
  let activeFilter = "all";

  /* ------------------------------------------------------------------------
     1. SHARED HELPERS
     ------------------------------------------------------------------------ */

  /* localStorage can throw an error (for example in some private browsing
     modes), so all access goes through these two safe wrappers. */
  function readStorage(key) {
    try {
      return localStorage.getItem(key);
    } catch (error) {
      return null;
    }
  }

  function writeStorage(key, value) {
    try {
      localStorage.setItem(key, value);
    } catch (error) {
      console.warn("Could not save to localStorage:", error);
    }
  }

  /* Checks the general shape of an email: text@text.text with no spaces */
  function isValidEmail(email) {
    const emailPattern = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/;
    return emailPattern.test(email);
  }

  /* ------------------------------------------------------------------------
     2. FEATURE 4: DARK/LIGHT THEME
     All colors are CSS custom properties. Changing the data-theme attribute
     on <html> switches the whole site to the other set of values.
     ------------------------------------------------------------------------ */

  function applyTheme(theme) {
    document.documentElement.setAttribute("data-theme", theme);

    const toggle = document.querySelector("#theme-toggle");
    if (toggle) {
      const nextTheme = theme === "dark" ? "light" : "dark";
      toggle.setAttribute("aria-label", "Switch to " + nextTheme + " mode");
    }
  }

  /* Uses the saved choice, or else the visitor's system preference */
  function getInitialTheme() {
    const savedTheme = readStorage(THEME_KEY);
    if (savedTheme === "light" || savedTheme === "dark") {
      return savedTheme;
    }
    const prefersDark = window.matchMedia("(prefers-color-scheme: dark)").matches;
    return prefersDark ? "dark" : "light";
  }

  function initTheme() {
    applyTheme(getInitialTheme());

    const toggle = document.querySelector("#theme-toggle");
    if (!toggle) {
      return;
    }

    toggle.addEventListener("click", function () {
      const currentTheme = document.documentElement.getAttribute("data-theme");
      const newTheme = currentTheme === "dark" ? "light" : "dark";
      applyTheme(newTheme);
      writeStorage(THEME_KEY, newTheme);
    });
  }

  /* ------------------------------------------------------------------------
     3. MOBILE NAVIGATION AND HEADER
     ------------------------------------------------------------------------ */

  function initNavigation() {
    const menuButton = document.querySelector("#menu-toggle");
    const nav = document.querySelector("#site-nav");
    if (!menuButton || !nav) {
      return;
    }

    function setMenuOpen(isOpen) {
      nav.classList.toggle("is-open", isOpen);
      menuButton.setAttribute("aria-expanded", String(isOpen));
      menuButton.setAttribute("aria-label", isOpen ? "Close menu" : "Open menu");
    }

    menuButton.addEventListener("click", function () {
      setMenuOpen(!nav.classList.contains("is-open"));
    });

    /* Close the menu after a link is chosen */
    nav.querySelectorAll("a").forEach(function (link) {
      link.addEventListener("click", function () {
        setMenuOpen(false);
      });
    });

    /* Keyboard users can close the menu with Escape */
    document.addEventListener("keydown", function (event) {
      if (event.key === "Escape" && nav.classList.contains("is-open")) {
        setMenuOpen(false);
        menuButton.focus();
      }
    });
  }

  /* Adds a shadow under the sticky header once the page has been scrolled */
  function initHeaderShadow() {
    const header = document.querySelector(".site-header");
    if (!header) {
      return;
    }

    function updateHeader() {
      header.classList.toggle("is-scrolled", window.scrollY > 10);
    }

    window.addEventListener("scroll", updateHeader, { passive: true });
    updateHeader();
  }

  /* ------------------------------------------------------------------------
     4. FEATURE 2: FAVORITES (LOCALSTORAGE)
     Favorites are stored as a JSON array of recipe IDs, for example:
     ["jollof-rice","isombe"]
     ------------------------------------------------------------------------ */

  /* Reads favorites safely. Missing or corrupted data gives an empty list. */
  function getFavorites() {
    const storedValue = readStorage(FAVORITES_KEY);
    if (!storedValue) {
      return [];
    }

    try {
      const parsedValue = JSON.parse(storedValue);
      if (!Array.isArray(parsedValue)) {
        return [];
      }
      /* Keep only text IDs, and let a Set remove any duplicates */
      const textIds = parsedValue.filter(function (id) {
        return typeof id === "string";
      });
      return Array.from(new Set(textIds));
    } catch (error) {
      return [];
    }
  }

  function saveFavorites(favorites) {
    writeStorage(FAVORITES_KEY, JSON.stringify(favorites));
  }

  /* Adds the ID if it is new, removes it if it is already saved */
  function toggleFavorite(recipeId) {
    const favorites = getFavorites();
    const position = favorites.indexOf(recipeId);

    if (position === -1) {
      favorites.push(recipeId);
    } else {
      favorites.splice(position, 1);
    }

    saveFavorites(favorites);
  }

  /* Makes every favorite button on the page match what is stored */
  function updateFavoriteButtons() {
    const favorites = getFavorites();
    const buttons = document.querySelectorAll(".favorite-btn");

    buttons.forEach(function (button) {
      const isFavorite = favorites.includes(button.dataset.recipeId);

      button.classList.toggle("is-favorite", isFavorite);
      button.setAttribute("aria-pressed", String(isFavorite));
      button.textContent = isFavorite ? "❤️ Favorite" : "♡ Favorite";
    });

    /* The "My Favorites" filter button shows a live count */
    const favoritesCount = document.querySelector("#favorites-count");
    if (favoritesCount) {
      favoritesCount.textContent = "(" + favorites.length + ")";
    }
  }

  function initFavorites() {
    const buttons = document.querySelectorAll(".favorite-btn");

    buttons.forEach(function (button) {
      button.addEventListener("click", function () {
        toggleFavorite(button.dataset.recipeId);
        updateFavoriteButtons();

        /* If My Favorites is showing, a removed recipe must disappear */
        if (activeFilter === "favorites") {
          applyRecipeFilter();
        }
      });
    });

    /* Restore the saved state when the page loads */
    updateFavoriteButtons();
  }

  /* ------------------------------------------------------------------------
     5. FEATURE 1: RECIPE FILTERING
     Each recipe card has a data-region attribute and each filter button has a
     data-filter attribute. Cards that do not match receive the .hidden class.
     ------------------------------------------------------------------------ */

  function cardMatchesFilter(card, favorites) {
    if (activeFilter === "all") {
      return true;
    }
    if (activeFilter === "favorites") {
      return favorites.includes(card.dataset.recipeId);
    }
    return card.dataset.region === activeFilter;
  }

  function applyRecipeFilter() {
    const cards = document.querySelectorAll(".recipe-card");
    const favorites = getFavorites();
    let visibleCount = 0;

    cards.forEach(function (card) {
      const isMatch = cardMatchesFilter(card, favorites);
      card.classList.toggle("hidden", !isMatch);
      if (isMatch) {
        visibleCount += 1;
      }
    });

    /* Tell the visitor (and screen readers) how many recipes are showing */
    const resultsCount = document.querySelector("#results-count");
    if (resultsCount) {
      const noun = visibleCount === 1 ? "recipe" : "recipes";
      resultsCount.textContent = "Showing " + visibleCount + " " + noun;
    }

    /* The empty state only appears for an empty My Favorites list */
    const emptyState = document.querySelector("#favorites-empty");
    if (emptyState) {
      emptyState.classList.toggle("hidden", visibleCount > 0);
    }
  }

  function setActiveFilter(filter) {
    activeFilter = filter;

    document.querySelectorAll(".filter-btn").forEach(function (button) {
      const isActive = button.dataset.filter === filter;
      button.setAttribute("aria-pressed", String(isActive));
    });

    applyRecipeFilter();
  }

  function initRecipeFilter() {
    const filterButtons = document.querySelectorAll(".filter-btn");
    if (filterButtons.length === 0) {
      return;
    }

    filterButtons.forEach(function (button) {
      button.addEventListener("click", function () {
        setActiveFilter(button.dataset.filter);
      });
    });

    /* The empty state contains a button that returns to all recipes */
    const showAllButton = document.querySelector("#show-all-recipes");
    if (showAllButton) {
      showAllButton.addEventListener("click", function () {
        setActiveFilter("all");
      });
    }

    applyRecipeFilter();
  }

  /* ------------------------------------------------------------------------
     6. FEATURE 3: INGREDIENT SCALER
     Each ingredient keeps its original amount in data-quantity. New amounts
     are always calculated from that original value, never from the number on
     screen, so repeated clicks cannot build up rounding errors.

         new amount = original amount x (new servings / default servings)
     ------------------------------------------------------------------------ */

  const MIN_SERVINGS = 1;
  const MAX_SERVINGS = 50;

  /* Common kitchen fractions, used to display amounts like 1½ */
  const FRACTIONS = [
    { value: 0.125, symbol: "⅛" },
    { value: 0.25, symbol: "¼" },
    { value: 0.333, symbol: "⅓" },
    { value: 0.5, symbol: "½" },
    { value: 0.667, symbol: "⅔" },
    { value: 0.75, symbol: "¾" }
  ];

  /* Turns a number into clear text: 2 -> "2", 1.5 -> "1½", 1.17 -> "1.17" */
  function formatQuantity(amount) {
    const wholePart = Math.floor(amount);
    const decimalPart = amount - wholePart;

    /* Values extremely close to a whole number are shown as whole numbers */
    if (decimalPart < 0.01) {
      return String(wholePart);
    }
    if (decimalPart > 0.99) {
      return String(wholePart + 1);
    }

    /* Use a fraction symbol if the decimal part matches one closely */
    const match = FRACTIONS.find(function (fraction) {
      return Math.abs(fraction.value - decimalPart) < 0.01;
    });
    if (match) {
      return (wholePart > 0 ? wholePart : "") + match.symbol;
    }

    /* Otherwise show up to two decimal places, without trailing zeros */
    return String(parseFloat(amount.toFixed(2)));
  }

  /* Builds the text for one ingredient, e.g. "1½ cups" or "1 cup" */
  function buildAmountText(item, amount) {
    const singularUnit = item.dataset.unit || "";
    const pluralUnit = item.dataset.unitPlural || singularUnit;
    const unit = amount > 1 ? pluralUnit : singularUnit;
    return (formatQuantity(amount) + " " + unit).trim();
  }

  function updateIngredients(card, servings, defaultServings) {
    const scaleFactor = servings / defaultServings;
    const items = card.querySelectorAll(".ingredient[data-quantity]");

    items.forEach(function (item) {
      const originalQuantity = parseFloat(item.dataset.quantity);
      const newQuantity = originalQuantity * scaleFactor;
      item.querySelector(".ingredient__amount").textContent = buildAmountText(item, newQuantity);
    });
  }

  function initScaler(card) {
    const scaler = card.querySelector(".scaler");
    if (!scaler) {
      return;
    }

    const minusButton = scaler.querySelector('[data-action="decrease"]');
    const plusButton = scaler.querySelector('[data-action="increase"]');
    const servingsDisplay = scaler.querySelector(".scaler__count");
    const servingsLabel = scaler.querySelector(".scaler__label");
    const defaultServings = parseInt(scaler.dataset.defaultServings, 10);
    let servings = defaultServings;

    function render() {
      servingsDisplay.textContent = servings;
      servingsLabel.textContent = servings === 1 ? "serving" : "servings";
      minusButton.disabled = servings <= MIN_SERVINGS;
      plusButton.disabled = servings >= MAX_SERVINGS;
      updateIngredients(card, servings, defaultServings);
    }

    minusButton.addEventListener("click", function () {
      if (servings > MIN_SERVINGS) {
        servings -= 1;
        render();
      }
    });

    plusButton.addEventListener("click", function () {
      if (servings < MAX_SERVINGS) {
        servings += 1;
        render();
      }
    });

    render();
  }

  function initIngredientScalers() {
    document.querySelectorAll(".recipe-card").forEach(initScaler);
  }

  /* ------------------------------------------------------------------------
     7. FEATURE 5: CONTACT FORM VALIDATION
     ------------------------------------------------------------------------ */

  const MIN_MESSAGE_LENGTH = 20;

  /* Shows or clears the error message that belongs to one field */
  function setFieldError(field, message) {
    const errorElement = document.querySelector("#" + field.id + "-error");
    if (errorElement) {
      errorElement.textContent = message;
    }

    if (message) {
      field.setAttribute("aria-invalid", "true");
    } else {
      field.removeAttribute("aria-invalid");
    }
  }

  /* Each function returns an error message, or "" when the value is valid */
  function validateName(value) {
    if (value === "") {
      return "Please enter your full name.";
    }
    if (value.length < 2) {
      return "Your name should be at least 2 characters long.";
    }
    return "";
  }

  function validateEmail(value) {
    if (value === "") {
      return "Please enter your email address.";
    }
    if (!isValidEmail(value)) {
      return "Please enter a valid email address, such as name@example.com.";
    }
    return "";
  }

  function validateCountry(value) {
    return value === "" ? "Please select your country." : "";
  }

  function validateMessage(value) {
    if (value === "") {
      return "Please write your message.";
    }
    if (value.length <= MIN_MESSAGE_LENGTH) {
      return "Your message must be more than " + MIN_MESSAGE_LENGTH + " characters long.";
    }
    return "";
  }

  function initContactForm() {
    const form = document.querySelector("#contact-form");
    if (!form) {
      return;
    }

    const nameField = form.querySelector("#contact-name");
    const emailField = form.querySelector("#contact-email");
    const countryField = form.querySelector("#contact-country");
    const messageField = form.querySelector("#contact-message");
    const messageCounter = form.querySelector("#message-counter");
    const successCard = document.querySelector("#contact-success");
    const successText = document.querySelector("#contact-success-text");
    const resetButton = document.querySelector("#contact-reset");

    /* Pairs every required field with its validation function */
    const rules = [
      { field: nameField, validate: validateName },
      { field: emailField, validate: validateEmail },
      { field: countryField, validate: validateCountry },
      { field: messageField, validate: validateMessage }
    ];

    function validateRule(rule) {
      const errorMessage = rule.validate(rule.field.value.trim());
      setFieldError(rule.field, errorMessage);
      return errorMessage === "";
    }

    function updateMessageCounter() {
      messageCounter.textContent = messageField.value.trim().length + " characters";
    }

    /* Once a field shows an error, re-check it as the visitor corrects it */
    rules.forEach(function (rule) {
      const eventName = rule.field === countryField ? "change" : "input";
      rule.field.addEventListener(eventName, function () {
        if (rule.field.getAttribute("aria-invalid") === "true") {
          validateRule(rule);
        }
      });
    });

    messageField.addEventListener("input", updateMessageCounter);

    form.addEventListener("submit", function (event) {
      /* Stop the browser from submitting and reloading the page */
      event.preventDefault();

      /* filter() runs every rule, so all errors are displayed at once */
      const invalidRules = rules.filter(function (rule) {
        return !validateRule(rule);
      });

      if (invalidRules.length > 0) {
        invalidRules[0].field.focus();
        return;
      }

      /* Build the personalized message from the name input. textContent is
         used so that anything typed is treated as text, never as HTML. */
      const firstName = nameField.value.trim().split(/\s+/)[0];
      successText.textContent =
        "Thank you, " + firstName + "! We've received your message. We'll get back to you soon.";

      form.classList.add("hidden");
      successCard.classList.remove("hidden");
      successCard.focus();
    });

    /* Lets the visitor send another message */
    resetButton.addEventListener("click", function () {
      form.reset();
      updateMessageCounter();
      successCard.classList.add("hidden");
      form.classList.remove("hidden");
      nameField.focus();
    });

    updateMessageCounter();
  }

  /* ------------------------------------------------------------------------
     8. FEATURE 6: NEWSLETTER SUBSCRIPTION
     ------------------------------------------------------------------------ */

  function initNewsletter() {
    const form = document.querySelector("#newsletter-form");
    if (!form) {
      return;
    }

    const emailField = form.querySelector("#newsletter-email");
    const messageElement = form.querySelector("#newsletter-message");

    function showMessage(text, type) {
      messageElement.textContent = text;
      messageElement.classList.remove("is-error", "is-success");
      messageElement.classList.add(type === "error" ? "is-error" : "is-success");
    }

    form.addEventListener("submit", function (event) {
      event.preventDefault();

      const email = emailField.value.trim();

      if (email === "") {
        emailField.setAttribute("aria-invalid", "true");
        showMessage("Please enter your email address.", "error");
        emailField.focus();
        return;
      }

      if (!isValidEmail(email)) {
        emailField.setAttribute("aria-invalid", "true");
        showMessage("Please enter a valid email address, such as name@example.com.", "error");
        emailField.focus();
        return;
      }

      emailField.removeAttribute("aria-invalid");
      showMessage("Thank you for subscribing! Stories from the African table are on their way.", "success");
      form.reset();
    });
  }

  /* ------------------------------------------------------------------------
     9. SCROLL ANIMATIONS
     ------------------------------------------------------------------------ */

  /* Fades in .reveal elements as they enter the viewport */
  function initScrollReveal() {
    const elements = document.querySelectorAll(".reveal");
    if (elements.length === 0) {
      return;
    }

    /* Older browsers simply show everything straight away */
    if (!("IntersectionObserver" in window)) {
      elements.forEach(function (element) {
        element.classList.add("is-visible");
      });
      return;
    }

    const observer = new IntersectionObserver(function (entries) {
      entries.forEach(function (entry) {
        if (entry.isIntersecting) {
          entry.target.classList.add("is-visible");
          observer.unobserve(entry.target);
        }
      });
    }, { threshold: 0.08 });

    elements.forEach(function (element) {
      observer.observe(element);
    });
  }

  /* ------------------------------------------------------------------------
     10. VIDEO FALLBACK
     YouTube refuses to play embedded videos on a page opened directly from
     the file system (file://) and shows "Error 153". In that one case, each
     player is replaced by a thumbnail that links to the video on YouTube.
     On a web server this function does nothing.
     ------------------------------------------------------------------------ */

  function initVideoFallback() {
    if (window.location.protocol !== "file:") {
      return;
    }

    const players = document.querySelectorAll('iframe[src*="youtube"]');

    players.forEach(function (player) {
      const videoId = player.src.split("/embed/")[1];

      const link = document.createElement("a");
      link.className = "video-fallback";
      link.href = "https://www.youtube.com/watch?v=" + videoId;
      link.target = "_blank";
      link.rel = "noopener noreferrer";

      const thumbnail = document.createElement("img");
      thumbnail.src = "https://img.youtube.com/vi/" + videoId + "/hqdefault.jpg";
      thumbnail.alt = "";

      const label = document.createElement("span");
      label.textContent = "▶ Watch on YouTube";

      const hiddenTitle = document.createElement("span");
      hiddenTitle.className = "sr-only";
      hiddenTitle.textContent = ": " + player.title;

      label.appendChild(hiddenTitle);
      link.append(thumbnail, label);
      player.replaceWith(link);
    });
  }

  /* ------------------------------------------------------------------------
     11. START-UP
     ------------------------------------------------------------------------ */

  function init() {
    /* Lets the CSS know JavaScript is running (see the .reveal styles) */
    document.documentElement.classList.add("js");

    initTheme();
    initNavigation();
    initHeaderShadow();
    initFavorites();
    initRecipeFilter();
    initIngredientScalers();
    initContactForm();
    initNewsletter();
    initScrollReveal();
    initVideoFallback();
  }

  init();
})();
