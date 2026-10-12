# Deploy on Ubuntu at `http://YOUR-IP/meat-price/`

This project already includes `base: '/meat-price/'` in Vite, a multi-stage production
Dockerfile, and an Nginx server that serves files at `/meat-price/`.

## 1. Identify the service that already owns port 80/443

```bash
sudo ss -ltnp '( sport = :80 or sport = :443 )'
docker ps --format 'table {{.Names}}\t{{.Ports}}'
```

**Important:** Two containers cannot both bind the same host port on the same IP.
The existing reverse proxy needs to route `/meat-price/` to this new container.
If your original application itself binds port 80 and there is no reverse proxy,
reconfigure it to use an internal port, and place a single Nginx/Caddy/Traefik proxy
in front of both apps. Do not attempt to launch a second port-80 container.

## 2. Start the new app on an unused loopback port

```bash
docker compose up -d --build
docker compose ps
curl -I http://127.0.0.1:8088/meat-price/
```

The compose file binds **127.0.0.1:8088**, not public `0.0.0.0:8088`.
Change to another free port if necessary:

```bash
MEAT_PRICE_PORT=8099 docker compose up -d --build
```

If you change the port, also change the upstream port in the proxy example.

## 3A. If your existing Nginx runs directly on Ubuntu

Open the already-active Nginx `server {}` for your IP/domain (the same block
that currently routes your other service). Paste the two `location` blocks from
`deploy/existing-nginx-location.conf` inside it.

The `proxy_pass` must NOT end in a slash; keeping `/meat-price/` is necessary.

```bash
sudo nginx -t
sudo systemctl reload nginx
curl -I http://YOUR-IP/meat-price/
```

Visit `http://YOUR-IP/meat-price/`. Your old service and its original routes
remain unchanged.

## 3B. If your existing Nginx is a Docker container

Determine the Docker network used by the proxy:

```bash
docker inspect YOUR_PROXY_CONTAINER --format '{{json .NetworkSettings.Networks}}'
```

Join the new app to that **existing** network:

```bash
PROXY_DOCKER_NETWORK=YOUR_NETWORK docker compose \
  -f compose.yaml -f deploy/compose.proxy-network.yaml up -d --build
```

Add the rules from `deploy/existing-docker-nginx-location.conf` to the
**existing proxy container's Nginx configuration** and reload that proxy.
It connects to `http://meat-price:80`, not `127.0.0.1:8088` (which would refer
to the proxy container itself).

If using Nginx Proxy Manager, Caddy, Traefik or another proxy, configure the
**same prefix** `/meat-price/` to forward to the `meat-price` container port 80,
without stripping the prefix. The exact UI/configuration depends on that proxy.

## Troubleshooting

- **404 on JS/CSS:** ensure Vite `base` remains `/meat-price/` and reverse proxy
  preserves `/meat-price/` (no slash on the end of `proxy_pass`).
- **502 from existing proxy:** check `docker compose logs`, container network,
  upstream name/port, and that the app started successfully.
- **Port 8088 occupied:** set `MEAT_PRICE_PORT` to an available number. No
  new public port needs to be opened in UFW.
- **HTTPS:** keep TLS on the existing proxy. This app container can use HTTP
  internally.
- **Storage:** the calculator stores data in the user's browser localStorage,
  not a Docker volume. Updating/replacing the container preserves browser data
  so long as the public origin (scheme/host/port) stays the same.
