# fleet

private, ephemeral chat rooms. pick a name, share a link, talk — everything disappears.

fleet is a real-time chat platform where messages exist only in memory. there's no database, no authentication, no analytics. every message has a time-to-live (default 30 minutes) and visually fades as it approaches expiry. when it's gone, it's gone. when the server stops, everything is gone.

the idea is simple: sometimes you need a space to talk that doesn't leave a trace. a quick design review, a sensitive conversation, a throwaway brainstorm. fleet gives you a room that cleans up after itself.

## features

- **ephemeral by default** — messages auto-delete after a configurable ttl. you can watch them fade.
- **rooms** — create a room by naming it. share the url. anyone with the link joins instantly.
- **real-time** — websocket-powered messaging, typing indicators, live user presence.
- **no persistence** — everything lives in memory. no database, no logs, no message history.
- **no auth** — pick a username and go. no accounts, no emails, no passwords.
- **self-hostable** — one docker container. deploy it on your own infrastructure.
- **responsive** — works on desktop and mobile with adaptive layout.

## quick start

### local development

```bash
bun install
bun run dev
```

open [http://localhost:3000](http://localhost:3000), pick a username and room name, start chatting.

### docker

```bash
docker compose up --build
```

to run on a different port, change the port mapping in `docker-compose.yml`:

```yaml
ports:
  - "8080:3000"
```

## how it works

a custom `server.ts` runs both next.js and socket.io on a single http server. next.js handles page rendering, socket.io handles real-time messaging. all state lives in an in-memory store — a collection of `Map` and `Set` structures that get garbage collected when the process exits.

```
server.ts
├── next.js (pages, assets)
└── socket.io (websockets)
    └── in-memory store (rooms, messages, users)
```

a background cleanup runs every 60 seconds: it expires old messages, notifies connected clients, and removes empty rooms.

## configuration

all tunables live in `server/constants.ts`:

| setting | default | description |
|---------|---------|-------------|
| `DEFAULT_TTL_MINUTES` | 30 | how long messages live |
| `MAX_ROOM_CAPACITY` | 50 | max users per room |
| `MAX_MESSAGE_LENGTH` | 1000 | character limit per message |
| `MAX_MESSAGES_PER_ROOM` | 500 | message buffer before oldest are dropped |
| `MAX_MESSAGES_PER_MINUTE` | 30 | per-user rate limit |

## tech stack

- [next.js 16](https://nextjs.org/) + react 19
- [socket.io](https://socket.io/) for websockets
- [bun](https://bun.sh/) runtime
- [shadcn/ui](https://ui.shadcn.com/) components
- [tailwind css 4](https://tailwindcss.com/)

## license

mit
