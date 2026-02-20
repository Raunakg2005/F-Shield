"""
FraudSense — Flask Application Entry Point (v2)
Registers all blueprints, initialises Firebase, sets up CORS + rate limiting.
"""

import os
import logging
from flask import Flask, jsonify
from flask_cors import CORS
from flask_limiter import Limiter
from flask_limiter.util import get_remote_address
from dotenv import load_dotenv
import firebase_admin
from firebase_admin import credentials

from database import init_db

load_dotenv()

# ── Logging ────────────────────────────────────────────────────────────────────
logging.basicConfig(
    level=logging.INFO,
    format="%(asctime)s [%(name)s] %(levelname)s: %(message)s",
)
logger = logging.getLogger("fraudsense")


def create_app() -> Flask:
    app = Flask(__name__)
    app.url_map.strict_slashes = False

    # ── CORS ───────────────────────────────────────────────────────────────────
    CORS(app, resources={r"/*": {"origins": "*"}}, supports_credentials=True, allow_headers=["Content-Type", "Authorization"], methods=["GET", "POST", "PATCH", "PUT", "DELETE", "OPTIONS"])

    # ── Rate limiting ──────────────────────────────────────────────────────────
    Limiter(
        get_remote_address,
        app=app,
        default_limits=["200 per day", "60 per minute"],
        storage_uri=os.getenv("REDIS_URL", "memory://"),
    )

    # ── Firebase Admin ─────────────────────────────────────────────────────────
    cred_path = os.getenv("FIREBASE_CREDENTIALS", "firebase-adminsdk.json")
    if not firebase_admin._apps and os.path.exists(cred_path):
        cred = credentials.Certificate(cred_path)
        firebase_admin.initialize_app(cred)
        logger.info("Firebase Admin initialized.")
    else:
        logger.warning("Firebase credentials not found — auth middleware will error.")

    # ── Database ───────────────────────────────────────────────────────────────
    try:
        init_db()
    except Exception as e:
        logger.error(f"DB init error (continuing anyway): {e}")

    # ── Blueprints ─────────────────────────────────────────────────────────────
    from routes.business     import business_bp
    from routes.transactions import transactions_bp
    from routes.fraud        import fraud_bp

    app.register_blueprint(business_bp)
    app.register_blueprint(transactions_bp)
    app.register_blueprint(fraud_bp)

    # ── Health check ───────────────────────────────────────────────────────────
    @app.route("/health", methods=["GET"])
    def health():
        return jsonify({"status": "ok", "service": "FraudSense API v2"}), 200

    # ── Global error handlers ──────────────────────────────────────────────────
    @app.errorhandler(404)
    def not_found(e):
        return jsonify({"error": "Not found"}), 404

    @app.errorhandler(405)
    def method_not_allowed(e):
        return jsonify({"error": "Method not allowed"}), 405

    @app.errorhandler(429)
    def rate_limited(e):
        return jsonify({"error": "Rate limit exceeded. Try again later."}), 429

    @app.errorhandler(500)
    def server_error(e):
        logger.exception("Unhandled 500")
        return jsonify({"error": "Internal server error"}), 500

    return app


app = create_app()

if __name__ == "__main__":
    debug = os.getenv("FLASK_ENV", "production") == "development"
    app.run(debug=debug, port=int(os.getenv("PORT", 5000)))