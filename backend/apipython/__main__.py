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

# Updated MongoDB connection with your new credentials
try:
    # IMPORTANT: Change your password immediately after using this!
    # For production, use environment variables
    MONGODB_URI = os.getenv('MONGODB_URI', 
                           "mongodb+srv://shashankreddyg1:123%401234Sh@cluster0.uein54z.mongodb.net/?retryWrites=true&w=majority&appName=Cluster0")
    
    client = pymongo.MongoClient(MONGODB_URI)
    # Test the connection
    client.admin.command('ping')
    logger.info("Successfully connected to MongoDB Atlas")
    
    # Use your database and collection names
    mydb = client["college_search_db"]  # Choose your database name
    mycol = mydb["colleges"]            # Choose your collection name
    
    logger.info(f"Connected to database: {mydb.name}")
    logger.info(f"Using collection: {mycol.name}")
    
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
        if 1600 <= year <= current_year:
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
        "database_connected": mycol is not None,
        "database_name": mydb.name if mydb else None,
        "collection_name": mycol.name if mycol else None,
        "endpoints": [
            "/search - Advanced multi-parameter search",
            "/college - Search by college name",
            "/city - Search by city",
            "/state - Search by state", 
            "/year - Search by founding year",
            "/facilities - Search by facility",
            "/states - Get all available states",
            "/stats - Get database statistics",
            "/health - Detailed health check",
            "/setup - Initialize database with sample data"
        ]
    }), 200

@app.route("/health", methods=["GET"])
def health_check():
    """Comprehensive health check endpoint"""
    try:
        health_status = {
            "status": "healthy",
            "timestamp": datetime.now().isoformat(),
            "version": "2.0",
            "database": "disconnected",
            "college_count": 0
        }
        
        # Check database connection
        if mycol:
            try:
                # Test connection with a simple query
                mycol.find_one({}, {"_id": 1})
                health_status["database"] = "connected"
                health_status["database_name"] = mydb.name
                health_status["collection_name"] = mycol.name
                
                # Get basic stats
                health_status["college_count"] = mycol.count_documents({})
                
                # Check if database has data
                if health_status["college_count"] == 0:
                    health_status["warning"] = "Database is empty. Use /setup to add sample data."
                
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

@app.route("/setup", methods=["POST"])
def setup_sample_data():
    """Initialize database with sample college data"""
    if not mycol:
        return jsonify({"error": "Database connection not available"}), 503
    
    try:
        # Check if data already exists
        existing_count = mycol.count_documents({})
        if existing_count > 0:
            return jsonify({
                "message": "Database already contains data",
                "existing_count": existing_count,
                "suggestion": "Use DELETE /setup to clear data first, or add data manually"
            }), 200
        
        # Sample college data (subset for quick setup)
        sample_colleges = [
            {
                "name": "Harvard University",
                "year_founded": 1636,
                "city": "Cambridge",
                "state": "Massachusetts",
                "facilities": "Historical Library, Medical School, Law School, Business School, Research Centers, Museums, Sports Complex",
                "type": "private",
                "rating": 4.6,
                "enrollment": 23000,
                "tuition": 54002,
                "acceptance_rate": 3.4,
                "description": "The oldest institution of higher education in the United States."
            },
            {
                "name": "Massachusetts Institute of Technology",
                "year_founded": 1861,
                "city": "Cambridge", 
                "state": "Massachusetts",
                "facilities": "AI Lab, Media Lab, Research Labs, Engineering Labs, Computer Science Labs, Innovation Hub, Sports Complex",
                "type": "private",
                "rating": 4.8,
                "enrollment": 11000,
                "tuition": 53790,
                "acceptance_rate": 7.3,
                "description": "Leading technology institute known for innovation and research excellence."
            },
            {
                "name": "Stanford University",
                "year_founded": 1885,
                "city": "Stanford",
                "state": "California", 
                "facilities": "Medical Center, Business School, Engineering School, Athletics Complex, Innovation Hub, Startup Incubator, Research Labs",
                "type": "private",
                "rating": 4.7,
                "enrollment": 17000,
                "tuition": 56169,
                "acceptance_rate": 4.3,
                "description": "Premier research university in Silicon Valley with strong entrepreneurial culture."
            },
            {
                "name": "University of California, Berkeley",
                "year_founded": 1868,
                "city": "Berkeley",
                "state": "California",
                "facilities": "Engineering School, Business School, Research Labs, Library, Sports Complex, Student Centers",
                "type": "public",
                "rating": 4.4,
                "enrollment": 45000,
                "tuition": 14254,
                "acceptance_rate": 17.5,
                "description": "Top public research university known for academic excellence and social activism."
            },
            {
                "name": "University of Texas at Austin",
                "year_founded": 1883,
                "city": "Austin",
                "state": "Texas",
                "facilities": "Business School, Engineering School, Law School, Music School, Research Centers, Athletics Complex, Library",
                "type": "public",
                "rating": 4.2,
                "enrollment": 51000,
                "tuition": 11448,
                "acceptance_rate": 31.8,
                "description": "Major public research university known for business, engineering, and vibrant campus life."
            }
        ]
        
        # Insert sample data
        result = mycol.insert_many(sample_colleges)
        
        return jsonify({
            "message": "Sample data inserted successfully",
            "inserted_count": len(result.inserted_ids),
            "colleges": [college["name"] for college in sample_colleges]
        }), 201
        
    except Exception as e:
        logger.error(f"Setup error: {str(e)}")
        return jsonify({"error": f"Failed to setup sample data: {str(e)}"}), 500

