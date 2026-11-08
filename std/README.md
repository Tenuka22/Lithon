# std/

A standard library for Lithon programs, in Lithon. Lithon has no import
system (`.lio` files cannot import each other), so each module is a
folder of `.lio` pieces that you concatenate in order — or paste into
your program. `tools/check_net_http.py` shows the exact pattern.

## `http/` — an HTTP client

Every verb rides one code path; the method literal picks the verb and
JSON/HTML bodies are both plain text (the client makes no distinction,
only how you read the output):

```lio
http_method = "POST"                  # GET / PUT / PATCH / POST / DELETE
http_url = "http://127.0.0.1:8080/api/items"
http_body = '{"sku": 7}'               # "" for bodyless calls
# ... the parts run ...
http_status: 201
http_out:    {"created": true}
```

Concatenate in order (the numeric prefixes enforce this):

| File | Role |
|---|---|
| `00_common.lio` | swap helpers, the kernel-visible `Chunker` (int[8] struct fields), globals & templates |
| `10_url.lio` | URL parse (`http://host[:port][/path]`) + IPv4-literal / `localhost` resolution |
| `11_request.lio` | assembles the request bytes into the `req` str run |
| `12_send.lio` | socket + connect + chunked send of `req` |
| `13_recv.lio` | chunked recv with a streaming status/boundary/body parse; prints `status` and `http_out` |

Buffers are structs of `int[8]` fields — the only kernel-visible
memory in both tiers (the interpreter keeps string runs as value
lists, invisible to syscalls; proven by `tests/net/loopback.lio` and by
the 5-verb check in all three tiers).

Limits, all deliberate:

- Plain `http://` only — no TLS stack exists; `https://` never connects.
- IPv4 literals + `localhost` only — there is no DNS resolver.
- Linux/x86-64 syscall numbers; 8192-byte response cap, 4095-byte body cap.
- Fixed headers: `Host`, `Connection: close`, and for a body
  `Content-Length` + `Content-Type: application/json`. No custom headers,
  redirects, timeouts, or keep-alive.
