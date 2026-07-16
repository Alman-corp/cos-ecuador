from decimal import Decimal


MODEL_COST_PER_1K_TOKENS = {
    "gpt-4o": Decimal("0.005"),
    "gpt-4o-mini": Decimal("0.0015"),
    "claude-3.5-sonnet": Decimal("0.003"),
    "claude-3-haiku": Decimal("0.0005"),
}


class CostTracker:
    def calculate_cost(self, model: str, total_tokens: int) -> Decimal:
        rate = MODEL_COST_PER_1K_TOKENS.get(model, Decimal("0.002"))
        return rate * Decimal(str(total_tokens)) / Decimal("1000")
