import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, ScrollView, TextInput, TouchableOpacity, ActivityIndicator } from 'react-native';
import axios from 'axios';

const API_URL = 'http://localhost:3000/api/v1';

export default function App() {
  const [userId, setUserId] = useState(null);
  const [credits, setCredits] = useState(0);
  const [searchType, setSearchType] = useState('personal');
  const [query, setQuery] = useState('');
  const [loading, setLoading] = useState(false);
  const [results, setResults] = useState(null);

  useEffect(() => {
    loadUserData();
  }, []);

  const loadUserData = async () => {
    try {
      // AsyncStorage থেকে userId লোড করুন
      const storedUserId = 'user_1693667000'; // Demo ID
      setUserId(storedUserId);

      const response = await axios.get(`${API_URL}/user/${storedUserId}`);
      setCredits(response.data.credits);
    } catch (error) {
      console.error('Error:', error);
    }
  };

  const performSearch = async () => {
    if (!query.trim()) {
      alert('কিছু লিখুন প্লিজ!');
      return;
    }

    setLoading(true);
    try {
      const endpoints = {
        personal: 'find-personal-info',
        business: 'find-business-info',
        product: 'find-product-info',
        health: 'find-health-info'
      };

      const requestData = {
        userId: userId,
        [searchType === 'personal' ? 'name' : 'query']: query
      };

      const response = await axios.post(
        `${API_URL}/${endpoints[searchType]}`,
        requestData
      );

      setResults(response.data);
      setCredits(response.data.creditsRemaining);
    } catch (error) {
      alert('Error: ' + error.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <ScrollView style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>🔍 Info Finder</Text>
        <Text style={styles.credits}>💳 {credits} ক্রেডিট</Text>
      </View>

      <View style={styles.section}>
        <Text style={styles.label}>কি খুঁজতে চান?</Text>
        <View style={styles.buttonGroup}>
          {['personal', 'business', 'product', 'health'].map(type => (
            <TouchableOpacity
              key={type}
              style={[styles.typeBtn, searchType === type && styles.activeBtn]}
              onPress={() => setSearchType(type)}
            >
              <Text style={styles.btnText}>
                {type === 'personal' ? '👤' : type === 'business' ? '🏢' : type === 'product' ? '🛍️' : '⚕️'}
              </Text>
            </TouchableOpacity>
          ))}
        </View>
      </View>

      <View style={styles.section}>
        <TextInput
          style={styles.input}
          placeholder="আপনার প্রশ্ন"
          value={query}
          onChangeText={setQuery}
          placeholderTextColor="#999"
        />
      </View>

      <TouchableOpacity style={styles.searchBtn} onPress={performSearch}>
        {loading ? (
          <ActivityIndicator color="white" />
        ) : (
          <Text style={styles.searchBtnText}>🔍 খুঁজুন</Text>
        )}
      </TouchableOpacity>

      {results && (
        <View style={styles.results}>
          <Text style={styles.resultTitle}>✅ ফলাফল</Text>
          <Text>{JSON.stringify(results.data, null, 2).substring(0, 500)}</Text>
        </View>
      )}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f5f5f5',
    paddingTop: 20
  },
  header: {
    backgroundColor: '#667eea',
    padding: 20,
    alignItems: 'center',
    marginBottom: 20
  },
  title: {
    fontSize: 28,
    fontWeight: 'bold',
    color: 'white'
  },
  credits: {
    fontSize: 16,
    color: 'white',
    marginTop: 10
  },
  section: {
    backgroundColor: 'white',
    padding: 20,
    marginHorizontal: 10,
    marginBottom: 15,
    borderRadius: 10
  },
  label: {
    fontSize: 16,
    fontWeight: 'bold',
    marginBottom: 10,
    color: '#333'
  },
  buttonGroup: {
    flexDirection: 'row',
    justifyContent: 'space-around'
  },
  typeBtn: {
    padding: 10,
    borderWidth: 2,
    borderColor: '#667eea',
    borderRadius: 8,
    backgroundColor: 'white',
    flex: 1,
    marginHorizontal: 5,
    alignItems: 'center'
  },
  activeBtn: {
    backgroundColor: '#667eea'
  },
  btnText: {
    fontSize: 20
  },
  input: {
    borderWidth: 1,
    borderColor: '#ddd',
    borderRadius: 8,
    padding: 12,
    fontSize: 16,
    color: '#333'
  },
  searchBtn: {
    backgroundColor: '#667eea',
    padding: 15,
    marginHorizontal: 10,
    borderRadius: 10,
    alignItems: 'center',
    marginBottom: 20
  },
  searchBtnText: {
    color: 'white',
    fontSize: 16,
    fontWeight: 'bold'
  },
  results: {
    backgroundColor: 'white',
    padding: 20,
    marginHorizontal: 10,
    borderRadius: 10,
    marginBottom: 20
  },
  resultTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: 10,
    color: '#667eea'
  }
});
