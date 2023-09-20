# Web Push with Nuxt

- https://web-push-nuxt.vercel.app/

<br/>

## Project Structure

### Web Push

- [web-push](https://www.npmjs.com/package/web-push)

### Frontend

#### Framework

- [Nuxt](https://nuxt.com)

#### UI

- [Vuetify](https://vuetifyjs.com)
- [vite-plugin-vuetify](https://www.npmjs.com/package/vite-plugin-vuetify)

#### PWA

- [Vite PWA](https://vite-pwa-org.netlify.app/)

### Backend

#### Server

- [Vercel](https://vercel.com)

#### Runtime

- [Deno](https://deno.land)

<!-- - [Node.js](https://nodejs.org) -->

#### Database

- [PlanetScale](https://planetscale.com)
- [MySQL](https://www.mysql.com)

#### ORM

- [Drizzle](https://orm.drizzle.team)

### Package Manager

- [pnpm](https://pnpm.io)

<br/>

## Setup

```bash
bun i
```

<br/>

## Development Server

Start the development server on `http://localhost:3000`:

```bash
bun dev
```

<br/>

## Production

Build the application for production:

```bash
bun run build
```

Locally preview production build:

```bash
bun preview
```

Check out the [deployment documentation](https://nuxt.com/docs/getting-started/deployment) for more information.

<br/>

## PWA

> https://vite-pwa-org.netlify.app/assets-generator

### Icon Generator

> https://cthedot.de/icongen

<br/>

## Environment Variables

Using Vercel, you can set environment variables in the project settings.

> - https://vercel.com/docs/projects/environment-variables

### Variables

- `VAPID_PUBLIC_KEY`
- `VAPID_PRIVATE_KEY`
- `VAPID_EMAIL`
- `DATABASE_URL`

### VAPID Keys

```bash
bunx web-push generate-vapid-keys --json
```

### Database URL

Using PlanetScale, you can get the database URL in the database settings.

> https://planetscale.com/docs/concepts/connection-strings

<br/>

## Help

### Bun Installation

```
brew tap oven-sh/bun
brew install bun
```

> Reference: https://github.com/oven-sh/homebrew-bun
