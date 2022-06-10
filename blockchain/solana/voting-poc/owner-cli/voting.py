import asyncio
import json
from os import getenv
from typing import Any, AsyncGenerator, Awaitable, Callable, Coroutine, TypeVar
import typer
from anchorpy import Provider, Wallet
from solana.rpc.async_api import AsyncClient
from solana.publickey import PublicKey
from solana.keypair import Keypair
from solana.transaction import Transaction
from solana.system_program import SYS_PROGRAM_ID
from voting_client.instructions.register_organization import register_organization
from voting_client.program_id import PROGRAM_ID
from voting_client.accounts.organization_data import OrganizationData
from pathlib import Path

app = typer.Typer()

organization_argument = typer.Argument(..., help="Public key of an organization")
rpc_url_option = typer.Option("https://api.devnet.solana.com", help="Solana RPC Url")
owner_key_option = typer.Option(
    Path.home() / ".config/solana/id.json", help="Path to voting owner secret"
)


@app.command(help="Register organization for conducting elections")
def register(
    organization: str = organization_argument,
    rpc_url: str = rpc_url_option,
    owner_key: Path = owner_key_option,
):
    _run(rpc_url, owner_key, lambda client: client.register(organization))
    typer.echo(f"{organization} registered as new organization.")


@app.command(help="Check if organization is registered")
def is_registered(
    organization: str = organization_argument,
    rpc_url: str = rpc_url_option,
    owner_key: Path = owner_key_option,
):
    registered = _run(
        rpc_url,
        owner_key,
        lambda client: client.is_registered(organization),
    )
    if registered:
        typer.echo("Organization is registered.")
    else:
        typer.echo("Organization is not registered.")


T = TypeVar("T")


def _run(
    rpc_url: str, owner_key: Path, f: Callable[["OwnerClient"], Awaitable[T]]
) -> T:
    async def inner() -> T:
        client = AsyncClient(rpc_url)
        result = await f(_owner_client(client, owner_key))
        await client.close()
        return result

    return asyncio.run(inner())


def _owner_client(client: AsyncClient, owner_key: Path) -> "OwnerClient":
    with open(owner_key) as owner_key_file:
        owner = Keypair.from_secret_key(bytes(json.load(owner_key_file)))
    provider = Provider(client, Wallet(owner))
    return OwnerClient(client, provider, owner)


class OwnerClient:
    def __init__(self, client: AsyncClient, provider: Provider, owner: Keypair) -> None:
        self.client = client
        self.provider = provider
        self.owner = owner

    async def register(self, organization: str) -> None:
        await self.provider.send(
            Transaction().add(
                register_organization(
                    {"organization": PublicKey(organization)},
                    {
                        "owner": self.owner.public_key,
                        "main_data": PublicKey.create_program_address(
                            [b"main_data"], PROGRAM_ID
                        ),
                        "organization_data": PublicKey.create_program_address(
                            [f"organization_data_{organization}".encode()], PROGRAM_ID
                        ),
                        "system_program": SYS_PROGRAM_ID,
                    },
                )
            ),
            [self.owner],
        )

    async def is_registered(self, organization: str) -> bool:
        data = await OrganizationData.fetch(
            self.client, self.organization_data(organization)
        )
        return bool(data)

    def organization_data(self, organization: str) -> PublicKey:
        return PublicKey.create_program_address(
            [f"organization_data_{organization}".encode()], PROGRAM_ID
        )


if __name__ == "__main__":
    app()
