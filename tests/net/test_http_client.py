"""std.http.HttpClient (the class-based API) must complete real HTTP
transactions against a real local HTTP server: all verb methods map to
the five grouped routes, and Response exposes status/ok/json properly."""
import pathlib
import sys
import threading
from http.server import BaseHTTPRequestHandler, HTTPServer

sys.path.insert(0, str(pathlib.Path(__file__).resolve().parent.parent.parent))


def test_client():
    from std.http import HttpClient, HttpError

    class H(BaseHTTPRequestHandler):
        def _r(self, code, body):
            self.send_response(code)
            self.send_header("Content-Length", str(len(body)))
            self.end_headers()
            if body:
                self.wfile.write(body)

        def _drain(self):
            n = int(self.headers.get("Content-Length", "0") or "0")
            if n:
                self.rfile.read(n)

        def do_GET(self):
            self._r(200, b"<h1>ok</h1>")

        def do_POST(self):
            self._drain()
            self._r(201, b'{"got":1}')

        def do_PUT(self):
            self._drain()
            self._r(202, b'{"put":true}')

        def do_PATCH(self):
            self._drain()
            self._r(206, b'{"patched":true}')

        def do_DELETE(self):
            self._r(204, b"")

        def log_message(self, *a):
            pass

    srv = HTTPServer(("127.0.0.1", 0), H)
    port = srv.server_address[1]
    threading.Thread(target=srv.serve_forever, daemon=True).start()

    c = HttpClient(f"http://127.0.0.1:{port}")
    r = c.get("")
    assert (r.status, r.body) == (200, "<h1>ok</h1>"), r
    assert r.ok is True

    r = c.post("/", body='{"a": 1}')
    assert (r.status, r.body) == (201, '{"got":1}'), r
    assert r.json() == {"got": 1}

    r = c.put("/", body="")
    assert (r.status, r.body) == (202, '{"put":true}'), r

    r = c.patch("/", body="")
    assert (r.status, r.body) == (206, '{"patched":true}'), r

    r = c.delete("/")
    assert (r.status, r.body) == (204, ""), r
    assert r.ok is True

    try:
        c.request("", "/")
        raise SystemExit("expected HttpError for empty method")
    except HttpError:
        pass

    srv.shutdown()


if __name__ == "__main__":
    test_client()
    print("client ok")
