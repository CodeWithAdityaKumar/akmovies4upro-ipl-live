"use client";

import { useState, useEffect } from 'react';
import Link from 'next/link';

export default function ManageStreams() {
  const [streams, setStreams] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [selectedStream, setSelectedStream] = useState(null);
  const [showModal, setShowModal] = useState(false);

  // Mock data for demo purposes
  useEffect(() => {
    // Simulating API fetch
    setTimeout(() => {
      setStreams([
        {
          id: '1',
          matchId: '42',
          title: 'Mumbai Indians vs Chennai Super Kings',
          status: 'live',
          viewers: 1200000,
          startTime: '2025-03-21T19:30:00',
          streamUrl: 'https://res.cloudinary.com/dy1mqjddr/video/upload/sp_hd/v1741989910/cgds8tkp8cc0eu8gijpl.m3u8',
          qualities: [
            { id: 'auto', name: 'Auto', isDefault: true },
            { id: '720p', name: '720p HD', bitrate: '2.5 Mbps' },
            { id: '480p', name: '480p', bitrate: '1.2 Mbps' },
            { id: '360p', name: '360p', bitrate: '800 Kbps' },
            { id: '240p', name: '240p', bitrate: '400 Kbps' }
          ],
          chatEnabled: true
        },
        {
          id: '2',
          matchId: '43',
          title: 'Delhi Capitals vs Rajasthan Royals',
          status: 'live',
          viewers: 850000,
          startTime: '2025-03-21T15:30:00',
          streamUrl: 'https://res.cloudinary.com/dy1mqjddr/video/upload/sp_hd/v1741989910/dcvsrr-stream.m3u8',
          qualities: [
            { id: 'auto', name: 'Auto', isDefault: true },
            { id: '720p', name: '720p HD', bitrate: '2.5 Mbps' },
            { id: '480p', name: '480p', bitrate: '1.2 Mbps' },
            { id: '360p', name: '360p', bitrate: '800 Kbps' }
          ],
          chatEnabled: false
        },
        {
          id: '3',
          matchId: '44',
          title: 'Kolkata Knight Riders vs Punjab Kings',
          status: 'scheduled',
          viewers: 0,
          startTime: '2025-03-22T19:30:00',
          streamUrl: '',
          qualities: [],
          chatEnabled: true
        }
      ]);
      setIsLoading(false);
    }, 1000);
  }, []);

  const handleStartStream = (stream) => {
    // In a real implementation, this would call your backend API
    const updatedStreams = streams.map(s => 
      s.id === stream.id ? { ...s, status: 'live' } : s
    );
    setStreams(updatedStreams);
  };

  const handleStopStream = (stream) => {
    // In a real implementation, this would call your backend API
    const updatedStreams = streams.map(s => 
      s.id === stream.id ? { ...s, status: 'ended' } : s
    );
    setStreams(updatedStreams);
  };

  const handleEditStream = (stream) => {
    setSelectedStream(stream);
    setShowModal(true);
  };

  const handleSaveStream = (updatedStream) => {
    // Update stream in the list
    const updatedStreams = streams.map(s => 
      s.id === updatedStream.id ? updatedStream : s
    );
    setStreams(updatedStreams);
    setShowModal(false);
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h1 className="text-3xl font-bold">Manage Live Streams</h1>
        <Link 
          href="/admin/streams/add"
          className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded"
        >
          Add New Stream
        </Link>
      </div>

      {isLoading ? (
        <div className="text-center py-10">
          <div className="inline-block animate-spin h-8 w-8 border-4 border-blue-500 border-t-transparent rounded-full"></div>
          <p className="mt-2 text-gray-400">Loading streams...</p>
        </div>
      ) : (
        <div className="bg-gray-800 rounded-lg overflow-hidden">
          <table className="min-w-full divide-y divide-gray-700">
            <thead className="bg-gray-700">
              <tr>
                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-300 uppercase tracking-wider">
                  Match
                </th>
                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-300 uppercase tracking-wider">
                  Status
                </th>
                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-300 uppercase tracking-wider">
                  Viewers
                </th>
                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-300 uppercase tracking-wider">
                  Start Time
                </th>
                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-300 uppercase tracking-wider">
                  Quality Options
                </th>
                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-300 uppercase tracking-wider">
                  Actions
                </th>
              </tr>
            </thead>
            <tbody className="bg-gray-800 divide-y divide-gray-700">
              {streams.map((stream) => (
                <tr key={stream.id}>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="text-sm font-medium text-white">{stream.title}</div>
                    <div className="text-sm text-gray-400">ID: {stream.matchId}</div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${
                      stream.status === 'live' 
                        ? 'bg-green-900 text-green-100' 
                        : stream.status === 'scheduled' 
                        ? 'bg-yellow-900 text-yellow-100' 
                        : 'bg-red-900 text-red-100'
                    }`}>
                      {stream.status.toUpperCase()}
                    </span>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-white">
                    {stream.status === 'live' 
                      ? formatNumber(stream.viewers) 
                      : '-'}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-white">
                    {new Date(stream.startTime).toLocaleString()}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-white">
                    {stream.qualities.length > 0 
                      ? `${stream.qualities.length} options` 
                      : 'Not configured'}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm font-medium space-x-2">
                    {stream.status === 'scheduled' && (
                      <button
                        onClick={() => handleStartStream(stream)}
                        className="bg-green-600 hover:bg-green-700 text-white px-2 py-1 rounded text-xs"
                      >
                        Start Stream
                      </button>
                    )}
                    {stream.status === 'live' && (
                      <button
                        onClick={() => handleStopStream(stream)}
                        className="bg-red-600 hover:bg-red-700 text-white px-2 py-1 rounded text-xs"
                      >
                        End Stream
                      </button>
                    )}
                    <button
                      onClick={() => handleEditStream(stream)}
                      className="bg-blue-600 hover:bg-blue-700 text-white px-2 py-1 rounded text-xs"
                    >
                      Edit
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* Edit Stream Modal */}
      {showModal && selectedStream && (
        <StreamEditModal 
          stream={selectedStream} 
          onSave={handleSaveStream} 
          onCancel={() => setShowModal(false)} 
        />
      )}
    </div>
  );
}

function StreamEditModal({ stream, onSave, onCancel }) {
  const [formData, setFormData] = useState({...stream});
  const [newQuality, setNewQuality] = useState({ id: '', name: '', bitrate: '' });

  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;
    setFormData({
      ...formData,
      [name]: type === 'checkbox' ? checked : value
    });
  };

  const handleQualityChange = (index, field, value) => {
    const updatedQualities = [...formData.qualities];
    updatedQualities[index] = {
      ...updatedQualities[index],
      [field]: value
    };
    setFormData({
      ...formData,
      qualities: updatedQualities
    });
  };

  const handleAddQuality = () => {
    if (newQuality.id && newQuality.name) {
      setFormData({
        ...formData,
        qualities: [...formData.qualities, { ...newQuality, isDefault: false }]
      });
      setNewQuality({ id: '', name: '', bitrate: '' });
    }
  };

  const handleRemoveQuality = (index) => {
    const updatedQualities = formData.qualities.filter((_, i) => i !== index);
    setFormData({
      ...formData,
      qualities: updatedQualities
    });
  };

  const handleSetDefaultQuality = (index) => {
    const updatedQualities = formData.qualities.map((q, i) => ({
      ...q,
      isDefault: i === index
    }));
    setFormData({
      ...formData,
      qualities: updatedQualities
    });
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    onSave(formData);
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-75 flex items-center justify-center z-50">
      <div className="bg-gray-800 rounded-lg p-6 w-full max-w-3xl max-h-[90vh] overflow-y-auto">
        <h2 className="text-2xl font-bold mb-4">Edit Stream: {stream.title}</h2>
        
        <form onSubmit={handleSubmit}>
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-400 mb-1">Stream Title</label>
              <input
                type="text"
                name="title"
                value={formData.title}
                onChange={handleChange}
                className="w-full bg-gray-700 border border-gray-600 rounded px-3 py-2 text-white"
                required
              />
            </div>
            
            <div>
              <label className="block text-sm font-medium text-gray-400 mb-1">Stream URL (HLS)</label>
              <input
                type="text"
                name="streamUrl"
                value={formData.streamUrl}
                onChange={handleChange}
                className="w-full bg-gray-700 border border-gray-600 rounded px-3 py-2 text-white"
                placeholder="https://example.com/stream.m3u8"
              />
              <p className="text-xs text-gray-500 mt-1">Enter the HLS stream URL for the match</p>
            </div>
            
            <div>
              <label className="block text-sm font-medium text-gray-400 mb-1">Start Time</label>
              <input
                type="datetime-local"
                name="startTime"
                value={formData.startTime.slice(0, 16)}
                onChange={handleChange}
                className="w-full bg-gray-700 border border-gray-600 rounded px-3 py-2 text-white"
                required
              />
            </div>
            
            <div className="flex items-center">
              <input
                type="checkbox"
                id="chatEnabled"
                name="chatEnabled"
                checked={formData.chatEnabled}
                onChange={handleChange}
                className="h-4 w-4 text-blue-600 bg-gray-700 border-gray-600 rounded"
              />
              <label htmlFor="chatEnabled" className="ml-2 text-sm text-white">
                Enable Live Chat
              </label>
            </div>
            
            <div>
              <label className="block text-sm font-medium text-gray-400 mb-2">Quality Options</label>
              
              {formData.qualities.length > 0 ? (
                <div className="mb-4 space-y-2">
                  {formData.qualities.map((quality, index) => (
                    <div key={index} className="flex items-center space-x-2 bg-gray-700 p-2 rounded">
                      <input
                        type="radio"
                        id={`default-${index}`}
                        checked={quality.isDefault}
                        onChange={() => handleSetDefaultQuality(index)}
                        className="h-4 w-4"
                      />
                      <input
                        type="text"
                        value={quality.name}
                        onChange={(e) => handleQualityChange(index, 'name', e.target.value)}
                        className="bg-gray-600 border border-gray-500 rounded px-2 py-1 text-white text-sm flex-1"
                        placeholder="Name (e.g. 720p HD)"
                        required
                      />
                      <input
                        type="text"
                        value={quality.bitrate}
                        onChange={(e) => handleQualityChange(index, 'bitrate', e.target.value)}
                        className="bg-gray-600 border border-gray-500 rounded px-2 py-1 text-white text-sm w-24"
                        placeholder="Bitrate"
                      />
                      <button
                        type="button"
                        onClick={() => handleRemoveQuality(index)}
                        className="text-red-400 hover:text-red-300"
                      >
                        ✕
                      </button>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-gray-400 text-sm mb-4">No quality options configured yet.</p>
              )}
              
              {/* Add new quality */}
              <div className="flex items-center space-x-2 mb-2">
                <input
                  type="text"
                  value={newQuality.id}
                  onChange={(e) => setNewQuality({...newQuality, id: e.target.value})}
                  className="bg-gray-700 border border-gray-600 rounded px-2 py-1 text-white text-sm"
                  placeholder="ID (e.g. 720p)"
                />
                <input
                  type="text"
                  value={newQuality.name}
                  onChange={(e) => setNewQuality({...newQuality, name: e.target.value})}
                  className="bg-gray-700 border border-gray-600 rounded px-2 py-1 text-white text-sm flex-1"
                  placeholder="Name (e.g. 720p HD)"
                />
                <input
                  type="text"
                  value={newQuality.bitrate}
                  onChange={(e) => setNewQuality({...newQuality, bitrate: e.target.value})}
                  className="bg-gray-700 border border-gray-600 rounded px-2 py-1 text-white text-sm w-24"
                  placeholder="Bitrate"
                />
                <button
                  type="button"
                  onClick={handleAddQuality}
                  className="bg-blue-600 hover:bg-blue-700 text-white px-2 py-1 rounded text-sm"
                >
                  Add
                </button>
              </div>
              <p className="text-xs text-gray-500">Radio button indicates default quality. "Auto" should usually be default.</p>
            </div>
          </div>
          
          <div className="mt-6 flex justify-end space-x-3">
            <button
              type="button"
              onClick={onCancel}
              className="bg-gray-600 hover:bg-gray-700 text-white px-4 py-2 rounded"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded"
            >
              Save Changes
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

// Helper function to format numbers
function formatNumber(num) {
  if (num >= 1000000) {
    return (num / 1000000).toFixed(1) + 'M';
  }
  if (num >= 1000) {
    return (num / 1000).toFixed(1) + 'K';
  }
  return num.toString();
}
