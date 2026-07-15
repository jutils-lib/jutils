# jUtils

A lightweight, dependency-free JavaScript utility library that simplifies DOM manipulation, events, AJAX, storage, validation, animations, date utilities, and more through a clean, chainable API.

jUtils is designed to reduce boilerplate while keeping your code readable, consistent, and easy to maintain.

---

## Features

- ⚡ Fast and lightweight
- 🔗 Chainable API
- 🚫 Zero dependencies
- 🌐 Modern browser support
- 🎯 jQuery-inspired syntax
- 📦 Rich collection of utility methods
- 🎨 DOM manipulation
- 🖱️ Event handling
- 🌍 AJAX & HTTP requests
- 💾 Local & session storage helpers
- 📅 Date and time utilities
- 🔐 String, array and object helpers
- ✅ Validation utilities
- 🎬 Animation helpers
- 🧩 Modular and extensible

---

## Installation

### CDN

```html
<script src="https://cdn.jsdelivr.net/gh/utilitiescode/jutils@latest/jutils.js"></script>
```

### Download

Clone or download this repository and include:

```html
<script src="jutils.js"></script>
```

---

## Basic Usage

Select elements:

```js
$('button')
```

Update text:

```js
$('button').text('Hello World');
```

Handle events:

```js
$('#submit').click(() => {
    console.log('Clicked!');
});
```

Send an AJAX request:

```js
$.ajax({
    url: '/api/users',
    method: 'GET'
});
```

Clone an object:

```js
const copy = $.clone(original);
```

Generate a random integer:

```js
$.randInt(1, 100);
```

---

## Philosophy

jUtils focuses on:

- Simplicity
- Performance
- Consistency
- Clean APIs
- Developer productivity

Instead of importing multiple small libraries, jUtils provides commonly used utilities through one consistent interface.

---

## Why jUtils?

- Familiar syntax for developers coming from jQuery.
- Modern implementation using current JavaScript features.
- No external dependencies.
- Built for real-world applications.
- Highly extensible.

---

## Browser Support

Supports all modern browsers that implement modern ECMAScript features.

---

## Documentation

Documentation is continually improving as new utilities are added.

---

## License

MIT License.
