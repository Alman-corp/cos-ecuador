def __getattr__(name):
    if name == "CausalInferenceEngine":
        from app.causal.inference import CausalInferenceEngine
        return CausalInferenceEngine
    if name == "CounterfactualEngine":
        from app.causal.counterfactual import CounterfactualEngine
        return CounterfactualEngine
    if name == "CausalDiscoveryEngine":
        from app.causal.discovery import CausalDiscoveryEngine
        return CausalDiscoveryEngine
    raise AttributeError(f"module {__name__!r} has no attribute {name!r}")

__all__ = ["CausalInferenceEngine", "CounterfactualEngine", "CausalDiscoveryEngine"]
