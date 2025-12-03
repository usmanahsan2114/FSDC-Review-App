import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import ThemeToggle from '@/components/ThemeToggle';
import { useSync } from '@/contexts/SyncProvider';
import { useTheme } from '@/contexts/ThemeContext';
import { useThemeColor } from '@/hooks/use-theme-color';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { router } from 'expo-router';
import React, { useEffect, useState } from 'react';
import { Alert, ScrollView, StyleSheet, TouchableOpacity, View } from 'react-native';
import { Button, Card, IconButton, TextInput } from 'react-native-paper';

import AdminLogin from '@/components/AdminLogin';
import { Simulator } from '@/constants/simulators';
import { clearCorruptedStorage, importReviews } from '../utils/dataStorage';
import { hp, rf, rs, wp } from '../utils/responsive';
import { getSimulators, getSimulatorTypes, saveSimulators, saveSimulatorTypes } from '../utils/simulatorStorage';

const seedReviews = require('../assets/data/seed_reviews.json');
interface RatingCategory {
  id: string;
  key: string;
  title: string;
  description: string;
}

interface PersonalInfoField {
  id: string;
  key: string;
  label: string;
  placeholder: string;
  required: boolean;
  type: 'text' | 'email' | 'phone' | 'multiline' | 'yesno' | 'scroll';
  options?: string[]; // For scroll field type
  yesNoValues?: { yes: string; no: string }; // For customizable Yes/No values
}

const defaultRatingCategories: RatingCategory[] = [
  { id: '1',  key: 'cockpitRealismLayout',            title: 'Cockpit realism & layout',               description: '' },
  { id: '2',  key: 'visualQualityFOV',                title: 'Visual quality & field of view',         description: '' },
  { id: '3',  key: 'controlLoadingRealism',           title: 'Control loading realism (force feedback)', description: '' },
  { id: '4',  key: 'motionFidelity',                  title: 'Motion fidelity (6-DOF cues & response)', description: '' },
  { id: '5',  key: 'aerodynamicResponse',             title: 'Aerodynamic response & flight feel',      description: '' },
  { id: '6',  key: 'instrumentSwitchFunctionality',   title: 'Instrument & switch functionality',       description: '' },
  { id: '7',  key: 'visualMotionSync',                title: 'Visual-motion synchronization',           description: '' },
  { id: '8',  key: 'instructorControlTrainingFlow',   title: 'Instructor control & training flow',      description: '' },
  { id: '9',  key: 'aircraftBehaviorMatch',           title: 'Aircraft behavior matches real flight characteristics', description: '' },
  { id: '10', key: 'soundVibrationRealism',           title: 'Sound & vibration realism',               description: '' },
  { id: '11', key: 'overallImmersionRealism',         title: 'Overall immersion & realism',             description: '' },
];

const defaultPersonalInfoFields: PersonalInfoField[] = [
  {
    id: '1',
    key: 'fullName',
    label: 'Full Name',
    placeholder: 'Enter your full name',
    required: true,
    type: 'text'
  },
  {
    id: '2',
    key: 'nationality',
    label: 'Nationality',
    placeholder: 'Select your nationality',
    required: true,
    type: 'text'
  },
  {
    id: '3',
    key: 'profession',
    label: 'Profession / Industry',
    placeholder: 'Enter your profession or industry',
    required: true,
    type: 'text'
  },
  {
    id: '4',
    key: 'previousSimulatorExperience',
    label: 'Previous Simulator Experience',
    placeholder: '',
    required: false,
    type: 'yesno',
    yesNoValues: { yes: 'Yes', no: 'No' }
  },
  {
    id: '5',
    key: 'previousFlyingExperience',
    label: 'Previous Flying Experience',
    placeholder: '',
    required: false,
    type: 'yesno',
    yesNoValues: { yes: 'Yes', no: 'No' }
  },
  {
    id: '6',
    key: 'contact',
    label: 'Contact Information',
    placeholder: 'Enter your email or phone',
    required: false,
    type: 'email'
  }
];

