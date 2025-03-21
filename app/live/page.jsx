import LivePlayer from "../components/LivePlayer";
import LiveScores from "../components/LiveScores";
import Navbar from "../components/Navbar";
import Footer from "../components/Footer";
import Link from "next/link";

const LivePage = () => {
  // Sample match data
  const currentMatch = {
    id: "42",
    team1: {
      name: "Mumbai Indians",
      short: "MI",
      score: "167/5",
      overs: "18.2"
    },
    team2: {
      name: "Chennai Super Kings",
      short: "CSK",
      score: "143/8",
      overs: "16.0"
    },
    venue: "Wankhede Stadium, Mumbai",
    date: "22 Mar 2025",
    status: "Mumbai Indians need 24 runs to win",
    stream_url: "https://cdn.jwplayer.com/manifests/pZxWPRg4.m3u8", // Sample HLS stream URL
    cricket_match_id: "live-cricket-scores/91704/rcb-vs-csk-68th-match-indian-premier-league-2024" // Cricket API match ID
  };

  return (
    <main className="min-h-screen bg-gray-100 dark:bg-gray-900">
      <Navbar />
      
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="mb-6">
          <h1 className="text-3xl font-bold text-gray-900 dark:text-white">Live Match</h1>
          <p className="text-gray-600 dark:text-gray-400">
            IPL 2025 • Match {currentMatch.id}
          </p>
        </div>
        
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Main Content - Video Player */}
          <div className="lg:col-span-2">
            <div className="bg-white dark:bg-gray-800 rounded-xl shadow-md overflow-hidden">
              <LivePlayer matchId={currentMatch.id} streamUrl={currentMatch.stream_url} />
              
              <div className="p-6">
                <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-4">
                  <h2 className="text-xl font-bold text-gray-900 dark:text-white mb-2 sm:mb-0">
                    {currentMatch.team1.name} vs {currentMatch.team2.name}
                  </h2>
                  <span className="inline-flex items-center px-3 py-1 rounded-full text-xs font-medium bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200">
                    <span className="h-2 w-2 bg-red-500 rounded-full mr-1.5 animate-pulse"></span>
                    LIVE
                  </span>
                </div>
                
                <div className="flex justify-center items-center space-x-8 my-6">
                  <div className="text-center">
                    <div className="h-20 w-20 mx-auto mb-2 bg-blue-900 rounded-full flex items-center justify-center">
                      <span className="font-bold text-xl text-white">{currentMatch.team1.short}</span>
                    </div>
                    <div className="text-xl font-bold text-gray-900 dark:text-white">
                      {currentMatch.team1.score}
                    </div>
                    <div className="text-sm text-gray-600 dark:text-gray-400">
                      ({currentMatch.team1.overs} Overs)
                    </div>
                  </div>
                  
                  <div className="text-center">
                    <span className="inline-block px-4 py-2 bg-gray-200 dark:bg-gray-700 rounded-full text-gray-800 dark:text-gray-200 font-bold text-lg">
                      vs
                    </span>
                  </div>
                  
                  <div className="text-center">
                    <div className="h-20 w-20 mx-auto mb-2 bg-yellow-600 rounded-full flex items-center justify-center">
                      <span className="font-bold text-xl text-white">{currentMatch.team2.short}</span>
                    </div>
                    <div className="text-xl font-bold text-gray-900 dark:text-white">
                      {currentMatch.team2.score}
                    </div>
                    <div className="text-sm text-gray-600 dark:text-gray-400">
                      ({currentMatch.team2.overs} Overs)
                    </div>
                  </div>
                </div>
                
                <div className="text-center p-3 bg-blue-100 dark:bg-blue-900 rounded-lg text-blue-800 dark:text-blue-200 font-medium">
                  {currentMatch.status}
                </div>
                
                <div className="mt-6 grid grid-cols-2 gap-4">
                  <button className="flex items-center justify-center px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-blue-600 hover:bg-blue-700">
                    <svg className="mr-2 h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8.684 13.342C8.886 12.938 9 12.482 9 12c0-.482-.114-.938-.316-1.342m0 2.684a3 3 0 110-2.684m0 2.684l6.632 3.316m-6.632-6l6.632-3.316m0 0a3 3 0 105.367-2.684 3 3 0 00-5.367 2.684zm0 9.316a3 3 0 105.368 2.684 3 3 0 00-5.368-2.684z" />
                    </svg>
                    Share
                  </button>
                  <button className="flex items-center justify-center px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-blue-700 bg-blue-100 hover:bg-blue-200 dark:text-blue-200 dark:bg-blue-800 dark:hover:bg-blue-700">
                    <svg className="mr-2 h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                    </svg>
                    Match Details
                  </button>
                </div>
              </div>
            </div>
            
            {/* Live Commentary */}
            <div className="mt-8 bg-white dark:bg-gray-800 rounded-xl shadow-md overflow-hidden">
              <div className="border-b border-gray-200 dark:border-gray-700 px-6 py-4">
                <h3 className="text-lg font-semibold text-gray-900 dark:text-white">Live Commentary</h3>
              </div>
              <div className="p-6 h-80 overflow-y-auto">
                <div className="space-y-4">
                  {[
                    { over: "16.0", text: "WICKET! Jadeja takes a stunning catch at deep square leg to dismiss Tilak Varma for 42 (29)." },
                    { over: "15.4", text: "SIX! Tilak Varma smashes Pathirana for a huge six over deep midwicket." },
                    { over: "15.1", text: "FOUR! Tim David finds the gap between point and cover for a boundary." },
                    { over: "14.6", text: "Dot ball to end the over. Good comeback by Chahar after conceding a boundary." },
                    { over: "14.3", text: "FOUR! Tilak Varma sweeps Chahar to the fine leg boundary." },
                    { over: "13.2", text: "WICKET! Dhoni makes no mistake with the gloves, stumping Suryakumar Yadav for 28 (22)." },
                    { over: "12.5", text: "SIX! Suryakumar Yadav with his trademark shot over fine leg for a maximum." },
                    { over: "11.2", text: "Mumbai rotating the strike well, keeping up with the required run rate." },
                    { over: "10.4", text: "FOUR! Perfectly timed drive by Tilak Varma through the covers." }
                  ].map((comment, idx) => (
                    <div key={idx} className="flex">
                      <div className="mr-4 flex-shrink-0">
                        <span className="inline-flex items-center justify-center h-8 w-14 rounded bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200 text-xs font-medium">
                          {comment.over}
                        </span>
                      </div>
                      <div className="flex-1 text-gray-800 dark:text-gray-300">
                        {comment.text}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
          
          {/* Sidebar Content */}
          <div className="lg:col-span-1 space-y-8">
            {/* Live Cricket Scores */}
            <div className="bg-white dark:bg-gray-800 rounded-xl shadow-md overflow-hidden">
              <div className="border-b border-gray-200 dark:border-gray-700 px-6 py-4">
                <h3 className="text-lg font-semibold text-gray-900 dark:text-white">Live Cricket Score</h3>
              </div>
              <div className="p-4">
                <LiveScores matchId={currentMatch.cricket_match_id} className="w-full" />
              </div>
            </div>
            {/* Match Information */}
            <div className="bg-white dark:bg-gray-800 rounded-xl shadow-md overflow-hidden">
              <div className="border-b border-gray-200 dark:border-gray-700 px-6 py-4">
                <h3 className="text-lg font-semibold text-gray-900 dark:text-white">Match Info</h3>
              </div>
              <div className="p-6">
                <dl className="space-y-4">
                  <div>
                    <dt className="text-sm font-medium text-gray-500 dark:text-gray-400">Venue</dt>
                    <dd className="mt-1 text-gray-900 dark:text-white">{currentMatch.venue}</dd>
                  </div>
                  <div>
                    <dt className="text-sm font-medium text-gray-500 dark:text-gray-400">Date & Time</dt>
                    <dd className="mt-1 text-gray-900 dark:text-white">{currentMatch.date} • 7:30 PM IST</dd>
                  </div>
                  <div>
                    <dt className="text-sm font-medium text-gray-500 dark:text-gray-400">Toss</dt>
                    <dd className="mt-1 text-gray-900 dark:text-white">Chennai Super Kings, elected to bat</dd>
                  </div>
                  <div>
                    <dt className="text-sm font-medium text-gray-500 dark:text-gray-400">Umpires</dt>
                    <dd className="mt-1 text-gray-900 dark:text-white">Kumar Dharmasena, Chris Gaffaney</dd>
                  </div>
                  <div>
                    <dt className="text-sm font-medium text-gray-500 dark:text-gray-400">Match Referee</dt>
                    <dd className="mt-1 text-gray-900 dark:text-white">Javagal Srinath</dd>
                  </div>
                </dl>
              </div>
            </div>
            
            {/* Live Chat - Preview only */}
            <div className="bg-white dark:bg-gray-800 rounded-xl shadow-md overflow-hidden">
              <div className="border-b border-gray-200 dark:border-gray-700 px-6 py-4 flex justify-between items-center">
                <h3 className="text-lg font-semibold text-gray-900 dark:text-white">Live Chat</h3>
                <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200">
                  2.3K Online
                </span>
              </div>
              <div className="p-6">
                <div className="h-72 flex flex-col">
                  <div className="flex-1 overflow-y-auto mb-4">
                    <div className="space-y-3">
                      {[
                        { user: "cricket_fan123", message: "What a match! CSK vs MI is always a thriller!" },
                        { user: "blue_army", message: "Mumbai Indians are the best team in IPL history 🏆" },
                        { user: "csk_whistle", message: "Dhoni still showing why he's the best captain 💛" },
                        { user: "ipl_lover", message: "That last six was massive!" },
                        { user: "cricket_expert", message: "Mumbai's middle order is looking strong this year" },
                        { user: "sports_geek", message: "CSK's bowling has been pretty average today" }
                      ].map((chat, idx) => (
                        <div key={idx} className="flex">
                          <div className="mr-3 flex-shrink-0">
                            <div className="h-8 w-8 rounded-full bg-blue-100 dark:bg-blue-900 flex items-center justify-center">
                              <span className="font-bold text-xs text-blue-800 dark:text-blue-200">{chat.user.substring(0, 2).toUpperCase()}</span>
                            </div>
                          </div>
                          <div>
                            <p className="text-xs font-medium text-gray-900 dark:text-white">{chat.user}</p>
                            <p className="text-sm text-gray-700 dark:text-gray-300">{chat.message}</p>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                  <div className="relative">
                    <input
                      type="text"
                      placeholder="Type your message..."
                      className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-blue-500 focus:border-blue-500 bg-white dark:bg-gray-700 text-gray-800 dark:text-gray-200"
                    />
                    <button className="absolute right-2 top-2 text-blue-600 dark:text-blue-400">
                      <svg className="h-5 w-5" fill="currentColor" viewBox="0 0 20 20">
                        <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-8.707l-3-3a1 1 0 00-1.414 1.414L10.586 9H7a1 1 0 100 2h3.586l-1.293 1.293a1 1 0 101.414 1.414l3-3a1 1 0 000-1.414z" clipRule="evenodd" />
                      </svg>
                    </button>
                  </div>
                  <p className="mt-2 text-xs text-gray-500 dark:text-gray-400">
                    Please be respectful in the chat. Any inappropriate messages will be removed.
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
      
      <Footer />
    </main>
  );
};

export default LivePage;
