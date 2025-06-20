import React, { createContext, useContext, useState } from 'react';

const QueueContext = createContext();

export const QueueProvider = ({ children }) => {
  const [queue, setQueue] = useState([
    { id: '1', number: 'A101', status: 'En attente', clientLocation: '48.8566, 2.3522' },
    { id: '2', number: 'A102', status: 'En attente', clientLocation: '48.8534, 2.3488' },
  ]);
  const [ticketCount, setTicketCount] = useState(3);
  const [distributionActive, setDistributionActive] = useState(true);

  return (
    <QueueContext.Provider value={{
      queue, setQueue,
      ticketCount, setTicketCount,
      distributionActive, setDistributionActive
    }}>
      {children}
    </QueueContext.Provider>
  );
};

export const useQueue = () => useContext(QueueContext);