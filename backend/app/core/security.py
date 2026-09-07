from fastapi import Security, HTTPException, status
from fastapi.security import HTTPBearer, HTTPAuthorizationCredentials
import firebase_admin
from firebase_admin import credentials, auth
import os

# Initialize Firebase Admin
cred_path = os.getenv("FIREBASE_CREDENTIALS", "firebase-service-account.json")

# Try to initialize but do not crash immediately if missing (allow server to start for Phase3 testing, but requests will fail)
try:
    if not firebase_admin._apps:
        cred = credentials.Certificate(cred_path)
        firebase_admin.initialize_app(cred)
except Exception as e:
    print(f"WARNING: Firebase Admin not initialized correctly. {e}")
    print("Ensure you place the firebase-service-account.json in the backend directory.")

security = HTTPBearer()

def verify_token(credentials: HTTPAuthorizationCredentials = Security(security)):
    token = credentials.credentials
    try:
        decoded_token = auth.verify_id_token(token)
        return decoded_token
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail=f"Invalid authentication credentials: {e}",
            headers={"WWW-Authenticate": "Bearer"},
        )
