from flask import Flask, jsonify, request
from flask_cors import CORS
import pymongo
import os
from datetime import datetime
import logging

# Configure logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

app = Flask(__name__)
CORS(app)

# MongoDB connection with error handling
try:
    # Use environment variable for production, fallback to hardcoded for development
    MONGODB_URI = os.getenv('MONGODB_URI', 
                           "mongodb+srv://shashankreddy:shashankreddy@cluster0.4kjc3.mongodb.net/")
    
    client = pymongo.MongoClient(MONGODB_URI)
    # Test the connection
    client.admin.command('ping')
    logger.info("Successfully connected to MongoDB")
    
    mydb = client["collade_details"]
    mycol = mydb["collage_details"]
    
except Exception as e:
    logger.error(f"Failed to connect to MongoDB: {str(e)}")
    client = None
    mydb = None
    mycol = None

# Helper function to clean up user input
def clean_input(input_string):
    """Clean and validate user input"""
    if input_string is None:
        return ""
    return str(input_string).strip()

def validate_year(year_string):
    """Validate year input"""
    try:
        year = int(year_string)
        current_year = datetime.now().year
        if 1600 <= year <= current_year:  # Reasonable range for college founding years
            return year
        else:
            raise ValueError("Year out of reasonable range")
    except (ValueError, TypeError):
        raise ValueError("Invalid year format")

def validate_rating(rating_string):
    """Validate rating input"""
    try:
        rating = float(rating_string)
        if 0 <= rating <= 5:
            return rating
        else:
            raise ValueError("Rating must be between 0 and 5")
    except (ValueError, TypeError):
        raise ValueError("Invalid rating format")

def build_search_query(params):
    """Build MongoDB query from search parameters"""
    query = {}
    
    # Text search parameters
    text_fields = {
        'name': 'name',
        'city': 'city', 
        'state': 'state',
        'facility': 'facilities'
    }
    
    for param, field in text_fields.items():
        value = params.get(param)
        if value:
            query[field] = {"$regex": value, "$options": "i"}
    
    # Exact match parameters
    if params.get('year'):
        try:
            query['year_founded'] = validate_year(params['year'])
        except ValueError as e:
            raise ValueError(f"Year error: {str(e)}")
    
    if params.get('collegeType'):
        query['type'] = params['collegeType']
    
    # Range parameters
    year_range = {}
    if params.get('minYear'):
        try:
            year_range['$gte'] = validate_year(params['minYear'])
        except ValueError as e:
            raise ValueError(f"Minimum year error: {str(e)}")
    
    if params.get('maxYear'):
        try:
            year_range['$lte'] = validate_year(params['maxYear'])
        except ValueError as e:
            raise ValueError(f"Maximum year error: {str(e)}")
    
    if year_range:
        query['year_founded'] = year_range
    
    if params.get('minRating'):
        try:
            query['rating'] = {"$gte": validate_rating(params['minRating'])}
        except ValueError as e:
            raise ValueError(f"Rating error: {str(e)}")
    
    return query

@app.route("/", methods=["GET"])
def home():
    """Health check endpoint"""
    return jsonify({
        "message": "College Search API is running",
        "version": "2.0",
        "endpoints": [
            "/search - Advanced multi-parameter search",
            "/college - Search by college name",
            "/city - Search by city",
            "/state - Search by state", 
            "/year - Search by founding year",
            "/facilities - Search by facility",
            "/states - Get all available states",
            "/stats - Get database statistics"
        ]
    }), 200

@app.route("/search", methods=["GET"])
def advanced_search():
    """Enhanced search endpoint that handles multiple parameters"""
    try:
        if not mycol:
            return jsonify({"error": "Database connection not available"}), 503
        
        # Extract and clean search parameters
        search_params = {
            'name': clean_input(request.args.get("name", "")),
            'city': clean_input(request.args.get("city", "")),
            'state': clean_input(request.args.get("state", "")),
            'year': clean_input(request.args.get("year", "")),
            'facility': clean_input(request.args.get("facility", "")),
            'collegeType': clean_input(request.args.get("collegeType", "")),
            'minYear': clean_input(request.args.get("minYear", "")),
            'maxYear': clean_input(request.args.get("maxYear", "")),
            'minRating': clean_input(request.args.get("minRating", ""))
        }
        
        # Remove empty parameters
        search_params = {k: v for k, v in search_params.items() if v}
        
        # Check if any search parameters provided
        if not search_params:
            return jsonify({"error": "No search parameters provided"}), 400
        
        # Build MongoDB query
        try:
            query = build_search_query(search_params)
        except ValueError as e:
            return jsonify({"error": str(e)}), 400
        
        logger.info(f"Search query: {query}")
        
        # Execute search with error handling
        try:
            college_data = list(mycol.find(query, {"_id": 0}).limit(100))  # Limit results for performance
        except Exception as e:
            logger.error(f"Database query error: {str(e)}")
            return jsonify({"error": "Database query failed"}), 500
        
        if college_data:
            logger.info(f"Found {len(college_data)} colleges")
            return jsonify(college_data), 200
        else:
            return jsonify({"error": "No colleges found matching your criteria"}), 404
            
    except Exception as e:
        logger.error(f"Search endpoint error: {str(e)}")
        return jsonify({"error": "Internal server error"}), 500

@app.route("/college", methods=["GET"])
def get_college_by_name():
    """Search colleges by name (backward compatibility)"""
    try:
        if not mycol:
            return jsonify({"error": "Database connection not available"}), 503
            
        college_name = clean_input(request.args.get("name"))
        
        if not college_name:
            return jsonify({"error": "No college name provided"}), 400
        
        college_data = list(mycol.find(
            {"name": {"$regex": college_name, "$options": "i"}}, 
            {"_id": 0}
        ).limit(50))
        
        if college_data:
            return jsonify(college_data), 200
        else:
            return jsonify({"error": "No colleges found with that name"}), 404
            
    except Exception as e:
        logger.error(f"College search error: {str(e)}")
        return jsonify({"error": "Internal server error"}), 500

@app.route("/city", methods=["GET"])
def get_college_by_city():
    """Search colleges by city"""
    try:
        if not mycol:
            return jsonify({"error": "Database connection not available"}), 503
            
        college_city = clean_input(request.args.get("city"))
        
        if not college_city:
            return jsonify({"error": "No city provided"}), 400
        
        college_data = list(mycol.find(
            {"city": {"$regex": college_city, "$options": "i"}}, 
            {"_id": 0}
        ).limit(50))
        
        if college_data:
            return jsonify(college_data), 200
        else:
            return jsonify({"error": "No colleges found in that city"}), 404
            
    except Exception as e:
        logger.error(f"City search error: {str(e)}")
        return jsonify({"error": "Internal server error"}), 500

@app.route("/year", methods=["GET"])
def get_college_by_year():
    """Search colleges by founding year"""
    try:
        if not mycol:
            return jsonify({"error": "Database connection not available"}), 503
            
        college_year = clean_input(request.args.get("year"))
        
        if not college_year:
            return jsonify({"error": "No year provided"}), 400
