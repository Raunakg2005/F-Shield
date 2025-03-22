from flask import request, jsonify
import firebase_admin
from firebase_admin import auth


def verify_firebase_token():
    """Middleware to verify Firebase Auth token"""
    id_token = request.headers.get("Authorization")

    if not id_token:
        return None, jsonify({"error": "Missing Firebase token"})

    try:
        # Extract token from "Bearer <token>"
        token = id_token.split(" ")[1]
        decoded_token = auth.verify_id_token(token)
        return decoded_token, None  # Return token + no error

    except Exception as e:
        return None, jsonify({"error": f"Invalid token: {str(e)}"})
