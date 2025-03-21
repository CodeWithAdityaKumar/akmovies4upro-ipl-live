#!/bin/bash

# Add IPL 2023 matches to the database
echo "Adding IPL matches to the database..."

# Starting with the 2023 IPL schedule
# Match 1: CSK vs GT - Mar 31, 2023
echo "Adding Match 1: CSK vs GT..."
curl -X POST http://localhost:3000/api/matches -H "Content-Type: application/json" \
  -d '{
    "team1_short_name": "CSK",
    "team2_short_name": "GT",
    "match_date": "2023-03-31T19:30:00+05:30",
    "venue": "Narendra Modi Stadium, Ahmedabad",
    "status": "completed",
    "result": "GT won by 5 wickets",
    "team1_score": "178/7",
    "team1_overs": "20",
    "team2_score": "182/5",
    "team2_overs": "19.2",
    "thumbnail_url": "https://img.cricbuzz.com/a/img/v1/595x396/i1/c318125/csk-vs-gt.jpg"
  }'
echo -e "\n"

# Match 2: PBKS vs KKR - Apr 1, 2023
echo "Adding Match 2: PBKS vs KKR..."
curl -X POST http://localhost:3000/api/matches -H "Content-Type: application/json" \
  -d '{
    "team1_short_name": "PBKS",
    "team2_short_name": "KKR",
    "match_date": "2023-04-01T15:30:00+05:30",
    "venue": "Punjab Cricket Association Stadium, Mohali",
    "status": "completed",
    "result": "PBKS won by 7 runs (DLS method)",
    "team1_score": "191/5",
    "team1_overs": "20",
    "team2_score": "146/7",
    "team2_overs": "16",
    "thumbnail_url": "https://img.cricbuzz.com/a/img/v1/595x396/i1/c318158/pbks-vs-kkr.jpg"
  }'
echo -e "\n"

# Match 3: LSG vs DC - Apr 1, 2023
echo "Adding Match 3: LSG vs DC..."
curl -X POST http://localhost:3000/api/matches -H "Content-Type: application/json" \
  -d '{
    "team1_short_name": "LSG",
    "team2_short_name": "DC",
    "match_date": "2023-04-01T19:30:00+05:30",
    "venue": "Ekana Cricket Stadium, Lucknow",
    "status": "completed",
    "result": "LSG won by 50 runs",
    "team1_score": "193/6",
    "team1_overs": "20",
    "team2_score": "143/9",
    "team2_overs": "20",
    "thumbnail_url": "https://img.cricbuzz.com/a/img/v1/595x396/i1/c318176/lsg-vs-dc.jpg"
  }'
echo -e "\n"

# Match 4: RR vs SRH - Apr 2, 2023
echo "Adding Match 4: RR vs SRH..."
curl -X POST http://localhost:3000/api/matches -H "Content-Type: application/json" \
  -d '{
    "team1_short_name": "RR",
    "team2_short_name": "SRH",
    "match_date": "2023-04-02T15:30:00+05:30",
    "venue": "Rajiv Gandhi International Stadium, Hyderabad",
    "status": "completed",
    "result": "RR won by 72 runs",
    "team1_score": "203/5",
    "team1_overs": "20",
    "team2_score": "131/10",
    "team2_overs": "18.2",
    "thumbnail_url": "https://img.cricbuzz.com/a/img/v1/595x396/i1/c318180/rr-vs-srh.jpg"
  }'
echo -e "\n"

# Match 5: RCB vs MI - Apr 2, 2023
echo "Adding Match 5: RCB vs MI..."
curl -X POST http://localhost:3000/api/matches -H "Content-Type: application/json" \
  -d '{
    "team1_short_name": "RCB",
    "team2_short_name": "MI",
    "match_date": "2023-04-02T19:30:00+05:30",
    "venue": "M Chinnaswamy Stadium, Bengaluru",
    "status": "completed",
    "result": "RCB won by 8 wickets",
    "team1_score": "171/7",
    "team1_overs": "20",
    "team2_score": "172/2",
    "team2_overs": "16.2",
    "thumbnail_url": "https://img.cricbuzz.com/a/img/v1/595x396/i1/c318195/rcb-vs-mi.jpg"
  }'
