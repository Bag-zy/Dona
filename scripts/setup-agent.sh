#!/bin/bash
cd "$(dirname "$0")/../agent" || exit 1

if [ ! -d ".venv" ]; then
    python3 -m venv .venv
fi

source .venv/bin/activate
pip install -r requirements.txt
