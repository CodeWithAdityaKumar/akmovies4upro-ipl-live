"use client";

import { useState, useEffect } from "react";
import Navbar from "../components/Navbar";
import Footer from "../components/Footer";
import Link from "next/link";

const TeamsPage = () => {
  const [teams, setTeams] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);

  // Team color mappings
  const teamColors = {
    CSK: { primary: "yellow-500", secondary: "blue-800" },
    MI: { primary: "blue-600", secondary: "blue-900" },
    RCB: { primary: "red-600", secondary: "black" },
    KKR: { primary: "purple-700", secondary: "yellow-400" },
    DC: { primary: "blue-500", secondary: "red-500" },
    RR: { primary: "pink-500", secondary: "blue-400" },
    SRH: { primary: "orange-500", secondary: "black" },
    PBKS: { primary: "red-600", secondary: "yellow-400" },
    GT: { primary: "blue-800", secondary: "teal-400" },
    LSG: { primary: "teal-500", secondary: "purple-600" }
  };

  // Additional team information (could be stored in a database in production)
  const teamDetails = {
    CSK: {
      homeGround: "M.A. Chidambaram Stadium, Chennai",
      coach: "Stephen Fleming",
      captain: "MS Dhoni",
      titles: "5 (2010, 2011, 2018, 2021, 2023)"
    },
    MI: {
      homeGround: "Wankhede Stadium, Mumbai",
      coach: "Mahela Jayawardene",
      captain: "Rohit Sharma",
      titles: "5 (2013, 2015, 2017, 2019, 2020)"
    },
    RCB: {
      homeGround: "M. Chinnaswamy Stadium, Bengaluru",
      coach: "Sanjay Bangar",
      captain: "Faf du Plessis",
      titles: "0"
    },
    KKR: {
      homeGround: "Eden Gardens, Kolkata",
      coach: "Brendon McCullum",
      captain: "Shreyas Iyer",
      titles: "2 (2012, 2014)"
    },
    DC: {
      homeGround: "Arun Jaitley Stadium, Delhi",
      coach: "Ricky Ponting",
      captain: "Rishabh Pant",
      titles: "0"
    },
    RR: {
      homeGround: "Sawai Mansingh Stadium, Jaipur",
      coach: "Kumar Sangakkara",
      captain: "Sanju Samson",
      titles: "1 (2008)"
    },
    SRH: {
      homeGround: "Rajiv Gandhi International Cricket Stadium, Hyderabad",
      coach: "Brian Lara",
      captain: "Aiden Markram",
      titles: "1 (2016)"
    },
    PBKS: {
      homeGround: "PCA Stadium, Mohali",
      coach: "Anil Kumble",
      captain: "Shikhar Dhawan",
      titles: "0"
    },
    GT: {
      homeGround: "Narendra Modi Stadium, Ahmedabad",
      coach: "Ashish Nehra",
      captain: "Hardik Pandya",
      titles: "1 (2022)"
    },
    LSG: {
      homeGround: "BRSABV Ekana Cricket Stadium, Lucknow",
      coach: "Andy Flower",
      captain: "KL Rahul",
      titles: "0"
    }
  };

  // Sample teams data for fallback when API fails
  const sampleTeams = [
    { id: 1, name: 'Chennai Super Kings', short_name: 'CSK', logo_url: 'https://bcciplayerimages.s3.ap-south-1.amazonaws.com/ipl/CSK/logos/Roundbig/CSKroundbig.png' },
    { id: 2, name: 'Mumbai Indians', short_name: 'MI', logo_url: 'https://bcciplayerimages.s3.ap-south-1.amazonaws.com/ipl/MI/logos/Roundbig/MIroundbig.png' },
    { id: 3, name: 'Royal Challengers Bangalore', short_name: 'RCB', logo_url: 'https://bcciplayerimages.s3.ap-south-1.amazonaws.com/ipl/RCB/logos/Roundbig/RCBroundbig.png' },
    { id: 4, name: 'Kolkata Knight Riders', short_name: 'KKR', logo_url: 'https://bcciplayerimages.s3.ap-south-1.amazonaws.com/ipl/KKR/logos/Roundbig/KKRroundbig.png' },
    { id: 5, name: 'Delhi Capitals', short_name: 'DC', logo_url: 'https://bcciplayerimages.s3.ap-south-1.amazonaws.com/ipl/DC/logos/Roundbig/DCroundbig.png' },
    { id: 6, name: 'Punjab Kings', short_name: 'PBKS', logo_url: 'https://bcciplayerimages.s3.ap-south-1.amazonaws.com/ipl/PBKS/logos/Roundbig/PBKSroundbig.png' },
    { id: 7, name: 'Rajasthan Royals', short_name: 'RR', logo_url: 'https://bcciplayerimages.s3.ap-south-1.amazonaws.com/ipl/RR/logos/Roundbig/RRroundbig.png' },
    { id: 8, name: 'Sunrisers Hyderabad', short_name: 'SRH', logo_url: 'https://bcciplayerimages.s3.ap-south-1.amazonaws.com/ipl/SRH/logos/Roundbig/SRHroundbig.png' },
    { id: 9, name: 'Gujarat Titans', short_name: 'GT', logo_url: 'https://bcciplayerimages.s3.ap-south-1.amazonaws.com/ipl/GT/logos/Roundbig/GTroundbig.png' },
    { id: 10, name: 'Lucknow Super Giants', short_name: 'LSG', logo_url: 'https://bcciplayerimages.s3.ap-south-1.amazonaws.com/ipl/LSG/logos/Roundbig/LSGroundbig.png' }
  ];

  // Fetch teams data from API with fallback to sample data
  useEffect(() => {
    const fetchTeams = async () => {
      try {
        setIsLoading(true);
        const response = await fetch('/api/teams');
        
        // Add more detailed error handling
        if (!response.ok) {
          const errorData = await response.json().catch(() => ({}));
          console.error('API response error:', response.status, errorData);
          throw new Error(`Failed to fetch teams: ${response.status} ${errorData.error || ''}`);
        }
        
        const data = await response.json();
        console.log('Teams fetched successfully:', data.length, 'teams');
        setTeams(data);
        setIsLoading(false);
      } catch (error) {
        console.error('Error fetching teams:', error);
        // Use sample data as fallback
        console.log('Using sample teams data as fallback');
        setTeams(sampleTeams);
        setIsLoading(false);
        // Still show the error message but don't prevent rendering
        setError(`Note: Using sample data. API error: ${error.message}`);
      }
    };

    fetchTeams();
  }, []);

  // Get team colors based on short_name
  const getTeamColors = (shortName) => {
    const normalized = shortName?.toUpperCase();
    return teamColors[normalized] || { primary: "gray-500", secondary: "gray-700" };
  };
  
  // Get team details based on short_name
  const getTeamDetails = (shortName) => {
    const normalized = shortName?.toUpperCase();
    return teamDetails[normalized] || {};
  };

  return (
    <main className="min-h-screen bg-gray-50 dark:bg-gray-900">
      <Navbar />

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="text-center mb-12">
          <h1 className="text-4xl font-bold text-gray-900 dark:text-white">IPL 2025 Teams</h1>
          <p className="mt-4 text-lg text-gray-600 dark:text-gray-400">
            All the information about the 10 teams competing in this season
          </p>
        </div>
        
        {/* Loading State */}
        {isLoading && (
          <div className="flex justify-center items-center py-16">
            <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-500"></div>
          </div>
        )}
        
        {/* Error State */}
        {error && (
          <div className="bg-red-100 border-l-4 border-red-500 text-red-700 p-4 mb-8" role="alert">
            <p>{error}</p>
          </div>
        )}
        
        {/* Teams Grid */}
        {!isLoading && !error && (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-8">
            {teams.map((team) => {
              const teamColor = getTeamColors(team.short_name);
              const details = getTeamDetails(team.short_name);
              
              return (
                <div 
                  key={team.id} 
                  className="bg-white dark:bg-gray-800 rounded-xl shadow-md overflow-hidden hover:shadow-lg transition-shadow duration-300"
                >
                  <div className={`h-3 bg-${teamColor.primary}`}></div>
                  <div className="p-6">
                    <div className="flex items-center justify-between mb-4">
                      {team.logo_url ? (
                        <img 
                          src={team.logo_url} 
                          alt={team.name} 
                          className="w-16 h-16 rounded-full object-cover"
                        />
                      ) : (
                        <div className={`h-16 w-16 bg-${teamColor.primary} rounded-full flex items-center justify-center border-4 border-${teamColor.secondary}`}>
                          <span className="font-bold text-white text-xl">{team.short_name}</span>
                        </div>
                      )}
                      <h3 className="text-lg font-bold text-gray-900 dark:text-white">
                        {team.name}
                      </h3>
                    </div>
                    
                    <div className="space-y-2 mb-4">
                      <div className="flex justify-between">
                        <span className="text-sm font-medium text-gray-600 dark:text-gray-400">Short Name:</span>
                        <span className="text-sm text-gray-900 dark:text-white">{team.short_name}</span>
                      </div>
                      {details.homeGround && (
                        <div className="flex justify-between">
                          <span className="text-sm font-medium text-gray-600 dark:text-gray-400">Home Ground:</span>
                          <span className="text-sm text-gray-900 dark:text-white text-right">{details.homeGround.split(',')[0]}</span>
                        </div>
                      )}
                      {details.captain && (
                        <div className="flex justify-between">
                          <span className="text-sm font-medium text-gray-600 dark:text-gray-400">Captain:</span>
                          <span className="text-sm text-gray-900 dark:text-white">{details.captain}</span>
                        </div>
                      )}
                      {details.titles && (
                        <div className="flex justify-between">
                          <span className="text-sm font-medium text-gray-600 dark:text-gray-400">Titles:</span>
                          <span className="text-sm text-gray-900 dark:text-white">{details.titles}</span>
                        </div>
                      )}
                    </div>
                
                    <Link 
                      href={`/team/${team.id}`} 
                      className={`inline-block w-full px-4 py-2 bg-${teamColor.primary} hover:bg-${teamColor.secondary} text-white font-medium rounded-md text-center`}
                    >
                      Team Details
                    </Link>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
      
      <Footer />
    </main>
  );
};

export default TeamsPage;
