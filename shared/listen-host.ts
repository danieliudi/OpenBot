import { isIP } from "node:net";

/**
 * The address a process listens on, from `SERVER_HOST` or `APP_HOST`.
 *
 * Unset keeps what each process did before this setting existed: the API server passes no hostname
 * to `Bun.serve`, which listens on every interface, and the app's Vite server listens on `::`, which
 * is every interface as well. That default is what a container needs, since a published port reaches
 * the process through the container's own interface rather than its loopback. A laptop running
 * `OPENBOT_SINGLE_USER=true` is the opposite case: anybody who reaches the port is the administrator,
 * so it sets both to `127.0.0.1` and the LAN gets a refused connection instead.
 *
 * An empty value is unset, the same trap `listenPort` describes for `PORT=`. Only an IP literal or
 * `localhost` is accepted. A hostname would be resolved by whoever binds it, to whichever address
 * that runtime prefers, and the point of setting this is to know which interface is listening.
 */
export function listenHost(
  raw: string | undefined,
): { ok: true; host: string | undefined } | { ok: false; reason: string } {
  const trimmed = raw?.trim();
  if (!trimmed) return { ok: true, host: undefined };
  const bare = trimmed.replace(/^\[(.*)\]$/, "$1");
  if (bare === "localhost" || isIP(bare) !== 0) return { ok: true, host: bare };
  return {
    ok: false,
    reason: `HOST must be an IP address such as 127.0.0.1 or ::1, or localhost (got ${JSON.stringify(raw)}).`,
  };
}

/**
 * The host part of a URL that reaches a process listening on `host`.
 *
 * A wildcard (`0.0.0.0`, `::`) or no host at all is reached through `localhost`, which is what every
 * caller here used before. A specific address is dialled as itself, because `localhost` may resolve
 * to the other loopback family and find nothing there. IPv6 goes in brackets.
 */
export function dialHost(host: string | undefined): string {
  if (host === undefined || host === "0.0.0.0" || host === "::") {
    return "localhost";
  }
  return isIP(host) === 6 ? `[${host}]` : host;
}
