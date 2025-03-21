#!/bin/bash

# Add all IPL teams to the database
echo "Adding IPL teams to the database..."

# Mumbai Indians
echo "Adding Mumbai Indians..."
curl -X POST http://localhost:3000/api/teams -H "Content-Type: application/json" -d '{"name":"Mumbai Indians", "short_name":"MI", "logo_url":"https://static.cricbuzz.com/a/img/v1/500x500/i1/c225645/mumbai-indians.jpg"}'
echo -e "\n"

# Chennai Super Kings
echo "Adding Chennai Super Kings..."
curl -X POST http://localhost:3000/api/teams -H "Content-Type: application/json" -d '{"name":"Chennai Super Kings", "short_name":"CSK", "logo_url":"https://static.cricbuzz.com/a/img/v1/500x500/i1/c225641/chennai-super-kings.jpg"}'
echo -e "\n"

# Royal Challengers Bangalore
echo "Adding Royal Challengers Bangalore..."
curl -X POST http://localhost:3000/api/teams -H "Content-Type: application/json" -d '{"name":"Royal Challengers Bengaluru", "short_name":"RCB", "logo_url":"https://static.cricbuzz.com/a/img/v1/500x500/i1/c225643/royal-challengers-bengaluru.jpg"}'
echo -e "\n"

# Kolkata Knight Riders
echo "Adding Kolkata Knight Riders..."
curl -X POST http://localhost:3000/api/teams -H "Content-Type: application/json" -d '{"name":"Kolkata Knight Riders", "short_name":"KKR", "logo_url":"https://static.cricbuzz.com/a/img/v1/500x500/i1/c225646/kolkata-knight-riders.jpg"}'
echo -e "\n"

# Delhi Capitals
echo "Adding Delhi Capitals..."
curl -X POST http://localhost:3000/api/teams -H "Content-Type: application/json" -d '{"name":"Delhi Capitals", "short_name":"DC", "logo_url":"https://static.cricbuzz.com/a/img/v1/500x500/i1/c225644/delhi-capitals.jpg"}'
echo -e "\n"

# Punjab Kings
echo "Adding Punjab Kings..."
curl -X POST http://localhost:3000/api/teams -H "Content-Type: application/json" -d '{"name":"Punjab Kings", "short_name":"PBKS", "logo_url":"https://static.cricbuzz.com/a/img/v1/500x500/i1/c225648/punjab-kings.jpg"}'
echo -e "\n"

# Rajasthan Royals
echo "Adding Rajasthan Royals..."
curl -X POST http://localhost:3000/api/teams -H "Content-Type: application/json" -d '{"name":"Rajasthan Royals", "short_name":"RR", "logo_url":"https://static.cricbuzz.com/a/img/v1/500x500/i1/c225647/rajasthan-royals.jpg"}'
echo -e "\n"

# Sunrisers Hyderabad
echo "Adding Sunrisers Hyderabad..."
curl -X POST http://localhost:3000/api/teams -H "Content-Type: application/json" -d '{"name":"Sunrisers Hyderabad", "short_name":"SRH", "logo_url":"https://static.cricbuzz.com/a/img/v1/500x500/i1/c225649/sunrisers-hyderabad.jpg"}'
echo -e "\n"

# Gujarat Titans
echo "Adding Gujarat Titans..."
curl -X POST http://localhost:3000/api/teams -H "Content-Type: application/json" -d '{"name":"Gujarat Titans", "short_name":"GT", "logo_url":"https://static.cricbuzz.com/a/img/v1/500x500/i1/c235085/gujarat-titans.jpg"}'
echo -e "\n"

# Lucknow Super Giants
echo "Adding Lucknow Super Giants..."
curl -X POST http://localhost:3000/api/teams -H "Content-Type: application/json" -d '{"name":"Lucknow Super Giants", "short_name":"LSG", "logo_url":"https://static.cricbuzz.com/a/img/v1/500x500/i1/c389444/lucknow-super-giants.jpg"}'
echo -e "\n"

echo "All teams added successfully!"
