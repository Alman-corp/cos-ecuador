import os


def get_config() -> dict:
    return {
        "openai_api_key": os.getenv("OPENAI_API_KEY", ""),
        "anthropic_api_key": os.getenv("ANTHROPIC_API_KEY", ""),
        "supabase_url": os.getenv("SUPABASE_URL", ""),
        "supabase_key": os.getenv("SUPABASE_SERVICE_ROLE_KEY", ""),
        "database_url": os.getenv("DATABASE_URL", ""),
    }


def get_test_config() -> dict:
    return {**get_config(), "openai_api_key": "test-key", "anthropic_api_key": "test-key"}