export default function AdminQuestionsScreen() {
  const { isDark, colors } = useTheme();
  const { syncReviews } = useSync();
  const backgroundColor = useThemeColor({}, 'background');
  const textColor = useThemeColor({}, 'text');
  const borderColor = useThemeColor({ light: '#E0E0E0', dark: '#404040' }, 'text');
  const cardBackgroundColor = useThemeColor({ light: '#FFFFFF', dark: '#1E1E1E' }, 'background');

  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [ratingCategories, setRatingCategories] = useState<RatingCategory[]>(defaultRatingCategories);
  const [editingCategory, setEditingCategory] = useState<string | null>(null);
  const [personalInfoFields, setPersonalInfoFields] = useState<PersonalInfoField[]>(defaultPersonalInfoFields);
  const [editingPersonalField, setEditingPersonalField] = useState<string | null>(null);
  const [hasChanges, setHasChanges] = useState(false);
  const [activeTab, setActiveTab] = useState<'ratings' | 'personal' | 'simulators'>('ratings');

  // Simulator State
  const [simulators, setSimulators] = useState<Simulator[]>([]);
  const [simulatorTypes, setSimulatorTypes] = useState<string[]>([]);
  const [editingSimulator, setEditingSimulator] = useState<string | null>(null);
  const [editingSimType, setEditingSimType] = useState<string | null>(null);

  // Load saved data on component mount
  useEffect(() => {
    loadRatingCategories();
    loadPersonalInfoFields();
    loadSimulatorData();
  }, []);

  const loadSimulatorData = async () => {
    const sims = await getSimulators();
    const types = await getSimulatorTypes();
    setSimulators(sims);
    setSimulatorTypes(types);
  };

  const loadRatingCategories = async () => {
    try {
      const saved = await AsyncStorage.getItem('admin_rating_categories');
      if (saved) {
        const parsed = JSON.parse(saved);
        const expectedKeys = new Set(defaultRatingCategories.map(c => c.key));
        const isMismatch = !Array.isArray(parsed) || parsed.length !== defaultRatingCategories.length || parsed.some((c: any) => !expectedKeys.has(c.key));
        if (isMismatch) {
          await AsyncStorage.setItem('admin_rating_categories', JSON.stringify(defaultRatingCategories));
          await AsyncStorage.setItem('ratingCategories', JSON.stringify(defaultRatingCategories));
          setRatingCategories(defaultRatingCategories);
        } else {
          setRatingCategories(parsed);
        }
      } else {
        await AsyncStorage.setItem('admin_rating_categories', JSON.stringify(defaultRatingCategories));
        await AsyncStorage.setItem('ratingCategories', JSON.stringify(defaultRatingCategories));
        setRatingCategories(defaultRatingCategories);
      }
    } catch (error) {
      console.error('Error loading rating categories:', error);
    }
  };

  const loadPersonalInfoFields = async () => {
    try {
      const saved = await AsyncStorage.getItem('admin_personal_info_fields');
      if (saved) {
        setPersonalInfoFields(JSON.parse(saved));
      }
    } catch (error) {
      console.error('Error loading personal info fields:', error);
    }
  };

  const saveRatingCategories = async () => {
    try {
      await AsyncStorage.setItem('admin_rating_categories', JSON.stringify(ratingCategories));
      await AsyncStorage.setItem('ratingCategories', JSON.stringify(ratingCategories));
      setHasChanges(false);
      Alert.alert('Success', 'Rating categories saved successfully!');
    } catch (error) {
      console.error('Error saving rating categories:', error);
      Alert.alert('Error', 'Failed to save rating categories');
    }
  };

  const savePersonalInfoFields = async () => {
    try {
      await AsyncStorage.setItem('admin_personal_info_fields', JSON.stringify(personalInfoFields));
      await AsyncStorage.setItem('personalInfoFields', JSON.stringify(personalInfoFields));
      setHasChanges(false);
      Alert.alert('Success', 'Personal information fields saved successfully!');
    } catch (error) {
      console.error('Error saving personal info fields:', error);
      Alert.alert('Error', 'Failed to save personal info fields');
    }
  };

  const saveAllChanges = async () => {
    try {
      await AsyncStorage.setItem('admin_rating_categories', JSON.stringify(ratingCategories));
      await AsyncStorage.setItem('ratingCategories', JSON.stringify(ratingCategories));
      await AsyncStorage.setItem('admin_personal_info_fields', JSON.stringify(personalInfoFields));
      await AsyncStorage.setItem('personalInfoFields', JSON.stringify(personalInfoFields));
      setHasChanges(false);
      Alert.alert('Success', 'All changes saved successfully!');
    } catch (error) {
      console.error('Error saving changes:', error);
      Alert.alert('Error', 'Failed to save changes');
    }
  };

  const saveSimulatorChanges = async () => {
    try {
      await saveSimulators(simulators);
      await saveSimulatorTypes(simulatorTypes);
      setHasChanges(false);
      Alert.alert('Success', 'Simulator data saved successfully!');
    } catch (error) {
      console.error('Error saving simulator data:', error);
      Alert.alert('Error', 'Failed to save simulator data');
    }
  };

  const resetToDefaults = () => {
    Alert.alert(
      'Reset to Defaults',
      'Are you sure you want to reset all Rating Categories and Personal Info Fields to default values? This cannot be undone.',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Reset',
          style: 'destructive',
          onPress: () => {
            setRatingCategories(defaultRatingCategories);
            setPersonalInfoFields(defaultPersonalInfoFields);
            setHasChanges(true);
          }
        }
      ]
    );
  };

  const updateCategory = (id: string, field: 'title' | 'description', value: string) => {
    setRatingCategories(prev => 
      prev.map(cat => 
        cat.id === id ? { ...cat, [field]: value } : cat
      )
    );
    setHasChanges(true);
  };

  const updatePersonalField = (id: string, field: keyof PersonalInfoField, value: any) => {
    setPersonalInfoFields(prev => 
      prev.map(field_item => 
        field_item.id === id ? { ...field_item, [field]: value } : field_item
      )
    );
    setHasChanges(true);
  };

  const addNewCategory = () => {
    const newId = Date.now().toString();
    const newCategory: RatingCategory = {
      id: newId,
      key: `custom_${newId}`,
      title: 'New Rating Category',
      description: 'Description for the new rating category'
    };
    setRatingCategories(prev => [...prev, newCategory]);
    setEditingCategory(newId);
    setHasChanges(true);
  };

  const addNewPersonalField = () => {
    const newId = Date.now().toString();
    const newField: PersonalInfoField = {
      id: newId,
      key: 'newField',
      label: 'New Field',
      placeholder: 'Enter new field',
      required: false,
      type: 'text'
    };
    setPersonalInfoFields(prev => [...prev, newField]);
    setEditingPersonalField(newId);
    setHasChanges(true);
  };

  const deleteCategory = (id: string) => {
    Alert.alert(
      'Delete Category',
      'Are you sure you want to delete this rating category?',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: () => {
            setRatingCategories(prev => prev.filter(cat => cat.id !== id));
            setHasChanges(true);
          }
        }
      ]
    );
  };

  // Simulator Management Functions
  const addNewSimulator = () => {
    const newId = Date.now().toString();
    const newSim: Simulator = {
      id: newId,
      name: 'New Simulator',
      type: simulatorTypes[0] || 'Generic',
    };
    setSimulators(prev => [...prev, newSim]);
    setEditingSimulator(newId);
    setHasChanges(true);
  };

  const updateSimulator = (id: string, name: string) => {
    setSimulators(prev => prev.map(s => s.id === id ? { ...s, name } : s));
    setHasChanges(true);
  };

  const deleteSimulator = (id: string) => {
    Alert.alert('Delete Simulator', 'Are you sure?', [
      { text: 'Cancel', style: 'cancel' },
      { text: 'Delete', style: 'destructive', onPress: () => {
        setSimulators(prev => prev.filter(s => s.id !== id));
        setHasChanges(true);
      }}
    ]);
  };

  const addNewSimType = () => {
    setSimulatorTypes(prev => [...prev, 'New Type']);
    setEditingSimType('New Type');
    setHasChanges(true);
  };

  const updateSimType = (index: number, value: string) => {
    setSimulatorTypes(prev => {
      const newTypes = [...prev];
      newTypes[index] = value;
      return newTypes;
    });
    setHasChanges(true);
  };

  const deleteSimType = (index: number) => {
    Alert.alert('Delete Type', 'Are you sure?', [
      { text: 'Cancel', style: 'cancel' },
      { text: 'Delete', style: 'destructive', onPress: () => {
        setSimulatorTypes(prev => prev.filter((_, i) => i !== index));
        setHasChanges(true);
      }}
    ]);
  };

  const deletePersonalField = (id: string) => {
    Alert.alert(
      'Delete Field',
      'Are you sure you want to delete this field?',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: () => {
            setPersonalInfoFields(prev => prev.filter(field => field.id !== id));
            setHasChanges(true);
          }
        }
      ]
    );
  };

  const handleGoBack = () => {
    if (hasChanges) {
      Alert.alert(
        'Unsaved Changes',
        'You have unsaved changes. Do you want to save them before leaving?',
        [
          { text: 'Discard', style: 'destructive', onPress: () => router.back() },
          { text: 'Cancel', style: 'cancel' },
          { text: 'Save', onPress: () => { saveRatingCategories(); router.back(); } }
        ]
      );
    } else {
      router.back();
    }
  };

  const styles = createStyles(backgroundColor, textColor, borderColor, cardBackgroundColor);

  if (!isAuthenticated) {
    return <AdminLogin onLogin={() => setIsAuthenticated(true)} />;
  }

  return (
    <ThemedView style={styles.container}>
      <View style={styles.header}>
        <View style={styles.headerTop}>
          <IconButton
            icon="arrow-left"
            size={24}
            onPress={handleGoBack}
            style={styles.backButton}
          />
          <ThemedText type="title" style={styles.title}>
            Admin: Manage Questions
          </ThemedText>
        </View>
        <View style={styles.headerActions}>
          <ThemeToggle />
          <IconButton
            icon="refresh"
            size={24}
            onPress={resetToDefaults}
            style={styles.resetButton}
          />
        </View>
      </View>

      {/* Tab Navigation */}
      <View style={styles.tabContainer}>
        <TouchableOpacity
          style={[styles.tab, activeTab === 'ratings' && styles.activeTab]}
          onPress={() => setActiveTab('ratings')}
        >
          <ThemedText style={[styles.tabText, activeTab === 'ratings' && styles.activeTabText]}>
            Rating Categories
          </ThemedText>
        </TouchableOpacity>
        <TouchableOpacity
          style={[styles.tab, activeTab === 'personal' && styles.activeTab]}
          onPress={() => setActiveTab('personal')}
        >
          <ThemedText style={[styles.tabText, activeTab === 'personal' && styles.activeTabText]}>
            Personal Info Fields
          </ThemedText>
        </TouchableOpacity>
        <TouchableOpacity
          style={[styles.tab, activeTab === 'simulators' && styles.activeTab]}
          onPress={() => setActiveTab('simulators')}
        >
          <ThemedText style={[styles.tabText, activeTab === 'simulators' && styles.activeTabText]}>
            Simulators
          </ThemedText>
        </TouchableOpacity>
      </View>

      <ScrollView style={styles.scrollView} showsVerticalScrollIndicator={false} contentContainerStyle={{ paddingBottom: hp('15%') }}>
        {activeTab === 'ratings' && (
          <>
            <Card style={styles.infoCard}>
              <Card.Content>
                <ThemedText style={styles.infoTitle}>Rating Categories Management</ThemedText>
                <ThemedText style={styles.infoText}>
                  Here you can edit the rating questions that appear in the PROFESSIONAL review form. 
                  Each category will be displayed with a 5-star rating system.
                </ThemedText>
                <ThemedText style={[styles.infoText, { marginTop: hp('1%'), fontStyle: 'italic', opacity: 0.8 }]}>
                  Note: Joyride reviews use fixed questions and cannot be modified here.
                </ThemedText>
              </Card.Content>
            </Card>
          </>
        )}

        {activeTab === 'personal' && (
          <>
            <Card style={styles.infoCard}>
              <Card.Content>
                <ThemedText style={styles.infoTitle}>Personal Information Fields Management</ThemedText>
                <ThemedText style={styles.infoText}>
                  Here you can manage the personal information fields that appear in the PROFESSIONAL review form.
                  Configure which fields are required and their display properties.
                </ThemedText>
                <ThemedText style={[styles.infoText, { marginTop: hp('1%'), fontStyle: 'italic', opacity: 0.8 }]}>
                  Note: Joyride reviews use fixed fields and cannot be modified here.
                </ThemedText>
              </Card.Content>
            </Card>
          </>
        )}

        {activeTab === 'simulators' && (
          <Card style={styles.infoCard}>
            <Card.Content>
              <ThemedText style={styles.infoTitle}>Simulator Management</ThemedText>
              <ThemedText style={styles.infoText}>
                Manage the list of Aircraft (Simulators) and System Types available in the app.
              </ThemedText>
            </Card.Content>
          </Card>
        )}

        {activeTab === 'ratings' && (
          <>
            {ratingCategories.map((category, index) => (
              <Card key={category.id ?? category.key ?? String(index)} style={styles.categoryCard}>
                <Card.Content>
                  <View style={styles.categoryHeader}>
                    <ThemedText style={styles.categoryNumber}>#{index + 1}</ThemedText>
                    <View style={styles.categoryActions}>
                      <IconButton
                        icon={editingCategory === category.id ? "check" : "pencil"}
                        size={20}
                        onPress={() => setEditingCategory(editingCategory === category.id ? null : category.id)}
                        style={styles.actionButton}
                      />
                      {ratingCategories.length > 1 && (
                        <IconButton
                          icon="delete"
                          size={20}
                          onPress={() => deleteCategory(category.id)}
                          style={[styles.actionButton, styles.deleteButton]}
                        />
                      )}
                    </View>
                  </View>

                  {editingCategory === category.id ? (
                    <View style={styles.editForm}>
                      <TextInput
                        label="Question Title"
                        value={category.title}
                        onChangeText={(text) => updateCategory(category.id, 'title', text)}
                        style={styles.textInput}
                        mode="outlined"
                        multiline
                      />
                      <TextInput
                        label="Question Description"
                        value={category.description}
                        onChangeText={(text) => updateCategory(category.id, 'description', text)}
                        style={styles.textInput}
                        mode="outlined"
                        multiline
                        numberOfLines={3}
                      />
                    </View>
                  ) : (
                    <View style={styles.categoryDisplay}>
                      <ThemedText style={styles.categoryTitle}>{category.title}</ThemedText>
                      <ThemedText style={styles.categoryDescription}>{category.description}</ThemedText>
                    </View>
                  )}
                </Card.Content>
              </Card>
            ))}

            <View style={styles.bottomActions}>
              <Button
                mode="outlined"
                onPress={addNewCategory}
                style={styles.addButton}
                icon="plus"
              >
                Add New Rating Category
              </Button>
            </View>
          </>
        )}

        {activeTab === 'personal' && (
          <>
            {personalInfoFields.map((field, index) => (
              <Card key={field.id ?? field.key ?? String(index)} style={styles.categoryCard}>
                <Card.Content>
                  <View style={styles.categoryHeader}>
                    <ThemedText style={styles.categoryNumber}>#{index + 1}</ThemedText>
                    <View style={styles.categoryActions}>
                      <IconButton
                        icon={editingPersonalField === field.id ? "check" : "pencil"}
                        size={20}
                        onPress={() => setEditingPersonalField(editingPersonalField === field.id ? null : field.id)}
                        style={styles.actionButton}
                      />
                      {personalInfoFields.length > 1 && (
                        <IconButton
                          icon="delete"
                          size={20}
                          onPress={() => deletePersonalField(field.id)}
                          style={[styles.actionButton, styles.deleteButton]}
                        />
                      )}
                    </View>
                  </View>

                  {editingPersonalField === field.id ? (
                    <View style={styles.editForm}>
                      <TextInput
                        label="Field Key"
                        value={field.key}
                        onChangeText={(text) => updatePersonalField(field.id, 'key', text)}
                        style={styles.textInput}
                        mode="outlined"
                      />
                      <TextInput
                        label="Field Label"
                        value={field.label}
                        onChangeText={(text) => updatePersonalField(field.id, 'label', text)}
                        style={styles.textInput}
                        mode="outlined"
                      />
                      {field.type === 'scroll' ? (
                        <View>
                          <ThemedText style={styles.fieldTypeLabel}>Options (separated by comma):</ThemedText>
                          <TextInput
                            label="Enter options separated by commas"
                            value={field.options?.join(', ') || ''}
                            onChangeText={(text) => {
                              const options = text.split(',').map(option => option.trim()).filter(option => option !== '');
                              updatePersonalField(field.id, 'options', options);
                            }}
                            style={styles.textInput}
                            mode="outlined"
                            multiline={false}
                            keyboardType="default"
                            autoCapitalize="none"
                            autoCorrect={false}
                          />
                        </View>
                      ) : field.type === 'yesno' ? (
                        <View>
                          <ThemedText style={styles.fieldTypeLabel}>Button Values:</ThemedText>
                          <TextInput
                            label="Yes Button Text"
                            value={field.yesNoValues?.yes || 'Yes'}
                            onChangeText={(text) => {
                              const currentValues = field.yesNoValues || { yes: 'Yes', no: 'No' };
                              updatePersonalField(field.id, 'yesNoValues', { ...currentValues, yes: text });
                            }}
                            style={styles.textInput}
                            mode="outlined"
                          />
                          <TextInput
                            label="No Button Text"
                            value={field.yesNoValues?.no || 'No'}
                            onChangeText={(text) => {
                              const currentValues = field.yesNoValues || { yes: 'Yes', no: 'No' };
                              updatePersonalField(field.id, 'yesNoValues', { ...currentValues, no: text });
                            }}
                            style={styles.textInput}
                            mode="outlined"
                          />
                        </View>
                      ) : (
                        <TextInput
                          label="Placeholder Text"
                          value={field.placeholder}
                          onChangeText={(text) => updatePersonalField(field.id, 'placeholder', text)}
                          style={styles.textInput}
                          mode="outlined"
                        />
                      )}
                      <View style={styles.fieldTypeContainer}>
                        <ThemedText style={styles.fieldTypeLabel}>Field Type:</ThemedText>
                        <View style={styles.fieldTypeButtons}>
                          {['text', 'multiline', 'email', 'yesno', 'scroll'].map((type) => (
                            <TouchableOpacity
                              key={type}
                              style={[
                                styles.fieldTypeButton,
                                field.type === type && styles.activeFieldTypeButton
                              ]}
                              onPress={() => updatePersonalField(field.id, 'type', type)}
                            >
                              <ThemedText style={[
                                styles.fieldTypeButtonText,
                                field.type === type && styles.activeFieldTypeButtonText
                              ]}>
                                {type === 'yesno' ? 'Yes/No' : type === 'scroll' ? 'Scroll' : type.charAt(0).toUpperCase() + type.slice(1)}
                              </ThemedText>
                            </TouchableOpacity>
                          ))}
                        </View>
                      </View>
                      <View style={styles.requiredContainer}>
                        <ThemedText style={styles.requiredLabel}>Required Field:</ThemedText>
                        <TouchableOpacity
                          style={[styles.requiredToggle, field.required && styles.requiredToggleActive]}
                          onPress={() => updatePersonalField(field.id, 'required', !field.required)}
                        >
                          <ThemedText style={[
                            styles.requiredToggleText,
                            field.required && styles.requiredToggleTextActive
                          ]}>
                            {field.required ? 'Yes' : 'No'}
                          </ThemedText>
                        </TouchableOpacity>
                      </View>
                    </View>
                  ) : (
                    <View style={styles.categoryDisplay}>
                      <ThemedText style={styles.categoryTitle}>{field.label}</ThemedText>
                      <ThemedText style={styles.categoryDescription}>
                        Key: {field.key} | Type: {field.type} | Required: {field.required ? 'Yes' : 'No'}
                      </ThemedText>
                      <ThemedText style={styles.categoryDescription}>
                        Placeholder: {field.placeholder}
                      </ThemedText>
                    </View>
                  )}
                </Card.Content>
              </Card>
            ))}

            <View style={styles.bottomActions}>
              <Button
                mode="outlined"
                onPress={addNewPersonalField}
                style={styles.addButton}
                icon="plus"
              >
                Add New Personal Field
              </Button>
            </View>
          </>
        )}

        {activeTab === 'simulators' && (
          <>
            <ThemedText style={styles.sectionHeader}>Simulator Types</ThemedText>
            {simulatorTypes.map((type, index) => (
              <Card key={`type-${index}`} style={styles.categoryCard}>
                <Card.Content>
                  <View style={styles.categoryHeader}>
                    <ThemedText style={styles.categoryNumber}>#{index + 1}</ThemedText>
                    <View style={styles.categoryActions}>
                      <IconButton
                        icon={editingSimType === String(index) ? "check" : "pencil"}
                        size={20}
                        onPress={() => setEditingSimType(editingSimType === String(index) ? null : String(index))}
                        style={styles.actionButton}
                      />
                      <IconButton
                        icon="delete"
                        size={20}
                        onPress={() => deleteSimType(index)}
                        style={[styles.actionButton, styles.deleteButton]}
                      />
                    </View>
                  </View>
                  {editingSimType === String(index) ? (
                    <TextInput
                      label="Simulator Type"
                      value={type}
                      onChangeText={(text) => updateSimType(index, text)}
                      style={styles.textInput}
                      mode="outlined"
                    />
                  ) : (
                    <ThemedText style={styles.categoryTitle}>{type}</ThemedText>
                  )}
                </Card.Content>
              </Card>
            ))}
            <Button mode="outlined" onPress={addNewSimType} style={styles.addButton} icon="plus">
              Add New Type
            </Button>

            <ThemedText style={[styles.sectionHeader, { marginTop: hp('2%') }]}>Aircraft (Simulators)</ThemedText>
            {simulators.map((sim, index) => (
              <Card key={sim.id} style={styles.categoryCard}>
                <Card.Content>
                  <View style={styles.categoryHeader}>
                    <ThemedText style={styles.categoryNumber}>#{index + 1}</ThemedText>
                    <View style={styles.categoryActions}>
                      <IconButton
                        icon={editingSimulator === sim.id ? "check" : "pencil"}
                        size={20}
                        onPress={() => setEditingSimulator(editingSimulator === sim.id ? null : sim.id)}
                        style={styles.actionButton}
                      />
                      <IconButton
                        icon="delete"
                        size={20}
                        onPress={() => deleteSimulator(sim.id)}
                        style={[styles.actionButton, styles.deleteButton]}
                      />
                    </View>
                  </View>
                  {editingSimulator === sim.id ? (
                    <TextInput
                      label="Aircraft Name"
                      value={sim.name}
                      onChangeText={(text) => updateSimulator(sim.id, text)}
                      style={styles.textInput}
                      mode="outlined"
                    />
                  ) : (
                    <ThemedText style={styles.categoryTitle}>{sim.name}</ThemedText>
                  )}
                </Card.Content>
              </Card>
            ))}
            <Button mode="outlined" onPress={addNewSimulator} style={styles.addButton} icon="plus">
              Add New Aircraft
            </Button>
          </>
        )}

        {hasChanges && (
          <View style={styles.bottomActions}>
            <Button
              mode="contained"
              onPress={activeTab === 'simulators' ? saveSimulatorChanges : saveAllChanges}
              style={styles.saveButton}
              icon="content-save"
            >
              Save All Changes
            </Button>
          </View>
        )}
        <Card style={{ marginTop: 20, marginBottom: 40, backgroundColor: colors.card }}>
          <Card.Content>
            <ThemedText type="subtitle" style={{ color: colors.text }}>Data Management</ThemedText>
            <Button 
              mode="contained" 
              onPress={async () => {
                Alert.alert(
                  'Reset & Import',
                  'This will DELETE all existing reviews and import the 32 reviews from the Excel file. Are you sure?',
                  [
                    { text: 'Cancel', style: 'cancel' },
                    { 
                      text: 'Delete & Import', 
                      style: 'destructive',
                      onPress: async () => {
                        try {
                          await clearCorruptedStorage();
                          const count = await importReviews(seedReviews);
                          await syncReviews(); // Trigger sync immediately
                          Alert.alert('Success', `Database reset. Imported ${count} reviews and started sync.`);
                        } catch (error) {
                          Alert.alert('Error', 'Failed to reset and import.');
                          console.error(error);
                        }
                      }
                    }
                  ]
                );
              }}
              style={{ marginTop: 10, backgroundColor: colors.notification }}
            >
              Reset & Import Excel Data ({seedReviews.length})
            </Button>
          </Card.Content>
        </Card>
      </ScrollView>
    </ThemedView>
  );
}

