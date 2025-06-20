import React, { useState } from 'react';
import { 
  View, 
  TextInput, 
  TouchableOpacity, 
  Text, 
  Image, 
  StyleSheet,
  Alert,
  ActivityIndicator,
  ScrollView,
  Modal,
  Pressable
} from 'react-native';
import { useNavigation } from '@react-navigation/native';

const AuthScreen = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [selectedRole, setSelectedRole] = useState(null);
  const [modalVisible, setModalVisible] = useState(false);
  const navigation = useNavigation();

  const roles = [
    { id: 'admin', label: 'Administrateur' },
    { id: 'agent', label: 'Agent' }
  ];

  const handleLogin = () => {
    if (!selectedRole) {
      Alert.alert('Erreur', 'Veuillez sélectionner un rôle');
      return;
    }

    setLoading(true);

    // Simulation d'authentification
    setTimeout(() => {
      if (selectedRole === 'admin') {
        if (email !== 'admin@gmail.com' || password !== 'admin') {
          setLoading(false);
          Alert.alert('Erreur', 'Identifiants administrateur invalides');
          return;
        }
        setLoading(false);
        navigation.navigate('Admin'); // Redirection vers AdminScreen
      } else if (selectedRole === 'agent') {
        if (email !== 'agent@gmail.com' || password !== 'agent') {
          setLoading(false);
          Alert.alert('Erreur', 'Identifiants agent invalides');
          return;
        }
        setLoading(false);
        navigation.navigate('Agent'); // Redirection vers AgentScreen
      }
    }, 1000);
  };

  return (
    <ScrollView 
      contentContainerStyle={styles.container}
      keyboardShouldPersistTaps="handled"
    >
      <Image 
        source={require('../assets/logo.png')} 
        style={styles.logo} 
      />

      <Text style={styles.title}>ESPACE PROFESSIONNEL</Text>

      {/* Menu déroulant pour le rôle */}
      <TouchableOpacity
        style={styles.dropdownButton}
        onPress={() => setModalVisible(true)}
      >
        <Text style={selectedRole ? styles.dropdownButtonTextSelected : styles.dropdownButtonText}>
          {selectedRole ? roles.find(r => r.id === selectedRole).label : 'Sélectionnez votre rôle'}
        </Text>
      </TouchableOpacity>

      <Modal
        animationType="slide"
        transparent={true}
        visible={modalVisible}
        onRequestClose={() => setModalVisible(false)}
      >
        <View style={styles.modalContainer}>
          <View style={styles.modalContent}>
            {roles.map((role) => (
              <Pressable
                key={role.id}
                style={styles.roleItem}
                onPress={() => {
                  setSelectedRole(role.id);
                  setModalVisible(false);
                }}
              >
                <Text style={styles.roleItemText}>{role.label}</Text>
              </Pressable>
            ))}
          </View>
        </View>
      </Modal>

      <TextInput
        style={[styles.input, { color: '#111' }]}
        placeholder={`Email ${selectedRole || 'professionnel'}`}
        placeholderTextColor="#111"
        value={email}
        onChangeText={setEmail}
        keyboardType="email-address"
        autoCapitalize="none"
      />

      <TextInput
        style={[styles.input, { color: '#111' }]}
        placeholder="Mot de passe"
        placeholderTextColor="#111"
        value={password}
        onChangeText={setPassword}
        secureTextEntry
      />

      <TouchableOpacity 
        style={styles.loginButton}
        onPress={handleLogin}
        disabled={loading}
      >
        {loading ? (
          <ActivityIndicator color="#fff" />
        ) : (
          <Text style={styles.loginButtonText}>SE CONNECTER</Text>
        )}
      </TouchableOpacity>

      <View style={styles.separator}>
        <View style={styles.separatorLine} />
        <Text style={styles.separatorText}>OU</Text>
        <View style={styles.separatorLine} />
      </View>

      <TouchableOpacity 
        style={styles.guestButton}
        onPress={() => navigation.navigate('Client')}
      >
        <Text style={styles.guestButtonText}>ACCÈS CLIENT SANS AUTHENTIFICATION</Text>
      </TouchableOpacity>
    </ScrollView>
  );
};

// ... (les styles restent identiques)
  const styles = StyleSheet.create({
    container: {
      flexGrow: 1,
      backgroundColor: '#F5F5F5',
      padding: 25,
      paddingTop: 50,
      alignItems: 'center',
    },
    logo: {
      width: 100,
      height: 100,
      marginBottom: 30,
    },
    title: {
      fontSize: 18,
      fontWeight: 'bold',
      color: '#111',
      marginBottom: 30,
      letterSpacing: 1,
    },
    dropdownButton: {
      width: '100%',
      height: 50,
      backgroundColor: '#FFF',
      borderWidth: 1,
      borderColor: '#DDD',
      borderRadius: 8,
      justifyContent: 'center',
      paddingHorizontal: 15,
      marginBottom: 15,
    },
    dropdownButtonText: {
      color: '#111',
      fontSize: 16,
    },
    dropdownButtonTextSelected: {
      color: '#111',
      fontSize: 16,
    },
    modalContainer: {
      flex: 1,
      justifyContent: 'center',
      alignItems: 'center',
      backgroundColor: 'rgba(0,0,0,0.5)',
    },
    modalContent: {
      width: '80%',
      backgroundColor: 'white',
      borderRadius: 10,
      padding: 20,
    },
    roleItem: {
      paddingVertical: 15,
      borderBottomWidth: 1,
      borderBottomColor: '#EEE',
    },
    roleItemText: {
      fontSize: 16,
      color: '#111',
    },
    input: {
      width: '100%',
      height: 50,
      backgroundColor: '#FFF',
      borderWidth: 1,
      borderColor: '#DDD',
      borderRadius: 8,
      paddingHorizontal: 15,
      marginBottom: 15,
      fontSize: 16,
    },
    loginButton: {
      width: '100%',
      height: 50,
      backgroundColor: '#0D47A1',
      borderRadius: 8,
      justifyContent: 'center',
      alignItems: 'center',
      marginTop: 10,
    },
    loginButtonText: {
      color: '#FFF',
      fontWeight: 'bold',
      fontSize: 16,
    },
    separator: {
      width: '100%',
      flexDirection: 'row',
      alignItems: 'center',
      marginVertical: 25,
    },
    separatorLine: {
      flex: 1,
      height: 1,
      backgroundColor: '#DDD',
    },
    separatorText: {
      width: 50,
      textAlign: 'center',
      color: '#111',
    },
    guestButton: {
      width: '100%',
      paddingVertical: 15,
      borderWidth: 1,
      borderColor: '#0D47A1',
      borderRadius: 8,
      justifyContent: 'center',
      alignItems: 'center',
    },
    guestButtonText: {
      color: '#0D47A1',
      fontWeight: 'bold',
      fontSize: 14,
      textAlign: 'center',
    },
  });

  export default AuthScreen;