#!/usr/bin/env python3

from dataclasses import dataclass
import os
from jinja2 import Environment, FileSystemLoader
import typer


def main(
    orgs: str = typer.Option(
        "gov",
        help="Comma separated list of organizations to generate compose for",
    ),
):
    channel_initialized = False if all else os.path.exists("data/channel-artifacts")
    env = Environment(loader=FileSystemLoader("./"))
    orgs_data = [org_data(org, i) for (i, org) in enumerate(orgs.split(","))]

    print(
        env.get_template("docker-compose.yaml.j2").render(
            orgs=orgs_data,
            channel_initialized=channel_initialized,
            parties=" ".join(
                map(
                    lambda org: f"{org.key},{org.msp_id}",
                    filter(lambda org: org.key != "gov", orgs_data),
                )
            ),
        )
    )


@dataclass
class OrgData:
    key: str
    keystores_initialized: bool
    ca_port: int
    msp_id: str
    peer_port: int
    peer_operations_port: int


def org_data(key: str, index: int) -> OrgData:
    ca_port = 7054
    msp_ids = {
        "gov": "Government",
        "rev": "Revolutionaries",
        "con": "Conservatives",
    }
    peer_port = 7051
    peer_operations_port = 9444
    return OrgData(
        key,
        keystores_initialized=os.path.exists(f"data/{key}/orderer"),
        ca_port=indexed_port(ca_port, index),
        msp_id=msp_ids[key],
        peer_port=indexed_port(peer_port, index),
        peer_operations_port=indexed_port(peer_operations_port, index),
    )


def indexed_port(port: int, index: int) -> int:
    return port + 1000 * index


if __name__ == "__main__":
    typer.run(main)
