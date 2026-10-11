import { describe, expect, test } from "bun:test";
import { dialHost, listenHost } from "./listen-host";

describe("listenHost", () => {
  test("unset or empty keeps each process's own default", () => {
    expect(listenHost(undefined)).toEqual({ ok: true, host: undefined });
    expect(listenHost("")).toEqual({ ok: true, host: undefined });
    expect(listenHost("   ")).toEqual({ ok: true, host: undefined });
  });

  test("takes an IP literal or localhost", () => {
    expect(listenHost("127.0.0.1")).toEqual({ ok: true, host: "127.0.0.1" });
    expect(listenHost(" ::1 ")).toEqual({ ok: true, host: "::1" });
    expect(listenHost("[::1]")).toEqual({ ok: true, host: "::1" });
    expect(listenHost("0.0.0.0")).toEqual({ ok: true, host: "0.0.0.0" });
    expect(listenHost("localhost")).toEqual({ ok: true, host: "localhost" });
  });

  test("refuses a name it would have to resolve, and anything with a port", () => {
    expect(listenHost("openbot.lan").ok).toBe(false);
    expect(listenHost("127.0.0.1:3001").ok).toBe(false);
    expect(listenHost("http://127.0.0.1").ok).toBe(false);
  });
});

describe("dialHost", () => {
  test("a wildcard or no host is reached through localhost, as before", () => {
    expect(dialHost(undefined)).toBe("localhost");
    expect(dialHost("0.0.0.0")).toBe("localhost");
    expect(dialHost("::")).toBe("localhost");
  });

  test("a specific address is dialled as itself, IPv6 in brackets", () => {
    expect(dialHost("127.0.0.1")).toBe("127.0.0.1");
    expect(dialHost("::1")).toBe("[::1]");
    expect(dialHost("localhost")).toBe("localhost");
  });
});
