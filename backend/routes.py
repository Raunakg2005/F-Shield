from flask import Blueprint, request, jsonify
from sqlalchemy.orm import Session
import pandas as pd
from database import engine, SessionLocal,Transaction, Business
from firebase_middleware import verify_firebase_token

# Define the Blueprint
routes = Blueprint("routes", __name__)

# Define routes using the Blueprint
@routes.route("/", methods=["GET"])
def yes():
    return jsonify({
        "message": "WORKS",
    }), 201


@routes.route("/add_business", methods=["POST"])
def add_business():
  
    data = request.json
    if not data or "business_name" not in data or "business_category" not in data or "business_email" not in data:
        return jsonify({"error": "Missing required fields"}), 400

    session = SessionLocal()
    try:
        # Create a new Business instance
        new_business = Business(
            business_name=data["business_name"],
            business_category=data["business_category"],
            business_email=data["business_email"],
            firebase_uid="",
            total_transact=0,
            risk=0,
            risk_score=0
        )

        session.add(new_business)
        session.commit()
        
        return jsonify({"message": "Business added successfully"}), 201

    except Exception as e:
 
        return jsonify({"error": f"An error occurred: {str(e)}"}), 500

    finally:
        session.close()  # Close the session properly


@routes.route("/get_business", methods=["GET"])
def get_business():

    #//*Auth 
    decoded_token, error_response = verify_firebase_token()
    if error_response:
        return error_response  # If token is invalid, return erro
    firebase_uid = decoded_token["uid"]
     # Create a new session 
    session = SessionLocal()
    business_id = session.query(Business).filter_by(firebase_uid=firebase_uid).first().id
    
    if not business_id:
        return jsonify({"error": "Business not found"}), 404

    


    try:
        # Query the database for the business with the given ID
        business = session.query(Business).filter(Business.id == business_id).first()

        # Check if the business exists
        if not business:
            return jsonify({"error": "Business not found"}), 404

        # Return the business details
        return jsonify({
            "business_id": business.id,
            "business_name": business.business_name,
            "business_category": business.business_category,
            "total_transact": business.total_transact,
            "risk": business.risk,
            "risk_score": business.risk_score
        }), 200

    except Exception as e:
        # Handle any unexpected errors
        return jsonify({"error": f"An error occurred: {str(e)}"}), 500

    finally:
        # Close the session
        session.close()



@routes.route("/login_user", methods=["POST"])
def login_user():
    session = SessionLocal()
    
    try:
        # Decoding the token
        decoded_token, error_response = verify_firebase_token()
        if error_response:
            return error_response  # If token is invalid, return error

        firebase_uid = decoded_token["uid"]

        # Get data from the request
        data = request.json
        business_email = data.get("business_email")  # Ensure the frontend sends this

        if not business_email:
            return jsonify({"error": "Missing business_email"}), 400

        # Find the business by email
        business = session.query(Business).filter_by(business_email=business_email).first()

        if not business:
            return jsonify({"error": "Business not found"}), 404

        # Update the firebase_uid field
        business.firebase_uid = firebase_uid
        session.commit()

        return jsonify({"message": "Firebase UID updated successfully"}), 200

    except Exception as e:
        # Log the exception for debugging
        logging.error(f"Error occurred while updating Firebase UID: {str(e)}")
        session.rollback()
        return jsonify({"error": f"An error occurred: {str(e)}"}), 500

    finally:
        session.close()  # Close the session
@routes.route("/edit_business", methods=["POST"])
def edit_business():
    data = request.json  # Get JSON data from request
    
        #//*Auth 
    decoded_token, error_response = verify_firebase_token()
    if error_response:
            return jsonify({"err":error_response})  

    firebase_uid = decoded_token["uid"]
     # Create a new session 
    session = SessionLocal()
    business_id = session.query(Business).filter_by(firebase_uid=firebase_uid).first().id
    
    if not business_id:
        return jsonify({"error": "Business not found"}), 404
    try:
      
 
        business = session.query(Business).filter(Business.id == business_id).first()

        business.business_name = data["new_name"]
        

        new_business = Business(
            business_name=data["business_name"],
            business_category=data["business_category"],
            business_email=data["business_email"],
            firebase_uid=data["firebase_uid"],
            total_transact=0,
            risk=0,
            risk_score=0
        )

        session.commit()
        return jsonify({
            "message": "Name edited successfully",
     
        }), 201
    
    except Exception as e:
    
        return jsonify({"error": f"An error occurred: {str(e)}"}), 500

    finally:
        # Close the session
        session.close()


