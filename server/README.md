# Auto Reply Service

This backend exposes an automated review responder that watches every authenticated Google Business profile, drafts empathetic replies with OpenAI, and posts them after a configurable delay.

## Environment Variables

| Variable | Description | Default |
| --- | --- | --- |
| `OPENAI_API_KEY` | Required key used to call the OpenAI Chat Completions API. | — |
| `OPENAI_MODEL` | Chat model used for drafting replies. | `gpt-4o-mini` |
| `OPENAI_TIMEOUT_MS` | Request timeout when communicating with OpenAI. | `20000` |
| `AUTO_REPLY_SERVICE_ENABLED` | Set to `false` to disable the background worker. | `true` |
| `AUTO_REPLY_SCAN_INTERVAL_MS` | Poll interval for syncing reviews. | `300000` (5 minutes) |
| `AUTO_REPLY_MAX_GENERATE` | Max replies to draft per cycle. | `5` |
| `AUTO_REPLY_MAX_DISPATCH` | Max replies to send per cycle. | `5` |

## How It Works

1. **Detection** – `autoReplyService` polls Google for every user that has auto-replies enabled and enqueues any new unreplied reviews in `AutoReplyTask`.
2. **Generation** – Each task is analyzed with a LangChain prompt template plus the OpenAI API to classify sentiment, extract the reviewer’s name, and craft a human-sounding response.
3. **Scheduling** – Replies are delayed according to each user’s settings (1h/3h/6h/12h/24h) to keep responses natural.
4. **Dispatch** – When the delay expires the service calls the Google My Business reply endpoint and marks the task as sent. Failures are captured for retrying from the UI.

Use the new `/api/auto-reply/*` endpoints (consumed by the dashboard) to toggle the feature, tune delay/tone, review queue status, and trigger manual runs.


