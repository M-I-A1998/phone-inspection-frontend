import React, { useState } from 'react';
import { View, Text, StyleSheet, TextInput, TouchableOpacity, FlatList, ActivityIndicator } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Search as SearchIcon, Smartphone, X } from 'lucide-react-native';
import { useRouter } from 'expo-router';
import Colors from '@/constants/Colors';
import { searchDevices } from '@/api/devices';

type SearchResult = {
  id: string;
  imei: string;
  serialNumber: string;
  labelNumber: string;
  brand: string;
  model: string;
  orderId: string;
  inspectionDate: string;
};

export default function SearchScreen() {
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState<SearchResult[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [hasSearched, setHasSearched] = useState(false);
  const router = useRouter();

  const handleSearch = async () => {
    if (!searchQuery.trim()) return;
    
    setIsLoading(true);
    try {
      const results = await searchDevices(searchQuery);
      setSearchResults(results);
      setHasSearched(true);
    } catch (error) {
      console.error('Search error:', error);
      // In a real app, show error to user
    } finally {
      setIsLoading(false);
    }
  };

  const handleClearSearch = () => {
    setSearchQuery('');
    setSearchResults([]);
    setHasSearched(false);
  };

  const handleSelectDevice = (device: SearchResult) => {
    router.push(`/device/${device.id}`);
  };

  return (
    <SafeAreaView style={styles.container} edges={['right', 'left']}>
      <View style={styles.searchContainer}>
        <View style={styles.searchInputContainer}>
          <SearchIcon size={20} color={Colors.gray[500]} style={styles.searchIcon} />
          <TextInput
            style={styles.searchInput}
            placeholder="Search by IMEI, Serial, Label, or Order #"
            value={searchQuery}
            onChangeText={setSearchQuery}
            onSubmitEditing={handleSearch}
            returnKeyType="search"
          />
          {searchQuery.length > 0 && (
            <TouchableOpacity onPress={handleClearSearch} style={styles.clearButton}>
              <X size={18} color={Colors.gray[500]} />
            </TouchableOpacity>
          )}
        </View>
        <TouchableOpacity 
          style={styles.searchButton} 
          onPress={handleSearch}
          disabled={!searchQuery.trim() || isLoading}
        >
          <Text style={styles.searchButtonText}>Search</Text>
        </TouchableOpacity>
      </View>

      {isLoading ? (
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={Colors.primary} />
          <Text style={styles.loadingText}>Searching devices...</Text>
        </View>
      ) : hasSearched ? (
        searchResults.length > 0 ? (
          <FlatList
            data={searchResults}
            keyExtractor={(item) => item.id}
            contentContainerStyle={styles.resultsContainer}
            renderItem={({ item }) => (
              <TouchableOpacity 
                style={styles.resultCard}
                onPress={() => handleSelectDevice(item)}
              >
                <View style={styles.resultIconContainer}>
                  <Smartphone size={24} color={Colors.primary} />
                </View>
                <View style={styles.resultContent}>
                  <Text style={styles.resultTitle}>{item.brand} {item.model}</Text>
                  <Text style={styles.resultDetail}>IMEI: {item.imei}</Text>
                  <Text style={styles.resultDetail}>Serial: {item.serialNumber}</Text>
                  {item.labelNumber && (
                    <Text style={styles.resultDetail}>Label: {item.labelNumber}</Text>
                  )}
                  <View style={styles.resultMeta}>
                    <Text style={styles.resultOrderId}>Order: {item.orderNumber}</Text>
                    <Text style={styles.resultDate}>{item.inspectionDate}</Text>
                  </View>
                </View>
              </TouchableOpacity>
            )}
          />
        ) : (
          <View style={styles.noResultsContainer}>
            <Text style={styles.noResultsText}>No devices found</Text>
            <Text style={styles.noResultsSubtext}>
              Try searching with a different IMEI, serial number, label number, or order ID
            </Text>
          </View>
        )
      ) : (
        <View style={styles.initialStateContainer}>
          <Text style={styles.initialStateText}>
            Search for a device by IMEI, Serial Number, Label Number, or Order Number
          </Text>
        </View>
      )}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.gray[100],
    padding: 16,
  },
  searchContainer: {
    flexDirection: 'row',
    marginBottom: 16,
  },
  searchInputContainer: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.white,
    borderRadius: 8,
    paddingHorizontal: 12,
    height: 48,
    borderWidth: 1,
    borderColor: Colors.gray[300],
    marginRight: 8,
  },
  searchIcon: {
    marginRight: 8,
  },
  searchInput: {
    flex: 1,
    height: '100%',
    fontFamily: 'Inter-Regular',
    fontSize: 16,
    color: Colors.gray[900],
  },
  clearButton: {
    padding: 4,
  },
  searchButton: {
    backgroundColor: Colors.primary,
    borderRadius: 8,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 16,
    height: 48,
  },
  searchButtonText: {
    fontFamily: 'Inter-Medium',
    color: Colors.white,
    fontSize: 16,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    fontFamily: 'Inter-Regular',
    fontSize: 16,
    color: Colors.gray[600],
    marginTop: 16,
  },
  initialStateContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 32,
  },
  initialStateText: {
    fontFamily: 'Inter-Regular',
    fontSize: 16,
    color: Colors.gray[600],
    textAlign: 'center',
    lineHeight: 24,
  },
  noResultsContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 32,
  },
  noResultsText: {
    fontFamily: 'Inter-Bold',
    fontSize: 18,
    color: Colors.gray[900],
    marginBottom: 8,
  },
  noResultsSubtext: {
    fontFamily: 'Inter-Regular',
    fontSize: 16,
    color: Colors.gray[600],
    textAlign: 'center',
    lineHeight: 24,
  },
  resultsContainer: {
    paddingBottom: 16,
  },
  resultCard: {
    flexDirection: 'row',
    backgroundColor: Colors.white,
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 8,
    elevation: 2,
  },
  resultIconContainer: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: Colors.gray[100],
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 16,
  },
  resultContent: {
    flex: 1,
  },
  resultTitle: {
    fontFamily: 'Inter-Bold',
    fontSize: 16,
    color: Colors.gray[900],
    marginBottom: 4,
  },
  resultDetail: {
    fontFamily: 'Inter-Regular',
    fontSize: 14,
    color: Colors.gray[700],
    marginBottom: 2,
  },
  resultMeta: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: 8,
  },
  resultOrderId: {
    fontFamily: 'Inter-Medium',
    fontSize: 12,
    color: Colors.primary,
  },
  resultDate: {
    fontFamily: 'Inter-Regular',
    fontSize: 12,
    color: Colors.gray[500],
  },
});