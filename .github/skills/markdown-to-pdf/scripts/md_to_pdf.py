#!/usr/bin/env python3
"""Convert a Markdown file to PDF using local Python libraries."""

from __future__ import annotations

import argparse
from pathlib import Path

from markdown import markdown
from weasyprint import HTML


def build_html(markdown_text: str) -> str:
    body = markdown(markdown_text, extensions=["extra", "tables"])
    return (
        "<!doctype html>\n"
        "<html>\n"
        "<head>\n"
        "<meta charset=\"utf-8\">\n"
        "<style>\n"
        "body { font-family: serif; font-size: 11pt; line-height: 1.5; }\n"
        "code, pre { font-family: monospace; }\n"
        "pre { white-space: pre-wrap; }\n"
        "table { border-collapse: collapse; }\n"
        "th, td { border: 1px solid #888; padding: 4px 6px; }\n"
        "</style>\n"
        "</head>\n"
        "<body>\n"
        f"{body}\n"
        "</body>\n"
        "</html>\n"
    )


def parse_args() -> argparse.Namespace:
    parser = argparse.ArgumentParser(description="Convert Markdown to PDF.")
    parser.add_argument("input", type=Path, help="Path to the input .md file")
    parser.add_argument("output", type=Path, help="Path to the output .pdf file")
    return parser.parse_args()


def main() -> None:
    args = parse_args()
    input_path: Path = args.input
    output_path: Path = args.output

    if not input_path.exists():
        raise SystemExit(f"Input file not found: {input_path}")

    markdown_text = input_path.read_text(encoding="utf-8")
    html = build_html(markdown_text)

    output_path.parent.mkdir(parents=True, exist_ok=True)
    HTML(string=html, base_url=str(input_path.parent)).write_pdf(str(output_path))


if __name__ == "__main__":
    main()
