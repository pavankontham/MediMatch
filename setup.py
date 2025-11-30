#!/usr/bin/env python3
"""
MediMatch Setup Script
Run this script to set up the development environment
"""

import os
import sys
import subprocess
import shutil
from pathlib import Path

def print_header(text):
    """Print formatted header"""
    print("\n" + "=" * 60)
    print(f"  {text}")
    print("=" * 60 + "\n")

def check_python_version():
    """Check if Python version is 3.8 or higher"""
    print_header("Checking Python Version")
    version = sys.version_info
    print(f"Python version: {version.major}.{version.minor}.{version.micro}")
    
    if version.major < 3 or (version.major == 3 and version.minor < 8):
        print("❌ Error: Python 3.8 or higher is required!")
        return False
    
    print("✅ Python version is compatible")
    return True

def check_pip():
    """Check if pip is installed"""
    print_header("Checking pip")
    try:
        result = subprocess.run([sys.executable, "-m", "pip", "--version"], 
                              capture_output=True, text=True, check=True)
        print(f"✅ pip is installed: {result.stdout.strip()}")
        return True
    except subprocess.CalledProcessError:
        print("❌ pip is not installed!")
        return False

def create_virtual_environment():
    """Create virtual environment"""
    print_header("Creating Virtual Environment")
    
    venv_path = Path("venv")
    if venv_path.exists():
        print("⚠️  Virtual environment already exists")
        response = input("Do you want to recreate it? (y/N): ").lower()
        if response == 'y':
            print("Removing old virtual environment...")
            shutil.rmtree(venv_path)
        else:
            print("Using existing virtual environment")
            return True
    
    try:
        print("Creating virtual environment...")
        subprocess.run([sys.executable, "-m", "venv", "venv"], check=True)
        print("✅ Virtual environment created successfully")
        return True
    except subprocess.CalledProcessError as e:
        print(f"❌ Failed to create virtual environment: {e}")
        return False

def get_venv_python():
    """Get path to virtual environment Python"""
    if sys.platform == "win32":
        return Path("venv/Scripts/python.exe")
    else:
        return Path("venv/bin/python")

def install_dependencies():
    """Install Python dependencies"""
    print_header("Installing Dependencies")
    
    venv_python = get_venv_python()
    
    if not venv_python.exists():
        print("❌ Virtual environment Python not found!")
        return False
    
    try:
        print("Upgrading pip...")
        subprocess.run([str(venv_python), "-m", "pip", "install", "--upgrade", "pip"], 
                      check=True)
        
        print("\nInstalling requirements...")
        subprocess.run([str(venv_python), "-m", "pip", "install", "-r", "requirements.txt"], 
                      check=True)
        
        print("\nInstalling spaCy medical model...")
        subprocess.run([str(venv_python), "-m", "pip", "install", 
                       "https://s3-us-west-2.amazonaws.com/ai2-s2-scispacy/releases/v0.5.3/en_core_sci_sm-0.5.3.tar.gz"],
                      check=True)
        
        print("✅ All dependencies installed successfully")
        return True
    except subprocess.CalledProcessError as e:
        print(f"❌ Failed to install dependencies: {e}")
        return False

def setup_environment():
    """Set up environment variables"""
    print_header("Setting Up Environment Variables")
    
    env_file = Path(".env")
    env_example = Path(".env.example")
    
    if env_file.exists():
        print("⚠️  .env file already exists")
        response = input("Do you want to overwrite it? (y/N): ").lower()
        if response != 'y':
            print("Keeping existing .env file")
            return True
    
    if not env_example.exists():
        print("❌ .env.example file not found!")
        return False
    
    try:
        shutil.copy(env_example, env_file)
        print("✅ Created .env file from template")
        print("\n⚠️  IMPORTANT: Edit .env and add your API keys!")
        print("   - GROQ_API_KEY")
        print("   - SERPER_API_KEY")
        print("   - GEMINI_API_KEY")
        return True
    except Exception as e:
        print(f"❌ Failed to create .env file: {e}")
        return False

def create_directories():
    """Create necessary directories"""
    print_header("Creating Directories")
    
    directories = [
        "data",
        "static/uploads",
        "static/uploads/prescriptions",
        "static/processed",
    ]
    
    for directory in directories:
        path = Path(directory)
        path.mkdir(parents=True, exist_ok=True)
        print(f"✅ Created: {directory}")
    
    return True

def print_next_steps():
    """Print next steps for the user"""
    print_header("Setup Complete! 🎉")
    
    print("Next steps:")
    print("\n1. Activate virtual environment:")
    if sys.platform == "win32":
        print("   venv\\Scripts\\activate")
    else:
        print("   source venv/bin/activate")
    
    print("\n2. Edit .env file and add your API keys:")
    print("   - Get Groq API key from: https://console.groq.com/")
    print("   - Get Serper API key from: https://serper.dev/")
    print("   - Get Gemini API key from: https://makersuite.google.com/app/apikey")
    
    print("\n3. (Optional) Add your drug dataset:")
    print("   - Place cleaned_clinical_drugs_dataset.csv in data/ folder")
    print("   - Or the app will use external APIs")
    
    print("\n4. Run the application:")
    print("   python app.py")
    
    print("\n5. Open in browser:")
    print("   http://localhost:5000")
    
    print("\n" + "=" * 60)
    print("Need help? Check README.md or open an issue on GitHub")
    print("=" * 60 + "\n")

def main():
    """Main setup function"""
    print("""
    ╔═══════════════════════════════════════════════════════╗
    ║                                                       ║
    ║         MediMatch Setup Script                        ║
    ║         AI-Powered Drug Discovery Platform            ║
    ║                                                       ║
    ╚═══════════════════════════════════════════════════════╝
    """)
    
    # Run setup steps
    steps = [
        ("Python Version Check", check_python_version),
        ("pip Check", check_pip),
        ("Virtual Environment", create_virtual_environment),
        ("Dependencies", install_dependencies),
        ("Environment Variables", setup_environment),
        ("Directories", create_directories),
    ]
    
    for step_name, step_func in steps:
        if not step_func():
            print(f"\n❌ Setup failed at: {step_name}")
            print("Please fix the errors above and run setup again.")
            return False
    
    # Print next steps
    print_next_steps()
    return True

if __name__ == "__main__":
    try:
        success = main()
        sys.exit(0 if success else 1)
    except KeyboardInterrupt:
        print("\n\n⚠️  Setup interrupted by user")
        sys.exit(1)
    except Exception as e:
        print(f"\n❌ Unexpected error: {e}")
        sys.exit(1)
