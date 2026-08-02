# Privacy Policy

_Last updated: 2026-07-12_

ChessRetabled is a hobby project that runs entirely in your web browser. It is
designed to collect nothing about you.

## What is stored, and where

- **Your progress and game history** — level/XP, ratings, streaks, lesson stars,
  drills, and finished-game records — are stored **only in your own browser**, in
  `localStorage`. This data never leaves your device unless you explicitly turn on
  cloud sync (below). It is not sent to the author or to any server.
- **No accounts. No analytics. No cookies. No tracking. No third-party CDNs.**
  Fonts are self-hosted with the app, so loading the page makes **no request to
  Google Fonts** or any other outside service.
- The app is served from **GitHub Pages**. As with any website, the host (GitHub)
  may log standard technical request data (such as your IP address and user
  agent) according to
  [GitHub's privacy statement](https://docs.github.com/site-policy/privacy-policies/github-general-privacy-statement).
  The author does not receive or have access to these logs.

## Optional Google Drive sync

Cloud sync is **off by default**. It does nothing until you, in **Settings**,
switch the provider to Google Drive, tick the consent box, and connect a Google
account. Only then does anything leave your device. Specifically:

- The app loads Google's Identity Services client and asks you to authorize the
  **`drive.appdata`** scope. This grants access to a **private, per-application
  folder in your own Google Drive that is hidden from your normal Drive files** —
  and to nothing else in your Drive.
- Your data bundle (the same progress/history described above) is written to a
  single JSON file in that hidden folder, so you can restore it on another device.
  It is stored in **your** Google account; the author cannot see it.
- To show you which account is connected, the app reads your Google **profile
  name, email address, and avatar** (the `openid`, `userinfo.profile`, and
  `userinfo.email` scopes) and displays them in Settings. This information is kept
  only in your browser for display and is never sent anywhere else.
- The OAuth **access token is held in memory only** and is never written to disk.
- You can **Disconnect** at any time, which forgets the account and token in the
  app. You can also revoke the app's access entirely from your
  [Google Account permissions](https://myaccount.google.com/permissions), and
  delete the synced file from your Drive's hidden app-data area.

Google's handling of your account and Drive data is governed by
[Google's Privacy Policy](https://policies.google.com/privacy).

## Optional AI Coach

The **Coach** page builds a "coaching brief" — a plain-text summary of your
locally-stored stats (games played, win rates, archetype, recent results). This
is generated **entirely on your device**. Nothing is sent anywhere when you
view, copy, or download it.

The page also offers optional **live coaching** using your own Anthropic API
key. This is off unless you use it, and:

- Your API key is **held in memory only**, never saved, and sent only to
  Anthropic's API (`api.anthropic.com`) to authenticate your own requests.
- When — and only when — you tick the consent box and send a chat message, your
  coaching brief and your messages are sent to **Anthropic's API under your own
  account**. The author is not involved and cannot see any of it. Anthropic's
  handling of API data is governed by
  [Anthropic's Privacy Policy](https://www.anthropic.com/legal/privacy).
- Closing the page forgets the key and the conversation.

## Installing as an app (PWA)

If you install ChessRetabled from your browser, a copy of the app's files
(including the chess engine) is cached **on your device** by a service worker so
it can run offline. This cache stays local and can be removed by uninstalling
the app or clearing site data.

## Children

ChessRetabled is a general-audience game and does not knowingly collect any
personal information from anyone, including children.

## Changes

This policy may change as the app evolves; the date at the top reflects the last
revision. Questions or concerns: please open an issue on the project's GitHub
repository.
