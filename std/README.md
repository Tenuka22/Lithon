# std/

A standard library for Lithon programs, in Lithon. No collection yet
beyond what ships here — one module per file, each self-contained
because Lithon has no import system (`.lio` files cannot import each
other; you prepend the module to your program, or paste it in).

## `http.lio` — an HTTP client

Every verb rides one code path; the method literal picks the verb and
JSON/HTML bodies are both plain text (the client makes no distinction,
only how you read the output):

```lio
http_method = "POST"                  # GET / PUT / PATCH / POST / DELETE
http_url = "http://127.0.0.1:8080/api/items"
http_body = '{"sku": 7}'               # "" for bodyless calls
# ... this file runs ...
http_status: 201
http_out:    {"created": true}
```

(Edit the three literals at the top of `std/http.lio`; it runs as a
program when prepended to — or pasted into — yours. `tools/
check_net_http.py` proves all five verbs against a real local server
in all three tiers.)

Limits, all deliberate:

- Plain `http://` only — no TLS stack exists; `https://` never connects.
- IPv4 literals + `localhost` only — there is no DNS resolver.
- Linux/x86-64 syscall numbers; 8192-byte response cap, 4095-byte body cap.
- Fixed headers: `Host`, `Connection: close`, and for a body
  `Content-Length` + `Content-Type: application/json`. No custom headers,
  redirects, timeouts, or keep-alive.
