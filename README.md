# ITPF Case Assessment Portal v1

## 1. Deploy the Worker

```bash
npx wrangler secret put OPENAI_API_KEY
npx wrangler deploy
```

Copy the deployed Worker URL into `config.js` as `assessCaseUrl`, retaining `/assess-case`.

## 2. Publish the frontend

Upload these files to the GitHub Pages repository used for the course tools:

- `index.html`
- `styles.css`
- `app.js`
- `cases.js`
- `config.js`

Do not publish `worker.js` as part of the static website. It contains course guidance but no API key.

## 3. Worker configuration

The Worker accepts POST requests at `/assess-case`. The OpenAI key is stored as the Cloudflare secret `OPENAI_API_KEY`. The default model is `gpt-5.6-luna`; change `OPENAI_MODEL` in `wrangler.toml` if required.

## 4. Score submission

`config.js` already points to the existing protected score and student-results endpoints used by the quizzes. Case scores are sent as `CASE-01` to `CASE-07`, scored from 0 to 5.