@app.route("/setup", methods=["DELETE"])
def clear_database():
    """Clear all data from the database"""
    if not mycol:
        return jsonify({"error": "Database connection not available"}), 503
    
    try:
        result = mycol.delete_many({})
        return jsonify({
            "message": "Database cleared successfully",
            "deleted_count": result.deleted_count
        }), 200
        
    except Exception as e:
        logger.error(f"Clear database error: {str(e)}")
        return jsonify({"error": f"Failed to clear database: {str(e)}"}), 500

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
            college_data = list(mycol.find(query, {"_id": 0}).limit(100))
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

# Keep your existing endpoints (college, city, state, year, facilities)
@app.route("/college", methods=["GET"])
def get_college_by_name():
    """Search colleges by name"""
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

@app.route("/stats", methods=["GET"])
def get_database_stats():
    """Get comprehensive database statistics"""
    try:
        if not mycol:
            return jsonify({"error": "Database connection not available"}), 503
        
        # Basic counts
        total_colleges = mycol.count_documents({})
        
        if total_colleges == 0:
            return jsonify({
                "message": "Database is empty",
                "suggestion": "Use POST /setup to add sample data",
                "total_colleges": 0
            }), 200
        
        total_states = len(mycol.distinct("state"))
        total_cities = len(mycol.distinct("city"))
        
        stats = {
            "total_colleges": total_colleges,
            "total_states": total_states,
            "total_cities": total_cities,
            "database_name": mydb.name,
            "collection_name": mycol.name,
            "last_updated": datetime.now().isoformat()
        }
        
        return jsonify(stats), 200
        
    except Exception as e:
        logger.error(f"Stats fetch error: {str(e)}")
        return jsonify({"error": "Internal server error"}), 500

if __name__ == "__main__":
    port = int(os.getenv('PORT', 5000))
    debug_mode = os.getenv('FLASK_ENV') != 'production'
    
    logger.info(f"Starting College Search API v2.0")
    logger.info(f"Port: {port}")
    logger.info(f"Debug mode: {debug_mode}")
    logger.info(f"Database connected: {mycol is not None}")
    
    if mycol:
        logger.info(f"Database: {mydb.name}")
        logger.info(f"Collection: {mycol.name}")
        logger.info(f"College count: {mycol.count_documents({})}")
    
    app.run(
        host='0.0.0.0',
        port=port,
        debug=debug_mode
    )
