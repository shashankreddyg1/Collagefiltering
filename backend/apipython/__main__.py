from flask import Flask, jsonify, request
from flask_cors import CORS
import pymongo

app = Flask(__name__)
CORS(app)

client = pymongo.MongoClient("mongodb+srv://shashankreddy:shashankreddy@cluster0.4kjc3.mongodb.net/")
mydb = client["collade_details"]
mycol = mydb["collage_details"]

# Helper function to clean up user input (trim spaces)
def clean_input(input_string):
    return input_string.strip() if input_string else ""

@app.route("/college", methods=["GET"])
def get_college_by_name():
    college_name = clean_input(request.args.get("name"))

    if not college_name:
        return jsonify({"error": "No college name provided"}), 400

    college_data = list(mycol.find({"name": {"$regex": college_name, "$options": "i"}}, {"_id": 0}))

    if college_data:
        return jsonify(college_data), 200
    else:
        return jsonify({"error": "No colleges found with that name"}), 404

@app.route("/city", methods=["GET"])
def get_college_by_city():
    college_city = clean_input(request.args.get("city"))

    if not college_city:
        return jsonify({"error": "No city provided"}), 400

    college_data = list(mycol.find({"city": {"$regex": college_city, "$options": "i"}}, {"_id": 0}))

    if college_data:
        return jsonify(college_data), 200
    else:
        return jsonify({"error": "No colleges found in that city"}), 404

@app.route("/year", methods=["GET"])
def get_college_by_year():
    college_year = clean_input(request.args.get("year"))

    if not college_year:
        return jsonify({"error": "No year provided"}), 400

    try:
        college_year = int(college_year)  # Convert year to integer
    except ValueError:
        return jsonify({"error": "Invalid year format. Year must be a number."}), 400

    college_data = list(mycol.find({"year_founded": college_year}, {"_id": 0}))

    if college_data:
        return jsonify(college_data), 200
    else:
        return jsonify({"error": "No colleges found for that year"}), 404

@app.route("/state", methods=["GET"])
def get_college_by_state():
    college_state = clean_input(request.args.get("state"))

    if not college_state:
        return jsonify({"error": "No state provided"}), 400

    college_data = list(mycol.find({"state": {"$regex": college_state, "$options": "i"}}, {"_id": 0}))

    if college_data:
        return jsonify(college_data), 200
    else:
        return jsonify({"error": "No colleges found in that state"}), 404

@app.route("/facilities", methods=["GET"])
def get_college_by_facilities():
    facility = clean_input(request.args.get("facility"))

    if not facility:
        return jsonify({"error": "No facility provided"}), 400

    college_data = list(mycol.find({"facilities": {"$regex": facility, "$options": "i"}}, {"_id": 0}))

    if college_data:
        return jsonify(college_data), 200
    else:
        return jsonify({"error": f"No colleges found with facility: {facility}"}), 404

if __name__ == "__main__":
    app.run(debug=True)
