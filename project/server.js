/* PhishAware backend
 * Serves the static site and stores ONLY the email/username typed into the
 * simulated login form. The password field is never sent to this server and
 * is never written anywhere.
 */
const express = require('express');
const fs = require('fs');
const path = require('path');

const app = express();
const PORT = process.env.PORT || 3000;

const DATA_DIR = path.join(__dirname, 'data');
const DATA_FILE = path.join(DATA_DIR, 'emails.json');

// Make sure the data folder/file exist before the server starts handling requests.
if (!fs.existsSync(DATA_DIR)) {
  fs.mkdirSync(DATA_DIR);
}
if (!fs.existsSync(DATA_FILE)) {
  fs.writeFileSync(DATA_FILE, '[]', 'utf8');
}

app.use(express.json());
app.use(express.static(path.join(__dirname, 'public')));

// Very simple email-shape check, just for the "looksValid" flag shown on the dashboard.
function looksLikeEmail(value) {
  return typeof value === 'string' && /\S+@\S+\.\S+/.test(value);
}

// Called by script.js when the simulated login form is submitted.
// Only the "email" field is accepted here — there is no password field at all.
app.post('/api/log-email', (req, res) => {
  const email = ((req.body && req.body.email) || '').toString().trim();

  if (!email) {
    return res.status(400).json({ ok: false, error: 'Email is required.' });
  }

  const entry = {
    email: email,
    looksValid: looksLikeEmail(email),
    timestamp: new Date().toISOString()
  };

  fs.readFile(DATA_FILE, 'utf8', (err, raw) => {
    let list = [];
    if (!err && raw) {
      try { list = JSON.parse(raw); } catch (e) { list = []; }
    }
    list.push(entry);
    fs.writeFile(DATA_FILE, JSON.stringify(list, null, 2), (writeErr) => {
      if (writeErr) {
        console.error('Failed to save email:', writeErr);
        return res.status(500).json({ ok: false, error: 'Could not save email.' });
      }
      res.json({ ok: true, saved: entry });
    });
  });
});

// Simple way to see what has been captured so far (e.g. for your project report/demo).
app.get('/api/emails', (req, res) => {
  fs.readFile(DATA_FILE, 'utf8', (err, raw) => {
    if (err) return res.json([]);
    try {
      res.json(JSON.parse(raw));
    } catch (e) {
      res.json([]);
    }
  });
});

app.listen(PORT, () => {
  console.log(`PhishAware server running at http://localhost:${PORT}`);
});
