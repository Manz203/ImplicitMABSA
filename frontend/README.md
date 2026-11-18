# ImplicitMABSA frontend

Run `npm ci` and `npm run dev`. Vite proxies `POST /predict` to `http://127.0.0.1:8000` locally. To use an external backend, enter its full prediction URL in API settings or set `VITE_PREDICT_URL` at build time. The backend should allow the frontend origin in its CORS configuration and use HTTPS for a hosted frontend. Use `npm run build` to produce the static build.

The interface sends multipart fields named `model`, `text`, `aspect`, and `image` as required by the selected model. The IDs in src/main.jsx are gated_fusion, early_fusion, cross_attention, distilbert, and mobilenet_v3_small. Align these IDs with the backend router. The client expects sentiment, confidence, probabilities (negative, neutral, positive), and model in the response.

The example result uses illustrative scores. Live inference requires the team’s FastAPI service and trained weights.
