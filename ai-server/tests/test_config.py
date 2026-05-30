from app.config import Settings


def test_postgres_url_normalized():
    s = Settings(database_url="postgres://user:pass@host:5432/db")
    assert s.database_url.startswith("postgresql+psycopg://")


def test_postgresql_url_normalized():
    s = Settings(database_url="postgresql://user:pass@host:5432/db")
    assert s.database_url.startswith("postgresql+psycopg://")


def test_already_correct_url_unchanged():
    url = "postgresql+psycopg://user:pass@host:5432/db"
    s = Settings(database_url=url)
    assert s.database_url == url


def test_url_credentials_preserved():
    s = Settings(database_url="postgres://myuser:mypass@localhost:5432/mydb")
    assert "myuser:mypass" in s.database_url
    assert "localhost:5432" in s.database_url
    assert "mydb" in s.database_url
