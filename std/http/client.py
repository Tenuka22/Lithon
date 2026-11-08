"""Class-based client for the std/http module.

    from std.http import HttpClient

    client = HttpClient("http://127.0.0.1:8080")
    r = client.post("/api", body='{"sku": 7}')
    print(r.status, r.ok)
    print(r.body)

The Lithon side does the socket work (see README.md in this directory
for the architecture: int[8]-field Chunker struct is the only
kernel-visible buffer in both tiers). This class handles the Python
side: URL resolution, the method literal, running the self-contained
program through the Lithon toolchain, and parsing its output.
"""

import json
from dataclasses import dataclass

from .raw import ROUTES, run


class HttpError(Exception):
    """Raised for an invalid client-side input (empty method/url)."""

    def __init__(self, message: str):
        super().__init__(message)


@dataclass
class Response:
    """One completed request: HTTP status code + body text."""

    status: int
    body: str
    tier: str = ""

    @property
    def ok(self) -> bool:
        """2xx/3xx — the common success band for JSON/HTML APIs."""
        return 200 <= self.status < 400

    def json(self):
        """The body parsed as JSON (performs the XML run of parse errors!)."""
        return json.loads(self.body)


class HttpClient:
    """HTTP client with grouped verb methods:

        client.get(url)      client.post(url, body="")  client.put(url, body="")
        client.patch(url, body="")                       client.delete(url)

    `url` may be an absolute URL or a path appended to `base_url`.
    Bodies are opaque strings (JSON, HTML, plain text) — the Lithon side
    does not distinguish them.
    """

    def __init__(self, base_url: str = "http://127.0.0.1:8080/", timeout: float = 25.0):
        self.base_url = base_url
        self.timeout = timeout

    def _resolve(self, url: str) -> str:
        return url if url.startswith("http://") or url.startswith("https://") else \
            self.base_url.rstrip("/") + (url if url.startswith("/") else "/" + url)

    def request(self, method: str, url: str, body: str = "") -> Response:
        if not method:
            raise HttpError("method must be non-empty")
        url = self._resolve(url)
        if not url:
            raise HttpError("url must be non-empty")
        source = run(method=method.upper(), url=url, body=body)["program"]
        from init import run_source  # noqa: E402  (deferred: only for actual requests)
        try:
            result = run_source(source, mode="auto", capture=True)
        except Exception as exc:  # LithonError, build missing, etc.
            raise HttpError(str(exc)) from exc
        out = result.stdout or ""
        status_line, sep, rest = out.partition("\n")
        status = int(status_line) if sep and status_line.strip().lstrip("-").isdigit() else 0
        text = rest[:-1] if rest.endswith("\n") else rest
        return Response(status=status, body=text, tier=result.tier)

    def get(self, url: str, body: str = "") -> Response:
        return self.request(ROUTES["get"], url, body)

    def post(self, url: str, body: str = "") -> Response:
        return self.request(ROUTES["post"], url, body)

    def put(self, url: str, body: str = "") -> Response:
        return self.request(ROUTES["put"], url, body)

    def patch(self, url: str, body: str = "") -> Response:
        return self.request(ROUTES["patch"], url, body)

    def delete(self, url: str, body: str = "") -> Response:
        return self.request(ROUTES["delete"], url, body)
