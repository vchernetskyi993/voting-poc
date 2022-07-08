from datetime import datetime, timedelta
import json


def main():
    now = datetime.now()
    election = {
        "start": unix(now + timedelta(minutes=1)),
        "end": unix(now + timedelta(3)),
        "title": "My Election",
        "description": "Some short description",
        "candidates": ["Alice", "Bob"],
    }
    print(json.dumps(election))


def unix(t: datetime) -> int:
    return int(t.timestamp())


if __name__ == '__main__':
    main()
