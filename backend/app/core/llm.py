import json
import logging
import re
from typing import Any, Dict, List, Optional, Type, TypeVar
from pydantic import BaseModel
from app.core.config import settings

logger = logging.getLogger(__name__)

T = TypeVar("T", bound=BaseModel)


class MockLLMResponse:
    def __init__(self, content: str):
        self.content = content


class MockLLM:
    """Deterministic Mock LLM for local development, offline verification, and testing."""

    def invoke(self, prompt: str) -> MockLLMResponse:
        prompt_lower = prompt.lower()

        # Check if quiz generation requested
        if "quiz" in prompt_lower:
            return MockLLMResponse(
                content=json.dumps({
                    "topic_id": "mock_topic",
                    "questions": [
                        {
                            "question": "What is the primary objective of empirical risk minimization in supervised learning?",
                            "options": [
                                "To maximize training error rate",
                                "To minimize average loss over the observed training dataset",
                                "To eliminate the need for gradient calculation",
                                "To make the model non-parametric"
                            ],
                            "correct_answer_index": 1,
                            "explanation": "Empirical risk minimization seeks model parameters that minimize the average loss evaluated over the given training examples.",
                            "source_chunk_ids": ["chk_source_1"]
                        },
                        {
                            "question": "How does L2 regularization (Ridge) penalize model complexity?",
                            "options": [
                                "By setting random weights directly to zero",
                                "By adding the squared Euclidean norm of the weight vector to the loss function",
                                "By doubling the learning rate during backpropagation",
                                "By removing entire layers from the network"
                            ],
                            "correct_answer_index": 1,
                            "explanation": "L2 regularization adds a penalty proportional to the sum of squared weights, shrinking parameters toward zero to control variance.",
                            "source_chunk_ids": ["chk_source_1"]
                        }
                    ]
                })
            )

        # Check if flashcard generation requested
        if "flashcard" in prompt_lower:
            return MockLLMResponse(
                content=json.dumps({
                    "topic_id": "mock_topic",
                    "flashcards": [
                        {
                            "front": "What is the Bias-Variance Tradeoff?",
                            "back": "The tension between error introduced by simplistic model assumptions (bias) and sensitivity to fluctuations in training data (variance).",
                            "key_concept": "Model Generalization",
                            "source_chunk_ids": ["chk_source_1"]
                        },
                        {
                            "front": "What is Stochastic Gradient Descent (SGD)?",
                            "back": "An iterative optimization algorithm that updates parameters using gradients computed on mini-batches or single training examples rather than the full dataset.",
                            "key_concept": "Optimization",
                            "source_chunk_ids": ["chk_source_1"]
                        }
                    ]
                })
            )

        # Check if remediation requested
        if "remediat" in prompt_lower or "struggle" in prompt_lower:
            return MockLLMResponse(
                content=json.dumps({
                    "topic_id": "mock_topic",
                    "concept_breakdown": "Let's break this down into intuitive pieces: Think of gradient descent like walking downhill in the dark using only the slope under your feet.",
                    "key_analogies": [
                        "Imagine a ball rolling down a bowl until it settles at the bottom (local minimum)."
                    ],
                    "practice_questions": [
                        {
                            "question": "If the learning rate is too large, what happens to gradient descent?",
                            "hint": "Think about overshooting the bottom of the valley.",
                            "answer": "It can oscillate wildly or diverge rather than converging."
                        }
                    ],
                    "source_chunk_ids": ["chk_source_1"]
                })
            )

        # Default summary response
        return MockLLMResponse(
            content=json.dumps({
                "summary": "### Core Concepts Summary\n\n- Supervised learning uses labeled pairs.\n- Optimization drives parameter updates via loss gradients.\n- Regularization controls model capacity.",
                "source_chunk_ids": ["chk_source_1"]
            })
        )


def get_llm():
    """Returns configured LangChain LLM instance (GPT-4o or Ollama) with fallback to MockLLM."""
    if settings.LLM_PROVIDER == "openai" and settings.OPENAI_API_KEY:
        try:
            from langchain_openai import ChatOpenAI
            return ChatOpenAI(
                model=settings.OPENAI_MODEL,
                api_key=settings.OPENAI_API_KEY,
                temperature=0.2,
            )
        except Exception as e:
            logger.warning(f"Failed to initialize ChatOpenAI: {e}. Falling back to MockLLM.")
    elif settings.LLM_PROVIDER == "ollama":
        try:
            from langchain_ollama import ChatOllama
            return ChatOllama(
                base_url=settings.OLLAMA_BASE_URL,
                model=settings.OLLAMA_MODEL,
                temperature=0.2,
            )
        except Exception as e:
            logger.warning(f"Failed to initialize ChatOllama: {e}. Falling back to MockLLM.")
            return MockLLM()
    else:
        logger.info("Using MockLLM (no external API key provided or test environment).")
        return MockLLM()


def parse_structured_json(response_content: str, schema_cls: Type[T]) -> T:
    """Parses JSON response with automatic code block stripping and validation against Pydantic schema."""
    cleaned = response_content.strip()

    # Strip markdown code fencing if present
    if cleaned.startswith("```"):
        cleaned = re.sub(r"^```[a-zA-Z]*\n", "", cleaned)
        cleaned = re.sub(r"\n```$", "", cleaned)
        cleaned = cleaned.strip()

    try:
        data = json.loads(cleaned)
        return schema_cls.model_validate(data)
    except Exception as e:
        logger.error(f"JSON parsing error: {e} on content: {cleaned[:200]}")
        raise ValueError(f"Failed to validate response against {schema_cls.__name__}: {str(e)}")
