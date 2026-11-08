# std/http — HTTP client

One verb path to rule all verbs: the method literal picks the verb, and
JSON/HTML bodies are both plain text (the client makes no distinction,
only how you read the output).

```python
from std.http import HttpClient

client = HttpClient("http://127.0.0.1:8080")
r = client.post("/api", body='{"sku": 7}')
print(r.status, r.ok)      # 201 True
print(r.body)              # {"created": true}
print(r.json())            # {"created": True}
```

Verb methods map to the grouped `ROUTES`: `get(url)`, `post(url, body="")`,
`put(url, body="")`, `patch(url, body="")`, `delete(url)`. Unknown methods
pass through verbatim via `client.request(method, url, body="")`.

The response is `Response(status, body, tier)` — status is the HTTP code,
or 0 when the request could not be made (bad URL, refused connect,
malformed response).

## Repository module map (concatenate in order)

| Group | File | Role |
|---|---|---|
| `core` | `core/01_scalars.lio` | endian swaps + `Chunker` (int[8] struct fields) |
| `core` | `core/02_state.lio` | module inputs/outputs/templates/buffers |
| `url` | `url/10_url.lio` | URL parse + IPv4-literal / `localhost` |
| `request` | `request/11_request.lio` | request byte assembly into `req` |
| `net` | `net/12_send.lio` | socket + connect + chunked send |
| `net` | `net/13_recv.lio` | chunked recv + streaming status/boundary/body parse |

`std.http.raw.GROUPS` is this table as data (order, not just names), so
future modules can be appended/expanded programmatically. Lithon itself
has no import statement — concatenation IS the inclusion mechanism;
`std.http.program()` performs it.

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

`tools/check_net_http.py` proves all five verbs against a real local
server in all three tiers (interpreter/native/auto); `tests/net/
test_http_client.py` covers the class API end-to-end as well.
