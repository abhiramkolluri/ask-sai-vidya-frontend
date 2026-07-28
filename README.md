# Getting Started with Create React App

This project was bootstrapped with [Create React App](https://github.com/facebook/create-react-app).

## To get started

Navigate to the project directory:

## Check `.env.local` file

If the `.env.local` file doesn't exists, create one and ensure that `REACT_APP_BASE_API_SERVER` is pointing to the correct backend server.

```
REACT_APP_BASE_API_SERVER = http://localhost:8000
```

or for using the prod, for example, point it to the Prod URL:

```
REACT_APP_BASE_API_SERVER = https://qrsmk74u20.execute-api.us-east-1.amazonaws.com/prod
```

### `npm install`

This installs the required repository to the application.

### `npm start`

Runs the app in the development mode.\
Open [http://localhost:3000](http://localhost:3000) to view it in your browser.

The page will reload when you make changes.\
You may also see any lint errors in the console.

## Discourse highlighting

Opening a discourse from a search result highlights the part that matched. Which
highlight you get depends on **how the backend answered**, so the two repos are
coupled through the search trace — see `ask-sai-baba/backend/README.md`.

| Backend route | Discourse page shows |
|---|---|
| `keyword` (a bare 1-2 word search like `karma`) | **Every** whole-word occurrence of the term, plus a find-in-page control |
| anything else | The single best-answer sentence, as before |

**Gate on `trace.route === "keyword"`, not on `trace.keyword` existing.** The
backend also sets `trace.keyword` when the keyword route was *tried* and fell
back to semantic search for want of literal matches; those results are semantic
and must keep the single-sentence highlight.

**Getting the term to the page.** `Blog.jsx` re-fetches the article by id and is
told nothing about the search, so the term is carried explicitly:

- `Reply.jsx` puts `keywordTerm` in the `<Link>` router state.
- `ChatBox.jsx::rememberPassages` mirrors it into `sessionStorage.asv_keyword_terms`
  (keyed by discourse id) for refresh / direct-URL, alongside the existing
  `asv_matched_passages` and `asv_best_sentences`. A non-keyword search **deletes**
  each returned discourse's entry rather than skipping it — otherwise searching
  `karma` and later asking a full question that returns the same discourse would
  leave the stale term behind and highlight a word the user is no longer searching.
- Any `<Link>` that rebuilds router state by naming fields must carry `keywordTerm`
  too, or navigating there drops the highlighting.

**Matching** is whole-word and case-insensitive, tokens joined by `[^\w]+` so
`inner peace` also matches `inner, peace`. `karma` marks the `Karma` in
`Karma-Yoga` but not `karmic`. Word boundaries via `\b` rather than lookbehind —
Safari only gained lookbehind in 16.4.

**Scrolling.** Smooth scrolling silently no-ops in some Chrome configurations
(measured: `behavior:"auto"` scrolled, `behavior:"smooth"` did nothing, with no
error and `prefers-reduced-motion` off). `scrollIntoViewSafely` animates, then
checks whether anything actually moved and repeats the scroll instantly if not.
Use it for any scroll the user is waiting on.
