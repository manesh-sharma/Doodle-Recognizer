# Doodle Recognizer — Setup

## 1. Clone the Repository

```powershell
git clone https://github.com/manesh-sharma/Doodle-Recognizer.git
cd Doodle-Recognizer
```

## 2. Create Python Virtual Environment

```powershell
python -m venv venv
```

## 3. Activate Virtual Environment

```powershell
.\venv\Scripts\Activate.ps1
```

## 4. Upgrade pip

```powershell
python -m pip install --upgrade pip
```

## 5. Install Python Dependencies

```powershell
python -m pip install -r requirements.txt
```

## 6. Install Node.js Dependencies

```powershell
npm install
```

## 7. Start the FastAPI Backend

```powershell
python -m uvicorn backend.app:app --host 127.0.0.1 --port 8000
```

Backend:

```text
http://127.0.0.1:8000
```

## 8. Start the Frontend

Open another terminal in the project directory:

```powershell
npm start
```

If the project uses a different script, check `package.json`:

```powershell
npm run
```

## 9. Test Backend

```powershell
curl http://127.0.0.1:8000/
```

Expected:

```json
{
  "message": "Doodle Recognizer API is running"
}
```

## Complete Setup

```powershell
git clone https://github.com/manesh-sharma/Doodle-Recognizer.git
cd Doodle-Recognizer

python -m venv venv
.\venv\Scripts\Activate.ps1

python -m pip install --upgrade pip
python -m pip install -r requirements.txt

npm install

python -m uvicorn backend.app:app --host 127.0.0.1 --port 8000
```
