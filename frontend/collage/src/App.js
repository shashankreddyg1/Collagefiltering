import React, { useState, useEffect, useCallback } from "react";
import { 
  Container, 
  TextField, 
  CircularProgress, 
  Card, 
  CardContent, 
  Typography,
  Snackbar,
  Alert,
  Box,
  Chip,
  Grid,
  InputAdornment,
  Fade,
  Paper,
  IconButton,
  Tooltip,
  Switch,
  FormControlLabel,
  Select,
  MenuItem,
  FormControl,
  InputLabel,
  Button,
  Accordion,
  AccordionSummary,
  AccordionDetails,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Pagination
} from "@mui/material";

import { 
  Search, 
  LocationOn, 
  CalendarToday, 
  School, 
  Star,
  Clear,
  FilterList,
  ViewModule,
  ViewList,
  Compare,
  Download,
  DarkMode,
  LightMode,
  ExpandMore,
  Close,
  StarBorder
} from "@mui/icons-material";

import './App.css';

// API Configuration - Make sure this matches your backend
const API_BASE_URL = 'http://localhost:5000';

function App() {
  // State management
  const [colleges, setColleges] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [connectionStatus, setConnectionStatus] = useState('checking'); // checking, connected, disconnected
  const [darkMode, setDarkMode] = useState(() => 
    localStorage.getItem('darkMode') === 'true'
  );
  const [viewMode, setViewMode] = useState('grid');
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage] = useState(12);
  
  // Search state
  const [searchParams, setSearchParams] = useState({
    name: "",
    city: "",
    year: "",
    state: "",
    facility: "",
    collegeType: "",
    minYear: "",
    maxYear: "",
    minRating: ""
  });
  
  const [sortBy, setSortBy] = useState('name');
  const [showAdvancedFilters, setShowAdvancedFilters] = useState(false);
  
  // Favorites and comparison
  const [favorites, setFavorites] = useState(() => 
    JSON.parse(localStorage.getItem('favorites') || '[]')
  );
  const [compareList, setCompareList] = useState([]);
  const [showComparison, setShowComparison] = useState(false);

  // Check backend connection on app load
  useEffect(() => {
    checkBackendConnection();
  }, []);

  const checkBackendConnection = async () => {
    try {
      console.log('Checking backend connection...');
      const response = await fetch(`${API_BASE_URL}/health`, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
        },
      });
      
      if (response.ok) {
        const data = await response.json();
        console.log('Backend connection successful:', data);
        setConnectionStatus('connected');
        
        // Check if database has data
        if (data.college_count === 0) {
          setError('Database is empty. Backend is connected but no college data found.');
        }
      } else {
        throw new Error(`Backend responded with status: ${response.status}`);
      }
    } catch (error) {
      console.error('Backend connection failed:', error);
      setConnectionStatus('disconnected');
      setError(`Cannot connect to backend: ${error.message}. Make sure Flask server is running on ${API_BASE_URL}`);
    }
  };

  // Enhanced API call function with better error handling
  const fetchColleges = useCallback(async (params) => {
    try {
      setLoading(true);
      setError(null);

      // Check if any search parameter is provided
      const hasSearchTerm = Object.values(params).some(value => value && value.trim());
      
      if (!hasSearchTerm) {
        setColleges([]);
        return;
      }

      console.log('Searching with params:', params);

      // Build query parameters
      const queryParams = new URLSearchParams();
      Object.entries(params).forEach(([key, value]) => {
        if (value && value.trim()) {
          queryParams.append(key, value.trim());
        }
      });

      // Try the enhanced search endpoint first
      let response;
      let endpoint;
      
      try {
        // Use the new /search endpoint for multiple parameters
        endpoint = `${API_BASE_URL}/search?${queryParams}`;
        console.log('Calling API:', endpoint);
        
        response = await fetch(endpoint, {
          method: 'GET',
          headers: {
            'Content-Type': 'application/json',
          },
        });
        
        console.log('API Response status:', response.status);
        
      } catch (fetchError) {
        console.error('Fetch error:', fetchError);
        throw new Error(`Network error: ${fetchError.message}`);
      }

      if (response.ok) {
        const data = await response.json();
        console.log('API Response data:', data);
        
        if (Array.isArray(data)) {
          setColleges(data);
          setConnectionStatus('connected');
        } else {
          throw new Error('Invalid response format from API');
        }
      } else if (response.status === 404) {
        // No results found
        setColleges([]);
        setError('No colleges found matching your search criteria.');
      } else if (response.status === 503) {
        // Database connection issues
        throw new Error('Database connection not available. Please check backend logs.');
      } else {
        // Other errors
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.error || `API error: ${response.status}`);
      }
      
    } catch (error) {
      console.error('Search error:', error);
      setError(`Search failed: ${error.message}`);
      setColleges([]);
      
      // If it's a connection error, update connection status
      if (error.message.includes('fetch') || error.message.includes('Network')) {
        setConnectionStatus('disconnected');
      }
    } finally {
      setLoading(false);
    }
  }, []);

  // Debounce hook
  const useDebounce = (value, delay) => {
    const [debouncedValue, setDebouncedValue] = useState(value);

    useEffect(() => {
      const handler = setTimeout(() => {
        setDebouncedValue(value);
      }, delay);

      return () => {
        clearTimeout(handler);
      };
    }, [value, delay]);

    return debouncedValue;
  };

  const debouncedSearchParams = useDebounce(searchParams, 500);

  // Effect for search with connection check
  useEffect(() => {
    if (connectionStatus === 'connected') {
      fetchColleges(debouncedSearchParams);
    }
  }, [debouncedSearchParams, fetchColleges, connectionStatus]);

  // Handle input changes
  const handleInputChange = (field, value) => {
    setSearchParams(prev => ({
      ...prev,
      [field]: value
    }));
    setCurrentPage(1);
  };

  // Clear search
  const clearSearch = () => {
    setSearchParams({
      name: "",
      city: "",
      year: "",
      state: "",
      facility: "",
      collegeType: "",
      minYear: "",
      maxYear: "",
      minRating: ""
    });
    setCurrentPage(1);
    setError(null);
  };

  // Test connection function
  const testConnection = async () => {
    setError(null);
    setLoading(true);
    
    try {
      console.log('Testing connection to:', API_BASE_URL);
      
      // Test basic connection
      const healthResponse = await fetch(`${API_BASE_URL}/health`);
      if (!healthResponse.ok) {
        throw new Error(`Health check failed: ${healthResponse.status}`);
      }
      
      const healthData = await healthResponse.json();
      console.log('Health check result:', healthData);
      
      // Test search endpoint
      const searchResponse = await fetch(`${API_BASE_URL}/college?name=test`);
      console.log('Search test status:', searchResponse.status);
      
      if (searchResponse.ok || searchResponse.status === 404) {
        setConnectionStatus('connected');
        setError(null);
        alert(`✅ Connection successful!\nDatabase: ${healthData.database}\nColleges: ${healthData.college_count}`);
      } else {
        throw new Error(`Search endpoint failed: ${searchResponse.status}`);
      }
      
    } catch (error) {
      console.error('Connection test failed:', error);
      setConnectionStatus('disconnected');
      setError(`Connection test failed: ${error.message}`);
      alert(`❌ Connection failed: ${error.message}`);
    } finally {
      setLoading(false);
    }
  };

  // Setup sample data
  const setupSampleData = async () => {
    try {
      setLoading(true);
      const response = await fetch(`${API_BASE_URL}/setup`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
      });
      
      if (response.ok) {
        const data = await response.json();
        alert(`✅ Sample data added successfully!\nAdded ${data.inserted_count} colleges`);
        checkBackendConnection(); // Refresh connection status
      } else {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.error || 'Failed to setup sample data');
      }
    } catch (error) {
      console.error('Setup error:', error);
      setError(`Setup failed: ${error.message}`);
    } finally {
      setLoading(false);
    }
  };

  // Connection status indicator
  const ConnectionStatus = () => (
    <Paper elevation={2} sx={{ p: 2, mb: 2, 
      bgcolor: connectionStatus === 'connected' ? 'success.light' : 
              connectionStatus === 'disconnected' ? 'error.light' : 'warning.light',
      color: 'white'
    }}>
      <Box display="flex" justifyContent="space-between" alignItems="center">
        <Box display="flex" alignItems="center" gap={1}>
          <Box sx={{ 
            width: 12, 
            height: 12, 
            borderRadius: '50%', 
            bgcolor: connectionStatus === 'connected' ? 'success.main' : 
                     connectionStatus === 'disconnected' ? 'error.main' : 'warning.main',
            animation: connectionStatus === 'checking' ? 'pulse 1s infinite' : 'none'
          }} />
          <Typography variant="body2">
            Backend: {connectionStatus === 'connected' ? 'Connected' : 
                     connectionStatus === 'disconnected' ? 'Disconnected' : 'Checking...'}
          </Typography>
          <Typography variant="caption" sx={{ opacity: 0.8 }}>
            ({API_BASE_URL})
          </Typography>
        </Box>
        <Box>
          <Button 
            size="small" 
            variant="outlined" 
            onClick={testConnection}
            sx={{ mr: 1, color: 'inherit', borderColor: 'inherit' }}
          >
            Test Connection
          </Button>
          {connectionStatus === 'connected' && (
            <Button 
              size="small" 
              variant="outlined" 
              onClick={setupSampleData}
              sx={{ color: 'inherit', borderColor: 'inherit' }}
            >
              Add Sample Data
            </Button>
          )}
        </Box>
      </Box>
    </Paper>
  );

  // Favorites functionality
  const toggleFavorite = (collegeName) => {
    const newFavorites = favorites.includes(collegeName)
      ? favorites.filter(name => name !== collegeName)
      : [...favorites, collegeName];
    
    setFavorites(newFavorites);
    localStorage.setItem('favorites', JSON.stringify(newFavorites));
  };

  // Comparison functionality
  const toggleCompare = (college) => {
    const isInCompare = compareList.find(item => item.name === college.name);
    
    if (isInCompare) {
      setCompareList(compareList.filter(item => item.name !== college.name));
    } else if (compareList.length < 3) {
      setCompareList([...compareList, college]);
    } else {
      setError('You can compare up to 3 colleges at a time');
    }
  };

  // Export functionality
  const exportToCSV = () => {
    if (colleges.length === 0) {
      setError('No colleges to export');
      return;
    }

    const headers = ['Name', 'Year Founded', 'City', 'State', 'Type', 'Rating', 'Enrollment', 'Tuition', 'Acceptance Rate'];
    const csvContent = [
      headers.join(','),
      ...colleges.map(college => [
        `"${college.name}"`,
        college.year_founded,
        `"${college.city}"`,
        `"${college.state}"`,
        college.type || '',
        college.rating || '',
        college.enrollment || '',
        college.tuition || '',
        college.acceptance_rate || ''
      ].join(','))
    ].join('\n');

    const blob = new Blob([csvContent], { type: 'text/csv' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `college_search_results_${new Date().toISOString().split('T')[0]}.csv`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    window.URL.revokeObjectURL(url);
  };

  // Generate star rating
  const generateStars = (rating) => {
    if (!rating) return null;
    
    return (
      <Box display="flex" alignItems="center" gap={0.5}>
        {[1, 2, 3, 4, 5].map((star) => (
          <Star 
            key={star}
            sx={{ 
              color: star <= rating ? '#ffa726' : '#e0e0e0',
              fontSize: '1rem'
            }}
          />
        ))}
        <Typography variant="caption" sx={{ ml: 1 }}>
          {rating}/5
        </Typography>
      </Box>
    );
  };

  // Pagination
  const totalPages = Math.ceil(colleges.length / itemsPerPage);
  const startIndex = (currentPage - 1) * itemsPerPage;
  const currentColleges = colleges.slice(startIndex, startIndex + itemsPerPage);

  return (
    <Box sx={{ 
      minHeight: '100vh', 
      bgcolor: darkMode ? '#121212' : '#f5f5f5',
      transition: 'background-color 0.3s ease'
    }}>
      <Container maxWidth="xl" sx={{ py: 4 }}>
        {/* Header */}
        <Paper 
          elevation={3} 
          sx={{ 
            p: 4, 
            mb: 4, 
            background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
            color: 'white',
            borderRadius: 3
          }}
        >
          <Box display="flex" justifyContent="space-between" alignItems="center" flexWrap="wrap" gap={2}>
            <Box>
              <Typography variant="h3" component="h1" fontWeight="bold" gutterBottom>
                🎓 College Search Pro
              </Typography>
              <Typography variant="h6" sx={{ opacity: 0.9 }}>
                Advanced college search with real-time API integration
              </Typography>
            </Box>
            <Box display="flex" alignItems="center" gap={2}>
              <FormControlLabel
                control={
                  <Switch
                    checked={darkMode}
                    onChange={(e) => {
                      setDarkMode(e.target.checked);
                      localStorage.setItem('darkMode', e.target.checked);
                    }}
                    color="secondary"
                  />
                }
                label={
                  <Box display="flex" alignItems="center" gap={1}>
                    {darkMode ? <LightMode /> : <DarkMode />}
                    {darkMode ? 'Light' : 'Dark'} Mode
                  </Box>
                }
              />
            </Box>
          </Box>
        </Paper>

        {/* Connection Status */}
        <ConnectionStatus />

        {/* Search Section */}
        <Paper elevation={2} sx={{ p: 3, mb: 4, borderRadius: 3 }}>
          {/* Search Controls */}
          <Box display="flex" justifyContent="space-between" alignItems="center" mb={3} flexWrap="wrap" gap={2}>
            <Box display="flex" alignItems="center" gap={1}>
              <Search color="primary" />
              <Typography variant="h6">Search Filters</Typography>
            </Box>
            <Box display="flex" gap={2} flexWrap="wrap">
              <Button
                variant="outlined"
                startIcon={<FilterList />}
                onClick={() => setShowAdvancedFilters(!showAdvancedFilters)}
              >
                Advanced Filters
              </Button>
              <Button
                variant="outlined"
                startIcon={<Download />}
                onClick={exportToCSV}
                color="success"
                disabled={colleges.length === 0}
              >
                Export CSV
              </Button>
              <Button
                variant="outlined"
                startIcon={<Clear />}
                onClick={clearSearch}
                color="error"
              >
                Clear All
              </Button>
            </Box>
          </Box>

          {/* Basic Search Fields */}
          <Grid container spacing={3} mb={2}>
            <Grid item xs={12} md={6} lg={4}>
              <TextField
                fullWidth
                label="College Name"
                value={searchParams.name}
                onChange={(e) => handleInputChange('name', e.target.value)}
                InputProps={{
                  startAdornment: (
                    <InputAdornment position="start">
                      <School />
                    </InputAdornment>
                  ),
                }}
                placeholder="e.g., Harvard, MIT"
              />
            </Grid>
            <Grid item xs={12} md={6} lg={4}>
              <TextField
                fullWidth
                label="City"
                value={searchParams.city}
                onChange={(e) => handleInputChange('city', e.target.value)}
                InputProps={{
                  startAdornment: (
                    <InputAdornment position="start">
                      <LocationOn />
                    </InputAdornment>
                  ),
                }}
                placeholder="e.g., Cambridge, Boston"
              />
            </Grid>
            <Grid item xs={12} md={6} lg={4}>
              <TextField
                fullWidth
                label="Year Founded"
                type="number"
                value={searchParams.year}
                onChange={(e) => handleInputChange('year', e.target.value)}
                InputProps={{
                  startAdornment: (
                    <InputAdornment position="start">
                      <CalendarToday />
                    </InputAdornment>
                  ),
                }}
                placeholder="e.g., 1636"
              />
            </Grid>
            <Grid item xs={12} md={6} lg={4}>
              <FormControl fullWidth>
                <InputLabel>State</InputLabel>
                <Select
                  value={searchParams.state}
                  label="State"
                  onChange={(e) => handleInputChange('state', e.target.value)}
                >
                  <MenuItem value="">All States</MenuItem>
                  <MenuItem value="California">California</MenuItem>
                  <MenuItem value="Massachusetts">Massachusetts</MenuItem>
                  <MenuItem value="New York">New York</MenuItem>
                  <MenuItem value="Illinois">Illinois</MenuItem>
                  <MenuItem value="Texas">Texas</MenuItem>
                </Select>
              </FormControl>
            </Grid>
            <Grid item xs={12} md={6} lg={4}>
              <TextField
                fullWidth
                label="Facility"
                value={searchParams.facility}
                onChange={(e) => handleInputChange('facility', e.target.value)}
                placeholder="e.g., Library, Lab, Sports"
              />
            </Grid>
          </Grid>

          {/* Advanced Filters */}
          <Accordion expanded={showAdvancedFilters}>
            <AccordionSummary expandIcon={<ExpandMore />}>
              <Typography>Advanced Filters</Typography>
            </AccordionSummary>
            <AccordionDetails>
              <Grid container spacing={3}>
                <Grid item xs={12} md={6} lg={3}>
                  <FormControl fullWidth>
                    <InputLabel>College Type</InputLabel>
                    <Select
                      value={searchParams.collegeType}
                      label="College Type"
                      onChange={(e) => handleInputChange('collegeType', e.target.value)}
                    >
                      <MenuItem value="">Any Type</MenuItem>
                      <MenuItem value="public">Public</MenuItem>
                      <MenuItem value="private">Private</MenuItem>
                    </Select>
                  </FormControl>
                </Grid>
                <Grid item xs={12} md={6} lg={3}>
                  <TextField
                    fullWidth
                    label="Min Year Founded"
                    type="number"
                    value={searchParams.minYear}
                    onChange={(e) => handleInputChange('minYear', e.target.value)}
                  />
                </Grid>
                <Grid item xs={12} md={6} lg={3}>
                  <TextField
                    fullWidth
                    label="Max Year Founded"
                    type="number"
                    value={searchParams.maxYear}
                    onChange={(e) => handleInputChange('maxYear', e.target.value)}
                  />
                </Grid>
                <Grid item xs={12} md={6} lg={3}>
                  <FormControl fullWidth>
                    <InputLabel>Min Rating</InputLabel>
                    <Select
                      value={searchParams.minRating}
                      label="Min Rating"
                      onChange={(e) => handleInputChange('minRating', e.target.value)}
                    >
                      <MenuItem value="">Any Rating</MenuItem>
                      <MenuItem value="4">4+ Stars</MenuItem>
                      <MenuItem value="3">3+ Stars</MenuItem>
                      <MenuItem value="2">2+ Stars</MenuItem>
                    </Select>
                  </FormControl>
                </Grid>
              </Grid>
            </AccordionDetails>
          </Accordion>
        </Paper>

        {/* Compare Panel */}
        {compareList.length > 0 && (
          <Paper elevation={2} sx={{ p: 2, mb: 4, borderRadius: 3 }}>
            <Box display="flex" justifyContent="space-between" alignItems="center">
              <Box>
                <Typography variant="h6">
                  <Compare sx={{ mr: 1 }} />
                  Comparing {compareList.length} college{compareList.length !== 1 ? 's' : ''}
                </Typography>
                <Box display="flex" gap={1} mt={1}>
                  {compareList.map((college) => (
                    <Chip 
                      key={college.name}
                      label={college.name}
                      onDelete={() => toggleCompare(college)}
                      color="primary"
                      variant="outlined"
                    />
                  ))}
                </Box>
              </Box>
              <Button 
                variant="contained" 
                onClick={() => setShowComparison(true)}
                disabled={compareList.length < 2}
              >
                View Comparison
              </Button>
            </Box>
          </Paper>
        )}

        {/* Loading */}
        {loading && (
          <Box display="flex" flexDirection="column" alignItems="center" py={8}>
            <CircularProgress size={60} />
            <Typography variant="h6" sx={{ mt: 2 }}>
              {connectionStatus === 'checking' ? 'Connecting to backend...' : 'Searching colleges...'}
            </Typography>
            <Typography variant="body2" color="text.secondary">
              Please wait while we find the best matches
            </Typography>
          </Box>
        )}

        {/* Results Section */}
        {!loading && colleges.length > 0 && (
          <Fade in={true}>
            <Paper elevation={2} sx={{ p: 3, borderRadius: 3 }}>
              {/* Results Header */}
              <Box display="flex" justifyContent="space-between" alignItems="center" mb={3} flexWrap="wrap" gap={2}>
                <Box display="flex" alignItems="center" gap={2}>
                  <Typography variant="h6">
                    Found {colleges.length} colleges
                  </Typography>
                  <Chip 
                    label={`${colleges.length} results`} 
                    color="primary" 
                    size="small"
                  />
                </Box>
                <Box display="flex" alignItems="center" gap={2}>
                  <FormControl size="small" sx={{ minWidth: 120 }}>
                    <InputLabel>Sort by</InputLabel>
                    <Select
                      value={sortBy}
                      label="Sort by"
                      onChange={(e) => setSortBy(e.target.value)}
                    >
                      <MenuItem value="name">Name</MenuItem>
                      <MenuItem value="year">Year Founded</MenuItem>
                      <MenuItem value="city">City</MenuItem>
                      <MenuItem value="state">State</MenuItem>
                      <MenuItem value="rating">Rating</MenuItem>
                    </Select>
                  </FormControl>
                  <Box display="flex" gap={1}>
                    <IconButton 
                      onClick={() => setViewMode('grid')}
                      color={viewMode === 'grid' ? 'primary' : 'default'}
                    >
                      <ViewModule />
                    </IconButton>
                    <IconButton 
                      onClick={() => setViewMode('list')}
                      color={viewMode === 'list' ? 'primary' : 'default'}
                    >
                      <ViewList />
                    </IconButton>
                  </Box>
                </Box>
              </Box>

              {/* College Results */}
              <Grid container spacing={3}>
                {currentColleges.map((college, index) => (
                  <Grid 
                    item 
                    xs={12} 
                    md={viewMode === 'grid' ? 6 : 12} 
                    lg={viewMode === 'grid' ? 4 : 12} 
                    key={index}
                  >
                    <Card 
                      elevation={3}
                      sx={{
                        height: '100%',
                        display: 'flex',
                        flexDirection: 'column',
                        transition: 'all 0.3s ease',
                        '&:hover': {
                          transform: 'translateY(-4px)',
                          boxShadow: 6,
                        },
                        borderRadius: 2,
                        overflow: 'hidden',
                        borderTop: '4px solid',
                        borderTopColor: 'primary.main'
                      }}
                    >
                      <CardContent sx={{ flexGrow: 1, p: 3 }}>
                        <Box display="flex" justifyContent="space-between" alignItems="flex-start" mb={2}>
                          <Box flex={1}>
                            <Typography variant="h6" component="h2" fontWeight="bold" gutterBottom>
                              {college.name}
                            </Typography>
                            {college.rating && generateStars(college.rating)}
                          </Box>
                          <Box display="flex" gap={1}>
                            <Tooltip title={favorites.includes(college.name) ? "Remove from favorites" : "Add to favorites"}>
                              <IconButton 
                                onClick={() => toggleFavorite(college.name)}
                                color={favorites.includes(college.name) ? "error" : "default"}
                                size="small"
                              >
                                {favorites.includes(college.name) ? <Star /> : <StarBorder />}
                              </IconButton>
                            </Tooltip>
                            <Tooltip title="Add to comparison">
                              <IconButton 
                                onClick={() => toggleCompare(college)}
                                color={compareList.find(item => item.name === college.name) ? "primary" : "default"}
                                size="small"
                              >
                                <Compare />
                              </IconButton>
                            </Tooltip>
                          </Box>
                        </Box>
                        
                        <Box display="flex" flexDirection="column" gap={1.5}>
                          <Box display="flex" alignItems="center" gap={1}>
                            <CalendarToday color="action" fontSize="small" />
                            <Typography variant="body2" color="text.secondary">
                              Founded: <strong>{college.year_founded}</strong>
                            </Typography>
                          </Box>
                          
                          <Box display="flex" alignItems="center" gap={1}>
                            <LocationOn color="action" fontSize="small" />
                            <Typography variant="body2" color="text.secondary">
                              <strong>{college.city}, {college.state}</strong>
                            </Typography>
                          </Box>
                          
                          {college.type && (
                            <Box display="flex" alignItems="center" gap={1}>
                              <School color="action" fontSize="small" />
                              <Typography variant="body2" color="text.secondary">
                                Type: <strong>{college.type.charAt(0).toUpperCase() + college.type.slice(1)}</strong>
                              </Typography>
                            </Box>
                          )}

                          {college.enrollment && (
                            <Typography variant="body2" color="text.secondary">
                              Enrollment: <strong>{college.enrollment.toLocaleString()}</strong>
                            </Typography>
                          )}

                          {college.tuition && (
                            <Typography variant="body2" color="text.secondary">
                              Tuition: <strong>${college.tuition.toLocaleString()}</strong>
                            </Typography>
                          )}
                          
                          <Box mt={2}>
                            <Typography variant="body2" color="text.secondary" gutterBottom>
                              <strong>Facilities:</strong>
                            </Typography>
                            <Box display="flex" flexWrap="wrap" gap={0.5}>
                              {college.facilities.split(',').slice(0, 4).map((facility, idx) => (
                                <Chip
                                  key={idx}
                                  label={facility.trim()}
                                  size="small"
                                  variant="outlined"
                                  sx={{ fontSize: '0.75rem' }}
                                />
                              ))}
                              {college.facilities.split(',').length > 4 && (
                                <Chip
                                  label={`+${college.facilities.split(',').length - 4} more`}
                                  size="small"
                                  variant="outlined"
                                  sx={{ fontSize: '0.75rem' }}
                                />
                              )}
                            </Box>
                          </Box>
                        </Box>
                      </CardContent>
                    </Card>
                  </Grid>
                ))}
              </Grid>

              {/* Pagination */}
              {totalPages > 1 && (
                <Box display="flex" justifyContent="center" mt={4}>
                  <Pagination
                    count={totalPages}
                    page={currentPage}
                    onChange={(e, page) => setCurrentPage(page)}
                    color="primary"
                    size="large"
                  />
                </Box>
              )}
            </Paper>
          </Fade>
        )}

        {/* No Results */}
        {!loading && colleges.length === 0 && Object.values(searchParams).some(v => v) && connectionStatus === 'connected' && (
          <Paper elevation={1} sx={{ p: 6, textAlign: 'center', borderRadius: 3 }}>
            <Search sx={{ fontSize: 64, color: 'text.secondary', mb: 2 }} />
            <Typography variant="h5" gutterBottom>
              No colleges found
            </Typography>
            <Typography variant="body1" color="text.secondary" gutterBottom>
              Try adjusting your search criteria or check the spelling
            </Typography>
            <Button 
              variant="outlined" 
              onClick={clearSearch}
              sx={{ mt: 2 }}
              startIcon={<Clear />}
            >
              Reset Search
            </Button>
          </Paper>
        )}

        {/* Welcome Message */}
        {!loading && colleges.length === 0 && !Object.values(searchParams).some(v => v) && connectionStatus === 'connected' && (
          <Paper elevation={1} sx={{ p: 6, textAlign: 'center', borderRadius: 3 }}>
            <School sx={{ fontSize: 64, color: 'primary.main', mb: 2 }} />
            <Typography variant="h5" gutterBottom>
              Welcome to College Search Pro
            </Typography>
            <Typography variant="body1" color="text.secondary" gutterBottom>
              Start searching by entering a college name, city, state, year, or facility above
            </Typography>
            <Typography variant="body2" color="text.secondary">
              Backend is connected and ready to search!
            </Typography>
          </Paper>
        )}

        {/* Connection Error Message */}
        {connectionStatus === 'disconnected' && (
          <Paper elevation={1} sx={{ p: 6, textAlign: 'center', borderRadius: 3, bgcolor: 'error.light', color: 'white' }}>
            <Typography variant="h5" gutterBottom>
              ❌ Backend Connection Failed
            </Typography>
            <Typography variant="body1" gutterBottom>
              Cannot connect to the Flask backend server
            </Typography>
            <Typography variant="body2" gutterBottom>
              Make sure your backend is running on {API_BASE_URL}
            </Typography>
            <Box mt={2}>
              <Button 
                variant="outlined" 
                onClick={testConnection}
                sx={{ mr: 2, color: 'inherit', borderColor: 'inherit' }}
              >
                Test Connection
              </Button>
              <Button 
                variant="outlined" 
                onClick={checkBackendConnection}
                sx={{ color: 'inherit', borderColor: 'inherit' }}
              >
                Retry
              </Button>
            </Box>
          </Paper>
        )}

        {/* Comparison Modal */}
        <Dialog 
          open={showComparison} 
          onClose={() => setShowComparison(false)}
          maxWidth="lg"
          fullWidth
        >
          <DialogTitle>
            <Box display="flex" justifyContent="space-between" alignItems="center">
              <Box display="flex" alignItems="center" gap={1}>
                <Compare />
                College Comparison
              </Box>
              <IconButton onClick={() => setShowComparison(false)}>
                <Close />
              </IconButton>
            </Box>
          </DialogTitle>
          <DialogContent>
            <TableContainer component={Paper} variant="outlined">
              <Table>
                <TableHead>
                  <TableRow>
                    <TableCell><strong>Criteria</strong></TableCell>
                    {compareList.map((college) => (
                      <TableCell key={college.name} align="center">
                        <strong>{college.name}</strong>
                      </TableCell>
                    ))}
                  </TableRow>
                </TableHead>
                <TableBody>
                  <TableRow>
                    <TableCell>Founded</TableCell>
                    {compareList.map((college) => (
                      <TableCell key={college.name} align="center">
                        {college.year_founded}
                      </TableCell>
                    ))}
                  </TableRow>
                  <TableRow>
                    <TableCell>Location</TableCell>
                    {compareList.map((college) => (
                      <TableCell key={college.name} align="center">
                        {college.city}, {college.state}
                      </TableCell>
                    ))}
                  </TableRow>
                  <TableRow>
                    <TableCell>Type</TableCell>
                    {compareList.map((college) => (
                      <TableCell key={college.name} align="center">
                        {college.type ? college.type.charAt(0).toUpperCase() + college.type.slice(1) : 'N/A'}
                      </TableCell>
                    ))}
                  </TableRow>
                  <TableRow>
                    <TableCell>Rating</TableCell>
                    {compareList.map((college) => (
                      <TableCell key={college.name} align="center">
                        {college.rating ? `${college.rating}/5` : 'N/A'}
                      </TableCell>
                    ))}
                  </TableRow>
                  <TableRow>
                    <TableCell>Enrollment</TableCell>
                    {compareList.map((college) => (
                      <TableCell key={college.name} align="center">
                        {college.enrollment ? college.enrollment.toLocaleString() : 'N/A'}
                      </TableCell>
                    ))}
                  </TableRow>
                  <TableRow>
                    <TableCell>Tuition</TableCell>
                    {compareList.map((college) => (
                      <TableCell key={college.name} align="center">
                        {college.tuition ? `${college.tuition.toLocaleString()}` : 'N/A'}
                      </TableCell>
                    ))}
                  </TableRow>
                  <TableRow>
                    <TableCell>Acceptance Rate</TableCell>
                    {compareList.map((college) => (
                      <TableCell key={college.name} align="center">
                        {college.acceptance_rate ? `${college.acceptance_rate}%` : 'N/A'}
                      </TableCell>
                    ))}
                  </TableRow>
                </TableBody>
              </Table>
            </TableContainer>
          </DialogContent>
          <DialogActions>
            <Button onClick={() => setShowComparison(false)}>Close</Button>
          </DialogActions>
        </Dialog>

        {/* Error Snackbar */}
        <Snackbar 
          open={!!error} 
          autoHideDuration={8000} 
          onClose={() => setError(null)}
          anchorOrigin={{ vertical: 'bottom', horizontal: 'center' }}
        >
          <Alert 
            onClose={() => setError(null)} 
            severity="error" 
            sx={{ width: '100%' }}
            action={
              connectionStatus === 'disconnected' && (
                <Button color="inherit" size="small" onClick={testConnection}>
                  RETRY
                </Button>
              )
            }
          >
            {error}
          </Alert>
        </Snackbar>
      </Container>
    </Box>
  );
}

export default App;
