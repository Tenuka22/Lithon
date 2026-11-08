# std/http — HTTP client

One verb path to rule all verbs: the method literal picks the verb, and
JSON/HTML bodies are both plain text (the client makes no distinction,
only how you read the output).

```python
from std.http import HttpClient

client = HttpClient("http://127.0.0.1:8080")
r = client.post("/api", body='{"sku": 7}')
print(r.status, r.ok)      # 201 True
print(r.body)              # {"credited": true}
print(r.json())            # {"created": True}
```

Verb methods map to the grouped `ROUTES`: `get(url)`, `post(url, body="")`,
`put(url, body="")`, `patch(url, body="")`, `delete(url)`. Unknown methods
pass through verbatim via `client.request(method, url, body="")`.

The response is `Response(status, body, tier)` — status is the HTTP code,
or 0 when the request could not be made (bad URL, refused connect,
malformed response).

## Architecture

The Lithon side is five `.lio` pieces concatenated in order (Lithon has
no import system — concatenation IS the inclusion). The Python side lives
in `raw.py` (concatenation + verb substitution) and `client.py`.

| File | Role |
|---|---|
| `00_common.lio` | swap helpers, the kernel-visible `Chunker` (int[8] struct fields), globals & templates |
| `10_url.lio` | URL parse (`http://host[:port][/path]`) + IPv4-literal / `localhost` |
| `11_request.lio` | request assembly into the `req` str run |
| `12_send.lio` | socket + connect + chunked send |
| `13_recv.lio` | chunked recv + streaming status/boundary/body parse; prints `status` and `http_out` |

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
