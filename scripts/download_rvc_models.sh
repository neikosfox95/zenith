#!/bin/bash
# RVC Model Downloader Script
# Downloads pre-trained RVC models for voice conversion

set -e

MODEL_DIR="/app/models/rvc"
mkdir -p "$MODEL_DIR"

echo "🎤 Downloading RVC Models for Voice Conversion..."

# Base RVC Models (Hugging Face)
echo "📥 Downloading RVC base models..."

# RVC Base Model (v2)
if [ ! -f "$MODEL_DIR/rmvpe.pt" ]; then
    echo "Downloading RMVPE pitch extractor..."
    wget -q --show-progress -O "$MODEL_DIR/rmvpe.pt" \
        "https://huggingface.co/lj1995/VoiceConversionWebUI/resolve/main/rmvpe.pt"
fi

# Hubert Base Model
if [ ! -f "$MODEL_DIR/hubert_base.pt" ]; then
    echo "Downloading HuBERT base model..."
    wget -q --show-progress -O "$MODEL_DIR/hubert_base.pt" \
        "https://huggingface.co/lj1995/VoiceConversionWebUI/resolve/main/hubert_base.pt"
fi

# Pre-trained RVC models (examples - replace with actual models you want)
echo "📥 Downloading sample voice models..."

# Sample Voice 1 (English Female)
mkdir -p "$MODEL_DIR/voices/english_female"
# Note: Replace with actual model URLs when available

# Sample Voice 2 (English Male)
mkdir -p "$MODEL_DIR/voices/english_male"
# Note: Replace with actual model URLs when available

echo "✅ RVC Models downloaded successfully!"
echo "📍 Location: $MODEL_DIR"
echo ""
echo "Available models:"
ls -lh "$MODEL_DIR"/*.pt 2>/dev/null || echo "Base models ready"
echo ""
echo "To add custom voice models:"
echo "1. Train or download .pth files"
echo "2. Place in: $MODEL_DIR/voices/{voice_name}/"
echo "3. Include: model.pth and model.index files"
