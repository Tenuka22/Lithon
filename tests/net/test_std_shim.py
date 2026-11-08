"""std.http (the package shim) must hand back a compilable program with
the requested verb/url/body defaults substituted — the same substitution
tools/check_net_http.py relies on."""
import pathlib
import subprocess
import sys
import tempfile


def test_shim():
    sys.path.insert(0, str(pathlib.Path(__file__).resolve().parent.parent.parent))
    from std.http import ROUTES, program, run

    assert set(ROUTES) == {"get", "post", "put", "patch", "delete"}
    src = program()
    assert src.count("def swap32") == 1 and "print(status)" in src
    # run() substitutes all three defaults
    out = run(method="POST", url="http://127.0.0.1:8890/hello", body='{"a": 1}')
    assert 'http_method: str[8] = "POST"' in out["program"]
    assert '"http://127.0.0.1:8890/hello"' in out["program"]
    assert 'http_body: str[2048] = "{\\"a\\": 1}"' in out["program"]
    # and it compiles with the real frontend
    with tempfile.NamedTemporaryFile("w", suffix=".lio", delete=False) as f:
        f.write(out["program"])
        name = f.name
    fe = subprocess.run(
        [sys.executable, "src/frontend/frontend.py", name],
        capture_output=True, text=True, cwd=pathlib.Path(__file__).parent.parent.parent,
    )
    assert fe.returncode == 0, fe.stderr


if __name__ == "__main__":
    test_shim()
    print("shim ok")
