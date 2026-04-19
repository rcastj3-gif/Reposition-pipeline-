const express = require('express');
const router = express.Router();
const { authenticate } = require('../services/auth');

function page({ title, body }) {
  return `<!doctype html><html><head><meta charset="utf-8" /><title>${title}</title><style>
  body{font-family:Arial,sans-serif;background:#f6f7fb;padding:40px;color:#222}
  .card{max-width:420px;margin:40px auto;background:#fff;border:1px solid #ddd;border-radius:12px;padding:24px}
  input{width:100%;padding:12px;border:1px solid #ccc;border-radius:8px;margin:8px 0 14px 0;box-sizing:border-box}
  button{background:#111;color:#fff;border:0;padding:12px 16px;border-radius:8px;font-weight:600;cursor:pointer;width:100%}
  .muted{color:#666;font-size:14px}.err{background:#fff1f1;color:#9b1c1c;padding:10px 12px;border-radius:8px;margin-bottom:12px}
  </style></head><body>${body}</body></html>`;
}

router.get('/login', (req, res) => {
  const err = req.query.error ? `<div class="err">Invalid login</div>` : '';
  const next = req.query.next || '/operator';
  res.send(page({
    title: 'Operator Login',
    body: `<div class="card"><h2>Operator Login</h2><div class="muted">Sign in to access Pipeline Restoration operator tools.</div>${err}<form method="post" action="/login"><input type="hidden" name="next" value="${next}" /><label>Email</label><input name="email" type="email" required /><label>Password</label><input name="password" type="password" required /><button>Sign In</button></form></div>`
  }));
});

router.post('/login', express.urlencoded({ extended: false }), (req, res) => {
  const { email, password, next } = req.body;
  const user = authenticate(email, password);
  if (!user) return res.redirect(`/login?error=1&next=${encodeURIComponent(next || '/operator')}`);
  req.session.user = user;
  res.redirect(next || '/operator');
});

router.post('/logout', (req, res) => {
  req.session.destroy(() => res.redirect('/login'));
});

module.exports = router;
