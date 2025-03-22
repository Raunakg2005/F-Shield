from flask import Flask
from flask_cors import CORS
from routes import routes  # Import the Blueprint from routes.py
import firebase_admin
from firebase_admin import auth, credentials
app = Flask(__name__)
CORS(app)  # Enable CORS for all routes

# Register the Blueprint
app.register_blueprint(routes)



# Load Firebase credentials
cred = credentials.Certificate("firebase-adminsdk.json")  # Replace with actual path
firebase_admin.initialize_app(cred)


if __name__ == "__main__":
    app.run(debug=True)