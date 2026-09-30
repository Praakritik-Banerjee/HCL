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
            match = re.search(r"(\d+)-question", prompt_lower) or re.search(r"generate (\d+)", prompt_lower)
            requested_count = int(match.group(1)) if match else 3

            pool = [
                {
                    "question": "What is the primary objective of empirical risk minimization in supervised learning?",
                    "options": [
                        "To maximize training error rate",
                        "To minimize average loss over the observed training dataset",
                        "To eliminate the need for gradient calculation",
                        "To make the model non-parametric"
                    ],
                    "correct_answer_index": 1,
                    "explanation": "Empirical risk minimization seeks model parameters that minimize the average loss evaluated over training examples.",
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
                    "explanation": "L2 regularization adds a penalty proportional to the sum of squared weights to control variance.",
                    "source_chunk_ids": ["chk_source_1"]
                },
                {
                    "question": "Which gradient descent variant updates parameters using a small mini-batch of training samples?",
                    "options": [
                        "Full Batch Gradient Descent",
                        "Mini-Batch Gradient Descent",
                        "Exact Newton-Raphson Method",
                        "Coordinate Descent"
                    ],
                    "correct_answer_index": 1,
                    "explanation": "Mini-batch gradient descent computes loss gradients over small random subsets of training data.",
                    "source_chunk_ids": ["chk_source_1"]
                },
                {
                    "question": "What occurs when a machine learning model severely overfits its training dataset?",
                    "options": [
                        "Training error remains high while test error approaches zero",
                        "Training error becomes very low while generalization error on test data becomes high",
                        "Learning rate automatically decays to zero",
                        "All network parameters converge to identical constants"
                    ],
                    "correct_answer_index": 1,
                    "explanation": "Overfitting memorizes noise in the training set, causing high generalization error on unseen data.",
                    "source_chunk_ids": ["chk_source_1"]
                },
                {
                    "question": "What is the primary purpose of activation functions in deep neural networks?",
                    "options": [
                        "To increase linear dependencies between input layers",
                        "To introduce non-linear transformations allowing non-linear function approximation",
                        "To reduce peak memory usage during backward propagation",
                        "To convert categorical target variables into numerical representations"
                    ],
                    "correct_answer_index": 1,
                    "explanation": "Non-linear activations (e.g. ReLU, Sigmoid) enable networks to learn complex non-linear decision boundaries.",
                    "source_chunk_ids": ["chk_source_1"]
                },
                {
                    "question": "How does Cross-Entropy loss evaluate classification predictions against ground truth labels?",
                    "options": [
                        "By measuring linear distance between output bounds",
                        "By calculating logarithmic loss between predicted probability distributions and one-hot true labels",
                        "By taking maximum variance across feature channels",
                        "By rounding output predictions to the nearest integer"
                    ],
                    "correct_answer_index": 1,
                    "explanation": "Cross-entropy penalizes incorrect confident classification predictions using logarithmic loss scaling.",
                    "source_chunk_ids": ["chk_source_1"]
                },
                {
                    "question": "What mechanism does Dropout employ during neural network training steps?",
                    "options": [
                        "Doubling weight values randomly on forward passes",
                        "Randomly deactivating a fraction of neuron outputs during training iterations",
                        "Replacing negative gradient values with zero",
                        "Multiplying learning rates by a static decay schedule"
                    ],
                    "correct_answer_index": 1,
                    "explanation": "Dropout randomly zero-masks neuron activations during training to prevent co-adaptation of features.",
                    "source_chunk_ids": ["chk_source_1"]
                },
                {
                    "question": "Why is feature scaling (Standardization) recommended prior to running gradient descent optimization?",
                    "options": [
                        "It eliminates the need for bias parameters",
                        "It conditions the loss landscape geometry, preventing oscillations and speeding up convergence",
                        "It guarantees global optimum convergence in non-convex spaces",
                        "It converts non-linearly separable data into linearly separable sets"
                    ],
                    "correct_answer_index": 1,
                    "explanation": "Feature scaling balances gradient magnitudes across feature dimensions for efficient optimization.",
                    "source_chunk_ids": ["chk_source_1"]
                },
                {
                    "question": "What advantage does Adam optimizer offer over standard SGD with constant learning rate?",
                    "options": [
                        "It avoids matrix operations",
                        "It maintains adaptive per-parameter learning rates combining momentum and RMSProp gradient moments",
                        "It works exclusively on decision tree models",
                        "It guarantees zero loss across all training samples"
                    ],
                    "correct_answer_index": 1,
                    "explanation": "Adam adapts individual learning rates per weight parameter based on first and second moment estimates.",
                    "source_chunk_ids": ["chk_source_1"]
                },
                {
                    "question": "In K-Fold Cross-Validation, how is the final model evaluation score computed?",
                    "options": [
                        "By taking only the maximum single fold score",
                        "By averaging validation performance metrics across all K fold iterations",
                        "By discarding validation folds with low accuracy",
                        "By adding training error directly to validation error"
                    ],
                    "correct_answer_index": 1,
                    "explanation": "K-Fold cross-validation averages validation results over all folds for an unbiased generalization metric.",
                    "source_chunk_ids": ["chk_source_1"]
                }
            ]

            # Return exact requested count (cycle pool if requested_count > len(pool))
            questions = []
            for i in range(requested_count):
                q_item = dict(pool[i % len(pool)])
                if i >= len(pool):
                    q_item["question"] = f"[{i+1}] " + q_item["question"]
                questions.append(q_item)

            return MockLLMResponse(
                content=json.dumps({
                    "topic_id": "mock_topic",
                    "questions": questions
                })
            )

        # Check if flashcard generation requested
        if "flashcard" in prompt_lower:
            match = re.search(r"generate (\d+)", prompt_lower) or re.search(r"(\d+) flashcard", prompt_lower)
            requested_count = int(match.group(1)) if match else 3

            flashcard_pool = [
                {
                    "front": "What is the Bias-Variance Tradeoff?",
                    "back": "The tension between error introduced by simplistic model assumptions (bias) and sensitivity to fluctuations in training data (variance).",
                    "key_concept": "Model Generalization",
                    "source_chunk_ids": ["chk_source_1"]
                },
                {
                    "front": "What is Stochastic Gradient Descent (SGD)?",
                    "back": "An iterative optimization algorithm that updates parameters using gradients computed on mini-batches or single training examples.",
                    "key_concept": "Optimization",
                    "source_chunk_ids": ["chk_source_1"]
                },
                {
                    "front": "What is L1 Regularization (Lasso)?",
                    "back": "A penalty proportional to absolute weight values that encourages sparsity by driving unimportant feature weights to zero.",
                    "key_concept": "Regularization",
                    "source_chunk_ids": ["chk_source_1"]
                },
                {
                    "front": "What is Overfitting?",
                    "back": "When a model learns noisy details and random fluctuations in training data to the extent that it negatively impacts performance on new data.",
                    "key_concept": "Generalization",
                    "source_chunk_ids": ["chk_source_1"]
                },
                {
                    "front": "What is Precision vs Recall?",
                    "back": "Precision is true positives out of predicted positives; Recall is true positives out of actual positives in ground truth.",
                    "key_concept": "Evaluation Metrics",
                    "source_chunk_ids": ["chk_source_1"]
                },
                {
                    "front": "What is the Softmax function?",
                    "back": "A function that normalizes a vector of raw logits into a probability distribution over multiclass outcomes.",
                    "key_concept": "Neural Networks",
                    "source_chunk_ids": ["chk_source_1"]
                },
                {
                    "front": "What is Hyperparameter Tuning?",
                    "back": "The process of optimizing configuration parameters (like learning rate or batch size) that are set before model training starts.",
                    "key_concept": "Model Calibration",
                    "source_chunk_ids": ["chk_source_1"]
                },
                {
                    "front": "What is Data Normalization?",
                    "back": "Scaling numerical input features to a standard range (e.g., [0, 1] or zero mean with unit variance) to ensure balanced learning gradients.",
                    "key_concept": "Preprocessing",
                    "source_chunk_ids": ["chk_source_1"]
                }
            ]

            cards = []
            for i in range(requested_count):
                card = dict(flashcard_pool[i % len(flashcard_pool)])
                if i >= len(flashcard_pool):
                    card["front"] = f"[{i+1}] " + card["front"]
                cards.append(card)

            return MockLLMResponse(
                content=json.dumps({
                    "topic_id": "mock_topic",
                    "flashcards": cards
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

        # Check if problem guide requested
        if "problem" in prompt_lower or "guide" in prompt_lower:
            return MockLLMResponse(
                content=json.dumps({
                    "topic_id": "mock_topic",
                    "topic_title": "Analytical Problem Solving",
                    "problem_statement": "How to formulate, optimize, and evaluate a machine learning model for optimal generalization?",
                    "steps": [
                        {
                            "step_number": 1,
                            "title": "Problem Formulation & Loss Function",
                            "explanation": "Identify input features, target outputs, and mathematical loss formulation for empirical risk minimization.",
                            "reasoning": "Choosing the proper objective ensures optimization directly aligns with task goals."
                        },
                        {
                            "step_number": 2,
                            "title": "Iterative Optimization & Learning Rate",
                            "explanation": "Compute loss gradients with respect to parameter weights and apply gradient descent updates.",
                            "reasoning": "Controlled parameter updates step downhill towards optimal parameter configurations."
                        },
                        {
                            "step_number": 3,
                            "title": "Generalization & Regularization Sanity Check",
                            "explanation": "Apply L2 regularization penalties and evaluate model capacity on cross-validation folds.",
                            "reasoning": "Prevents overfitting and guarantees reliable predictions on unseen data."
                        }
                    ],
                    "final_solution": "A fully calibrated, regularized model achieving minimal loss.",
                    "source_chunk_ids": ["chk_source_1"]
                })
            )


        # Dynamic Summary / Bullet-Point Revision Notes response
        if "electrostatic" in prompt_lower:
            summary_content = (
                "### Core Concepts & Fundamental Principles\n"
                "- **Electric Charge**: Fundamental property of matter that experiences a force when placed in an electromagnetic field. Charges are quantized ($q = ne$) and conserved.\n"
                "- **Coulomb's Law**: Quantifies the electrostatic force between two point charges: $F = k \\frac{|q_1 q_2|}{r^2}$, acting along the line joining the centers.\n"
                "- **Electric Field**: Vector field created around charged particles representing force per unit positive charge: $\\vec{E} = \\frac{\\vec{F}}{q_0}$.\n"
                "- **Gauss's Law**: Total electric flux through any closed surface is proportional to the enclosed charge: $\\Phi_E = \\oint \\vec{E} \\cdot d\\vec{A} = \\frac{Q_{\\text{enc}}}{\\varepsilon_0}$.\n\n"
                "### Key Definitions, Formulas & Equations\n"
                "- **Electric Potential ($V$)**: Work done per unit charge in bringing a test charge from infinity to a point: $V = \\frac{k q}{r}$.\n"
                "- **Electrostatic Potential Energy ($U$)**: Potential energy stored in a charge configuration: $U = \\frac{k q_1 q_2}{r}$.\n"
                "- **Capacitance ($C$)**: Ratio of electric charge to potential difference across conductors: $C = \\frac{Q}{V} = \\frac{\\varepsilon_0 A}{d}$ for parallel plates.\n"
                "- **Electric Dipole Moment ($\\vec{p}$)**: Vector pointing from negative to positive charge: $\\vec{p} = q \\vec{d}$, with torque $\\vec{\\tau} = \\vec{p} \\times \\vec{E}$.\n\n"
                "### Exam Revision Highlights & Analytical Details\n"
                "- Electric field lines originate on positive charges and terminate on negative charges; they never intersect.\n"
                "- Conductors in electrostatic equilibrium have zero internal electric field ($\\vec{E} = 0$) and constant potential throughout.\n"
                "- Dielectric materials inserted into capacitors increase capacitance by factor $K$ (dielectric constant): $C = K C_0$."
            )
        else:
            summary_content = (
                "### Core Concepts & Fundamental Principles\n"
                "- **Supervised Learning**: Model training using structured input feature vectors paired with ground-truth target labels.\n"
                "- **Empirical Risk Minimization**: Finding model parameter configurations that minimize expected loss across training datasets.\n"
                "- **Gradient Descent Optimization**: Iterative optimization process updating parameters opposite the direction of gradient vectors.\n\n"
                "### Key Definitions, Formulas & Equations\n"
                "- **Loss Function**: Mathematical objective function quantifying prediction discrepancies against target ground-truth values.\n"
                "- **Regularization (L1 Lasso / L2 Ridge)**: Penalty terms added to objective functions to constrain parameter variance and prevent overfitting.\n"
                "- **Cross-Entropy Loss**: Logarithmic loss function evaluating probability distributions for multiclass classification tasks.\n\n"
                "### Exam Revision Highlights & Analytical Details\n"
                "- Always standardize and scale input feature vectors prior to applying gradient descent optimization.\n"
                "- Implement K-fold cross validation to obtain unbiased generalization performance estimates on unseen datasets.\n"
                "- Monitor training vs validation loss curves continuously to identify early indicators of model overfitting."
            )

        return MockLLMResponse(
            content=json.dumps({
                "summary": summary_content,
                "source_chunk_ids": ["chk_source_1"]
            })
        )


def get_llm():
    """Returns configured LangChain LLM instance (GPT-4o or Ollama) with fallback to MockLLM."""
    if settings.LLM_PROVIDER == "openai" and settings.OPENAI_API_KEY and not settings.OPENAI_API_KEY.startswith("your-"):
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
