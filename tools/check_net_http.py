#!/usr/bin/env python3
"""`std/http.lio` (a Lithon HTTP client) must complete real HTTP
transactions against a real local HTTP server.

The oracle is `http.server` (stdlib, loopback) because sockets are stateful
and external — tier agreement alone could hide a wrong `sockaddr_in` packing
the same way in both tiers. Lithon's side hands the whole request/response
cycle to `std/http.lio`'s `http_request()` over raw `syscall()`; if the
hand-rolled port/IP packing, the byte-built request, or the status/body
parsing were wrong, the server would not answer with the documented
statuses and bodies.

Lithon has no import system and str globals cannot be reassigned, so the
harness generates one combined program per verb: `std/http.lio` with the
three input literals replaced for the case at hand, plus a two-line driver
that calls `http_request()` and prints status + body. Each program is
compiled with the real frontend and run through `build/tier_runner` in all
three modes; every mode's stdout must equal the expected transcript.

If loopback sockets cannot be opened at all on this host, the check reports
SKIP (same honesty rule as `tools/check_net_loopback.py`).
"""
import pathlib
import socket
import subprocess
import sys
import tempfile
import threading
from http.server import BaseHTTPRequestHandler, HTTPServer

ROOT = pathlib.Path(__file__).resolve().parent.parent
RUNNER = ROOT / "build" / "tier_runner"
FRONTEND = ROOT / "src" / "frontend" / "frontend.py"
HTTP_LIB = ROOT / "std" / "http.lio"
DRIVERS = ["http_get", "http_post", "http_put", "http_patch", "http_delete"]

CASES = {
    "http_get": ("GET", "", ["200", "<h1>ok</h1>"]),
    "http_post": ("POST", '{"a": 1}', ["201", '{"got":1}']),
    "http_put": ("PUT", '{"put": 1}', ["202", '{"put":true}']),
    "http_patch": ("PATCH", '{"patch": 1}', ["206", '{"patched":true}']),
    "http_delete": ("DELETE", "", ["204", ""]),
}
TIER_FLAGS = [("--interp", "interpreter"), ("--strict", "native"), ("--auto", "auto")]


def make_handler():
    class Handler(BaseHTTPRequestHandler):
        def _reply(self, code: int, body: bytes) -> None:
            self.send_response(code)
            ctype = "text/html" if body.startswith(b"<") else "application/json"
            self.send_header("Content-Type", ctype)
            self.send_header("Content-Length", str(len(body)))
            self.end_headers()
            if body:
                self.wfile.write(body)

        def _drain(self) -> None:
            n = int(self.headers.get("Content-Length", "0") or "0")
            if n:
                self.rfile.read(n)

        def do_GET(self):
            self._reply(200, b"<h1>ok</h1>")

        def do_POST(self):
            self._drain()
            self._reply(201, b'{"got":1}')

        def do_PUT(self):
            self._drain()
            self._reply(202, b'{"put":true}')

        def do_PATCH(self):
            self._drain()
            self._reply(206, b'{"patched":true}')

        def do_DELETE(self):
            self._reply(204, b"")

        def log_message(self, *args):
            pass

    return Handler


def main() -> int:
    if not RUNNER.exists():
        sys.exit(f"missing {RUNNER}; build tier_runner first (see src/jit/tier_runner.cpp)")

    # Ephemeral port: the kernel picks one (and getsockname needs no
    # read-back here — Python holds the real port in server_address).
    srv = HTTPServer(("127.0.0.1", 0), make_handler())
    port = srv.server_address[1]
    thread = threading.Thread(target=srv.serve_forever, daemon=True)
    thread.start()

    lib = HTTP_LIB.read_text()
    bad = 0
    with tempfile.TemporaryDirectory() as td:
        tmp = pathlib.Path(td)
        for stem in DRIVERS:
            method, body, expected = CASES[stem]
            url = f"http://127.0.0.1:{port}/hello"

            # std/http.lio is a top-level program that prints status + body
            # itself; only the three input literals vary per case.
            src = lib
            src = src.replace(
                'http_method: str[8] = "GET"', f'http_method: str[8] = "{method}"'
            )
            src = src.replace(
                'http_url: str[256] = "http://127.0.0.1:8080/"', f'http_url: str[256] = "{url}"'
            )
            # Body literals contain double quotes (JSON); escape them for
            # the double-quoted Lithon string literal.
            body_esc = body.replace("\\", "\\\\").replace('"', '\\"')
            src = src.replace(
                'http_body: str[2048] = ""', f'http_body: str[2048] = "{body_esc}"'
            )

            program = tmp / f"{stem}.lio"
            program.write_text(src)

            fe = subprocess.run(
                [sys.executable, str(FRONTEND), str(program)],
                capture_output=True, text=True,
            )
            if fe.returncode:
                print(f"FAIL [{stem}] frontend:\n{fe.stderr}")
                bad += 1
                continue
            ir = tmp / f"{stem}.ir"
            ir.write_text(fe.stdout)

            for flag, tier in TIER_FLAGS:
                r = subprocess.run(
                    [str(RUNNER), str(ir), flag], capture_output=True, text=True,
                )
                if r.returncode:
                    print(f"FAIL [{stem}/{tier}] {flag}: exit {r.returncode}\n{r.stderr}")
                    bad += 1
                    continue
                out = r.stdout.splitlines()
                if out != expected:
                    print(f"FAIL [{stem}/{tier}] {flag}: wrong transcript")
                    print(f"  expected: {expected}")
                    print(f"  got:      {out}")
                    bad += 1
                else:
                    print(f"PASS [{stem}/{tier}] {flag}: {out[0]} exact")

    srv.shutdown()
    return 1 if bad else 0


if __name__ == "__main__":
    try:
        sys.exit(main())
    except (OSError, socket.timeout):
        print("SKIP: this host cannot complete a loopback round trip (no sockets)")
        sys.exit(0)