const createStyles = (backgroundColor: string, textColor: string, borderColor: string, cardBackgroundColor: string) => StyleSheet.create({
  container: {
    flex: 1,
    paddingTop: hp('5%'),
  },
  header: {
    paddingHorizontal: wp('4%'),
    paddingBottom: hp('2%'),
    gap: hp('1%'),
  },
  headerTop: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: hp('1%'),
  },
  backButton: {
    margin: 0,
  },
  title: {
    flex: 1,
    textAlign: 'center',
    fontSize: rf(22),
    lineHeight: rf(32),
    marginHorizontal: wp('2%'),
    flexShrink: 1,
    paddingHorizontal: wp('2%'),
    paddingVertical: rf(6),
  },
  headerActions: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: rs(8),
  },
  filterButton: {
    marginRight: rs(4),
  },
  resetButton: {
    margin: 0,
  },
  tabContainer: {
    flexDirection: 'row',
    backgroundColor: cardBackgroundColor,
    marginHorizontal: wp('4%'),
    marginBottom: hp('2%'),
    borderRadius: 12,
    padding: wp('1%'),
  },
  tab: {
    flex: 1,
    paddingVertical: hp('1.5%'),
    paddingHorizontal: wp('4%'),
    borderRadius: 8,
    alignItems: 'center',
  },
  activeTab: {
    backgroundColor: '#FF6B35',
  },
  tabText: {
    fontSize: rf(16),
    lineHeight: rf(40),
    fontWeight: '500',
    flexShrink: 1,
    textAlign: 'center',
    paddingVertical: rf(4),
  },
  activeTabText: {
    color: '#FFFFFF',
    fontWeight: '600',
  },
  scrollView: {
    flex: 1,
    paddingHorizontal: wp('4%'),
  },
  infoCard: {
    backgroundColor: cardBackgroundColor,
    marginBottom: hp('2%'),
    borderRadius: 12,
  },
  infoTitle: {
    fontSize: rf(18),
    lineHeight: rf(42),
    fontWeight: 'bold',
    marginBottom: hp('1%'),
    flexShrink: 1,
    paddingRight: wp('2%'),
    paddingVertical: rf(5),
  },
  infoText: {
    fontSize: rf(14),
    opacity: 0.8,
    lineHeight: rf(35),
    flexShrink: 1,
    paddingRight: wp('2%'),
    paddingVertical: rf(3),
  },
  categoryCard: {
    backgroundColor: cardBackgroundColor,
    marginBottom: hp('1.5%'),
    borderRadius: 12,
  },
  categoryHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: hp('1%'),
  },
  categoryNumber: {
    fontSize: rf(16),
    lineHeight: rf(28),
    fontWeight: 'bold',
    color: '#FF6B35',
    flexShrink: 1,
    paddingVertical: rf(4),
  },
  categoryActions: {
    flexDirection: 'row',
  },
  actionButton: {
    margin: 0,
    marginLeft: wp('1%'),
  },
  deleteButton: {
    backgroundColor: '#FF4444',
  },
  editForm: {
    gap: hp('1%'),
  },
  textInput: {
    backgroundColor: cardBackgroundColor,
  },
  textArea: {
    backgroundColor: cardBackgroundColor,
    minHeight: hp('8%'),
  },
  categoryDisplay: {
    gap: hp('0.5%'),
  },
  categoryTitle: {
    fontSize: rf(16),
    lineHeight: rf(40),
    fontWeight: '600',
    flexShrink: 1,
    paddingRight: wp('2%'),
    paddingVertical: rf(4),
  },
  categoryDescription: {
    fontSize: rf(14),
    opacity: 0.7,
    lineHeight: rf(24),
    flexShrink: 1,
    paddingRight: wp('2%'),
    paddingVertical: rf(3),
  },
  bottomActions: {
    gap: hp('1.5%'),
    paddingVertical: hp('2%'),
    marginBottom: hp('4%'),
  },
  addButton: {
    borderRadius: 8,
  },
  saveButton: {
    backgroundColor: '#4CAF50',
    borderRadius: 8,
  },
  fieldTypeContainer: {
    marginTop: hp('1%'),
  },
  sectionHeader: {
    fontSize: rf(18),
    fontWeight: 'bold',
    marginBottom: hp('1%'),
    marginTop: hp('1%'),
  },
  fieldTypeLabel: {
    fontSize: rf(14),
    lineHeight: rf(24),
    fontWeight: '600',
    marginBottom: hp('0.5%'),
    flexShrink: 1,
    paddingRight: wp('2%'),
    paddingVertical: rf(3),
  },
  fieldTypeButtons: {
    flexDirection: 'row',
    gap: wp('2%'),
  },
  fieldTypeButton: {
    paddingVertical: hp('1%'),
    paddingHorizontal: wp('3%'),
    borderRadius: 6,
    borderWidth: 1,
    borderColor: borderColor,
    backgroundColor: 'transparent',
  },
  activeFieldTypeButton: {
    backgroundColor: '#FF6B35',
    borderColor: '#FF6B35',
  },
  fieldTypeButtonText: {
    fontSize: rf(12),
    lineHeight: rf(22),
    fontWeight: '500',
    flexShrink: 1,
    textAlign: 'center',
    paddingVertical: rf(3),
  },
  activeFieldTypeButtonText: {
    color: '#FFFFFF',
  },
  requiredContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginTop: hp('1%'),
  },
  requiredLabel: {
    fontSize: rf(14),
    lineHeight: rf(24),
    fontWeight: '600',
    flexShrink: 1,
    paddingRight: wp('2%'),
    paddingVertical: rf(3),
  },
  requiredToggle: {
    paddingVertical: hp('0.8%'),
    paddingHorizontal: wp('4%'),
    borderRadius: 6,
    borderWidth: 1,
    borderColor: borderColor,
    backgroundColor: 'transparent',
  },
  requiredToggleActive: {
    backgroundColor: '#4CAF50',
    borderColor: '#4CAF50',
  },
  requiredToggleText: {
    fontSize: rf(12),
    lineHeight: rf(22),
    fontWeight: '500',
    flexShrink: 1,
    textAlign: 'center',
    paddingVertical: rf(3),
  },
  requiredToggleTextActive: {
    color: '#FFFFFF',
  },
});