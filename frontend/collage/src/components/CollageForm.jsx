import React, { useState } from "react";

const CollegeForm = () => {
 
  const [collegeName, setCollegeName] = useState("");
  const [collegeDetails, setCollegeDetails] = useState(null);
  const [error, setError] = useState("");

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!collegeName) {
      setError("Please enter a college name.");
      return;
    }


    try {
      const response = await fetch(`/college?name=${collegeName}`);
      const data = await response.json();


      if (response.ok) {
        setCollegeDetails(data);
        setError(""); 
      } else {
        setError(data.error || "College not found.");
        setCollegeDetails(null);
      }
    } catch (err) {
      setError("Error fetching data. Please try again.");
      setCollegeDetails(null);
    }
  };

  return (
    <div>
      <h1>College Details Form</h1>

      {/* College name input */}
      <form onSubmit={handleSubmit}>
        <input
          type="text"
          value={collegeName}
          onChange={(e) => setCollegeName(e.target.value)}
          placeholder="Enter College Name"
        />
        <button type="submit">Get College Details</button>
      </form>

      {/* Display error message if any */}
      {error && <p style={{ color: "red" }}>{error}</p>}

      {/* Display fetched college details */}
      {collegeDetails && (
        <div>
          <h2>Details for {collegeDetails.name}</h2>
          <p>Location: {collegeDetails.location}</p>
          <p>Year Established: {collegeDetails.year}</p>
          <p>Facilities: {collegeDetails.facilities}</p>
        </div>
      )}
    </div>
  );
};

export default CollegeForm;
