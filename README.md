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

## Discourse page header

The discourse page (`/blog/:slugId`, `pages/blog/Blog.jsx`) has three pill
controls that are deliberately one visual system — same box, border, and type:

| Pill | Lives in | Position |
|---|---|---|
| Highlights & Comments | `components/highlights/HighlightsSidebar.jsx` | under the Logo, top left |
| Other Search Results | `components/citations/OtherSearchResultsMenu.jsx` | under the Navbar, top right — the mirror |
| Return to Search | inline in `Blog.jsx` | centred, under the title |

`OtherSearchResultsMenu` is a deliberate twin of `HighlightsSidebar`: same
trigger classes, same cream dropdown shell, same open/close behaviour
(outside-click + Escape). **Restyle one and you must restyle the other** — the
only intended differences are the dropdown anchor (`right-0` vs `left-0`) and
its slightly greater width. It replaced an inline right-hand column and a
right-edge slide-over drawer; the discourse column is centred by `justify-center`
on the body row, so nothing may be re-introduced beside it without breaking that.

**"Other Search Results" is the UI name; `citations` is the data name.** The
router-state key, the `sessionStorage` key (`blog-citations`) and every prop are
still `citations`. Don't rename one without the other.

### Layout traps

- **`Navbar`'s root is `w-full`** (`components/Navbar/index.jsx`). In a flex row
  it claims the whole line, and inside a `flex-wrap` container it forces its
  siblings onto a line of their own — it needs a `min-w-0` wrapper. Its
  horizontal padding is variant-conditional (`px-0` for `variant="blog"`,
  `px-12` otherwise) so the blog header's right edge lines up with the pills
  rather than sitting 48px inside them.
- **The hero is a fixed `h-[375px]` and the discourse card is pulled up by
  `-top-20`**, so the card's top edge sits at a constant 295px *regardless of how
  tall the header grows*. Anything added to the header pushes "Return to Search"
  down toward that fixed edge — enlarging the header means taking the space back
  above the button (currently the title's `mb-4`). Growing the pills from 30px to
  38px was enough to make the button collide with the card.
