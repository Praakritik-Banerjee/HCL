"""Utility script to generate sample syllabus files (PDF and text) for automated testing."""
import os
from pypdf import PdfWriter
from io import BytesIO


SAMPLE_SYLLABUS_TEXT = """COURSE SYLLABUS: CS 480 - ARTIFICIAL INTELLIGENCE & MACHINE LEARNING
Semester: Fall 2026
Instructor: Dr. Jane Doe (Email: jane.doe@university.edu, Phone: +1-555-432-8765)
Student Advisory Contact: student.help@university.edu
Enrollment Office Student ID Code: STU-9928172

Course Overview:
This course provides a comprehensive mathematical and practical foundation in modern artificial intelligence, machine learning algorithms, deep learning representations, and autonomous decision systems.

Unit 1: Foundations of Supervised Learning
1.1 Linear Regression and Gradient Descent
Formulation of empirical risk minimization, mean squared error loss, analytical normal equations versus iterative stochastic gradient descent optimization.
1.2 Logistic Regression and Classification Metrics
Binary cross-entropy loss, sigmoid activation, decision boundaries, ROC curves, AUC, precision, recall, and F1-score evaluation.
1.3 Regularization and the Bias-Variance Tradeoff
L1 Lasso and L2 Ridge regularization penalties, model capacity, overfitting, underfitting, and cross-validation methodologies.

Unit 2: Deep Learning Architectures
2.1 Deep Neural Networks and Backpropagation
Multi-layer perceptrons, forward propagation, computational graphs, reverse-mode automatic differentiation, gradient vanish and explosion challenges.
2.2 Convolutional Neural Networks for Vision
Spatial invariance, convolution kernels, stride, padding, pooling layers, ResNet skip connections, feature map hierarchies.
2.3 Sequence Models and Transformer Attention
Recurrent neural networks, LSTM gating mechanisms, self-attention equations, multi-head scaled dot-product attention, positional encodings.

Unit 3: Unsupervised Learning & Dimensionality Reduction
3.1 Clustering Algorithms
K-means clustering algorithm, centroid initialization heuristics, inertia, and hierarchical agglomerative clustering.
3.2 Dimensionality Reduction
Principal Component Analysis (PCA), singular value decomposition (SVD), variance explained ratio, and t-SNE embeddings.

Unit 4: Reinforcement Learning & Autonomous Agents
4.1 Markov Decision Processes (MDPs)
States, actions, transition probabilities, discount factors, reward functions, and Bellman optimality equations.
4.2 Value-Based and Policy-Based Algorithms
Q-learning, deep Q-networks (DQN), exploration versus exploitation strategies (epsilon-greedy), and policy gradient theorem.
"""


def create_sample_pdf_bytes() -> bytes:
    """Generate in-memory PDF bytes with multi-unit syllabus text using reportlab."""
    from reportlab.lib.pagesizes import letter
    from reportlab.platypus import SimpleDocTemplate, Paragraph, Spacer
    from reportlab.lib.styles import getSampleStyleSheet, ParagraphStyle
    
    buffer = BytesIO()
    doc = SimpleDocTemplate(buffer, pagesize=letter, rightMargin=40, leftMargin=40, topMargin=40, bottomMargin=40)
    styles = getSampleStyleSheet()
    story = []
    
    for line in SAMPLE_SYLLABUS_TEXT.split("\n"):
        line = line.strip()
        if not line:
            story.append(Spacer(1, 6))
            continue
        if line.startswith("COURSE SYLLABUS:"):
            story.append(Paragraph(f"<b>{line}</b>", styles["Title"]))
        elif line.startswith("Unit "):
            story.append(Paragraph(f"<b>{line}</b>", styles["Heading1"]))
        elif any(line.startswith(f"{i}.") for i in range(1, 10)):
            story.append(Paragraph(f"<b>{line}</b>", styles["Heading2"]))
        else:
            story.append(Paragraph(line, styles["BodyText"]))
            
    doc.build(story)
    return buffer.getvalue()


if __name__ == "__main__":
    os.makedirs("storage/test_samples", exist_ok=True)
    pdf_bytes = create_sample_pdf_bytes()
    with open("storage/test_samples/sample_syllabus.pdf", "wb") as f:
        f.write(pdf_bytes)
    with open("storage/test_samples/sample_syllabus.txt", "w") as f:
        f.write(SAMPLE_SYLLABUS_TEXT)
    print("Created sample syllabus PDF and text in storage/test_samples/")
