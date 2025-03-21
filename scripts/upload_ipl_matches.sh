#!/bin/bash

# Script to upload IPL 2025 schedule to matches database

# Path to JSON file
JSON_FILE="../data/ipl2025_schedule.json"
API_URL="http://localhost:3000/api/matches"

# Check if jq is installed
if ! command -v jq &> /dev/null; then
    echo "Error: jq is required but not installed. Please install it with 'sudo apt-get install jq'"
    exit 1
fi

# Map of team names to their short names
declare -A TEAM_SHORT_NAMES=(
    ["Kolkata Knight Riders"]="KKR"
    ["Royal Challengers Bengaluru"]="RCB"
    ["Sunrisers Hyderabad"]="SRH"
    ["Rajasthan Royals"]="RR"
    ["Chennai Super Kings"]="CSK"
    ["Mumbai Indians"]="MI"
    ["Delhi Capitals"]="DC"
    ["Lucknow Super Giants"]="LSG"
    ["Gujarat Titans"]="GT"
    ["Punjab Kings"]="PBKS"
)

# Function to format date and time
format_date_time() {
    local date=$1
    local time=$2
    # Remove " GMT" from time string
    time=${time/% GMT/}
    echo "${date}T${time}:00Z"
}

# Function to upload a match
upload_match() {
    local match_no=$1
    local team1=$2
    local team2=$3
    local date=$4
    local time=$5
    local venue=$6
    
    # Get short names
    local team1_short="${TEAM_SHORT_NAMES[$team1]}"
    local team2_short="${TEAM_SHORT_NAMES[$team2]}"
    
    # Format date and time
    local match_date=$(format_date_time "$date" "$time")
    
    # Create JSON payload
    local payload=$(cat <<EOF
{
  "team1_short_name": "$team1_short",
  "team2_short_name": "$team2_short",
  "match_date": "$match_date",
  "venue": "$venue",
  "status": "upcoming",
  "thumbnail_url": "/images/matches/match${match_no}.jpg"
}
EOF
)

    echo "Uploading match $match_no: $team1 vs $team2"
    
    # POST to API endpoint
    response=$(curl -s -X POST "$API_URL" \
                 -H "Content-Type: application/json" \
                 -d "$payload")
    
    # Check for error in response
    if echo "$response" | grep -q "error"; then
        echo "Error uploading match $match_no: $(echo "$response" | jq -r '.error')"
        return 1
    else
        echo "Successfully uploaded match $match_no"
        return 0
    fi
}

# Main function to process all matches
upload_all_matches() {
    echo "Starting upload of IPL 2025 schedule..."
    
    # Get matches count
    local matches_count=$(jq '.matches | length' "$JSON_FILE")
    echo "Found $matches_count matches to upload"
    
    local success_count=0
    local failure_count=0
    
    # Process each match
    for i in $(seq 0 $(($matches_count - 1))); do
        match_no=$(jq -r ".matches[$i].match_no" "$JSON_FILE")
        team1=$(jq -r ".matches[$i].team1" "$JSON_FILE")
        team2=$(jq -r ".matches[$i].team2" "$JSON_FILE")
        date=$(jq -r ".matches[$i].date" "$JSON_FILE")
        time=$(jq -r ".matches[$i].time" "$JSON_FILE")
        venue=$(jq -r ".matches[$i].venue" "$JSON_FILE")
        
        upload_match "$match_no" "$team1" "$team2" "$date" "$time" "$venue"
        
        if [ $? -eq 0 ]; then
            ((success_count++))
        else
            ((failure_count++))
        fi
        
        # Add a small delay between requests
        sleep 0.3
    done
    
    echo "============ Upload Summary ============"
    echo "Total matches: $matches_count"
    echo "Successfully uploaded: $success_count"
    echo "Failed to upload: $failure_count"
}

# Ensure we're in the right directory
cd "$(dirname "$0")"

# Run the script
upload_all_matches
