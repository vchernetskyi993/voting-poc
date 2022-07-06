#!/usr/bin/env python3

import os
from jinja2 import Environment, FileSystemLoader
import typer


def main(
    down: bool = typer.Option(
        False, "--all", help="Generate docker-compose with all optional services"
    )
):
    keystores_initialized = False if down else os.path.exists("data/gov/orderer")
    channel_initialized = False if down else os.path.exists("data/channel-artifacts")
    env = Environment(loader=FileSystemLoader("./"), trim_blocks=True)

    print(
        env.get_template("docker-compose.yaml.j2").render(
            keystores_initialized=keystores_initialized,
            channel_initialized=channel_initialized,
        )
    )


if __name__ == "__main__":
    typer.run(main)
