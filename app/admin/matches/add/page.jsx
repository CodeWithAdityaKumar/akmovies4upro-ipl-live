"use client";

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
// Using fetch API to interact with our PostgreSQL database through API routes

export default function AddMatchPage() {
  const router = useRouter();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [teams, setTeams] = useState([]);
  const [formData, setFormData] = useState({
    team1_id: '',
    team2_id: '',
    venue: '',
    match_date: '',
    match_time: '19:30', // Default time for IPL matches
    status: 'scheduled',
    status_text: 'Scheduled'
  });
  const [formErrors, setFormErrors] = useState({});
  const [isLoading, setIsLoading] = useState(true);

  // Fetch teams data
  useEffect(() => {
    async function fetchTeams() {
      try {
        setIsLoading(true);
        // Fetch teams from our API endpoint
        const response = await fetch('/api/teams');
        if (!response.ok) throw new Error('Failed to fetch teams');
        
        const data = await response.json();

        // If no teams are found in the database, use mock data
        if (!data || data.length === 0) {
          setTeams([
            { id: '1', name: 'Mumbai Indians', short_name: 'MI' },
            { id: '2', name: 'Chennai Super Kings', short_name: 'CSK' },
            { id: '3', name: 'Royal Challengers Bangalore', short_name: 'RCB' },
            { id: '4', name: 'Kolkata Knight Riders', short_name: 'KKR' },
            { id: '5', name: 'Delhi Capitals', short_name: 'DC' },
            { id: '6', name: 'Punjab Kings', short_name: 'PBKS' },
            { id: '7', name: 'Rajasthan Royals', short_name: 'RR' },
            { id: '8', name: 'Sunrisers Hyderabad', short_name: 'SRH' },
            { id: '9', name: 'Gujarat Titans', short_name: 'GT' },
            { id: '10', name: 'Lucknow Super Giants', short_name: 'LSG' }
          ]);
        } else {
          setTeams(data);
        }
      } catch (error) {
        console.error('Error fetching teams:', error);
        // Fallback to mock data
        setTeams([
          { id: '1', name: 'Mumbai Indians', short_name: 'MI' },
          { id: '2', name: 'Chennai Super Kings', short_name: 'CSK' },
          { id: '3', name: 'Royal Challengers Bangalore', short_name: 'RCB' },
          { id: '4', name: 'Kolkata Knight Riders', short_name: 'KKR' },
          { id: '5', name: 'Delhi Capitals', short_name: 'DC' },
          { id: '6', name: 'Punjab Kings', short_name: 'PBKS' },
          { id: '7', name: 'Rajasthan Royals', short_name: 'RR' },
          { id: '8', name: 'Sunrisers Hyderabad', short_name: 'SRH' },
          { id: '9', name: 'Gujarat Titans', short_name: 'GT' },
          { id: '10', name: 'Lucknow Super Giants', short_name: 'LSG' }
        ]);
      } finally {
        setIsLoading(false);
      }
    }

    fetchTeams();
  }, []);

  // Handle form input changes
  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData({ ...formData, [name]: value });
    
    // Clear error for this field if it exists
    if (formErrors[name]) {
      setFormErrors({ ...formErrors, [name]: '' });
    }
  };

  // Validate form
  const validateForm = () => {
    const errors = {};
    
    if (!formData.team1_id) errors.team1_id = 'Team 1 is required';
    if (!formData.team2_id) errors.team2_id = 'Team 2 is required';
    if (formData.team1_id === formData.team2_id) errors.team2_id = 'Teams must be different';
    if (!formData.venue) errors.venue = 'Venue is required';
    if (!formData.match_date) errors.match_date = 'Match date is required';
    if (!formData.match_time) errors.match_time = 'Match time is required';

    setFormErrors(errors);
    return Object.keys(errors).length === 0;
  };

  // Handle form submission
  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!validateForm()) return;
    
    try {
      setIsSubmitting(true);
      
      // Combine date and time for database
      const matchDateTime = new Date(`${formData.match_date}T${formData.match_time}:00`);
      
      // Get team objects from the selected IDs
      const team1 = teams.find(t => t.id === formData.team1_id);
      const team2 = teams.find(t => t.id === formData.team2_id);
      
      try {
        // Insert match using our API endpoint
        const response = await fetch('/api/matches', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json'
          },
          body: JSON.stringify({
            team1_id: formData.team1_id,
            team2_id: formData.team2_id,
            venue: formData.venue,
            match_date: matchDateTime.toISOString(),
            status: formData.status,
            team1_score: '',
            team2_score: ''
          })
        });

        if (!response.ok) {
          const errorData = await response.json();
          throw new Error(errorData.error || 'Failed to create match');
        }
        
        const data = await response.json();
        
        // Success, redirect to matches page
        alert('Match created successfully!');
        router.push('/admin/matches');
      } catch (dbError) {
        console.error('Database error:', dbError);
        
        // As a fallback for development/demo, let's create a mock entry
        // In real app, you would want to show an error message
        
        // Create a unique ID
        const mockId = Date.now().toString();
        
        // Add to local storage as a mock database
        const existingMatches = JSON.parse(localStorage.getItem('mockMatches') || '[]');
        existingMatches.push({
          id: mockId,
          team1: {
            name: team1.name,
            short: team1.short_name,
            score: '',
            overs: ''
          },
          team2: {
            name: team2.name,
            short: team2.short_name,
            score: '',
            overs: ''
          },
          date: matchDateTime.toISOString(),
          venue: formData.venue,
          status: formData.status,
          streamUrl: '',
          viewers: 0
        });
        
        localStorage.setItem('mockMatches', JSON.stringify(existingMatches));
        
        // Show success message for the mock implementation
        alert('Mock match created successfully! (Database connection failed, using local storage instead)');
        router.push('/admin/matches');
      }
    } catch (error) {
      console.error('Error creating match:', error);
      alert('Failed to create match. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  };

  if (isLoading) {
    return (
      <div className="p-6 rounded-lg bg-gray-800">
        <div className="text-center py-12">
          <div className="animate-spin h-10 w-10 border-4 border-blue-500 border-t-transparent rounded-full mx-auto mb-4"></div>
          <p className="text-gray-300">Loading...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h1 className="text-2xl font-bold">Add New Match</h1>
        <Link 
          href="/admin/matches"
          className="px-4 py-2 bg-gray-700 hover:bg-gray-600 rounded-lg text-sm transition-colors"
        >
          Back to Matches
        </Link>
      </div>

      <form onSubmit={handleSubmit} className="p-6 rounded-lg bg-gray-800 shadow-lg space-y-6">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* Team 1 Selection */}
          <div>
            <label className="block text-sm font-medium text-gray-300 mb-1">
              Team 1
            </label>
            <select
              name="team1_id"
              value={formData.team1_id}
              onChange={handleChange}
              className={`w-full p-2 rounded-lg bg-gray-700 border ${formErrors.team1_id ? 'border-red-500' : 'border-gray-600'}`}
            >
              <option value="">Select Team 1</option>
              {teams.map(team => (
                <option key={`team1-${team.id}`} value={team.id}>
                  {team.name} ({team.short_name})
                </option>
              ))}
            </select>
            {formErrors.team1_id && (
              <p className="mt-1 text-sm text-red-500">{formErrors.team1_id}</p>
            )}
          </div>

          {/* Team 2 Selection */}
          <div>
            <label className="block text-sm font-medium text-gray-300 mb-1">
              Team 2
            </label>
            <select
              name="team2_id"
              value={formData.team2_id}
              onChange={handleChange}
              className={`w-full p-2 rounded-lg bg-gray-700 border ${formErrors.team2_id ? 'border-red-500' : 'border-gray-600'}`}
            >
              <option value="">Select Team 2</option>
              {teams.map(team => (
                <option key={`team2-${team.id}`} value={team.id}>
                  {team.name} ({team.short_name})
                </option>
              ))}
            </select>
            {formErrors.team2_id && (
              <p className="mt-1 text-sm text-red-500">{formErrors.team2_id}</p>
            )}
          </div>

          {/* Venue */}
          <div>
            <label className="block text-sm font-medium text-gray-300 mb-1">
              Venue
            </label>
            <input
              type="text"
              name="venue"
              value={formData.venue}
              onChange={handleChange}
              placeholder="e.g. Wankhede Stadium, Mumbai"
              className={`w-full p-2 rounded-lg bg-gray-700 border ${formErrors.venue ? 'border-red-500' : 'border-gray-600'}`}
            />
            {formErrors.venue && (
              <p className="mt-1 text-sm text-red-500">{formErrors.venue}</p>
            )}
          </div>

          {/* Match Status */}
          <div>
            <label className="block text-sm font-medium text-gray-300 mb-1">
              Status
            </label>
            <select
              name="status"
              value={formData.status}
              onChange={(e) => {
                const status = e.target.value;
                let statusText = 'Scheduled';
                
                if (status === 'live') statusText = 'LIVE';
                else if (status === 'completed') statusText = 'Completed';
                
                setFormData({
                  ...formData,
                  status,
                  status_text: statusText
                });
              }}
              className="w-full p-2 rounded-lg bg-gray-700 border border-gray-600"
            >
              <option value="scheduled">Scheduled</option>
              <option value="live">Live</option>
              <option value="completed">Completed</option>
            </select>
          </div>

          {/* Match Date */}
          <div>
            <label className="block text-sm font-medium text-gray-300 mb-1">
              Match Date
            </label>
            <input
              type="date"
              name="match_date"
              value={formData.match_date}
              onChange={handleChange}
              min={new Date().toISOString().split('T')[0]} // Prevent past dates
              className={`w-full p-2 rounded-lg bg-gray-700 border ${formErrors.match_date ? 'border-red-500' : 'border-gray-600'}`}
            />
            {formErrors.match_date && (
              <p className="mt-1 text-sm text-red-500">{formErrors.match_date}</p>
            )}
          </div>

          {/* Match Time */}
          <div>
            <label className="block text-sm font-medium text-gray-300 mb-1">
              Match Time
            </label>
            <input
              type="time"
              name="match_time"
              value={formData.match_time}
              onChange={handleChange}
              className={`w-full p-2 rounded-lg bg-gray-700 border ${formErrors.match_time ? 'border-red-500' : 'border-gray-600'}`}
            />
            {formErrors.match_time && (
              <p className="mt-1 text-sm text-red-500">{formErrors.match_time}</p>
            )}
          </div>
        </div>

        {/* Preview Section */}
        {formData.team1_id && formData.team2_id && (
          <div className="mt-6 p-4 bg-gray-700 rounded-lg">
            <h3 className="text-sm font-medium text-gray-300 mb-2">Match Preview</h3>
            <div className="flex items-center justify-center space-x-4">
              <div className="text-center">
                <div className="h-12 w-12 bg-blue-800 rounded-full flex items-center justify-center mx-auto">
                  <span className="font-bold">
                    {teams.find(t => t.id === formData.team1_id)?.short_name || 'TBD'}
                  </span>
                </div>
                <p className="mt-1 text-sm">
                  {teams.find(t => t.id === formData.team1_id)?.name || 'Team 1'}
                </p>
              </div>
              
              <div className="text-lg font-bold">vs</div>
              
              <div className="text-center">
                <div className="h-12 w-12 bg-blue-800 rounded-full flex items-center justify-center mx-auto">
                  <span className="font-bold">
                    {teams.find(t => t.id === formData.team2_id)?.short_name || 'TBD'}
                  </span>
                </div>
                <p className="mt-1 text-sm">
                  {teams.find(t => t.id === formData.team2_id)?.name || 'Team 2'}
                </p>
              </div>
            </div>
            <div className="mt-3 text-center text-sm text-gray-400">
              {formData.match_date && formData.match_time && (
                <p>
                  {new Date(`${formData.match_date}T${formData.match_time}`).toLocaleDateString(undefined, {
                    weekday: 'long',
                    year: 'numeric',
                    month: 'long',
                    day: 'numeric'
                  })} 
                  {' • '}
                  {new Date(`${formData.match_date}T${formData.match_time}`).toLocaleTimeString(undefined, {
                    hour: '2-digit',
                    minute: '2-digit'
                  })}
                </p>
              )}
              {formData.venue && <p className="mt-1">{formData.venue}</p>}
            </div>
          </div>
        )}

        {/* Submit Button */}
        <div className="flex justify-end mt-6">
          <button
            type="submit"
            disabled={isSubmitting}
            className={`px-6 py-2 rounded-lg font-medium ${
              isSubmitting 
                ? 'bg-gray-600 cursor-not-allowed' 
                : 'bg-blue-600 hover:bg-blue-700'
            }`}
          >
            {isSubmitting ? (
              <span className="flex items-center">
                <svg className="animate-spin -ml-1 mr-2 h-4 w-4 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                </svg>
                Creating Match...
              </span>
            ) : 'Create Match'}
          </button>
        </div>
      </form>
    </div>
  );
}
