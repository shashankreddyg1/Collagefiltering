import React, { useState, useEffect } from "react";
import { Container, TextField, CircularProgress, Card, CardContent, Typography } from "@mui/material";
import { Snackbar } from '@mui/material';
import MuiAlert from '@mui/material/Alert';

import './App.css'; // Import the CSS file

function App() {
  const [colleges, setColleges] = useState([]);
  const [error, setError] = useState(null);
  const [query, setQuery] = useState({
    name: "",
    city: "",
    year: "",
    state: "",
    facility: "",
  });
  const [loading, setLoading] = useState(false);

  // Debounce function to limit API calls
  const debounce = (func, delay) => {
    let timeoutId;
    return function (...args) {
      if (timeoutId) {
        clearTimeout(timeoutId);
      }
      timeoutId = setTimeout(() => {
        func.apply(this, args);
      }, delay);
    };
  };

  // Function to fetch colleges based on query parameter
  const fetchColleges = async (param, type) => {
    setLoading(true);
    setError(null); // Reset error on new search
    let url = `http://localhost:5000/${type}?${type}=${param.trim()}`; // Trim the input query

    try {
      const response = await fetch(url);
      const data = await response.json();

      if (response.ok) {
        setColleges(data); // Update the colleges state with the result
      } else {
        setError(data.error); // Set error message from API
      }
    } catch (error) {
      setError("Error fetching data");
    } finally {
      setLoading(false);
    }
  };

  // Debounced fetch function
  const debouncedFetchColleges = debounce(fetchColleges, 300);

  // useEffect to handle fetching based on query
  useEffect(() => {
    if (query.name) {
      debouncedFetchColleges(query.name, "college");
    } else if (query.city) {
      debouncedFetchColleges(query.city, "city");
    } else if (query.year) {
      debouncedFetchColleges(query.year, "year");
    } else if (query.state) {
      debouncedFetchColleges(query.state, "state");
    } else if (query.facility) {
      debouncedFetchColleges(query.facility, "facilities");
    } else {
      setColleges([]);
      setError(null);
    }
  }, [query]); // Runs when query changes

  const handleSnackbarClose = () => {
    setError(null);
  };

  return (
    <Container maxWidth="md" className="app-container">
      <h1>College Search</h1>

      {/* Input Fields with Material UI */}
      <div className="input-container">
        <TextField
          fullWidth
          label="Search by College Name"
          variant="outlined"
          value={query.name}
          onChange={(e) => setQuery({ ...query, name: e.target.value })}
          placeholder="Enter College Name"
          size="small"
        />
        <TextField
          fullWidth
          label="Search by City"
          variant="outlined"
          value={query.city}
          onChange={(e) => setQuery({ ...query, city: e.target.value })}
          placeholder="Enter City"
          size="small"
        />
        <TextField
          fullWidth
          label="Search by Year Founded"
          variant="outlined"
          value={query.year}
          onChange={(e) => setQuery({ ...query, year: e.target.value })}
          placeholder="Enter Year"
          size="small"
          type="number"
        />
        <TextField
          fullWidth
          label="Search by State"
          variant="outlined"
          value={query.state}
          onChange={(e) => setQuery({ ...query, state: e.target.value })}
          placeholder="Enter State"
          size="small"
        />
        <TextField
          fullWidth
          label="Search by Facility"
          variant="outlined"
          value={query.facility}
          onChange={(e) => setQuery({ ...query, facility: e.target.value })}
          placeholder="Enter Facility"
          size="small"
        />
      </div>

      {/* Loading Indicator */}
      {loading && <CircularProgress style={{ marginTop: "20px" }} />}

      {/* Error Snackbar */}
      <Snackbar open={!!error} autoHideDuration={6000} onClose={handleSnackbarClose}>
        <MuiAlert onClose={handleSnackbarClose} severity="error" sx={{ width: '100%' }}>
          {error}
        </MuiAlert>
      </Snackbar>

      {/* Display Colleges */}
      {colleges.length > 0 ? (
        <div className="colleges-list">
          {colleges.map((college, index) => (
            <Card variant="outlined" className="college-card" key={index}>
              <CardContent>
                <Typography variant="h6" component="div">
                  {college.name}
                </Typography>
                <Typography color="text.secondary">Year Founded: {college.year_founded}</Typography>
                <Typography color="text.secondary">City: {college.city}</Typography>
                <Typography color="text.secondary">State: {college.state}</Typography>
                <Typography color="text.secondary">Facilities: {college.facilities}</Typography>
              </CardContent>
            </Card>
          ))}
        </div>
      ) : (
        <Typography variant="h6" style={{ marginTop: "20px" }}>
          No colleges found
        </Typography>
      )}
    </Container>
  );
}

export default App;