"""
Download EasyOCR models before starting the server
"""

print("📥 Downloading EasyOCR models...")
print("This is a one-time setup and may take 2-5 minutes...")
print()

try:
    import easyocr
    print("✅ EasyOCR package installed")
    
    print("📥 Initializing EasyOCR reader (this will download models)...")
    reader = easyocr.Reader(['en'], gpu=False, verbose=True, download_enabled=True)
    
    print()
    print("✅ EasyOCR models downloaded successfully!")
    print("✅ Testing OCR...")
    
    # Test with a simple image
    test_result = reader.readtext('https://via.placeholder.com/300x100.png?text=Test', detail=0)
    
    print("✅ EasyOCR is working!")
    print()
    print("🎉 Setup complete! You can now run: python app.py")
    
except ImportError:
    print("❌ EasyOCR not installed!")
    print("Please run: pip install easyocr")
except Exception as e:
    print(f"⚠️  Warning: {e}")
    print("EasyOCR may still work when you process your first prescription.")
