#!/usr/bin/env python3

import os
from jinja2 import Environment, FileSystemLoader
import typer


def main(
    down: bool = typer.Option(
        False, "--down", help="Generate docker-compose for clean up."
    )
):
    keystores_initialized = False if down else os.path.exists("data/gov-orderer")
    env = Environment(loader=FileSystemLoader("./"), trim_blocks=True)

    print(
        env.get_template("docker-compose.yaml.j2").render(
            keystores_initialized=keystores_initialized
        )
    )


if __name__ == "__main__":
    typer.run(main)
