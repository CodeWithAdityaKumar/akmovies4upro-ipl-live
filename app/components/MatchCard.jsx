import Link from "next/link";
import Image from "next/image";

const MatchCard = ({ 
  matchNumber, 
  team1, 
  team2, 
  venue, 
  date, 
  time, 
  isLive = false 
}) => {
  // Add console logging to debug the props
  console.log('MatchCard props:', { matchNumber, team1, team2, venue, date, time, isLive });
  
  // Default values to prevent rendering errors
  const safeTeam1 = team1 || { name: 'Team 1', short: 'T1', logo: null };
  const safeTeam2 = team2 || { name: 'Team 2', short: 'T2', logo: null };
  const safeMatchNumber = matchNumber || '0';
  const safeVenue = venue || 'TBD';
  const safeDate = date || 'TBD';
  const safeTime = time || 'TBD';
  
  // Ensure team short names exist
  if (!safeTeam1.short && safeTeam1.name) {
    safeTeam1.short = safeTeam1.name.split(' ').map(word => word[0]).join('');
  }
  
  if (!safeTeam2.short && safeTeam2.name) {
    safeTeam2.short = safeTeam2.name.split(' ').map(word => word[0]).join('');
  }
  
  // Process logo URLs
  const team1Logo = safeTeam1.logo || safeTeam1.logo_url;
  const team2Logo = safeTeam2.logo || safeTeam2.logo_url;
  
  console.log('Processed team data:', {
    team1: { ...safeTeam1, logo: team1Logo },
    team2: { ...safeTeam2, logo: team2Logo }
  });
  return (
    <div className="bg-white dark:bg-gray-800 rounded-xl shadow-md overflow-hidden hover:shadow-lg transition-shadow duration-300">
      <div className="p-6">
        {isLive && (
          <div className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200 mb-3">
            <span className="h-2 w-2 bg-red-500 rounded-full mr-1.5 animate-pulse"></span>
            LIVE NOW
          </div>
        )}
        
        <p className="text-sm font-medium text-gray-500 dark:text-gray-400 mb-1">
          Match {safeMatchNumber} • {safeDate} • {safeTime}
        </p>
        
        <div className="flex justify-between items-center my-3">
          <div className="text-center flex-1">
            <div className="h-12 w-12 mx-auto mb-2 bg-gray-200 dark:bg-gray-700 rounded-full flex items-center justify-center overflow-hidden">
              {team1Logo ? (
                <Image 
                  src={team1Logo} 
                  alt={safeTeam1.name}
                  width={48}
                  height={48}
                  className="object-contain"
                  onError={(e) => {
                    console.error('Failed to load team 1 logo:', team1Logo);
                    e.target.style.display = 'none';
                    e.target.parentNode.innerHTML = `<span class="font-bold text-lg">${safeTeam1.short}</span>`;
                  }}
                />
              ) : (
                <span className="font-bold text-lg">{safeTeam1.short}</span>
              )}
            </div>
            <h3 className="text-sm font-medium">{safeTeam1.name}</h3>
          </div>
          
          <div className="mx-4">
            <span className="text-gray-600 dark:text-gray-300 font-bold">vs</span>
          </div>
          
          <div className="text-center flex-1">
            <div className="h-12 w-12 mx-auto mb-2 bg-gray-200 dark:bg-gray-700 rounded-full flex items-center justify-center overflow-hidden">
              {team2Logo ? (
                <Image 
                  src={team2Logo} 
                  alt={safeTeam2.name}
                  width={48}
                  height={48}
                  className="object-contain"
                  onError={(e) => {
                    console.error('Failed to load team 2 logo:', team2Logo);
                    e.target.style.display = 'none';
                    e.target.parentNode.innerHTML = `<span class="font-bold text-lg">${safeTeam2.short}</span>`;
                  }}
                />
              ) : (
                <span className="font-bold text-lg">{safeTeam2.short}</span>
              )}
            </div>
            <h3 className="text-sm font-medium">{safeTeam2.name}</h3>
          </div>
        </div>
        
        <div className="text-center mt-3 mb-4">
          <p className="text-sm text-gray-600 dark:text-gray-400">{safeVenue}</p>
        </div>
        
        <Link
          href={isLive ? "/live" : `/schedule/${matchNumber}`}
          className={`block w-full text-center py-2 px-4 rounded-md font-medium ${
            isLive 
              ? "bg-red-600 hover:bg-red-700 text-white" 
              : "bg-blue-600 hover:bg-blue-700 text-white"
          }`}
        >
          {isLive ? "Watch Live" : "Match Details"}
        </Link>
      </div>
    </div>
  );
};

export default MatchCard;