@routes.route("/get_all_business", methods=["GET"])
def get_all_business():
    #//*Auth
    decoded_token, error_response = verify_firebase_token()
    if error_response:
        return error_response  # If token is invalid, return erro
      
    firebase_uid = decoded_token["uid"]
     # Create a new session 
    session = SessionLocal()
    business_id = session.query(Business).filter_by(firebase_uid=firebase_uid).first().id
    
    if not business_id:
        return jsonify({"error": "Business not found"}), 404


   

    try:
        # Query the database for the business with the given ID
        businesses = session.query(Business).all()

        # Check if the business exists
        if not businesses:
            return jsonify({"error": "Businesses not found"}), 404

        business_list = [
            {
                "business_id": business.id,
                "business_name": business.business_name,
                "business_category": business.business_category
            }
            for business in businesses
        ]

        return jsonify(business_list), 200

    except Exception as e:
       
        return jsonify({"error": f"An error occurred: {str(e)}"}), 500

    finally:
        # Close the session
        session.close()


@routes.route("/add_transactions", methods=["POST"])
def add_transactions():

    #//*Auth 
    decoded_token, error_response = verify_firebase_token()
    if error_response:
        return error_response  # If token is invalid, return erro

  
    firebase_uid = decoded_token["uid"]
     # Create a new session 
    session = SessionLocal()
    business_id = session.query(Business).filter_by(firebase_uid=firebase_uid).first().id
    
    if not business_id:
        return jsonify({"error": "Business not found"}), 404

    if "file" not in request.files:
        return jsonify({"error": "No file provided"}), 400
    
    file = request.files["file"]
    if file.filename == "":
        return jsonify({"error": "No selected file"}), 400
    
    # Read CSV file
    try:
        df = pd.read_csv(file)
        print(df.head())
    except Exception as e:
        return jsonify({"error": f"Invalid CSV file: {str(e)}"}), 400
      # Check for required columns

      
    
    required_columns = ["business_id", "amount"]
    for column in required_columns:
        if column not in df.columns:
            return jsonify({"error": f"Missing required column: {column}"}), 400



    session = SessionLocal()
    transactions = []
    
    try:
       
        for _, row in df.iterrows():
            transaction = Transaction(
                business_id=row.get("business_id"),
                amount=row.get("amount", None),
                vendor_name=row.get("vendor_name", None),
                vendor_type=row.get("vendor_status", None),
                category=row.get("category", None),
                timestamp=row.get("timestamp", None),  # Convert to DateTime if needed
                location=row.get("location", None),
                previous_balance=row.get("previous_balance", None),
                new_balance=row.get("new_balance", None),
                suspicious_flag=row.get("fraud_reason", None) is not None,  # If fraud reason exists, flag it
                payment_method=row.get("payment_method", None)
            )

            
            session.add(transaction)
            transactions.append(transaction)

            session.commit()

            
            business = session.query(Business).filter(Business.id == business_id).first()
            if business:
                business.total_transact = session.query(Transaction).filter(Transaction.business_id == business_id).count()
                business.risk = session.query(Transaction).filter( Transaction.business_id == business_id,Transaction.suspicious_flag == "High").count()
                total_transact = session.query(Transaction).filter(Transaction.business_id == business_id).count()
                risk_transact = session.query(Transaction).filter( Transaction.business_id == business_id,Transaction.suspicious_flag == "High").count()
                if total_transact!=0:
                    business.risk_score=(risk_transact/total_transact)*100

      


            session.commit()
            
           
            
            return jsonify({"message": "Transactions added successfully", "transactions": [t.id for t in transactions]}), 201
    
    except Exception as e:
        return jsonify({"error": f"Something is wrong: {str(e)}"}), 400
   
    finally:
          
          session.close()


  
    
    

@routes.route("/get_transaction", methods=["GET"])
def get_transaction():
    #//*Auth
    decoded_token, error_response = verify_firebase_token()
    if error_response:
        return error_response  # If token is invalid, return erro


    firebase_uid = decoded_token["uid"]
     # Create a new session 
    session = SessionLocal()
    business= session.query(Business).filter_by(firebase_uid=firebase_uid).first()
    
   
    business_id=business.id
     # Check if the required field (business_id) is present
    if not business_id:
        return jsonify({"error": "Missing required field: business_id"}), 400

    try:
        transactions = session.query(Transaction).filter(Transaction.business_id == business_id).all()
        return jsonify([{  
            "id": t.id,
            "business_id": t.business_id,
            "amount": t.amount,
            "vendor_name": t.vendor_name,
            "vendor_type": t.vendor_type,
            "category": t.category,
            "timestamp": t.timestamp,
            "location": t.location,
            "previous_balance": t.previous_balance,
            "new_balance": t.new_balance,
            "suspicious_flag": t.suspicious_flag,
            "payment_method": t.payment_method
            } for t in transactions])
    
    except Exception as e:
        return jsonify({"error": f"Error in fetching: {str(e)}"}), 400    
    
    finally:
        session.close()