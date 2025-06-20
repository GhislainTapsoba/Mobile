import React, { useEffect, useState } from 'react';
import { View, Text, TextInput, StyleSheet, FlatList, TouchableOpacity, Dimensions, PermissionsAndroid, Platform, Alert } from 'react-native';
import Geolocation from 'react-native-geolocation-service';import MaterialIcons from 'react-native-vector-icons/MaterialIcons';
import { useQueue } from '../context/QueueContext';
import PushNotification from 'react-native-push-notification';

// Fonction utilitaire pour calculer la distance (Haversine)
function getDistanceFromLatLonInKm(lat1, lon1, lat2, lon2) {
  const R = 6371;
  const dLat = (lat2 - lat1) * Math.PI / 180;
  const dLon = (lon2 - lon1) * Math.PI / 180;
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos(lat1 * Math.PI / 180) *
      Math.cos(lat2 * Math.PI / 180) *
      Math.sin(dLon / 2) *
      Math.sin(dLon / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return R * c;
}

// Fonction utilitaire pour obtenir l'adresse à partir des coordonnées (reverse geocoding)
async function getAddressFromCoords(lat, lon) {
  try {
    const url = `https://nominatim.openstreetmap.org/reverse?format=json&lat=${lat}&lon=${lon}&zoom=16&addressdetails=1`;
    console.log('Requête reverse geocoding:', url);
    const response = await fetch(url);
    const data = await response.json();
    console.log('Réponse reverse geocoding:', data);
    if (!data || !data.address) return data.display_name || "Adresse inconnue";
    return (
      data.address.neighbourhood ||
      data.address.suburb ||
      data.address.village ||
      data.address.town ||
      data.address.city ||
      data.display_name ||
      "Adresse inconnue"
    );
  } catch (e) {
    console.log('Erreur reverse geocoding:', e);
    return "Adresse inconnue";
  }
}

const { width } = Dimensions.get('window');

// Liste d'agences (exemple)
const AGENCIES = [
  { name: "ONEA Siège Central", quartier: "Ouaga 2000", latitude: 12.3101, longitude: -1.5383 },
  { name: "ONEA Agence Pissy", quartier: "Pissy", latitude: 12.3708, longitude: -1.5735 },
  { name: "ONEA Agence Larlé", quartier: "Larlé", latitude: 12.3822, longitude: -1.5265 },
  { name: "ONEA Agence Kossodo", quartier: "Kossodo", latitude: 12.4102, longitude: -1.4702 },
  { name: "ONEA Agence Patte d’Oie", quartier: "Patte d’Oie", latitude: 12.3535, longitude: -1.5412 },
  { name: "ONEA Agence Gounghin", quartier: "Gounghin", latitude: 12.3649, longitude: -1.5076 },
  { name: "ONEA Agence Tampouy", quartier: "Tampouy", latitude: 12.4012, longitude: -1.5487 },
  { name: "ONEA Agence Zone du Bois", quartier: "Zone du Bois", latitude: 12.3432, longitude: -1.5260 },
];

function addMinutesToNow(minutes) {
  const now = new Date();
  now.setMinutes(now.getMinutes() + minutes);
  return now.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
}

const ClientScreen = () => {
  const { queue, setQueue, ticketCount, setTicketCount, distributionActive } = useQueue();
  const [currentLocation, setCurrentLocation] = useState(null);
  const [currentAddress, setCurrentAddress] = useState('');
  const [nearestAgency, setNearestAgency] = useState(null);
  const [distanceToAgency, setDistanceToAgency] = useState(null);
  const [myTicketId, setMyTicketId] = useState(null);
  const [activeTab, setActiveTab] = useState('reserve');
  const [locationError, setLocationError] = useState(null);
  const [searchText, setSearchText] = useState('');
  const [searchResult, setSearchResult] = useState(null);
  const [showSuccessModal, setShowSuccessModal] = useState(false);
  const [successMessage, setSuccessMessage] = useState('');

  const requestLocation = async () => {
    if (Platform.OS === 'android') {
      const granted = await PermissionsAndroid.request(
        PermissionsAndroid.PERMISSIONS.ACCESS_FINE_LOCATION,
        {
          title: 'Permission de localisation',
          message: "ONEAPP a besoin d'accéder à votre position.",
          buttonNeutral: 'Plus tard',
          buttonNegative: 'Refuser',
          buttonPositive: 'Autoriser',
        }
      );
      if (granted !== PermissionsAndroid.RESULTS.GRANTED) {
        setLocationError('Permission de localisation refusée.');
        return;
      }
    }
    Geolocation.getCurrentPosition(
      position => {
        console.log('Position obtenue:', position.coords);
        setCurrentLocation(position.coords);
        setLocationError(null);
      },
      error => {
        console.log('Erreur géolocalisation:', error);
        setLocationError(error.message);
      },
      { enableHighAccuracy: true, timeout: 20000, maximumAge: 0 }
    );
  };

  useEffect(() => {
    requestLocation();
  }, []);

  useEffect(() => {
    async function fetchAddress() {
      if (currentLocation) {
        const address = await getAddressFromCoords(
          currentLocation.latitude,
          currentLocation.longitude
        );
        setCurrentAddress(address);
      }
    }
    fetchAddress();
  }, [currentLocation]);

  useEffect(() => {
    if (currentLocation) {
      let minDist = Infinity;
      let closest = null;
      for (const agency of AGENCIES) {
        const dist = getDistanceFromLatLonInKm(
          currentLocation.latitude,
          currentLocation.longitude,
          agency.latitude,
          agency.longitude
        );
        if (dist < minDist) {
          minDist = dist;
          closest = agency;
        }
      }
      setNearestAgency(closest);
      setDistanceToAgency(minDist);
    }
  }, [currentLocation]);

  const sortedQueue = [...queue].sort((a, b) => parseInt(a.id) - parseInt(b.id));
  let myTicket = null;
  if (myTicketId) {
    myTicket = sortedQueue.find(t => t.id === myTicketId);
  }
  const estimatedWait = distanceToAgency !== null ? Math.ceil(distanceToAgency * 10) : null;
  const myPosition = myTicket ? sortedQueue.findIndex(t => t.id === myTicket.id) + 1 : null;
  const clientsBeforeMe = myPosition ? myPosition - 1 : 0;
  const waitTimeForQueue = clientsBeforeMe * 15;
  const waitTimeForDistance = distanceToAgency !== null ? Math.ceil(distanceToAgency * 10) : 0;
  const totalWaitTime = waitTimeForQueue + waitTimeForDistance;
  const arrivalTime = addMinutesToNow(totalWaitTime);

  const reserveTicket = () => {
    if (!distributionActive || !currentLocation || !nearestAgency) return;
    const newTicket = {
      id: ticketCount.toString(),
      number: `A10${ticketCount}`,
      status: 'En attente',
      clientLocation: `${currentLocation.latitude}, ${currentLocation.longitude}`,
      agency: nearestAgency.name,
    };
    setQueue([...queue, newTicket]);
    setTicketCount(ticketCount + 1);
    setMyTicketId(newTicket.id);

    // Notification locale
    PushNotification.localNotification({
      channelId: "oneapp-ticket",
      title: "Ticket réservé !",
      message: `Votre ticket ${newTicket.number} a bien été pris pour l'agence ${nearestAgency.name}.`,
      playSound: true,
      soundName: 'default',
    });

    
    setSuccessMessage(`Votre ticket ${newTicket.number} a bien été réservé pour l'agence ${nearestAgency.name}.`);
    setShowSuccessModal(true);
  };

  useEffect(() => {
    PushNotification.createChannel(
      {
        channelId: "oneapp-ticket", // identifiant du canal
        channelName: "Notifications ONEAPP", 
        importance: 4,
        vibrate: true,
      },
      (created) => console.log(`createChannel returned '${created}'`)
    );
    PushNotification.configure({
      onNotification: function (notification) {
        console.log("NOTIFICATION:", notification);
      },
      requestPermissions: Platform.OS === 'ios',
    });
  }, []);

  let mainContent = null;
  if (activeTab === 'reserve') {
    mainContent = (
      <View>
        <View style={styles.infoCard}>
          {locationError ? (
            <>
              <Text style={[styles.locationText, { color: '#D32F2F', fontWeight: 'bold' }]}>{locationError}</Text>
              <TouchableOpacity
                style={[styles.reserveButton, { marginTop: 10 }]}
                onPress={requestLocation}
              >
                <MaterialIcons name="refresh" size={24} color="#fff" />
                <Text style={styles.reserveButtonText}>Réessayer</Text>
              </TouchableOpacity>
            </>
          ) : (
            <>
              <View style={styles.infoRow}>
                <MaterialIcons name="my-location" size={24} color="#1976D2" style={{marginRight: 8}} />
                <Text style={styles.infoLabel}>Votre position :</Text>
                <Text style={styles.infoValue}>{currentAddress ? currentAddress : 'Chargement...'}</Text>
              </View>
              <View style={styles.infoRow}>
                <MaterialIcons name="business" size={24} color="#388E3C" style={{marginRight: 8}} />
                <Text style={styles.infoLabel}>Agence la plus proche :</Text>
                <Text style={[styles.infoValue, {color: '#388E3C', fontWeight: 'bold'}]}>
                  {nearestAgency ? `${nearestAgency.name} (${nearestAgency.quartier})` : 'Recherche...'}
                </Text>
              </View>
              <View style={styles.infoRow}>
                <MaterialIcons name="directions-walk" size={24} color="#FFA000" style={{marginRight: 8}} />
                <Text style={styles.infoLabel}>Distance :</Text>
                <Text style={[styles.infoValue, {color: '#FFA000', fontWeight: 'bold'}]}>
                  {distanceToAgency !== null ? `${distanceToAgency.toFixed(2)} km` : '...'}
                </Text>
              </View>
              {myTicket && (
                <View style={styles.infoRow}>
                  <MaterialIcons name="confirmation-number" size={24} color="#0D47A1" style={{marginRight: 8}} />
                  <View>
                    <Text style={[styles.infoLabel, {marginBottom: 2}]}>Votre place dans la file : <Text style={{color: '#0D47A1', fontWeight: 'bold'}}>{myPosition}</Text></Text>
                    <Text style={styles.infoLabel}>Temps estimé : <Text style={{color: '#1976D2', fontWeight: 'bold'}}>{totalWaitTime} min</Text></Text>
                    <Text style={styles.infoLabel}>Heure de passage estimée : <Text style={{color: '#388E3C', fontWeight: 'bold'}}>{arrivalTime}</Text></Text>
                  </View>
                </View>
              )}
            </>
          )}
        </View>
        <TouchableOpacity
          style={[
            styles.reserveButton,
            !distributionActive || !!locationError || !currentLocation || !nearestAgency
              ? styles.reserveButtonDisabled
              : null,
          ]}
          onPress={reserveTicket}
          disabled={!distributionActive || !!locationError || !currentLocation || !nearestAgency}
        >
          <MaterialIcons name="confirmation-number" size={28} color="#fff" />
          <Text style={styles.reserveButtonText}>Réserver un ticket</Text>
        </TouchableOpacity>
        {!distributionActive && (
          <Text style={{ color: '#D32F2F', marginTop: 18, textAlign: 'center', fontWeight: 'bold' }}>
            La distribution est arrêtée.
          </Text>
        )}
      </View>
    );
  } else if (activeTab === 'queue') {
    mainContent = (
      <View style={{flex: 1}}>
        <Text style={styles.subHeader}>File d'attente</Text>
        {/* Barre de recherche */}
        <View style={styles.searchBarContainer}>
          <TextInput
            style={styles.searchInput}
            placeholder="Rechercher un ticket (ex: A100)"
            value={searchText}
            onChangeText={text => {
              setSearchText(text);
              if (text === '') setSearchResult(null);
            }}
            placeholderTextColor="#888"
          />
          <TouchableOpacity
            style={styles.searchButton}
            onPress={() => {
              const found = queue.find(t => t.number.toLowerCase() === searchText.trim().toLowerCase());
              setSearchResult(found || null);
            }}
          >
            <MaterialIcons name="search" size={24} color="#fff" />
          </TouchableOpacity>
          {searchResult && (
            <TouchableOpacity
              style={styles.clearButton}
              onPress={() => {
                setSearchText('');
                setSearchResult(null);
              }}
            >
              <MaterialIcons name="close" size={22} color="#fff" />
            </TouchableOpacity>
          )}
        </View>

        {/* Résultat de recherche ou liste complète */}
        {searchResult ? (
          <View style={[styles.ticketItem, styles.ticketItemHighlight]}>
            <View style={styles.ticketLeft}>
              <MaterialIcons
                name={searchResult.status === 'En cours' ? "play-arrow" : "hourglass-empty"}
                size={32}
                color={searchResult.status === 'En cours' ? "#1976D2" : "#FFA000"}
              />
            </View>
            <View style={styles.ticketCenter}>
              <Text style={styles.ticketNumber}>{searchResult.number}</Text>
              <Text style={[styles.ticketStatus, searchResult.status === 'En cours' && { color: "#1976D2" }]}>
                {searchResult.status}
              </Text>
              <Text style={styles.ticketAgency}>Agence : <Text style={{fontWeight: 'bold'}}>{searchResult.agency}</Text></Text>
            </View>
          </View>
        ) : (
          <FlatList
            data={sortedQueue}
            keyExtractor={item => item.id}
            renderItem={({ item, index }) => (
              <View style={[styles.ticketItem, item.id === myTicketId && styles.ticketItemMine]}>
                <View style={styles.ticketLeft}>
                  <MaterialIcons
                    name={item.status === 'En cours' ? "play-arrow" : "hourglass-empty"}
                    size={28}
                    color={item.status === 'En cours' ? "#1976D2" : "#FFA000"}
                  />
                </View>
                <View style={styles.ticketCenter}>
                  <View style={{flexDirection: 'row', alignItems: 'center'}}>
                    <Text style={styles.ticketNumber}>{item.number}</Text>
                    {item.id === myTicketId && (
                      <View style={styles.badgeMine}>
                        <Text style={styles.badgeMineText}>Moi</Text>
                      </View>
                    )}
                  </View>
                  <Text style={[styles.ticketStatus, item.status === 'En cours' && { color: "#1976D2" }]}>
                    {item.status}
                  </Text>
                  <Text style={styles.ticketAgency}>{item.agency}</Text>
                </View>
                <View style={styles.ticketRight}>
                  <View style={styles.positionBadge}>
                    <Text style={styles.positionBadgeText}>#{index + 1}</Text>
                  </View>
                </View>
              </View>
            )}
            contentContainerStyle={{ paddingBottom: 30, paddingTop: 10 }}
          />
        )}
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <Text style={styles.welcomeTitle}>Bienvenue sur ONEAPP</Text>
      <Text style={styles.header}>Espace Client</Text>
      <Text style={styles.slogan}>Gérez vos tickets en toute simplicité</Text>
      {mainContent}
      <View style={styles.tabBar}>
        <TouchableOpacity
          style={[styles.actionButton, activeTab === 'reserve' && styles.activeTab]}
          onPress={() => setActiveTab('reserve')}
        >
          <MaterialIcons name="confirmation-number" size={28} color={activeTab === 'reserve' ? "#1976D2" : "#0D47A1"} />
          <Text style={styles.actionText}>Réserver</Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[styles.actionButton, activeTab === 'queue' && styles.activeTab]}
          onPress={() => setActiveTab('queue')}
        >
          <MaterialIcons name="list" size={28} color={activeTab === 'queue' ? "#1976D2" : "#0D47A1"} />
          <Text style={styles.actionText}>File d'attente</Text>
        </TouchableOpacity>
      </View>

      {showSuccessModal && (
        <View style={{
          position: 'absolute',
          top: 0, left: 0, right: 0, bottom: 0,
          backgroundColor: 'rgba(0,0,0,0.4)',
          justifyContent: 'center',
          alignItems: 'center',
          zIndex: 100,
        }}>
          <View style={{
            backgroundColor: '#fff',
            borderRadius: 18,
            padding: 28,
            alignItems: 'center',
            width: '80%',
            shadowColor: '#1976D2',
            shadowOpacity: 0.15,
            shadowRadius: 10,
            elevation: 8,
          }}>
            <MaterialIcons name="check-circle" size={48} color="#388E3C" style={{marginBottom: 10}} />
            <Text style={{fontSize: 20, fontWeight: 'bold', color: '#388E3C', marginBottom: 8}}>Succès</Text>
            <Text style={{fontSize: 16, color: '#222', textAlign: 'center', marginBottom: 18}}>{successMessage}</Text>
            <TouchableOpacity
              style={{
                backgroundColor: '#1976D2',
                borderRadius: 8,
                paddingVertical: 10,
                paddingHorizontal: 28,
              }}
              onPress={() => setShowSuccessModal(false)}
            >
              <Text style={{color: '#fff', fontWeight: 'bold', fontSize: 16}}>OK</Text>
            </TouchableOpacity>
          </View>
        </View>
      )}
    </View>
  );
};


const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 24,
    paddingBottom: 0,
    backgroundColor: '#f4f8fb',
  },
  welcomeTitle: {
    fontSize: 25,
    fontWeight: 'bold',
    color: '#0D47A1',
    textAlign: 'center',
    marginTop: 18,
    marginBottom: 2,
    letterSpacing: 1,
  },
  header: {
    fontSize: 20,
    fontWeight: 'bold',
    marginBottom: 2,
    textAlign: 'center',
    color: '#1976D2',
    letterSpacing: 0.5,
  },
  slogan: {
    fontSize: 15,
    color: '#1976D2',
    textAlign: 'center',
    marginBottom: 18,
    fontStyle: 'italic',
  },
  subHeader: {
    fontSize: 18,
    marginTop: 10,
    marginBottom: 10,
    color: '#0D47A1',
    fontWeight: 'bold',
    textAlign: 'center',
    letterSpacing: 0.5,
  },
  locationContainer: {
    marginBottom: 24,
    padding: 16,
    backgroundColor: '#e3eafc',
    borderRadius: 10,
    alignItems: 'center',
    shadowColor: '#0D47A1',
    shadowOpacity: 0.07,
    shadowRadius: 4,
    elevation: 2,
  },
  locationText: {
    fontSize: 15,
    color: '#222',
    marginBottom: 2,
  },
  reserveButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#0D47A1',
    paddingVertical: 14,
    paddingHorizontal: 28,
    borderRadius: 10,
    alignSelf: 'center',
    marginTop: 10,
    shadowColor: '#0D47A1',
    shadowOpacity: 0.10,
    shadowRadius: 4,
    elevation: 2,
  },
  reserveButtonDisabled: {
    backgroundColor: '#b0b8c1',
  },
  reserveButtonText: {
    color: '#fff',
    fontWeight: 'bold',
    marginLeft: 12,
    fontSize: 17,
    letterSpacing: 0.5,
  },
  ticketItem: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#fff',
    borderRadius: 14,
    marginBottom: 14,
    padding: 16,
    width: width - 40,
    alignSelf: 'center',
    shadowColor: '#1976D2',
    shadowOpacity: 0.08,
    shadowRadius: 6,
    elevation: 3,
    borderWidth: 1,
    borderColor: '#e3eafc',
  },
  ticketItemHighlight: {
    backgroundColor: '#e3eafc',
    borderColor: '#1976D2',
    borderWidth: 2,
  },
  ticketItemMine: {
    backgroundColor: '#e8f5e9',
    borderColor: '#388E3C',
    borderWidth: 2,
  },
  ticketLeft: {
    marginRight: 16,
  },
  ticketCenter: {
    flex: 1,
  },
  ticketNumber: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#1976D2',
    marginRight: 8,
  },
  ticketStatus: {
    fontSize: 15,
    color: '#FFA000',
    marginTop: 2,
    fontWeight: 'bold',
  },
  ticketAgency: {
    fontSize: 13,
    color: '#0D47A1',
    marginTop: 2,
    fontStyle: 'italic',
  },
  ticketRight: {
    marginLeft: 10,
    alignItems: 'flex-end',
  },
  ticketPos: {
    fontSize: 14,
    color: '#888',
    fontWeight: 'bold',
  },
  tabBar: {
    position: 'absolute',
    left: 0,
    right: 0,
    bottom: 0,
    flexDirection: 'row',
    backgroundColor: '#e3eafc',
    borderTopWidth: 1,
    borderTopColor: '#b0b8c1',
    justifyContent: 'space-around',
    alignItems: 'center',
    height: 70,
    width: width,
    paddingBottom: 10,
    paddingTop: 5,
    shadowColor: '#0D47A1',
    shadowOpacity: 0.08,
    shadowRadius: 4,
    elevation: 3,
  },
  actionButton: {
    alignItems: 'center',
    justifyContent: 'center',
    flex: 1,
  },
  actionText: {
    marginTop: 4,
    color: '#0D47A1',
    fontWeight: 'bold',
    fontSize: 13,
    textAlign: 'center',
    letterSpacing: 0.5,
  },
  activeTab: {
    backgroundColor: '#d0e2ff',
    borderRadius: 12,
  },
  infoCard: {
    backgroundColor: '#fff',
    borderRadius: 16,
    padding: 18,
    marginBottom: 24,
    shadowColor: '#1976D2',
    shadowOpacity: 0.10,
    shadowRadius: 8,
    elevation: 4,
  },
  infoRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
  },
  infoLabel: {
    fontSize: 16,
    color: '#333',
    fontWeight: '600',
    marginRight: 4,
  },
  infoValue: {
    fontSize: 16,
    color: '#1976D2',
    fontWeight: 'bold',
    flexShrink: 1,
  },
  searchBarContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#e3eafc',
    borderRadius: 10,
    paddingHorizontal: 10,
    paddingVertical: 6,
    marginBottom: 14,
    shadowColor: '#1976D2',
    shadowOpacity: 0.08,
    shadowRadius: 4,
    elevation: 2,
  },
  searchInput: {
    flex: 1,
    fontSize: 16,
    paddingVertical: 8,
    paddingHorizontal: 12,
    backgroundColor: '#fff',
    borderRadius: 8,
    color: '#222',
  },
  searchButton: {
    backgroundColor: '#1976D2',
    borderRadius: 8,
    padding: 8,
    marginLeft: 8,
    alignItems: 'center',
    justifyContent: 'center',
  },
  clearButton: {
    backgroundColor: '#D32F2F',
    borderRadius: 8,
    padding: 8,
    marginLeft: 8,
    alignItems: 'center',
    justifyContent: 'center',
  },
  badgeMine: {
    backgroundColor: '#388E3C',
    borderRadius: 8,
    paddingHorizontal: 8,
    paddingVertical: 2,
    marginLeft: 8,
  },
  badgeMineText: {
    color: '#fff',
    fontWeight: 'bold',
    fontSize: 12,
  },
  positionBadge: {
    backgroundColor: '#1976D2',
    borderRadius: 12,
    paddingHorizontal: 10,
    paddingVertical: 4,
    alignItems: 'center',
    justifyContent: 'center',
  },
  positionBadgeText: {
    color: '#fff',
    fontWeight: 'bold',
    fontSize: 13,
  },
});

export default ClientScreen;