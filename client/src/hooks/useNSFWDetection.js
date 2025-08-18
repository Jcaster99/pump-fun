import * as tf from '@tensorflow/tfjs';
import * as nsfwjs from 'nsfwjs';
import { useEffect, useRef, useState } from 'react';
import logger from '../utils/logger';

const useNSFWDetection = () => {
  // State for NSFW model
  const [checking, setChecking] = useState(false);
  const [modelLoading, setModelLoading] = useState(false);
  const [modelLoaded, setModelLoaded] = useState(false);
  const [modelError, setModelError] = useState(null);
  
  // Use ref for stable reference to the model
  const nsfwModelRef = useRef(null);
  
  // Load NSFW detection model on component mount - hidden loading with proper cache
  useEffect(() => {
    let isMounted = true;
    
    // Nazwa pod którą przechowujemy model w cache
    const MODEL_URL = 'https://storage.googleapis.com/tfjs-models/savedmodel/nsfwjs/model.json';
    const MODEL_LOCAL_STORAGE_KEY = 'nsfwjs-model-loaded';
    
    // Funkcja ładująca model w tle bez wyświetlania ekranu ładowania
    const loadModel = async () => {
      if (modelLoading || modelLoaded || nsfwModelRef.current) return;
      
      try {
        logger.log('Checking for cached NSFW model status...');
        
        // Initialize TensorFlow.js
        await tf.ready();
        logger.log('TensorFlow.js initialized');
        
        // Zawsze ładujemy model przez nsfwjs.load() żeby mieć dostęp do funkcji classify
        // Sprawdzamy tylko w localStorage czy model był wcześniej załadowany
        // żeby wiedzieć czy jest już w IndexedDB
        const modelCacheStatus = localStorage.getItem(MODEL_LOCAL_STORAGE_KEY);
        
        if (modelCacheStatus === 'true') {
          logger.log('Model was previously loaded and should be in IndexedDB cache');
        } else {
          logger.log('Model may not be cached yet, will let browser handle caching');
        }
        
        // Ładujemy model - TensorFlow.js automatycznie użyje cache jeśli jest dostępny
        logger.log('Loading NSFW model...');
        const model = await nsfwjs.load();
        logger.log('Successfully loaded NSFW model (possibly from cache)');
        
        // Zapisz informację, że model był już ładowany - następnym razem będzie szybciej
        localStorage.setItem(MODEL_LOCAL_STORAGE_KEY, 'true');
        
        // Only update state if component is still mounted
        if (isMounted) {
          logger.log('Model loaded successfully and stored in ref');
          // Store the model in the ref
          nsfwModelRef.current = model;
          // Update state to indicate model is loaded
          setModelLoaded(true);
          setModelError(null);
          
          // Test the model with a simple image to ensure it's working
          try {
            // Create a small test image (1x1 pixel)
            const testImg = document.createElement('img');
            testImg.width = 1;
            testImg.height = 1;
            testImg.src = 'data:image/gif;base64,R0lGODlhAQABAIAAAAAAAP///yH5BAEAAAAALAAAAAABAAEAAAIBRAA7';
            
            // Wait for it to load
            await new Promise(resolve => {
              testImg.onload = resolve;
            });
            
            // Verify the model actually works
            try {
              const predictions = await model.classify(testImg);
              logger.log('Test classification successful, model is ready', predictions);
            } catch (e) {
              logger.log('Test classification failed, but that might be expected:', e);
            }
          } catch (e) {
            logger.warn('Test image validation failed:', e);
          }
        }
      } catch (err) {
        logger.error('Error loading NSFW detection model:', err);
        if (isMounted) {
          setModelError(err.message);
        }
      }
    };
    
    loadModel();
    
    // Cleanup function
    return () => {
      isMounted = false;
    };
  }, []);

  // Check if image contains NSFW content
  const checkImageNSFW = async (file) => {
    // Get the model from ref
    const model = nsfwModelRef.current;
    
    logger.log('In checkImageNSFW, model available:', model ? 'Yes' : 'No');
    
    if (!model) {
      logger.warn('NSFW model not loaded, skipping check');
      return true; // Allow if model not loaded
    }
    
    try {
      // Create an image element for the model to analyze
      const img = document.createElement('img');
      img.crossOrigin = 'anonymous';
      img.width = 224;
      img.height = 224;
      
      // Create a URL for the image file
      const imageUrl = URL.createObjectURL(file);
      img.src = imageUrl;
      
      logger.log('Created image element for NSFW check');
      
      // Wait for the image to load
      await new Promise((resolve, reject) => {
        img.onload = () => {
          logger.log('Image loaded successfully for NSFW check');
          resolve();
        };
        img.onerror = (e) => {
          logger.error('Error loading image for NSFW check:', e);
          reject(e);
        };
      });
      
      // Classify the image
      logger.log('Running NSFW classification on image');
      const predictions = await model.classify(img);
      logger.log('NSFW check detailed results:', predictions);
      
      // Check if image contains NSFW content with a more strict approach
      // Lower the threshold to 0.5 (50%) to be more conservative
      const nsfw = predictions.some(p => 
        (p.className === "Porn" || p.className === "Sexy" || p.className === "Hentai") 
        && p.probability > 0.5
      );
      
      logger.log('NSFW detection result:', nsfw ? 'NSFW content detected' : 'Image is safe');
      
      // Format predictions as percentages for logging
      const formattedPredictions = predictions.map(p => ({
        className: p.className,
        probability: `${(p.probability * 100).toFixed(2)}%`
      }));
      logger.log('Classification percentages:', formattedPredictions);
      
      // Revoke the object URL to free memory
      URL.revokeObjectURL(imageUrl);
      
      return !nsfw; // Return true if image is safe
    } catch (err) {
      logger.error('Error checking image for NSFW content:', err);
      return true; // Allow if check fails
    }
  };

  // Handle image selection
  const handleImageValidation = async (file, setImage, setImagePreview, setFormErrors) => {
    if (!file) return null;
    
    // Check file size (max 500KB)
    if (file.size > 500 * 1024) {
      setFormErrors(prev => ({ ...prev, image: 'Image size must be less than 500KB' }));
      return null;
    }
    
    // Check file type with more specific validation
    const validImageTypes = ['image/jpeg', 'image/png', 'image/gif', 'image/webp'];
    if (!validImageTypes.includes(file.type)) {
      setFormErrors(prev => ({ ...prev, image: 'Only JPEG, PNG, GIF, and WebP images are allowed' }));
      return null;
    }
    
    // Create a preview URL for the selected image
    const previewUrl = URL.createObjectURL(file);
    setImagePreview(previewUrl);
    
    // Log model state before check
    logger.log('Before NSFW check, model available in ref:', nsfwModelRef.current ? 'Yes' : 'No');
    logger.log('Model loaded state:', modelLoaded);
    
    // Check for NSFW content
    setChecking(true);
    logger.log('Starting NSFW check for image:', file.name);
    
    try {
      // Only attempt NSFW check if model is loaded
      let isSafe = true;
      
      if (modelLoaded && nsfwModelRef.current) {
        isSafe = await checkImageNSFW(file);
      } else {
        logger.log('Model not loaded yet, bypassing NSFW check');
      }
      
      if (!isSafe) {
        setFormErrors(prev => ({ ...prev, image: 'Image contains inappropriate content and cannot be used' }));
        // Cleanup the preview URL
        URL.revokeObjectURL(previewUrl);
        setImagePreview(null);
        return null;
      }
      
      // If we get here, the image is safe or we couldn't check
      setImage(file);
      setFormErrors(prev => ({ ...prev, image: '' }));
      return file;
    } catch (error) {
      logger.error('Error in NSFW check:', error);
      // Allow the image if there's an error in the check
      setImage(file);
      setFormErrors(prev => ({ ...prev, image: '' }));
      return file;
    } finally {
      setChecking(false);
    }
  };

  return {
    checking,
    modelLoaded,
    modelError,
    handleImageValidation
  };
};

export default useNSFWDetection; 