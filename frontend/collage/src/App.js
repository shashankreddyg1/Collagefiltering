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

const API_BASE_URL = 'http://localhost:5000';

function App() {
  // State management
  const [colleges, setColleges] = useState([]);
  const [filteredColleges, setFilteredColleges] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
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

  // Enhanced mock data with more realistic college information
  const mockColleges = [
    {
      name: "Massachusetts Institute of Technology",
      year_founded: 1861,
      city: "Cambridge",
      state: "Massachusetts",
      facilities: "Research Labs, Library, Sports Complex, Innovation Hub, Medical Center, AI Lab",
      type: "private",
      rating: 4.8,
      enrollment: 11000,
      tuition: 53790,
      acceptance_rate: 7.3,
      description: "Leading technology institute known for innovation and research excellence."
    },
    {
      name: "Stanford University",
      year_founded: 1885,
      city: "Stanford",
      state: "California",
      facilities: "Innovation Hub, Medical Center, Athletics, Research Labs, Library, Startup Incubator",
      type: "private",
      rating: 4.7,
      enrollment: 17000,
      tuition: 56169,
      acceptance_rate: 4.3,
      description: "Premier research university in Silicon Valley with strong entrepreneurial culture."
    },
    {
      name: "Harvard University",
      year_founded: 1636,
      city: "Cambridge",
      state: "Massachusetts",
      facilities: "Historical Library, Museums, Research Centers, Medical School, Law School",
      type: "private",
      rating: 4.6,
      enrollment: 23000,
      tuition: 54002,
      acceptance_rate: 3.4,
      description: "Oldest institution of higher education in the United States."
    },
    {
      name: "University of California, Berkeley",
      year_founded: 1868,
      city: "Berkeley",
      state: "California",
      facilities: "Research Labs, Library, Sports Complex, Engineering School, Business School",
      type: "public",
      rating: 4.4,
      enrollment: 45000,
      tuition: 14254,
      acceptance_rate: 17.5,
      description: "Top public research university known for academic excellence and activism."
    },
    {
      name: "University of Chicago",
      year_founded: 1890,
      city: "Chicago",
      state: "Illinois",
      facilities: "Library, Research Centers, Medical Center, Arts Complex, Business School",
      type: "private",
      rating: 4.4,
      enrollment: 17000,
      tuition: 59298,
      acceptance_rate: 7.4,
      description: "Research university known for rigorous academics and intellectual discourse."
    }
  ];

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

  const debouncedSearchParams = useDebounce(searchParams, 300);

  // API call function
  const fetchColleges = useCallback(async (params) => {
    try {
      setLoading(true);
      setError(null);

      // Check if any search parameter is provided
      const hasSearchTerm = Object.values(params).some(value => value && value.trim());
      
      if (!hasSearchTerm) {
        setColleges([]);
        setFilteredColleges([]);
        return;
      }

      // Try API first, fallback to mock data
      try {
        const queryParams = new URLSearchParams();
        Object.entries(params).forEach(([key, value]) => {
          if (value && value.trim()) {
            queryParams.append(key, value.trim());
          }
        });

        const response = await fetch(`${API_BASE_URL}/search?${queryParams}`);
        
        if (response.ok) {
          const data = await response.json();
          setColleges(data);
          setFilteredColleges(data);
        } else {
          throw new Error('API not available');
        }
      } catch (apiError) {
        console.warn('API not available, using mock data');
        // Filter mock data
        const filtered = filterMockData(params);
        setColleges(filtered);
        setFilteredColleges(filtered);
      }
    } catch (error) {
      setError('Error fetching college data: ' + error.message);
    } finally {
      setLoading(false);
    }
  }, []);

  // Filter mock data function
  const filterMockData = (params) => {
    return mockColleges.filter(college => {
      return Object.entries(params).every(([key, value]) => {
        if (!value || !value.trim()) return true;

        const searchValue = value.toLowerCase().trim();
        switch (key) {
          case 'name':
            return college.name.toLowerCase().includes(searchValue);
          case 'city':
            return college.city.toLowerCase().includes(searchValue);
          case 'year':
            return college.year_founded.toString().includes(searchValue);
          case 'state':
            return college.state.toLowerCase().includes(searchValue);
          case 'facility':
            return college.facilities.toLowerCase().includes(searchValue);
          case 'collegeType':
            return college.type === searchValue;
          case 'minYear':
            return college.year_founded >= parseInt(searchValue);
          case 'maxYear':
            return college.year_founded <= parseInt(searchValue);
          case 'minRating':
            return college.rating >= parseFloat(searchValue);
          default:
            return true;
        }
      });
    });
  };

  // Effect for search
  useEffect(() => {
    fetchColleges(debouncedSearchParams);
  }, [debouncedSearchParams, fetchColleges]);

  // Sort colleges
  useEffect(() => {
    const sorted = [...filteredColleges].sort((a, b) => {
      switch (sortBy) {
        case 'name':
          return a.name.localeCompare(b.name);
        case 'year':
          return b.year_founded - a.year_founded;
        case 'city':
          return a.city.localeCompare(b.city);
        case 'state':
          return a.state.localeCompare(b.state);
        case 'rating':
          return (b.rating || 0) - (a.rating || 0);
        default:
          return 0;
      }
    });
    setFilteredColleges(sorted);
  }, [sortBy, colleges]);

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
  };

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
    if (filteredColleges.length === 0) {
      setError('No colleges to export');
      return;
    }

    const headers = ['Name', 'Year Founded', 'City', 'State', 'Type', 'Rating', 'Enrollment', 'Tuition', 'Acceptance Rate'];
    const csvContent = [
      headers.join(','),
      ...filteredColleges.map(college => [
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
  const totalPages = Math.ceil(filteredColleges.length / itemsPerPage);
  const startIndex = (currentPage - 1) * itemsPerPage;
  const currentColleges = filteredColleges.slice(startIndex, startIndex + itemsPerPage);

  // Statistics
  const stats = {
    total: filteredColleges.length,
    avgYear: filteredColleges.length > 0 
      ? Math.round(filteredColleges.reduce((sum, college) => sum + college.year_founded, 0) / filteredColleges.length)
      : 0,
    states: new Set(filteredColleges.map(college => college.state)).size,
    avgRating: filteredColleges.filter(c => c.rating).length > 0
      ? (filteredColleges.reduce((sum, college) => sum + (college.rating || 0), 0) / filteredColleges.filter(c => c.rating).length).toFixed(1)
      : 0
  };

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
                Discover your perfect college match with advanced search and comparison tools
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
            <Typography variant="h6" sx={{ mt: 2 }}>Searching colleges...</Typography>
            <Typography variant="body2" color="text.secondary">
              Please wait while we find the best matches
            </Typography>
          </Box>
        )}

        {/* Results Section */}
        {!loading && filteredColleges.length > 0 && (
          <Fade in={true}>
            <Paper elevation={2} sx={{ p: 3, borderRadius: 3 }}>
              {/* Results Header */}
              <Box display="flex" justifyContent="space-between" alignItems="center" mb={3} flexWrap="wrap" gap={2}>
                <Box display="flex" alignItems="center" gap={2}>
                  <Typography variant="h6">
                    Found {filteredColleges.length} colleges
                  </Typography>
                  <Chip 
                    label={`${filteredColleges.length} results`} 
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

              {/* Statistics */}
              <Grid container spacing={2} mb={4}>
                <Grid item xs={6} md={3}>
                  <Paper sx={{ p: 2, textAlign: 'center', bgcolor: 'primary.main', color: 'white' }}>
                    <Typography variant="h4" fontWeight="bold">{stats.total}</Typography>
                    <Typography variant="body2">Total Results</Typography>
                  </Paper>
                </Grid>
                <Grid item xs={6} md={3}>
                  <Paper sx={{ p: 2, textAlign: 'center', bgcolor: 'secondary.main', color: 'white' }}>
                    <Typography variant="h4" fontWeight="bold">{stats.avgYear}</Typography>
                    <Typography variant="body2">Avg Founded</Typography>
                  </Paper>
                </Grid>
                <Grid item xs={6} md={3}>
                  <Paper sx={{ p: 2, textAlign: 'center', bgcolor: 'success.main', color: 'white' }}>
                    <Typography variant="h4" fontWeight="bold">{stats.states}</Typography>
                    <Typography variant="body2">States</Typography>
                  </Paper>
                </Grid>
                <Grid item xs={6} md={3}>
                  <Paper sx={{ p: 2, textAlign: 'center', bgcolor: 'warning.main', color: 'white' }}>
                    <Typography variant="h4" fontWeight="bold">{stats.avgRating}</Typography>
                    <Typography variant="body2">Avg Rating</Typography>
                  </Paper>
                </Grid>
              </Grid>

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
        {!loading && filteredColleges.length === 0 && Object.values(searchParams).some(v => v) && (
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
        {!loading && filteredColleges.length === 0 && !Object.values(searchParams).some(v => v) && (
          <Paper elevation={1} sx={{ p: 6, textAlign: 'center', borderRadius: 3 }}>
            <School sx={{ fontSize: 64, color: 'primary.main', mb: 2 }} />
            <Typography variant="h5" gutterBottom>
              Welcome to College Search Pro
            </Typography>
            <Typography variant="body1" color="text.secondary">
              Start searching by entering a college name, city, state, year, or facility above
            </Typography>
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
          autoHideDuration={6000} 
          onClose={() => setError(null)}
          anchorOrigin={{ vertical: 'bottom', horizontal: 'center' }}
        >
          <Alert 
            onClose={() => setError(null)} 
            severity="error" 
            sx={{ width: '100%' }}
          >
            {error}
          </Alert>
        </Snackbar>
      </Container>
    </Box>
  );
}

export default App;
