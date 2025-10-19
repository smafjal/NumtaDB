# Bengali Digit Classifier

Bengali digit recognition using deep learning. Draw a digit and watch the AI classify it with 98.5% accuracy!

### 🔗 **Live Demo:** https://smafjal.github.io/NumtaDB/
### 🔗 **Kitchen Room:** https://github.com/smafjal/numtadb-exp


## Features

✨ **Draw Bengali digits** (০-৯) on canvas with mouse or touch  
🤖 **Real-time AI predictions** - 50-200ms inference time  
📊 **Confidence scores** for all 10 digit classes  
📱 **Mobile-friendly** responsive design  
🚀 **100% client-side** - runs entirely in your browser  
🔒 **Privacy-first** - no data sent to servers  

## Technology Stack

- **Model:** MobileNetV2 (ONNX format, 11 MB)
- **Accuracy:** 98.5%
- **Framework:** ONNX Runtime Web
- **Dataset:** NumtaDB (Bengali handwritten digits)
- **Backend:** None - pure client-side inference!

## How It Works

1. **Draw** a Bengali digit on the canvas
2. **Click** "Classify Digit" button
3. **Watch** AI predict with confidence scores
4. **See** probability distribution for all digits

## Local Development

```bash
# Clone the repository
git clone https://github.com/smafjal/NumtaDB.git
cd NumtaDB

# Start local server
python3 -m http.server 8000

# Open http://localhost:8000
```

## Model Details

- **Input:** 224×224 RGB images
- **Output:** 10 classes (০-৯)
- **Architecture:** MobileNetV2
- **Size:** ~11 MB
- **Training:** PyTorch → ONNX conversion

## About

This project demonstrates browser-based machine learning inference using ONNX Runtime Web. The entire neural network runs client-side with no backend infrastructure required.

**Features:**
- Zero server costs
- Complete privacy
- Offline-capable (after first load)
- Fast predictions
- Scalable to unlimited users

---

Made with ❤️ for Bengali language technology

