import * as FileSystem from 'expo-file-system';
import React, { useEffect, useRef, useState } from 'react';
import { StyleSheet, View } from 'react-native';
import { WebView } from 'react-native-webview';

interface StylusCanvasProps {
  onSave: (imageUri: string) => void;
  onClear: () => void;
  onClose: () => void;
  backgroundColor?: string;
  penColor?: string;
  initialImage?: string; // Optional: file path or data URL to load existing handwriting
}

const StylusCanvas: React.FC<StylusCanvasProps> = ({
  onSave,
  onClear,
  onClose,
  backgroundColor = '#FFFFFF',
  penColor = '#000000',
  initialImage,
}) => {
  const webViewRef = useRef<WebView>(null);

  // HTML for the stylus-only canvas
  const htmlContent = `
<!DOCTYPE html>
<html>
<head>
  <meta name="viewport" content="width=device-width, initial-scale=1.0, maximum-scale=1.0, user-scalable=no">
  <style>
    * {
      margin: 0;
      padding: 0;
      box-sizing: border-box;
      touch-action: none;
      -webkit-touch-callout: none;
      -webkit-user-select: none;
      user-select: none;
    }
    
    body {
      width: 100vw;
      height: 100vh;
      overflow: hidden;
      background-color: ${backgroundColor};
      margin: 0;
      padding: 0;
      position: fixed;
    }
    
    #canvas {
      position: absolute;
      top: 0;
      left: 0;
      width: 100%;
      height: 100%;
      background-color: ${backgroundColor};
      cursor: crosshair;
    }
    
    #toolbar {
      position: absolute;
      top: 0;
      left: 0;
      right: 0;
      height: 70px;
      background: rgba(0, 0, 0, 0.05);
      display: flex;
      justify-content: space-between;
      align-items: center;
      padding: 0 15px;
      z-index: 1000;
      flex-wrap: wrap;
      gap: 8px;
    }
    
    .toolbar-left {
      display: flex;
      gap: 8px;
      align-items: center;
      flex-wrap: wrap;
    }
    
    .toolbar-right {
      display: flex;
      gap: 8px;
      align-items: center;
      flex-wrap: wrap;
    }
    
    .toolbar-button {
      padding: 8px 14px;
      background: rgba(255, 255, 255, 0.9);
      border: 1px solid rgba(0, 0, 0, 0.2);
      border-radius: 8px;
      font-size: 13px;
      font-weight: 600;
      cursor: pointer;
      color: #000;
      box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
      white-space: nowrap;
    }
    
    .toolbar-button:active {
      background: rgba(255, 255, 255, 0.7);
    }
    
    .toolbar-button:disabled {
      opacity: 0.5;
      cursor: not-allowed;
    }
    
    .toolbar-button.active {
      background: rgba(37, 99, 235, 0.9);
      color: white;
      border-color: rgba(37, 99, 235, 0.9);
    }
    
    #undoBtn {
      background: rgba(59, 130, 246, 0.9);
      color: white;
    }
    
    #redoBtn {
      background: rgba(59, 130, 246, 0.9);
      color: white;
    }
    
    #eraserBtn {
      background: rgba(168, 85, 247, 0.9);
      color: white;
    }
    
    #eraserBtn.active {
      background: rgba(168, 85, 247, 1) !important;
      border: 2px solid rgba(255, 255, 255, 0.8) !important;
      box-shadow: 0 0 8px rgba(168, 85, 247, 0.6) !important;
    }
    
    #penBtn {
      background: rgba(34, 197, 94, 0.9);
      color: white;
    }
    
    #penBtn.active {
      background: rgba(34, 197, 94, 1) !important;
      border: 2px solid rgba(255, 255, 255, 0.8) !important;
      box-shadow: 0 0 8px rgba(34, 197, 94, 0.6) !important;
    }
    
    #clearBtn {
      background: rgba(239, 68, 68, 0.9);
      color: white;
    }
    
    #saveBtn {
      background: rgba(34, 197, 94, 0.9);
      color: white;
    }
    
    #closeBtn {
      background: rgba(107, 114, 128, 0.9);
      color: white;
    }
    
    .tool-options {
      display: flex;
      gap: 6px;
      align-items: center;
      padding: 4px 8px;
      background: rgba(255, 255, 255, 0.8);
      border-radius: 6px;
    }
    
    .tool-option {
      padding: 4px 8px;
      background: rgba(255, 255, 255, 0.9);
      border: 1px solid rgba(0, 0, 0, 0.2);
      border-radius: 4px;
      font-size: 11px;
      cursor: pointer;
      color: #000;
    }
    
    .tool-option.active {
      background: rgba(37, 99, 235, 0.9);
      color: white;
      border-color: rgba(37, 99, 235, 0.9);
    }
  </style>
</head>
<body>
  <div id="toolbar">
    <div class="toolbar-left">
      <button id="undoBtn" class="toolbar-button" disabled>Undo</button>
      <button id="redoBtn" class="toolbar-button" disabled>Redo</button>
      <button id="penBtn" class="toolbar-button active">Pen</button>
      <button id="eraserBtn" class="toolbar-button">Eraser</button>
      <div class="tool-options">
        <span style="font-size: 11px; margin-right: 4px;">Size:</span>
        <button id="sizeSmall" class="tool-option active">S</button>
        <button id="sizeMedium" class="tool-option">M</button>
        <button id="sizeLarge" class="tool-option">L</button>
      </div>
      <button id="clearBtn" class="toolbar-button">Clear</button>
    </div>
    <div class="toolbar-right">
      <button id="saveBtn" class="toolbar-button">Save</button>
      <button id="closeBtn" class="toolbar-button">Close</button>
    </div>
  </div>
  <canvas id="canvas"></canvas>
  
  <script>
    (function() {
      const canvas = document.getElementById('canvas');
      const ctx = canvas.getContext('2d');
      let isDrawing = false;
      let lastX = 0;
      let lastY = 0;
      
      // Drawing state
      let currentTool = 'pen'; // 'pen' or 'eraser'
      let currentSize = 'medium'; // 'small', 'medium', 'large'
      let historyStack = []; // For undo/redo functionality
      let historyIndex = -1;
      const MAX_HISTORY = 50; // Limit history size
      
      // Size configurations (eraser sizes increased)
      const sizes = {
        small: { pen: 2, eraser: 15 },
        medium: { pen: 4, eraser: 30 },
        large: { pen: 6, eraser: 45 }
      };
      
      // Save state to history
      function saveToHistory() {
        // Remove any future states if we're not at the end
        if (historyIndex < historyStack.length - 1) {
          historyStack = historyStack.slice(0, historyIndex + 1);
        }
        
        // Save current canvas state
        const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
        historyStack.push(imageData);
        
        // Limit history size
        if (historyStack.length > MAX_HISTORY) {
          historyStack.shift();
        } else {
          historyIndex++;
        }
        
        // Update undo/redo button states
        updateUndoRedoButtons();
      }
      
      // Undo function
      function undo() {
        if (historyIndex > 0) {
          historyIndex--;
          const imageData = historyStack[historyIndex];
          ctx.putImageData(imageData, 0, 0);
          updateUndoRedoButtons();
        }
      }
      
      // Redo function
      function redo() {
        if (historyIndex < historyStack.length - 1) {
          historyIndex++;
          const imageData = historyStack[historyIndex];
          ctx.putImageData(imageData, 0, 0);
          updateUndoRedoButtons();
        }
      }
      
      // Update undo/redo button enabled states
      function updateUndoRedoButtons() {
        const undoBtn = document.getElementById('undoBtn');
        const redoBtn = document.getElementById('redoBtn');
        undoBtn.disabled = historyIndex <= 0;
        redoBtn.disabled = historyIndex >= historyStack.length - 1;
      }
      
      // Load initial image if provided
      function loadInitialImage(imageUri) {
        if (!imageUri) return;
        
        const img = new Image();
        img.onload = function() {
          // Draw the image on the canvas
          ctx.drawImage(img, 0, 0, canvas.width, canvas.height);
          // Save this state to history
          saveToHistory();
          updateUndoRedoButtons();
        };
        img.onerror = function() {
          console.error('Failed to load initial image');
          // Save blank state if image fails to load
          saveToHistory();
          updateUndoRedoButtons();
        };
        
        // Handle both file:// URIs and data URLs
        if (imageUri.startsWith('file://') || imageUri.startsWith('http://') || imageUri.startsWith('https://')) {
          // For file:// URIs, we need to convert to data URL via fetch
          // Since we're in WebView, we'll use a data URL approach
          // The parent component should convert file URI to data URL before passing
          img.src = imageUri;
        } else if (imageUri.startsWith('data:')) {
          // Direct data URL
          img.src = imageUri;
        } else {
          // Try as file URI
          img.src = imageUri;
        }
      }
      
      // Set canvas size to full viewport
      function resizeCanvas() {
        canvas.width = window.innerWidth;
        canvas.height = window.innerHeight;
        ctx.fillStyle = '${backgroundColor}';
        ctx.fillRect(0, 0, canvas.width, canvas.height);
        ctx.strokeStyle = '${penColor}';
        ctx.lineWidth = sizes[currentSize].pen;
        ctx.lineCap = 'round';
        ctx.lineJoin = 'round';
        
        // Save initial blank state (will be overwritten if image loads)
        saveToHistory();
        updateUndoRedoButtons();
      }
      
      // Function to load initial image (called from injected JavaScript)
      window.loadInitialImage = function(imageUri) {
        if (!imageUri || !imageUri.trim()) return;
        
        const img = new Image();
        img.onload = function() {
          // Draw the image on the canvas, scaling to fit
          ctx.drawImage(img, 0, 0, canvas.width, canvas.height);
          // Save this state to history
          saveToHistory();
          updateUndoRedoButtons();
        };
        img.onerror = function() {
          console.error('Failed to load initial image');
        };
        
        // Load the image (should be data URL at this point)
        img.src = imageUri;
      };
      
      resizeCanvas();
      window.addEventListener('resize', resizeCanvas);
      
      // Ensure pen is selected by default
      setTool('pen');
      
      // Set drawing tool (ensures at least one is always selected)
      function setTool(tool) {
        // Ensure tool is valid
        if (tool !== 'pen' && tool !== 'eraser') {
          tool = 'pen'; // Default to pen if invalid
        }
        
        currentTool = tool;
        const penBtn = document.getElementById('penBtn');
        const eraserBtn = document.getElementById('eraserBtn');
        
        if (tool === 'pen') {
          penBtn.classList.add('active');
          eraserBtn.classList.remove('active');
          ctx.globalCompositeOperation = 'source-over';
          ctx.strokeStyle = '${penColor}';
          ctx.lineWidth = sizes[currentSize].pen;
        } else {
          eraserBtn.classList.add('active');
          penBtn.classList.remove('active');
          ctx.globalCompositeOperation = 'destination-out';
          ctx.lineWidth = sizes[currentSize].eraser;
        }
      }
      
      // Set line size
      function setSize(size) {
        currentSize = size;
        const sizeBtns = ['sizeSmall', 'sizeMedium', 'sizeLarge'];
        sizeBtns.forEach(btnId => {
          const btn = document.getElementById(btnId);
          btn.classList.remove('active');
        });
        document.getElementById('size' + size.charAt(0).toUpperCase() + size.slice(1)).classList.add('active');
        
        if (currentTool === 'pen') {
          ctx.lineWidth = sizes[currentSize].pen;
        } else {
          ctx.lineWidth = sizes[currentSize].eraser;
        }
      }
      
      // Stylus-only detection - only allow pen pointer type
      function isStylusEvent(e) {
        // Check if it's a pointer event with pen type
        if (e.pointerType === 'pen') {
          return true;
        }
        // Check Android stylus detection via touch event properties
        if (e.touches && e.touches.length > 0) {
          const touch = e.touches[0];
          // Android stylus detection: check if it's a stylus tool
          // On Android, stylus events have specific properties
          if (touch.touchType === 'stylus' || touch.touchType === 'pen') {
            return true;
          }
        }
        return false;
      }
      
      // Get coordinates from event
      function getCoordinates(e) {
        if (e.touches && e.touches.length > 0) {
          const touch = e.touches[0];
          const rect = canvas.getBoundingClientRect();
          return {
            x: touch.clientX - rect.left,
            y: touch.clientY - rect.top,
            pressure: touch.force || 1.0
          };
        } else if (e.pointerType === 'pen') {
          const rect = canvas.getBoundingClientRect();
          return {
            x: e.clientX - rect.left,
            y: e.clientY - rect.top,
            pressure: e.pressure || 1.0
          };
        }
        return null;
      }
      
      // Start drawing
      function startDrawing(e) {
        // Only allow stylus input
        if (!isStylusEvent(e)) {
          e.preventDefault();
          e.stopPropagation();
          e.stopImmediatePropagation();
          return false;
        }
        
        const coords = getCoordinates(e);
        if (!coords) {
          e.preventDefault();
          return false;
        }
        
        // Save state before starting new stroke (only if not already drawing)
        if (!isDrawing) {
          saveToHistory();
        }
        
        isDrawing = true;
        lastX = coords.x;
        lastY = coords.y;
        
        // Adjust line width based on pressure (if available and tool is pen)
        if (currentTool === 'pen' && coords.pressure !== undefined && coords.pressure > 0) {
          ctx.lineWidth = sizes[currentSize].pen * (0.5 + coords.pressure * 0.5);
        } else if (currentTool === 'eraser' && coords.pressure !== undefined && coords.pressure > 0) {
          ctx.lineWidth = sizes[currentSize].eraser * (0.5 + coords.pressure * 0.5);
        }
        
        ctx.beginPath();
        ctx.moveTo(lastX, lastY);
        
        e.preventDefault();
        e.stopPropagation();
        return false;
      }
      
      // Draw
      function draw(e) {
        if (!isDrawing) return;
        
        // Only allow stylus input
        if (!isStylusEvent(e)) {
          e.preventDefault();
          e.stopPropagation();
          return false;
        }
        
        const coords = getCoordinates(e);
        if (!coords) {
          e.preventDefault();
          return false;
        }
        
        // Adjust line width based on pressure
        if (currentTool === 'pen' && coords.pressure !== undefined && coords.pressure > 0) {
          ctx.lineWidth = sizes[currentSize].pen * (0.5 + coords.pressure * 0.5);
        } else if (currentTool === 'eraser' && coords.pressure !== undefined && coords.pressure > 0) {
          ctx.lineWidth = sizes[currentSize].eraser * (0.5 + coords.pressure * 0.5);
        }
        
        ctx.lineTo(coords.x, coords.y);
        ctx.stroke();
        
        lastX = coords.x;
        lastY = coords.y;
        
        e.preventDefault();
        e.stopPropagation();
        return false;
      }
      
      // Stop drawing
      function stopDrawing(e) {
        if (!isDrawing) return;
        
        isDrawing = false;
        ctx.closePath();
        
        e.preventDefault();
        e.stopPropagation();
        return false;
      }
      
      // Block all non-stylus events
      function blockNonStylus(e) {
        if (!isStylusEvent(e)) {
          e.preventDefault();
          e.stopPropagation();
          e.stopImmediatePropagation();
          return false;
        }
      }
      
      // Pointer events (for stylus detection)
      canvas.addEventListener('pointerdown', startDrawing, { passive: false, capture: true });
      canvas.addEventListener('pointermove', draw, { passive: false, capture: true });
      canvas.addEventListener('pointerup', stopDrawing, { passive: false, capture: true });
      canvas.addEventListener('pointercancel', stopDrawing, { passive: false, capture: true });
      
      // Block touch events for fingers (unless stylus)
      canvas.addEventListener('touchstart', function(e) {
        if (!isStylusEvent(e)) {
          e.preventDefault();
          e.stopPropagation();
          e.stopImmediatePropagation();
          return false;
        }
        startDrawing(e);
      }, { passive: false, capture: true });
      
      canvas.addEventListener('touchmove', function(e) {
        if (!isStylusEvent(e)) {
          e.preventDefault();
          e.stopPropagation();
          e.stopImmediatePropagation();
          return false;
        }
        draw(e);
      }, { passive: false, capture: true });
      
      canvas.addEventListener('touchend', function(e) {
        if (!isStylusEvent(e)) {
          e.preventDefault();
          e.stopPropagation();
          e.stopImmediatePropagation();
          return false;
        }
        stopDrawing(e);
      }, { passive: false, capture: true });
      
      canvas.addEventListener('touchcancel', function(e) {
        if (!isStylusEvent(e)) {
          e.preventDefault();
          e.stopPropagation();
          e.stopImmediatePropagation();
          return false;
        }
        stopDrawing(e);
      }, { passive: false, capture: true });
      
      // Block mouse events completely
      canvas.addEventListener('mousedown', blockNonStylus, { passive: false, capture: true });
      canvas.addEventListener('mousemove', blockNonStylus, { passive: false, capture: true });
      canvas.addEventListener('mouseup', blockNonStylus, { passive: false, capture: true });
      canvas.addEventListener('click', blockNonStylus, { passive: false, capture: true });
      
      // Prevent context menu
      canvas.addEventListener('contextmenu', function(e) {
        e.preventDefault();
        return false;
      }, { passive: false });
      
      // Tool button handlers (ensure at least one is always selected)
      document.getElementById('penBtn').addEventListener('click', function() {
        // If clicking the already active tool, keep it active (don't deselect)
        if (currentTool !== 'pen') {
          setTool('pen');
        }
      });
      
      document.getElementById('eraserBtn').addEventListener('click', function() {
        // If clicking the already active tool, keep it active (don't deselect)
        if (currentTool !== 'eraser') {
          setTool('eraser');
        }
      });
      
      // Size button handlers
      document.getElementById('sizeSmall').addEventListener('click', function() {
        setSize('small');
      });
      
      document.getElementById('sizeMedium').addEventListener('click', function() {
        setSize('medium');
      });
      
      document.getElementById('sizeLarge').addEventListener('click', function() {
        setSize('large');
      });
      
      // Undo button handler
      document.getElementById('undoBtn').addEventListener('click', function() {
        undo();
      });
      
      // Redo button handler
      document.getElementById('redoBtn').addEventListener('click', function() {
        redo();
      });
      
      // Clear canvas
      document.getElementById('clearBtn').addEventListener('click', function() {
        if (confirm('Clear all drawings?')) {
          ctx.fillStyle = '${backgroundColor}';
          ctx.fillRect(0, 0, canvas.width, canvas.height);
          saveToHistory(); // This already calls updateUndoRedoButtons()
          window.ReactNativeWebView.postMessage(JSON.stringify({ type: 'clear' }));
        }
      });
      
      // Save canvas - ensure white background
      document.getElementById('saveBtn').addEventListener('click', function() {
        // Create a temporary canvas with white background
        const tempCanvas = document.createElement('canvas');
        tempCanvas.width = canvas.width;
        tempCanvas.height = canvas.height;
        const tempCtx = tempCanvas.getContext('2d');
        
        // Fill with white background
        tempCtx.fillStyle = '#FFFFFF';
        tempCtx.fillRect(0, 0, tempCanvas.width, tempCanvas.height);
        
        // Draw the original canvas on top
        tempCtx.drawImage(canvas, 0, 0);
        
        // Convert to data URL with white background
        const dataUrl = tempCanvas.toDataURL('image/png');
        window.ReactNativeWebView.postMessage(JSON.stringify({ 
          type: 'save', 
          dataUrl: dataUrl 
        }));
      });
      
      // Close canvas
      document.getElementById('closeBtn').addEventListener('click', function() {
        window.ReactNativeWebView.postMessage(JSON.stringify({ type: 'close' }));
      });
      
      // Prevent default touch behaviors
      document.addEventListener('touchstart', function(e) {
        if (e.target !== canvas && e.target !== document.getElementById('toolbar')) {
          return;
        }
      }, { passive: false });
      
      document.addEventListener('touchmove', function(e) {
        if (e.target !== canvas && e.target !== document.getElementById('toolbar')) {
          return;
        }
      }, { passive: false });
      
      // Notify that canvas is ready
      window.ReactNativeWebView.postMessage(JSON.stringify({ type: 'ready' }));
    })();
  </script>
</body>
</html>
  `;

  // Handle messages from WebView
  const handleMessage = (event: any) => {
    try {
      const message = JSON.parse(event.nativeEvent.data);
      
      switch (message.type) {
        case 'save':
          if (message.dataUrl) {
            onSave(message.dataUrl);
          }
          break;
        case 'clear':
          onClear();
          break;
        case 'close':
          onClose();
          break;
        case 'ready':
          // Canvas is ready
          break;
        default:
          break;
      }
    } catch (error) {
      console.error('Error handling WebView message:', error);
    }
  };

  // Convert file URI to data URL for WebView
  const [imageDataUrl, setImageDataUrl] = useState<string | undefined>(undefined);
  
  useEffect(() => {
    const loadImageAsDataUrl = async () => {
      if (!initialImage) {
        setImageDataUrl(undefined);
        return;
      }
      
      // If it's already a data URL, use it directly
      if (initialImage.startsWith('data:')) {
        setImageDataUrl(initialImage);
        return;
      }
      
      // If it's a file URI, convert to data URL
      try {
        if (initialImage.startsWith('file://') || (!initialImage.startsWith('http') && !initialImage.startsWith('https'))) {
          // Read file and convert to base64
          const base64 = await FileSystem.readAsStringAsync(initialImage, {
            encoding: 'base64',
          });
          // Convert to data URL
          const dataUrl = `data:image/png;base64,${base64}`;
          setImageDataUrl(dataUrl);
        } else {
          // HTTP/HTTPS URL - pass as-is, WebView can load it
          setImageDataUrl(initialImage);
        }
      } catch (error) {
        console.error('Error loading initial image:', error);
        setImageDataUrl(undefined);
      }
    };
    
    loadImageAsDataUrl();
  }, [initialImage]);

  // Inject additional stylus detection script for Android
  const injectedJavaScript = `
    (function() {
      // Additional Android stylus detection
      if (window.Android && window.Android.isStylusEvent) {
        // Use native Android stylus detection if available
        console.log('Android stylus detection available');
      }
      
      // Enhanced pointer event filtering for Android
      const canvas = document.getElementById('canvas');
      if (canvas) {
        canvas.addEventListener('pointerdown', function(e) {
          // On Android, check for stylus tool type
          if (e.pointerType !== 'pen' && e.pointerType !== 'stylus') {
            e.preventDefault();
            e.stopPropagation();
            e.stopImmediatePropagation();
            return false;
          }
        }, { passive: false, capture: true });
      }
    })();
    true;
  `;
  
  // Inject JavaScript to load initial image after WebView is ready
  useEffect(() => {
    if (imageDataUrl && webViewRef.current) {
      // Escape single quotes and newlines in the data URL for JavaScript injection
      const escapedDataUrl = imageDataUrl.replace(/'/g, "\\'").replace(/\n/g, '').replace(/\r/g, '');
      
      const loadImageScript = `
        (function() {
          setTimeout(function() {
            if (window.loadInitialImage && typeof window.loadInitialImage === 'function') {
              window.loadInitialImage('${escapedDataUrl}');
            }
          }, 300);
        })();
        true;
      `;
      
      // Inject the script after a delay to ensure canvas is ready
      const timeoutId = setTimeout(() => {
        if (webViewRef.current) {
          webViewRef.current.injectJavaScript(loadImageScript);
        }
      }, 600);
      
      return () => clearTimeout(timeoutId);
    }
  }, [imageDataUrl]);

  return (
    <View style={styles.container}>
      <WebView
        ref={webViewRef}
        source={{ html: htmlContent }}
        style={styles.webView}
        onMessage={handleMessage}
        injectedJavaScript={injectedJavaScript}
        javaScriptEnabled={true}
        domStorageEnabled={true}
        startInLoadingState={false}
        scalesPageToFit={true}
        showsHorizontalScrollIndicator={false}
        showsVerticalScrollIndicator={false}
        scrollEnabled={false}
        bounces={false}
        overScrollMode="never"
        androidLayerType="hardware"
        // Block non-stylus touches at WebView level
        onShouldStartLoadWithRequest={() => true}
        allowFileAccess={true}
        allowUniversalAccessFromFileURLs={true}
        mixedContentMode="always"
      />
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    width: '100%',
    height: '100%',
  },
  webView: {
    flex: 1,
    backgroundColor: 'transparent',
  },
});

export default StylusCanvas;

