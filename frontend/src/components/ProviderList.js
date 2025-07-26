import React, { useEffect, useState } from 'react';

const NotificationOffers = ({
  show, // boolean to show/hide
  baseFare = 1000,
  onAccept,
  onReject,
  onNegotiate,
  realOffers = [] // Accept real offers from parent
}) => {
  const [offers, setOffers] = useState([]);

  useEffect(() => {
    if (show && realOffers.length > 0) {
      // Use real offers from Socket.IO
      const formattedOffers = realOffers.map(offer => ({
        id: offer.technicianId,
        technicianName: offer.technicianName,
        fare: offer.proposedFare,
        eta: offer.eta,
        status: 'pending',
        timeLeft: 300 // 5 minutes
      }));
      setOffers(formattedOffers);
    } else if (!show) {
      setOffers([]);
    }
  }, [show, realOffers]);

  // Timer countdown
  useEffect(() => {
    if (!show || offers.length === 0) return;
    const interval = setInterval(() => {
      setOffers(prev => prev.map(o =>
        o.status === 'pending' && o.timeLeft > 0
          ? { ...o, timeLeft: o.timeLeft - 1 }
          : o
      ));
    }, 1000);
    return () => clearInterval(interval);
  }, [show, offers.length]);

  const handleAccept = (id) => {
    setOffers(prev => prev.map(o => o.id === id ? { ...o, status: 'accepted' } : o));
    const offer = offers.find(o => o.id === id);
    if (onAccept) onAccept(offer);
  };
  const handleReject = (id) => {
    setOffers(prev => prev.map(o => o.id === id ? { ...o, status: 'rejected' } : o));
    if (onReject) onReject(id);
  };
  const handleNegotiate = (id) => {
    setOffers(prev => prev.map(o => o.id === id ? { ...o, status: 'negotiating' } : o));
    if (onNegotiate) onNegotiate(id);
  };

  if (!show || offers.length === 0) return null;

  return (
    <div className="fixed top-24 right-6 z-50 flex flex-col space-y-4 animate-fade-in">
      {offers.map((offer, idx) => (
        <div
          key={offer.id}
          className={`bg-white shadow-xl rounded-xl p-6 w-80 border-l-8 transition-all duration-500 ${
            offer.status === 'accepted' ? 'border-green-500' : offer.status === 'rejected' ? 'border-red-500' : 'border-blue-500'
          } animate-float-up`}
          style={{ animationDelay: `${idx * 0.2}s` }}
        >
          <div className="flex justify-between items-center mb-2">
            <div className="font-bold text-lg text-blue-700">{offer.technicianName}</div>
            <div className="text-primary font-bold text-xl">Rs. {offer.fare}</div>
          </div>
          <div className="flex items-center mb-2">
            <span className="text-gray-500 text-xs mr-2">Offer expires in:</span>
            <span className="font-mono text-sm text-orange-600">{Math.floor(offer.timeLeft/60)}:{(offer.timeLeft%60).toString().padStart(2,'0')}</span>
          </div>
          <div className="flex space-x-2 mt-2">
            <button
              className="bg-green-500 hover:bg-green-600 text-white px-4 py-2 rounded-lg font-semibold transition"
              disabled={offer.status !== 'pending'}
              onClick={() => handleAccept(offer.id)}
            >Accept</button>
            <button
              className="bg-red-500 hover:bg-red-600 text-white px-4 py-2 rounded-lg font-semibold transition"
              disabled={offer.status !== 'pending'}
              onClick={() => handleReject(offer.id)}
            >Reject</button>
            <button
              className="bg-yellow-400 hover:bg-yellow-500 text-white px-4 py-2 rounded-lg font-semibold transition"
              disabled={offer.status !== 'pending'}
              onClick={() => handleNegotiate(offer.id)}
            >Negotiate</button>
          </div>
          {offer.status !== 'pending' && (
            <div className={`mt-3 text-center font-bold ${offer.status === 'accepted' ? 'text-green-600' : offer.status === 'rejected' ? 'text-red-600' : 'text-yellow-600'}`}>
              {offer.status.charAt(0).toUpperCase() + offer.status.slice(1)}
            </div>
          )}
        </div>
      ))}
    </div>
  );
};

export default NotificationOffers;
