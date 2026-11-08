# std/http — HTTP client

One verb path to rule all verbs: method literal picks the verb, body is
opaque text (JSON and HTML make no distinction). This folder composes the
concatenated Lithon program in numeric order:

| File | Role |
|---|---|
| `00_common.lio` | swap helpers, kernel-visible `Chunker` (int[8] struct fields), globals & templates |
| `10_url.lio` | URL parse + IPv4-literal / `localhost` |
| `11_request.lio` | request assembly into the `req` str run |
| `12_send.lio` | socket + connect + chunked send |
| `13_recv.lio` | chunked recv + streaming status/boundary/body parse; prints `status` and `http_out` |

Reference it from any other std module via the Python package: the
concatenated source is `std.http.program()`, with per-request defaults
substituted by `std.http.run(method=..., url=..., body=...)`. The
five verbs are grouped in `std.http.ROUTES` (`get`, `post`, `put`,
`patch`, `delete`); unknown methods pass through verbatim.

`tests/net/` + `tools/check_net_http.py` prove all five verbs against
a real local server in all three tiers (interpreter/native/auto).

Limits (deliberate): plain `http://` only, IPv4 + `localhost` only,
8192-byte response cap, 4095-byte body cap, fixed headers, no custom
headers/redirects/timeouts/keep-alive.
