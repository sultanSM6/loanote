import React, { useState } from 'react';
import { View, Text, StyleSheet, ScrollView, TextInput, TouchableOpacity, FlatList, Alert } from 'react-native';
import { AppRegistry } from 'react-native';

// Empty initial data array
const initialData = [];

const FinanceTrackerApp = () => {
  const [data, setData] = useState(initialData);
  const [expandedIndex, setExpandedIndex] = useState(null);
  const [newContact, setNewContact] = useState({ name: '', phone: '', amount: '' });
  const [isContactsVisible, setIsContactsVisible] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [newAmounts, setNewAmounts] = useState({});
  const [isAddContactExpanded, setIsAddContactExpanded] = useState(false);
  const [menuVisibleId, setMenuVisibleId] = useState(null);

  const calculateSummary = () => {
    const gaven = data.filter(item => item.amount < 0).reduce((acc, item) => acc + item.amount, 0);
    const taken = data.filter(item => item.amount > 0).reduce((acc, item) => acc + item.amount, 0);
    const overall = gaven + taken;
    return { gaven, taken, overall };
  };

  const { gaven, taken, overall } = calculateSummary();

  const toggleExpand = (index) => {
    setExpandedIndex(expandedIndex === index ? null : index);
  };

  const handleUpdate = (index, key, value) => {
    const contactId = filteredData[index].id;
    const newData = data.map(item => item.id === contactId ? { ...item, [key]: value } : item);
    setData(newData);
  };

  const applyNewAmount = (index, isGaven) => {
    const contactId = filteredData[index].id;
    const newData = data.map(item => {
      if (item.id === contactId) {
        const newAmountValue = newAmounts[index] || '0';
        const numValue = parseFloat(newAmountValue) || 0;
        if (numValue === 0) {
          Alert.alert("Error", "Please enter a valid amount");
          return item;
        }
        const amountToApply = isGaven ? -Math.abs(numValue) : Math.abs(numValue);
        const updatedAmount = item.amount + amountToApply;
        return {
          ...item,
          amount: updatedAmount,
          color: updatedAmount >= 0 ? '#66DE93' : '#FF4D4D',
          history: [
            ...item.history,
            {
              amount: amountToApply,
              type: isGaven ? 'Gaven' : 'Taken',
              date: new Date().toLocaleString()
            }
          ]
        };
      }
      return item;
    });
    setData(newData);
    setNewAmounts(prev => {
      const updated = { ...prev };
      delete updated[index];
      return updated;
    });
  };

  // addContact now includes validations for name, phone, and amount fields.
  const addContact = (type) => {
    // Validate name: must not be empty and only letters (and spaces)
    if (!newContact.name.trim()) {
      Alert.alert("Error", "Please enter a name");
      return;
    }
    const nameRegex = /^[A-Za-z\s]+$/;
    if (!nameRegex.test(newContact.name.trim())) {
      Alert.alert("Error", "Name must contain only letters and spaces");
      return;
    }

    // Validate phone: must not be empty and contain only digits (with an optional leading '+')
    if (!newContact.phone.trim()) {
      Alert.alert("Error", "Please enter a phone number");
      return;
    }
    const phoneRegex = /^\+?\d+$/;
    if (!phoneRegex.test(newContact.phone.trim())) {
      Alert.alert("Error", "Phone number must contain only numbers");
      return;
    }

    // Validate amount: must not be empty and a positive real number
    if (!newContact.amount.trim()) {
      Alert.alert("Error", "Please enter an amount");
      return;
    }
    const enteredAmount = parseFloat(newContact.amount);
    if (isNaN(enteredAmount) || enteredAmount <= 0) {
      Alert.alert("Error", "Amount must be a positive number");
      return;
    }
    
    // For Gaven, store as negative; for Taken, as positive.
    const amount = type === "Gaven" ? -Math.abs(enteredAmount) : Math.abs(enteredAmount);
    const color = amount >= 0 ? '#66DE93' : '#FF4D4D';
    const id = (new Date().getTime()).toString();
    setData([...data, { 
      id, 
      name: newContact.name.trim(),
      phone: newContact.phone.trim(),
      amount, 
      color, 
      history: [{
        amount: amount,
        type: type,
        date: new Date().toLocaleString()
      }]
    }]);
    
    setNewContact({ name: '', phone: '', amount: '' });
    setIsAddContactExpanded(false);
  };

  const handleDeleteContact = (contactId) => {
    Alert.alert(
      "Confirm Delete",
      "Are you sure you want to delete this contact?",
      [
        { 
          text: "Cancel", 
          style: "cancel", 
          onPress: () => setMenuVisibleId(null) 
        },
        { 
          text: "Delete", 
          style: "destructive", 
          onPress: () => {
            setData(prevData => prevData.filter(item => item.id !== contactId));
            setMenuVisibleId(null);
          } 
        }
      ]
    );
  };

  const filteredData = data.filter(item => 
    item.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    item.phone.includes(searchQuery)
  );

  return (
    <ScrollView style={styles.container}>
      <View>
        <Text style={styles.overallBalance}>
          {overall.toLocaleString('tr-TR')} ₺
        </Text>
        <Text style={styles.subtitle}>Overall balance</Text>

        <View style={styles.summaryContainer}>
          <View style={styles.expenseCard}>
            <Text style={styles.cardTitle}>Gaven</Text>
            <Text style={styles.expenseAmount}>
              {gaven.toLocaleString('tr-TR')} ₺
            </Text>
          </View>
          <View style={styles.incomeCard}>
            <Text style={styles.cardTitle}>Taken</Text>
            <Text style={styles.incomeAmount}>
              {taken.toLocaleString('tr-TR')} ₺
            </Text>
          </View>
        </View>
      </View>

      <TouchableOpacity 
        style={styles.contactsToggle} 
        onPress={() => setIsContactsVisible(!isContactsVisible)}
      >
        <Text style={styles.contactsToggleText}>
          {isContactsVisible ? "Hide Contacts" : "Show Contacts"}
        </Text>
      </TouchableOpacity>

      {isContactsVisible && (
        <>
          <View style={styles.searchContainer}>
            <TextInput
              style={styles.searchInput}
              placeholder="Search contacts..."
              value={searchQuery}
              onChangeText={setSearchQuery}
            />
          </View>

          {filteredData.map((item, index) => (
            <View key={item.id} style={styles.card}>
              <View style={styles.cardHeader}>
                <TouchableOpacity onPress={() => toggleExpand(index)} style={{ flex: 1 }}>
                  <View>
                    <Text style={styles.name}>{item.name}</Text>
                    <Text style={styles.phone}>{item.phone}</Text>
                  </View>
                </TouchableOpacity>
                <View style={styles.amountContainer}>
                  <Text style={[styles.amount, { color: item.color }]}>
                    {item.amount.toLocaleString('tr-TR')} ₺
                  </Text>
                  <TouchableOpacity 
                    onPress={() => setMenuVisibleId(menuVisibleId === item.id ? null : item.id)}
                    style={{ paddingHorizontal: 8 }}
                  >
                    <Text style={styles.threeDots}>⋮</Text>
                  </TouchableOpacity>
                </View>
              </View>

              {menuVisibleId === item.id && (
                <View style={styles.menuContainer}>
                  <TouchableOpacity 
                    onPress={() => handleDeleteContact(item.id)}
                    style={styles.deleteButton}
                  >
                    <Text style={styles.deleteButtonText}>DELETE contact</Text>
                  </TouchableOpacity>
                </View>
              )}

              {expandedIndex === index && (
                <View style={styles.details}>
                  <TextInput
                    style={styles.input}
                    value={item.name}
                    onChangeText={(text) => handleUpdate(index, 'name', text)}
                    placeholder="Name"
                  />
                  <TextInput
                    style={styles.input}
                    value={item.phone}
                    onChangeText={(text) => handleUpdate(index, 'phone', text)}
                    placeholder="Phone"
                  />
                  <View style={styles.amountInputContainer}>
                    <TextInput
                      style={[styles.amountInput, { color: item.color }]}
                      value={item.amount.toString()}
                      editable={false}
                      placeholder="Current Amount"
                    />
                    <TextInput
                      style={styles.newAmountInput}
                      placeholder="Add new amount"
                      value={newAmounts[index] || ''}
                      onChangeText={(text) => {
                        setNewAmounts(prev => ({ ...prev, [index]: text }));
                      }}
                      keyboardType='numeric'
                    />
                  </View>

                  <View style={styles.buttonContainer}>
                    <TouchableOpacity 
                      onPress={() => applyNewAmount(index, true)} 
                      style={styles.gavenButton}
                    >
                      <Text style={styles.buttonText}>Gaven</Text>
                    </TouchableOpacity>
                    <TouchableOpacity 
                      onPress={() => applyNewAmount(index, false)} 
                      style={styles.takenButton}
                    >
                      <Text style={styles.buttonText}>Taken</Text>
                    </TouchableOpacity>
                  </View>

                  {item.history.length > 0 && (
                    <View style={styles.historySection}>
                      <Text style={styles.historyTitle}>Transaction History</Text>
                      <FlatList
                        data={item.history}
                        keyExtractor={(_, idx) => idx.toString()}
                        renderItem={({ item }) => (
                          <View style={styles.historyItem}>
                            <Text style={styles.historyText}>
                              {item.date}
                            </Text>
                            <Text style={[
                              styles.historyAmount, 
                              { color: item.type === 'Gaven' ? '#FF4D4D' : '#66DE93' }
                            ]}>
                              {item.type}: {item.amount.toLocaleString('tr-TR')} ₺
                            </Text>
                          </View>
                        )}
                      />
                    </View>
                  )}
                </View>
              )}
            </View>
          ))}

          <View style={styles.newContactContainer}>
            <TouchableOpacity 
              style={styles.addContactHeader} 
              onPress={() => setIsAddContactExpanded(!isAddContactExpanded)}
            >
              <Text style={styles.sectionTitle}>Add New Contact</Text>
              <Text style={styles.toggleIcon}>
                {isAddContactExpanded ? '▲' : '▼'}
              </Text>
            </TouchableOpacity>

            {isAddContactExpanded && (
              <>
                <TextInput
                  style={styles.input}
                  placeholder='Name'
                  value={newContact.name}
                  onChangeText={(text) => setNewContact({ ...newContact, name: text })}
                />
                <TextInput
                  style={styles.input}
                  placeholder='Phone'
                  value={newContact.phone}
                  onChangeText={(text) => setNewContact({ ...newContact, phone: text })}
                  keyboardType='phone-pad'
                />
                <TextInput
                  style={styles.input}
                  placeholder='Amount'
                  value={newContact.amount}
                  onChangeText={(text) => setNewContact({ ...newContact, amount: text })}
                  keyboardType='numeric'
                />
                <View style={styles.buttonContainer}>
                  <TouchableOpacity onPress={() => addContact('Gaven')} style={styles.gavenButton}>
                    <Text style={styles.buttonText}>Gaven</Text>
                  </TouchableOpacity>
                  <TouchableOpacity onPress={() => addContact('Taken')} style={styles.takenButton}>
                    <Text style={styles.buttonText}>Taken</Text>
                  </TouchableOpacity>
                </View>
              </>
            )}
          </View>
        </>
      )}
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: { 
    padding: 20, 
    backgroundColor: '#F5F5F5' 
  },
  searchContainer: {
    marginBottom: 15,
  },
  searchInput: {
    backgroundColor: '#FFF',
    padding: 12,
    borderRadius: 8,
    fontSize: 16,
    borderWidth: 1,
    borderColor: '#E0E0E0',
  },
  contactsToggle: {
    alignSelf: 'center',
    marginVertical: 15,
    backgroundColor: '#007AFF',
    paddingVertical: 8,
    paddingHorizontal: 16,
    borderRadius: 20,
  },
  contactsToggleText: {
    color: '#FFF',
    fontSize: 16,
    fontWeight: '500',
  },
  overallBalance: {
    fontSize: 36,
    fontWeight: 'bold',
    textAlign: 'center',
    marginBottom: 5
  },
  subtitle: {
    textAlign: 'center',
    fontSize: 16,
    color: '#7D7D7D',
    marginBottom: 20
  },
  summaryContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 10
  },
  expenseCard: {
    backgroundColor: '#FFF',
    padding: 20,
    borderRadius: 10,
    width: '48%',
    elevation: 2,
  },
  incomeCard: {
    backgroundColor: '#FFF',
    padding: 20,
    borderRadius: 10,
    width: '48%',
    elevation: 2,
  },
  cardTitle: {
    fontSize: 18,
    color: '#7D7D7D'
  },
  expenseAmount: {
    fontSize: 24,
    color: '#FF4D4D',
    fontWeight: 'bold'
  },
  incomeAmount: {
    fontSize: 24,
    color: '#66DE93',
    fontWeight: 'bold'
  },
  card: { 
    backgroundColor: '#FFF', 
    padding: 15, 
    marginBottom: 10, 
    borderRadius: 10,
    elevation: 2,
  },
  cardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  amountContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  threeDots: {
    fontSize: 20,
    color: '#000',
  },
  name: { 
    fontSize: 18, 
    fontWeight: 'bold' 
  },
  phone: { 
    fontSize: 16, 
    color: '#7D7D7D' 
  },
  amount: { 
    fontSize: 18, 
    fontWeight: 'bold'
  },
  menuContainer: {
    backgroundColor: '#FFF',
    padding: 10,
    borderRadius: 5,
    borderWidth: 1,
    borderColor: '#ccc',
    alignSelf: 'flex-end',
    marginTop: 5,
    marginBottom: 5,
  },
  deleteButton: {
    paddingVertical: 5,
  },
  deleteButtonText: {
    color: '#FF4D4D',
    fontWeight: 'bold',
  },
  details: { 
    marginTop: 15,
    paddingTop: 15,
    borderTopWidth: 1,
    borderTopColor: '#E0E0E0',
  },
  input: { 
    fontSize: 16, 
    borderBottomWidth: 1, 
    marginBottom: 15,
    paddingVertical: 8,
    borderColor: '#D0D0D0',
  },
  amountInputContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 15,
  },
  amountInput: {
    fontSize: 16,
    borderBottomWidth: 1,
    paddingVertical: 8,
    borderColor: '#D0D0D0',
    flex: 1,
    marginRight: 10,
    fontWeight: 'bold',
  },
  newAmountInput: {
    fontSize: 16,
    borderBottomWidth: 1,
    paddingVertical: 8,
    borderColor: '#D0D0D0',
    flex: 1,
  },
  buttonContainer: { 
    flexDirection: 'row', 
    justifyContent: 'space-between',
    marginBottom: 15,
    gap: 10
  },
  gavenButton: { 
    backgroundColor: '#FF4D4D', 
    padding: 10, 
    borderRadius: 5, 
    flex: 1
  },
  takenButton: { 
    backgroundColor: '#66DE93', 
    padding: 10, 
    borderRadius: 5, 
    flex: 1
  },
  addButton: { 
    backgroundColor: '#007AFF', 
    padding: 12, 
    borderRadius: 5, 
    marginTop: 10 
  },
  buttonText: { 
    color: '#FFF', 
    textAlign: 'center',
    fontWeight: '500',
  },
  sectionTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    marginBottom: 15,
    color: '#333',
  },
  historySection: {
    marginTop: 10,
  },
  historyTitle: { 
    fontWeight: 'bold', 
    marginBottom: 10,
    fontSize: 16,
  },
  historyItem: {
    flexDirection: 'column',
    marginBottom: 8,
    paddingBottom: 8,
    borderBottomWidth: 1,
    borderBottomColor: '#F0F0F0',
  },
  historyText: { 
    fontSize: 14, 
    color: '#7D7D7D',
  },
  historyAmount: {
    fontSize: 15,
    fontWeight: '500',
  },
  newContactContainer: { 
    marginTop: 25,
    padding: 15,
    backgroundColor: '#FFF',
    borderRadius: 10,
    elevation: 2,
  },
  addContactHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  toggleIcon: {
    fontSize: 18,
    color: '#007AFF',
  }
});

// Register the main component
AppRegistry.registerComponent('main', () => FinanceTrackerApp);

export default FinanceTrackerApp;
