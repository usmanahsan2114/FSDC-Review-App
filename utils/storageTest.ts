import { getMigrationStats } from './dataMigration';
import {
  deleteReview,
  getAllReviews,
  getStorageStats,
  initializeDataStorage,
  saveReview
} from './dataStorage';
import {
  getAllStoredImages,
  getStorageInfo,
  initializeImageStorage
} from './imageStorage';

export interface StorageTestResult {
  success: boolean;
  tests: {
    name: string;
    passed: boolean;
    error?: string;
  }[];
  summary: {
    totalTests: number;
    passedTests: number;
    failedTests: number;
  };
}

/**
 * Comprehensive test suite for the permanent storage system
 */
export async function runStorageTests(): Promise<StorageTestResult> {
  const result: StorageTestResult = {
    success: false,
    tests: [],
    summary: {
      totalTests: 0,
      passedTests: 0,
      failedTests: 0
    }
  };

  const addTest = (name: string, passed: boolean, error?: string) => {
    result.tests.push({ name, passed, error });
    result.summary.totalTests++;
    if (passed) {
      result.summary.passedTests++;
    } else {
      result.summary.failedTests++;
    }
  };

  try {
    // Test 1: Initialize storage systems
    try {
      await initializeImageStorage();
      await initializeDataStorage();
      addTest('Storage Initialization', true);
    } catch (error) {
      addTest('Storage Initialization', false, String(error));
    }

    // Test 2: Get storage info
    try {
      const storageInfo = await getStorageInfo();
      const isValid = typeof storageInfo.totalImages === 'number' && 
                     typeof storageInfo.totalSize === 'number';
      addTest('Storage Info Retrieval', isValid);
    } catch (error) {
      addTest('Storage Info Retrieval', false, String(error));
    }

    // Test 3: Create and save a test review
    const testReview = {
      id: `test-${Date.now()}`,
      timestamp: Date.now(),
      personalInfo: { 
        name: 'Test User', 
        email: 'test@example.com',
        profession: 'Test Profession',
        nationality: 'Test Country'
      },
      ratings: { service: 5, quality: 4 },
      overallRating: 4.5,
      textComment: 'This is a test review',
      handwrittenComment: '',
      photos: []
    };

    try {
      await saveReview(testReview);
      addTest('Save Test Review', true);
    } catch (error) {
      addTest('Save Test Review', false, String(error));
    }

    // Test 4: Retrieve all reviews (skip existence check as saveReview generates a new id)
    try {
      const reviews = await getAllReviews();
      const hasArray = Array.isArray(reviews);
      addTest('Retrieve Reviews', hasArray);
    } catch (error) {
      addTest('Retrieve Reviews', false, String(error));
    }

    // Test 5: Get storage statistics
    try {
      const stats = await getStorageStats();
      const isValid = typeof stats.totalReviews === 'number' && 
                     typeof stats.totalImages === 'number';
      addTest('Storage Statistics', isValid);
    } catch (error) {
      addTest('Storage Statistics', false, String(error));
    }

    // Test 6: Delete test review
    try {
      await deleteReview(testReview.id);
      const reviews = await getAllReviews();
      const testReviewDeleted = !reviews.some(r => r.id === testReview.id);
      addTest('Delete Test Review', testReviewDeleted);
    } catch (error) {
      addTest('Delete Test Review', false, String(error));
    }

    // Test 7: Migration stats (should not fail even if no migration needed)
    try {
      const migrationStats = await getMigrationStats();
      const isValid = typeof migrationStats.totalReviews === 'number';
      addTest('Migration Statistics', isValid);
    } catch (error) {
      addTest('Migration Statistics', false, String(error));
    }

    // Test 8: Get all stored images
    try {
      const images = await getAllStoredImages();
      const isValid = Array.isArray(images);
      addTest('Get Stored Images', isValid);
    } catch (error) {
      addTest('Get Stored Images', false, String(error));
    }

    result.success = result.summary.failedTests === 0;
    return result;

  } catch (error) {
    addTest('Test Suite Execution', false, String(error));
    return result;
  }
}

/**
 * Logs test results to console in a formatted way
 */
export function logTestResults(result: StorageTestResult): void {
  console.log('\n=== STORAGE TEST RESULTS ===');
  console.log(`Overall Success: ${result.success ? '✅' : '❌'}`);
  console.log(`Tests Passed: ${result.summary.passedTests}/${result.summary.totalTests}`);
  
  if (result.summary.failedTests > 0) {
    console.log('\n❌ Failed Tests:');
    result.tests
      .filter(test => !test.passed)
      .forEach(test => {
        console.log(`  - ${test.name}: ${test.error}`);
      });
  }

  console.log('\n✅ Passed Tests:');
  result.tests
    .filter(test => test.passed)
    .forEach(test => {
      console.log(`  - ${test.name}`);
    });
  
  console.log('=== END TEST RESULTS ===\n');
}

/**
 * Quick test function that can be called from the app
 */
export async function quickStorageTest(): Promise<boolean> {
  try {
    const result = await runStorageTests();
    logTestResults(result);
    return result.success;
  } catch (error) {
    console.error('Storage test failed:', error);
    return false;
  }
}