echo -e "\n"

# IPL 2024 Matches

# Match 1: CSK vs RCB - Mar 22, 2024
echo "Adding IPL 2024 Match 1: CSK vs RCB..."
curl -X POST http://localhost:3000/api/matches -H "Content-Type: application/json" \
  -d '{
    "team1_short_name": "CSK",
    "team2_short_name": "RCB",
    "match_date": "2024-03-22T19:30:00+05:30",
    "venue": "MA Chidambaram Stadium, Chennai",
    "status": "completed",
    "result": "CSK won by 6 wickets",
    "team1_score": "173/6",
    "team1_overs": "20",
    "team2_score": "176/4",
    "team2_overs": "18.4",
    "thumbnail_url": "https://img.cricbuzz.com/a/img/v1/595x396/i1/c378025/csk-vs-rcb.jpg"
  }'
echo -e "\n"

# Match 2: PBKS vs DC - Mar 23, 2024
echo "Adding IPL 2024 Match 2: PBKS vs DC..."
curl -X POST http://localhost:3000/api/matches -H "Content-Type: application/json" \
  -d '{
    "team1_short_name": "PBKS",
    "team2_short_name": "DC",
    "match_date": "2024-03-23T15:30:00+05:30",
    "venue": "Maharaja Yadavindra Singh Stadium, Mohali",
    "status": "completed",
    "result": "PBKS won by 4 wickets",
    "team1_score": "174/9",
    "team1_overs": "20",
    "team2_score": "177/6",
    "team2_overs": "19.2",
    "thumbnail_url": "https://img.cricbuzz.com/a/img/v1/595x396/i1/c378206/pbks-vs-dc.jpg"
  }'
echo -e "\n"

# Match 3: KKR vs SRH - Mar 23, 2024
echo "Adding IPL 2024 Match 3: KKR vs SRH..."
curl -X POST http://localhost:3000/api/matches -H "Content-Type: application/json" \
  -d '{
    "team1_short_name": "KKR",
    "team2_short_name": "SRH",
    "match_date": "2024-03-23T19:30:00+05:30",
    "venue": "Eden Gardens, Kolkata",
    "status": "completed",
    "result": "KKR won by 4 runs",
    "team1_score": "208/7",
    "team1_overs": "20",
    "team2_score": "204/7",
    "team2_overs": "20",
    "thumbnail_url": "https://img.cricbuzz.com/a/img/v1/595x396/i1/c378222/kkr-vs-srh.jpg"
  }'
echo -e "\n"

# Upcoming Match - GT vs MI - Mar 24, 2024
echo "Adding IPL 2024 Upcoming Match: GT vs MI..."
curl -X POST http://localhost:3000/api/matches -H "Content-Type: application/json" \
  -d '{
    "team1_short_name": "GT",
    "team2_short_name": "MI",
    "match_date": "2024-03-24T19:30:00+05:30",
    "venue": "Narendra Modi Stadium, Ahmedabad",
    "status": "upcoming",
    "thumbnail_url": "https://img.cricbuzz.com/a/img/v1/595x396/i1/c378243/gt-vs-mi.jpg"
  }'
echo -e "\n"

# Upcoming Match - RR vs LSG - Mar 24, 2024
echo "Adding IPL 2024 Upcoming Match: RR vs LSG..."
curl -X POST http://localhost:3000/api/matches -H "Content-Type: application/json" \
  -d '{
    "team1_short_name": "RR",
    "team2_short_name": "LSG",
    "match_date": "2024-03-24T15:30:00+05:30",
    "venue": "Sawai Mansingh Stadium, Jaipur",
    "status": "upcoming",
    "thumbnail_url": "https://img.cricbuzz.com/a/img/v1/595x396/i1/c378237/rr-vs-lsg.jpg"
  }'
echo -e "\n"

echo "All matches added successfully!"
