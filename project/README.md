# PhishAware — Backend Setup

This adds a small Node.js/Express backend to the PhishAware simulation so that
the email/username typed into the simulated login page gets saved on the
server, in `data/emails.json`. The password field is never sent to the
server and is never stored anywhere.

## How to run

1. Install [Node.js](https://nodejs.org) if you don't already have it.
2. Open a terminal in this `project` folder.
3. Install dependencies:
   ```
   npm install
   ```
4. Start the server:
   ```
   npm start
   ```
5. Open your browser at: **http://localhost:3000**

The site now loads from the backend (not by opening `index.html` directly),
so make sure you always visit it through `http://localhost:3000`.

## Where the data goes

Every time the simulated login form is submitted, the entered email/username
is sent to `POST /api/log-email` and appended to `project/data/emails.json`
like this:

```json
[
  {
    "email": "test@example.com",
    "looksValid": true,
    "timestamp": "2026-09-29T10:15:00.000Z"
  }
]
```

You can also view everything captured so far by visiting:
**http://localhost:3000/api/emails**

## What is NOT stored

- The password field (`simPassword`) is never read into a variable that gets
  sent anywhere — only whether something was typed is recorded, exactly like
  before.
- No other personal data is collected.

## Folder structure

```
project/
  server.js        <- Express backend + /api/log-email + /api/emails
  package.json
  public/           <- your original site (index.html, styles.css, script.js)
  data/
    emails.json     <- created automatically, stores submitted emails
```
