import pandas as pd
from sklearn.ensemble import IsolationForest

# Train model on dummy data
def train_model():
    data = pd.read_csv("historical_transactions.csv")  # Load past transactions
    X = data[["amount"]]  
    model = IsolationForest(contamination=0.02)
    model.fit(X)
    return model

model = train_model()  # Load trained model

def predict_fraud(transactions):
    """Predicts fraud using Isolation Forest"""
    df = pd.DataFrame(transactions)
    predictions = model.predict(df[["amount"]])
    return [{"transaction": t, "fraud": 1 if p == -1 else 0} for t, p in zip(transactions, predictions)]
