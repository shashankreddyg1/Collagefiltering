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
        
        try:
            year = validate_year(college_year)
        except ValueError as e:
            return jsonify({"error": str(e)}), 400
        
        college_data = list(mycol.find(
            {"year_founded": year}, 
            {"_id": 0}
        ).limit(50))
        
        if college_data:
            return jsonify(college_data), 200
        else:
            return jsonify({"error": "No colleges found for that year"}), 404
            
    except Exception as e:
        logger.error(f"Year search error: {str(e)}")
        return jsonify({"error": "Internal server error"}), 500

@app.route("/state", methods=["GET"])
def get_college_by_state():
    """Search colleges by state"""
    try:
        if not mycol:
            return jsonify({"error": "Database connection not available"}), 503
            
        college_state = clean_input(request.args.get("state"))
        
        if not college_state:
            return jsonify({"error": "No state provided"}), 400
        
        college_data = list(mycol.find(
            {"state": {"$regex": college_state, "$options": "i"}}, 
            {"_id": 0}
        ).limit(50))
        
        if college_data:
            return jsonify(college_data), 200
        else:
            return jsonify({"error": "No colleges found in that state"}), 404
            
    except Exception as e:
        logger.error(f"State search error: {str(e)}")
        return jsonify({"error": "Internal server error"}), 500

@app.route("/facilities", methods=["GET"])
def get_college_by_facilities():
    """Search colleges by facilities"""
    try:
        if not mycol:
            return jsonify({"error": "Database connection not available"}), 503
            
        facility = clean_input(request.args.get("facility"))
        
        if not facility:
            return jsonify({"error": "No facility provided"}), 400
        
        college_data = list(mycol.find(
            {"facilities": {"$regex": facility, "$options": "i"}}, 
            {"_id": 0}
        ).limit(50))
        
        if college_data:
            return jsonify(college_data), 200
        else:
            return jsonify({"error": f"No colleges found with facility: {facility}"}), 404
            
    except Exception as e:
        logger.error(f"Facilities search error: {str(e)}")
        return jsonify({"error": "Internal server error"}), 500

@app.route("/states", methods=["GET"])
def get_all_states():
    """Get all unique states for dropdown population"""
    try:
        if not mycol:
            return jsonify({"error": "Database connection not available"}), 503
            
        states = mycol.distinct("state")
        sorted_states = sorted([state for state in states if state])  # Filter out empty states
        
        return jsonify(sorted_states), 200
        
    except Exception as e:
        logger.error(f"States fetch error: {str(e)}")
        return jsonify({"error": "Internal server error"}), 500

@app.route("/stats", methods=["GET"])
def get_database_stats():
    """Get comprehensive database statistics"""
    try:
        if not mycol:
            return jsonify({"error": "Database connection not available"}), 503
        
        # Basic counts
        total_colleges = mycol.count_documents({})
        total_states = len(mycol.distinct("state"))
        total_cities = len(mycol.distinct("city"))
        
        # Year statistics
        year_pipeline = [
            {"$group": {
                "_id": None,
                "min_year": {"$min": "$year_founded"},
                "max_year": {"$max": "$year_founded"},
                "avg_year": {"$avg": "$year_founded"}
            }}
        ]
        year_stats = list(mycol.aggregate(year_pipeline))
        
        # College type distribution
        type_pipeline = [
            {"$group": {
                "_id": "$type",
                "count": {"$sum": 1}
            }},
            {"$sort": {"count": -1}}
        ]
        type_distribution = list(mycol.aggregate(type_pipeline))
        
        # Rating statistics (if available)
        rating_pipeline = [
            {"$match": {"rating": {"$exists": True, "$ne": None}}},
            {"$group": {
                "_id": None,
                "avg_rating": {"$avg": "$rating"},
                "min_rating": {"$min": "$rating"},
                "max_rating": {"$max": "$rating"},
                "total_rated": {"$sum": 1}
            }}
        ]
        rating_stats = list(mycol.aggregate(rating_pipeline))
        
        # Most common facilities
        facilities_pipeline = [
            {"$unwind": {"path": "$facilities", "preserveNullAndEmptyArrays": False}},
            {"$group": {
                "_id": "$facilities",
                "count": {"$sum": 1}
            }},
            {"$sort": {"count": -1}},
            {"$limit": 10}
        ]
        # This might not work if facilities is a string, not array
        # Let's handle both cases
        try:
            top_facilities = list(mycol.aggregate(facilities_pipeline))
        except:
            top_facilities = []
        
        stats = {
            "total_colleges": total_colleges,
            "total_states": total_states,
            "total_cities": total_cities,
            "year_range": {
                "min": year_stats[0]["min_year"] if year_stats else None,
                "max": year_stats[0]["max_year"] if year_stats else None,
                "average": round(year_stats[0]["avg_year"], 1) if year_stats else None
            },
            "type_distribution": type_distribution,
            "rating_stats": rating_stats[0] if rating_stats else {},
            "top_facilities": top_facilities,
            "last_updated": datetime.now().isoformat()
        }
        
        return jsonify(stats), 200
        
    except Exception as e:
        logger.error(f"Stats fetch error: {str(e)}")
        return jsonify({"error": "Internal server error"}), 500

