"""Lithon's standard library package.

Modules here ship their `.lio` sources as package data. Python-side code
can locate + concatenate them (Lithon itself has no import system, so the
concatenation IS the inclusion mechanism).

Example:
    from std.http import program
    source = program(method="POST", url="http://127.0.0.1:8080/api",
                     body='{"sku": 7}')
    # source is a complete, compilable Lithon program (see README in this dir)
"""

from pathlib import Path

# Concatenation order for this module's pieces (numeric prefixes enforce it).
PARTS = (
    "00_common.lio",
    "10_url.lio",
    "11_request.lio",
    "12_send.lio",
    "13_recv.lio",
)


def part(name: str) -> str:
    """One piece of a module's sources, as text."""
    return (Path(__file__).parent / name).read_text()


def program(parts: tuple[str, ...] = PARTS) -> str:
    """The full module source: all parts concatenated in order (readable
    self-contained fragment, ready to prepend to a Lithon program)."""
    return "".join(part(name) for name in parts)


# Grouped routes: the five verbs supported by std/http/. Each maps to the
# same Lithon code path; the method literal picks the verb.
ROUTES = {
    "get": "GET",
    "post": "POST",
    "put": "PUT",
    "patch": "PATCH",
    "delete": "DELETE",
}


def run(method: str = "GET", url: str = "http://127.0.0.1:8080/", body: str = "") -> dict:
    """Build the Lithon program for one request (method/url/body defaults
    substituted at the same marked literals check_net_http substitutes).

    Returns {"program": <source str>} — compile/run it with the Lithon
    toolchain. Unknown methods are accepted by the Lithon side (verbatim
    caps), so custom verbs pass through untouched.
    """
    src = program()
    src = src.replace(
        'http_method: str[8] = "GET"', f'http_method: str[8] = "{method}"'
    )
    src = src.replace(
        'http_url: str[256] = "http://127.0.0.1:8080/"', f'http_url: str[256] = "{url}"'
    )
    body_esc = body.replace("\\", "\\\\").replace('"', '\\"')
    src = src.replace(
        'http_body: str[2048] = ""', f'http_body: str[2048] = "{body_esc}"'
    )
    return {"program": src}


__all__ = ["part", "program", "run", "ROUTES", "PARTS"]
