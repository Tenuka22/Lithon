# std/

A standard library for Lithon programs, in Lithon. Lithon has no import
system (`.lio` files cannot import each other), so each module is a
folder of `.lio` pieces that you concatenate in order — or prepend.

## `http/` — an HTTP client

Every verb rides one code path; the method literal picks the verb and
JSON/HTML bodies are both plain text (the client makes no distinction,
only how you read the output):

```python
from std.http import ROUTES, program, run

program()          # the full concatenated Lithon source
run(method="POST", url="http://127.0.0.1:8080/api", body='{"sku": 7}')
                    # {"program": <source with defaults substituted>}
```

The five verbs are grouped in `std.http.ROUTES` (`get`, `post`, `put`,
`patch`, `delete`); unknown methods pass through verbatim. Parts:

| File | Role |
|---|---|
| `http/00_common.lio` | swap helpers, the kernel-visible `Chunker`, globals & templates |
| `http/10_url.lio` | URL parse (`http://host[:port][/path]`) + IPv4-literal / `localhost` |
| `http/11_request.lio` | request assembly into the `req` str run |
| `http/12_send.lio` | socket + connect + chunked send |
| `http/13_recv.lio` | chunked recv + streaming status/boundary/body parse; prints `status` and `http_out` |

Buffers are structs of `int[8]` fields — the only kernel-visible
memory in both tiers (the interpreter keeps string runs as value
lists, invisible to syscalls).

Limits, all deliberate:

- Plain `http://` only — no TLS stack exists; `https://` never connects.
- IPv4 literals + `localhost` only — there is no DNS resolver.
- Linux/x86-64 syscall numbers; 8192-byte response cap, 4095-byte body cap.
- Fixed headers: `Host`, `Connection: close`, and for a body
  `Content-Length` + `Content-Type: application/json`. No custom headers,
  redirects, timeouts, or keep-alive.

Packaging: `pip install -e .` (or any pip-based update) ships the
`std` package with its `.lio` sources as package data (`MANIFEST.in`).