@app.route("/health", methods=["GET"])
def health_check():
    """Comprehensive health check endpoint"""
    try:
        health_status = {
            "status": "healthy",
            "timestamp": datetime.now().isoformat(),
            "version": "2.0",
            "database": "disconnected"
        }
        
        # Check database connection
        if mycol:
            try:
                # Simple query to test connection
                mycol.find_one({}, {"_id": 1})
                health_status["database"] = "connected"
                
                # Get basic stats
                health_status["college_count"] = mycol.count_documents({})
                
            except Exception as e:
                logger.error(f"Database health check failed: {str(e)}")
                health_status["database"] = "error"
                health_status["database_error"] = str(e)
        
        return jsonify(health_status), 200
        
    except Exception as e:
        logger.error(f"Health check error: {str(e)}")
        return jsonify({
            "status": "unhealthy",
            "error": str(e),
            "timestamp": datetime.now().isoformat()
        }), 500

@app.errorhandler(404)
def not_found(error):
    """Custom 404 handler"""
    return jsonify({
        "error": "Endpoint not found",
        "message": "Please check the API documentation for available endpoints",
        "available_endpoints": [
            "/search", "/college", "/city", "/state", "/year", 
            "/facilities", "/states", "/stats", "/health"
        ]
    }), 404

@app.errorhandler(500)
def internal_error(error):
    """Custom 500 handler"""
    logger.error(f"Internal server error: {str(error)}")
    return jsonify({
        "error": "Internal server error",
        "message": "Something went wrong on our end. Please try again later."
    }), 500

@app.errorhandler(405)
def method_not_allowed(error):
    """Custom 405 handler"""
    return jsonify({
        "error": "Method not allowed",
        "message": "This endpoint only supports specific HTTP methods"
    }), 405

@app.before_request
def log_request_info():
    """Log incoming requests for debugging"""
    logger.info(f"Request: {request.method} {request.url}")
    if request.method == 'POST':
        logger.info(f"Request body: {request.get_json()}")

@app.after_request
def after_request(response):
    """Add security headers and log responses"""
    # Security headers
    response.headers['X-Content-Type-Options'] = 'nosniff'
    response.headers['X-Frame-Options'] = 'DENY'
    response.headers['X-XSS-Protection'] = '1; mode=block'
    
    # Log response
    logger.info(f"Response: {response.status_code}")
    
    return response

if __name__ == "__main__":
    # Get port from environment variable or default to 5000
    port = int(os.getenv('PORT', 5000))
    debug_mode = os.getenv('FLASK_ENV') != 'production'
    
    logger.info(f"Starting Flask app on port {port}")
    logger.info(f"Debug mode: {debug_mode}")
    logger.info(f"Database connected: {mycol is not None}")
    
    app.run(
        host='0.0.0.0',  # Allow external connections
        port=port,
        debug=debug_mode
    )
