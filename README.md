# frankremmy.github.io

My portfolio. I'm a support engineer moving into security operations and GRC, and the site tells that as one investigation: scroll, and a phishing email turns into Domain Admin, rebuilt from the logs. After the film come the case files, skills, path, credentials, a terminal and a couple of games.

**Live:** https://frankremmy.github.io

Built by hand with plain HTML, CSS and JavaScript modules, plus three.js for the film. No framework, no build step, no cookies, no trackers. There are five flags hidden around the site, if you like that sort of thing.

## Run it locally

```sh
python3 -m http.server
```

Then open http://localhost:8000. Opening `index.html` straight from disk won't work, because the scripts are ES modules and need a server.

## Where things live

| Path | What it is |
| --- | --- |
| `index.html` | The page |
| `css/site.css` | All styles |
| `js/content.js` | Every word on the site: cases, skills, path, credentials |
| `js/main.js` | Page controller: intake ticket, captions, sections |
| `js/chrome.js` | Header and footer navigation, the film's rails |
| `js/film.js`, `js/film/` | The 3D film |
| `vendor/` | three.js and its add-ons |
| `404.html` | The not-found page |

`.nojekyll` stops GitHub Pages running Jekyll, which would otherwise skip the `.well-known` folder.
