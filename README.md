# College Filtering Application

A full-stack web application that helps students search and explore colleges by name, city, state, founding year, facilities, type, and rating. A React frontend talks to a Python REST API backed by MongoDB.

## Tech Stack

| Layer | Technology |
|-------|------------|
| Frontend | React 19 (Create React App), Material UI, Bootstrap, React Router |
| Backend | Python, Flask, Flask-CORS, Gunicorn |
| Database | MongoDB Atlas (via PyMongo) |

## Project Structure

```
├── backend/
│   └── apipython/
│       ├── __main__.py        # Flask API — entry point (`python __main__.py`)
│       ├── app.py             # (unused placeholder)
│       └── requirements.txt   # Python dependencies
├── frontend/
│   └── collage/
│       ├── public/            # Static assets
│       ├── src/               # React components and pages
│       ├── package.json       # Node dependencies
│       └── package-lock.json  # Lock file
└── README.md
```

## API Endpoints

The Flask API (default port 5000) exposes:

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/` | Service info and endpoint list |
| GET | `/health` | Health check with DB status and college count |
| GET | `/search` | Multi-parameter search (name, city, state, year, rating, type, facilities) |
| GET | `/college?name=` | Search by college name |
| GET | `/stats` | Database statistics |
| POST | `/setup` | Seed the database with 5 sample colleges |
| DELETE | `/setup` | Clear all college data |

## Setup

### Backend

```bash
cd backend/apipython
pip install -r requirements.txt
```

Set your MongoDB connection string (the API will not start the database layer without it):

```bash
export MONGODB_URI="mongodb+srv://<user>:<password>@<cluster>/..."
python __main__.py
```

The API listens on port 5000 (override with the `PORT` env var).

### Frontend

```bash
cd frontend/collage
npm install
npm start
```

The frontend expects the API at `http://localhost:5000`. Open http://localhost:3000 in your browser.

## Data

There is no bundled dataset. After starting the backend, seed 5 sample colleges (Harvard, MIT, Stanford, UC Berkeley, UT Austin) with:

```bash
curl -X POST http://localhost:5000/setup
```

To use real data, insert your own documents into the `colleges` collection of the `college_search_db` database. Documents use fields like `name`, `city`, `state`, `year_founded`, `facilities`, `type`, `rating`, `enrollment`, `tuition`, and `acceptance_rate`.

## Notes

- This is a learning project, not a production deployment: there is no authentication on the API, no test suite beyond the Create React App boilerplate, and no container or CI configuration.
- The frontend's Login/Signup pages call a `/login` endpoint that the API does not implement — they are UI-only.
- `backend/apipython/app.py` is an empty placeholder — the entire API lives in `__main__.py`.

## Author

**Shashank Reddy Gantla**
Email: shashankreddyg1@gmail.com
