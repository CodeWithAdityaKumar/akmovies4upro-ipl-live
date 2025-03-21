import Link from "next/link";

const Hero = () => {
  return (
    <div className="bg-gradient-to-r from-blue-900 to-indigo-900 text-white">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16 md:py-24">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8 items-center">
          <div>
            <h1 className="text-4xl md:text-5xl font-bold mb-4">
              Watch IPL 2025 Live
            </h1>
            <p className="text-lg mb-8">
              Stream all the Indian Premier League matches in HD quality with no buffering.
              Catch every six, wicket, and moment of excitement in real-time!
            </p>
            <div className="flex flex-col sm:flex-row gap-4">
              <Link 
                href="/live" 
                className="bg-red-600 hover:bg-red-700 text-white font-bold py-3 px-6 rounded-lg text-center"
              >
                Watch Live Now
              </Link>
              <Link 
                href="/schedule" 
                className="bg-transparent border-2 border-white hover:bg-white hover:text-blue-900 text-white font-bold py-3 px-6 rounded-lg text-center"
              >
                View Schedule
              </Link>
            </div>
          </div>
          <div className="relative">
            <div className="w-full h-64 md:h-96 rounded-xl shadow-2xl overflow-hidden">
              <img 
                src="https://cdn.gulte.com/wp-content/uploads/2025/03/indian-premier-league-ipl-2025.webp" 
                alt="IPL 2025" 
                className="w-full h-full object-cover"
              />
              <div className="absolute top-0 right-0 bg-red-600 text-white px-3 py-1 m-2 rounded-md">
                <p className="font-medium">LIVE NOW</p>
              </div>
            </div>
          </div>
        </div>

        {/* Current Match Info */}
        <div className="mt-12 bg-blue-800 bg-opacity-50 rounded-xl p-6">
          <div className="flex flex-col md:flex-row items-center justify-between">
            <div className="text-center md:text-left mb-4 md:mb-0">
              <p className="text-red-400 font-semibold mb-1">LIVE NOW</p>
              <h3 className="text-xl font-bold">Mumbai Indians vs Chennai Super Kings</h3>
              <p className="text-gray-300">Match 42 • Wankhede Stadium, Mumbai</p>
            </div>
            <div className="flex items-center gap-8">
              <div className="text-center">
                <span className="block text-3xl font-bold">167/5</span>
                <span className="text-sm text-gray-300">(18.2 Overs)</span>
              </div>
              <span className="text-xl font-bold">vs</span>
              <div className="text-center">
                <span className="block text-3xl font-bold">143/8</span>
                <span className="text-sm text-gray-300">(16 Overs)</span>
              </div>
            </div>
            <Link 
              href="/live" 
              className="mt-4 md:mt-0 bg-red-600 hover:bg-red-700 text-white font-semibold py-2 px-4 rounded"
            >
              Watch Now
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Hero;
